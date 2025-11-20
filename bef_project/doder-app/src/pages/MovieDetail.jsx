import { useParams, useNavigate } from "react-router-dom";
import { movies } from "../data/movies"; // your mock data

function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const movie = movies.find(m => m.id === Number(id));
  if (!movie) return <h2>Movie not found</h2>;

  return (
    <div className="detail-container">
      <img src={movie.poster} className="detail-poster" />
      <div className="detail-info">
        <h1>{movie.title} ({movie.year})</h1>
        <p><strong>Genre:</strong> {movie.genre}</p>
        <p><strong>Duration:</strong> {movie.duration}</p>
        <p>{movie.description}</p>

        {/* NEW: Button to go to Cinema page */}
        <button
          className="book-btn"
          onClick={() => navigate(`/cinema?movie=${movie.id}`)}
        >
          เลือกโรงและรอบฉาย
        </button>
      </div>
    </div>
  );
}

export default MovieDetail;
