import { useEffect, useState } from "react";
import "../styles/SeatPicker.css";
import axios from "axios";

export default function SeatPicker({ showtimeId, onChange }) {
  // seatMap: array of rows, each row array of { id, label, status } status: "available"|"booked"
  const [seatMap, setSeatMap] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await axios.get(`/api/showtimes/${showtimeId}/seats`);
      setSeatMap(res.data.seatMap);
      setLoading(false);
    }
    load();
  }, [showtimeId]);

  function toggleSeat(seat) {
    if (seat.status === "booked") return;
    if (selected.includes(seat.id)) {
      setSelected(s => s.filter(x => x !== seat.id));
      onChange?.(selected.filter(x => x !== seat.id));
    } else {
      setSelected(s => {
        const next = [...s, seat.id];
        onChange?.(next);
        return next;
      });
    }
  }

  if (loading) return <div>Loading seats…</div>;

  return (
    <div className="seatpicker">
      {seatMap.map((row, rowIdx) => (
        <div key={rowIdx} className="seat-row">
          {row.map(seat => {
            const isSelected = selected.includes(seat.id);
            const className = `seat ${seat.status} ${isSelected ? "selected" : ""}`;
            return (
              <button
                key={seat.id}
                className={className}
                onClick={() => toggleSeat(seat)}
                aria-pressed={isSelected}
                aria-label={`Seat ${seat.label} ${seat.status}`}
                disabled={seat.status === "booked"}
              >
                {seat.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
