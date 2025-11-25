import { useState, useEffect } from "react";
import MovieCard from "../components/MovieCard";
import "../styles/Movies.css";

const API_BASE_URL = "http://localhost:8081/api";

function Movies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMovies() {
      try {
        setLoading(true);
        
        // 4. Fetch ข้อมูลจาก Backend API
        const response = await fetch(`${API_BASE_URL}/movies`); // ใช้ GET /api/movies
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 5. สมมติว่าข้อมูลจริงอยู่ใน data.data (ตามโครงสร้าง API ทั่วไป)
        setMovies(data.data || []); 

      } catch (err) {
        console.error("Failed to fetch movies:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, []); // [] หมายถึง Fetch เพียงครั้งเดียวเมื่อ Component ถูกโหลด

  // 6. การจัดการ Loading, Error, และ No Data State
  if (loading) {
    return (
      <div className="movies-page">
        <h1>ภาพยนตร์</h1>
        <p>กำลังโหลดภาพยนตร์...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="movies-page">
        <h1>ภาพยนตร์</h1>
        <p>เกิดข้อผิดพลาดในการโหลดข้อมูล: {error}</p>
      </div>
    );
  }
  
  if (movies.length === 0) {
    return (
      <div className="movies-page">
        <h1>ภาพยนตร์</h1>
        <p>ไม่พบข้อมูลภาพยนตร์ในระบบ</p>
      </div>
    );
  }

  // 7. แสดงผลข้อมูลจริงที่ Fetch มา
  return (
    <div className="movies-page">
      <h1>ภาพยนตร์</h1>
      <div className="movies-grid">
        {movies.map(m => <MovieCard key={m.movie_id} movie={m} />)} 
        {/* ใช้ key={m.movie_id} ตาม schemas.sql */}
      </div>
    </div>
  );
}

export default Movies;