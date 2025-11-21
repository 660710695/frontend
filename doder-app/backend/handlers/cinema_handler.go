package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"movie-booking-system/models"
)

type CinemaHandler struct {
	db *sql.DB
}

func NewCinemaHandler(db *sql.DB) *CinemaHandler {
	return &CinemaHandler{db: db}
}

// CreateCinema สร้างโรงหนังใหม่
// POST /api/admin/cinemas
func (h *CinemaHandler) CreateCinema(c *gin.Context) {
	var req models.CreateCinemaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	query := `
		INSERT INTO cinemas (cinema_name, address, city, is_active)
		VALUES ($1, $2, $3, TRUE)
		RETURNING cinema_id, created_at, updated_at
	`

	var cinema models.Cinema
	cinema.CinemaName = req.CinemaName
	cinema.Address = req.Address
	cinema.City = req.City
	cinema.IsActive = true

	err := h.db.QueryRow(query, req.CinemaName, req.Address, req.City).
		Scan(&cinema.CinemaID, &cinema.CreatedAt, &cinema.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to create cinema",
		})
		return
	}

	c.JSON(http.StatusCreated, models.Response{
		Success: true,
		Message: "Cinema created successfully",
		Data:    cinema,
	})
}

// GetAllCinemas ดึงข้อมูลโรงหนังทั้งหมด
// GET /api/cinemas?is_active=true
func (h *CinemaHandler) GetAllCinemas(c *gin.Context) {
	isActiveParam := c.Query("is_active")

	query := "SELECT cinema_id, cinema_name, address, city, is_active, created_at, updated_at FROM cinemas"
	args := []interface{}{}

	// กรองตาม is_active ถ้ามี query parameter
	if isActiveParam != "" {
		isActive, err := strconv.ParseBool(isActiveParam)
		if err == nil {
			query += " WHERE is_active = $1"
			args = append(args, isActive)
		}
	}

	query += " ORDER BY created_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch cinemas",
		})
		return
	}
	defer rows.Close()

	cinemas := []models.Cinema{}
	for rows.Next() {
		var cinema models.Cinema
		err := rows.Scan(
			&cinema.CinemaID,
			&cinema.CinemaName,
			&cinema.Address,
			&cinema.City,
			&cinema.IsActive,
			&cinema.CreatedAt,
			&cinema.UpdatedAt,
		)
		if err != nil {
			continue
		}
		cinemas = append(cinemas, cinema)
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    cinemas,
	})
}

// GetCinemaByID ดึงข้อมูลโรงหนังตาม ID
// GET /api/cinemas/:id
func (h *CinemaHandler) GetCinemaByID(c *gin.Context) {
	id := c.Param("id")
	cinemaID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid cinema ID",
		})
		return
	}

	query := `
		SELECT cinema_id, cinema_name, address, city, is_active, created_at, updated_at
		FROM cinemas
		WHERE cinema_id = $1
	`

	var cinema models.Cinema
	err = h.db.QueryRow(query, cinemaID).Scan(
		&cinema.CinemaID,
		&cinema.CinemaName,
		&cinema.Address,
		&cinema.City,
		&cinema.IsActive,
		&cinema.CreatedAt,
		&cinema.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Cinema not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch cinema",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    cinema,
	})
}

// UpdateCinema แก้ไขข้อมูลโรงหนัง
// PUT /api/admin/cinemas/:id
func (h *CinemaHandler) UpdateCinema(c *gin.Context) {
	id := c.Param("id")
	cinemaID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid cinema ID",
		})
		return
	}

	var req models.UpdateCinemaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// สร้าง dynamic query สำหรับ update เฉพาะฟิลด์ที่ส่งมา
	query := "UPDATE cinemas SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}
	argIndex := 1

	if req.CinemaName != nil {
		query += ", cinema_name = $" + strconv.Itoa(argIndex)
		args = append(args, *req.CinemaName)
		argIndex++
	}
	if req.Address != nil {
		query += ", address = $" + strconv.Itoa(argIndex)
		args = append(args, *req.Address)
		argIndex++
	}
	if req.City != nil {
		query += ", city = $" + strconv.Itoa(argIndex)
		args = append(args, *req.City)
		argIndex++
	}
	if req.IsActive != nil {
		query += ", is_active = $" + strconv.Itoa(argIndex)
		args = append(args, *req.IsActive)
		argIndex++
	}

	query += " WHERE cinema_id = $" + strconv.Itoa(argIndex)
	args = append(args, cinemaID)

	result, err := h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to update cinema",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Cinema not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Cinema updated successfully",
	})
}

// DeleteCinema ลบโรงหนัง (soft delete)
// DELETE /api/admin/cinemas/:id
func (h *CinemaHandler) DeleteCinema(c *gin.Context) {
	id := c.Param("id")
	cinemaID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid cinema ID",
		})
		return
	}

	// ไม่ลบจริง แค่เปลี่ยน is_active เป็น false
	query := "UPDATE cinemas SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE cinema_id = $1"
	result, err := h.db.Exec(query, cinemaID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to delete cinema",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Cinema not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Cinema deleted successfully",
	})
}
