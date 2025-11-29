import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Success.css";

function Success() {
  const query = new URLSearchParams(useLocation().search);
  const navigate = useNavigate();

  const movieId = query.get("movie");
  const cinemaId = query.get("cinema");
  const date = query.get("date");
  const time = query.get("time");
  const seats = query.get("seats")?.split(",") || [];
  const total = query.get("total");
  const bookingId = "BOOK" + Date.now(); // สร้าง booking ID

  return (
    <div className="success-page">
      <div className="success-container">
        {/* Success Icon */}
        <div className="success-icon">
          <svg viewBox="0 0 100 100" width="80" height="80">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#4CAF50" strokeWidth="2"/>
            <path d="M30 50 L45 65 L70 35" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Success Message */}
        <h1>จองตั๋วสำเร็จ!</h1>
        <p className="success-message">ขอบคุณที่ใช้บริการ เบิ้งของเรา</p>

        {/* Booking Details */}
        <div className="booking-details">
          <div className="detail-section">
            <h3>รายละเอียดการจอง</h3>
            <div className="detail-row">
              <span className="label">หมายเลขการจอง:</span>
              <span className="value">{bookingId}</span>
            </div>
            <div className="detail-row">
              <span className="label">หนัง:</span>
              <span className="value">{movieId}</span>
            </div>
            <div className="detail-row">
              <span className="label">โรงภาพยนตร์:</span>
              <span className="value">{cinemaId}</span>
            </div>
            <div className="detail-row">
              <span className="label">วันที่:</span>
              <span className="value">{date}</span>
            </div>
            <div className="detail-row">
              <span className="label">เวลาฉาย:</span>
              <span className="value">{time}</span>
            </div>
            <div className="detail-row">
              <span className="label">ที่นั่ง:</span>
              <span className="value seats-value">{seats.join(", ")}</span>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="payment-section">
            <h3>สรุปการชำระเงิน</h3>
            <div className="payment-row">
              <span className="label">จำนวนที่นั่ง:</span>
              <span className="value">{seats.length} ที่</span>
            </div>
            <div className="payment-row">
              <span className="label">ราคา/ที่นั่ง:</span>
              <span className="value">180 บาท</span>
            </div>
            <div className="payment-row total-row">
              <span className="label">รวมทั้งหมด:</span>
              <span className="value total-amount">{total} บาท</span>
            </div>
            <div className="payment-status">
              <span className="status-badge paid">✓ ชำระเงินแล้ว</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="instructions">
          <h3>คำแนะนำ</h3>
          <ul>
            <li>โปรดนำหมายเลขการจอง {bookingId} มาแสดงที่หน้าจำหน่ายตั๋ว</li>
            <li>กรุณามาถึงโรงภาพยนตร์ก่อนเวลาฉายอย่างน้อย 15 นาที</li>
            <li>คุณสามารถตรวจสอบอีเมลเพื่อดูรายละเอียดเพิ่มเติม</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            กลับไปหน้าหลัก
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            พิมพ์ตั๋ว
          </button>
        </div>
      </div>
    </div>
  );
}

export default Success;