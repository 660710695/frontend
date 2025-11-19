import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Cinema.css";

// Example data
const cinemas = [
  {
    id: 1,
    name: "Paragon Cineplex",
    movies: [1, 2],
    showtimes: {
      "2025-11-17": ["10:30", "13:00", "16:45", "20:00"],
      "2025-11-18": ["11:00", "14:00", "18:00"],
    },
  },
  {
    id: 2,
    name: "Major Ratchayothin",
    movies: [1],
    showtimes: {
      "2025-11-17": ["09:00", "12:00", "15:30", "19:15"],
      "2025-11-18": ["10:00", "13:30", "17:00"],
    },
  },
];

function Cinema() {
  const query = new URLSearchParams(useLocation().search);
  const movieId = Number(query.get("movie"));
  const navigate = useNavigate();

  const availableCinemas = cinemas.filter(c => c.movies.includes(movieId));

  const [selectedCinema, setSelectedCinema] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  return (
    <div className="cinema-page">
      <h1>เลือกโรงสำหรับหนังเรื่อง {movieId}</h1>

      <div className="cinema-list">
        {availableCinemas.map(c => (
          <button
            key={c.id}
            className={selectedCinema?.id === c.id ? "active" : ""}
            onClick={() => { setSelectedCinema(c); setSelectedDate(null); }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {selectedCinema && (
        <>
          <h2>เลือกวันที่</h2>
          <div className="date-list">
            {Object.keys(selectedCinema.showtimes).map(date => (
              <button
                key={date}
                className={selectedDate === date ? "active" : ""}
                onClick={() => setSelectedDate(date)}
              >
                {date}
              </button>
            ))}
          </div>
        </>
      )}

      {selectedDate && (
        <>
          <h2>เลือกรอบฉาย</h2>
          <div className="time-list">
            {selectedCinema.showtimes[selectedDate].map(time => (
              <button
                key={time}
                className="time-btn"
                onClick={() =>
                  navigate(
                    `/seats?movie=${movieId}&cinema=${selectedCinema.id}&date=${selectedDate}&time=${time}`
                  )}>
                {time}
              </button>

            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Cinema;
