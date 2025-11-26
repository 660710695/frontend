// Register.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css'; // Import CSS for styling

const API_BASE_URL = "http://localhost:8081/api";

function Register() {
    // State for form inputs (matching models.RegisterRequest in Go backend)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // State for UI feedback
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            // 1. Send Registration Request to Go Backend (POST /api/auth/register)
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    first_name: firstName, 
                    last_name: lastName, 
                    phone, 
                    password 
                }),
            });

            const data = await response.json();

            // Check for registration failure (e.g., Phone number already registered)
            if (!response.ok || !data.success) {
                const errorMessage = data.error || 'Registration failed. Please check your information.';
                throw new Error(errorMessage);
            }

            // --- SUCCESS ---
            const { token } = data.data;

            // 2. Store JWT Token in Local Storage (User is immediately logged in)
            localStorage.setItem('authToken', token);
            
            // 3. Redirect the user to the home page or profile page
            navigate('/profile'); 

        } catch (err) {
            setError(err.message);
            console.error("Registration error:", err);
        } finally {
            setLoading(false);
        }
    };

return (
    <div className="auth-container">
        <h1>สมัครสมาชิก</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
            {error && <p className="error-message">{error}</p>}

            <label htmlFor="firstName">ชื่อ:</label>
            <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
            />

            <label htmlFor="lastName">นามสกุล:</label>
            <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
            />

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

            <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน:</label>
            <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
            />

            <button type="submit" disabled={loading}>
                {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
            </button>
        </form>

        <p>
            มีบัญชีอยู่แล้ว? <a href="/login">เข้าสู่ระบบ</a>
        </p>
    </div>
);

}

export default Register;