package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RequireOnChain() gin.HandlerFunc {
	return func(c *gin.Context) {
		hash := c.Query("hash")
		if hash == "" {
			hash = c.PostForm("hash")
		}
		if hash == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Hash parameter required"})
			c.Abort()
			return
		}

		// In production: verify hash exists on Hyperledger Besu
		// This would call the blockchain client to check
		// if the hash is registered in LotRegistry contract

		c.Set("verified_hash", hash)
		c.Next()
	}
}
