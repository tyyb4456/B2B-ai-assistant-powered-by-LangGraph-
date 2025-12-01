/**
 * API Endpoints for Supplier Portal
 * 
 * Location: supplier-portal/src/api/endpoints.js
 */

import apiClient from './client';

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Login supplier user
 * @param {Object} credentials - { email, password }
 * @returns {Promise} Response with token and user data
 */
export const login = (credentials) => {
  return apiClient.post('/supplier/login', credentials);
};

/**
 * Logout supplier user (client-side only for now)
 */
export const logout = () => {
  localStorage.removeItem('supplier_token');
  localStorage.removeItem('supplier_user');
  window.location.href = '/login';
};

// ============================================
// SUPPLIER REQUESTS
// ============================================

/**
 * Get all requests for current supplier
 * @param {Object} params - { status, limit, offset }
 * @returns {Promise} List of requests
 */
export const getRequests = (params = {}) => {
  return apiClient.get('/supplier/requests', { params });
};

/**
 * Get pending requests (dashboard view)
 * @returns {Promise} List of pending requests
 */
export const getPendingRequests = () => {
  return apiClient.get('/supplier/requests/pending');
};

/**
 * Get single request by ID
 * @param {string} requestId - Request ID
 * @returns {Promise} Request details
 */
export const getRequestById = (requestId) => {
  return apiClient.get(`/supplier/requests/${requestId}`);
};

/**
 * Submit response to a request
 * @param {string} requestId - Request ID
 * @param {Object} response - { response_text, response_type, response_data }
 * @returns {Promise} Submission result
 */
export const submitResponse = (requestId, response) => {
  return apiClient.post(`/supplier/requests/${requestId}/respond`, response);
};

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Get notifications for supplier user
 * @param {Object} params - { unread_only, limit }
 * @returns {Promise} List of notifications
 */
export const getNotifications = (params = {}) => {
  return apiClient.get('/supplier/notifications', { params });
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise} Success response
 */
export const markNotificationRead = (notificationId) => {
  return apiClient.post(`/supplier/notifications/${notificationId}/mark-read`);
};

/**
 * Mark all notifications as read
 * @returns {Promise} Success response
 */
export const markAllNotificationsRead = () => {
  // TODO: Implement backend endpoint for this
  return apiClient.post('/supplier/notifications/mark-all-read');
};

// ============================================
// USER PROFILE
// ============================================

/**
 * Get current user profile
 * @returns {Promise} User profile data
 */
export const getProfile = () => {
  return apiClient.get('/supplier/profile');
};

/**
 * Update user profile
 * @param {Object} data - Profile update data
 * @returns {Promise} Updated profile
 */
export const updateProfile = (data) => {
  return apiClient.put('/supplier/profile', data);
};

/**
 * Change password
 * @param {Object} data - { current_password, new_password }
 * @returns {Promise} Success response
 */
export const changePassword = (data) => {
  return apiClient.post('/supplier/profile/change-password', data);
};

// ============================================
// STATISTICS (for dashboard)
// ============================================

/**
 * Get dashboard statistics
 * @returns {Promise} Dashboard stats
 */
export const getDashboardStats = () => {
  return apiClient.get('/supplier/dashboard/stats');
};

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check API health
 * @returns {Promise} Health status
 */
export const healthCheck = () => {
  return apiClient.get('/health');
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get current user from localStorage
 * @returns {Object|null} User object or null
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('supplier_user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('supplier_token');
  const user = getCurrentUser();
  return !!(token && user);
};

/**
 * Save user data to localStorage
 * @param {Object} user - User data
 * @param {string} token - Auth token
 */
export const saveAuth = (user, token) => {
  localStorage.setItem('supplier_user', JSON.stringify(user));
  localStorage.setItem('supplier_token', token);
};