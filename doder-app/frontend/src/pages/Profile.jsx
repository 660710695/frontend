// Profile.jsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Check this path!
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css'; // Assume you'll create this CSS file

const API_BASE_URL = "/api";

function Profile() {
    // 1. Get user status and logout function from AuthContext
    const { user, isLoading, logout, checkAuthStatus } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [fetchError, setFetchError] = useState(null);

    // This useEffect is redundant if the AuthProvider successfully runs checkAuthStatus, 
    // but it serves as a safety check and shows the logic clearly.
    useEffect(() => {
        // If AuthContext hasn't finished loading or already has the user, skip direct fetch
        if (!isLoading && user) {
            setProfileData(user);
            return;
        }

        // If the component loads and user is null (shouldn't happen due to ProtectedRoute, 
        // but helps verify data integrity), we can try one last fetch attempt.
        const fetchProfile = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) return; // ProtectedRoute should handle this

            try {
                // Call the backend endpoint GET /api/auth/profile
                const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`, 
                    },
                });
                
                const data = await response.json();

                if (response.ok && data.success) {
                    setProfileData(data.data);
                } else {
                    throw new Error(data.error || "Failed to fetch profile details.");
                }
            } catch (error) {
                setFetchError(error.message);
                // Force logout if fetch failed due to bad token
                logout(); 
                navigate('/login'); 
            }
        };

        // We rely primarily on the data already loaded by AuthProvider
        if (!isLoading && user) {
             setProfileData(user);
        } else if (!isLoading) {
             // If user is null after loading, redirect is happening via ProtectedRoute, but 
             // we'll leave this block clean to trust the ProtectedRoute.
        }

    }, [isLoading, user, logout, navigate]);

    const handleLogout = () => {
        logout(); // Removes token from localStorage and sets user=null in context
        navigate('/'); // Redirect to the home page
    };

    if (isLoading) {
        return <div className="profile-page">Loading user profile...</div>;
    }

    if (fetchError) {
        return <div className="profile-page error">Error loading profile: {fetchError}</div>;
    }

    // Since this page is protected, profileData should exist.
    if (!profileData) {
        return <div className="profile-page">Please log in to view your profile.</div>;
    }

    return (
        <div className="profile-page">
            <h1 className="profile-header">ข้อมูลส่วนตัว</h1>
            
            <div className="profile-info-card">
                <p><strong>ชื่อ:</strong> {profileData.first_name} {profileData.last_name}</p>
                <p><strong>เบอร์โทรศัพท์:</strong> {profileData.phone}</p>
                <p><strong>สถานะ:</strong> <span className={`role-${profileData.role}`}>{profileData.role}</span></p>
                <p><strong>รหัสผู้ใช้ (ID):</strong> {profileData.user_id}</p>
            </div>

            <button onClick={handleLogout} className="logout-btn">
                ออกจากระบบ (Logout)
            </button>
            
            {profileData.role === 'admin' && (
                <div className="admin-link">
                    <button onClick={() => navigate('/admin')} className="admin-btn">
                        ไปยังหน้าจัดการ Admin
                    </button>
                </div>
            )}
        </div>
    );
}

export default Profile;