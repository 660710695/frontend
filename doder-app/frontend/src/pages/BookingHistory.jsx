import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/BookingHistory.css';

const API_BASE_URL = "/api";

function BookingHistory() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, pending, confirmed, cancelled

    const getToken = () => localStorage.getItem('authToken');

    // Format date and time
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return 'N/A';
        return timeStr.substring(0, 5); // HH:MM
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Fetch user bookings
    const fetchBookings = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            setError('Please log in to view booking history');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to fetch bookings');
            }

            setBookings(data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthLoading) {
            if (user) {
                fetchBookings();
            } else {
                navigate('/login');
            }
        }
    }, [isAuthLoading, user]);

    // Cancel booking
    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?')) return;

        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to cancel booking');
            }

            alert('ยกเลิกการจองเรียบร้อยแล้ว');
            fetchBookings(); // Refresh the list
        } catch (err) {
            alert(`เกิดข้อผิดพลาด: ${err.message}`);
        }
    };

    // Confirm payment
    const handleConfirmPayment = async (bookingId) => {
        if (!window.confirm('ยืนยันการชำระเงินสำหรับการจองนี้?')) return;

        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/confirm-payment`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to confirm payment');
            }

            alert('ชำระเงินเรียบร้อยแล้ว!');
            fetchBookings(); // Refresh the list
        } catch (err) {
            alert(`เกิดข้อผิดพลาด: ${err.message}`);
        }
    };

    // Filter bookings
    const filteredBookings = bookings.filter(booking => {
        if (filter === 'all') return true;
        return booking.booking_status === filter;
    });

    // Get status badge style
    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': { text: 'รอชำระเงิน', class: 'status-pending' },
            'confirmed': { text: 'ยืนยันแล้ว', class: 'status-confirmed' },
            'cancelled': { text: 'ยกเลิกแล้ว', class: 'status-cancelled' }
        };
        return statusMap[status] || { text: status, class: 'status-unknown' };
    };

    const getPaymentBadge = (status) => {
        const paymentMap = {
            'pending': { text: 'ยังไม่ชำระ', class: 'payment-pending' },
            'paid': { text: 'ชำระแล้ว', class: 'payment-paid' }
        };
        return paymentMap[status] || { text: status, class: 'payment-unknown' };
    };

    // Loading state
    if (isAuthLoading || loading) {
        return (
            <div className="booking-history-page">
                <div className="loading">กำลังโหลดประวัติการจอง...</div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="booking-history-page">
                <div className="error-message">
                    <h2>เกิดข้อผิดพลาด</h2>
                    <p>{error}</p>
                    <button onClick={fetchBookings}>ลองอีกครั้ง</button>
                </div>
            </div>
        );
    }

    return (
        <div className="booking-history-page">
            <div className="page-header">
                <h1>ประวัติการจอง</h1>
                <p>จัดการและตรวจสอบการจองตั๋วของคุณ</p>
            </div>

            {/* Filter tabs */}
            <div className="filter-tabs">
                <button 
                    className={filter === 'all' ? 'active' : ''} 
                    onClick={() => setFilter('all')}
                >
                    ทั้งหมด ({bookings.length})
                </button>
                <button 
                    className={filter === 'pending' ? 'active' : ''} 
                    onClick={() => setFilter('pending')}
                >
                    รอชำระเงิน ({bookings.filter(b => b.booking_status === 'pending').length})
                </button>
                <button 
                    className={filter === 'confirmed' ? 'active' : ''} 
                    onClick={() => setFilter('confirmed')}
                >
                    ยืนยันแล้ว ({bookings.filter(b => b.booking_status === 'confirmed').length})
                </button>
                <button 
                    className={filter === 'cancelled' ? 'active' : ''} 
                    onClick={() => setFilter('cancelled')}
                >
                    ยกเลิกแล้ว ({bookings.filter(b => b.booking_status === 'cancelled').length})
                </button>
            </div>

            {/* Bookings list */}
            {filteredBookings.length === 0 ? (
                <div className="empty-state">
                    <p>ไม่พบประวัติการจอง</p>
                    <button onClick={() => navigate('/')}>เลือกหนังเพื่อจอง</button>
                </div>
            ) : (
                <div className="bookings-list">
                    {filteredBookings.map(booking => {
                        const statusBadge = getStatusBadge(booking.booking_status);
                        const paymentBadge = getPaymentBadge(booking.payment_status);
                        
                        return (
                            <div key={booking.booking_id} className="booking-card">
                                <div className="booking-header">
                                    <div className="booking-code">
                                        <strong>รหัสจอง:</strong> {booking.booking_code}
                                    </div>
                                    <div className="badges">
                                        <span className={`badge ${statusBadge.class}`}>
                                            {statusBadge.text}
                                        </span>
                                        <span className={`badge ${paymentBadge.class}`}>
                                            {paymentBadge.text}
                                        </span>
                                    </div>
                                </div>

                                <div className="booking-details">
                                    <div className="movie-info">
                                        <h3>{booking.movie_title}</h3>
                                        <p className="cinema-info">
                                            {booking.cinema_name} - {booking.theater_name}
                                        </p>
                                        <p className="showtime-info">
                                            {formatDate(booking.show_date)} 
                                            {' '}{formatTime(booking.show_time)}
                                        </p>
                                    </div>

                                    <div className="seats-info">
                                        <strong>ที่นั่ง:</strong>
                                        <div className="seats-list">
                                            {booking.seats && booking.seats.length > 0 ? (
                                                booking.seats.map(seat => (
                                                    <span key={seat.seat_id} className="seat-badge">
                                                        {seat.seat_row}{seat.seat_number}
                                                    </span>
                                                ))
                                            ) : (
                                                <span>ไม่มีข้อมูลที่นั่ง</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="booking-meta">
                                        <div className="amount">
                                            <strong>ยอดรวม:</strong> ฿{booking.total_amount.toFixed(2)}
                                        </div>
                                        <div className="booking-date">
                                            <strong>จองเมื่อ:</strong> {formatDateTime(booking.booking_date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="booking-actions">
                                    {booking.booking_status === 'pending' && (
                                        <>
                                            <button 
                                                className="btn-confirm"
                                                onClick={() => handleConfirmPayment(booking.booking_id)}
                                            >
                                                ชำระเงิน
                                            </button>
                                            <button 
                                                className="btn-cancel"
                                                onClick={() => handleCancelBooking(booking.booking_id)}
                                            >
                                                ยกเลิกการจอง
                                            </button>
                                        </>
                                    )}
                                    {booking.booking_status === 'confirmed' && (
                                        <button 
                                            className="btn-view"
                                            onClick={() => navigate(`/bookings/${booking.booking_id}`)}
                                        >
                                            ดูรายละเอียด
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default BookingHistory;