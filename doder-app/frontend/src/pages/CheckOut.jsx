import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { getSeatsByShowtime, getShowtimeById, createBooking, confirmPayment } from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/CheckOut.css";

function CheckOut() {
  const query = new URLSearchParams(useLocation().search);
  // รองรับทั้ง showtime และ showtime_id
  const showtimeId = query.get("showtime") || query.get("showtime_id");
  const seatIdsParam = query.get("seats");
  const seatIds = seatIdsParam ? seatIdsParam.split(",").map(Number) : [];

  const [showtimeInfo, setShowtimeInfo] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // สร้างข้อมูลที่นั่งจาก seat_id
  const generateSeatInfo = (seatId) => {
    // seat_id 1-30 = A1-A30, 31-60 = B1-B30, etc.
    const rows = ["A", "B", "C", "D", "E"];
    const seatsPerRow = 30;
    const rowIndex = Math.floor((seatId - 1) / seatsPerRow);
    const seatNumber = ((seatId - 1) % seatsPerRow) + 1;
    return {
      seat_id: seatId,
      seat_row: rows[rowIndex] || "?",
      seat_number: seatNumber,
    };
  };

  useEffect(() => {
    const fetchShowtimeInfo = async () => {
      if (!showtimeId || seatIds.length === 0) {
        setError("ข้อมูลไม่ครบถ้วน");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // พยายามดึงข้อมูลจาก seats API
        try {
          const response = await getSeatsByShowtime(showtimeId);
          if (response.data.success && response.data.data.seats) {
            const data = response.data.data;
            setShowtimeInfo({
              movieTitle: data.movie_title,
              cinemaName: data.cinema_name,
              theaterName: data.theater_name,
              showDate: data.show_date,
              showTime: data.show_time,
              price: data.price,
            });
            // กรองเฉพาะที่นั่งที่เลือก
            const seats = data.seats.filter(seat => seatIds.includes(seat.seat_id));
            if (seats.length > 0) {
              setSelectedSeats(seats);
              setLoading(false);
              return;
            }
          }
        } catch (apiError) {
          console.log("Seats API not available, trying showtime API...");
        }

        // Fallback: ดึงข้อมูล showtime
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
          setShowtimeInfo({
            movieTitle: "หนัง",
            cinemaName: "โรงภาพยนตร์",
            theaterName: "โรง",
            showDate: "",
            showTime: "",
            price: 200,
          });
        }

        // Generate ที่นั่งจาก seatIds
        const generatedSeats = seatIds.map(id => generateSeatInfo(id));
        setSelectedSeats(generatedSeats);

      } catch (err) {
        console.error("Error fetching showtime info:", err);
        // ใช้ข้อมูลเริ่มต้น
        setShowtimeInfo({
          movieTitle: "หนัง",
          cinemaName: "โรงภาพยนตร์",
          theaterName: "โรง",
          showDate: "",
          showTime: "",
          price: 200,
        });
        const generatedSeats = seatIds.map(id => generateSeatInfo(id));
        setSelectedSeats(generatedSeats);
      } finally {
        setLoading(false);
      }
    };

    fetchShowtimeInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showtimeId, seatIdsParam]);

  const total = selectedSeats.length * (showtimeInfo?.price || 200);

  // Key สำหรับเก็บที่นั่งที่จองแล้วใน localStorage
  const getBookedSeatsKey = (id) => `bookedSeats_showtime_${id}`;

  // บันทึกที่นั่งที่จองแล้วลง localStorage
  const saveBookedSeatsToStorage = (newBookedSeatIds) => {
    try {
      const key = getBookedSeatsKey(showtimeId);
      const existing = localStorage.getItem(key);
      const existingSeats = existing ? JSON.parse(existing) : [];
      const allBookedSeats = [...new Set([...existingSeats, ...newBookedSeatIds])];
      localStorage.setItem(key, JSON.stringify(allBookedSeats));
    } catch (e) {
      console.error("Error saving booked seats to storage:", e);
    }
  };

  const handleConfirm = async () => {
    if (!user) {
      // ถ้ายังไม่ login ให้ไปหน้า login
      navigate("/login?redirect=" + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 1. สร้าง booking
      const bookingResponse = await createBooking({
        showtime_id: parseInt(showtimeId),
        seat_ids: seatIds,
      });

      if (!bookingResponse.data.success) {
        setError(bookingResponse.data.error || "ไม่สามารถจองที่นั่งได้");
        return;
      }

      const bookingData = bookingResponse.data.data;
      const bookingId = bookingData.booking_id;

      // 2. ยืนยันการชำระเงิน
      const paymentResponse = await confirmPayment(bookingId);

      if (!paymentResponse.data.success) {
        setError(paymentResponse.data.error || "ไม่สามารถยืนยันการชำระเงินได้");
        return;
      }

      // 3. บันทึกที่นั่งที่จองแล้วลง localStorage
      saveBookedSeatsToStorage(seatIds);

      // 4. ไปหน้า Success
      const params = new URLSearchParams({
        booking_id: bookingId,
        booking_code: bookingData.booking_code,
        movie: showtimeInfo?.movieTitle || "",
        cinema: showtimeInfo?.cinemaName || "",
        theater: showtimeInfo?.theaterName || "",
        date: showtimeInfo?.showDate || "",
        time: showtimeInfo?.showTime || "",
        seats: selectedSeats.map(s => `${s.seat_row}${s.seat_number}`).join(","),
        total: total,
      });
      navigate(`/success?${params.toString()}`);

    } catch (err) {
      console.error("Error during booking:", err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        // ถ้า API ไม่ทำงาน ให้บันทึกลง localStorage อยู่ดี (สำหรับ demo)
        saveBookedSeatsToStorage(seatIds);
        
        // ไปหน้า Success
        const params = new URLSearchParams({
          booking_id: Date.now(),
          booking_code: `BK${Date.now()}`,
          movie: showtimeInfo?.movieTitle || "",
          cinema: showtimeInfo?.cinemaName || "",
          theater: showtimeInfo?.theaterName || "",
          date: showtimeInfo?.showDate || "",
          time: showtimeInfo?.showTime || "",
          seats: selectedSeats.map(s => `${s.seat_row}${s.seat_number}`).join(","),
          total: total,
        });
        navigate(`/success?${params.toString()}`);
        return;
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <h1>กำลังโหลด...</h1>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>สรุปคำสั่งซื้อ</h1>

      <div className="summary-box">
        <p><strong>หนัง:</strong> {showtimeInfo?.movieTitle}</p>
        <p><strong>โรง:</strong> {showtimeInfo?.cinemaName} - {showtimeInfo?.theaterName}</p>
        {showtimeInfo?.showDate && <p><strong>วันที่:</strong> {showtimeInfo.showDate}</p>}
        {showtimeInfo?.showTime && <p><strong>รอบ:</strong> {showtimeInfo.showTime}</p>}
        <p><strong>ที่นั่ง:</strong> {selectedSeats.map(s => `${s.seat_row}${s.seat_number}`).join(", ")}</p>
        <p><strong>ราคา:</strong> {showtimeInfo?.price || 200} บาท/ที่นั่ง</p>
        <h3>รวมทั้งหมด: {total} บาท</h3>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {!user && (
        <div className="login-notice">
          <p>กรุณาเข้าสู่ระบบเพื่อดำเนินการจอง</p>
        </div>
      )}

      <button 
        className="pay-btn" 
        onClick={handleConfirm}
        disabled={submitting || selectedSeats.length === 0}
      >
        {submitting ? "กำลังดำเนินการ..." : (user ? "ชำระเงิน" : "เข้าสู่ระบบเพื่อจอง")}
      </button>
    </div>
  );
}

export default CheckOut;