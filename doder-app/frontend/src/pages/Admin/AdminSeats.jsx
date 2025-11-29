// AdminSeats.jsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE_URL = "/api";

function AdminSeats() {
    // Read the theater_id from the URL query parameters
    const query = new URLSearchParams(useLocation().search);
    const inputTheaterId = Number(query.get("theater_id")) || 0;

    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);

    // State for Bulk Creation Form
    const [bulkSeats, setBulkSeats] = useState({
        rows: '', // e.g., A,B,C,D
        seatsPerRow: 0,
        seatType: 'standard',
    });

    // --- Helper Functions ---

    const getToken = () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setStatus({ type: 'error', message: "Unauthorized. Please log in as Admin." });
        }
        return token;
    };

    const handleBulkInputChange = (e) => {
        const { name, value } = e.target;
        setBulkSeats(prev => ({ ...prev, [name]: value }));
    };


    // --- FETCH SEATS (READ) ---
    const fetchSeats = async () => {
        if (inputTheaterId === 0) return;

        setLoading(true);
        setStatus(null);
        const token = getToken();
        if (!token) return;

        try {
            // GET /api/seats?theater_id=X
            const response = await fetch(`${API_BASE_URL}/seats?theater_id=${inputTheaterId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch seat list.");

            const data = await response.json();
            setSeats(data.data || []);

        } catch (err) {
            setStatus({ type: 'error', message: `Fetch failed: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (inputTheaterId > 0) {
            fetchSeats();
        }
    }, [inputTheaterId]);


    // --- BULK CREATE SEATS (C) ---
    const handleBulkCreate = async (e) => {
        e.preventDefault();
        setStatus(null);
        const token = getToken();
        if (!token) return;

        // Prepare the payload, converting the 'rows' string to an array of strings
        const rowsArray = bulkSeats.rows.toUpperCase().split(',').map(r => r.trim()).filter(r => r.length > 0);
        
        const payload = {
            theater_id: inputTheaterId,
            rows: rowsArray,
            seats_per_row: parseInt(bulkSeats.seatsPerRow, 10),
            seat_type: bulkSeats.seatType,
        };

        try {
            // POST /api/admin/seats/bulk
            const response = await fetch(`${API_BASE_URL}/admin/seats/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to create seats in bulk.");
            }

            setStatus({ 
                type: 'success', 
                message: `Seats created: ${data.data.created}, Skipped: ${data.data.skipped}. Total: ${data.data.total}` 
            });
            
            // Clear form and refresh list
            setBulkSeats({ rows: '', seatsPerRow: 0, seatType: 'standard' });
            fetchSeats(); 

        } catch (err) {
            setStatus({ type: 'error', message: `Creation failed: ${err.message}` });
        }
    };

    // --- DELETE SEAT (Soft Delete D) ---
    const handleDeleteSeat = async (seatId) => {
        if (!window.confirm("Are you sure you want to deactivate this seat?")) return;

        const token = getToken();
        if (!token) return;

        try {
            // DELETE /api/admin/seats/:id
            const response = await fetch(`${API_BASE_URL}/admin/seats/${seatId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to deactivate seat.");

            setStatus({ type: 'success', message: `Seat ID ${seatId} deactivated.` });
            fetchSeats();

        } catch (err) {
            setStatus({ type: 'error', message: `Deletion failed: ${err.message}` });
        }
    };


    if (inputTheaterId === 0) return <div>🚫 Error: Theater ID is missing. Please navigate from the Theater Management page.</div>;
    if (loading) return <div>Loading seat layout for Theater ID {inputTheaterId}...</div>;

    return (
        <div className="admin-page" style={{ padding: '20px' }}>
            <h1>จัดการที่นั่ง (Theater ID: {inputTheaterId})</h1>
            
            {status && (
                <div style={{ color: status.type === 'error' ? 'red' : 'green', border: '1px solid', padding: '10px', marginBottom: '20px' }}>
                    {status.message}
                </div>
            )}

            {/* --- BULK SEAT CREATION FORM --- */}
            <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>+ สร้างที่นั่งแบบกลุ่ม (Bulk Creation)</h2>
            <p style={{ fontSize: '0.9em', color: '#888' }}>*Rows must be comma-separated (e.g., A, B, C, D)</p>
            <form onSubmit={handleBulkCreate} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px', marginBottom: '40px' }}>
                
                <input type="text" name="rows" placeholder="แถว (เช่น A,B,C)" value={bulkSeats.rows} onChange={handleBulkInputChange} required />
                <input type="number" name="seatsPerRow" placeholder="จำนวนที่นั่ง/แถว" value={bulkSeats.seatsPerRow} onChange={handleBulkInputChange} required />
                
                <select name="seatType" value={bulkSeats.seatType} onChange={handleBulkInputChange}>
                    <option value="standard">Standard</option>
                    <option value="vip">VIP</option>
                </select>
                <button type="submit">สร้างที่นั่ง</button>
            </form>

            {/* --- SEAT LAYOUT DISPLAY --- */}
            <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>ผังที่นั่งปัจจุบัน ({seats.length} ที่นั่ง)</h2>
            
            {seats.length === 0 ? (
                <p>ไม่พบที่นั่งในโรงนี้ โปรดใช้ฟอร์มสร้างด้านบน</p>
            ) : (
                <div className="seat-grid-map" style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '20px' }}>
                    {/* Simple rendering of seats. This can be complex if you need a graphical layout. */}
                    {seats.map(seat => (
                        <div 
                            key={seat.seat_id} 
                            style={{ 
                                padding: '5px 10px', 
                                border: '1px solid', 
                                backgroundColor: seat.is_active ? (seat.seat_type === 'vip' ? 'gold' : 'lightgreen') : 'gray',
                                cursor: 'pointer',
                            }}
                            title={`ID: ${seat.seat_id}, Type: ${seat.seat_type}`}
                            onClick={() => handleDeleteSeat(seat.seat_id)} // Clicking deactivates the seat
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