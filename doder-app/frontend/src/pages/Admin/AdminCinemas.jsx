// AdminCinemas.jsx

import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../../contexts/AuthContext'; // If you need user details

const API_BASE_URL = "http://localhost:8081/api";

function AdminCinemas() {
    const [cinemas, setCinemas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State for the Create Form
    const [newCinema, setNewCinema] = useState({
        cinema_name: '',
        address: '',
        city: '',
    });
    const [status, setStatus] = useState(null);

    // --- FETCH ALL CINEMAS (READ) ---
    const fetchCinemas = async () => {
        setLoading(true);
        setError(null);
        try {
            // Admin fetches all cinemas, including inactive ones (without ?is_active=true)
            const response = await fetch(`${API_BASE_URL}/cinemas`); 
            
            if (!response.ok) throw new Error("Failed to fetch cinema list.");
            
            const data = await response.json();
            setCinemas(data.data || []);
        } catch (err) {
            setError(err.message);
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCinemas();
    }, []);

    // --- HANDLE FORM CHANGES ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCinema(prev => ({ ...prev, [name]: value }));
    };

    // --- CREATE NEW CINEMA ---
    const handleCreateCinema = async (e) => {
        e.preventDefault();
        setStatus(null);
        
        const token = localStorage.getItem('authToken'); 
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/cinemas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // AdminMiddleware check
                },
                body: JSON.stringify(newCinema),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to create cinema.");
            }

            setStatus({ type: 'success', message: "Cinema created successfully!" });
            fetchCinemas(); // Refresh the list
            setNewCinema({ cinema_name: '', address: '', city: '' }); // Reset form

        } catch (err) {
            setStatus({ type: 'error', message: `Creation failed: ${err.message}` });
        }
    };
    
    // --- DELETE CINEMA (Soft Delete) ---
    const handleDeleteCinema = async (cinemaId) => {
        if (!window.confirm("Are you sure you want to deactivate this cinema? This affects all theaters inside.")) return;

        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/cinemas/${cinemaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to delete cinema.");

            // Backend performs soft delete (is_active = FALSE)
            setStatus({ type: 'success', message: `Cinema ID ${cinemaId} deactivated.` });
            fetchCinemas(); // Refresh list 

        } catch (err) {
            setStatus({ type: 'error', message: `Deletion failed: ${err.message}` });
        }
    };


    if (loading) return <div>Loading cinema management data...</div>;

    return (
        <div className="admin-page">
            <h1>จัดการโรงภาพยนตร์</h1>
            
            {status && (
                <p style={{ color: status.type === 'error' ? 'red' : 'green' }}>
                    {status.message}
                </p>
            )}

            {/* --- CREATE CINEMA FORM --- */}
            <h2>+ เพิ่มโรงภาพยนตร์ใหม่</h2>
            <form onSubmit={handleCreateCinema} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <input type="text" name="cinema_name" placeholder="ชื่อโรงภาพยนตร์" value={newCinema.cinema_name} onChange={handleInputChange} required />
                <input type="text" name="city" placeholder="จังหวัด/เมือง" value={newCinema.city} onChange={handleInputChange} required />
                <input type="text" name="address" placeholder="ที่อยู่" value={newCinema.address} onChange={handleInputChange} required />
                <button type="submit" style={{ gridColumn: 'span 3' }}>บันทึกโรงภาพยนตร์</button>
            </form>

            <h2 style={{ marginTop: '40px' }}>รายการโรงภาพยนตร์ทั้งหมด ({cinemas.length})</h2>
            
            {/* --- READ/LIST CINEMAS TABLE --- */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ชื่อ</th>
                        <th>ที่อยู่</th>
                        <th>สถานะ</th>
                        <th>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {cinemas.map(c => (
                        <tr key={c.cinema_id}>
                            <td>{c.cinema_id}</td>
                            <td>{c.cinema_name}</td>
                            <td>{c.city}</td>
                            <td style={{ color: c.is_active ? 'green' : 'red' }}>
                                {c.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            </td>
                            <td>
                                {/* Placeholder for Theaters Link */}
                                <button onClick={() => alert(`Go to Theaters for Cinema ID ${c.cinema_id}`)} style={{ marginRight: '10px' }}>จัดการห้องฉาย</button>
                                
                                {/* Delete Button (Soft Delete) */}
                                <button onClick={() => handleDeleteCinema(c.cinema_id)} disabled={!c.is_active}>
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

export default AdminCinemas;