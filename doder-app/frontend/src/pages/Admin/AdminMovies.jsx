import React, { useState, useEffect } from 'react';
import '../../styles/AdminMovies.css';

const API_BASE_URL = "http://localhost:8081/api";

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

    const fetchMovies = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/movies`);
            if (!response.ok) throw new Error("Failed to fetch movie list.");
            const data = await response.json();
            setMovies(data.data || []);
        } catch (err) {
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

    const handleCreateMovie = async (e) => {
        e.preventDefault();
        setCreationStatus(null);

        const token = localStorage.getItem('authToken');
        if (!token) {
            setCreationStatus({ type: 'error', message: "Unauthorized. Please log in as Admin." });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/movies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newMovie),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to create movie.");
            }

            setCreationStatus({ type: 'success', message: "Movie created successfully!" });
            fetchMovies();

            setNewMovie({
                title: '',
                description: '',
                duration: 0,
                language: '',
                subtitle: '',
                poster_url: '',
                release_date: '',
            });

        } catch (err) {
            setCreationStatus({ type: 'error', message: err.message });
        }
    };

    const handleDeleteMovie = async (id) => {
        if (!window.confirm("Are you sure you want to deactivate this movie?")) return;

        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/movies/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to delete movie.");

            setCreationStatus({ type: 'success', message: `Movie ID ${id} deactivated.` });
            fetchMovies();

        } catch (err) {
            setCreationStatus({ type: 'error', message: err.message });
        }
    };

    if (loading) return <div className="admin-loading">กำลังโหลด...</div>;

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
