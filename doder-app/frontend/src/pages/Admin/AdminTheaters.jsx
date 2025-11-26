// AdminTheaters.jsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Use to get cinema_id from URL

const API_BASE_URL = "http://localhost:8081/api";

function AdminTheaters() {
    const query = new URLSearchParams(useLocation().search);
    const inputCinemaId = Number(query.get("cinema_id")) || 1; // Default to ID 1 for testing

    const [theaters, setTheaters] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State for Create Form
    const [newTheater, setNewTheater] = useState({
        theater_name: '',
        total_seats: 0,
        theater_type: 'Standard', // Default type
    });
    const [status, setStatus] = useState(null);

    // --- FETCH THEATERS FOR THE SELECTED CINEMA (READ) ---
    const fetchTheaters = async () => {
        setLoading(true);
        setStatus(null);
        try {
            // Fetch theaters filtered by cinema_id
            const response = await fetch(`${API_BASE_URL}/theaters?cinema_id=${inputCinemaId}`); 
            
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
    }, [inputCinemaId]);

    // --- HANDLE FORM CHANGES ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTheater(prev => ({ ...prev, [name]: value }));
    };

    // --- CREATE NEW THEATER ---
    const handleCreateTheater = async (e) => {
        e.preventDefault();
        setStatus(null);
        
        const token = localStorage.getItem('authToken'); 
        if (!token) return;

        try {
            const theaterData = { ...newTheater, cinema_id: inputCinemaId };
            
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
                throw new Error(data.error || "Failed to create theater.");
            }

            setStatus({ type: 'success', message: "Theater created successfully!" });
            fetchTheaters(); 
            setNewTheater({ theater_name: '', total_seats: 0, theater_type: 'Standard' }); 

        } catch (err) {
            setStatus({ type: 'error', message: `Creation failed: ${err.message}` });
        }
    };
    
    // --- DELETE THEATER (Soft Delete) ---
    const handleDeleteTheater = async (theaterId) => {
        if (!window.confirm("Are you sure you want to deactivate this theater?")) return;

        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/theaters/${theaterId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to delete theater.");

            // Backend performs soft delete (is_active = FALSE)
            setStatus({ type: 'success', message: `Theater ID ${theaterId} deactivated.` });
            fetchTheaters(); 

        } catch (err) {
            setStatus({ type: 'error', message: `Deletion failed: ${err.message}` });
        }
    };


    if (inputCinemaId === 0) return <div>Error: Cinema ID is missing. Please navigate from the Cinema Management page.</div>;
    if (loading) return <div>Loading theaters for Cinema ID {inputCinemaId}...</div>;

    return (
        <div className="admin-page">
            <h1>จัดการห้องฉาย (Cinema ID: {inputCinemaId})</h1>
            
            {status && (
                <p style={{ color: status.type === 'error' ? 'red' : 'green' }}>
                    {status.message}
                </p>
            )}

            {/* --- CREATE THEATER FORM --- */}
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
            
            {/* --- READ/LIST THEATERS TABLE --- */}
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
                                <button onClick={() => alert(`Seats for Theater ID ${t.theater_id}`)} style={{ marginRight: '10px' }}>จัดการที่นั่ง</button>
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