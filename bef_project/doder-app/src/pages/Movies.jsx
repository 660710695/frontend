import MovieCard from "../components/MovieCard";
import "../styles/Movies.css";
import { movies } from "../data/movies";


function Movies() {
  return (
    <div className="movies-page">
      <h1>ภาพยนตร์</h1>
      <div className="movies-grid">
        {movies.map(m => <MovieCard key={m.id} movie={m} />)}
      </div>
    </div>
  );
}

export default Movies;
