package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"movie-booking-system/models"

	"github.com/gin-gonic/gin"
)

type BookingMiddleware struct {
	db *sql.DB
}

func NewBookingMiddleware(db *sql.DB) *BookingMiddleware {
	return &BookingMiddleware{db: db}
}

// ตรวจสอบว่า user เป็นเจ้าของการจองหรือ admin
func (bm *BookingMiddleware) BookingOwnerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		bookingIDStr := c.Param("id")
		bookingID, err := strconv.Atoi(bookingIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				Success: false,
				Error:   "Invalid booking ID",
			})
			c.Abort()
			return
		}

		userID := c.GetInt("user_id")
		role := c.GetString("role")

		// Admin สามารถเข้าถึงได้ทั้งหมด
		if role == "admin" {
			c.Next()
			return
		}

		// ตรวจสอบว่า user เป็นเจ้าของการจองหรือไม่
		var bookingUserID int
		query := "SELECT user_id FROM bookings WHERE booking_id = $1"
		err = bm.db.QueryRow(query, bookingID).Scan(&bookingUserID)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				Success: false,
				Error:   "Booking not found",
			})
			c.Abort()
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				Success: false,
				Error:   "Failed to verify booking ownership",
			})
			c.Abort()
			return
		}

		if userID != bookingUserID {
			c.JSON(http.StatusForbidden, models.ErrorResponse{
				Success: false,
				Error:   "You do not have permission to access this booking",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// ตรวจสอบสถานะการจอง
func (bm *BookingMiddleware) BookingStatusValidationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		bookingIDStr := c.Param("id")
		bookingID, err := strconv.Atoi(bookingIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				Success: false,
				Error:   "Invalid booking ID",
			})
			c.Abort()
			return
		}

		// ดึงสถานะของการจอง
		var status string
		query := "SELECT booking_status FROM bookings WHERE booking_id = $1"
		err = bm.db.QueryRow(query, bookingID).Scan(&status)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				Success: false,
				Error:   "Booking not found",
			})
			c.Abort()
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				Success: false,
				Error:   "Failed to verify booking status",
			})
			c.Abort()
			return
		}

		c.Set("booking_status", status)
		c.Set("booking_id", bookingID)
		c.Next()
	}
}

// ตรวจสอบว่าการจองมีอยู่หรือไม่
func (bm *BookingMiddleware) BookingExistsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		bookingIDStr := c.Param("id")
		bookingID, err := strconv.Atoi(bookingIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				Success: false,
				Error:   "Invalid booking ID",
			})
			c.Abort()
			return
		}

		// ตรวจสอบว่าการจองมีอยู่
		var exists bool
		query := "SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_id = $1)"
		err = bm.db.QueryRow(query, bookingID).Scan(&exists)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				Success: false,
				Error:   "Failed to verify booking",
			})
			c.Abort()
			return
		}

		if !exists {
			c.JSON(http.StatusNotFound, models.ErrorResponse{
				Success: false,
				Error:   "Booking not found",
			})
			c.Abort()
			return
		}

		c.Set("booking_id", bookingID)
		c.Next()
	}
}
