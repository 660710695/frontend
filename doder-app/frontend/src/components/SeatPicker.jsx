import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/SeatPicker.css";

function SeatPicker() {
  const query = new URLSearchParams(useLocation().search);
  const movieId = query.get("movie");
  const cinemaId = query.get("cinema");
  const date = query.get("date");
  const time = query.get("time");

  const rows = ["A", "B", "C", "D", "E"];
  const cols = 8;

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const navigate = useNavigate();

  // key per showtime
  const bookingsKey = `bookings:${movieId}:${cinemaId}:${date}:${time}`;

  useEffect(() => {
    // load booked seats for this showtime from localStorage (or API)
    try {
      const raw = localStorage.getItem(bookingsKey);
      if (raw) setBookedSeats(JSON.parse(raw));
      else setBookedSeats([]);
    } catch (e) {
      setBookedSeats([]);
    }
  }, [bookingsKey]);

  const toggleSeat = (seat) => {
    // don't allow toggling a seat that's already booked
    if (bookedSeats.includes(seat)) return;

    setSelectedSeats((prev) =>
      prev.includes(seat)
        ? prev.filter((s) => s !== seat)
        : [...prev, seat]
    );
  };

  return (
    <div className="seat-page">
      <h1>เลือกที่นั่ง</h1>

      <p>หนัง: {movieId}</p>
      <p>โรง: {cinemaId}</p>
      <p>วันที่: {date}</p>
      <p>รอบ: {time}</p>

      <div className="screen">SCREEN</div>

      <div className="seats-grid">
        {rows.map((r) =>
          Array.from({ length: cols }).map((_, i) => {
            const seat = `${r}${i + 1}`;
            const isSelected = selectedSeats.includes(seat);
            const isBooked = bookedSeats.includes(seat);

            return (
              <div
                key={seat}
                className={`seat ${isSelected ? "selected" : ""} ${isBooked ? "unavailable" : ""}`}
                onClick={() => toggleSeat(seat)}
                title={isBooked ? "ที่นั่งนี้ถูกจองแล้ว" : `เลือก ${seat}`}
                aria-disabled={isBooked}
              >
                {seat}
              </div>
            );
          })
        )}
      </div>

      <button
        className="confirm-btn"
        disabled={selectedSeats.length === 0}
        onClick={() =>
          navigate(
            `/checkout?movie=${movieId}&cinema=${cinemaId}&date=${date}&time=${time}&seats=${selectedSeats.join(",")}`
          )
        }
      >
        ยืนยันที่นั่ง ({selectedSeats.length})
      </button>

    </div>
  );
}

export default SeatPicker;