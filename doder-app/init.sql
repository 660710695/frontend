-- =====================================================
-- ระบบจองตั๋วหนัง Doder Cineplex
-- ไฟล์ SQL สำหรับสร้างฐานข้อมูลและข้อมูลตัวอย่าง
-- =====================================================

-- =====================================================
-- ส่วนที่ 1: สร้างตาราง (CREATE TABLES)
-- =====================================================

-- ผู้ใช้งาน
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

-- โรงภาพยนตร์
CREATE TABLE cinemas (
    cinema_id SERIAL PRIMARY KEY,
    cinema_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- โรงที่ฉาย
CREATE TABLE theaters (
    theater_id SERIAL PRIMARY KEY,
    cinema_id INTEGER NOT NULL REFERENCES cinemas(cinema_id) ON DELETE CASCADE,
    theater_name VARCHAR(100) NOT NULL,
    total_seats INTEGER NOT NULL,
    theater_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ที่นั่ง
CREATE TABLE seats (
    seat_id SERIAL PRIMARY KEY,
    theater_id INTEGER NOT NULL REFERENCES theaters(theater_id) ON DELETE CASCADE,
    seat_row VARCHAR(5) NOT NULL,
    seat_number INTEGER NOT NULL,
    seat_type VARCHAR(50) DEFAULT 'standard',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(theater_id, seat_row, seat_number)
);

-- หนัง
CREATE TABLE movies (
    movie_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    genres TEXT[] DEFAULT '{}',
    language VARCHAR(50),
    subtitle VARCHAR(50),
    poster_url TEXT,
    release_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง index สำหรับการค้นหาตาม genre
CREATE INDEX idx_movies_genres ON movies USING GIN(genres);

-- รอบฉาย
CREATE TABLE showtimes (
    showtime_id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
    theater_id INTEGER NOT NULL REFERENCES theaters(theater_id) ON DELETE CASCADE,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    available_seats INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- จองตั๋ว
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    showtime_id INTEGER NOT NULL REFERENCES showtimes(showtime_id) ON DELETE CASCADE,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    booking_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    booking_code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ที่นั่งที่ถูกจอง
CREATE TABLE booking_seats (
    booking_seat_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    seat_id INTEGER NOT NULL REFERENCES seats(seat_id),
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(booking_id, seat_id)
);

-- สถานะที่นั่งในแต่ละรอบฉาย
CREATE TABLE seat_status (
    seat_status_id SERIAL PRIMARY KEY,
    showtime_id INTEGER NOT NULL REFERENCES showtimes(showtime_id) ON DELETE CASCADE,
    seat_id INTEGER NOT NULL REFERENCES seats(seat_id),
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    booking_id INTEGER REFERENCES bookings(booking_id),
    reserved_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(showtime_id, seat_id)
);

-- =====================================================
-- ส่วนที่ 2: ข้อมูลผู้ใช้งาน (USERS)
-- =====================================================

INSERT INTO users (password_hash, first_name, last_name, phone, role)
VALUES
  ('$2a$10$bOg6DJkIZ6N2.ASxS89tT.Hd63byPSsa.nuz8PwxBEIq9Z8ufyJgy', 'Banlu', 'Chimsing', '0925165069', 'customer'),
  ('$2a$10$MHsLrWXBAH91Py3adN5IlOTff7wjL0xGJuNtVo0EbpJRpQlep4s9C', 'Prabda', 'Pleannuam', '0634432223', 'admin');

-- =====================================================
-- ส่วนที่ 3: ข้อมูลโรงภาพยนตร์ (CINEMAS)
-- =====================================================

-- นครปฐม (6 สาขา)
INSERT INTO cinemas (cinema_name, address, city)
VALUES
  ('Doder Cineplex', 'Central Nakhon Pathom 88 หมู่ 1 ถนนเพชรเกษม ตำบลสนามจันทร์ อำเภอเมืองนครปฐม', 'Nakhon Pathom'),
  ('Doder Cineplex', 'Lotus Nakhon Pathom 1048 ถนนเพชรเกษม ตำบลสนามจันทร์ อำเภอเมืองนครปฐม', 'Nakhon Pathom'),
  ('Doder Cineplex', 'Lotus Salaya 111 ถนนบรมราชชนนี ตำบลศาลายา อำเภอพุทธมณฑล', 'Nakhon Pathom'),
  ('Doder Cineplex', 'Lotus Sampran 99 ถนนเพชรเกษม ตำบลสามพราน อำเภอสามพราน', 'Nakhon Pathom'),
  ('Doder Cineplex', 'Lotus Kamphaeng Saen 555 ถนนมาลัยแมน ตำบลกำแพงแสน อำเภอกำแพงแสน', 'Nakhon Pathom'),
  ('Doder Cineplex', 'Big C Ommoi 222 ถนนเพชรเกษม ตำบลอ้อมใหญ่ อำเภอสามพราน', 'Nakhon Pathom');

-- กรุงเทพ (10 สาขา)
INSERT INTO cinemas (cinema_name, address, city)
VALUES
  ('Doder IMAX', 'Siam Paragon 991 ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน', 'Bangkok'),
  ('Doder Cineplex', 'Sukhumvit-Ekamai 1839 ถนนสุขุมวิท แขวงพระโขนงเหนือ เขตวัฒนา', 'Bangkok'),
  ('Doder Cineplex', 'Ratchayothin 1839 ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร', 'Bangkok'),
  ('Doder Cineplex', 'Esplanade Ratchadapisek 99 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง', 'Bangkok'),
  ('Doder Cineplex', 'Central Pinklao 7 ถนนบรมราชชนนี แขวงอรุณอมรินทร์ เขตบางกอกน้อย', 'Bangkok'),
  ('Doder Cineplex', 'Central World 999 ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน', 'Bangkok'),
  ('Doder Cineplex', 'MBK Center 444 ถนนพญาไท แขวงวังใหม่ เขตปทุมวัน', 'Bangkok'),
  ('Doder Cineplex', 'Central Ladprao 1691 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร', 'Bangkok'),
  ('Doder Cineplex', 'Central Rama 9 9 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง', 'Bangkok'),
  ('Doder Cineplex', 'Icon Siam 299 ถนนเจริญนคร แขวงคลองต้นไทร เขตคลองสาน', 'Bangkok');

-- =====================================================
-- ส่วนที่ 4: ข้อมูลโรงฉาย (THEATERS)
-- =====================================================

-- Central Nakhon Pathom (2 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 150, 'standard' FROM cinemas WHERE address LIKE '%Central Nakhon Pathom%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 150, 'standard' FROM cinemas WHERE address LIKE '%Central Nakhon Pathom%';

-- Lotus Nakhon Pathom (2 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 150, 'standard' FROM cinemas WHERE address LIKE '%Lotus Nakhon Pathom%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 150, 'standard' FROM cinemas WHERE address LIKE '%Lotus Nakhon Pathom%';

-- Lotus Salaya (5 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 120, 'standard' FROM cinemas WHERE address LIKE '%Lotus Salaya%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 120, 'standard' FROM cinemas WHERE address LIKE '%Lotus Salaya%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 3', 100, 'standard' FROM cinemas WHERE address LIKE '%Lotus Salaya%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 4', 100, 'standard' FROM cinemas WHERE address LIKE '%Lotus Salaya%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 5', 80, 'premium' FROM cinemas WHERE address LIKE '%Lotus Salaya%';

-- Lotus Sampran (4 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 120, 'standard' FROM cinemas WHERE address LIKE '%Lotus Sampran%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 120, 'standard' FROM cinemas WHERE address LIKE '%Lotus Sampran%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 3', 100, 'standard' FROM cinemas WHERE address LIKE '%Lotus Sampran%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 4', 80, 'premium' FROM cinemas WHERE address LIKE '%Lotus Sampran%';

-- Lotus Kamphaeng Saen (3 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 100, 'standard' FROM cinemas WHERE address LIKE '%Lotus Kamphaeng Saen%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 100, 'standard' FROM cinemas WHERE address LIKE '%Lotus Kamphaeng Saen%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 3', 80, 'standard' FROM cinemas WHERE address LIKE '%Lotus Kamphaeng Saen%';

-- Big C Ommoi (3 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 100, 'standard' FROM cinemas WHERE address LIKE '%Big C Ommoi%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 100, 'standard' FROM cinemas WHERE address LIKE '%Big C Ommoi%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 3', 80, 'standard' FROM cinemas WHERE address LIKE '%Big C Ommoi%';

-- Siam Paragon (8 โรง - flagship)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'IMAX', 450, 'imax' FROM cinemas WHERE address LIKE '%Siam Paragon%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 200, 'premium' FROM cinemas WHERE address LIKE '%Siam Paragon%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 200, 'premium' FROM cinemas WHERE address LIKE '%Siam Paragon%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 3', 180, 'standard' FROM cinemas WHERE address LIKE '%Siam Paragon%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 4', 180, 'standard' FROM cinemas WHERE address LIKE '%Siam Paragon%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 5', 150, 'standard' FROM cinemas WHERE address LIKE '%Siam Paragon%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 6', 150, 'standard' FROM cinemas WHERE address LIKE '%Siam Paragon%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'VIP', 50, 'vip' FROM cinemas WHERE address LIKE '%Siam Paragon%';

-- Sukhumvit-Ekamai (6 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 180, 'standard' FROM cinemas WHERE address LIKE '%Sukhumvit-Ekamai%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 180, 'standard' FROM cinemas WHERE address LIKE '%Sukhumvit-Ekamai%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 3', 150, 'standard' FROM cinemas WHERE address LIKE '%Sukhumvit-Ekamai%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 4', 150, 'standard' FROM cinemas WHERE address LIKE '%Sukhumvit-Ekamai%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 5', 120, 'standard' FROM cinemas WHERE address LIKE '%Sukhumvit-Ekamai%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 6', 80, 'premium' FROM cinemas WHERE address LIKE '%Sukhumvit-Ekamai%';

-- Ratchayothin (6 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 200, 'standard' FROM cinemas WHERE address LIKE '%Ratchayothin%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 180, 'standard' FROM cinemas WHERE address LIKE '%Ratchayothin%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 3', 150, 'standard' FROM cinemas WHERE address LIKE '%Ratchayothin%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 4', 150, 'standard' FROM cinemas WHERE address LIKE '%Ratchayothin%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 5', 120, 'standard' FROM cinemas WHERE address LIKE '%Ratchayothin%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 6', 80, 'premium' FROM cinemas WHERE address LIKE '%Ratchayothin%';

-- Esplanade Ratchadapisek (6 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 200, 'standard' FROM cinemas WHERE address LIKE '%Esplanade%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 180, 'standard' FROM cinemas WHERE address LIKE '%Esplanade%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 3', 150, 'standard' FROM cinemas WHERE address LIKE '%Esplanade%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 4', 150, 'standard' FROM cinemas WHERE address LIKE '%Esplanade%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 5', 120, 'standard' FROM cinemas WHERE address LIKE '%Esplanade%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 6', 80, 'premium' FROM cinemas WHERE address LIKE '%Esplanade%';

-- Central Pinklao (5 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 180, 'standard' FROM cinemas WHERE address LIKE '%Central Pinklao%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 150, 'standard' FROM cinemas WHERE address LIKE '%Central Pinklao%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 3', 150, 'standard' FROM cinemas WHERE address LIKE '%Central Pinklao%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 4', 120, 'standard' FROM cinemas WHERE address LIKE '%Central Pinklao%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 5', 80, 'premium' FROM cinemas WHERE address LIKE '%Central Pinklao%';

-- Central World (7 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 200, 'standard' FROM cinemas WHERE address LIKE '%Central World%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 200, 'standard' FROM cinemas WHERE address LIKE '%Central World%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 3', 180, 'standard' FROM cinemas WHERE address LIKE '%Central World%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 4', 150, 'standard' FROM cinemas WHERE address LIKE '%Central World%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 5', 150, 'standard' FROM cinemas WHERE address LIKE '%Central World%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 6', 120, 'standard' FROM cinemas WHERE address LIKE '%Central World%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'VIP', 50, 'vip' FROM cinemas WHERE address LIKE '%Central World%';

-- MBK Center (5 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 180, 'standard' FROM cinemas WHERE address LIKE '%MBK Center%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 150, 'standard' FROM cinemas WHERE address LIKE '%MBK Center%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 3', 150, 'standard' FROM cinemas WHERE address LIKE '%MBK Center%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 4', 120, 'standard' FROM cinemas WHERE address LIKE '%MBK Center%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 5', 100, 'standard' FROM cinemas WHERE address LIKE '%MBK Center%';

-- Central Ladprao (6 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 200, 'standard' FROM cinemas WHERE address LIKE '%Central Ladprao%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 180, 'standard' FROM cinemas WHERE address LIKE '%Central Ladprao%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 3', 150, 'standard' FROM cinemas WHERE address LIKE '%Central Ladprao%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 4', 150, 'standard' FROM cinemas WHERE address LIKE '%Central Ladprao%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 5', 120, 'standard' FROM cinemas WHERE address LIKE '%Central Ladprao%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 6', 80, 'premium' FROM cinemas WHERE address LIKE '%Central Ladprao%';

-- Central Rama 9 (6 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 200, 'standard' FROM cinemas WHERE address LIKE '%Central Rama 9%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 180, 'standard' FROM cinemas WHERE address LIKE '%Central Rama 9%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 3', 150, 'standard' FROM cinemas WHERE address LIKE '%Central Rama 9%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 4', 150, 'standard' FROM cinemas WHERE address LIKE '%Central Rama 9%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 5', 120, 'standard' FROM cinemas WHERE address LIKE '%Central Rama 9%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 6', 80, 'premium' FROM cinemas WHERE address LIKE '%Central Rama 9%';

-- Icon Siam (7 โรง)
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 1', 200, 'premium' FROM cinemas WHERE address LIKE '%Icon Siam%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 2', 200, 'premium' FROM cinemas WHERE address LIKE '%Icon Siam%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 3', 180, 'standard' FROM cinemas WHERE address LIKE '%Icon Siam%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 4', 150, 'standard' FROM cinemas WHERE address LIKE '%Icon Siam%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 5', 150, 'standard' FROM cinemas WHERE address LIKE '%Icon Siam%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'โรง 6', 120, 'standard' FROM cinemas WHERE address LIKE '%Icon Siam%';
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
SELECT cinema_id, 'VIP', 40, 'vip' FROM cinemas WHERE address LIKE '%Icon Siam%';

-- =====================================================
-- ส่วนที่ 5: ข้อมูลที่นั่ง (SEATS)
-- =====================================================

-- ที่นั่งสำหรับโรง 150 ที่นั่ง (5 แถว x 30 ที่นั่ง)
INSERT INTO seats (theater_id, seat_row, seat_number, seat_type)
SELECT 
    t.theater_id,
    chr(64 + row_num) as seat_row,
    seat_num,
    CASE WHEN row_num <= 2 THEN 'premium' ELSE 'standard' END as seat_type
FROM 
    theaters t
    CROSS JOIN generate_series(1, 5) row_num
    CROSS JOIN generate_series(1, 30) seat_num
WHERE 
    t.total_seats = 150;

-- ที่นั่งสำหรับโรง VIP 40-50 ที่นั่ง (5 แถว x 8-10 ที่นั่ง)
INSERT INTO seats (theater_id, seat_row, seat_number, seat_type)
SELECT 
    t.theater_id,
    chr(64 + row_num) as seat_row,
    seat_num,
    'vip' as seat_type
FROM 
    theaters t
    CROSS JOIN generate_series(1, 5) row_num
    CROSS JOIN generate_series(1, 10) seat_num
WHERE 
    t.total_seats BETWEEN 40 AND 50
    AND NOT EXISTS (SELECT 1 FROM seats s WHERE s.theater_id = t.theater_id);

-- ที่นั่งสำหรับโรง 80 ที่นั่ง (4 แถว x 20 ที่นั่ง)
INSERT INTO seats (theater_id, seat_row, seat_number, seat_type)
SELECT 
    t.theater_id,
    chr(64 + row_num) as seat_row,
    seat_num,
    CASE WHEN row_num <= 1 THEN 'premium' ELSE 'standard' END as seat_type
FROM 
    theaters t
    CROSS JOIN generate_series(1, 4) row_num
    CROSS JOIN generate_series(1, 20) seat_num
WHERE 
    t.total_seats = 80
    AND NOT EXISTS (SELECT 1 FROM seats s WHERE s.theater_id = t.theater_id);

-- ที่นั่งสำหรับโรง 100 ที่นั่ง (5 แถว x 20 ที่นั่ง)
INSERT INTO seats (theater_id, seat_row, seat_number, seat_type)
SELECT 
    t.theater_id,
    chr(64 + row_num) as seat_row,
    seat_num,
    CASE WHEN row_num <= 2 THEN 'premium' ELSE 'standard' END as seat_type
FROM 
    theaters t
    CROSS JOIN generate_series(1, 5) row_num
    CROSS JOIN generate_series(1, 20) seat_num
WHERE 
    t.total_seats = 100
    AND NOT EXISTS (SELECT 1 FROM seats s WHERE s.theater_id = t.theater_id);

-- ที่นั่งสำหรับโรง 120 ที่นั่ง (6 แถว x 20 ที่นั่ง)
INSERT INTO seats (theater_id, seat_row, seat_number, seat_type)
SELECT 
    t.theater_id,
    chr(64 + row_num) as seat_row,
    seat_num,
    CASE WHEN row_num <= 2 THEN 'premium' ELSE 'standard' END as seat_type
FROM 
    theaters t
    CROSS JOIN generate_series(1, 6) row_num
    CROSS JOIN generate_series(1, 20) seat_num
WHERE 
    t.total_seats = 120
    AND NOT EXISTS (SELECT 1 FROM seats s WHERE s.theater_id = t.theater_id);

-- ที่นั่งสำหรับโรง 180 ที่นั่ง (6 แถว x 30 ที่นั่ง)
INSERT INTO seats (theater_id, seat_row, seat_number, seat_type)
SELECT 
    t.theater_id,
    chr(64 + row_num) as seat_row,
    seat_num,
    CASE WHEN row_num <= 2 THEN 'premium' ELSE 'standard' END as seat_type
FROM 
    theaters t
    CROSS JOIN generate_series(1, 6) row_num
    CROSS JOIN generate_series(1, 30) seat_num
WHERE 
    t.total_seats = 180
    AND NOT EXISTS (SELECT 1 FROM seats s WHERE s.theater_id = t.theater_id);

-- ที่นั่งสำหรับโรง 200 ที่นั่ง (8 แถว x 25 ที่นั่ง)
INSERT INTO seats (theater_id, seat_row, seat_number, seat_type)
SELECT 
    t.theater_id,
    chr(64 + row_num) as seat_row,
    seat_num,
    CASE WHEN row_num <= 2 THEN 'premium' ELSE 'standard' END as seat_type
FROM 
    theaters t
    CROSS JOIN generate_series(1, 8) row_num
    CROSS JOIN generate_series(1, 25) seat_num
WHERE 
    t.total_seats = 200
    AND NOT EXISTS (SELECT 1 FROM seats s WHERE s.theater_id = t.theater_id);

-- ที่นั่งสำหรับโรง IMAX 450 ที่นั่ง (15 แถว x 30 ที่นั่ง)
INSERT INTO seats (theater_id, seat_row, seat_number, seat_type)
SELECT 
    t.theater_id,
    chr(64 + row_num) as seat_row,
    seat_num,
    CASE 
        WHEN row_num BETWEEN 6 AND 10 THEN 'premium'
        ELSE 'standard' 
    END as seat_type
FROM 
    theaters t
    CROSS JOIN generate_series(1, 15) row_num
    CROSS JOIN generate_series(1, 30) seat_num
WHERE 
    t.theater_type = 'imax'
    AND NOT EXISTS (SELECT 1 FROM seats s WHERE s.theater_id = t.theater_id);

-- =====================================================
-- ส่วนที่ 6: ข้อมูลภาพยนตร์ (MOVIES)
-- =====================================================

INSERT INTO movies (title, description, duration, genres, language, subtitle, poster_url, release_date, is_active)
VALUES
  ('My Boo 2', 'ภาคต่อของเรื่องราวความรักระหว่างมนุษย์กับผี ที่จะต้องเผชิญกับอุปสรรคใหม่', 105, ARRAY['Horror', 'Romance', 'Comedy'], 'ไทย', NULL, '/uploads/posters/my_boo_2.jpg', '2025-11-21', TRUE),
  ('Zootopia 2', 'การผจญภัยครั้งใหม่ของจูดี้ ฮอปส์ และนิค ไวลด์ ในเมืองที่สัตว์ทุกชนิดอยู่ร่วมกัน', 100, ARRAY['Animation', 'Adventure', 'Comedy', 'Family'], 'อังกฤษ', 'ไทย', '/uploads/posters/zootopia_2.jpg', '2025-11-27', TRUE),
  ('The Gunman', 'นักฆ่ามืออาชีพที่ต้องหนีไล่ล่าจากองค์กรลับ พร้อมเปิดเผยความจริงที่ถูกปิดบัง', 118, ARRAY['Action', 'Thriller'], 'อังกฤษ', 'ไทย', '/uploads/posters/the_gunman.jpg', '2025-11-15', TRUE),
  ('4 เสือ (4 Tigers)', 'สี่เสือในจักรวาลขุนพันธ์ที่ต้องร่วมมือกันเพื่อปกป้องดินแดน เรื่องราวแอ็คชั่นสุดมันส์', 140, ARRAY['Action', 'Crime', 'Drama'], 'ไทย', NULL, '/uploads/posters/4_tigers.jpg', '2025-10-23', TRUE),
  ('Dune: Part One', 'เจ้าชายหนุ่มต้องเดินทางไปยังดาวทะเลทรายที่อันตรายที่สุดเพื่อปกป้องอนาคตของครอบครัว', 155, ARRAY['Sci-Fi', 'Adventure'], 'อังกฤษ', 'ไทย', '/uploads/posters/dune.jpg', '2021-10-22', TRUE),
  ('Oppenheimer', 'เรื่องราวของ เจ. โรเบิร์ต ออปเพนไฮเมอร์ ผู้นำโครงการแมนฮัตตันสร้างระเบิดปรมาณู', 180, ARRAY['Biography', 'Drama'], 'อังกฤษ', 'ไทย', '/uploads/posters/oppenheimer.jpg', '2023-07-21', TRUE),
  ('Top Gun: Maverick', 'พีท มาเวอริค กลับมาฝึกนักบินรุ่นใหม่สำหรับภารกิจสุดเสี่ยง', 131, ARRAY['Action', 'Drama'], 'อังกฤษ', 'ไทย', '/uploads/posters/top_gun.jpg', '2022-05-27', TRUE),
  ('Everything Everywhere All at Once', 'หญิงนักทำบัญชีถูกดึงเข้าสู่การผจญภัยสุดบ้าคลั่งในมัลติเวิร์สเพื่อกอบกู้โลก', 139, ARRAY['Sci-Fi', 'Comedy', 'Action'], 'อังกฤษ', 'ไทย', '/uploads/posters/everything_everywhere_all_at_once.jpg', '2022-03-25', TRUE),
  ('Extraction 2', 'ทหารรับจ้างต้องทำภารกิจอันตรายเพื่อช่วยครอบครัวของเจ้าพ่อค้ายาที่ถูกลักพาตัว', 117, ARRAY['Action', 'Thriller'], 'อังกฤษ', 'ไทย', '/uploads/posters/extraction_2.jpg', '2023-06-16', TRUE),
  ('Godzilla Minus One', 'ญี่ปุ่นหลังสงครามต้องเผชิญหน้ากับภัยครั้งใหม่จากก็อดซิลลายักษ์', 124, ARRAY['Action', 'Sci-Fi'], 'ญี่ปุ่น', 'ไทย', '/uploads/posters/godzilla_minus_one.jpg', '2023-12-01', TRUE),
  ('Black Panther: Wakanda Forever', 'วาคานด้าปกป้องประเทศจากภัยคุกคามใหม่หลังการจากไปของกษัตริย์', 161, ARRAY['Superhero', 'Action', 'Drama'], 'อังกฤษ', 'ไทย', '/uploads/posters/black_panther_wakanda_forever.jpg', '2022-11-11', TRUE),
  ('Parasite', 'ครอบครัวยากจนแทรกซึมเข้าไปในชีวิตของครอบครัวร่ำรวยจนเกิดเหตุไม่คาดฝัน', 132, ARRAY['Drama', 'Thriller'], 'เกาหลี', 'ไทย', '/uploads/posters/parasite.jpg', '2020-02-07', TRUE),
  ('Cruella', 'เรื่องราวเบื้องหลังของวายร้ายสุดชิค ครูเอลลา เดอ วิล ในช่วงปี 1970 ณ ลอนดอน', 134, ARRAY['Comedy', 'Crime'], 'อังกฤษ', 'ไทย', '/uploads/posters/cruella.jpg', '2021-05-28', TRUE),
  ('A Quiet Place Part II', 'ครอบครัวแอ๊บบอตต้องออกเดินทางเผชิญหน้ากับความน่าสะพรึงกลัวของโลกภายนอก', 97, ARRAY['Horror', 'Sci-Fi'], 'อังกฤษ', 'ไทย', '/uploads/posters/a_quiet_place_part_2.jpg', '2021-05-28', TRUE);

-- =====================================================
-- ส่วนที่ 7: ข้อมูลรอบฉาย (SHOWTIMES)
-- แต่ละสาขาฉาย 3-4 เรื่อง
-- =====================================================

-- Central Nakhon Pathom: ฉาย 4 เรื่อง (My Boo 2, Zootopia 2, 4 Tigers, Top Gun)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    200.00,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('10:30'), ('13:30'), ('16:30'), ('19:30'), ('22:00')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('My Boo 2', 'Zootopia 2', '4 เสือ (4 Tigers)', 'Top Gun: Maverick')
    ) m
WHERE c.address LIKE '%Central Nakhon Pathom%';

-- Lotus Nakhon Pathom: ฉาย 4 เรื่อง (The Gunman, Dune, Oppenheimer, Everything Everywhere)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    200.00,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('11:00'), ('14:00'), ('17:00'), ('20:00'), ('22:30')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('The Gunman', 'Dune: Part One', 'Oppenheimer', 'Everything Everywhere All at Once')
    ) m
WHERE c.address LIKE '%Lotus Nakhon Pathom%';

-- Lotus Salaya: ฉาย 4 เรื่อง (Zootopia 2, My Boo 2, Extraction 2, Godzilla)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    CASE WHEN t.theater_type = 'premium' THEN 280.00 ELSE 200.00 END,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('10:30'), ('13:00'), ('15:30'), ('18:00'), ('20:30')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('Zootopia 2', 'My Boo 2', 'Extraction 2', 'Godzilla Minus One')
    ) m
WHERE c.address LIKE '%Lotus Salaya%';

-- Lotus Sampran: ฉาย 3 เรื่อง (4 Tigers, Top Gun, Black Panther)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    CASE WHEN t.theater_type = 'premium' THEN 280.00 ELSE 200.00 END,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('11:00'), ('14:00'), ('17:00'), ('20:00'), ('22:30')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('4 เสือ (4 Tigers)', 'Top Gun: Maverick', 'Black Panther: Wakanda Forever')
    ) m
WHERE c.address LIKE '%Lotus Sampran%';

-- Lotus Kamphaeng Saen: ฉาย 3 เรื่อง (Zootopia 2, My Boo 2, Cruella)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    180.00,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('12:00'), ('14:30'), ('17:00'), ('19:30')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('Zootopia 2', 'My Boo 2', 'Cruella')
    ) m
WHERE c.address LIKE '%Lotus Kamphaeng Saen%';

-- Big C Ommoi: ฉาย 3 เรื่อง (Parasite, A Quiet Place, The Gunman)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    180.00,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('11:30'), ('14:00'), ('16:30'), ('19:00'), ('21:30')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('Parasite', 'A Quiet Place Part II', 'The Gunman')
    ) m
WHERE c.address LIKE '%Big C Ommoi%';

-- Siam Paragon: ฉาย 4 เรื่อง (Zootopia 2, Dune, Oppenheimer, Top Gun)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    CASE 
        WHEN t.theater_type = 'imax' THEN 450.00
        WHEN t.theater_type = 'vip' THEN 800.00
        WHEN t.theater_type = 'premium' THEN 350.00
        ELSE 280.00
    END,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('10:00'), ('12:30'), ('15:00'), ('17:30'), ('20:00'), ('22:30')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('Zootopia 2', 'Dune: Part One', 'Oppenheimer', 'Top Gun: Maverick')
    ) m
WHERE c.address LIKE '%Siam Paragon%';

-- Sukhumvit-Ekamai: ฉาย 4 เรื่อง (My Boo 2, 4 Tigers, Extraction 2, Everything Everywhere)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    CASE WHEN t.theater_type = 'premium' THEN 300.00 ELSE 220.00 END,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('10:30'), ('13:00'), ('15:30'), ('18:00'), ('20:30'), ('23:00')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('My Boo 2', '4 เสือ (4 Tigers)', 'Extraction 2', 'Everything Everywhere All at Once')
    ) m
WHERE c.address LIKE '%Sukhumvit-Ekamai%';

-- Ratchayothin: ฉาย 4 เรื่อง (Zootopia 2, Godzilla, Black Panther, Cruella)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    CASE WHEN t.theater_type = 'premium' THEN 300.00 ELSE 220.00 END,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('11:00'), ('13:30'), ('16:00'), ('18:30'), ('21:00')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('Zootopia 2', 'Godzilla Minus One', 'Black Panther: Wakanda Forever', 'Cruella')
    ) m
WHERE c.address LIKE '%Ratchayothin%';

-- Esplanade: ฉาย 4 เรื่อง (My Boo 2, The Gunman, Parasite, A Quiet Place)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    CASE WHEN t.theater_type = 'premium' THEN 300.00 ELSE 220.00 END,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('10:00'), ('12:30'), ('15:00'), ('17:30'), ('20:00'), ('22:30')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('My Boo 2', 'The Gunman', 'Parasite', 'A Quiet Place Part II')
    ) m
WHERE c.address LIKE '%Esplanade%';

-- Central Pinklao: ฉาย 3 เรื่อง (Zootopia 2, 4 Tigers, Top Gun)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    CASE WHEN t.theater_type = 'premium' THEN 280.00 ELSE 200.00 END,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('11:00'), ('13:30'), ('16:00'), ('18:30'), ('21:00')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('Zootopia 2', '4 เสือ (4 Tigers)', 'Top Gun: Maverick')
    ) m
WHERE c.address LIKE '%Central Pinklao%';

-- Central World: ฉาย 4 เรื่อง (Dune, Oppenheimer, Everything Everywhere, Godzilla)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    CASE WHEN t.theater_type = 'vip' THEN 700.00 ELSE 250.00 END,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('10:00'), ('12:30'), ('15:00'), ('17:30'), ('20:00'), ('22:30')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('Dune: Part One', 'Oppenheimer', 'Everything Everywhere All at Once', 'Godzilla Minus One')
    ) m
WHERE c.address LIKE '%Central World%';

-- MBK Center: ฉาย 3 เรื่อง (My Boo 2, Zootopia 2, Cruella)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    200.00,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('10:30'), ('13:00'), ('15:30'), ('18:00'), ('20:30')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('My Boo 2', 'Zootopia 2', 'Cruella')
    ) m
WHERE c.address LIKE '%MBK Center%';

-- Central Ladprao: ฉาย 4 เรื่อง (4 Tigers, Extraction 2, Black Panther, The Gunman)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    CASE WHEN t.theater_type = 'premium' THEN 300.00 ELSE 220.00 END,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('10:00'), ('12:30'), ('15:00'), ('17:30'), ('20:00'), ('22:30')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('4 เสือ (4 Tigers)', 'Extraction 2', 'Black Panther: Wakanda Forever', 'The Gunman')
    ) m
WHERE c.address LIKE '%Central Ladprao%';

-- Central Rama 9: ฉาย 4 เรื่อง (Zootopia 2, Top Gun, Parasite, A Quiet Place)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    CASE WHEN t.theater_type = 'premium' THEN 300.00 ELSE 220.00 END,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('11:00'), ('13:30'), ('16:00'), ('18:30'), ('21:00'), ('23:30')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('Zootopia 2', 'Top Gun: Maverick', 'Parasite', 'A Quiet Place Part II')
    ) m
WHERE c.address LIKE '%Central Rama 9%';

-- Icon Siam: ฉาย 4 เรื่อง (Dune, Oppenheimer, My Boo 2, Everything Everywhere)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    m.movie_id,
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + (m.duration || ' minutes')::INTERVAL)::TIME,
    CASE 
        WHEN t.theater_type = 'vip' THEN 900.00
        WHEN t.theater_type = 'premium' THEN 400.00
        ELSE 300.00
    END,
    t.total_seats,
    TRUE
FROM 
    cinemas c
    JOIN theaters t ON c.cinema_id = t.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('10:00'), ('12:30'), ('15:00'), ('17:30'), ('20:00'), ('22:30')) AS times(st)
    CROSS JOIN (
        SELECT movie_id, duration FROM movies 
        WHERE title IN ('Dune: Part One', 'Oppenheimer', 'My Boo 2', 'Everything Everywhere All at Once')
    ) m
WHERE c.address LIKE '%Icon Siam%';

-- =====================================================
-- ส่วนที่ 8: รอบฉายพิเศษ
-- =====================================================

-- Zootopia 2 รอบพิเศษที่ IMAX
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    (SELECT movie_id FROM movies WHERE title = 'Zootopia 2'),
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + INTERVAL '100 minutes')::TIME,
    480.00,
    t.total_seats,
    TRUE
FROM 
    theaters t
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('09:00'), ('11:30'), ('14:00'), ('16:30'), ('19:00'), ('21:30')) AS times(st)
WHERE 
    t.theater_type = 'imax';

-- My Boo 2 รอบดึก (Midnight Screening)
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    (SELECT movie_id FROM movies WHERE title = 'My Boo 2'),
    t.theater_id,
    d::DATE,
    '23:59'::TIME,
    '01:44'::TIME,
    250.00,
    t.total_seats,
    TRUE
FROM 
    theaters t
    JOIN cinemas c ON t.cinema_id = c.cinema_id
    CROSS JOIN generate_series('2025-12-05'::DATE, '2025-12-06'::DATE, '1 day') d
WHERE 
    t.theater_name = 'โรง 1'
    AND c.city = 'Bangkok';

-- 4 Tigers รอบพิเศษนครปฐม
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
SELECT 
    (SELECT movie_id FROM movies WHERE title = '4 เสือ (4 Tigers)'),
    t.theater_id,
    d::DATE,
    times.st::TIME,
    (times.st::TIME + INTERVAL '140 minutes')::TIME,
    250.00,
    t.total_seats,
    TRUE
FROM 
    theaters t
    JOIN cinemas c ON t.cinema_id = c.cinema_id
    CROSS JOIN generate_series('2025-12-01'::DATE, '2025-12-06'::DATE, '1 day') d
    CROSS JOIN (VALUES ('13:00'), ('16:30'), ('20:00')) AS times(st)
WHERE 
    t.theater_name = 'โรง 2'
    AND c.city = 'Nakhon Pathom';