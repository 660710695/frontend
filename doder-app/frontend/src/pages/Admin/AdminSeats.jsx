// AdminSeats.jsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../../styles/AdminCommon.css';

const API_BASE_URL = "/api";

function AdminSeats() {
    const query = new URLSearchParams(useLocation().search);
    const theaterId = Number(query.get("theater_id")) || 0;

    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);

    const [bulkSeats, setBulkSeats] = useState({
        rows: '',
        seatsPerRow: 0,
        seatType: 'standard',
    });

    const getToken = () => {
        const token = localStorage.getItem('authToken');
        if (!token) setStatus({ type: 'error', message: "Unauthorized. Please log in as Admin." });
        return token;
    };

    const handleBulkInputChange = (e) => {
        const { name, value } = e.target;
        setBulkSeats(prev => ({ ...prev, [name]: value }));
    };

    const fetchSeats = async () => {
        if (theaterId === 0) return;

        setLoading(true);
        setStatus(null);
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/seats?theater_id=${theaterId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch seat list.");
            const data = await res.json();
            setSeats(data.data || []);
        } catch (err) {
            setStatus({ type: 'error', message: `Fetch failed: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (theaterId > 0) fetchSeats();
    }, [theaterId]);

    const handleBulkCreate = async (e) => {
        e.preventDefault();
        setStatus(null);
        const token = getToken();
        if (!token) return;

        const rowsArray = bulkSeats.rows.toUpperCase().split(',').map(r => r.trim()).filter(r => r.length > 0);

        const payload = {
            theater_id: theaterId,
            rows: rowsArray,
            seats_per_row: parseInt(bulkSeats.seatsPerRow, 10),
            seat_type: bulkSeats.seatType,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/admin/seats/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to create seats.");

            setStatus({
                type: 'success',
                message: `สร้างที่นั่ง: ${data.data.created}, ข้าม: ${data.data.skipped}, รวมทั้งหมด: ${data.data.total}`
            });
            setBulkSeats({ rows: '', seatsPerRow: 0, seatType: 'standard' });
            fetchSeats();
        } catch (err) {
            setStatus({ type: 'error', message: `Creation failed: ${err.message}` });
        }
    };

    const handleDeleteSeat = async (seatId) => {
        if (!window.confirm("คุณแน่ใจหรือไม่ว่าจะปิดใช้งานที่นั่งนี้?")) return;
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/admin/seats/${seatId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to deactivate seat.");
            setStatus({ type: 'success', message: `ที่นั่ง ID ${seatId} ถูกปิดใช้งานเรียบร้อย` });
            fetchSeats();
        } catch (err) {
            setStatus({ type: 'error', message: `Deletion failed: ${err.message}` });
        }
    };

    if (theaterId === 0) return (
        <div className="admin-page">
            <div className="status-error">
                🚫 Error: Theater ID is missing. Please navigate from the Theater Management page.
            </div>
        </div>
    );

    if (loading) return (
        <div className="admin-page">
            <div className="admin-loading">Loading seat layout for Theater ID {theaterId}...</div>
        </div>
    );

    return (
        <div className="admin-page">
            <h1>จัดการที่นั่ง (Theater ID: {theaterId})</h1>

            {status && <div className={`admin-status ${status.type}`}>{status.message}</div>}

            <h2>+ สร้างที่นั่งแบบกลุ่ม (Bulk Creation)</h2>
            <p className="form-note">*Rows must be comma-separated (e.g., A, B, C, D)</p>

            <form className="admin-form" onSubmit={handleBulkCreate}>
                <input
                    type="text"
                    name="rows"
                    placeholder="แถว (เช่น A,B,C)"
                    value={bulkSeats.rows}
                    onChange={handleBulkInputChange}
                    required
                />
                <input
                    type="number"
                    name="seatsPerRow"
                    placeholder="จำนวนที่นั่ง/แถว"
                    value={bulkSeats.seatsPerRow}
                    onChange={handleBulkInputChange}
                    required
                />
                <select name="seatType" value={bulkSeats.seatType} onChange={handleBulkInputChange}>
                    <option value="standard">Standard</option>
                    <option value="vip">VIP</option>
                </select>
                <button type="submit" className="primary">สร้างที่นั่ง</button>
            </form>

            <h2>ผังที่นั่งปัจจุบัน ({seats.length} ที่นั่ง)</h2>

            {seats.length === 0 ? (
                <p>ไม่พบที่นั่งในโรงนี้ โปรดใช้ฟอร์มสร้างด้านบน</p>
            ) : (
                <div className="seat-grid-map">
                    {seats.map(seat => (
                        <div
                            key={seat.seat_id}
                            className={`seat-box ${seat.is_active ? seat.seat_type : 'inactive'}`}
                            title={`ID: ${seat.seat_id}, Type: ${seat.seat_type}`}
                            onClick={() => handleDeleteSeat(seat.seat_id)}
                        >
                            {seat.seat_row}{seat.seat_number}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminSeats;
