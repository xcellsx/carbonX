import axios from 'axios';

// Base URL for the Java backend (matches Bruno carbonx-backend-local: http://localhost:8080)
export const API_BASE_URL = 'http://localhost:8080';
export const API_BASE = `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Product API – matches Java backend ProductController & Bruno carbonx-backend-api
export const productAPI = {
  // GET /api/products (optional query: name, type)
  getAllProducts: (params = {}) => api.get('/products', { params }),

  // GET /api/products/:id
  getProductById: (id) => api.get(`/products/${id}`),

  // POST /api/products – body: array of Product (see Bruno createProducts.bru)
  createProducts: (productsList) => api.post('/products', productsList),

  // PUT /api/products – body: array of Product (bulk edit)
  updateProducts: (productsList) => api.put('/products', productsList),

  // PUT /api/products/:id – body: single Product
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),

  // DELETE /api/products/:id
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

// Health: Java backend uses Actuator on port 9000; no /api/health on 8080.
// Use only when backend exposes a health endpoint on the same host.
export const healthCheck = () => api.get('/health').catch(() => ({ status: 404 }));

export default api;
