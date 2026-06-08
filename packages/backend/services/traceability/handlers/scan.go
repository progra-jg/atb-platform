package handlers

import (
	"net/http"

	"github.com/atb/agri-trace/traceability/models"
	"github.com/gin-gonic/gin"
)

func (h *Handler) ScanQR(c *gin.Context) {
	var req struct {
		QRData string `json:"qr_data" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "QR data required"})
		return
	}

	// Look up lot by hash
	row := h.DB.DB.QueryRow(
		`SELECT id, hash, owner, culture, quantite, status, created_at
		 FROM lots WHERE hash = $1`, req.QRData,
	)

	var lot models.Lot
	err := row.Scan(&lot.ID, &lot.Hash, &lot.Owner, &lot.Culture,
		&lot.Quantite, &lot.Status, &lot.CreatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lot not found for this QR code"})
		return
	}

	// Verify hash integrity
	expectedHash := h.HashSvc.GenerateHash(lot)
	hashValid := expectedHash == lot.Hash

	c.JSON(http.StatusOK, gin.H{
		"lot":        lot,
		"hash_valid": hashValid,
		"on_chain":   false, // Would check blockchain in production
	})
}
