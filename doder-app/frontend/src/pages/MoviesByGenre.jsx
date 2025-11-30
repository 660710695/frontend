import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/Movies.css";

const API_BASE_URL = "/api";

// แปลง slug เป็นชื่อ genre ที่แสดง
const genreDisplayNames = {
  action: "Action",
  drama: "Drama",
  comedy: "Comedy",
  animation: "Animation",
  horror: "Horror",
  romance: "Romance",
  thriller: "Thriller",
  adventure: "Adventure",
  family: "Family",
  crime: "Crime",
};

function MoviesByGenre() {
  const { genre } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // แปลง genre slug เป็นชื่อที่แสดง (capitalize first letter)
  const genreName = genreDisplayNames[genre?.toLowerCase()] || genre?.charAt(0).toUpperCase() + genre?.slice(1) || "Unknown";

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/movies`);
        if (!response.ok) {
          throw new Error("Failed to fetch movies");
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          // กรองหนังตาม genre (case-insensitive)
          const filteredMovies = data.data.filter(movie => {
            if (!movie.genres || !Array.isArray(movie.genres)) return false;
            return movie.genres.some(g => 
              g.toLowerCase() === genre?.toLowerCase()
            );
          });
          
          setMovies(filteredMovies);
        } else {
          setMovies([]);
        }
      } catch (err) {
        console.error("Error fetching movies:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (genre) {
      fetchMovies();
    }
  }, [genre]);

  if (loading) {
    return (
      <div className="movies-page">
        <h1>หนังประเภท {genreName}</h1>
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="movies-page">
        <h1>หนังประเภท {genreName}</h1>
        <p>เกิดข้อผิดพลาด: {error}</p>
      </div>
    );
  }

  return (
    <div className="movies-page">
      <div className="movies-header">
        <h1>หนังประเภท {genreName}</h1>
        <p>พบ {movies.length} เรื่อง</p>
      </div>

      {movies.length > 0 ? (
        <div className="movies-grid">
          {movies.map((movie) => (
            <Link 
              key={movie.movie_id} 
              to={`/movies/${movie.movie_id}`}
              className="movie-card"
            >
              <div className="movie-poster">
                {movie.poster_url ? (
                  <img 
                    src={movie.poster_url} 
                    alt={movie.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/200x300?text=No+Image";
                    }}
                  />
                ) : (
                  <div className="no-poster">
                    <span>🎬</span>
                  </div>
                )}
              </div>
              <div className="movie-info">
                <h3 className="movie-title">{movie.title}</h3>
                {movie.genres && movie.genres.length > 0 && (
                  <div className="movie-genres">
                    {movie.genres.slice(0, 3).map((g, index) => (
                      <span key={index} className="genre-tag">{g}</span>
                    ))}
                  </div>
                )}
                {movie.duration && (
                  <p className="movie-duration">{movie.duration} นาที</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="no-movies">
          <p>ไม่พบหนังในหมวดหมู่ {genreName}</p>
          <Link to="/movies" className="back-link">
            ดูหนังทั้งหมด
          </Link>
        </div>
      )}

      <div className="back-to-home">
        <Link to="/" className="back-link">← กลับหน้าหลัก</Link>
      </div>
    </div>
  );
}

export default MoviesByGenre;
