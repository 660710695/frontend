// Navbar.jsx (Modified for Admin Link Placement and Styling)

import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle, FaCaretDown } from "react-icons/fa";
import { useAuth } from '../contexts/AuthContext';
import "../styles/Navbar.css";
import LogoIcon from "../images/DoderLogo.png";
import { useState } from "react";

function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
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
        {isLoading ? (
          <span style={{ color: 'white' }}>...</span>
        ) : user ? (
          // Logged In State
          <>
            {/* 👈 The Admin link is now placed here, outside the profile dropdown,
                 using the new 'nav-link' class for styling. */}
            {user.role === 'admin' && (
                // Using 'nav-link' class to mimic the look of 'menu a'
                <Link to="/admin" className="nav-link">Admin</Link> 
            )}
            
            <div className="profile-dropdown-container">
              <button 
                onClick={toggleDropdown} 
                className="profile-btn"
                aria-expanded={isDropdownOpen}
                aria-controls="profile-menu"
              >
                <FaUserCircle size={30} />
                <FaCaretDown size={14} className="dropdown-caret" />
              </button>
              
              {isDropdownOpen && (
                <div id="profile-menu" className="dropdown-menu">
                  <span className="dropdown-info">
                    {user.name || "My Account"}
                  </span>
                  
                  <Link to="/profile" className="dropdown-item">
                    ดูโปรไฟล์
                  </Link>
                  
                  <button onClick={handleLogout} className="dropdown-item logout-item">
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          // Logged Out State
          <Link to="/login" className="login-link">
            เข้าสู่ระบบ / ลงทะเบียน
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;