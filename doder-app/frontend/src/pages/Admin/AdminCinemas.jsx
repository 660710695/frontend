// AdminCinemas.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/AdminCinema.css'; // ✅ Import CSS

const API_BASE_URL = "/api";

const initialCinemaState = {
    cinema_name: '',
    address: '',
    city: '',
};

function AdminCinemas() {
    const { user, isLoading: isAuthLoading, logout } = useAuth();
    const isAdmin = user && user.role === 'admin';
    const navigate = useNavigate();

    const [cinemas, setCinemas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [newCinema, setNewCinema] = useState(initialCinemaState);
    const [editingCinemaId, setEditingCinemaId] = useState(null);

    const getToken = () => localStorage.getItem('authToken');

    const fetchCinemas = async () => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setStatus(null);
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/cinemas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || "Failed to fetch cinema list.");

            setCinemas(data.data || []);
        } catch (err) {
            setStatus({ type: 'error', message: `Fetch failed: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthLoading) {
            if (isAdmin) fetchCinemas();
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
        setNewCinema(prev => ({ ...prev, [name]: value }));
    };

    const handleEditClick = (cinema) => {
        setNewCinema({
            cinema_name: cinema.cinema_name,
            address: cinema.address,
            city: cinema.city,
        });
        setEditingCinemaId(cinema.cinema_id);
        setStatus(null);
    };

    const handleCancelEdit = () => {
        setNewCinema(initialCinemaState);
        setEditingCinemaId(null);
        setStatus(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        editingCinemaId ? handleUpdateCinema(editingCinemaId) : handleCreateCinema();
    };

    const handleCreateCinema = async () => {
        setStatus(null);
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/cinemas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newCinema),
            });

            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || "Failed to create cinema.");

            setStatus({ type: 'success', message: "Cinema created successfully!" });
            fetchCinemas();
            setNewCinema(initialCinemaState);

        } catch (err) {
            setStatus({ type: 'error', message: `Creation failed: ${err.message}` });
        }
    };

    const handleUpdateCinema = async (cinemaId) => {
        setStatus(null);
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/cinemas/${cinemaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newCinema),
            });

            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || "Failed to update cinema.");

            setStatus({ type: 'success', message: `Cinema ID ${cinemaId} updated successfully!` });
            fetchCinemas();
            handleCancelEdit();

        } catch (err) {
            setStatus({ type: 'error', message: `Update failed: ${err.message}` });
        }
    };

    const handleDeleteCinema = async (cinemaId, isActive) => {
        const action = isActive ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} this cinema?`)) return;

        const token = getToken();
        if (!token) return;

        try {
            const method = isActive ? 'DELETE' : 'PUT';
            const body = isActive ? null : JSON.stringify({ is_active: true });
            const headers = { 'Authorization': `Bearer ${token}` };
            if (method === 'PUT') headers['Content-Type'] = 'application/json';

            const response = await fetch(`${API_BASE_URL}/admin/cinemas/${cinemaId}`, { method, headers, body });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || `Failed to ${action} cinema.`);

            setStatus({ type: 'success', message: `Cinema ID ${cinemaId} ${action}d.` });
            fetchCinemas();

        } catch (err) {
            setStatus({ type: 'error', message: `Operation failed: ${err.message}` });
        }
    };

    const handleManageTheaters = (cinemaId) => {
        navigate(`/admin/theaters?cinema_id=${cinemaId}`);
    };

    if (isAuthLoading) return <div className="admin-page">กำลังโหลดการตรวจสอบสิทธิ์...</div>;

    if (!isAdmin) {
        return (
            <div className="admin-page">
                <h1>จัดการโรงภาพยนตร์</h1>
                <div className="status-error">Access Denied: You must be logged in as an administrator to manage cinemas.</div>
                {user && <button className="secondary" onClick={logout}>ออกจากระบบ</button>}
            </div>
        );
    }

    if (loading) return <div className="admin-page">Loading cinema management data...</div>;

    return (
        <div className="admin-container">
        <div className="admin-page">
            <h1>จัดการโรงภาพยนตร์</h1>

            {status && (
                <div className={status.type === 'error' ? 'status-error' : 'status-success'}>
                    {status.message}
                </div>
            )}

            <h2>{editingCinemaId ? `✏️ แก้ไขโรงภาพยนตร์ ID: ${editingCinemaId}` : '+ เพิ่มโรงภาพยนตร์ใหม่'}</h2>

            <form className="admin-form" onSubmit={handleSubmit}>
                <input type="text" name="cinema_name" placeholder="ชื่อโรงภาพยนตร์" value={newCinema.cinema_name} onChange={handleInputChange} required />
                <input type="text" name="city" placeholder="จังหวัด" value={newCinema.city} onChange={handleInputChange} required />
                <input type="text" name="address" placeholder="ที่อยู่" value={newCinema.address} onChange={handleInputChange} required />

                <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit" className="primary">
                        {editingCinemaId ? 'บันทึกการแก้ไข (Update)' : 'บันทึกโรงภาพยนตร์ (Create)'}
                    </button>
                    {editingCinemaId && <button type="button" className="secondary" onClick={handleCancelEdit}>ยกเลิก</button>}
                </div>
            </form>

            <h2>รายการโรงภาพยนตร์ทั้งหมด ({cinemas.length})</h2>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ชื่อโรง</th>
                        <th>จังหวัด</th>
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
                            <td>{c.address}</td>
                            <td className={c.is_active ? 'status-success' : 'status-error'}>
                                {c.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            </td>
                            <td style={{ gap: '5px', justifyContent: 'center' }}>
                                <button className="info" onClick={() => handleManageTheaters(c.cinema_id)}>จัดการห้องฉาย</button>
                                <button className="primary" onClick={() => handleEditClick(c)}>แก้ไข</button>
                                <button className={c.is_active ? 'danger' : 'primary'} onClick={() => handleDeleteCinema(c.cinema_id, c.is_active)}>
                                    {c.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
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

export default AdminCinemas;
