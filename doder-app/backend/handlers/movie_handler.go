package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"movie-booking-system/models"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

type MovieHandler struct {
	db *sql.DB
}

func NewMovieHandler(db *sql.DB) *MovieHandler {
	return &MovieHandler{db: db}
}

// CreateMovie สร้างหนังใหม่
// POST /api/admin/movies
func (h *MovieHandler) CreateMovie(c *gin.Context) {
	var req models.CreateMovieRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	genres := req.Genres
	if genres == nil {
		genres = []string{}
	}

	query := `
		INSERT INTO movies (title, description, duration, genres, language, subtitle, poster_url, release_date, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
		RETURNING movie_id, created_at, updated_at
	`

	var movie models.Movie
	movie.Title = req.Title
	movie.Description = req.Description
	movie.Duration = req.Duration
	movie.Genres = genres
	movie.Language = req.Language
	movie.Subtitle = req.Subtitle
	movie.PosterURL = req.PosterURL
	movie.ReleaseDate = req.ReleaseDate
	movie.IsActive = true

	err := h.db.QueryRow(
		query,
		req.Title, req.Description, req.Duration, pq.Array(genres),
		req.Language, req.Subtitle, req.PosterURL, req.ReleaseDate,
	).Scan(&movie.MovieID, &movie.CreatedAt, &movie.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to create movie",
		})
		return
	}

	c.JSON(http.StatusCreated, models.Response{
		Success: true,
		Message: "Movie created successfully",
		Data:    movie,
	})
}

// GetAllMovies ดึงข้อมูลหนังทั้งหมด
// GET /api/movies?is_active=true&genre=Action
func (h *MovieHandler) GetAllMovies(c *gin.Context) {
	isActiveParam := c.Query("is_active")
	genreParam := c.Query("genre")

	query := `
		SELECT movie_id, title, description, duration, genres, language, subtitle, 
		       poster_url, release_date, is_active, created_at, updated_at
		FROM movies
		WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 1

	if isActiveParam != "" {
		isActive, err := strconv.ParseBool(isActiveParam)
		if err == nil {
			query += " AND is_active = $" + strconv.Itoa(argIndex)
			args = append(args, isActive)
			argIndex++
		}
	}

	if genreParam != "" {
		query += " AND $" + strconv.Itoa(argIndex) + " = ANY(genres)"
		args = append(args, genreParam)
		argIndex++
	}

	query += " ORDER BY release_date DESC, created_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch movies",
		})
		return
	}
	defer rows.Close()

	movies := []models.Movie{}
	for rows.Next() {
		var movie models.Movie
		err := rows.Scan(
			&movie.MovieID,
			&movie.Title,
			&movie.Description,
			&movie.Duration,
			&movie.Genres,
			&movie.Language,
			&movie.Subtitle,
			&movie.PosterURL,
			&movie.ReleaseDate,
			&movie.IsActive,
			&movie.CreatedAt,
			&movie.UpdatedAt,
		)
		if err != nil {
			continue
		}
		movies = append(movies, movie)
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    movies,
	})
}

// GetMovieByID ดึงข้อมูลหนังตาม ID
// GET /api/movies/:id
func (h *MovieHandler) GetMovieByID(c *gin.Context) {
	id := c.Param("id")
	movieID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid movie ID",
		})
		return
	}

	query := `
		SELECT movie_id, title, description, duration, genres, language, subtitle,
		       poster_url, release_date, is_active, created_at, updated_at
		FROM movies
		WHERE movie_id = $1
	`

	var movie models.Movie
	err = h.db.QueryRow(query, movieID).Scan(
		&movie.MovieID,
		&movie.Title,
		&movie.Description,
		&movie.Duration,
		&movie.Genres,
		&movie.Language,
		&movie.Subtitle,
		&movie.PosterURL,
		&movie.ReleaseDate,
		&movie.IsActive,
		&movie.CreatedAt,
		&movie.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Movie not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch movie",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    movie,
	})
}

// UpdateMovie แก้ไขข้อมูลหนัง
// PUT /api/admin/movies/:id
func (h *MovieHandler) UpdateMovie(c *gin.Context) {
	id := c.Param("id")
	movieID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid movie ID",
		})
		return
	}

	var req models.UpdateMovieRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// สร้าง dynamic query สำหรับ update เฉพาะฟิลด์ที่ส่งมา
	query := "UPDATE movies SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}
	argIndex := 1

	if req.Title != nil {
		query += ", title = $" + strconv.Itoa(argIndex)
		args = append(args, *req.Title)
		argIndex++
	}
	if req.Description != nil {
		query += ", description = $" + strconv.Itoa(argIndex)
		args = append(args, *req.Description)
		argIndex++
	}
	if req.Duration != nil {
		query += ", duration = $" + strconv.Itoa(argIndex)
		args = append(args, *req.Duration)
		argIndex++
	}
	if req.Genres != nil {
		query += ", genres = $" + strconv.Itoa(argIndex)
		args = append(args, pq.Array(req.Genres))
		argIndex++
	}
	if req.Language != nil {
		query += ", language = $" + strconv.Itoa(argIndex)
		args = append(args, *req.Language)
		argIndex++
	}
	if req.Subtitle != nil {
		query += ", subtitle = $" + strconv.Itoa(argIndex)
		args = append(args, *req.Subtitle)
		argIndex++
	}
	if req.PosterURL != nil {
		query += ", poster_url = $" + strconv.Itoa(argIndex)
		args = append(args, *req.PosterURL)
		argIndex++
	}
	if req.ReleaseDate != nil {
		query += ", release_date = $" + strconv.Itoa(argIndex)
		args = append(args, *req.ReleaseDate)
		argIndex++
	}
	if req.IsActive != nil {
		query += ", is_active = $" + strconv.Itoa(argIndex)
		args = append(args, *req.IsActive)
		argIndex++
	}

	query += " WHERE movie_id = $" + strconv.Itoa(argIndex)
	args = append(args, movieID)

	result, err := h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to update movie",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Movie not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Movie updated successfully",
	})
}

// DeleteMovie ลบหนัง (soft delete)
// DELETE /api/admin/movies/:id
func (h *MovieHandler) DeleteMovie(c *gin.Context) {
	id := c.Param("id")
	movieID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid movie ID",
		})
		return
	}

	query := "UPDATE movies SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE movie_id = $1"
	result, err := h.db.Exec(query, movieID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to delete movie",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "Movie not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Movie deleted successfully",
	})
}
