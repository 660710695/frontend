import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/MovieDetail.css";

const API_BASE_URL = "/api";

// --- Helper Functions ---

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const datePart = dateStr.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return datePart;
};

const formatGenres = (genresArray) => {
    if (!Array.isArray(genresArray) || genresArray.length === 0) return '—';
    return genresArray.join(' / ');
};

export default function MovieDetail() {
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
                {movie.is_active === false && <div className="status-badge inactive">Inactive</div>}
            </div>

            <div className="detail-info">
                <h1 className="movie-title">{movie.title}</h1>

                <p className="movie-release">
                    <strong>เข้าฉาย:</strong> {formatDisplayDate(movie.release_date)}
                </p>

                <p className="movie-genres">
                    <strong>หมวดหมู่:</strong> {formatGenres(movie.genres)}
                </p>

                <p className="movie-language">
                    <strong>ภาษา:</strong> {movie.language}
                    {movie.subtitle && movie.subtitle.toLowerCase() !== 'none' && (
                        <span> ({movie.subtitle} Subtitle)</span>
                    )}
                </p>

                <p className="movie-duration">
                    <strong>ความยาว:</strong> {movie.duration} นาที
                </p>

                <h2 className="description-heading">เรื่องย่อ</h2>
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
