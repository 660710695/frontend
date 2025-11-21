package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"movie-booking-system/models"
)

type TheaterHandler struct {
	db *sql.DB
}

func NewTheaterHandler(db *sql.DB) *TheaterHandler {
	return &TheaterHandler{db: db}
}

// CreateTheater สร้างห้องฉายใหม่
// POST /api/admin/theaters
func (h *TheaterHandler) CreateTheater(c *gin.Context) {
	var req models.CreateTheaterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	query := `
		INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type, is_active)
		VALUES ($1, $2, $3, $4, TRUE)
		RETURNING theater_id, created_at, updated_at
	`

	var theater models.Theater
	theater.CinemaID = req.CinemaID
	theater.TheaterName = req.TheaterName
	theater.TotalSeats = req.TotalSeats
	theater.TheaterType = req.TheaterType
	theater.IsActive = true

	err := h.db.QueryRow(
		query,
		req.CinemaID, req.TheaterName, req.TotalSeats, req.TheaterType,
	).Scan(&theater.TheaterID, &theater.CreatedAt, &theater.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to create theater",
		})
		return
	}

	c.JSON(http.StatusCreated, models.Response{
		Success: true,
		Message: "Theater created successfully",
		Data:    theater,
	})
}

// GetAllTheaters ดึงข้อมูลห้องฉายทั้งหมด
// GET /api/theaters?cinema_id=1&is_active=true
func (h *TheaterHandler) GetAllTheaters(c *gin.Context) {
	cinemaIDParam := c.Query("cinema_id")
	isActiveParam := c.Query("is_active")

	query := `
		SELECT theater_id, cinema_id, theater_name, total_seats, theater_type,
		       is_active, created_at, updated_at
		FROM theaters
		WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 1

	// กรองตาม cinema_id ถ้ามี
	if cinemaIDParam != "" {
		cinemaID, err := strconv.Atoi(cinemaIDParam)
		if err == nil {
			query += " AND cinema_id = $" + strconv.Itoa(argIndex)
			args = append(args, cinemaID)
			argIndex++
		}
	}

	// กรองตาม is_active ถ้ามี
	if isActiveParam != "" {
		isActive, err := strconv.ParseBool(isActiveParam)
		if err == nil {
			query += " AND is_active = $" + strconv.Itoa(argIndex)
			args = append(args, isActive)
			argIndex++
		}
	}

	query += " ORDER BY cinema_id, theater_name"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch theaters",
		})
		return
	}
	defer rows.Close()

	theaters := []models.Theater{}
	for rows.Next() {
		var theater models.Theater
		err := rows.Scan(
			&theater.TheaterID,
			&theater.CinemaID,
			&theater.TheaterName,
			&theater.TotalSeats,
			&theater.TheaterType,
			&theater.IsActive,
			&theater.CreatedAt,
			&theater.UpdatedAt,
		)
		if err != nil {
			continue
		}
		theaters = append(theaters, theater)
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    theaters,
	})
}

// GetTheaterByID ดึงข้อมูลห้องฉายตาม ID
// GET /api/theaters/:id
func (h *TheaterHandler) GetTheaterByID(c *gin.Context) {
	id := c.Param("id")
	theaterID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid theater ID",
		})
		return
	}

	query := `
		SELECT theater_id, cinema_id, theater_name, total_seats, theater_type,
		       is_active, created_at, updated_at
		FROM theaters
		WHERE theater_id = $1
	`

	var theater models.Theater
	err = h.db.QueryRow(query, theaterID).Scan(
		&theater.TheaterID,
		&theater.CinemaID,
		&theater.TheaterName,
		&theater.TotalSeats,
		&theater.TheaterType,
		&theater.IsActive,
		&theater.CreatedAt,
		&theater.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Theater not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch theater",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    theater,
	})
}

// UpdateTheater แก้ไขข้อมูลห้องฉาย
// PUT /api/admin/theaters/:id
func (h *TheaterHandler) UpdateTheater(c *gin.Context) {
	id := c.Param("id")
	theaterID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid theater ID",
		})
		return
	}

	var req models.UpdateTheaterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// สร้าง dynamic query สำหรับ update เฉพาะฟิลด์ที่ส่งมา
	query := "UPDATE theaters SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}
	argIndex := 1

	if req.TheaterName != nil {
		query += ", theater_name = $" + strconv.Itoa(argIndex)
		args = append(args, *req.TheaterName)
		argIndex++
	}
	if req.TotalSeats != nil {
		query += ", total_seats = $" + strconv.Itoa(argIndex)
		args = append(args, *req.TotalSeats)
		argIndex++
	}
	if req.TheaterType != nil {
		query += ", theater_type = $" + strconv.Itoa(argIndex)
		args = append(args, *req.TheaterType)
		argIndex++
	}
	if req.IsActive != nil {
		query += ", is_active = $" + strconv.Itoa(argIndex)
		args = append(args, *req.IsActive)
		argIndex++
	}

	query += " WHERE theater_id = $" + strconv.Itoa(argIndex)
	args = append(args, theaterID)

	result, err := h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to update theater",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Theater not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Theater updated successfully",
	})
}

// DeleteTheater ลบห้องฉาย (soft delete)
// DELETE /api/admin/theaters/:id
func (h *TheaterHandler) DeleteTheater(c *gin.Context) {
	id := c.Param("id")
	theaterID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid theater ID",
		})
		return
	}

	// ไม่ลบจริง แค่เปลี่ยน is_active เป็น false
	query := "UPDATE theaters SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE theater_id = $1"
	result, err := h.db.Exec(query, theaterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to delete theater",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Theater not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Theater deleted successfully",
	})
}
