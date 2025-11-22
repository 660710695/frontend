// ใน MovieDetail.jsx

import { useState, useEffect } from "react"; // เพิ่มการ Import useState และ useEffect
import { useParams, useNavigate } from "react-router-dom";
// import { movies } from "../data/movies"; // ลบการ Import mock data

const API_BASE_URL = "http://localhost:8081/api";

function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State สำหรับเก็บข้อมูลภาพยนตร์
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMovieDetail() {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch ข้อมูลหนังตาม ID ที่ได้จาก URL parameter
        const response = await fetch(`${API_BASE_URL}/movies/${id}`); // ใช้ GET /api/movies/:id
        
        if (!response.ok) {
          throw new Error(`Movie not found or API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 2. เก็บข้อมูลที่ได้จาก data.data
        setMovie(data.data || null); 

      } catch (err) {
        console.error("Failed to fetch movie detail:", err);
        setError(err.message);
        setMovie(null); // ตั้งค่าหนังเป็น null ถ้าเกิดข้อผิดพลาด
      } finally {
        setLoading(false);
      }
    }

    fetchMovieDetail();
  }, [id]); // id เป็น dependency เพื่อให้ fetch ใหม่หาก ID เปลี่ยน

  // การจัดการสถานะ Loading และ Error
  if (loading) return <div className="detail-container">Loading movie details...</div>;
  if (error) return <div className="detail-container">Error: {error}</div>;
  if (!movie) return <div className="detail-container"><h2>Movie not found</h2></div>;

  // Render ข้อมูลที่ Fetch มา
  return (
    <div className="detail-container">
      {/* ใช้อ้างอิงตามชื่อฟิลด์ใน Struct Go models.Movie: title, description, duration, poster_url, release_date */}
      <img src={movie.poster_url} className="detail-poster" alt={movie.title} />
      <div className="detail-info">
        <h1>{movie.title} ({movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'})</h1>
        <p><strong>Language:</strong> {movie.language} ({movie.subtitle ? `Subtitle: ${movie.subtitle}` : 'No Subtitle'})</p>
        <p><strong>Duration:</strong> {movie.duration} minutes</p>
        <p>{movie.description}</p>

        {/* Button to go to Cinema page */}
        <button
          className="book-btn"
          // ใช้ movie.movie_id ในการส่ง Query Parameter
          onClick={() => navigate(`/cinema?movie=${movie.movie_id}`)}
        >
          เลือกโรงและรอบฉาย
        </button>
      </div>
    </div>
  );
}

export default MovieDetail;