import axios from 'axios';

// Base URL for the Java backend. Override with VITE_API_BASE_URL in .env (e.g. http://localhost:8808).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const API_BASE = `${API_BASE_URL}/api`;

/** Arango ids are like "users/421"; API expects document key only (e.g. "421") for paths. */
export function normalizeUserIdKey(userId) {
  if (userId == null || typeof userId !== 'string') return userId;
  const s = userId.trim();
  if (s.includes('/')) return s.split('/').slice(1)[0] || s;
  return s;
}

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

  // GET .../lca runs LCA and persists lcaValue; optionally call saveProductLca after to ensure persistence
  calculateProduct: (id, userId = null) =>
    api.get(`/experiments/products/${id}/lca`, { params: userId != null ? { userId: normalizeUserIdKey(userId) } : {} }),

  // PUT /api/products/:id/lca – persist only LCA value (same save path as backend)
  saveProductLca: (id, lcaValue) => api.put(`/products/${id}/lca`, { lcaValue }),
};

// Process API – matches Java backend ProcessController
export const processAPI = {
  // GET /api/processes (optional query: name, type)
  getProcesses: (params = {}) => api.get('/processes', { params }),
  getProcessById: (id) => api.get(`/processes/${id}`),
};

// Must match backend application.properties: arangodb.spring.data.database=testCompany
const DEFAULT_GRAPH_DATABASE = 'testCompany';

// Graph API – matches misfit-1-3 backend GraphController: GET /api/graph/productgraph?database=&productid=
export const graphAPI = {
  getProductGraph: (database = DEFAULT_GRAPH_DATABASE, productId) =>
    api.get('/graph/productgraph', { params: { database, productid: productId } }),
  getMetadata: (name) => api.get('/graph/metadata', { params: { name } }),
  getEdges: (name) => api.get('/graph/edges', { params: { name } }),
  getVertices: (name) => api.get('/graph/vertices', { params: { name } }),
  sendQuery: (database, query) =>
    api.post('/graph/query', query, { params: { database }, headers: { 'Content-Type': 'text/plain' } }),
};

// Network / graph – supply-chain nodes and links
// misfit-1-3 backend: only GET /api/graph/productgraph?database=&productid= (both required).
// When productId is null we cannot call that endpoint; return empty graph so the page loads without 500.
export const networkAPI = {
  getProductGraph: (productId = null) => {
    if (productId != null && productId !== '') {
      return graphAPI.getProductGraph(DEFAULT_GRAPH_DATABASE, productId);
    }
    return Promise.resolve({ data: { nodes: [], links: [] } });
  },

  getProductGraphArango: (productId) =>
    graphAPI.getProductGraph(DEFAULT_GRAPH_DATABASE, productId),
};

// Health: Java backend uses Actuator on port 9000; no /api/health on 8080.
// Use only when backend exposes a health endpoint on the same host.
export const healthCheck = () => api.get('/health').catch(() => ({ status: 404 }));

// Auth – signup (register) with email uniqueness and validation; login for onboarded users only
export const authAPI = {
  register: (body) => api.post('/auth/register', body),
  login: (body) => api.post('/auth/login', body),
};

// Users – list existing users; get one by key (GET /api/company/users, GET /api/company/users/:key)
export const usersAPI = {
  getAll: () => api.get('/company/users'),
  /** Get user by document key. Pass key only (e.g. from id "users/xyz" use "xyz"). */
  getByKey: (key) => api.get(`/company/users/${encodeURIComponent(key)}`),
};

// localStorage key for user-scoped LCA values saved by Inventory after calculation.
// Shape: { [normalizedUserId]: { [productKey]: lcaValue } }
const LCA_LOCAL_BY_USER_PRODUCT_KEY = 'carbonx_lca_by_user_product_v1';

/**
 * Returns a map of { productKey: lcaValue } for the given user, reading from localStorage.
 * Used by all pages to overlay calculated LCA values that were persisted by Inventory.
 */
export function getLocalLcaMap(userId) {
  try {
    const raw = localStorage.getItem(LCA_LOCAL_BY_USER_PRODUCT_KEY) || '{}';
    const store = JSON.parse(raw) || {};
    const uid = normalizeUserIdKey(userId);
    return (uid && store[uid] && typeof store[uid] === 'object') ? store[uid] : {};
  } catch {
    return {};
  }
}

/**
 * Returns a map of { productNameLower: { scope1, scope2, scope3, total } } from the LCA name cache.
 * Populated by Inventory after each LCA calculation. Used by Dashboard for scope totals.
 */
export function getLocalLcaCacheByName() {
  try {
    const raw = localStorage.getItem('carbonx_lca_cache_by_name_v1') || '{}';
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

// User-scoped LCA storage: persist and load LCA by userId + productKey (reliable across page reloads)
export const userLcaAPI = {
  /** GET /api/users/:userId/lca → { productKey: lcaValue, ... } — userId can be full id (e.g. users/421) or key */
  getByUserId: (userId) => api.get(`/users/${encodeURIComponent(normalizeUserIdKey(userId))}/lca`),
  /** PUT /api/users/:userId/lca/:productKey  body: { lcaValue } */
  save: (userId, productKey, lcaValue) =>
    api.put(`/users/${encodeURIComponent(normalizeUserIdKey(userId))}/lca/${encodeURIComponent(productKey)}`, { lcaValue }),
};

export default api;
