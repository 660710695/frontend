// MovieCard.jsx (Corrected for image and ID)

import { Link } from "react-router-dom";
import '../styles/MovieCard.css'; 

export default function MovieCard({ movie }) {
  return (
    // FIX 1: Use movie.movie_id for routing
    <Link to={`/movies/${movie.movie_id}`} className="movie-card">
      {/* FIX 2: Use movie.poster_url for the image source */}
      <img src={movie.poster_url} alt={movie.title} />
      <div className="meta">
        <h3>{movie.title}</h3>
        {/* FIX 3: Use release_date and cut to the year */}
        <p>{movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'}</p>
      </div>
    </Link>
  );
}