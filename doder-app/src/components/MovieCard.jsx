import { Link } from "react-router-dom";

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
