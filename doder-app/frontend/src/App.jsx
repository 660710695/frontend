import { BrowserRouter, Routes, Route } from "react-router-dom";
// Assuming you created AuthContext.jsx in a 'context' folder
import { AuthProvider } from "./contexts/AuthContext"; 

import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register"; // Adjust path if necessary
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Cinema from "./pages/Cinema";
import Movies from "./pages/Movies";
import MovieDetail from "./pages/MovieDetail";
import Profile from "./pages/Profile";
import SeatPicker from "./components/SeatPicker";
import CheckOut from "./pages/CheckOut";

function App() {
  return (
    // 1. WRAP everything with the AuthProvider
    <AuthProvider> 
      <BrowserRouter>
        <Navbar />

        <Routes>
          {/* PUBLIC ROUTES (Anyone can access) */}
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/seats" element={<SeatPicker />} />
          <Route path="/cinema" element={<Cinema />} />

          {/* 💥 NEW REGISTER ROUTE GOES HERE 💥 */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          
          {/* PROTECTED ROUTES (Login Required) */}
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute>
                <CheckOut />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;