// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();
const API_BASE_URL = "http://localhost:8081/api";

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Stores user profile if logged in
    const [isLoading, setIsLoading] = useState(true);

    // 1. Function to check token and fetch user profile
    const checkAuthStatus = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            // Call the backend endpoint GET /api/auth/profile
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`, 
                },
            });
            
            const data = await response.json();

            if (response.ok && data.success) {
                setUser(data.data); // Set the authenticated user profile
            } else {
                localStorage.removeItem('authToken'); // Token invalid or expired
                setUser(null);
            }
        } catch (error) {
            console.error("Profile fetch error:", error);
            localStorage.removeItem('authToken');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, logout, checkAuthStatus }}>
            {children}
        </AuthContext.Provider>
    );
};