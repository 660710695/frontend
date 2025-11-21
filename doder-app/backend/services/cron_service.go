package services

import (
	"database/sql"
	"log"
	"time"
)

type CronService struct {
	db *sql.DB
}

func NewCronService(db *sql.DB) *CronService {
	return &CronService{db: db}
}

// StartCronJobs
func (s *CronService) StartCronJobs() {
	log.Println("🕐 Starting cron jobs...")

	// รัน auto-cancel expired reservations ทุก 1 นาที
	go s.runAutoCancelExpiredReservations()

	log.Println("✅ Cron jobs started successfully")
}

// runAutoCancelExpiredReservations ยกเลิกการจองที่หมดอายุอัตโนมัติ
func (s *CronService) runAutoCancelExpiredReservations() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	// รันทันทีครั้งแรก
	s.CancelExpiredReservations()

	// รันทุก 1 นาที
	for range ticker.C {
		s.CancelExpiredReservations()
	}
}

// CancelExpiredReservations ยกเลิกการจองที่หมดเวลา (Public - เรียกได้จาก handler)
func (s *CronService) CancelExpiredReservations() {
	now := time.Now()
	log.Printf("⏰ Running auto-cancel expired reservations at %s", now.Format("2006-01-02 15:04:05"))

	// เริ่ม transaction
	tx, err := s.db.Begin()
	if err != nil {
		log.Printf("❌ Failed to start transaction: %v", err)
		return
	}
	defer tx.Rollback()

	// 1. หาการจองที่หมดอายุ (reserved เกิน 10 นาที และยังไม่ชำระเงิน หรือยืนยันการจอง)
	query := `
		SELECT DISTINCT b.booking_id, b.showtime_id,
		       (SELECT COUNT(*) FROM booking_seats WHERE booking_id = b.booking_id) as seat_count
		FROM bookings b
		JOIN seat_status ss ON b.booking_id = ss.booking_id
		WHERE b.booking_status = 'pending'
		  AND b.payment_status = 'pending'
		  AND ss.status = 'reserved'
		  AND ss.reserved_until < $1
	`

	rows, err := tx.Query(query, now)
	if err != nil {
		log.Printf("❌ Failed to query expired reservations: %v", err)
		return
	}
	defer rows.Close()

	cancelledCount := 0
	expiredBookings := []struct {
		bookingID  int
		showtimeID int
		seatCount  int
	}{}

	for rows.Next() {
		var bookingID, showtimeID, seatCount int
		if err := rows.Scan(&bookingID, &showtimeID, &seatCount); err != nil {
			log.Printf("❌ Failed to scan row: %v", err)
			continue
		}
		expiredBookings = append(expiredBookings, struct {
			bookingID  int
			showtimeID int
			seatCount  int
		}{bookingID, showtimeID, seatCount})
	}

	// 2. ยกเลิกการจองที่หมดอายุแต่ละรายการ
	for _, expired := range expiredBookings {
		// 2.1 อัพเดทสถานะการจอง
		_, err := tx.Exec(`
			UPDATE bookings
			SET booking_status = 'cancelled', 
			    updated_at = CURRENT_TIMESTAMP
			WHERE booking_id = $1
		`, expired.bookingID)

		if err != nil {
			log.Printf("❌ Failed to cancel booking %d: %v", expired.bookingID, err)
			continue
		}

		// 2.2 ลบสถานะที่นั่ง (คืนที่นั่ง)
		_, err = tx.Exec(`
			DELETE FROM seat_status
			WHERE booking_id = $1 AND showtime_id = $2
		`, expired.bookingID, expired.showtimeID)

		if err != nil {
			log.Printf("❌ Failed to release seats for booking %d: %v", expired.bookingID, err)
			continue
		}

		// 2.3 คืนจำนวนที่นั่งว่าง
		_, err = tx.Exec(`
			UPDATE showtimes
			SET available_seats = available_seats + $1
			WHERE showtime_id = $2
		`, expired.seatCount, expired.showtimeID)

		if err != nil {
			log.Printf("❌ Failed to update available seats for showtime %d: %v", expired.showtimeID, err)
			continue
		}

		cancelledCount++
		log.Printf("✅ Cancelled expired booking %d (showtime: %d, seats: %d)",
			expired.bookingID, expired.showtimeID, expired.seatCount)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		log.Printf("❌ Failed to commit transaction: %v", err)
		return
	}

	if cancelledCount > 0 {
		log.Printf("✅ Auto-cancelled %d expired reservation(s)", cancelledCount)
	} else {
		log.Printf("✓ No expired reservations found")
	}
}

// CleanOldCancelledBookings ลบข้อมูลการจองที่ยกเลิกเก่าๆ (optional - รัน 1 วันครั้ง)
func (s *CronService) CleanOldCancelledBookings() {
	// ลบการจองที่ยกเลิกเกิน 30 วัน
	cutoffDate := time.Now().AddDate(0, 0, -30)

	result, err := s.db.Exec(`
		DELETE FROM bookings
		WHERE booking_status = 'cancelled'
		  AND created_at < $1
	`, cutoffDate)

	if err != nil {
		log.Printf("❌ Failed to clean old cancelled bookings: %v", err)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected > 0 {
		log.Printf("✅ Cleaned %d old cancelled booking(s)", rowsAffected)
	}
}

// GetCronStatus ดูสถานะ cronjob (optional - สำหรับ monitoring)
func (s *CronService) GetCronStatus() map[string]interface{} {
	status := map[string]interface{}{
		"running":  true,
		"last_run": time.Now().Format("2006-01-02 15:04:05"),
	}

	// นับจำนวนการจองที่รอหมดอายุ
	var pendingCount int
	s.db.QueryRow(`
		SELECT COUNT(DISTINCT b.booking_id)
		FROM bookings b
		JOIN seat_status ss ON b.booking_id = ss.booking_id
		WHERE b.booking_status = 'pending'
		  AND b.payment_status = 'pending'
		  AND ss.status = 'reserved'
		  AND ss.reserved_until > $1
	`, time.Now()).Scan(&pendingCount)

	status["pending_reservations"] = pendingCount

	// นับจำนวนการจองที่หมดอายุแล้ว (รอยกเลิก)
	var expiredCount int
	s.db.QueryRow(`
		SELECT COUNT(DISTINCT b.booking_id)
		FROM bookings b
		JOIN seat_status ss ON b.booking_id = ss.booking_id
		WHERE b.booking_status = 'pending'
		  AND b.payment_status = 'pending'
		  AND ss.status = 'reserved'
		  AND ss.reserved_until < $1
	`, time.Now()).Scan(&expiredCount)

	status["expired_reservations"] = expiredCount

	return status
}
