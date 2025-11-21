package models

import "time"

type Cinema struct {
	CinemaID   int       `json:"cinema_id" db:"cinema_id"`
	CinemaName string    `json:"cinema_name" db:"cinema_name"`
	Address    string    `json:"address" db:"address"`
	City       string    `json:"city" db:"city"`
	IsActive   bool      `json:"is_active" db:"is_active"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

type CreateCinemaRequest struct {
	CinemaName string `json:"cinema_name" binding:"required"`
	Address    string `json:"address" binding:"required"`
	City       string `json:"city" binding:"required"`
}

type UpdateCinemaRequest struct {
	CinemaName *string `json:"cinema_name"`
	Address    *string `json:"address"`
	City       *string `json:"city"`
	IsActive   *bool   `json:"is_active"`
}
