import React, { useState, useEffect } from 'react';
import '../../styles/AdminMovies.css';

const API_BASE_URL = "/api";

function AdminMovies() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newMovie, setNewMovie] = useState({
        title: '',
        description: '',
        duration: 0,
        language: '',
        subtitle: '',
        poster_url: '',
        release_date: '',
    });

    const [creationStatus, setCreationStatus] = useState(null);

    // --- FETCH ALL MOVIES (READ) ---
    const fetchMovies = async () => {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("Unauthorized: Please log in again.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/movies`, {
                method: 'GET',
                headers: {
                    // FIX 2: Added Authorization Header for fetchMovies
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            // Check if the backend returned an error (e.g., 403 Forbidden because it's in the admin group)
            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to fetch movie list.");
            }

            setMovies(data.data || []);

        } catch (err) {
            // Display the specific error message (e.g., "Admin access required")
            setError(err.message);
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMovie(prev => ({ ...prev, [name]: value }));
    };


    // --- CREATE NEW MOVIE (Runs ONLY on form submission) ---
    // FIX 1: Correctly defined handleCreateMovie function
    const handleCreateMovie = async (e) => {
        e.preventDefault();
        setCreationStatus(null);

        const token = localStorage.getItem('authToken');
        if (!token) {
            setCreationStatus({ type: 'error', message: "Unauthorized. Please log in as Admin." });
            return;
        }

        // 💥 FIX: Prepare the payload and convert duration to number 💥
        const payload = {
            ...newMovie,
            duration: parseInt(newMovie.duration, 10), // Convert string to integer
            // Ensure total_seats is a number too, if that field exists and uses string input
            // total_seats: parseInt(newMovie.total_seats, 10), 
        };

        try {
            const response = await fetch(`${API_BASE_URL}/admin/movies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // Send the converted payload
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                // Display the specific error from Go if conversion fails again, or other error occurs
                throw new Error(data.error || "Failed to create movie.");
            }

            setCreationStatus({ type: 'success', message: "Movie created successfully!" });
            fetchMovies(); // Refresh the list

            // Reset form fields after success
            setNewMovie({
                title: '', description: '', duration: 0, language: '',
                subtitle: '', poster_url: '', release_date: '',
            });

        } catch (err) {
            // ... error handling ...
            setCreationStatus({ type: 'error', message: `Creation failed: ${err.message}` });
        }
    };

    // --- DELETE MOVIE (Soft Delete) ---
    const handleDeleteMovie = async (movieId) => { // FIX 3: Changed function param to movieId for clarity
        if (!window.confirm("Are you sure you want to deactivate this movie?")) return;

        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/movies/${movieId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}` // ✅ Token sent
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to delete movie.");
            }

            setCreationStatus({ type: 'success', message: `Movie ID ${movieId} deactivated.` });
            fetchMovies();

        } catch (err) {
            setCreationStatus({ type: 'error', message: err.message });
        }
    };

    if (loading) return <div className="admin-loading">กำลังโหลด...</div>;

    // Display general errors (like initial fetch failure)
    if (error) return <div className="admin-error">Error: {error}</div>;

    return (
        <div className="admin-movies-container">
            <h1 className="admin-movies-title">🎬 จัดการภาพยนตร์</h1>

            {creationStatus && (
                <div className={`admin-status ${creationStatus.type}`}>
                    {creationStatus.message}
                </div>
            )}

            {/* CREATE FORM */}
            <h2 className="admin-section-title">+ เพิ่มภาพยนตร์ใหม่</h2>
            <form className="admin-form" onSubmit={handleCreateMovie}>
                <input type="text" name="title" placeholder="ชื่อเรื่อง" value={newMovie.title} onChange={handleInputChange} required />
                <input type="number" name="duration" placeholder="ระยะเวลา (นาที)" value={newMovie.duration} onChange={handleInputChange} required />
                <input type="text" name="language" placeholder="ภาษา" value={newMovie.language} onChange={handleInputChange} required />
                <input type="text" name="subtitle" placeholder="คำบรรยาย" value={newMovie.subtitle} onChange={handleInputChange} />
                <input type="url" name="poster_url" placeholder="Poster URL" value={newMovie.poster_url} onChange={handleInputChange} required />
                <input type="date" name="release_date" value={newMovie.release_date} onChange={handleInputChange} required />

                <textarea name="description" placeholder="รายละเอียด/เรื่องย่อ" value={newMovie.description} onChange={handleInputChange} required />

                <button type="submit" className="admin-submit-btn">บันทึกภาพยนตร์</button>
            </form>

            {/* LIST TABLE */}
            <h2 className="admin-section-title">รายการภาพยนตร์ทั้งหมด ({movies.length})</h2>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ชื่อเรื่อง</th>
                        <th>สถานะ</th>
                        <th>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {movies.map(movie => (
                        <tr key={movie.movie_id}>
                            <td>{movie.movie_id}</td>
                            <td>{movie.title}</td>
                            <td className={movie.is_active ? "active" : "inactive"}>
                                {movie.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                            </td>
                            <td>
                                <button className="admin-edit-btn" onClick={() => alert(`Edit ${movie.title}`)}>
                                    แก้ไข
                                </button>
                                <button
                                    className="admin-delete-btn"
                                    onClick={() => handleDeleteMovie(movie.movie_id)}
                                    disabled={!movie.is_active}
                                >
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

export default AdminMovies;