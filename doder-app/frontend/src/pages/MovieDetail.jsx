import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/MovieDetail.css";

const API_BASE_URL = "/api";

function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMovieDetail() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/movies/${id}`);
        if (!response.ok) throw new Error(`Movie not found or API error: ${response.status}`);
        const data = await response.json();
        setMovie(data.data || null);
      } catch (err) {
        console.error("Failed to fetch movie detail:", err);
        setError(err.message);
        setMovie(null);
      } finally {
        setLoading(false);
      }
    }
    fetchMovieDetail();
  }, [id]);

  if (loading) return <div className="detail-container">Loading movie details...</div>;
  if (error) return <div className="detail-container">Error: {error}</div>;
  if (!movie) return <div className="detail-container"><h2>Movie not found</h2></div>;

  return (
    <div className="detail-container">
      <div className="poster-container">
        <img src={movie.poster_url} className="detail-poster" alt={movie.title} />
      </div>

      <div className="detail-info">
        <h1 className="movie-title">
          {movie.title} ({movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'})
        </h1>
        <p className="movie-language">
          <strong>Language:</strong> {movie.language} ({movie.subtitle ? `Subtitle: ${movie.subtitle}` : 'No Subtitle'})
        </p>
        <p className="movie-duration">
          <strong>Duration:</strong> {movie.duration} minutes
        </p>
        <p className="movie-description">{movie.description}</p>

        <button
          className="book-btn"
          onClick={() => navigate(`/cinema?movie=${movie.movie_id}`)}
        >
          เลือกโรงและรอบฉาย
        </button>
      </div>
    </div>
  );
}

export default MovieDetail;
