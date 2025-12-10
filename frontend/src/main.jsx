// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Dashboard from './pages/Dashboard';
import Conversation from './pages/Conversation';
import History from './pages/History';
import Negotiations from './pages/Negotiations';
import ConversationDetail from './pages/ConversationDetail';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create router with your preferred pattern
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "",
        element: <Dashboard />,
      },
      {
        path: "conversation",
        element: <Conversation />, // New conversation page
      },
      {
        path: "conversation/:threadId",
        element: <Conversation />, // Existing conversation (same component)
      },
      {
        path: "conversation/:threadId/details",
        element: <ConversationDetail />, // Detailed view (your existing page)
      },
      {
        path: "history",
        element: <History />,
      },
      {
        path: "negotiations",
        element: <Negotiations />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        
        {/* Toast notifications */}
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
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);