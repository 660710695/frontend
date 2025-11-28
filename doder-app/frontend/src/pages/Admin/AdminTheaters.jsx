// AdminTheaters.jsx (Finalized with Query Param Reading)

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // 💥 REQUIRED IMPORT 💥
import { useNavigate } from 'react-router-dom'; // 💥 NEW IMPORT 💥

const API_BASE_URL = "http://localhost:8081/api";

function AdminTheaters() {
    // 💥 Read the cinema_id from the URL query parameters 💥
    const query = new URLSearchParams(useLocation().search);
    const inputCinemaId = Number(query.get("cinema_id")) || 0; // Set default to 0 for validation

    const [theaters, setTheaters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const navigate = useNavigate(); // 💥 Initialize useNavigate 💥
    // State for Create Form (Cinema ID is now included via the URL parameter)
    const [newTheater, setNewTheater] = useState({
        theater_name: '',
        total_seats: 0,
        theater_type: 'Standard',
    });

    // Function to get token
    const getToken = () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setStatus({ type: 'error', message: "Unauthorized. Please log in as Admin." });
        }
        return token;
    };

    // --- FETCH THEATERS FOR THE SELECTED CINEMA (READ) ---
    const fetchTheaters = async () => {
        if (inputCinemaId === 0) return;

        setLoading(true);
        setStatus(null);
        const token = getToken();
        if (!token) return;

        try {
            // Fetch theaters filtered by cinema_id
            const response = await fetch(`${API_BASE_URL}/theaters?cinema_id=${inputCinemaId}`, {
                // 💥 FIX: ADD AUTHORIZATION HEADER HERE 💥
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch theater list.");

            const data = await response.json();
            setTheaters(data.data || []);
        } catch (err) {
            setStatus({ type: 'error', message: `Fetch failed: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (inputCinemaId > 0) {
            fetchTheaters();
        }
    }, [inputCinemaId]); // Re-fetch if the cinema ID changes

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTheater(prev => ({ ...prev, [name]: value }));
    };
    // Note: You must update handleCreateTheater and handleDeleteTheater to use getToken()

    // --- CREATE NEW THEATER ---
    const handleCreateTheater = async (e) => {
        e.preventDefault();
        setStatus(null);

        const token = getToken();
        if (!token) return;

        // 💥 Prepare payload with the mandatory cinema_id from the URL 💥
        const theaterData = {
            ...newTheater,
            cinema_id: inputCinemaId,
            total_seats: parseInt(newTheater.total_seats, 10) // Ensure total_seats is int
        };

        try {
            const response = await fetch(`${API_BASE_URL}/admin/theaters`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(theaterData),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                // Display the specific error from Go if conversion fails again, or other error occurs
                throw new Error(data.error || "Failed to create movie.");
            }

            setStatus({ type: 'success', message: "Theater created successfully!" });
            fetchTheaters(); // Refresh the list

            // 💥 FIX: Use setNewTheater to reset the form state 💥
            setNewTheater({ // Reset form
                theater_name: '',
                total_seats: 0,
                theater_type: 'Standard',
            });
        } catch (err) {
            setStatus({ type: 'error', message: `Creation failed: ${err.message}` });
        }
    };

    const handleDeleteTheater = async (theaterId) => {
        if (!window.confirm("Are you sure you want to deactivate this theater?")) return;

        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/theaters/${theaterId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to delete theater.");

            setStatus({ type: 'success', message: `Theater ID ${theaterId} deactivated.` });
            fetchTheaters();

        } catch (err) {
            setStatus({ type: 'error', message: `Deletion failed: ${err.message}` });
        }
    };

    if (inputCinemaId === 0) return <div>🚫 Error: Cinema ID is missing. Please navigate from the Cinema Management page.</div>;
    if (loading) return <div>Loading theaters for Cinema ID {inputCinemaId}...</div>;

    // AdminTheaters.jsx (Partial return block)

    return (
        <div className="admin-page">
            <h1>จัดการห้องฉาย (Cinema ID: {inputCinemaId})</h1>

            {status && (
                <p style={{ color: status.type === 'error' ? 'red' : 'green' }}>
                    {status.message}
                </p>
            )}

            {/* --- CREATE NEW THEATER FORM (RESTORED) --- */}
            <h2>+ เพิ่มห้องฉายใหม่</h2>
            <form onSubmit={handleCreateTheater} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                <input type="text" name="theater_name" placeholder="ชื่อห้องฉาย (A1, IMAX)" value={newTheater.theater_name} onChange={handleInputChange} required />
                <input type="number" name="total_seats" placeholder="จำนวนที่นั่งรวม" value={newTheater.total_seats} onChange={handleInputChange} required />
                <select name="theater_type" value={newTheater.theater_type} onChange={handleInputChange}>
                    <option value="Standard">Standard</option>
                    <option value="IMAX">IMAX</option>
                    <option value="VIP">VIP</option>
                </select>
                <button type="submit">บันทึกห้องฉาย</button>
            </form>

            <h2 style={{ marginTop: '40px' }}>รายการห้องฉายทั้งหมด ({theaters.length})</h2>

            {/* --- READ/LIST THEATERS TABLE (RESTORED) --- */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ชื่อห้อง</th>
                        <th>ประเภท</th>
                        <th>ที่นั่งรวม</th>
                        <th>สถานะ</th>
                        <th>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {theaters.map(t => (
                        <tr key={t.theater_id}>
                            <td>{t.theater_id}</td>
                            <td>{t.theater_name}</td>
                            <td>{t.theater_type}</td>
                            <td>{t.total_seats}</td>
                            <td style={{ color: t.is_active ? 'green' : 'red' }}>
                                {t.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            </td>
                            <td>
                                <button
                                    // OLD: onClick={() => alert(`Seats for Theater ID ${t.theater_id}`)} 
                                    onClick={() => navigate(`/admin/seats?theater_id=${t.theater_id}`)}
                                    style={{ marginRight: '10px' }}>
                                    จัดการที่นั่ง
                                </button>
                                <button onClick={() => handleDeleteTheater(t.theater_id)} disabled={!t.is_active}>
                                    ปิดใช้งาน
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminTheaters;