import { useState, useEffect } from "react";
import MovieCard from "../components/MovieCard";
import SearchBar from '../components/SearchBar';
import "../styles/Movies.css";

const API_BASE_URL = "/api";

function Movies() {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 12;

  const genres = ['all', 'action', 'comedy', 'drama', 'horror', 'romance', 'sci-fi', 'thriller'];

  useEffect(() => {
    async function fetchMovies() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/movies?is_active=true`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const moviesData = data.data || [];
        setMovies(moviesData);
        setFilteredMovies(moviesData);

      } catch (err) {
        console.error("Failed to fetch movies:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, []);

  const handleSearch = (searchTerm) => {
    const filtered = movies.filter(movie =>
      movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movie.description && movie.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredMovies(filtered);
    setCurrentPage(1);
  };

  const handleGenreFilter = (genre) => {
    setSelectedGenre(genre);
    if (genre === 'all') {
      setFilteredMovies(movies);
    } else {
      const filtered = movies.filter(movie =>
        // 💥 FIX: Check if the movie.genres array includes the selected genre 💥
        movie.genres && Array.isArray(movie.genres) &&
        movie.genres.map(g => g.toLowerCase()).includes(genre.toLowerCase())
      );
      setFilteredMovies(filtered);
    }
    setCurrentPage(1);
  };

  const handleSort = (sortValue) => {
    setSortBy(sortValue);
    const sorted = [...filteredMovies];
    switch (sortValue) {
      case 'rating-high':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'rating-low':
        sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => (b.movie_id || 0) - (a.movie_id || 0));
    }
    setFilteredMovies(sorted);
  };

  // Pagination logic
  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = filteredMovies.slice(indexOfFirstMovie, indexOfLastMovie);
  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

  return (
    <div className="movies-page">
      <div className="movies-container">
        {/* Page Header */}
        <div className="movies-header">
          <h1>ภาพยนตร์</h1>
          <p>ค้นพบภาพยนตร์ที่คุณชื่นชอบจากคอลเล็กชันของเรา</p>
        </div>

        {/* Filters and Search */}
        <div className="movies-filters">
          <div className="filters-wrapper">
            {/* Search */}
            <div className="search-container">
              <SearchBar onSearch={handleSearch} placeholder="ค้นหาภาพยนตร์..." />
            </div>

            {/* Genre Filter */}
            <select
              className="filter-select"
              value={selectedGenre}
              onChange={(e) => handleGenreFilter(e.target.value)}
            >
              <option value="all">ทุกประเภท</option>
              <option value="action">แอคชั่น</option>
              <option value="comedy">喜剧</option>
              <option value="drama">ดราม่า</option>
              <option value="horror">สยองขวัญ</option>
              <option value="romance">โรแมนติก</option>
              <option value="sci-fi">วิทยาศาสตร์</option>
              <option value="thriller">ระทึก</option>
            </select>

            {/* Sort */}
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
            >
              <option value="newest">ใหม่ล่าสุด</option>
              <option value="rating-high">คะแนนสูง-ต่ำ</option>
              <option value="rating-low">คะแนนต่ำ-สูง</option>
            </select>
          </div>

          {/* Results count */}
          <div className="results-count">
            พบภาพยนตร์ {filteredMovies.length} เรื่อง
            {selectedGenre !== 'all' && ` ในประเภท ${selectedGenre}`}
          </div>
        </div>

        {/* Movies Grid */}
        {currentMovies.length > 0 ? (
          <>
            <div className="movies-grid">
              {currentMovies.map(m => (
                <MovieCard key={m.movie_id} movie={m} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <nav className="pagination-nav">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ก่อนหน้า
                  </button>

                  {[...Array(Math.min(5, totalPages))].map((_, index) => {
                    let pageNumber = index + 1;
                    if (totalPages > 5) {
                      if (currentPage > 3) {
                        pageNumber = currentPage - 2 + index;
                      }
                      if (currentPage > totalPages - 3) {
                        pageNumber = totalPages - 4 + index;
                      }
                    }

                    if (pageNumber > 0 && pageNumber <= totalPages) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => paginate(pageNumber)}
                          className={`pagination-btn ${currentPage === pageNumber ? 'active' : ''
                            }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    ถัดไป
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="no-results">
            <p>ไม่พบภาพยนตร์ที่ค้นหา</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Movies;