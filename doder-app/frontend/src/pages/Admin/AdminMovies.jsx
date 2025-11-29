// AdminMovies.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/AdminCommon.css';

const API_BASE_URL = "/api";

const initialMovieState = {
    title: '',
    duration: '',
    genres: '', // comma-separated string for form
    is_active: true,
};

function AdminMovies() {
    const { user, isLoading: isAuthLoading, logout } = useAuth();
    const isAdmin = user && user.role === 'admin';

    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [newMovie, setNewMovie] = useState(initialMovieState);
    const [editingMovieId, setEditingMovieId] = useState(null);

    const getToken = () => localStorage.getItem('authToken');

    // --- Fetch all movies ---
    const fetchMovies = async () => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setStatus(null);
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/movies`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || "Failed to fetch movies.");
            setMovies(data.data || []);
        } catch (err) {
            setStatus({ type: 'error', message: `Fetch failed: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthLoading) {
            if (isAdmin) fetchMovies();
            else if (user) {
                setStatus({ type: 'error', message: "Access Denied: Admin privileges required." });
                setLoading(false);
            } else {
                setStatus({ type: 'error', message: "Unauthorized: Please log in." });
                setLoading(false);
            }
        }
    }, [isAuthLoading, isAdmin]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMovie(prev => ({ ...prev, [name]: name === 'duration' ? parseInt(value, 10) : value }));
    };

    const handleEditClick = (movie) => {
    // Check movie.genres instead of movie.genre
    const genreString = Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres; 
    setNewMovie({
        title: movie.title,
        duration: movie.duration,
        genres: genreString, // 💥 FIX: Use genres 💥
        is_active: movie.is_active,
    });
        setEditingMovieId(movie.movie_id);
        setStatus(null);
    };

    const handleCancelEdit = () => {
        setNewMovie(initialMovieState);
        setEditingMovieId(null);
        setStatus(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        editingMovieId ? handleUpdateMovie(editingMovieId) : handleCreateMovie();
    };

    const handleCreateMovie = async () => {
        setStatus(null);
        const token = getToken();
        if (!token) return;

        try {
            const payload = {
                ...newMovie,
                genres: newMovie.genres.split(',').map(g => g.trim()),
            };

            const response = await fetch(`${API_BASE_URL}/admin/movies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || "Failed to create movie.");

            setStatus({ type: 'success', message: "Movie created successfully!" });
            fetchMovies();
            setNewMovie(initialMovieState);

        } catch (err) {
            setStatus({ type: 'error', message: `Creation failed: ${err.message}` });
        }
    };

    const handleUpdateMovie = async (movieId) => {
        setStatus(null);
        const token = getToken();
        if (!token) return;

        try {
            const payload = {
                ...newMovie,
                genres: newMovie.genres.split(',').map(g => g.trim()),
            };

            const response = await fetch(`${API_BASE_URL}/admin/movies/${movieId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || "Failed to update movie.");

            setStatus({ type: 'success', message: `Movie ID ${movieId} updated successfully!` });
            fetchMovies();
            handleCancelEdit();

        } catch (err) {
            setStatus({ type: 'error', message: `Update failed: ${err.message}` });
        }
    };

    const handleDeleteMovie = async (movieId, isActive) => {
        const action = isActive ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} this movie?`)) return;

        const token = getToken();
        if (!token) return;

        try {
            const method = isActive ? 'DELETE' : 'PUT';
            const body = isActive ? null : JSON.stringify({ is_active: true });
            const headers = { 'Authorization': `Bearer ${token}` };
            if (method === 'PUT') headers['Content-Type'] = 'application/json';

            const response = await fetch(`${API_BASE_URL}/admin/movies/${movieId}`, { method, headers, body });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || `Failed to ${action} movie.`);

            setStatus({ type: 'success', message: `Movie ID ${movieId} ${action}d.` });
            fetchMovies();

        } catch (err) {
            setStatus({ type: 'error', message: `Operation failed: ${err.message}` });
        }
    };

    if (isAuthLoading) return <div className="admin-page">กำลังโหลดการตรวจสอบสิทธิ์...</div>;

    if (!isAdmin) {
        return (
            <div className="admin-page">
                <h1>จัดการภาพยนตร์</h1>
                <div className="status-error">Access Denied: Admin access required.</div>
                {user && <button className="secondary" onClick={logout}>ออกจากระบบ</button>}
            </div>
        );
    }

    if (loading) return <div className="admin-page">Loading movie data...</div>;

    return (
        <div className="admin-page">
            <h1>จัดการภาพยนตร์</h1>

            {status && (
                <div className={status.type === 'error' ? 'status-error' : 'status-success'}>
                    {status.message}
                </div>
            )}

            <h2>{editingMovieId ? `✏️ แก้ไขภาพยนตร์ ID: ${editingMovieId}` : '+ เพิ่มภาพยนตร์ใหม่'}</h2>

            <form className="admin-form" onSubmit={handleSubmit}>
                <input type="text" name="title" placeholder="ชื่อภาพยนตร์" value={newMovie.title} onChange={handleInputChange} required />
                <input type="number" name="duration" placeholder="ระยะเวลา (นาที)" value={newMovie.duration} onChange={handleInputChange} required />
                <input type="text" name="genres" placeholder="ประเภท (เช่น Action, Comedy)" value={newMovie.genres} onChange={handleInputChange} required />

                <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit" className="primary">
                        {editingMovieId ? 'บันทึกการแก้ไข (Update)' : 'บันทึกภาพยนตร์ (Create)'}
                    </button>
                    {editingMovieId && <button type="button" className="secondary" onClick={handleCancelEdit}>ยกเลิก</button>}
                </div>
            </form>

            <h2>รายการภาพยนตร์ทั้งหมด ({movies.length})</h2>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ชื่อภาพยนตร์</th>
                        <th>ระยะเวลา</th>
                        <th>ประเภท</th>
                        <th>สถานะ</th>
                        <th>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {movies.map(m => (
                        <tr key={m.movie_id}>
                            <td>{m.movie_id}</td>
                            <td>{m.title}</td>
                            <td>{m.duration} นาที</td>
                            <td>{Array.isArray(m.genres) ? m.genres.join(', ') : m.genres}</td>
                            <td className={m.is_active ? 'status-success' : 'status-error'}>
                                {m.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            </td>
                            <td style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <button className="primary" onClick={() => handleEditClick(m)}>แก้ไข</button>
                                <button className={m.is_active ? 'danger' : 'primary'} onClick={() => handleDeleteMovie(m.movie_id, m.is_active)}>
                                    {m.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
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
