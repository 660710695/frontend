import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getSeatsByShowtime, getShowtimeById } from "../services/api";
import "../styles/SeatPicker.css";

function SeatPicker() {
  const query = new URLSearchParams(useLocation().search);
  // รองรับทั้ง showtime และ showtime_id
  const showtimeId = query.get("showtime") || query.get("showtime_id");

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seats, setSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [showtimeInfo, setShowtimeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Key สำหรับเก็บที่นั่งที่จองแล้วใน localStorage
  const getBookedSeatsKey = (id) => `bookedSeats_showtime_${id}`;

  // สร้างที่นั่งตาม init.sql: แถว A-E, ที่นั่ง 1-30
  const generateDefaultSeats = (bookedSeatIds = []) => {
    const rows = ["A", "B", "C", "D", "E"];
    const seatsPerRow = 30;
    const generatedSeats = [];
    let seatId = 1;

    rows.forEach((row) => {
      for (let num = 1; num <= seatsPerRow; num++) {
        generatedSeats.push({
          seat_id: seatId,
          seat_row: row,
          seat_number: num,
          seat_type: "standard",
          status: bookedSeatIds.includes(seatId) ? "booked" : "available",
        });
        seatId++;
      }
    });

    return generatedSeats;
  };

  // โหลดที่นั่งที่จองแล้วจาก localStorage
  const loadBookedSeatsFromStorage = () => {
    try {
      const stored = localStorage.getItem(getBookedSeatsKey(showtimeId));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error loading booked seats from storage:", e);
    }
    return [];
  };

  useEffect(() => {
    const fetchSeats = async () => {
      if (!showtimeId) {
        setError("ไม่พบรอบฉายที่เลือก");
        setLoading(false);
        return;
      }

      // โหลดที่นั่งที่จองแล้วจาก localStorage ก่อน
      const storedBookedSeats = loadBookedSeatsFromStorage();
      setBookedSeats(storedBookedSeats);

      try {
        setLoading(true);
        
        // พยายามดึงข้อมูลที่นั่งจาก API
        try {
          const response = await getSeatsByShowtime(showtimeId);
          if (response.data.success && response.data.data.seats && response.data.data.seats.length > 0) {
            const data = response.data.data;
            setShowtimeInfo({
              movieTitle: data.movie_title,
              cinemaName: data.cinema_name,
              theaterName: data.theater_name,
              showDate: data.show_date,
              showTime: data.show_time,
              price: data.price,
            });
            
            // รวมที่นั่งจาก API
            const apiBookedSeats = data.seats
              .filter(s => s.status === "booked" || s.status === "reserved")
              .map(s => s.seat_id);
            const allBookedSeats = [...new Set([...apiBookedSeats, ...storedBookedSeats])];
            setBookedSeats(allBookedSeats);
            
            // อัพเดตสถานะที่นั่ง
            const updatedSeats = data.seats.map(seat => ({
              ...seat,
              status: allBookedSeats.includes(seat.seat_id) ? "booked" : seat.status
            }));
            setSeats(updatedSeats);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.log("Seats API not available, trying showtime API...");
        }

        // Fallback: ดึงข้อมูล showtime และ generate ที่นั่ง
        try {
          const showtimeResponse = await getShowtimeById(showtimeId);
          if (showtimeResponse.data.success) {
            const data = showtimeResponse.data.data;
            setShowtimeInfo({
              movieTitle: data.movie_title || "หนัง",
              cinemaName: data.cinema_name || "โรงภาพยนตร์",
              theaterName: data.theater_name || "โรง",
              showDate: data.show_date || "",
              showTime: data.show_time || "",
              price: data.price || 200,
            });
          }
        } catch (showtimeError) {
          console.log("Showtime API not available, using default info...");
          // ใช้ข้อมูลเริ่มต้น
          setShowtimeInfo({
            movieTitle: "หนัง",
            cinemaName: "โรงภาพยนตร์",
            theaterName: "โรง",
            showDate: "",
            showTime: "",
            price: 200,
          });
        }

        // Generate ที่นั่งตาม init.sql พร้อมสถานะจาก localStorage
        setSeats(generateDefaultSeats(storedBookedSeats));
        
      } catch (err) {
        console.error("Error fetching seats:", err);
        // ใช้ข้อมูลเริ่มต้นแม้เกิด error
        setShowtimeInfo({
          movieTitle: "หนัง",
          cinemaName: "โรงภาพยนตร์",
          theaterName: "โรง",
          showDate: "",
          showTime: "",
          price: 200,
        });
        setSeats(generateDefaultSeats(storedBookedSeats));
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [showtimeId]);

  const toggleSeat = (seat) => {
    // ไม่อนุญาตให้เลือกที่นั่งที่ถูกจองแล้ว
    if (seat.status === "booked" || seat.status === "reserved" || bookedSeats.includes(seat.seat_id)) return;

    setSelectedSeats((prev) =>
      prev.find((s) => s.seat_id === seat.seat_id)
        ? prev.filter((s) => s.seat_id !== seat.seat_id)
        : [...prev, seat]
    );
  };

  // จัดกลุ่มที่นั่งตามแถว
  const groupedSeats = seats.reduce((acc, seat) => {
    if (!acc[seat.seat_row]) {
      acc[seat.seat_row] = [];
    }
    acc[seat.seat_row].push(seat);
    return acc;
  }, {});

  // เรียงลำดับแถว
  const sortedRows = Object.keys(groupedSeats).sort();

  if (loading) {
    return (
      <div className="seat-page">
        <h1>กำลังโหลด...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="seat-page">
        <h1>เกิดข้อผิดพลาด</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="seat-page">
      <h1>เลือกที่นั่ง</h1>

      {showtimeInfo && (
        <div className="showtime-info">
          <p><strong>หนัง:</strong> {showtimeInfo.movieTitle}</p>
          <p><strong>โรง:</strong> {showtimeInfo.cinemaName} - {showtimeInfo.theaterName}</p>
          {showtimeInfo.showDate && <p><strong>วันที่:</strong> {showtimeInfo.showDate}</p>}
          {showtimeInfo.showTime && <p><strong>รอบ:</strong> {showtimeInfo.showTime}</p>}
          <p><strong>ราคา:</strong> {showtimeInfo.price} บาท/ที่นั่ง</p>
        </div>
      )}

      <div className="seat-legend">
        <div className="legend-item">
          <div className="seat legend-available"></div>
          <span>ว่าง</span>
        </div>
        <div className="legend-item">
          <div className="seat legend-selected"></div>
          <span>เลือกแล้ว</span>
        </div>
        <div className="legend-item">
          <div className="seat legend-booked"></div>
          <span>จองแล้ว</span>
        </div>
      </div>

      <div className="screen">SCREEN</div>

      <div className="seats-container">
        {sortedRows.map((row) => (
          <div key={row} className="seat-row">
            <span className="row-label">{row}</span>
            <div className="seats-in-row">
              {groupedSeats[row]
                .sort((a, b) => a.seat_number - b.seat_number)
                .map((seat) => {
                  const seatLabel = `${seat.seat_row}${seat.seat_number}`;
                  const isSelected = selectedSeats.find((s) => s.seat_id === seat.seat_id);
                  const isBooked = seat.status === "booked" || seat.status === "reserved" || bookedSeats.includes(seat.seat_id);

                  return (
                    <div
                      key={seat.seat_id}
                      className={`seat ${isSelected ? "selected" : ""} ${isBooked ? "unavailable" : ""}`}
                      onClick={() => toggleSeat(seat)}
                      title={isBooked ? "ที่นั่งนี้ถูกจองแล้ว" : `เลือก ${seatLabel}`}
                      aria-disabled={isBooked}
                    >
                      {seat.seat_number}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {seats.length === 0 && (
        <p className="no-seats">ไม่พบที่นั่งสำหรับรอบฉายนี้</p>
      )}

      <button
        className="confirm-btn"
        disabled={selectedSeats.length === 0}
        onClick={() =>
          navigate(
            `/checkout?showtime=${showtimeId}&seats=${selectedSeats.map(s => s.seat_id).join(",")}`
          )
        }
      >
        ยืนยันที่นั่ง ({selectedSeats.length})
        {selectedSeats.length > 0 && showtimeInfo && (
          <span> - รวม {selectedSeats.length * showtimeInfo.price} บาท</span>
        )}
      </button>
    </div>
  );
}

export default SeatPicker;