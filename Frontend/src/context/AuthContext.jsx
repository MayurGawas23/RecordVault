import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient, { setAccessToken } from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('rv_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { user: userData, accessToken, refreshToken } = res.data;
      
      setUser(userData);
      setAccessToken(accessToken);
      localStorage.setItem('rv_user', JSON.stringify(userData));
      localStorage.setItem('rv_refresh_token', refreshToken);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', { name, email, password });
      const { user: userData, accessToken, refreshToken } = res.data;
      
      setUser(userData);
      setAccessToken(accessToken);
      localStorage.setItem('rv_user', JSON.stringify(userData));
      localStorage.setItem('rv_refresh_token', refreshToken);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout API error
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('rv_user');
      localStorage.removeItem('rv_refresh_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
