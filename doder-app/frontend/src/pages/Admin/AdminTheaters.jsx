// AdminTheaters.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../styles/AdminCommon.css';

const API_BASE_URL = "/api";

const initialTheaterState = {
    theater_name: '',
    total_seats: '',
    cinema_id: '',
    theater_type: 'Standard',
};

function AdminTheaters() {
    const { user, isLoading: isAuthLoading, logout } = useAuth();
    const isAdmin = user?.role === 'admin';
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const cinemaIdFromParams = params.get('cinema_id');

    const [theaters, setTheaters] = useState([]);
    const [allCinemas, setAllCinemas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [newTheater, setNewTheater] = useState(initialTheaterState);
    const [editingTheaterId, setEditingTheaterId] = useState(null);
    const navigate = useNavigate();
    const getToken = () => localStorage.getItem('authToken');

    // --- Fetch theaters and cinemas ---
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
            const cinemasRes = await fetch(`${API_BASE_URL}/cinemas`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const cinemasData = await cinemasRes.json();
            setAllCinemas(cinemasData.data || []);

            const theatersRes = await fetch(
                `${API_BASE_URL}/theaters${cinemaIdFromParams ? `?cinema_id=${cinemaIdFromParams}` : ''}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const theatersData = await theatersRes.json();
            setTheaters(theatersData.data || []);
        } catch (err) {
            setStatus({ type: 'error', message: `Fetch failed: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthLoading) {
            if (isAdmin) fetchData();
            else setLoading(false);
        }
    }, [isAuthLoading, isAdmin, cinemaIdFromParams]);

    // --- Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTheater(prev => ({ ...prev, [name]: value }));
    };

    const handleEditClick = (theater) => {
        setNewTheater({
            theater_name: theater.theater_name,
            total_seats: theater.total_seats,
            cinema_id: String(theater.cinema_id),
        });
        setEditingTheaterId(theater.theater_id);
        setStatus(null);
    };

    const handleCancelEdit = () => {
        setNewTheater(initialTheaterState);
        setEditingTheaterId(null);
        setStatus(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        editingTheaterId ? handleUpdateTheater(editingTheaterId) : handleCreateTheater();
    };

    const handleCreateTheater = async () => {
        setStatus(null);
        const token = getToken();
        if (!token) return;

        if (!newTheater.theater_name || !newTheater.total_seats || !newTheater.cinema_id) {
            setStatus({ type: 'error', message: "กรุณากรอกข้อมูลให้ครบทุกช่อง" });
            return;
        }

        try {
            const payload = {
                ...newTheater,
                total_seats: parseInt(newTheater.total_seats, 10),
                cinema_id: parseInt(newTheater.cinema_id, 10),
            };

            const res = await fetch(`${API_BASE_URL}/admin/theaters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to create theater.");

            setStatus({ type: 'success', message: `สร้างห้องฉายเรียบร้อย! ID: ${data.data.theater_id}` });
            fetchData();
            setNewTheater(initialTheaterState);

        } catch (err) {
            setStatus({ type: 'error', message: `เกิดข้อผิดพลาด: ${err.message}` });
        }
    };

    const handleUpdateTheater = async (theaterId) => {
        setStatus(null);
        const token = getToken();
        if (!token) return;

        try {
            const payload = {
                ...newTheater,
                total_seats: parseInt(newTheater.total_seats, 10),
                cinema_id: parseInt(newTheater.cinema_id, 10),
            };

            const res = await fetch(`${API_BASE_URL}/admin/theaters/${theaterId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Update failed.");

            setStatus({ type: 'success', message: `อัปเดตห้องฉาย ID ${theaterId} เรียบร้อย` });
            fetchData();
            handleCancelEdit();

        } catch (err) {
            setStatus({ type: 'error', message: `เกิดข้อผิดพลาด: ${err.message}` });
        }
    };

    const handleDeleteTheater = async (theaterId, isActive) => {
        const action = isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน';
        if (!window.confirm(`คุณแน่ใจหรือไม่ว่าจะ${action}ห้องฉายนี้?`)) return;

        const token = getToken();
        if (!token) return;

        try {
            const method = isActive ? 'DELETE' : 'PUT';
            const body = isActive ? null : JSON.stringify({ is_active: true });
            const headers = { 'Authorization': `Bearer ${token}` };
            if (method === 'PUT') headers['Content-Type'] = 'application/json';

            const res = await fetch(`${API_BASE_URL}/admin/theaters/${theaterId}`, { method, headers, body });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || `Failed to ${action} theater.`);

            setStatus({ type: 'success', message: `ห้องฉาย ID ${theaterId} ${action}เรียบร้อย` });
            fetchData();

        } catch (err) {
            setStatus({ type: 'error', message: `เกิดข้อผิดพลาด: ${err.message}` });
        }
    };

    // --- Render ---
    if (isAuthLoading) return <div className="admin-loading">กำลังโหลด...</div>;
    if (!isAdmin) return (
        <div className="admin-page">
            <h1>จัดการห้องฉาย</h1>
            <div className="status-error">Access Denied: Admin access required.</div>
            {user && <button className="secondary" onClick={logout}>ออกจากระบบ</button>}
        </div>
    );
    if (loading) return <div className="admin-loading">Loading theater data...</div>;

    return (
        <div className='admin-container'>
        <div className="admin-page">
            <h1>จัดการห้องฉาย</h1>

            {status && <div className={status.type === 'error' ? 'status-error' : 'status-success'}>{status.message}</div>}

            <h2>{editingTheaterId ? `✏️ แก้ไขห้องฉาย ID: ${editingTheaterId}` : '+ เพิ่มห้องฉายใหม่'}</h2>

            <form className="admin-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="theater_name"
                    placeholder="ชื่อห้องฉาย"
                    value={newTheater.theater_name}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="number"
                    name="total_seats"
                    placeholder="จำนวนที่นั่ง"
                    value={newTheater.total_seats}
                    onChange={handleInputChange}
                    required
                />
                <select name="cinema_id" value={newTheater.cinema_id} onChange={handleInputChange} required>
                    <option value="">เลือกโรงภาพยนตร์</option>
                    {allCinemas.map(c => (
                        <option key={c.cinema_id} value={String(c.cinema_id)}>{c.cinema_name}</option>
                    ))}
                </select>

                {/* 💥 CRITICAL FIX: ADD THEATER TYPE SELECT 💥 */}
                <select
                    name="theater_type"
                    value={newTheater.theater_type}
                    onChange={handleInputChange}
                    required
                >
                    <option value="Standard">Standard</option>
                    <option value="IMAX">IMAX</option>
                    <option value="VIP">VIP</option>
                    <option value="4DX">4DX</option>
                </select>

                <div className="form-actions">
                    <button type="submit" className="primary">{editingTheaterId ? 'บันทึกการแก้ไข' : 'บันทึกห้องฉาย'}</button>
                    {editingTheaterId && <button type="button" className="secondary" onClick={handleCancelEdit}>ยกเลิก</button>}
                </div>
            </form>

            <h2>รายการห้องฉายทั้งหมด ({theaters.length})</h2>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ชื่อห้องฉาย</th>
                        <th>จำนวนที่นั่ง</th>
                        <th>โรงภาพยนตร์</th>
                        <th>สถานะ</th>
                        <th>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {theaters.map(t => (
                        <tr key={t.theater_id}>
                            <td>{t.theater_id}</td>
                            <td>{t.theater_name}</td>
                            <td>{t.total_seats}</td>
                            <td>{t.cinema_name || t.cinema_id}</td>
                            <td className={t.is_active ? 'status-success' : 'status-error'}>
                                {t.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            </td>
                            <td>
                            
                                    <button className="info" onClick={() => handleEditClick(t)}>แก้ไข</button>
                                    <button className={t.is_active ? 'danger' : 'primary'} onClick={() => handleDeleteTheater(t.theater_id, t.is_active)}>
                                        {t.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                    </button>
                                    <button className="secondary" onClick={() => navigate(`/admin/seats?theater_id=${t.theater_id}`)}>
                                        จัดการที่นั่ง
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

export default AdminTheaters;
