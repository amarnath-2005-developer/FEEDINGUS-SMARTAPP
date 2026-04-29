const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const BASE_URL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL

function getToken() {
  return localStorage.getItem('feedingus_token')
}

async function request(endpoint, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers })
  const data = await res.json()

  if (!res.ok) throw new Error(data.message || 'API request failed')
  return data
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  verifyOtp: (body) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request('/auth/profile'),

  // Menu
  getMenu: (params = '') => request(`/menu${params}`),
  addMenuItem: (body) => request('/menu', { method: 'POST', body: JSON.stringify(body) }),

  // Orders
  getMyOrders: () => request('/orders/my'),
  getIncomingOrders: () => request('/orders/incoming'),
  getOrderById: (id) => request(`/orders/${id}`),
  createOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  clearOrders: () => request('/orders/clear', { method: 'DELETE' }),
  clearMyOrders: () => request('/orders/my/clear', { method: 'DELETE' }),

  // Favorites
  getFavorites: (userId) => request(`/favorites/${userId}`),
  addFavorite: (menuItemId) => request('/favorites', { method: 'POST', body: JSON.stringify({ menuItemId }) }),
  removeFavorite: (itemId) => request(`/favorites/${itemId}`, { method: 'DELETE' }),

  // Recommendations
  getRecommendations: (userId) => request(`/recommendations/${userId}`),

  // Reviews
  getReviews: (menuItemId) => request(`/reviews/${menuItemId}`),
  submitReview: (body) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  deleteReview: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),

  // Analytics (admin)
  getTopItems: () => request('/analytics/top-items'),
  getUserBehavior: () => request('/analytics/user-behavior'),

  // Payment & Billing
  createPayment: (body) => request('/payment/create', { method: 'POST', body: JSON.stringify(body) }),
  confirmPayment: (id) => request(`/payment/${id}/confirm`, { method: 'POST' }),
  getPaymentHistory: () => request('/payment/history'),
  getInvoice: (id) => request(`/payment/${id}/invoice`),
}
