// Login.jsx (Corrected for immediate state update)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // 💥 Import useAuth 💥

const API_BASE_URL = "http://localhost:8081/api";

function Login() {
    // State for form inputs
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    
    // State for UI feedback
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    
    // 💥 1. Destructure checkAuthStatus from useAuth 💥
    // We use this function to manually trigger the global state update after success
    const { checkAuthStatus } = useAuth(); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Send Login Request to Go Backend (POST /api/auth/login)
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone, password }),
            });

            const data = await response.json();

            // Check for authentication failure (e.g., 401 Unauthorized)
            if (!response.ok || !data.success) {
                const errorMessage = data.error || 'Login failed. Invalid phone or password.';
                throw new Error(errorMessage);
            }

            // --- SUCCESS ---
            const { token } = data.data;

            // 2. Store JWT Token in Local Storage
            localStorage.setItem('authToken', token);
            
            // 💥 2. FIX: Manually trigger the global state update 💥
            // This ensures the Navbar and ProtectedRoute see the 'admin' role immediately.
            await checkAuthStatus(); 
            
            // 3. Redirect the user to the home page
            navigate('/'); 

        } catch (err) {
            setError(err.message);
            console.error("Login error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h1>เข้าสู่ระบบ</h1>
            <form onSubmit={handleSubmit}>
                {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
                
                <label htmlFor="phone">เบอร์โทรศัพท์:</label>
                <input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                />
                
                <label htmlFor="password">รหัสผ่าน:</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                
                <button type="submit" disabled={loading}>
                    {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
            </form>
            <p>
                ยังไม่มีบัญชี? <a href="/register">สมัครสมาชิกที่นี่</a>
            </p>
        </div>
    );
}

export default Login;