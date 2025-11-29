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
import Success from "./pages/Success";

// NEW ADMIN IMPORTS
import AdminDashboard from "./pages/Admin/AdminDashboard"; // Assuming this path
import AdminMovies from "./pages/Admin/AdminMovies";     // Assuming this path
import AdminCinemas from "./pages/Admin/AdminCinemas";
import AdminTheaters from "./pages/Admin/AdminTheaters";
import AdminShowtimes from "./pages/Admin/AdminShowtimes";
import AdminSeats from "./pages/Admin/AdminSeats";
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
          <Route path="/success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
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

          {/* Cinema Management */}
          <Route
            path="/admin/cinemas"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCinemas />
              </ProtectedRoute>
            }
          />
          {/* Theater Management (Pass Cinema ID via Query Param) */}
          <Route
            path="/admin/theaters"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminTheaters />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/seats"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminSeats />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/showtimes"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminShowtimes />
              </ProtectedRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;