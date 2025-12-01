/**
 * React Query Hooks for Supplier Portal
 * 
 * Location: supplier-portal/src/api/hooks.js
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './endpoints';
import toast from 'react-hot-toast';

// ============================================
// QUERY KEYS
// ============================================

export const queryKeys = {
  requests: ['requests'],
  request: (id) => ['request', id],
  pendingRequests: ['pending-requests'],
  notifications: ['notifications'],
  unreadNotifications: ['notifications', 'unread'],
  profile: ['profile'],
  dashboardStats: ['dashboard-stats'],
};

// ============================================
// AUTHENTICATION MUTATIONS
// ============================================

/**
 * Hook for login mutation
 */
export function useLogin() {
  return useMutation({
    mutationFn: api.login,
    onSuccess: (response) => {
      // Save auth data
      const { access_token, user } = response.data;
      api.saveAuth(user, access_token);
      
      toast.success(`Welcome back, ${user.full_name}!`);
    },
    onError: (error) => {
      toast.error(error.message || 'Login failed');
    },
  });
}

/**
 * Hook for logout
 */
export function useLogout() {
  const queryClient = useQueryClient();
  
  return () => {
    api.logout();
    queryClient.clear(); // Clear all cached data
    toast.success('Logged out successfully');
  };
}

// ============================================
// REQUESTS QUERIES
// ============================================

/**
 * Hook to fetch all requests
 */
export function useRequests(params = {}, options = {}) {
  return useQuery({
    queryKey: [...queryKeys.requests, params],
    queryFn: () => api.getRequests(params),
    select: (response) => response.data,
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

/**
 * Hook to fetch pending requests
 */
export function usePendingRequests(options = {}) {
  return useQuery({
    queryKey: queryKeys.pendingRequests,
    queryFn: api.getPendingRequests,
    select: (response) => response.data,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // 15 seconds
    ...options,
  });
}

/**
 * Hook to fetch single request by ID
 */
export function useRequest(requestId, options = {}) {
  return useQuery({
    queryKey: queryKeys.request(requestId),
    queryFn: () => api.getRequestById(requestId),
    select: (response) => response.data,
    enabled: !!requestId && (options.enabled !== false),
    ...options,
  });
}

// ============================================
// REQUEST RESPONSE MUTATION
// ============================================

/**
 * Hook to submit response to a request
 */
export function useSubmitResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, response }) => 
      api.submitResponse(requestId, response),
    onSuccess: (response, variables) => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.request(variables.requestId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.requests 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.pendingRequests 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboardStats 
      });
      
      toast.success(
        '✅ Response submitted successfully! Workflow has been resumed.',
        { duration: 5000 }
      );
      
      return response.data;
    },
    onError: (error) => {
      toast.error(
        error.message || 'Failed to submit response. Please try again.',
        { duration: 5000 }
      );
    },
  });
}

// ============================================
// NOTIFICATIONS QUERIES
// ============================================

/**
 * Hook to fetch notifications
 */
export function useNotifications(params = {}, options = {}) {
  return useQuery({
    queryKey: [...queryKeys.notifications, params],
    queryFn: () => api.getNotifications(params),
    select: (response) => response.data,
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

/**
 * Hook to fetch unread notifications
 */
export function useUnreadNotifications(options = {}) {
  return useQuery({
    queryKey: queryKeys.unreadNotifications,
    queryFn: () => api.getNotifications({ unread_only: true }),
    select: (response) => response.data,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

/**
 * Hook to mark notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.markNotificationRead,
    onSuccess: () => {
      // Refetch notifications
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.notifications 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.unreadNotifications 
      });
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
    },
  });
}

// ============================================
// PROFILE QUERIES & MUTATIONS
// ============================================

/**
 * Hook to fetch user profile
 */
export function useProfile(options = {}) {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: api.getProfile,
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to update profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      
      // Update localStorage user data
      const currentUser = api.getCurrentUser();
      if (currentUser) {
        api.saveAuth(
          { ...currentUser, ...response.data },
          localStorage.getItem('supplier_token')
        );
      }
      
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
}

/**
 * Hook to change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: api.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to change password');
    },
  });
}

// ============================================
// DASHBOARD STATS QUERY
// ============================================

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: api.getDashboardStats,
    select: (response) => response.data,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook to prefetch request details
 * Useful for hover previews
 */
export function usePrefetchRequest() {
  const queryClient = useQueryClient();

  return (requestId) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.request(requestId),
      queryFn: () => api.getRequestById(requestId),
    });
  };
}

/**
 * Hook to get current user from cache
 */
export function useCurrentUser() {
  return api.getCurrentUser();
}

/**
 * Hook to check authentication status
 */
export function useIsAuthenticated() {
  return api.isAuthenticated();
}