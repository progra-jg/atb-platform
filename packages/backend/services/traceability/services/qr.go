package services

import (
	"encoding/base64"

	qrcode "github.com/skip2/go-qrcode"
)

type QRService struct{}

func NewQRService() *QRService {
	return &QRService{}
}

func (s *QRService) GenerateQR(data string) (string, error) {
	qr, err := qrcode.Encode(data, qrcode.Medium, 256)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(qr), nil
}
