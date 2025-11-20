import { Link } from "react-router-dom";
import '../styles/MovieCard.css'; // เพิ่ม css เฉยๆ ถ้าจะแก้หรือไม่ใช้ก็แก้หรือลบทิ้งได้เลยนะ

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movies/${movie.id}`} className="movie-card">
      <img src={movie.poster} alt={movie.title} />
      <div className="meta">
        <h3>{movie.title}</h3>
        <p>{movie.year}</p>
      </div>
    </Link>
  );
}
