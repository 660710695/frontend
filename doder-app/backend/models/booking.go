package models

import "time"

type Booking struct {
	BookingID     int       `json:"booking_id" db:"booking_id"`
	UserID        int       `json:"user_id" db:"user_id"`
	ShowtimeID    int       `json:"showtime_id" db:"showtime_id"`
	BookingDate   time.Time `json:"booking_date" db:"booking_date"`
	TotalAmount   float64   `json:"total_amount" db:"total_amount"`
	BookingStatus string    `json:"booking_status" db:"booking_status"` // 'pending', 'confirmed', 'cancelled'
	PaymentStatus string    `json:"payment_status" db:"payment_status"` // 'pending', 'paid', 'refunded'
	BookingCode   string    `json:"booking_code" db:"booking_code"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

type BookingWithDetails struct {
	BookingID     int        `json:"booking_id"`
	BookingCode   string     `json:"booking_code"`
	UserID        int        `json:"user_id"`
	ShowtimeID    int        `json:"showtime_id"`
	MovieTitle    string     `json:"movie_title"`
	CinemaName    string     `json:"cinema_name"`
	TheaterName   string     `json:"theater_name"`
	ShowDate      string     `json:"show_date"`
	ShowTime      string     `json:"show_time"`
	TotalAmount   float64    `json:"total_amount"`
	BookingStatus string     `json:"booking_status"`
	PaymentStatus string     `json:"payment_status"`
	BookingDate   time.Time  `json:"booking_date"`
	Seats         []SeatInfo `json:"seats"`
}

type SeatInfo struct {
	SeatID     int     `json:"seat_id"`
	SeatRow    string  `json:"seat_row"`
	SeatNumber int     `json:"seat_number"`
	Price      float64 `json:"price"`
}

type CreateBookingRequest struct {
	ShowtimeID int   `json:"showtime_id" binding:"required"`
	SeatIDs    []int `json:"seat_ids" binding:"required,min=1"`
}

type ConfirmPaymentRequest struct {
	PaymentMethod string `json:"payment_method"` // 'credit_card', 'promptpay', 'cash'
}
