// FeaturedMovies.jsx

import React, { useState, useEffect } from "react";
import MovieCard from './MovieCard';
import '../styles/FeaturedMovies.css';
// import { movies } from '../contexts/AuthContext'; // 1. ลบการนำเข้า Mock Data

const API_BASE_URL = "http://localhost:8081/api";

export default function FeaturedMovies() {
    // 2. State สำหรับเก็บข้อมูลภาพยนตร์และสถานะการโหลด
    const [featuredMovies, setFeaturedMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchFeaturedMovies() {
            try {
                setLoading(true);
                
                // Fetch only active movies (is_active=true) for the featured list
                // GET /api/movies?is_active=true
                const response = await fetch(`${API_BASE_URL}/movies?is_active=true`); 
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Assuming data is in data.data (as per your handlers)
                // You can use slice(0, 4) here if you only want to feature the top 4
                setFeaturedMovies(data.data ? data.data.slice(0, 4) : []); 

            } catch (err) {
                console.error("Failed to fetch featured movies:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchFeaturedMovies();
    }, []); // Fetch once on mount

    // --- UI Logic ---
    if (loading) {
        return <div className="featured-grid">Loading featured movies...</div>;
    }

    if (error) {
        return <div className="featured-grid">Error loading movies: {error}</div>;
    }
    
    if (featuredMovies.length === 0) {
        return <div className="featured-grid">No active movies found.</div>;
    }

    return (
        <div className="featured-grid">
            {featuredMovies.map(movie => (
                // 3. ใช้ movie.movie_id เป็น key (ตาม Go backend schema)
                <MovieCard key={movie.movie_id} movie={movie} /> 
            ))}
        </div>
    );
}