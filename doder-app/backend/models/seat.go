package models

import "time"

type Seat struct {
	SeatID     int       `json:"seat_id" db:"seat_id"`
	TheaterID  int       `json:"theater_id" db:"theater_id"`
	SeatRow    string    `json:"seat_row" db:"seat_row"`
	SeatNumber int       `json:"seat_number" db:"seat_number"`
	SeatType   string    `json:"seat_type" db:"seat_type"`
	IsActive   bool      `json:"is_active" db:"is_active"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type CreateSeatRequest struct {
	TheaterID  int    `json:"theater_id" binding:"required"`
	SeatRow    string `json:"seat_row" binding:"required"`
	SeatNumber int    `json:"seat_number" binding:"required,min=1"`
	SeatType   string `json:"seat_type"`
}

type CreateSeatsRequest struct {
	TheaterID   int      `json:"theater_id" binding:"required"`
	Rows        []string `json:"rows" binding:"required"`
	SeatsPerRow int      `json:"seats_per_row" binding:"required,min=1"`
	SeatType    string   `json:"seat_type"`
}

type UpdateSeatRequest struct {
	SeatType *string `json:"seat_type"`
	IsActive *bool   `json:"is_active"`
}
