import { Link } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "../styles/Navbar.css";

function Navbar() {
  return (
    <nav className="nav">
      <div className="left">
        <div className="logo"><Link to="/">MyProject</Link></div>
        <ul className="menu">
          <li><Link to="/">หน้าหลัก</Link></li>
          <li><Link to="/movies">ภาพยนตร์</Link></li>
          <li><Link to="/cinema">โรงภาพยนตร์</Link></li>
        </ul>
      </div>

      <div className="right">
        <Link to="/profile" className="profile-link" aria-label="Profile">
          <FaUserCircle size={30} />
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
