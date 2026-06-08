package handlers

import (
	"net/http"

	"github.com/atb/agri-trace/traceability/models"
	"github.com/atb/agri-trace/traceability/services"
	"github.com/gin-gonic/gin"
	"lib/pq"
)

type Handler struct {
	DB      *pq.Connector
	QRGen   *services.QRService
	HashSvc *services.HashService
}

func NewHandler(conn *pq.Connector) *Handler {
	return &Handler{
		DB:      conn,
		QRGen:   services.NewQRService(),
		HashSvc: services.NewHashService(),
	}
}

func (h *Handler) CreateLot(c *gin.Context) {
	var lot models.Lot
	if err := c.ShouldBindJSON(&lot); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	lot.Hash = h.HashSvc.GenerateHash(lot)
	lot.Status = "created"

	// Store in database
	_, err := h.DB.DB.Exec(
		`INSERT INTO lots (hash, owner, culture, quantite, status, parcelle_id)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		lot.Hash, lot.Owner, lot.Culture, lot.Quantite, lot.Status, lot.ParcelleID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create lot"})
		return
	}

	qrCode, _ := h.QRGen.GenerateQR(lot.Hash)
	c.JSON(http.StatusCreated, gin.H{
		"lot":      lot,
		"qr_code":  qrCode,
		"hash":     lot.Hash,
	})
}

func (h *Handler) GetLot(c *gin.Context) {
	id := c.Param("id")
	row := h.DB.DB.QueryRow(
		`SELECT id, hash, owner, culture, quantite, status, parcelle_id, created_at
		 FROM lots WHERE id = $1`, id,
	)

	var lot models.Lot
	err := row.Scan(&lot.ID, &lot.Hash, &lot.Owner, &lot.Culture,
		&lot.Quantite, &lot.Status, &lot.ParcelleID, &lot.CreatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lot not found"})
		return
	}
	c.JSON(http.StatusOK, lot)
}

func (h *Handler) UpdateLotStatus(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := h.DB.DB.Exec(
		`UPDATE lots SET status = $1, updated_at = NOW() WHERE id = $2`,
		body.Status, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Status updated", "status": body.Status})
}
