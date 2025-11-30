import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/AdminDashboard.css';

function AdminDashboard() {

    return (
        <div className="admin-container">
            <h1 className="admin-title">แผงควบคุมผู้ดูแลระบบ</h1>
            <p className="admin-subtitle">ยินดีต้อนรับผู้ดูแลระบบ! เลือกเครื่องมือจัดการด้านล่าง:</p>

            <div className="admin-menu">
                
                <Link to="/admin/movies" className="admin-card">
                    <h2>จัดการภาพยนตร์ (CRUD)</h2>
                    <p>เพิ่ม, แก้ไข, หรือลบ (Soft Delete) ภาพยนตร์ที่เข้าฉาย</p>
                </Link>

                <Link to="/admin/cinemas" className="admin-card">
                    <h2>จัดการห้องฉายและโรงภาพยนตร์</h2>
                    <p>สร้างโรงภาพยนตร์ใหม่, ห้องฉาย, และผังที่นั่ง</p>
                </Link>

                <Link to="/admin/showtimes" className="admin-card">
                    <h2>จัดการรอบฉาย</h2>
                    <p>กำหนดวันที่, เวลา, และราคาสำหรับภาพยนตร์</p>
                </Link>
                
            </div>
        </div>
    );
}

export default AdminDashboard;
