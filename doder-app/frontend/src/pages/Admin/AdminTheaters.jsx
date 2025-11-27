// AdminTheaters.jsx (Finalized with Query Param Reading)

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // 💥 REQUIRED IMPORT 💥

const API_BASE_URL = "http://localhost:8081/api";

function AdminTheaters() {
    // 💥 Read the cinema_id from the URL query parameters 💥
    const query = new URLSearchParams(useLocation().search);
    const inputCinemaId = Number(query.get("cinema_id")) || 0; // Set default to 0 for validation

    const [theaters, setTheaters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    
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
            // Note: Public endpoint /theaters but requires token for admin context
            const response = await fetch(`${API_BASE_URL}/theaters?cinema_id=${inputCinemaId}`, {
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

    // ... (handleInputChange and handleDeleteTheater functions remain the same) ...
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
            
            // ... (success/failure handling) ...
        } catch (err) {
            // ...
        }
    };


    if (inputCinemaId === 0) return <div>🚫 Error: Cinema ID is missing. Please navigate from the Cinema Management page.</div>;
    if (loading) return <div>Loading theaters for Cinema ID {inputCinemaId}...</div>;

    return (
        <div className="admin-page">
            <h1>จัดการห้องฉาย (Cinema ID: {inputCinemaId})</h1>
            {/* ... (rest of the JSX, including table display) ... */}
        </div>
    );
}

export default AdminTheaters;