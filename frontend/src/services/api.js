import axios from 'axios';

// In local development we default to relative /api (proxied by Vite),
// which avoids browser CORS errors against localhost backend ports.
// Set VITE_API_BASE_URL to use an absolute API host when needed.
const envApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
export const API_BASE_URL = envApiBaseUrl.replace(/\/+$/, '');
export const API_BASE = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';
const COMPANY_NAME = (import.meta.env.VITE_COMPANY_NAME || 'SingaporeMarine').trim();
const DATA_DATABASE = (import.meta.env.VITE_DATA_DATABASE || 'default').trim();
/** Arango DB name for shipLogs/ships + maritime LCA (seed data uses SingaporeMarine, not default/testCompany). */
const _maritimeDbRaw = (import.meta.env.VITE_MARITIME_DATABASE || 'SingaporeMarine').trim();
const MARITIME_DATABASE = _maritimeDbRaw === 'default' ? 'SingaporeMarine' : _maritimeDbRaw;

/** Arango ids are like "users/421"; API expects document key only (e.g. "421") for paths. */
export function normalizeUserIdKey(userId) {
  if (userId == null || typeof userId !== 'string') return userId;
  const s = userId.trim();
  if (s.includes('/')) return s.split('/').slice(1)[0] || s;
  return s;
}

/**
 * Stable localStorage session id: prefer Arango document key so it matches backend userId on products
 * and stays consistent between signup (POST response) and login (GET list).
 */
export function stableSessionUserId(user) {
  if (!user || typeof user !== 'object') return '';
  const key = String(user.key ?? user._key ?? '').trim();
  if (key) return key;
  return normalizeUserIdKey(String(user.id ?? user._id ?? ''));
}

/** Fires on same-tab login/logout so UI (e.g. instructional carousel) can re-read per-user localStorage. */
export function notifyCarbonXSessionUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('carbonx-session-updated'));
  }
}

// Demo-only: backend User model has no password field; we store signup passwords locally so login can verify.
const LOCAL_AUTH_CREDS_KEY = 'carbonx_local_credentials_v1';

function credentialEmailKey(email) {
  return String(email || '').trim().toLowerCase();
}

export function saveLocalSignupCredentials(email, password) {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_CREDS_KEY) || '{}';
    const obj = JSON.parse(raw);
    obj[credentialEmailKey(email)] = password;
    localStorage.setItem(LOCAL_AUTH_CREDS_KEY, JSON.stringify(obj));
  } catch (_) {}
}

/** If no local record (legacy account), password is not verified here. */
export function verifyLocalLoginCredentials(email, password) {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_CREDS_KEY) || '{}';
    const obj = JSON.parse(raw);
    const k = credentialEmailKey(email);
    if (!Object.prototype.hasOwnProperty.call(obj, k)) {
      return { ok: true, legacy: true };
    }
    return { ok: obj[k] === password, legacy: false };
  } catch {
    return { ok: true, legacy: true };
  }
}

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

function normalizeListPayload(data) {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  }
  return [];
}

// Product API – matches Java backend ProductController & Bruno carbonx-backend-api
export const productAPI = {
  // GET /api/products (optional query: name, type)
  getAllProducts: async (params = {}) => {
    const res = await api.get('/products', {
      params: { database: DATA_DATABASE, ...params },
    });
    return { ...res, data: normalizeListPayload(res?.data) };
  },

  // GET /api/products/:companyName/:key
  getProductById: (id) => api.get(`/products/${encodeURIComponent(DATA_DATABASE)}/${encodeURIComponent(id)}`),

  // POST /api/products/:companyName – body: array of Product
  createProducts: (productsList) => api.post(`/products/${encodeURIComponent(DATA_DATABASE)}`, productsList),

  // PUT /api/products/:companyName – body: array of Product (bulk edit)
  updateProducts: (productsList) => api.put(`/products/${encodeURIComponent(DATA_DATABASE)}`, productsList),

  // PUT /api/products/:companyName/:key – body: single Product
  updateProduct: (id, productData) => api.put(`/products/${encodeURIComponent(DATA_DATABASE)}/${encodeURIComponent(id)}`, productData),

  // DELETE /api/products/:companyName/:key
  deleteProduct: (id) => api.delete(`/products/${encodeURIComponent(DATA_DATABASE)}/${encodeURIComponent(id)}`),

  // GET /api/lca/rough?database=&collection=products&documentKey=
  calculateProduct: (id, userId = null) =>
    api.get('/lca/rough', {
      params: {
        database: DATA_DATABASE,
        collection: 'products',
        documentKey: id,
        ...(userId != null ? { userId: normalizeUserIdKey(userId) } : {}),
      },
    }),

  // PUT /api/products/:id/lca – persist only LCA value (same save path as backend)
  saveProductLca: (id, lcaValue) => api.put(`/products/${id}/lca`, { lcaValue }),
};

// Process API – matches Java backend ProcessController
export const processAPI = {
  // GET /api/processes (optional query: name, type)
  getProcesses: (params = {}) =>
    api.get('/processes', { params: { database: DATA_DATABASE, ...params } }),
  getProcessById: (id) => api.get(`/processes/${id}`),
};

// Must match an existing backend company database (InitialSetup seeds SingaporeMarine).
const DEFAULT_GRAPH_DATABASE = DATA_DATABASE || 'default';

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

// Templates / graph maps from TemplateController
export const templateAPI = {
  getTemplateMap: (collection, key, database = DATA_DATABASE) =>
    api.get(`/templates/${encodeURIComponent(collection)}/${encodeURIComponent(key)}/map`, {
      params: { database },
    }),
  getConnectedProductNodes: (database = DATA_DATABASE) =>
    api.get('/templates', { params: { database, nodeType: 'connected' } }),
};

// Maritime API – vessel/activity data and rough maritime LCA (uses MARITIME_DATABASE, not product graph DB)
export const maritimeAPI = {
  getShip: (mmsi, companyName = MARITIME_DATABASE) =>
    api.get('/maritime/ships', { params: { companyName, mmsi } }),
  getShipLogs: async (params = {}, companyName = MARITIME_DATABASE) => {
    const res = await api.get('/maritime/shiplogs', {
      params: { companyName, limit: 25000, ...params },
    });
    return { ...res, data: normalizeListPayload(res?.data) };
  },
  getShipLocations: (mmsi, companyName = MARITIME_DATABASE) =>
    api.get(`/maritime/shiplogs/${encodeURIComponent(mmsi)}/locations`, { params: { companyName } }),
  getLca: (mmsi, companyName = MARITIME_DATABASE) =>
    api.get('/maritime/lca', { params: { companyName, mmsi } }),
};

// Health: Java backend uses Actuator on port 9000; no /api/health on 8080.
// Use only when backend exposes a health endpoint on the same host.
export const healthCheck = () => api.get('/health').catch(() => ({ status: 404 }));

function splitFullName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function mapBackendUser(user = {}) {
  return {
    ...user,
    key: user.key || user._key || user.id,
    id: user.id || user._id || user.key || user._key,
    email: user.email || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
  };
}

// Auth shim over existing user endpoints in backend.
export const authAPI = {
  register: async ({ fullName, email, password }) => {
    const existing = await api.get(`/users/${encodeURIComponent(COMPANY_NAME)}`, { params: { email } });
    if (Array.isArray(existing.data) && existing.data.length > 0) {
      const err = new Error('An account with this email already exists.');
      err.response = { status: 409, data: { message: 'An account with this email already exists.' } };
      throw err;
    }

    const { firstName, lastName } = splitFullName(fullName);
    const payload = {
      email,
      username: email,
      firstName,
      lastName,
      role: 'user',
      companyName: COMPANY_NAME,
      active: true,
      // Backend model currently does not include password field.
      password,
    };
    const created = await api.post(`/users/${encodeURIComponent(COMPANY_NAME)}`, payload);
    const mapped = mapBackendUser(created.data);
    saveLocalSignupCredentials(email, password);
    return { ...created, data: mapped };
  },

  login: async ({ email, password }) => {
    const response = await api.get(`/users/${encodeURIComponent(COMPANY_NAME)}`, { params: { email } });
    const user = Array.isArray(response.data) ? response.data[0] : null;
    if (!user) {
      const err = new Error('Account is not registered.');
      err.response = { status: 404, data: { message: 'Account is not registered.' } };
      throw err;
    }
    return { ...response, data: mapBackendUser({ ...user, password }) };
  },
};

// Users – list existing users; get one by key (GET /api/users/:company, GET /api/users/:company/:key)
export const usersAPI = {
  getAll: () => api.get(`/users/${encodeURIComponent(COMPANY_NAME)}`),
  /** Get user by document key. Pass key only (e.g. from id "users/xyz" use "xyz"). */
  getByKey: (key) => api.get(`/users/${encodeURIComponent(COMPANY_NAME)}/${encodeURIComponent(key)}`),
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
