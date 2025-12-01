/**
 * Authentication Context for Supplier Portal
 * 
 * Location: supplier-portal/src/context/AuthContext.jsx
 */

import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../api/endpoints';

// Create context
const AuthContext = createContext(null);

// AuthProvider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('supplier_token');
      const storedUser = api.getCurrentUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.login({ email, password });
      const { access_token, user: userData } = response.data;

      // Save to state
      setToken(access_token);
      setUser(userData);

      // Save to localStorage
      api.saveAuth(userData, access_token);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('supplier_token');
    localStorage.removeItem('supplier_user');
    // Redirect to login will be handled by the component
  };

  // Update user in context (after profile update)
  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    api.saveAuth(updatedUser, token);
  };

  // Check if authenticated
  const isAuthenticated = () => {
    return !!(token && user);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
}

// HOC for protected routes
export function RequireAuth({ children, onUnauthenticated }) {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated() && onUnauthenticated) {
      onUnauthenticated();
    }
  }, [isAuthenticated, loading, onUnauthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  return children;
}