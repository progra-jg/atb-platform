package models

import "time"

type Lot struct {
	ID           string    `json:"id"`
	Hash         string    `json:"hash"`
	Owner        string    `json:"owner"`
	Culture      string    `json:"culture"`
	Quantite     float64   `json:"quantite"`
	Certificats  []string  `json:"certificats,omitempty"`
	ParentLotID  string    `json:"parent_lot_id,omitempty"`
	Status       string    `json:"status"`
	ParcelleID   string    `json:"parcelle_id"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Transfer struct {
	ID        string    `json:"id"`
	LotID     string    `json:"lot_id"`
	From      string    `json:"from"`
	To        string    `json:"to"`
	Signature string    `json:"signature"`
	Location  string    `json:"location,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}
