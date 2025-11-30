// AdminShowtimes.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/AdminCommon.css';

const API_BASE_URL = "/api";

const initialShowtimeState = {
    movie_id: '',
    theater_id: '',
    show_date: '',
    show_time: '',
    end_time: '',
    price: 0,
};

function AdminShowtimes() {
    const { user, isLoading: isAuthLoading, logout } = useAuth();
    const isAdmin = user && user.role === 'admin';

    const [allMovies, setAllMovies] = useState([]);
    const [allTheaters, setAllTheaters] = useState([]);
    const [showtimes, setShowtimes] = useState([]);

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [newShowtime, setNewShowtime] = useState(initialShowtimeState);
    const [editingShowtimeId, setEditingShowtimeId] = useState(null);

    const getToken = () => localStorage.getItem('authToken');

    // --- Helper Functions ---
    const formatDisplayTime = (timeStr) => timeStr ? timeStr.split('T')[1]?.substring(0, 5) || timeStr.substring(0,5) : 'N/A';
    const formatDisplayDate = (dateStr) => dateStr ? dateStr.split('T')[0] : 'N/A';

    // --- Fetch all data ---
    const fetchData = async () => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setStatus(null);
        const token = getToken();
        if (!token) return;

        try {
            const moviesRes = await fetch(`${API_BASE_URL}/movies?is_active=true`);
            const moviesData = await moviesRes.json();
            setAllMovies(moviesData.data || []);

            const theatersRes = await fetch(`${API_BASE_URL}/theaters`);
            const theatersData = await theatersRes.json();
            setAllTheaters(theatersData.data || []);

            const showtimesRes = await fetch(`${API_BASE_URL}/showtimes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const showtimesData = await showtimesRes.json();
            setShowtimes(showtimesData.data || []);

        } catch (err) {
            setStatus({ type: 'error', message: `Fetch failed: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthLoading) {
            if (isAdmin) fetchData();
            else if (user) {
                setStatus({ type: 'error', message: "Access Denied: Admin privileges required." });
                setLoading(false);
            } else {
                setStatus({ type: 'error', message: "Unauthorized: Please log in." });
                setLoading(false);
            }
        }
    }, [isAuthLoading, isAdmin]);

    // --- Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewShowtime(prev => ({
            ...prev,
            [name]: name === 'price' ? parseFloat(value) : value
        }));
    };

    const handleEditClick = (showtime) => {
        setNewShowtime({
            movie_id: String(showtime.movie_id),
            theater_id: String(showtime.theater_id),
            show_date: formatDisplayDate(showtime.show_date) === 'N/A' ? '' : formatDisplayDate(showtime.show_date),
            show_time: formatDisplayTime(showtime.show_time) === 'N/A' ? '' : formatDisplayTime(showtime.show_time),
            end_time: formatDisplayTime(showtime.end_time) === 'N/A' ? '' : formatDisplayTime(showtime.end_time),
            price: showtime.price,
        });
        setEditingShowtimeId(showtime.showtime_id);
        setStatus(null);
    };

    const handleCancelEdit = () => {
        setNewShowtime(initialShowtimeState);
        setEditingShowtimeId(null);
        setStatus(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        editingShowtimeId ? handleUpdateShowtime(editingShowtimeId) : handleCreateShowtime();
    };

    const handleCreateShowtime = async () => {
        setStatus(null);
        const token = getToken();
        if (!token) return;

        if (!newShowtime.movie_id || !newShowtime.theater_id || !newShowtime.show_date || !newShowtime.show_time || !newShowtime.end_time) {
            setStatus({ type: 'error', message: "Please fill all required fields." });
            return;
        }

        try {
            const payload = {
                ...newShowtime,
                movie_id: parseInt(newShowtime.movie_id, 10),
                theater_id: parseInt(newShowtime.theater_id, 10),
                price: parseFloat(newShowtime.price)
            };

            const response = await fetch(`${API_BASE_URL}/admin/showtimes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || "Failed to create showtime.");

            setStatus({ type: 'success', message: `Showtime created successfully! ID: ${data.data.showtime_id}` });
            fetchData();
            setNewShowtime(initialShowtimeState);

        } catch (err) {
            setStatus({ type: 'error', message: `Creation failed: ${err.message}` });
        }
    };

    const handleUpdateShowtime = async (showtimeId) => {
        setStatus(null);
        const token = getToken();
        if (!token) return;

        try {
            const payload = {
                ...newShowtime,
                movie_id: parseInt(newShowtime.movie_id, 10),
                theater_id: parseInt(newShowtime.theater_id, 10),
                price: parseFloat(newShowtime.price)
            };

            const response = await fetch(`${API_BASE_URL}/admin/showtimes/${showtimeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || "Update failed.");

            setStatus({ type: 'success', message: "Showtime updated successfully!" });
            handleCancelEdit();
            fetchData();

        } catch (err) {
            setStatus({ type: 'error', message: `Update failed: ${err.message}` });
        }
    };

    const handleDeleteShowtime = async (showtimeId, isActive) => {
        const action = isActive ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} this showtime?`)) return;

        const token = getToken();
        if (!token) return;

        try {
            const method = isActive ? 'DELETE' : 'PUT';
            const body = isActive ? null : JSON.stringify({ is_active: true });
            const headers = { 'Authorization': `Bearer ${token}` };
            if (method === 'PUT') headers['Content-Type'] = 'application/json';

            const response = await fetch(`${API_BASE_URL}/admin/showtimes/${showtimeId}`, { method, headers, body });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || `Failed to ${action} showtime.`);

            setStatus({ type: 'success', message: `Showtime ID ${showtimeId} ${action}d.` });
            fetchData();

        } catch (err) {
            setStatus({ type: 'error', message: `Operation failed: ${err.message}` });
        }
    };

    if (isAuthLoading) return <div className="admin-page">กำลังโหลดการตรวจสอบสิทธิ์...</div>;
    if (!isAdmin) {
        return (
            <div className="admin-page">
                <h1>จัดการรอบฉาย</h1>
                <div className="status-error">Access Denied: Admin access required.</div>
                {user && <button className="secondary" onClick={logout}>ออกจากระบบ</button>}
            </div>
        );
    }
    if (loading) return <div className="admin-page">Loading showtime data...</div>;

    return (
        <div className='admin-container'>
        <div className="admin-page">
            <h1>จัดการรอบฉาย</h1>

            {status && (
                <div className={status.type === 'error' ? 'status-error' : 'status-success'}>
                    {status.message}
                </div>
            )}

            <h2>{editingShowtimeId ? `✏️ แก้ไขรอบฉาย ID: ${editingShowtimeId}` : '+ เพิ่มรอบฉายใหม่'}</h2>

            <form className="admin-form" onSubmit={handleSubmit}>
                <select name="movie_id" value={newShowtime.movie_id} onChange={handleInputChange} required>
                    <option value="">เลือกภาพยนตร์</option>
                    {allMovies.map(m => (
                        <option key={m.movie_id} value={String(m.movie_id)}>{m.title} ({m.duration} mins)</option>
                    ))}
                </select>

                <select name="theater_id" value={newShowtime.theater_id} onChange={handleInputChange} required>
                    <option value="">เลือกโรง/ห้องฉาย</option>
                    {allTheaters.map(t => (
                        <option key={t.theater_id} value={String(t.theater_id)}>{t.theater_name}</option>
                    ))}
                </select>

                <input type="date" name="show_date" value={newShowtime.show_date} onChange={handleInputChange} required />
                <input type="time" name="show_time" value={newShowtime.show_time} onChange={handleInputChange} required />
                <input type="time" name="end_time" value={newShowtime.end_time} onChange={handleInputChange} required />
                <input type="number" name="price" value={newShowtime.price} onChange={handleInputChange} required placeholder="ราคา" />

                <div className="form-actions">
                    <button type="submit" className="primary">
                        {editingShowtimeId ? 'บันทึกการแก้ไข' : 'บันทึกรอบฉาย'}
                    </button>
                    {editingShowtimeId && <button type="button" className="secondary" onClick={handleCancelEdit}>ยกเลิก</button>}
                </div>
            </form>

            <h2>รายการรอบฉายทั้งหมด ({showtimes.length})</h2>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ภาพยนตร์</th>
                        <th>โรง</th>
                        <th>วันที่/เวลาเริ่ม-จบ</th>
                        <th>ราคา</th>
                        <th>สถานะ</th>
                        <th>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {showtimes.map(st => (
                        <tr key={st.showtime_id}>
                            <td>{st.showtime_id}</td>
                            <td>{st.movie_title || st.movie_id}</td>
                            <td>{st.theater_name || st.theater_id}</td>
                            <td>{formatDisplayDate(st.show_date)} {formatDisplayTime(st.show_time)} - {formatDisplayTime(st.end_time)}</td>
                            <td>{st.price}</td>
                            <td className={st.is_active ? 'status-success' : 'status-error'}>
                                {st.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            </td>
                            <td style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <button className="primary" onClick={() => handleEditClick(st)}>แก้ไข</button>
                                <button className={st.is_active ? 'danger' : 'primary'} onClick={() => handleDeleteShowtime(st.showtime_id, st.is_active)}>
                                    {st.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        </div>
    );
}

export default AdminShowtimes;
