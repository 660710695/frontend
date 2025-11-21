package models

import "time"

type BookingSeat struct {
	BookingSeatID int       `json:"booking_seat_id" db:"booking_seat_id"`
	BookingID     int       `json:"booking_id" db:"booking_id"`
	SeatID        int       `json:"seat_id" db:"seat_id"`
	Price         float64   `json:"price" db:"price"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}
