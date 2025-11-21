package models

import "time"

type Movie struct {
	MovieID     int       `json:"movie_id" db:"movie_id"`
	Title       string    `json:"title" db:"title"`
	Description *string   `json:"description,omitempty" db:"description"`
	Duration    int       `json:"duration" db:"duration"` // in minutes
	Language    *string   `json:"language,omitempty" db:"language"`
	Subtitle    *string   `json:"subtitle,omitempty" db:"subtitle"`
	PosterURL   *string   `json:"poster_url,omitempty" db:"poster_url"`
	ReleaseDate *string   `json:"release_date,omitempty" db:"release_date"` // YYYY-MM-DD
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type CreateMovieRequest struct {
	Title       string  `json:"title" binding:"required"`
	Description *string `json:"description"`
	Duration    int     `json:"duration" binding:"required,min=1"` // minutes
	Language    *string `json:"language"`
	Subtitle    *string `json:"subtitle"`
	PosterURL   *string `json:"poster_url"`
	ReleaseDate *string `json:"release_date"` // YYYY-MM-DD format
}

type UpdateMovieRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Duration    *int    `json:"duration"`
	Language    *string `json:"language"`
	Subtitle    *string `json:"subtitle"`
	PosterURL   *string `json:"poster_url"`
	ReleaseDate *string `json:"release_date"`
	IsActive    *bool   `json:"is_active"`
}
