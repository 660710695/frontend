package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"movie-booking-system/models"
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

	// ตรวจสอบว่า theater มีอยู่จริง
	var exists bool
	err := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM theaters WHERE theater_id = $1)", req.TheaterID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Theater not found",
		})
		return
	}

	// ตรวจสอบว่าที่นั่งซ้ำหรือไม่
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

	// ตรวจสอบว่า theater มีอยู่จริง
	var exists bool
	err := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM theaters WHERE theater_id = $1)", req.TheaterID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Theater not found",
		})
		return
	}

	// เริ่ม transaction
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

	// สร้างที่นั่งตามแถวและจำนวนที่กำหนด
	for _, row := range req.Rows {
		for seatNum := 1; seatNum <= req.SeatsPerRow; seatNum++ {
			// ตรวจสอบว่าที่นั่งมีอยู่แล้วหรือไม่
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

			// ถ้าที่นั่งมีอยู่แล้ว ข้ามไป
			if seatExists {
				skippedCount++
				continue
			}

			// สร้างที่นั่งใหม่
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

	// กรองตาม is_active
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

	// สร้าง dynamic query
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

	// ปิดการใช้งานแทนการลบจริง
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
