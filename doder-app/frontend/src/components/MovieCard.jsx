import { Link } from "react-router-dom";
import '../styles/MovieCard.css';

// Helper function to format the date
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  // Assuming dateStr is a full timestamp (YYYY-MM-DDTHH:MM:SSZ)
  const datePart = dateStr.split('T')[0]; // Gets YYYY-MM-DD

  // Optional: Reformat to DD/MM/YYYY for better display
  const parts = datePart.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return datePart;
};

export default function MovieCard({ movie }) {
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    return `${minutes} min`;
  };

  return (
    <Link to={`/movies/${movie.movie_id}`} className="movie-card">
      <img src={movie.poster_url} alt={movie.title} />
      <span className="release-date">{formatDisplayDate(movie.release_date)}</span>
      <div className="meta">
        <h3>{movie.title}</h3>
        <p>{formatDuration(movie.duration)}</p>
      </div>
    </Link>

  );
}