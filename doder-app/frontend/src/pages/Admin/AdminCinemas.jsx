// AdminCinemas.jsx (Finalized with Navigation to AdminTheaters)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 💥 NEW IMPORT 💥

const API_BASE_URL = "/api";

function AdminCinemas() {
    const [cinemas, setCinemas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const navigate = useNavigate(); // 💥 Initialize useNavigate 💥

    // State for the Create Form
    const [newCinema, setNewCinema] = useState({
        cinema_name: '',
        address: '',
        city: '',
    });

    // Function to get token (to reduce repetitive code)
    const getToken = () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setStatus({ type: 'error', message: "Unauthorized. Please log in as Admin." });
        }
        return token;
    };

    // --- FETCH ALL CINEMAS (READ) ---
    const fetchCinemas = async () => {
        setLoading(true);
        setStatus(null);
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/cinemas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch cinema list.");

            const data = await response.json();
            setCinemas(data.data || []);
        } catch (err) {
            setStatus({ type: 'error', message: `Fetch failed: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCinemas();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCinema(prev => ({ ...prev, [name]: value }));
    };
    // Note: You must update handleCreateCinema to use getToken() for simplicity
    const handleCreateCinema = async (e) => {
        e.preventDefault();
        setStatus(null);

        const token = getToken(); // Use the helper function to get the token
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/cinemas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Send token for Admin access
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

        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/cinemas/${cinemaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to delete cinema.");

            setStatus({ type: 'success', message: `Cinema ID ${cinemaId} deactivated.` });
            fetchCinemas();

        } catch (err) {
            setStatus({ type: 'error', message: `Deletion failed: ${err.message}` });
        }
    };

    // 💥 NEW NAVIGATION HANDLER 💥
    const handleManageTheaters = (cinemaId) => {
        navigate(`/admin/theaters?cinema_id=${cinemaId}`);
    };


    if (loading) return <div>Loading cinema management data...</div>;

    // ... (rest of the component JSX) ...

    return (
        <div className="admin-page">
            <h1>จัดการโรงภาพยนตร์</h1>

            {/* ... (Status and Form JSX) ... */}

            <h2 style={{ marginTop: '40px' }}>รายการโรงภาพยนตร์ทั้งหมด ({cinemas.length})</h2>

            {/* --- READ/LIST CINEMAS TABLE --- */}
            <table>
                {/* ... (Table Header JSX) ... */}
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
                                {/* 💥 NAVIGATION BUTTON 💥 */}
                                <button
                                    onClick={() => handleManageTheaters(c.cinema_id)}
                                    style={{ marginRight: '10px' }}
                                >
                                    จัดการห้องฉาย
                                </button>

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