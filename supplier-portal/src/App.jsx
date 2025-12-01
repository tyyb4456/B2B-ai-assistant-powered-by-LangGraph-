/**
 * Main Application Component for Supplier Portal
 * 
 * Location: supplier-portal/src/App.jsx
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, RequireAuth, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RequestList from './pages/RequestList';
import RequestDetail from './pages/RequestDetail';

// Layout
import Layout from './components/layout/Layout';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

// Main App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#111827',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
                duration: 3000,
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                duration: 5000,
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// App Routes Component
function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, requests, request-detail
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // If not authenticated, show login
  if (!isAuthenticated()) {
    return <Login onLoginSuccess={() => setCurrentView('dashboard')} />;
  }

  // Handle navigation
  const handleViewRequest = (requestId) => {
    setSelectedRequestId(requestId);
    setCurrentView('request-detail');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedRequestId(null);
  };

  const handleBackToList = () => {
    setCurrentView('requests');
    setSelectedRequestId(null);
  };

  // Render current view
  return (
    <Layout>
      {currentView === 'dashboard' && (
        <Dashboard 
          onViewAllRequests={() => setCurrentView('requests')}
          onViewRequest={handleViewRequest}
        />
      )}

      {currentView === 'requests' && (
        <RequestList 
          onRequestClick={handleViewRequest}
        />
      )}

      {currentView === 'request-detail' && selectedRequestId && (
        <RequestDetail 
          requestId={selectedRequestId}
          onBack={handleBackToList}
        />
      )}
    </Layout>
  );
}

export default App;