import { useLocation, useNavigate } from "react-router-dom";
import "../styles/CheckOut.css";

function CheckOut() {
  const query = new URLSearchParams(useLocation().search);

  const movieId = query.get("movie");
  const cinemaId = query.get("cinema");
  const date = query.get("date");
  const time = query.get("time");
  const seats = query.get("seats")?.split(",") || [];

  const seatPrice = 180;
  const total = seats.length * seatPrice;

  const navigate = useNavigate();

  const handleConfirm = () => {
    // ส่ง params ไป Success page
    const params = new URLSearchParams({
      movie: movieId,
      cinema: cinemaId,
      date: date,
      time: time,
      seats: seats.join(","),
      total: total,
    });
    navigate(`/success?${params.toString()}`);
  };

  return (
    <div className="checkout-page">
      <h1>สรุปคำสั่งซื้อ</h1>

      <div className="summary-box">
        <p><strong>หนัง:</strong> {movieId}</p>
        <p><strong>โรง:</strong> {cinemaId}</p>
        <p><strong>วันที่:</strong> {date}</p>
        <p><strong>รอบ:</strong> {time}</p>
        <p><strong>ที่นั่ง:</strong> {seats.join(", ")}</p>
        <p><strong>ราคา:</strong> {seatPrice} บาท/ที่นั่ง</p>
        <h3>รวมทั้งหมด: {total} บาท</h3>
      </div>

      <button className="pay-btn" onClick={handleConfirm}>
        ชำระเงิน
      </button>
    </div>
  );
}

export default CheckOut;