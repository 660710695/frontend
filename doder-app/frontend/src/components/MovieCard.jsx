// ใน MovieCard.jsx

import { Link } from "react-router-dom";
import '../styles/MovieCard.css'; 

export default function MovieCard({ movie }) {
  return (
    // *** แก้ไข 1: ใช้ movie.movie_id สำหรับ Link ***
    <Link to={`/movies/${movie.movie_id}`} className="movie-card">
      {/* *** แก้ไข 2: ใช้ movie.poster_url สำหรับรูปภาพ *** */}
      <img src={movie.poster_url} alt={movie.title} />
      <div className="meta">
        <h3>{movie.title}</h3>
        {/* *** แก้ไข 3: ใช้ movie.release_date สำหรับปี และตัดเหลือ 4 ตัวแรก *** */}
        <p>{movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'}</p>
      </div>
    </Link>
  );
}