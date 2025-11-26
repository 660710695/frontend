// Navbar.jsx (Corrected for Authentication Status)

import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useAuth } from '../contexts/AuthContext';
import "../styles/Navbar.css";
import LogoIcon from "../images/DoderLogo.png";

function Navbar() {
  const { user, isLoading, logout } = useAuth(); // Destructure states and functions
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Calls logout function from AuthContext
    navigate('/');
  };

  return (
    <nav className="nav">
      <div className="left">
        <div className="logo">
          <img src={LogoIcon} alt="ticket" />
        </div>
        <ul className="menu">
          <li><Link to="/">หน้าหลัก</Link></li>
          <li><Link to="/movies">ภาพยนตร์</Link></li>
          <li><Link to="/cinema">โรงภาพยนตร์</Link></li>
        </ul>
      </div>

      <div className="right">
        {/* Conditional Rendering based on Auth Status */}
        {isLoading ? (
          // 1. Loading State
          <span style={{ color: 'white' }}>...</span>
        ) : user ? (
          // 2. Logged In State
          <>
            {/* Display Admin Link if user is an admin */}
            {user.role === 'admin' && (
                <Link to="/admin" className="admin-link">Admin</Link>
            )}
            
            {/* Profile Link */}
            <Link to="/profile" className="profile-link" aria-label="Profile">
                <FaUserCircle size={30} />
            </Link>
            
            {/* Logout Button */}
            <button onClick={handleLogout} className="logout-btn">
                ออกจากระบบ
            </button>
          </>
        ) : (
          // 3. Logged Out State
          <Link to="/login" className="login-link">
            เข้าสู่ระบบ / ลงทะเบียน
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;