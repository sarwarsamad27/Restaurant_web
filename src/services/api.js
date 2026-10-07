import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  logout: () => api.post('/logout'),
  getMe: () => api.get('/me'),
  updateProfile: (data) => api.put('/profile', data),
  changePassword: (data) => api.post('/change-password', data),
};

// Restaurant APIs
export const restaurantAPI = {
  getAll: (params) => api.get('/restaurants', { params }),
  getFeatured: () => api.get('/restaurants/featured'),
  getById: (id) => api.get(`/restaurants/${id}`),
  getBySlug: (slug) => api.get(`/restaurants/slug/${slug}`),
  getMenu: (id) => api.get(`/restaurants/${id}/menu`),
  create: (data) => {
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;
    return api.post('/restaurants', data, config);
  },
  update: (id, data) => {
    const isFormData = data instanceof FormData;
    const config = isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;

    if (isFormData) {
      data.append('_method', 'PUT');
      return api.post(`/restaurants/${id}`, data, config);
    }

    return api.put(`/restaurants/${id}`, data, config);
  },
  delete: (id) => api.delete(`/restaurants/${id}`),
};

// Category APIs
export const categoryAPI = {
  getAll: () => api.get('/categories'),
};

// Menu Item APIs
export const menuItemAPI = {
  getAll: (params) => api.get('/menu-items', { params }),
  getById: (id) => api.get(`/menu-items/${id}`),
  create: (data) => {
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;
    return api.post('/menu-items', data, config);
  },
  update: (id, data) => {
    const isFormData = data instanceof FormData;
    const config = isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;

    // PHP does not parse multipart bodies on PUT, so files go as POST + _method=PUT
    if (isFormData) {
      data.append('_method', 'PUT');
      return api.post(`/menu-items/${id}`, data, config);
    }

    return api.put(`/menu-items/${id}`, data, config);
  },
  delete: (id) => api.delete(`/menu-items/${id}`),
  toggleAvailability: (id) => api.post(`/menu-items/${id}/toggle-availability`),
};

// Order APIs
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getActive: () => api.get('/orders/active'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  assignDriver: (id, data) => api.post(`/orders/${id}/assign-driver`, data),
  cancel: (id, data) => api.post(`/orders/${id}/cancel`, data),
  track: (id) => api.get(`/orders/${id}/track`),
};

// Payment APIs
export const paymentAPI = {
  createStripeIntent: (data) => api.post('/payments/stripe/intent', data),
  confirmStripePayment: (data) => api.post('/payments/stripe/confirm', data),
  createPayPalOrder: (data) => api.post('/payments/paypal/create', data),
  capturePayPalOrder: (data) => api.post('/payments/paypal/capture', data),
};

// Driver APIs
export const driverAPI = {
  getMe: () => api.get('/driver/me'),
  updateProfile: (data) => api.post('/driver/profile', data),
  updateLocation: (data) => api.post('/driver/location', data),
  updateStatus: (data) => api.post('/driver/status', data),
  getAvailableDeliveries: (params) => api.get('/driver/deliveries/available', { params }),
  getDeliveries: (params) => api.get('/driver/deliveries', { params }),
  acceptDelivery: (orderId) => api.post(`/driver/deliveries/${orderId}/accept`),
  completeDelivery: (orderId) => api.post(`/driver/deliveries/${orderId}/complete`),
  getEarnings: () => api.get('/driver/earnings'),
};

// Notification APIs
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnread: () => api.get('/notifications/unread'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};

// Review APIs
export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  getRestaurantReviews: (restaurantId) => api.get(`/reviews/restaurant/${restaurantId}`),
  getMyReviews: () => api.get('/reviews/my-reviews'),
};

// AI & Assistant APIs
export const aiAPI = {
  recommendMeals: (preferences) => api.post('/recommend-meals', preferences),
  chatOrder: (message) => api.post('/ai-order', message),
  confirmChatOrder: (payload) => api.post('/ai-order/confirm', payload),
};

// Community Rating APIs
export const ratingAPI = {
  submit: (data) => api.post('/submit-rating', data),
  summary: (restaurantId) => api.get(`/restaurant-ratings/${restaurantId}`),
  reviews: (restaurantId, params) => api.get(`/restaurant-reviews/${restaurantId}`, { params }),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getRestaurants: (params) => api.get('/admin/restaurants', { params }),
  getRestaurant: (id) => api.get(`/admin/restaurants/${id}`),
  updateRestaurantStatus: (id, data) => api.put(`/admin/restaurants/${id}/status`, data),
  toggleFeatured: (id) => api.post(`/admin/restaurants/${id}/toggle-featured`),
  updateRestaurant: (id, data) => {
    if (data instanceof FormData) {
      if (!data.has('_method')) {
        data.append('_method', 'PUT');
      }
      return api.post(`/admin/restaurants/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.put(`/admin/restaurants/${id}`, data);
  },
  createRestaurant: (data) => {
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;
    return api.post('/admin/restaurants', data, config);
  },
  deleteRestaurant: (id) => api.delete(`/admin/restaurants/${id}`),
  getDietMenu: () => api.get('/admin/diet-menu'),
  updateDietMenu: (items) => api.post('/admin/diet-menu/update', { items }),
  getRestaurantRatings: (restaurantId, params) => api.get(`/admin/restaurant-ratings/${restaurantId}`, { params }),
  getRestaurantMenuItems: (restaurantId) => api.get(`/admin/restaurants/${restaurantId}/menu-items`),
  createMenuItem: (restaurantId, data) => {
    const isFormData = data instanceof FormData;
    const config = isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;

    return api.post(`/admin/restaurants/${restaurantId}/menu-items`, data, config);
  },
  updateMenuItem: (restaurantId, menuItemId, data) => {
    const isFormData = data instanceof FormData;
    const config = isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;

    if (isFormData) {
      data.append('_method', 'PUT');
      return api.post(`/admin/restaurants/${restaurantId}/menu-items/${menuItemId}`, data, config);
    }

    return api.put(`/admin/restaurants/${restaurantId}/menu-items/${menuItemId}`, data, config);
  },
  deleteMenuItem: (restaurantId, menuItemId) => api.delete(`/admin/restaurants/${restaurantId}/menu-items/${menuItemId}`),
  updateMenuItemPrice: (menuItemId, data) => api.patch(`/admin/menu-items/${menuItemId}/price`, data),
  getOrders: (params) => api.get('/admin/orders', { params }),
  verifyDriver: (id) => api.post(`/admin/drivers/${id}/verify`),
  sendPromotion: (data) => api.post('/admin/send-promotion', data),
  getRevenueAnalytics: (params) => api.get('/admin/analytics/revenue', { params }),
};

export default api;
