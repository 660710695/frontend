import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  withCredentials: true
});

// เพิ่ม interceptor สำหรับแนบ token ในทุก request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Showtime APIs
export const getShowtimes = (params) => api.get("/showtimes", { params });
export const getShowtimeById = (id) => api.get(`/showtimes/${id}`);
export const getSeatsByShowtime = (showtimeId) => api.get(`/showtimes/${showtimeId}/seats`);

// Booking APIs
export const createBooking = (data) => api.post("/bookings", data);
export const getMyBookings = () => api.get("/bookings/my-bookings");
export const getBookingById = (id) => api.get(`/bookings/${id}`);
export const confirmPayment = (bookingId) => api.put(`/bookings/${bookingId}/confirm-payment`);
export const cancelBooking = (id) => api.delete(`/bookings/${id}`);

// Movie APIs
export const getMovies = () => api.get("/movies");
export const getMovieById = (id) => api.get(`/movies/${id}`);

// Cinema APIs
export const getCinemas = () => api.get("/cinemas");
export const getCinemaById = (id) => api.get(`/cinemas/${id}`);

// Auth APIs
export const login = (data) => api.post("/auth/login", data);
export const register = (data) => api.post("/auth/register", data);
export const getProfile = () => api.get("/auth/profile");

export default api;
