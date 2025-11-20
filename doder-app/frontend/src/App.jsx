import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Cinema from "./pages/Cinema";
import Movies from "./pages/Movies";
import MovieDetail from "./pages/MovieDetail";
import Profile from "./pages/Profile";
import SeatPicker from "./components/SeatPicker";
import CheckOut from "./pages/CheckOut";


function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/seats" element={<SeatPicker />} />
        <Route path="/cinema" element={<Cinema />} />
        <Route path="/checkout" element={<CheckOut />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
