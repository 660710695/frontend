// ProtectedRoute.jsx (Revised to include role check)

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Check path

// Component accepts an optional prop 'requiredRole'
const ProtectedRoute = ({ children, requiredRole }) => {
    // Assuming useAuth() gives you { user, isLoading }
    const { user, isLoading } = useAuth(); 
    
    if (isLoading) {
        return <div>Loading user authentication...</div>; 
    }

    if (!user) {
        // If not logged in, redirect to login page
        return <Navigate to="/login" replace />;
    }

    // New Role Check: 
    if (requiredRole && user.role !== requiredRole) {
        // If the user is logged in but is not the required role (e.g., customer accessing /admin)
        // Redirect them to the home page or a 403 Forbidden page
        alert("Access Denied: Admin privileges required.");
        return <Navigate to="/" replace />; 
    }

    return children; // If logged in and role matches, render the intended component
};

export default ProtectedRoute;