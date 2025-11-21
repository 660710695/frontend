package models

import "time"

type Showtime struct {
	ShowtimeID     int       `json:"showtime_id" db:"showtime_id"`
	MovieID        int       `json:"movie_id" db:"movie_id"`
	TheaterID      int       `json:"theater_id" db:"theater_id"`
	ShowDate       string    `json:"show_date" db:"show_date"` // YYYY-MM-DD
	ShowTime       string    `json:"show_time" db:"show_time"` // HH:MM:SS
	EndTime        string    `json:"end_time" db:"end_time"`   // HH:MM:SS
	Price          float64   `json:"price" db:"price"`
	AvailableSeats int       `json:"available_seats" db:"available_seats"`
	IsActive       bool      `json:"is_active" db:"is_active"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

type ShowtimeWithDetails struct {
	ShowtimeID     int       `json:"showtime_id" db:"showtime_id"`
	MovieID        int       `json:"movie_id" db:"movie_id"`
	MovieTitle     string    `json:"movie_title" db:"movie_title"`
	TheaterID      int       `json:"theater_id" db:"theater_id"`
	TheaterName    string    `json:"theater_name" db:"theater_name"`
	CinemaID       int       `json:"cinema_id" db:"cinema_id"`
	CinemaName     string    `json:"cinema_name" db:"cinema_name"`
	ShowDate       string    `json:"show_date" db:"show_date"`
	ShowTime       string    `json:"show_time" db:"show_time"`
	EndTime        string    `json:"end_time" db:"end_time"`
	Price          float64   `json:"price" db:"price"`
	AvailableSeats int       `json:"available_seats" db:"available_seats"`
	IsActive       bool      `json:"is_active" db:"is_active"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

type CreateShowtimeRequest struct {
	MovieID   int     `json:"movie_id" binding:"required"`
	TheaterID int     `json:"theater_id" binding:"required"`
	ShowDate  string  `json:"show_date" binding:"required"` // YYYY-MM-DD
	ShowTime  string  `json:"show_time" binding:"required"` // HH:MM
	EndTime   string  `json:"end_time" binding:"required"`  // HH:MM
	Price     float64 `json:"price" binding:"required,min=0"`
}

type UpdateShowtimeRequest struct {
	ShowDate *string  `json:"show_date"`
	ShowTime *string  `json:"show_time"`
	EndTime  *string  `json:"end_time"`
	Price    *float64 `json:"price"`
	IsActive *bool    `json:"is_active"`
}
