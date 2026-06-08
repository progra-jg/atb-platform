package main

import (
	"log"
	"os"

	"github.com/atb/agri-trace/traceability/handlers"
	"github.com/atb/agri-trace/traceability/middleware"
	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

func main() {
	r := gin.Default()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://atb:atb_dev_2024@localhost:5432/atb_agritrace?sslmode=disable"
	}

	conn, err := pq.NewConnector(dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer conn.Close()

	h := handlers.NewHandler(conn)

	r.Use(middleware.CORS())
	api := r.Group("/api")
	api.Use(middleware.JWTAuth())
	{
		api.POST("/lots", h.CreateLot)
		api.GET("/lots/:id", h.GetLot)
		api.PATCH("/lots/:id/status", h.UpdateLotStatus)
		api.POST("/transfer", h.CreateTransfer)
		api.GET("/transfers/:lotId", h.GetTransfers)
		api.POST("/scan", h.ScanQR)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Traceability service starting on :%s", port)
	r.Run(":" + port)
}
