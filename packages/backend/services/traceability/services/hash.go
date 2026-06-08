package services

import (
	"crypto/sha256"
	"fmt"

	"github.com/atb/agri-trace/traceability/models"
)

type HashService struct{}

func NewHashService() *HashService {
	return &HashService{}
}

func (s *HashService) GenerateHash(lot models.Lot) string {
	data := fmt.Sprintf("%s:%s:%s:%f:%s", lot.Owner, lot.Culture, lot.ParcelleID, lot.Quantite, lot.ParentLotID)
	hash := sha256.Sum256([]byte(data))
	return fmt.Sprintf("%x", hash)
}
