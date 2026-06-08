package handlers

import (
	"net/http"

	"github.com/atb/agri-trace/traceability/models"
	"github.com/gin-gonic/gin"
)

func (h *Handler) CreateTransfer(c *gin.Context) {
	var transfer models.Transfer
	if err := c.ShouldBindJSON(&transfer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if transfer.Signature == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Signature is required"})
		return
	}

	_, err := h.DB.DB.Exec(
		`INSERT INTO transfers (lot_id, "from", "to", signature, location, timestamp)
		 VALUES ($1, $2, $3, $4, $5, NOW())`,
		transfer.LotID, transfer.From, transfer.To, transfer.Signature, transfer.Location,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transfer failed"})
		return
	}

	// Update lot owner
	h.DB.DB.Exec(`UPDATE lots SET owner = $1 WHERE id = $2`, transfer.To, transfer.LotID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Transfer successful",
		"lot_id":  transfer.LotID,
		"to":      transfer.To,
	})
}

func (h *Handler) GetTransfers(c *gin.Context) {
	lotID := c.Param("lotId")
	rows, err := h.DB.DB.Query(
		`SELECT id, lot_id, "from", "to", signature, location, timestamp
		 FROM transfers WHERE lot_id = $1 ORDER BY timestamp DESC`, lotID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Query failed"})
		return
	}
	defer rows.Close()

	var transfers []models.Transfer
	for rows.Next() {
		var t models.Transfer
		rows.Scan(&t.ID, &t.LotID, &t.From, &t.To, &t.Signature, &t.Location, &t.Timestamp)
		transfers = append(transfers, t)
	}
	c.JSON(http.StatusOK, transfers)
}
