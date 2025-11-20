import React from "react";
import MovieCard from './MovieCard';
import './FeaturedMovies.css';
import { movies } from '../data/movies'; // นำเข้าข้อมูลจาก movies.js

export default function FeaturedMovies() {
  // ใช้ข้อมูลทั้งหมด
  const featuredMovies = movies;

  // หรือถ้าต้องการจำกัดเป็น 2 เรื่อง:
  // const featuredMovies = movies.slice(0, 2);

  return (
    <div className="featured-grid">
      {featuredMovies.map(movie => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
