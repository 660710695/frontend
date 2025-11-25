import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Cinema.css";

const API_BASE_URL = "http://localhost:8081/api";

/**
 * จัดกลุ่มรอบฉายตาม [โรง, วันที่, หนัง] 
 * Output: { cinemaId: { showDate: [showtimeObject, ...], ... }, ... }
 */
const groupShowtimesByCinemaDate = (showtimes) => {
  const grouped = {};
  showtimes.forEach(st => {
    // *** แก้ไข: ใช้ st.cinema_id โดยตรง (จาก ShowtimeWithDetails) ***
    const cinemaId = st.cinema_id;
    if (!grouped[cinemaId]) {
      grouped[cinemaId] = {};
    }
    if (!grouped[cinemaId][st.show_date]) {
      grouped[cinemaId][st.show_date] = [];
    }
    grouped[cinemaId][st.show_date].push(st);
  });
  return grouped;
};

/**
 * จัดกลุ่มรอบฉายตาม [หนัง]
 * Output: { movieId: { title: '...', showtimes: [...], ... }, ... }
 */
const groupShowtimesByMovie = (showtimes) => {
    const grouped = {};
    showtimes.forEach(st => {
        const movieId = st.movie_id;
        if (!grouped[movieId]) {
            grouped[movieId] = {
                movie_id: movieId,
                // *** แก้ไข: ใช้ st.movie_title โดยตรง (จาก ShowtimeWithDetails) ***
                title: st.movie_title || "Unknown Movie", 
                showtimes: []
            };
        }
        grouped[movieId].showtimes.push(st);
    });
    return Object.values(grouped);
};

// ------------------- MOVIE-FIRST SELECTOR (โหมด เลือกหนังก่อน) -------------------

const MovieFirstShowtimePicker = ({ selectedCinema, movieId, allShowtimes, navigate }) => {
    // กรองรอบฉายสำหรับโรงที่เลือกและหนังที่เลือกเท่านั้น
    const filteredShowtimes = allShowtimes.filter(st => 
        // *** แก้ไข: ใช้ st.cinema_id โดยตรง ***
        st.movie_id === movieId && st.cinema_id === selectedCinema.cinema_id
    );

    // จัดกลุ่มตามวันที่
    const groupedByDate = groupShowtimesByCinemaDate(filteredShowtimes);

    // ดึงวันที่ที่มีรอบฉายทั้งหมดสำหรับโรงและหนังเรื่องนี้
    const availableDates = groupedByDate[selectedCinema.cinema_id] 
        ? Object.keys(groupedByDate[selectedCinema.cinema_id]).sort() 
        : [];

    const [selectedDate, setSelectedDate] = useState(null);

    // รีเซ็ตวันที่เมื่อโรงภาพยนตร์เปลี่ยน
    useEffect(() => {
        setSelectedDate(null);
    }, [selectedCinema]);

    return (
        <>
            <h2>เลือกวันที่</h2>
            <div className="date-list">
                {availableDates.map(date => (
                    <button
                        key={date}
                        className={selectedDate === date ? "active" : ""}
                        onClick={() => setSelectedDate(date)}
                    >
                        {date}
                    </button>
                ))}
            </div>

            {selectedDate && (
                <>
                    <h2>เลือกรอบฉาย ({selectedCinema.cinema_name})</h2>
                    <div className="time-list">
                        {/* ใช้ st.theater_name โดยตรง */}
                        {groupedByDate[selectedCinema.cinema_id][selectedDate].map(showtime => (
                            <button
                                key={showtime.showtime_id}
                                className="time-btn"
                                onClick={() =>
                                    navigate(`/seats?showtime_id=${showtime.showtime_id}`) 
                                }>
                                {showtime.show_time.substring(0, 5)} 
                                <br />
                                ({showtime.theater_name || 'N/A'})
                            </button>
                        ))}
                    </div>
                </>
            )}
        </>
    );
};


// ------------------- CINEMA-FIRST SELECTOR (โหมด เลือกโรงก่อน) -------------------

const CinemaFirstMovieSelector = ({ selectedCinema, allShowtimes, navigate }) => {
    // กรองรอบฉายเฉพาะโรงที่เลือก
    const showtimesInCinema = allShowtimes.filter(st => 
        // *** แก้ไข: ใช้ st.cinema_id โดยตรง ***
        st.cinema_id === selectedCinema.cinema_id
    );

    // จัดกลุ่มเพื่อดูว่ามีหนังเรื่องใดบ้าง
    const moviesInSelectedCinema = groupShowtimesByMovie(showtimesInCinema);
    
    return (
        <>
            <h2>ภาพยนตร์ที่ฉายใน {selectedCinema.cinema_name}</h2>
            <div className="movie-selection-list">
                {moviesInSelectedCinema.length > 0 ? (
                    moviesInSelectedCinema.map(movie => (
                        <div key={movie.movie_id} className="movie-item">
                            <h3>{movie.title}</h3>
                            <button
                                onClick={() => navigate(`/cinema?movie=${movie.movie_id}`)}
                            >
                                เลือกซื้อตั๋ว
                            </button>
                        </div>
                    ))
                ) : (
                    <p>ไม่พบภาพยนตร์ที่กำลังฉายในโรงนี้</p>
                )}
            </div>
        </>
    );
};


// ------------------- MAIN COMPONENT -------------------

function Cinema() {
    const query = new URLSearchParams(useLocation().search);
    const inputMovieId = Number(query.get("movie")); 

    const navigate = useNavigate();

    // State สำหรับข้อมูลทั้งหมด
    const [allCinemas, setAllCinemas] = useState([]);
    const [allShowtimes, setAllShowtimes] = useState([]);
    const [movieTitle, setMovieTitle] = useState(null);
    
    // State สำหรับ UI & Selection
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCinema, setSelectedCinema] = useState(null);
    
    // กำหนดโหมดการทำงาน: ถ้า ID > 0 แสดงว่าเข้าสู่โหมด Movie-First
    const isMovieFirstMode = inputMovieId > 0;

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch Cinemas และ Showtimes ทั้งหมด
                const [cinemasRes, showtimesRes, movieRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/cinemas`),
                    fetch(`${API_BASE_URL}/showtimes`),
                    // Fetch ชื่อหนังเฉพาะเมื่ออยู่ในโหมด Movie-First
                    isMovieFirstMode ? fetch(`${API_BASE_URL}/movies/${inputMovieId}`) : Promise.resolve(null),
                ]);

                if (!cinemasRes.ok || !showtimesRes.ok) {
                     throw new Error("Failed to fetch primary data.");
                }

                const cinemasData = await cinemasRes.json();
                const showtimesData = await showtimesRes.json();
                
                setAllCinemas(cinemasData.data || []);
                setAllShowtimes(showtimesData.data || []);

                // จัดการชื่อหนังสำหรับโหมด Movie-First
                if (isMovieFirstMode && movieRes) {
                    const movieData = await movieRes.json();
                    setMovieTitle(movieData.data?.title || `ID ${inputMovieId} (Not Found)`);
                }

            } catch (err) {
                console.error("Fetch error:", err);
                setError("Failed to fetch data: " + err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [inputMovieId]); 
    
    // กรองโรงภาพยนตร์ตามโหมด (ถ้าเป็น Movie-First จะแสดงเฉพาะโรงที่มีรอบฉาย)
    const filteredCinemas = allCinemas.filter(c => {
        if (isMovieFirstMode) {
            return allShowtimes.some(st => 
                // *** แก้ไข: ใช้ st.cinema_id โดยตรง ***
                st.movie_id === inputMovieId && st.cinema_id === c.cinema_id
            );
        }
        return true; 
    });

    const heading = isMovieFirstMode 
      ? `เลือกรอบฉายสำหรับ ${movieTitle || `หนัง ID ${inputMovieId}`}` 
      : "เลือกโรงภาพยนตร์";
    
    // --- UI RENDER ---

    if (loading) {
      return <div className="cinema-page">Loading data...</div>;
    }

    if (error) {
      return <div className="cinema-page">Error: {error}</div>;
    }
    
    if (filteredCinemas.length === 0) {
        return (
             <div className="cinema-page">
                <h1>{heading}</h1>
                <p>ไม่พบโรงภาพยนตร์หรือรอบฉายที่ตรงตามเงื่อนไข</p>
            </div>
        );
    }

    return (
      <div className="cinema-page">
        <h1>{heading}</h1>

        {/* A. แสดงรายการโรงภาพยนตร์ที่กรองแล้ว */}
        <div className="cinema-list">
          {filteredCinemas.map(c => (
            <button
              key={c.cinema_id}
              className={selectedCinema?.cinema_id === c.cinema_id ? "active" : ""}
              onClick={() => { 
                  setSelectedCinema(c); 
              }}
            >
              {c.cinema_name}
            </button>
          ))}
        </div>

        {/* B. ส่วนที่ยืดหยุ่นตามโหมดที่เลือก */}
        {selectedCinema && (
          <div className="selection-details">
            {/* โหมด 1: เลือกหนังก่อน (แสดงวันที่/เวลาทันที) */}
            {isMovieFirstMode && (
                <MovieFirstShowtimePicker 
                    selectedCinema={selectedCinema}
                    movieId={inputMovieId}
                    allShowtimes={allShowtimes}
                    navigate={navigate}
                />
            )}

            {/* โหมด 2: เลือกโรงก่อน (แสดงรายการหนังที่ฉายในโรงนี้) */}
            {!isMovieFirstMode && (
                <CinemaFirstMovieSelector 
                    selectedCinema={selectedCinema}
                    allShowtimes={allShowtimes}
                    navigate={navigate}
                />
            )}
          </div>
        )}
      </div>
    );
}

export default Cinema;