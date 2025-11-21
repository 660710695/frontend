package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"movie-booking-system/models"
)

type ShowtimeHandler struct {
	db *sql.DB
}

func NewShowtimeHandler(db *sql.DB) *ShowtimeHandler {
	return &ShowtimeHandler{db: db}
}

// CreateShowtime สร้างรอบฉายใหม่
// POST /api/admin/showtimes
func (h *ShowtimeHandler) CreateShowtime(c *gin.Context) {
	var req models.CreateShowtimeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// ดึงจำนวนที่นั่งทั้งหมดจากห้องฉาย
	var totalSeats int
	err := h.db.QueryRow("SELECT total_seats FROM theaters WHERE theater_id = $1", req.TheaterID).Scan(&totalSeats)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Theater not found",
		})
		return
	}

	query := `
		INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
		RETURNING showtime_id, created_at, updated_at
	`

	var showtime models.Showtime
	showtime.MovieID = req.MovieID
	showtime.TheaterID = req.TheaterID
	showtime.ShowDate = req.ShowDate
	showtime.ShowTime = req.ShowTime
	showtime.EndTime = req.EndTime
	showtime.Price = req.Price
	showtime.AvailableSeats = totalSeats
	showtime.IsActive = true

	err = h.db.QueryRow(
		query,
		req.MovieID, req.TheaterID, req.ShowDate, req.ShowTime, req.EndTime, req.Price, totalSeats,
	).Scan(&showtime.ShowtimeID, &showtime.CreatedAt, &showtime.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to create showtime",
		})
		return
	}

	c.JSON(http.StatusCreated, models.Response{
		Success: true,
		Message: "Showtime created successfully",
		Data:    showtime,
	})
}

// GetAllShowtimes ดึงข้อมูลรอบฉายทั้งหมด พร้อมข้อมูล movie และ theater
// GET /api/showtimes?movie_id=1&theater_id=1&show_date=2025-11-22&is_active=true
func (h *ShowtimeHandler) GetAllShowtimes(c *gin.Context) {
	movieIDParam := c.Query("movie_id")
	theaterIDParam := c.Query("theater_id")
	showDateParam := c.Query("show_date")
	isActiveParam := c.Query("is_active")

	query := `
		SELECT 
			s.showtime_id, s.movie_id, m.title as movie_title,
			s.theater_id, t.theater_name, t.cinema_id, c.cinema_name,
			s.show_date, s.show_time, s.end_time, s.price, s.available_seats,
			s.is_active, s.created_at, s.updated_at
		FROM showtimes s
		JOIN movies m ON s.movie_id = m.movie_id
		JOIN theaters t ON s.theater_id = t.theater_id
		JOIN cinemas c ON t.cinema_id = c.cinema_id
		WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 1

	// กรองตาม movie_id
	if movieIDParam != "" {
		movieID, err := strconv.Atoi(movieIDParam)
		if err == nil {
			query += " AND s.movie_id = $" + strconv.Itoa(argIndex)
			args = append(args, movieID)
			argIndex++
		}
	}

	// กรองตาม theater_id
	if theaterIDParam != "" {
		theaterID, err := strconv.Atoi(theaterIDParam)
		if err == nil {
			query += " AND s.theater_id = $" + strconv.Itoa(argIndex)
			args = append(args, theaterID)
			argIndex++
		}
	}

	// กรองตามวันที่
	if showDateParam != "" {
		query += " AND s.show_date = $" + strconv.Itoa(argIndex)
		args = append(args, showDateParam)
		argIndex++
	}

	// กรองตาม is_active
	if isActiveParam != "" {
		isActive, err := strconv.ParseBool(isActiveParam)
		if err == nil {
			query += " AND s.is_active = $" + strconv.Itoa(argIndex)
			args = append(args, isActive)
			argIndex++
		}
	}

	query += " ORDER BY s.show_date, s.show_time"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch showtimes",
		})
		return
	}
	defer rows.Close()

	showtimes := []models.ShowtimeWithDetails{}
	for rows.Next() {
		var showtime models.ShowtimeWithDetails
		err := rows.Scan(
			&showtime.ShowtimeID,
			&showtime.MovieID,
			&showtime.MovieTitle,
			&showtime.TheaterID,
			&showtime.TheaterName,
			&showtime.CinemaID,
			&showtime.CinemaName,
			&showtime.ShowDate,
			&showtime.ShowTime,
			&showtime.EndTime,
			&showtime.Price,
			&showtime.AvailableSeats,
			&showtime.IsActive,
			&showtime.CreatedAt,
			&showtime.UpdatedAt,
		)
		if err != nil {
			continue
		}
		showtimes = append(showtimes, showtime)
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    showtimes,
	})
}

// GetShowtimeByID ดึงข้อมูลรอบฉายตาม ID
// GET /api/showtimes/:id
func (h *ShowtimeHandler) GetShowtimeByID(c *gin.Context) {
	id := c.Param("id")
	showtimeID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid showtime ID",
		})
		return
	}

	query := `
		SELECT 
			s.showtime_id, s.movie_id, m.title as movie_title,
			s.theater_id, t.theater_name, t.cinema_id, c.cinema_name,
			s.show_date, s.show_time, s.end_time, s.price, s.available_seats,
			s.is_active, s.created_at, s.updated_at
		FROM showtimes s
		JOIN movies m ON s.movie_id = m.movie_id
		JOIN theaters t ON s.theater_id = t.theater_id
		JOIN cinemas c ON t.cinema_id = c.cinema_id
		WHERE s.showtime_id = $1
	`

	var showtime models.ShowtimeWithDetails
	err = h.db.QueryRow(query, showtimeID).Scan(
		&showtime.ShowtimeID,
		&showtime.MovieID,
		&showtime.MovieTitle,
		&showtime.TheaterID,
		&showtime.TheaterName,
		&showtime.CinemaID,
		&showtime.CinemaName,
		&showtime.ShowDate,
		&showtime.ShowTime,
		&showtime.EndTime,
		&showtime.Price,
		&showtime.AvailableSeats,
		&showtime.IsActive,
		&showtime.CreatedAt,
		&showtime.UpdatedAt,
	)

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

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    showtime,
	})
}

// UpdateShowtime แก้ไขข้อมูลรอบฉาย
// PUT /api/admin/showtimes/:id
func (h *ShowtimeHandler) UpdateShowtime(c *gin.Context) {
	id := c.Param("id")
	showtimeID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid showtime ID",
		})
		return
	}

	var req models.UpdateShowtimeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// สร้าง dynamic query
	query := "UPDATE showtimes SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}
	argIndex := 1

	if req.ShowDate != nil {
		query += ", show_date = $" + strconv.Itoa(argIndex)
		args = append(args, *req.ShowDate)
		argIndex++
	}
	if req.ShowTime != nil {
		query += ", show_time = $" + strconv.Itoa(argIndex)
		args = append(args, *req.ShowTime)
		argIndex++
	}
	if req.EndTime != nil {
		query += ", end_time = $" + strconv.Itoa(argIndex)
		args = append(args, *req.EndTime)
		argIndex++
	}
	if req.Price != nil {
		query += ", price = $" + strconv.Itoa(argIndex)
		args = append(args, *req.Price)
		argIndex++
	}
	if req.IsActive != nil {
		query += ", is_active = $" + strconv.Itoa(argIndex)
		args = append(args, *req.IsActive)
		argIndex++
	}

	query += " WHERE showtime_id = $" + strconv.Itoa(argIndex)
	args = append(args, showtimeID)

	result, err := h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to update showtime",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Showtime not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Showtime updated successfully",
	})
}

// DeleteShowtime ลบรอบฉาย (soft delete)
// DELETE /api/admin/showtimes/:id
func (h *ShowtimeHandler) DeleteShowtime(c *gin.Context) {
	id := c.Param("id")
	showtimeID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid showtime ID",
		})
		return
	}

	// ไม่ลบจริง แค่เปลี่ยน is_active เป็น false
	query := "UPDATE showtimes SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE showtime_id = $1"
	result, err := h.db.Exec(query, showtimeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to delete showtime",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Showtime not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Showtime deleted successfully",
	})
}
