// Cinema.jsx

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Cinema.css";

const API_BASE_URL = "/api";

// --- Helper Functions for Data Formatting ---

/**
 * Cleans up the date string (YYYY-MM-DD) for display and form loading.
 */
const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return dateStr.split('T')[0];
};

/**
 * Cleans up the time string (HH:MM) for display.
 */
const formatDisplayTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    if (timeStr.includes('T')) {
        return timeStr.split('T')[1].substring(0, 5);
    }
    return timeStr.substring(0, 5); 
};


// --- Grouping Functions (Unchanged Logic) ---

const groupShowtimesByCinemaDate = (showtimes) => {
  const grouped = {};
  showtimes.forEach(st => {
    const cinemaId = st.cinema_id;
    if (!grouped[cinemaId]) {
      grouped[cinemaId] = {};
    }
    // Use the raw show_date as the key for grouping
    if (!grouped[cinemaId][st.show_date]) {
      grouped[cinemaId][st.show_date] = [];
    }
    grouped[cinemaId][st.show_date].push(st);
  });
  return grouped;
};

const groupShowtimesByMovie = (showtimes) => {
    const grouped = {};
    showtimes.forEach(st => {
        const movieId = st.movie_id;
        if (!grouped[movieId]) {
            grouped[movieId] = {
                movie_id: movieId,
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
    // Front-end filter based ONLY on available data (movie_id, cinema_id, showtime is_active)
    const filteredShowtimes = allShowtimes.filter(st => 
        st.movie_id === movieId && 
        st.cinema_id === selectedCinema.cinema_id &&
        st.is_active !== false // Filter by showtime active status (only field available)
    );

    // จัดกลุ่มตามวันที่
    const groupedByDate = groupShowtimesByCinemaDate(filteredShowtimes);

    const availableDates = groupedByDate[selectedCinema.cinema_id] 
        ? Object.keys(groupedByDate[selectedCinema.cinema_id]).sort() 
        : [];

    const [selectedDate, setSelectedDate] = useState(null);

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
                        {formatDisplayDate(date)} {/* 💥 FIX 1: Format the date display */}
                    </button>
                ))}
            </div>

            {selectedDate && (
                <>
                    <h2>เลือกรอบฉาย ({selectedCinema.cinema_name})</h2>
                    <div className="time-list">
                        {groupedByDate[selectedCinema.cinema_id][selectedDate].map(showtime => (
                            <button
                                key={showtime.showtime_id}
                                className="time-btn"
                                onClick={() =>
                                    navigate(`/seats?showtime_id=${showtime.showtime_id}`) 
                                }>
                                {formatDisplayTime(showtime.show_time)} {/* 💥 FIX 2: Format the time display */}
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
    // Filter showtimes linked to the selected cinema, filtering only by showtime's own active status
    const showtimesInCinema = allShowtimes.filter(st => 
        st.cinema_id === selectedCinema.cinema_id &&
        st.is_active !== false
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

    const [allCinemas, setAllCinemas] = useState([]);
    const [allShowtimes, setAllShowtimes] = useState([]);
    const [movieTitle, setMovieTitle] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCinema, setSelectedCinema] = useState(null);
    
    const isMovieFirstMode = inputMovieId > 0;

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch Cinemas and Showtimes with is_active=true filters applied in the fetch call
                const [cinemasRes, showtimesRes, movieRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/cinemas?is_active=true`),
                    fetch(`${API_BASE_URL}/showtimes?is_active=true`), // 🛑 This is the API missing t.is_active 🛑
                    isMovieFirstMode ? fetch(`${API_BASE_URL}/movies/${inputMovieId}`) : Promise.resolve(null),
                ]);

                if (!cinemasRes.ok || !showtimesRes.ok) {
                     throw new Error("Failed to fetch primary data.");
                }

                const cinemasData = await cinemasRes.json();
                const showtimesData = await showtimesRes.json();
                
                setAllCinemas(cinemasData.data || []);
                setAllShowtimes(showtimesData.data || []);

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
    
    // Filter cinemas based on mode (Only shows cinemas with active showtimes for the movie)
    const filteredCinemas = allCinemas.filter(c => {
        if (isMovieFirstMode) {
            // We can only check showtime status, not theater status
            return allShowtimes.some(st => 
                st.movie_id === inputMovieId && 
                st.cinema_id === c.cinema_id &&
                st.is_active !== false
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
              {c.address}
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