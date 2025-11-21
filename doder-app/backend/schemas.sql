-- ===================================
-- Movie Ticket Booking System
-- ===================================

-- 1. ตาราง Users (ผู้ใช้งาน)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ตาราง Cinemas (โรงภาพยนตร์)
CREATE TABLE cinemas (
    cinema_id SERIAL PRIMARY KEY,
    cinema_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ตาราง Theaters (โรงฉาย/ห้องฉายภายในโรงภาพยนตร์)
CREATE TABLE theaters (
    theater_id SERIAL PRIMARY KEY,
    cinema_id INTEGER NOT NULL REFERENCES cinemas(cinema_id),
    theater_name VARCHAR(100) NOT NULL,
    total_seats INTEGER NOT NULL,
    theater_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ตาราง Seats (ที่นั่ง)
CREATE TABLE seats (
    seat_id SERIAL PRIMARY KEY,
    theater_id INTEGER NOT NULL REFERENCES theaters(theater_id),
    seat_row VARCHAR(5) NOT NULL,
    seat_number INTEGER NOT NULL,
    seat_type VARCHAR(50) DEFAULT 'standard',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(theater_id, seat_row, seat_number)
);

-- 5. ตาราง Movies (หนัง)
CREATE TABLE movies (
    movie_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    language VARCHAR(50),
    subtitle VARCHAR(50),
    poster_url TEXT,
    release_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ตาราง Showtimes (รอบฉาย)
CREATE TABLE showtimes (
    showtime_id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movies(movie_id),
    theater_id INTEGER NOT NULL REFERENCES theaters(theater_id),
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    available_seats INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. ตาราง Bookings (การจอง)
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    showtime_id INTEGER NOT NULL REFERENCES showtimes(showtime_id),
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    booking_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    booking_code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. ตาราง Booking_Seats (ที่นั่งที่ถูกจอง)
CREATE TABLE booking_seats (
    booking_seat_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(booking_id),
    seat_id INTEGER NOT NULL REFERENCES seats(seat_id),
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(booking_id, seat_id)
);

-- 9. ตาราง Seat_Status (สถานะที่นั่งในแต่ละรอบฉาย)
CREATE TABLE seat_status (
    seat_status_id SERIAL PRIMARY KEY,
    showtime_id INTEGER NOT NULL REFERENCES showtimes(showtime_id),
    seat_id INTEGER NOT NULL REFERENCES seats(seat_id),
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    booking_id INTEGER REFERENCES bookings(booking_id),
    reserved_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(showtime_id, seat_id)
);

-- 10. ตาราง Admin_Logs (บันทึกการทำงานของ Admin)
CREATE TABLE admin_logs (
    log_id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(user_id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);