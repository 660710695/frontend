// AdminMovies.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/AdminCommon.css';

const API_BASE_URL = "/api";

const initialMovieState = {
    title: '',
    description: '',
    duration: '',
    genres: '', 
    language: '',
    subtitle: '',
    poster_url: '',
    release_date: '',
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
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const fileInputRef = useRef(null);

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
        setNewMovie(prev => ({ ...prev, [name]: name === 'duration' ? parseInt(value, 10) || '' : value }));
    };

    const handleEditClick = (movie) => {
        // Check movie.genres instead of movie.genre
        const genreString = Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres || ''; 
        setNewMovie({
            title: movie.title || '',
            description: movie.description || '',
            duration: movie.duration || '',
            genres: genreString,
            language: movie.language || '',
            subtitle: movie.subtitle || '',
            poster_url: movie.poster_url || '',
            release_date: movie.release_date ? movie.release_date.split('T')[0] : '',
            is_active: movie.is_active,
        });
        setEditingMovieId(movie.movie_id);
        setPreviewImage(null); // Clear preview, will show existing poster_url instead
        setStatus(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCancelEdit = () => {
        setNewMovie(initialMovieState);
        setEditingMovieId(null);
        setStatus(null);
        setPreviewImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Handle image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setStatus({ type: 'error', message: 'รองรับเฉพาะไฟล์ .jpg, .jpeg, .png, .webp เท่านั้น' });
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setStatus({ type: 'error', message: 'ไฟล์ใหญ่เกิน 5MB' });
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload to server
        setUploading(true);
        setStatus(null);
        const token = getToken();

        try {
            const formData = new FormData();
            formData.append('poster', file);

            const response = await fetch(`${API_BASE_URL}/admin/upload/poster`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'อัพโหลดรูปภาพไม่สำเร็จ');
            }

            // Set the poster URL to the form
            setNewMovie(prev => ({ ...prev, poster_url: data.data.url }));
            setStatus({ type: 'success', message: `อัพโหลดรูปภาพสำเร็จ: ${data.data.filename}` });

        } catch (err) {
            setStatus({ type: 'error', message: `อัพโหลดล้มเหลว: ${err.message}` });
            setPreviewImage(null);
        } finally {
            setUploading(false);
        }
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
                title: newMovie.title,
                description: newMovie.description || null,
                duration: parseInt(newMovie.duration, 10),
                genres: newMovie.genres ? newMovie.genres.split(',').map(g => g.trim()).filter(g => g) : [],
                language: newMovie.language || null,
                subtitle: newMovie.subtitle || null,
                poster_url: newMovie.poster_url || null,
                release_date: newMovie.release_date || null,
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
                title: newMovie.title,
                description: newMovie.description || null,
                duration: parseInt(newMovie.duration, 10),
                genres: newMovie.genres ? newMovie.genres.split(',').map(g => g.trim()).filter(g => g) : [],
                language: newMovie.language || null,
                subtitle: newMovie.subtitle || null,
                poster_url: newMovie.poster_url || null,
                release_date: newMovie.release_date || null,
                is_active: newMovie.is_active,
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
                <div className="form-grid">
                    <div className="form-group">
                        <label>ชื่อภาพยนตร์ *</label>
                        <input type="text" name="title" placeholder="เช่น Avengers: Endgame" value={newMovie.title} onChange={handleInputChange} required />
                    </div>
                    
                    <div className="form-group">
                        <label>ระยะเวลา (นาที) *</label>
                        <input type="number" name="duration" placeholder="เช่น 120" value={newMovie.duration} onChange={handleInputChange} required min="1" />
                    </div>
                    
                    <div className="form-group">
                        <label>ประเภท (คั่นด้วย comma) *</label>
                        <input type="text" name="genres" placeholder="เช่น Action, Adventure, Sci-Fi" value={newMovie.genres} onChange={handleInputChange} required />
                    </div>
                    
                    <div className="form-group">
                        <label>ภาษา</label>
                        <input type="text" name="language" placeholder="เช่น English, Thai" value={newMovie.language} onChange={handleInputChange} />
                    </div>
                    
                    <div className="form-group">
                        <label>ซับไตเติล</label>
                        <input type="text" name="subtitle" placeholder="เช่น Thai, English" value={newMovie.subtitle} onChange={handleInputChange} />
                    </div>
                    
                    <div className="form-group">
                        <label>วันที่เข้าฉาย</label>
                        <input type="date" name="release_date" value={newMovie.release_date} onChange={handleInputChange} />
                    </div>
                    
                    {/* Image Upload Section */}
                    <div className="form-group full-width">
                        <label>อัพโหลดโปสเตอร์</label>
                        <div className="upload-section">
                            <div className="upload-area">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleImageUpload}
                                    id="poster-upload"
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="poster-upload" className="upload-btn">
                                    {uploading ? '⏳ กำลังอัพโหลด...' : '📁 เลือกไฟล์รูปภาพ'}
                                </label>
                                <span className="upload-hint">รองรับ: JPG, PNG, WEBP (ไม่เกิน 5MB)</span>
                            </div>
                            
                            {/* Preview */}
                            {(previewImage || newMovie.poster_url) && (
                                <div className="preview-area">
                                    <img 
                                        src={previewImage || newMovie.poster_url} 
                                        alt="Preview" 
                                        className="poster-preview"
                                    />
                                    {newMovie.poster_url && (
                                        <div className="poster-url-display">
                                            ✅ {newMovie.poster_url}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label>หรือใส่ URL โปสเตอร์</label>
                        <input type="text" name="poster_url" placeholder="https://example.com/poster.jpg" value={newMovie.poster_url} onChange={handleInputChange} />
                    </div>
                    
                    <div className="form-group full-width">
                        <label>คำอธิบาย / เรื่องย่อ</label>
                        <textarea 
                            name="description" 
                            placeholder="เรื่องย่อของภาพยนตร์..." 
                            value={newMovie.description} 
                            onChange={handleInputChange}
                            rows="3"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="primary" disabled={uploading}>
                        {editingMovieId ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มภาพยนตร์'}
                    </button>
                    {editingMovieId && <button type="button" className="secondary" onClick={handleCancelEdit}>❌ ยกเลิก</button>}
                </div>
            </form>

            <h2>รายการภาพยนตร์ทั้งหมด ({movies.length})</h2>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>โปสเตอร์</th>
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
                            <td>
                                {m.poster_url ? (
                                    <img 
                                        src={m.poster_url} 
                                        alt={m.title} 
                                        style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                ) : (
                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>ไม่มีรูป</span>
                                )}
                            </td>
                            <td>
                                <div style={{ fontWeight: '600' }}>{m.title}</div>
                                {m.language && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>🌐 {m.language}</div>}
                                {m.release_date && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>📅 {m.release_date}</div>}
                            </td>
                            <td>{m.duration} นาที</td>
                            <td>{Array.isArray(m.genres) ? m.genres.join(', ') : m.genres}</td>
                            <td className={m.is_active ? 'status-active' : 'status-inactive'}>
                                {m.is_active ? '✅ เปิดใช้งาน' : '❌ ปิดใช้งาน'}
                            </td>
                            <td>
                                <div className="action-buttons">
                                    <button className="info" onClick={() => handleEditClick(m)}>✏️ แก้ไข</button>
                                    <button className={m.is_active ? 'danger' : 'success'} onClick={() => handleDeleteMovie(m.movie_id, m.is_active)}>
                                        {m.is_active ? '🚫 ปิด' : '✅ เปิด'}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminMovies;
