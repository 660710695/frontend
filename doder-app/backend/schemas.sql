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

-- insert

-- ผู้ใช้งาน
INSERT INTO users (password_hash, first_name, last_name, phone, role)
VALUES
  ('hash1', 'สมชาย', 'ใจดี', '0812345678', 'customer'),
  ('hash2', 'ดาริน', 'พันธุ์สุข', '0898765432', 'customer'),
  ('hash3', 'นนท์', 'มากทรัพย์', '0801122334', 'admin');

-- โรงภาพยนตร์
INSERT INTO cinemas (cinema_name, address, city)
VALUES
  ('Major Cineplex', 'Central Nakhon Pathom', 'Nakhon Pathom'),
  ('Major Cineplex', 'Lotus Nakhon Pathom', 'Nakhon Pathom');

-- โรงที่ฉาย
INSERT INTO theaters (cinema_id, theater_name, total_seats, theater_type)
VALUES
  ((SELECT cinema_id FROM cinemas WHERE address = 'Central Nakhon Pathom'), 'โรง 1', 150, 'standard'),
  ((SELECT cinema_id FROM cinemas WHERE address = 'Central Nakhon Pathom'), 'โรง 2', 150, 'standard'),
  ((SELECT cinema_id FROM cinemas WHERE address = 'Lotus Nakhon Pathom'), 'โรง 1', 150, 'standard'),
  ((SELECT cinema_id FROM cinemas WHERE address = 'Lotus Nakhon Pathom'), 'โรง 2', 150, 'standard');

-- หนัง
INSERT INTO movies (title, description, duration, genres, language, subtitle, poster_url, release_date, is_active)
VALUES
  ('ธี่หยด 3', 'ภาคต่อสุดหลอนของเรื่องราว...', 105, ARRAY['Horror', 'Thriller'], 'ไทย', NULL, 'https://example.com/tee_yod_3_poster.jpg', '2025-10-01', TRUE),
  ('4 เสือ (4 Tigers)', 'สี่เสือในจักรวาลขุนพันธ์...', 140, ARRAY['Action', 'Crime'], 'ไทย', NULL, 'https://example.com/4_tigers_poster.jpg', '2025-10-23', TRUE),
  ('หลานม่า', 'เรื่องราวความผูกพันระหว่างหลานกับยาย...', 125, ARRAY['Drama', 'Family'], 'ไทย', NULL, 'https://example.com/lan_ma_poster.jpg', '2024-04-18', TRUE),
  ('สัปเหร่อ', 'หนังผีสุดหลอนจากค่าย GDH...', 130, ARRAY['Horror', 'Comedy'], 'ไทย', NULL, 'https://example.com/sappherao_poster.jpg', '2023-10-19', TRUE),
  ('Venom: The Last Dance', 'การผจญภัยครั้งสุดท้ายของเวน่อม...', 140, ARRAY['Action', 'Sci-Fi', 'Adventure'], 'อังกฤษ', 'ไทย', 'https://example.com/venom3_poster.jpg', '2024-10-25', TRUE),
  ('Moana 2', 'การเดินทางครั้งใหม่ของโมอาน่า...', 100, ARRAY['Animation', 'Adventure', 'Family'], 'อังกฤษ', 'ไทย', 'https://example.com/moana2_poster.jpg', '2024-11-27', TRUE),
  ('Wicked', 'เรื่องราวก่อนพ่อมดแห่งออซ...', 160, ARRAY['Musical', 'Fantasy', 'Drama'], 'อังกฤษ', 'ไทย', 'https://example.com/wicked_poster.jpg', '2024-11-22', TRUE),
  ('Gladiator II', 'ภาคต่อของนักรบกลาดิเอเตอร์...', 148, ARRAY['Action', 'Drama', 'History'], 'อังกฤษ', 'ไทย', 'https://example.com/gladiator2_poster.jpg', '2024-11-15', TRUE);

-- รอบฉาย
INSERT INTO showtimes (movie_id, theater_id, show_date, show_time, end_time, price, available_seats, is_active)
VALUES
  ((SELECT movie_id FROM movies WHERE title = 'ธี่หยด 3'),
   (SELECT theater_id FROM theaters WHERE theater_name='โรง 1' AND cinema_id=(SELECT cinema_id FROM cinemas WHERE address='Central Nakhon Pathom')),
   '2025-11-21','18:30','20:15',200.00,150,TRUE),

  ((SELECT movie_id FROM movies WHERE title = 'ธี่หยด 3'),
   (SELECT theater_id FROM theaters WHERE theater_name='โรง 2' AND cinema_id=(SELECT cinema_id FROM cinemas WHERE address='Central Nakhon Pathom')),
   '2025-11-21','21:00','22:45',200.00,150,TRUE),

  ((SELECT movie_id FROM movies WHERE title = '4 เสือ (4 Tigers)'),
   (SELECT theater_id FROM theaters WHERE theater_name='โรง 1' AND cinema_id=(SELECT cinema_id FROM cinemas WHERE address='Central Nakhon Pathom')),
   '2025-11-21','17:00','19:20',220.00,150,TRUE),

  ((SELECT movie_id FROM movies WHERE title = '4 เสือ (4 Tigers)'),
   (SELECT theater_id FROM theaters WHERE theater_name='โรง 2' AND cinema_id=(SELECT cinema_id FROM cinemas WHERE address='Central Nakhon Pathom')),
   '2025-11-21','20:00','22:20',220.00,150,TRUE),

  ((SELECT movie_id FROM movies WHERE title = 'Moana 2'),
   (SELECT theater_id FROM theaters WHERE theater_name='โรง 1' AND cinema_id=(SELECT cinema_id FROM cinemas WHERE address='Lotus Nakhon Pathom')),
   '2025-11-27','14:00','15:40',180.00,150,TRUE),

  ((SELECT movie_id FROM movies WHERE title = 'Wicked'),
   (SELECT theater_id FROM theaters WHERE theater_name='โรง 2' AND cinema_id=(SELECT cinema_id FROM cinemas WHERE address='Lotus Nakhon Pathom')),
   '2025-11-27','19:00','21:40',250.00,150,TRUE);