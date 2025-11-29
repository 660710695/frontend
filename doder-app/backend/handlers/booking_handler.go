package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"movie-booking-system/models"

	"github.com/gin-gonic/gin"
)

type BookingHandler struct {
	db *sql.DB
}

func NewBookingHandler(db *sql.DB) *BookingHandler {
	return &BookingHandler{db: db}
}

// CreateBooking สร้างการจองตั๋วใหม่
// POST /api/bookings
func (h *BookingHandler) CreateBooking(c *gin.Context) {
	var req models.CreateBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// ตรวจสอบ showtime
	var price float64
	var availableSeats int
	query := "SELECT price, available_seats FROM showtimes WHERE showtime_id = $1 AND is_active = TRUE"
	err := h.db.QueryRow(query, req.ShowtimeID).Scan(&price, &availableSeats)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Showtime not found",
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch showtime",
		})
		return
	}

	// ตรวจสอบจำนวนที่นั่งว่างพอหรือไม่
	if len(req.SeatIDs) > availableSeats {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Not enough available seats",
		})
		return
	}

	// ตรวจสอบว่าผู้ใช้จองที่นั่งเดียวกันซ้ำหลังจากคอนเฟิร์มแล้วหรือไม่
	userID := c.GetInt("user_id")
	for _, seatID := range req.SeatIDs {
		var confirmedCount int
		confirmedQuery := `
			SELECT COUNT(*) FROM booking_seats bs
			JOIN bookings b ON bs.booking_id = b.booking_id
			WHERE b.user_id = $1 AND b.showtime_id = $2 AND bs.seat_id = $3 AND b.booking_status = 'confirmed'
		`
		err := h.db.QueryRow(confirmedQuery, userID, req.ShowtimeID, seatID).Scan(&confirmedCount)
		if err == nil && confirmedCount > 0 {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				Success: false,
				Error:   fmt.Sprintf("You have already confirmed booking for seat %d in this showtime", seatID),
			})
			return
		}
	}

	// สร้าง booking code
	bookingCode := fmt.Sprintf("BK%d%d", 1, time.Now().Unix())

	// เริ่มต้น transaction
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to start transaction",
		})
		return
	}
	defer tx.Rollback()

	// สร้าง booking
	totalAmount := price * float64(len(req.SeatIDs))
	var bookingID int
	bookingQuery := `
		INSERT INTO bookings (user_id, showtime_id, total_amount, booking_code, booking_status, payment_status)
		VALUES ($1, $2, $3, $4, 'pending', 'pending')
		RETURNING booking_id
	`
	err = tx.QueryRow(bookingQuery, userID, req.ShowtimeID, totalAmount, bookingCode).Scan(&bookingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to create booking",
		})
		return
	}

	// เพิ่ม booking seats
	for _, seatID := range req.SeatIDs {
		// ตรวจสอบว่าที่นั่งถูกจองและยืนยันแล้วหรือไม่ (confirmed booking)
		var confirmedBookingCount int
		confirmedSeatQuery := `
			SELECT COUNT(*) FROM booking_seats bs
			JOIN bookings b ON bs.booking_id = b.booking_id
			WHERE b.showtime_id = $1 AND bs.seat_id = $2 AND b.booking_status = 'confirmed'
		`
		err := tx.QueryRow(confirmedSeatQuery, req.ShowtimeID, seatID).Scan(&confirmedBookingCount)
		if err == nil && confirmedBookingCount > 0 {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				Success: false,
				Error:   fmt.Sprintf("Seat %d has already been booked and confirmed", seatID),
			})
			return
		}

		// ตรวจสอบว่าที่นั่งว่างหรือไม่ (seat_status)
		var status string
		seatStatusQuery := "SELECT status FROM seat_status WHERE showtime_id = $1 AND seat_id = $2"
		err = tx.QueryRow(seatStatusQuery, req.ShowtimeID, seatID).Scan(&status)
		if err == nil && status == "booked" {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				Success: false,
				Error:   fmt.Sprintf("Seat %d is already booked", seatID),
			})
			return
		}

		// เพิ่ม booking seat
		bookingSeatQuery := `
			INSERT INTO booking_seats (booking_id, seat_id, price)
			VALUES ($1, $2, $3)
		`
		_, err = tx.Exec(bookingSeatQuery, bookingID, seatID, price)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				Success: false,
				Error:   "Failed to add seat to booking",
			})
			return
		}

		// อัปเดต seat status เป็น reserved
		updateSeatStatusQuery := `
			UPDATE seat_status 
			SET status = 'reserved', booking_id = $1, reserved_until = $2
			WHERE showtime_id = $3 AND seat_id = $4
		`
		_, err = tx.Exec(updateSeatStatusQuery, bookingID, time.Now().Add(15*time.Minute), req.ShowtimeID, seatID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				Success: false,
				Error:   "Failed to update seat status",
			})
			return
		}
	}

	// ลดจำนวน available seats
	updateShowtimeQuery := "UPDATE showtimes SET available_seats = available_seats - $1 WHERE showtime_id = $2"
	_, err = tx.Exec(updateShowtimeQuery, len(req.SeatIDs), req.ShowtimeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to update available seats",
		})
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to commit transaction",
		})
		return
	}

	c.JSON(http.StatusCreated, models.Response{
		Success: true,
		Message: "Booking created successfully",
		Data: gin.H{
			"booking_id":   bookingID,
			"booking_code": bookingCode,
			"total_amount": totalAmount,
		},
	})
}

// GetBooking ดึงข้อมูลการจองตาม ID
// GET /api/bookings/:id
func (h *BookingHandler) GetBooking(c *gin.Context) {
	bookingID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid booking ID",
		})
		return
	}

	query := `
		SELECT 
			b.booking_id, b.booking_code, b.user_id, b.showtime_id,
			m.title, c.cinema_name, t.theater_name, 
			s.show_date, s.show_time, 
			b.total_amount, b.booking_status, b.payment_status, b.booking_date
		FROM bookings b
		JOIN showtimes s ON b.showtime_id = s.showtime_id
		JOIN movies m ON s.movie_id = m.movie_id
		JOIN theaters t ON s.theater_id = t.theater_id
		JOIN cinemas c ON t.cinema_id = c.cinema_id
		WHERE b.booking_id = $1
	`

	var booking models.Booking
	var movieTitle, cinemaName, theaterName string
	var showDate, showTime sql.NullTime
	err = h.db.QueryRow(query, bookingID).Scan(
		&booking.BookingID, &booking.BookingCode, &booking.UserID, &booking.ShowtimeID,
		&movieTitle, &cinemaName, &theaterName,
		&showDate, &showTime,
		&booking.TotalAmount, &booking.BookingStatus, &booking.PaymentStatus, &booking.BookingDate,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Booking not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch booking",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data: gin.H{
			"booking_id":     booking.BookingID,
			"booking_code":   booking.BookingCode,
			"user_id":        booking.UserID,
			"showtime_id":    booking.ShowtimeID,
			"movie_title":    movieTitle,
			"cinema_name":    cinemaName,
			"theater_name":   theaterName,
			"show_date":      showDate,
			"show_time":      showTime,
			"total_amount":   booking.TotalAmount,
			"booking_status": booking.BookingStatus,
			"payment_status": booking.PaymentStatus,
			"booking_date":   booking.BookingDate,
		},
	})
}

// CancelBooking ยกเลิกการจอง
// DELETE /api/bookings/:id
func (h *BookingHandler) CancelBooking(c *gin.Context) {
	bookingID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid booking ID",
		})
		return
	}

	// ตรวจสอบ status ว่าสามารถยกเลิกได้หรือไม่
	var bookingStatus string
	query := "SELECT booking_status FROM bookings WHERE booking_id = $1"
	err = h.db.QueryRow(query, bookingID).Scan(&bookingStatus)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Booking not found",
		})
		return
	}

	if bookingStatus == "cancelled" || bookingStatus == "confirmed" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Cannot cancel this booking",
		})
		return
	}

	// เริ่มต้น transaction
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to start transaction",
		})
		return
	}
	defer tx.Rollback()

	// อัปเดต booking status
	updateQuery := "UPDATE bookings SET booking_status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE booking_id = $1"
	_, err = tx.Exec(updateQuery, bookingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to cancel booking",
		})
		return
	}

	// ดึงข้อมูลที่นั่งและ showtime
	seatsQuery := `
		SELECT bs.seat_id, b.showtime_id FROM booking_seats bs
		JOIN bookings b ON bs.booking_id = b.booking_id
		WHERE bs.booking_id = $1
	`
	rows, err := tx.Query(seatsQuery, bookingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch seats",
		})
		return
	}
	defer rows.Close()

	var showtimeID int
	var seatCount int
	seats := []int{}
	for rows.Next() {
		var seatID int
		rows.Scan(&seatID, &showtimeID)
		seats = append(seats, seatID)
		seatCount++
	}

	// อัปเดต seat status กลับเป็น available
	for _, seatID := range seats {
		updateSeatQuery := `
			UPDATE seat_status 
			SET status = 'available', booking_id = NULL, reserved_until = NULL
			WHERE showtime_id = $1 AND seat_id = $2
		`
		_, err = tx.Exec(updateSeatQuery, showtimeID, seatID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{
				Success: false,
				Error:   "Failed to update seat status",
			})
			return
		}
	}

	// เพิ่มจำนวน available seats กลับ
	updateShowtimeQuery := "UPDATE showtimes SET available_seats = available_seats + $1 WHERE showtime_id = $2"
	_, err = tx.Exec(updateShowtimeQuery, seatCount, showtimeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to update available seats",
		})
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to commit transaction",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Booking cancelled successfully",
	})
}

// GetAllBookings (Admin) ดึงข้อมูลการจองทั้งหมด
// GET /api/admin/bookings
func (h *BookingHandler) GetAllBookings(c *gin.Context) {
	query := `
		SELECT 
			b.booking_id, b.booking_code, b.user_id, b.showtime_id,
			m.title, c.cinema_name, t.theater_name, 
			s.show_date, s.show_time, 
			b.total_amount, b.booking_status, b.payment_status, b.booking_date
		FROM bookings b
		JOIN showtimes s ON b.showtime_id = s.showtime_id
		JOIN movies m ON s.movie_id = m.movie_id
		JOIN theaters t ON s.theater_id = t.theater_id
		JOIN cinemas c ON t.cinema_id = c.cinema_id
		ORDER BY b.booking_date DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch bookings",
		})
		return
	}
	defer rows.Close()

	bookings := []models.Booking{}
	for rows.Next() {
		var booking models.Booking
		err := rows.Scan(
			&booking.BookingID, &booking.BookingCode, &booking.UserID, &booking.ShowtimeID,
			&booking.TotalAmount, &booking.BookingStatus, &booking.PaymentStatus, &booking.BookingDate,
		)
		if err != nil {
			continue
		}
		bookings = append(bookings, booking)
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    bookings,
	})
}

// ConfirmPayment ยืนยันการชำระเงิน
// PUT /api/bookings/:id/confirm-payment
func (h *BookingHandler) ConfirmPayment(c *gin.Context) {
	bookingID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid booking ID",
		})
		return
	}

	// ตรวจสอบว่าการจองมีอยู่และยังไม่ได้ชำระเงิน
	var bookingStatus, paymentStatus string
	query := "SELECT booking_status, payment_status FROM bookings WHERE booking_id = $1"
	err = h.db.QueryRow(query, bookingID).Scan(&bookingStatus, &paymentStatus)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Booking not found",
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch booking",
		})
		return
	}

	// ตรวจสอบสถานะ
	if bookingStatus == "cancelled" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Cannot confirm payment for cancelled booking",
		})
		return
	}

	if paymentStatus == "paid" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "This booking has already been paid",
		})
		return
	}

	// อัปเดต payment_status และ booking_status
	updateQuery := `
		UPDATE bookings 
		SET payment_status = 'paid', booking_status = 'confirmed', updated_at = CURRENT_TIMESTAMP
		WHERE booking_id = $1
	`
	result, err := h.db.Exec(updateQuery, bookingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to confirm payment",
		})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to update booking",
		})
		return
	}

	// อัปเดต seat_status เป็น 'booked' สำหรับที่นั่งทั้งหมดในการจองนี้
	updateSeatStatusQuery := `
		UPDATE seat_status 
		SET status = 'booked', reserved_until = NULL
		WHERE booking_id = $1
	`
	_, err = h.db.Exec(updateSeatStatusQuery, bookingID)
	if err != nil {
		// Log error but don't fail the request since booking is already confirmed
		fmt.Printf("Warning: Failed to update seat status for booking %d: %v\n", bookingID, err)
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Payment confirmed successfully",
		Data: gin.H{
			"booking_id":     bookingID,
			"payment_status": "paid",
			"booking_status": "confirmed",
		},
	})
}

// GetUserBookings ดึงข้อมูลการจองของผู้ใช้
// GET /api/bookings/my-bookings
func (h *BookingHandler) GetUserBookings(c *gin.Context) {
	userID := c.GetInt("user_id")

	query := `
		SELECT 
			b.booking_id, b.booking_code, b.user_id, b.showtime_id,
			m.title, c.cinema_name, t.theater_name, 
			s.show_date, s.show_time, 
			b.total_amount, b.booking_status, b.payment_status, b.booking_date
		FROM bookings b
		JOIN showtimes s ON b.showtime_id = s.showtime_id
		JOIN movies m ON s.movie_id = m.movie_id
		JOIN theaters t ON s.theater_id = t.theater_id
		JOIN cinemas c ON t.cinema_id = c.cinema_id
		WHERE b.user_id = $1 AND b.booking_status IN ('pending', 'confirmed')
		ORDER BY b.booking_date DESC
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch bookings",
		})
		return
	}
	defer rows.Close()

	bookingsMap := make(map[int]*models.BookingWithDetails)

	for rows.Next() {
		var bookingID int
		var bookingCode string
		var userID int
		var showtimeID int
		var movieTitle string
		var cinemaName string
		var theaterName string
		var showDate sql.NullTime
		var showTime sql.NullString
		var totalAmount float64
		var bookingStatus string
		var paymentStatus string
		var bookingDate sql.NullTime

		err := rows.Scan(
			&bookingID, &bookingCode, &userID, &showtimeID,
			&movieTitle, &cinemaName, &theaterName,
			&showDate, &showTime,
			&totalAmount, &bookingStatus, &paymentStatus, &bookingDate,
		)
		if err != nil {
			continue
		}

		if _, exists := bookingsMap[bookingID]; !exists {
			bookingsMap[bookingID] = &models.BookingWithDetails{
				BookingID:     bookingID,
				BookingCode:   bookingCode,
				UserID:        userID,
				ShowtimeID:    showtimeID,
				MovieTitle:    movieTitle,
				CinemaName:    cinemaName,
				TheaterName:   theaterName,
				ShowDate:      showDate.Time.Format("2006-01-02"),
				ShowTime:      showTime.String,
				TotalAmount:   totalAmount,
				BookingStatus: bookingStatus,
				PaymentStatus: paymentStatus,
				BookingDate:   bookingDate.Time,
				Seats:         []models.SeatInfo{},
			}
		}
	}

	// ดึงข้อมูลที่นั่งสำหรับแต่ละการจอง
	for bookingID := range bookingsMap {
		seatsQuery := `
			SELECT bs.seat_id, s.seat_row, s.seat_number, bs.price
			FROM booking_seats bs
			JOIN seats s ON bs.seat_id = s.seat_id
			WHERE bs.booking_id = $1
			ORDER BY s.seat_row, s.seat_number
		`

		seatRows, err := h.db.Query(seatsQuery, bookingID)
		if err == nil {
			defer seatRows.Close()
			for seatRows.Next() {
				var seatID int
				var seatRow string
				var seatNumber int
				var price float64
				err := seatRows.Scan(&seatID, &seatRow, &seatNumber, &price)
				if err == nil {
					bookingsMap[bookingID].Seats = append(bookingsMap[bookingID].Seats, models.SeatInfo{
						SeatID:     seatID,
						SeatRow:    seatRow,
						SeatNumber: seatNumber,
						Price:      price,
					})
				}
			}
		}
	}

	bookings := make([]models.BookingWithDetails, 0, len(bookingsMap))
	for _, booking := range bookingsMap {
		bookings = append(bookings, *booking)
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    bookings,
	})
}
