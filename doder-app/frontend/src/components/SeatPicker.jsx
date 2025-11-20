import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
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
  const navigate = useNavigate();

  const toggleSeat = (seat) => {
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

            return (
              <div
                key={seat}
                className={`seat ${isSelected ? "selected" : ""}`}
                onClick={() => toggleSeat(seat)}
              >
                {seat}
              </div>
            );
          })
        )}
      </div>

      <button
        className="confirm-btn"
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
