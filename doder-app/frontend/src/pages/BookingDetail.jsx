import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/BookingDetail.css';

const API_BASE_URL = "/api";

function BookingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getToken = () => localStorage.getItem('authToken');

    // Format date - handle both ISO string and object with Time property
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        
        // Handle Go time.Time object format
        let dateValue = dateStr;
        if (typeof dateStr === 'object' && dateStr.Time) {
            dateValue = dateStr.Time;
        }
        
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'N/A';
        
        return date.toLocaleDateString('th-TH', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    // Format time - handle various formats
    const formatTime = (timeStr) => {
        if (!timeStr) return 'N/A';
        
        // Handle Go time.Time object format
        let timeValue = timeStr;
        if (typeof timeStr === 'object' && timeStr.Time) {
            timeValue = timeStr.Time;
        }
        
        // If it's a string like "14:30:00" or "14:30"
        if (typeof timeValue === 'string') {
            if (timeValue.includes('T')) {
                // ISO format
                const date = new Date(timeValue);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleTimeString('th-TH', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false
                    });
                }
            }
            // Simple time format HH:MM:SS or HH:MM
            if (timeValue.includes(':')) {
                return timeValue.substring(0, 5);
            }
        }
        
        const date = new Date(timeValue);
        if (isNaN(date.getTime())) return 'N/A';
        
        return date.toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
    };

    // Format datetime
    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        
        // Handle Go time.Time object format
        let dateValue = dateStr;
        if (typeof dateStr === 'object' && dateStr.Time) {
            dateValue = dateStr.Time;
        }
        
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'N/A';
        
        return date.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Fetch booking detail
    useEffect(() => {
        const fetchBookingDetail = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            const token = getToken();
            if (!token) {
                setError('กรุณาเข้าสู่ระบบ');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                console.log('Booking API Response:', data);

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'ไม่สามารถดึงข้อมูลการจองได้');
                }

                console.log('Booking data:', data.data);
                console.log('Seats:', data.data?.seats);
                setBooking(data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (!isAuthLoading) {
            if (user) {
                fetchBookingDetail();
            } else {
                navigate('/login');
            }
        }
    }, [id, isAuthLoading, user, navigate]);

    // Get status text and class
    const getStatusInfo = (status) => {
        const statusMap = {
            'pending': { text: 'รอชำระเงิน', class: 'status-pending' },
            'confirmed': { text: 'ยืนยันแล้ว', class: 'status-confirmed' },
            'cancelled': { text: 'ยกเลิกแล้ว', class: 'status-cancelled' }
        };
        return statusMap[status] || { text: status, class: '' };
    };

    const getPaymentInfo = (status) => {
        const paymentMap = {
            'pending': { text: 'ยังไม่ชำระ', class: 'payment-pending' },
            'paid': { text: 'ชำระแล้ว', class: 'payment-paid' }
        };
        return paymentMap[status] || { text: status, class: '' };
    };

    // Print ticket
    const handlePrint = () => {
        window.print();
    };

    // Loading state
    if (isAuthLoading || loading) {
        return (
            <div className="booking-detail-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>กำลังโหลดข้อมูลการจอง...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="booking-detail-page">
                <div className="error-container">
                    <div className="error-icon">❌</div>
                    <h2>เกิดข้อผิดพลาด</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/booking-history')} className="btn-back">
                        กลับไปหน้าประวัติการจอง
                    </button>
                </div>
            </div>
        );
    }

    // No booking found
    if (!booking) {
        return (
            <div className="booking-detail-page">
                <div className="error-container">
                    <div className="error-icon">🎫</div>
                    <h2>ไม่พบข้อมูลการจอง</h2>
                    <button onClick={() => navigate('/booking-history')} className="btn-back">
                        กลับไปหน้าประวัติการจอง
                    </button>
                </div>
            </div>
        );
    }

    const statusInfo = getStatusInfo(booking.booking_status);
    const paymentInfo = getPaymentInfo(booking.payment_status);

    return (
        <div className="booking-detail-page">
            <div className="booking-detail-container">
                {/* Header */}
                <div className="detail-header">
                    <div className="header-left">
                        <h1>รายละเอียดการจอง</h1>
                        <p className="booking-code">รหัสจอง: <strong>{booking.booking_code}</strong></p>
                    </div>
                    <div className="header-right">
                        <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>
                        <span className={`badge ${paymentInfo.class}`}>{paymentInfo.text}</span>
                    </div>
                </div>

                {/* Ticket Card */}
                <div className="ticket-card">
                    {/* Movie Section */}
                    <div className="ticket-section movie-section">
                        <div className="section-content">
                            <label>ภาพยนตร์</label>
                            <h2>{booking.movie_title}</h2>
                        </div>
                    </div>

                    {/* Cinema & Theater */}
                    <div className="ticket-section location-section">
                        <div className="section-content">
                            <label>โรงภาพยนตร์</label>
                            <p className="cinema-name">{booking.cinema_name}</p>
                            <p className="theater-name">{booking.theater_name}</p>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="ticket-section datetime-section">
                        <div className="datetime-grid">
                            <div className="datetime-item">
                                <div className="section-content">
                                    <label>วันที่ฉาย</label>
                                    <p>{formatDate(booking.show_date)}</p>
                                </div>
                            </div>
                            <div className="datetime-item">
                                <div className="section-content">
                                    <label>รอบฉาย</label>
                                    <p>{formatTime(booking.show_time)} น.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seats */}
                    <div className="ticket-section seats-section">
                        <div className="section-content">
                            <label>ที่นั่ง</label>
                            <div className="seats-display">
                                {booking.seats && booking.seats.length > 0 ? (
                                    booking.seats.map(seat => (
                                        <span key={seat.seat_id} className="seat-tag">
                                            {seat.seat_row}{seat.seat_number}
                                        </span>
                                    ))
                                ) : (
                                    <span className="no-seats">ไม่มีข้อมูลที่นั่ง</span>
                                )}
                            </div>
                            <p className="seat-count">
                                จำนวน {booking.seats?.length || 0} ที่นั่ง
                            </p>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="ticket-section price-section">
                        <div className="section-content">
                            <label>ยอดรวม</label>
                            <p className="total-price">฿{booking.total_amount?.toFixed(2) || '0.00'}</p>
                        </div>
                    </div>

                    {/* Booking Info */}
                    <div className="ticket-section booking-info-section">
                        <div className="section-content">
                            <label>วันที่จอง</label>
                            <p>{formatDateTime(booking.booking_date)}</p>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                {booking.booking_status === 'confirmed' && (
                    <div className="instructions-box">
                        <h3>คำแนะนำ</h3>
                        <ul>
                            <li>กรุณามาถึงโรงภาพยนตร์ก่อนเวลาฉายอย่างน้อย 15 นาที</li>
                            <li>แสดงรหัสจอง <strong>{booking.booking_code}</strong> ที่เคาน์เตอร์</li>
                            <li>สามารถพิมพ์หน้านี้เพื่อใช้เป็นหลักฐาน</li>
                        </ul>
                    </div>
                )}

                {/* Actions */}
                <div className="detail-actions">
                    <button onClick={() => navigate('/booking-history')} className="btn-secondary">
                        ← กลับไปหน้าประวัติการจอง
                    </button>
                    {booking.booking_status === 'confirmed' && (
                        <button onClick={handlePrint} className="btn-primary">
                            พิมพ์ตั๋ว
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BookingDetail;
