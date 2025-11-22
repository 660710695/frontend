package handlers

import (
	"net/http"
	"os"
	"strings"

	"movie-booking-system/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

// AuthMiddleware ตรวจสอบ JWT token
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, models.ErrorResponse{
				Success: false,
				Error:   "Missing authorization header",
			})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, models.ErrorResponse{
				Success: false,
				Error:   "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]
		secretKey := os.Getenv("JWT_SECRET")
		if secretKey == "" {
			secretKey = "your-secret-key-change-in-production"
		}

		token, err := jwt.ParseWithClaims(tokenString, &jwt.MapClaims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(secretKey), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, models.ErrorResponse{
				Success: false,
				Error:   "Invalid or expired token",
			})
			c.Abort()
			return
		}

		claims := token.Claims.(*jwt.MapClaims)
		userID := int((*claims)["user_id"].(float64))
		role := (*claims)["role"].(string)

		c.Set("user_id", userID)
		c.Set("role", role)

		c.Next()
	}
}

// AdminMiddleware ตรวจสอบว่า user เป็น admin หรือไม่
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("role")
		if role != "admin" {
			c.JSON(http.StatusForbidden, models.ErrorResponse{
				Success: false,
				Error:   "Admin access required",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
