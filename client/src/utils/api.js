import axios from 'axios';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://finance-tracker-app-ihdp.onrender.com/api';
// const API_BASE_URL = 'https://finance-tracker-app-ihdp.onrender.com/api';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
  withCredentials: true, // Include cookies in requests
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
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors and CORS issues
    if (!error.response) {
      console.error('Network error:', error.message);
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_FAILED') {
        // Retry logic for network errors
        if (!originalRequest._retry && originalRequest._retryCount < 3) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, originalRequest._retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return api(originalRequest);
        }
      }
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Handle CORS errors specifically
    if (error.message?.includes('CORS') || error.message?.includes('Access-Control-Allow-Origin')) {
      console.error('CORS error detected. Please check server configuration.');
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  setup2FA: () => api.post('/auth/setup-2fa'),
  verify2FA: (data) => api.post('/auth/verify-2fa', data),
  disable2FA: (data) => api.post('/auth/disable-2fa', data),
  logout: () => api.post('/auth/logout'),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`)
};

// Transaction API
export const transactionAPI = {
  getTransactions: (params) => api.get('/transactions', { params }),
  getTransaction: (id) => api.get(`/transactions/${id}`),
  createTransaction: (data) => api.post('/transactions', data),
  updateTransaction: (id, data) => api.put(`/transactions/${id}`, data),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
  uploadReceipt: (formData) => api.post('/transactions/upload-receipt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStats: (params) => api.get('/transactions/stats/summary', { params })
};

// Budget API
export const budgetAPI = {
  getBudgets: (params) => api.get('/budgets', { params }),
  getBudget: (id) => api.get(`/budgets/${id}`),
  createBudget: (data) => api.post('/budgets', data),
  updateBudget: (id, data) => api.put(`/budgets/${id}`, data),
  deleteBudget: (id) => api.delete(`/budgets/${id}`),
  toggleBudget: (id) => api.patch(`/budgets/${id}/toggle`),
  updateAlerts: (id, data) => api.patch(`/budgets/${id}/alerts`, data),
  getStats: (params) => api.get('/budgets/stats/summary', { params }),
  getPerformance: (id, params) => api.get(`/budgets/stats/performance?budgetId=${id}`, { params }),
  recalculate: () => api.post('/budgets/recalculate')
};

// Financial Goals API
export const goalAPI = {
  getGoals: (params) => api.get('/goals', { params }),
  getGoal: (id) => api.get(`/goals/${id}`),
  createGoal: (data) => api.post('/goals', data),
  updateGoal: (id, data) => api.put(`/goals/${id}`, data),
  deleteGoal: (id) => api.delete(`/goals/${id}`),
  addContribution: (id, data) => api.post(`/goals/${id}/contribute`, data),
  updateStatus: (id, data) => api.patch(`/goals/${id}/status`, data),
  addMilestone: (id, data) => api.post(`/goals/${id}/milestones`, data),
  getStats: (params) => api.get('/goals/stats/summary', { params }),
  getProgress: (id) => api.get(`/goals/${id}/progress`)
};

// Investment API
export const investmentAPI = {
  getInvestments: (params) => api.get('/investments', { params }),
  getInvestment: (id) => api.get(`/investments/${id}`),
  createInvestment: (data) => api.post('/investments', data),
  updateInvestment: (id, data) => api.put(`/investments/${id}`, data),
  deleteInvestment: (id) => api.delete(`/investments/${id}`),
  addTransaction: (id, data) => api.post(`/investments/${id}/transactions`, data),
  updatePrices: () => api.post('/investments/update-prices'),
  getStats: (params) => api.get('/investments/stats/summary', { params }),
  getPerformance: (params) => api.get('/investments/stats/performance', { params }),
  setAlert: (id, data) => api.post(`/investments/${id}/alerts`, data),
  removeAlert: (id, alertId) => api.delete(`/investments/${id}/alerts/${alertId}`),
  getMarketData: (symbols) => api.get('/investments/market/data', { params: { symbols } })
};

// Reports API
export const reportAPI = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getExpenses: (params) => api.get('/reports/expenses', { params }),
  getIncome: (params) => api.get('/reports/income', { params }),
  getBudgets: (params) => api.get('/reports/budgets', { params }),
  getInvestments: (params) => api.get('/reports/investments', { params }),
  getGoals: (params) => api.get('/reports/goals', { params }),
  getDashboard: (params) => api.get('/reports/dashboard', { params }),
  exportCSV: (params) => api.get('/reports/export/csv', { 
    params,
    responseType: 'blob'
  })
};

// Chatbot API
export const chatbotAPI = {
  chat: (data) => api.post('/chatbot/chat', data),
  getAdvice: (data) => api.post('/chatbot/advice', data),
  analyzeSpending: (data) => api.post('/chatbot/analyze-spending', data),
  predictExpenses: (data) => api.post('/chatbot/predict-expenses', data),
  detectAnomalies: (data) => api.post('/chatbot/detect-anomalies', data)
};

// Notification API
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getNotification: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  archiveNotification: (id) => api.patch(`/notifications/${id}/archive`),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  updatePreferences: (data) => api.put('/notifications/preferences', data),
  getStats: () => api.get('/notifications/stats/summary')
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getSystemStats: () => api.get('/admin/stats/system'),
  getTransactions: (params) => api.get('/admin/transactions', { params }),
  sendNotification: (data) => api.post('/admin/notifications/send', data),
  getHealth: () => api.get('/admin/health')
};

export default api;
