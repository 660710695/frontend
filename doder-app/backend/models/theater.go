package models

import "time"

type Theater struct {
	TheaterID   int       `json:"theater_id" db:"theater_id"`
	CinemaID    int       `json:"cinema_id" db:"cinema_id"`
	TheaterName string    `json:"theater_name" db:"theater_name"`
	TotalSeats  int       `json:"total_seats" db:"total_seats"`
	TheaterType *string   `json:"theater_type,omitempty" db:"theater_type"` // 'standard', 'vip', 'imax', '4dx'
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type CreateTheaterRequest struct {
	CinemaID    int     `json:"cinema_id" binding:"required"`
	TheaterName string  `json:"theater_name" binding:"required"`
	TotalSeats  int     `json:"total_seats" binding:"required,min=1"`
	TheaterType *string `json:"theater_type"`
}

type UpdateTheaterRequest struct {
	TheaterName *string `json:"theater_name"`
	TotalSeats  *int    `json:"total_seats"`
	TheaterType *string `json:"theater_type"`
	IsActive    *bool   `json:"is_active"`
}
