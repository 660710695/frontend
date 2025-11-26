// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Check path

const ProtectedRoute = ({ children }) => {
    const { user, isLoading } = useAuth();
    
    if (isLoading) {
        // Optionally show a loading spinner
        return <div>Loading...</div>; 
    }

    if (!user) {
        // 💥 THIS IS THE FIX 💥
        // If no user is logged in, redirect them to the /login page
        return <Navigate to="/login" replace />;
    }

    return children; // If logged in, render the intended component
};

export default ProtectedRoute;