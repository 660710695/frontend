// App.jsx (Finalized Routes with Admin Section)

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext"; 

import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register"; 
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Cinema from "./pages/Cinema";
import Movies from "./pages/Movies";
import MovieDetail from "./pages/MovieDetail";
import Profile from "./pages/Profile";
import SeatPicker from "./components/SeatPicker";
import CheckOut from "./pages/CheckOut";

// NEW ADMIN IMPORTS
import AdminDashboard from "./pages/Admin/AdminDashboard"; // Assuming this path
import AdminMovies from "./pages/Admin/AdminMovies";     // Assuming this path
// You will need AdminShowtimes.jsx and AdminCinemas.jsx later

function App() {
  return (
    <AuthProvider> 
      <BrowserRouter>
        <Navbar />

        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/cinema" element={<Cinema />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* PROTECTED ROUTES (Login Required) */}
          <Route path="/seats" element={<ProtectedRoute><SeatPicker /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckOut /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          {/* 💥 ADMIN PROTECTED ROUTES (Admin Role Required) 💥 */}
          
          {/* Admin Dashboard Entry Point */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Movie Management */}
          <Route 
            path="/admin/movies" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminMovies /> 
              </ProtectedRoute>
            } 
          />
          
          {/* You will add more admin pages here later: */}
          {/* <Route path="/admin/showtimes" ... /> */}
          {/* <Route path="/admin/cinemas" ... /> */}
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;