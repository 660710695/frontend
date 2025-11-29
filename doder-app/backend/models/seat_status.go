package models

import "time"

type SeatStatus struct {
	SeatStatusID  int        `json:"seat_status_id" db:"seat_status_id"`
	ShowtimeID    int        `json:"showtime_id" db:"showtime_id"`
	SeatID        int        `json:"seat_id" db:"seat_id"`
	Status        string     `json:"status" db:"status"`
	BookingID     *int       `json:"booking_id,omitempty" db:"booking_id"`
	ReservedUntil *time.Time `json:"reserved_until,omitempty" db:"reserved_until"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
}

type SeatStatusWithInfo struct {
	SeatStatusID  int        `json:"seat_status_id" db:"seat_status_id"`
	ShowtimeID    int        `json:"showtime_id" db:"showtime_id"`
	SeatID        int        `json:"seat_id" db:"seat_id"`
	SeatRow       string     `json:"seat_row" db:"seat_row"`
	SeatNumber    int        `json:"seat_number" db:"seat_number"`
	SeatType      string     `json:"seat_type" db:"seat_type"`
	Status        string     `json:"status" db:"status"`
	BookingID     *int       `json:"booking_id,omitempty" db:"booking_id"`
	ReservedUntil *time.Time `json:"reserved_until,omitempty" db:"reserved_until"`
}
