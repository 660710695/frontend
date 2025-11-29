package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"movie-booking-system/models"

	"github.com/gin-gonic/gin"
)

type SeatHandler struct {
	db *sql.DB
}

func NewSeatHandler(db *sql.DB) *SeatHandler {
	return &SeatHandler{db: db}
}

// CreateSeat สร้างที่นั่งทีละตัว
// POST /api/admin/seats
func (h *SeatHandler) CreateSeat(c *gin.Context) {
	var req models.CreateSeatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	var exists bool
	err := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM theaters WHERE theater_id = $1)", req.TheaterID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Theater not found",
		})
		return
	}

	err = h.db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM seats WHERE theater_id = $1 AND seat_row = $2 AND seat_number = $3)",
		req.TheaterID, req.SeatRow, req.SeatNumber,
	).Scan(&exists)
	if err == nil && exists {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Seat already exists",
		})
		return
	}

	query := `
		INSERT INTO seats (theater_id, seat_row, seat_number, seat_type, is_active)
		VALUES ($1, $2, $3, $4, TRUE)
		RETURNING seat_id, created_at
	`

	var seat models.Seat
	seat.TheaterID = req.TheaterID
	seat.SeatRow = req.SeatRow
	seat.SeatNumber = req.SeatNumber
	seat.SeatType = req.SeatType
	if seat.SeatType == "" {
		seat.SeatType = "standard"
	}
	seat.IsActive = true

	err = h.db.QueryRow(
		query,
		req.TheaterID, req.SeatRow, req.SeatNumber, seat.SeatType,
	).Scan(&seat.SeatID, &seat.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to create seat",
		})
		return
	}

	c.JSON(http.StatusCreated, models.Response{
		Success: true,
		Message: "Seat created successfully",
		Data:    seat,
	})
}

// CreateSeatsInBulk สร้างที่นั่งหลายตัวพร้อมกัน
// POST /api/admin/seats/bulk
func (h *SeatHandler) CreateSeatsInBulk(c *gin.Context) {
	var req models.CreateSeatsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	var exists bool
	err := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM theaters WHERE theater_id = $1)", req.TheaterID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Theater not found",
		})
		return
	}

	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to start transaction",
		})
		return
	}
	defer tx.Rollback()

	seatType := req.SeatType
	if seatType == "" {
		seatType = "standard"
	}

	createdCount := 0
	skippedCount := 0

	for _, row := range req.Rows {
		for seatNum := 1; seatNum <= req.SeatsPerRow; seatNum++ {
			var seatExists bool
			err := tx.QueryRow(
				"SELECT EXISTS(SELECT 1 FROM seats WHERE theater_id = $1 AND seat_row = $2 AND seat_number = $3)",
				req.TheaterID, row, seatNum,
			).Scan(&seatExists)

			if err != nil {
				c.JSON(http.StatusInternalServerError, models.ErrorResponse{
					Success: false,
					Error:   "Failed to check seat existence",
				})
				return
			}

			if seatExists {
				skippedCount++
				continue
			}

			_, err = tx.Exec(
				"INSERT INTO seats (theater_id, seat_row, seat_number, seat_type, is_active) VALUES ($1, $2, $3, $4, TRUE)",
				req.TheaterID, row, seatNum, seatType,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, models.ErrorResponse{
					Success: false,
					Error:   "Failed to create seat",
				})
				return
			}
			createdCount++
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to commit transaction",
		})
		return
	}

	c.JSON(http.StatusCreated, models.Response{
		Success: true,
		Message: "Seats created successfully",
		Data: gin.H{
			"created": createdCount,
			"skipped": skippedCount,
			"total":   createdCount + skippedCount,
		},
	})
}

// GetAllSeats ดึงที่นั่งทั้งหมด
// GET /api/seats?theater_id=1&is_active=true
func (h *SeatHandler) GetAllSeats(c *gin.Context) {
	theaterIDParam := c.Query("theater_id")
	isActiveParam := c.Query("is_active")

	if theaterIDParam == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "theater_id is required",
		})
		return
	}

	theaterID, err := strconv.Atoi(theaterIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid theater_id",
		})
		return
	}

	query := `
		SELECT seat_id, theater_id, seat_row, seat_number, seat_type, is_active, created_at
		FROM seats
		WHERE theater_id = $1
	`
	args := []interface{}{theaterID}
	argIndex := 2

	if isActiveParam != "" {
		isActive, err := strconv.ParseBool(isActiveParam)
		if err == nil {
			query += " AND is_active = $" + strconv.Itoa(argIndex)
			args = append(args, isActive)
			argIndex++
		}
	}

	query += " ORDER BY seat_row, seat_number"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch seats",
		})
		return
	}
	defer rows.Close()

	seats := []models.Seat{}
	for rows.Next() {
		var seat models.Seat
		err := rows.Scan(
			&seat.SeatID,
			&seat.TheaterID,
			&seat.SeatRow,
			&seat.SeatNumber,
			&seat.SeatType,
			&seat.IsActive,
			&seat.CreatedAt,
		)
		if err != nil {
			continue
		}
		seats = append(seats, seat)
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    seats,
	})
}

// GetSeatByID ดึงที่นั่งตาม ID
// GET /api/seats/:id
func (h *SeatHandler) GetSeatByID(c *gin.Context) {
	id := c.Param("id")
	seatID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid seat ID",
		})
		return
	}

	query := `
		SELECT seat_id, theater_id, seat_row, seat_number, seat_type, is_active, created_at
		FROM seats
		WHERE seat_id = $1
	`

	var seat models.Seat
	err = h.db.QueryRow(query, seatID).Scan(
		&seat.SeatID,
		&seat.TheaterID,
		&seat.SeatRow,
		&seat.SeatNumber,
		&seat.SeatType,
		&seat.IsActive,
		&seat.CreatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Seat not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch seat",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    seat,
	})
}

// UpdateSeat แก้ไขที่นั่ง (เปลี่ยน type หรือเปิด/ปิดการใช้งาน)
// PUT /api/admin/seats/:id
func (h *SeatHandler) UpdateSeat(c *gin.Context) {
	id := c.Param("id")
	seatID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid seat ID",
		})
		return
	}

	var req models.UpdateSeatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	query := "UPDATE seats SET"
	args := []interface{}{}
	argIndex := 1
	hasUpdate := false

	if req.SeatType != nil {
		if hasUpdate {
			query += ","
		}
		query += " seat_type = $" + strconv.Itoa(argIndex)
		args = append(args, *req.SeatType)
		argIndex++
		hasUpdate = true
	}

	if req.IsActive != nil {
		if hasUpdate {
			query += ","
		}
		query += " is_active = $" + strconv.Itoa(argIndex)
		args = append(args, *req.IsActive)
		argIndex++
		hasUpdate = true
	}

	if !hasUpdate {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "No fields to update",
		})
		return
	}

	query += " WHERE seat_id = $" + strconv.Itoa(argIndex)
	args = append(args, seatID)

	result, err := h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to update seat",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Seat not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Seat updated successfully",
	})
}

// DeleteSeat ลบที่นั่ง (ปิดการใช้งาน - soft delete)
// DELETE /api/admin/seats/:id
func (h *SeatHandler) DeleteSeat(c *gin.Context) {
	id := c.Param("id")
	seatID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid seat ID",
		})
		return
	}

	query := "UPDATE seats SET is_active = FALSE WHERE seat_id = $1"
	result, err := h.db.Exec(query, seatID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to delete seat",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Seat not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Seat deleted successfully",
	})
}

// GetSeatStatusByShowtime ดึงสถานะที่นั่งตาม showtime_id
// GET /api/showtimes/:id/seats
func (h *SeatHandler) GetSeatStatusByShowtime(c *gin.Context) {
	id := c.Param("id")
	showtimeID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid showtime ID",
		})
		return
	}

	// ตรวจสอบว่า showtime มีอยู่จริง และดึง theater_id
	var theaterID int
	var movieTitle string
	var cinemaName string
	var theaterName string
	var showDate string
	var showTime string
	var price float64
	showtimeQuery := `
		SELECT s.theater_id, m.title, c.cinema_name, t.theater_name, 
		       TO_CHAR(s.show_date, 'YYYY-MM-DD'), TO_CHAR(s.show_time, 'HH24:MI'), s.price
		FROM showtimes s
		JOIN movies m ON s.movie_id = m.movie_id
		JOIN theaters t ON s.theater_id = t.theater_id
		JOIN cinemas c ON t.cinema_id = c.cinema_id
		WHERE s.showtime_id = $1 AND s.is_active = TRUE
	`
	err = h.db.QueryRow(showtimeQuery, showtimeID).Scan(&theaterID, &movieTitle, &cinemaName, &theaterName, &showDate, &showTime, &price)
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

	// ดึงที่นั่งทั้งหมดของ theater พร้อมสถานะจาก seat_status
	query := `
		SELECT 
			s.seat_id, s.seat_row, s.seat_number, s.seat_type,
			COALESCE(ss.status, 'available') as status
		FROM seats s
		LEFT JOIN seat_status ss ON s.seat_id = ss.seat_id AND ss.showtime_id = $1
		WHERE s.theater_id = $2 AND s.is_active = TRUE
		ORDER BY s.seat_row, s.seat_number
	`

	rows, err := h.db.Query(query, showtimeID, theaterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch seats",
		})
		return
	}
	defer rows.Close()

	type SeatWithStatus struct {
		SeatID     int    `json:"seat_id"`
		SeatRow    string `json:"seat_row"`
		SeatNumber int    `json:"seat_number"`
		SeatType   string `json:"seat_type"`
		Status     string `json:"status"`
	}

	seats := []SeatWithStatus{}
	for rows.Next() {
		var seat SeatWithStatus
		err := rows.Scan(
			&seat.SeatID,
			&seat.SeatRow,
			&seat.SeatNumber,
			&seat.SeatType,
			&seat.Status,
		)
		if err != nil {
			continue
		}
		seats = append(seats, seat)
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data: gin.H{
			"showtime_id":  showtimeID,
			"movie_title":  movieTitle,
			"cinema_name":  cinemaName,
			"theater_name": theaterName,
			"show_date":    showDate,
			"show_time":    showTime,
			"price":        price,
			"seats":        seats,
		},
	})
}
