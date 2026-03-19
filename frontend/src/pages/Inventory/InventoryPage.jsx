import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './InventoryPage.css';
import { productAPI, userLcaAPI, normalizeUserIdKey } from '../../services/api';
import { getScopeTotalsFromProduct } from '../../utils/emission';
import Navbar from '../../components/Navbar/Navbar';
import { Search, X, Triangle, CirclePlus, Trash2, FilePlus, Package, ListOrdered, FileUp } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';
import DppModal from '../../components/DppModal/DppModal';
import InstructionalCarousel from '../../components/InstructionalCarousel/InstructionalCarousel';

// --- CSV parser: name and type only ---
const parseCsvFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided."));
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let text = e.target.result;
        if (text.charCodeAt(0) === 0xFEFF) text = text.substring(1);
        const lines = text.split(/[\r\n]+/).filter(line => line.trim() !== '');
        if (lines.length < 2) return reject(new Error("CSV must have a header and at least one data row."));
        const headerLine = lines[0];
        const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const lower = headers.map(h => h.toLowerCase());
        const nameIdx = lower.findIndex(h => h === 'product name' || h === 'name');
        const typeIdx = lower.findIndex(h => h === 'type');
        if (nameIdx === -1 || typeIdx === -1) {
          return reject(new Error('CSV must have columns "Product Name" (or "name") and "Type".'));
        }
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const name = (values[nameIdx] || '').trim();
          const type = (values[typeIdx] || 'product').trim();
          if (name) data.push({ name, type });
        }
        resolve(data);
      } catch (err) {
        reject(new Error("CSV parsing failed: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("Error reading file."));
    reader.readAsText(file);
  });
};

const STORAGE_KEY_TEMPLATES = 'carbonx-custom-templates';
function getStoredTemplates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Conversion for template → dppData (canonical: kg, seconds)
const WEIGHT_TO_KG = { kg: 1, g: 0.001, mg: 1e-6, µg: 1e-9, t: 1000 };
const TIME_TO_S = { s: 1, min: 60, h: 3600, d: 86400 };
function toCanonicalWeight(displayNum, unit) {
  const n = Number(displayNum);
  const factor = WEIGHT_TO_KG[unit] ?? 1;
  return Number.isNaN(n) ? 0 : n * factor;
}
function toCanonicalTime(displayNum, unit) {
  const n = Number(displayNum);
  const factor = TIME_TO_S[unit] ?? 1;
  return Number.isNaN(n) ? 0 : n * factor;
}

/** Convert template (ingredients + processes) to inventory dppData array (LCA components). */
function templateToDppData(template) {
  const dpp = [];
  const ingList = Array.isArray(template.ingredients) ? template.ingredients : [];
  const procList = Array.isArray(template.processes) ? template.processes : [];
  ingList.forEach((item) => {
    const name = typeof item === 'object' && item && 'ingredient' in item ? (item.ingredient || '').trim() : String(item || '');
    const weightStr = typeof item === 'object' && item && 'weight' in item ? String(item.weight || '') : '';
    const weightUnit = (typeof item === 'object' && item && 'weightUnit' in item) ? (item.weightUnit || 'kg') : 'kg';
    const weightKg = toCanonicalWeight(weightStr, weightUnit);
    dpp.push({
      ingredient: name || 'Ingredient',
      weightKg,
      unit: weightUnit,
      lcaValue: null,
      materialId: null,
      emissionFactor: null,
      isPackaging: false,
      isTransport: false,
    });
  });
  procList.forEach((item) => {
    const processName = typeof item === 'object' && item && 'process' in item ? String(item.process || '').trim() : String(item || '');
    const desc = typeof item === 'object' && item && 'description' in item ? String(item.description || '').trim() : '';
    const timeUnit = (typeof item === 'object' && item && 'timeUnit' in item) ? (item.timeUnit || 's') : 's';
    const durationSec = toCanonicalTime(desc, timeUnit);
    const label = processName ? `Process: ${processName}` : 'Process';
    dpp.push({
      ingredient: label,
      weightKg: durationSec,
      unit: timeUnit,
      lcaValue: null,
      materialId: null,
      emissionFactor: null,
      isPackaging: false,
      isTransport: false,
    });
  });
  return dpp;
}

/** Convert a custom template to an inventory product row (productName + dppData). */
function templateToProduct(template, localLcaMap = {}, lcaCacheByName = {}) {
  const dpp = templateToDppData(template);
  const q = template.quantity;
  const quantityNum = q != null && q !== '' ? Number(q) : null;
  const templateProductId = `template-${template.id}`;
  const rawLca = localLcaMap[templateProductId];
  const lcaResult = (rawLca != null && !Number.isNaN(Number(rawLca))) ? Number(rawLca) : 0;
  // Read scope breakdown from name cache if available
  const nameKey = (template.name || '').toLowerCase().trim();
  const cached = nameKey ? lcaCacheByName[nameKey] : null;
  return {
    productId: templateProductId,
    productName: template.name || 'Unnamed template',
    productQuantity: Number.isNaN(quantityNum) ? null : quantityNum,
    productQuantifiableUnit: null,
    dppData: JSON.stringify(dpp),
    lcaResult,
    scope1: cached?.scope1 ?? 0,
    scope2: cached?.scope2 ?? 0,
    scope3: cached?.scope3 ?? 0,
    userId: '',
    type: 'product',
    _fromTemplate: true,
    _templateId: template.id,
  };
}

// Instructional carousel slides for Inventory (first-time visit)
const INVENTORY_CAROUSEL_SLIDES = [
  {
    title: 'Welcome to Inventory',
    description: 'This is your product inventory. Here you can see all your products, their quantities, and total carbon footprint (LCA). Use the search bar to find products quickly.',
    icon: <Package size={40} />,
  },
  {
    title: 'Product table',
    description: 'Each row is a product. Expand a row with the arrow to see its breakdown (elements and processes). You can edit names, quantities, and add or remove components. Click "View DPP" to see the Digital Product Passport.',
    icon: <ListOrdered size={40} />,
  },
  {
    title: 'Add products',
    description: 'Use "Browse Templates" to pick from Pasta, Bowls, Soup, or Raw materials. Use "Upload BOM" to add products from a CSV or JSON file. New products will appear in the table above.',
    icon: <FileUp size={40} />,
  },
];

// --- SI units: canonical = kg (weight), seconds (time for processes) ---
const WEIGHT_UNITS = [
  { unit: 'kg', label: 'kg', toCanonical: 1 },
  { unit: 'g', label: 'g', toCanonical: 0.001 },
  { unit: 'mg', label: 'mg', toCanonical: 1e-6 },
  { unit: 'µg', label: 'µg', toCanonical: 1e-9 },
  { unit: 't', label: 't', toCanonical: 1000 },
];
const TIME_UNITS = [
  { unit: 's', label: 's', toCanonical: 1 },
  { unit: 'min', label: 'min', toCanonical: 60 },
  { unit: 'h', label: 'h', toCanonical: 3600 },
  { unit: 'd', label: 'd', toCanonical: 86400 },
];
function isProcessItem(item) {
  return (item?.ingredient || '').startsWith('Process:');
}

/** Process label for display: strip duration in parentheses so only "Process: name" is shown; amount is in the Amount column. */
function processDisplayLabel(ingredient) {
  if (!ingredient || !String(ingredient).startsWith('Process:')) return ingredient || '';
  const rest = String(ingredient).replace(/^Process:\s*/, '').trim();
  const paren = rest.indexOf(' (');
  return paren >= 0 ? `Process: ${rest.slice(0, paren).trim()}` : ingredient;
}
function toDisplayAmount(canonical, unit, isProcess) {
  const list = isProcess ? TIME_UNITS : WEIGHT_UNITS;
  const u = list.find((x) => x.unit === unit) || list[0];
  if (canonical == null || Number.isNaN(canonical)) return '';
  return canonical / u.toCanonical;
}
function toCanonicalAmount(displayValue, unit, isProcess) {
  const list = isProcess ? TIME_UNITS : WEIGHT_UNITS;
  const u = list.find((x) => x.unit === unit) || list[0];
  const num = Number(displayValue);
  if (Number.isNaN(num)) return isProcess ? 0 : 0;
  return num * u.toCanonical;
}

// --- JSON parser: array of { name, type } or single object ---
const parseJsonFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided."));
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const arr = Array.isArray(json) ? json : [json];
        const data = arr
          .map((item) => ({
            name: (item.name ?? item.productName ?? '').toString().trim(),
            type: (item.type ?? 'product').toString().trim(),
          }))
          .filter((item) => item.name);
        if (data.length === 0) return reject(new Error("JSON must contain at least one object with \"name\" and optionally \"type\"."));
        resolve(data);
      } catch (err) {
        reject(new Error("JSON parsing failed: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("Error reading file."));
    reader.readAsText(file);
  });
};

// Local-only cache for LCA totals so they persist across page reloads without touching the backend.
// Shape: { [productNameLower]: { scope1, scope2, scope3, total, updatedAt } }
const LCA_CACHE_KEY = 'carbonx_lca_cache_by_name_v1';

// LCA stored by userId + productKey (localStorage only, no backend). Survives refresh/navigation.
// Shape: { [normalizedUserId]: { [productKey]: lcaValue } }
const LCA_LOCAL_BY_USER_PRODUCT_KEY = 'carbonx_lca_by_user_product_v1';

function getLocalLcaMap(userId) {
  try {
    const raw = localStorage.getItem(LCA_LOCAL_BY_USER_PRODUCT_KEY) || '{}';
    const store = JSON.parse(raw) || {};
    const uid = normalizeUserIdKey(userId);
    return (uid && store[uid] && typeof store[uid] === 'object') ? store[uid] : {};
  } catch {
    return {};
  }
}

function setLocalLca(userId, productKey, lcaValue) {
  try {
    const raw = localStorage.getItem(LCA_LOCAL_BY_USER_PRODUCT_KEY) || '{}';
    const store = JSON.parse(raw) || {};
    const uid = normalizeUserIdKey(userId);
    if (!uid) return;
    if (!store[uid]) store[uid] = {};
    store[uid][String(productKey)] = lcaValue;
    localStorage.setItem(LCA_LOCAL_BY_USER_PRODUCT_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('[LCA] setLocalLca failed', e);
  }
}

const InventoryPage = () => {
  const location = useLocation();
  const [userId] = useState(localStorage.getItem('userId') || '');
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  
  const [productFile, setProductFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const productsRef = useRef([]);
  
  const [uploading, setUploading] = useState(false);
  const [showDppModal, setShowDppModal] = useState(false);
  const [currentDppProduct, setCurrentDppProduct] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [calculatingProductId, setCalculatingProductId] = useState(null);
  const [subProductWeights, setSubProductWeights] = useState({});
  const [editableIngredients, setEditableIngredients] = useState({});
  const [productNameEdits, setProductNameEdits] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {},
  });

  const fetchProducts = useCallback(async () => {
    const validUserId = userId && String(userId).trim() !== '' && String(userId) !== 'undefined';
    if (!validUserId) {
      setError('No user session found. Please log in.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const normalizedUserId = normalizeUserIdKey(userId);
      const res = await productAPI.getAllProducts(normalizedUserId ? { userId: normalizedUserId } : {});
      const raw = Array.isArray(res?.data) ? res.data : [];
      // Normalize: backend sometimes sends key as "" – treat as missing and use id (e.g. "product67" or "products/xyz" -> "xyz")
      const effectiveKey = (p) => {
        const k = (p.key && String(p.key).trim()) || (p._key && String(p._key).trim());
        if (k) return k;
        const id = p.id ?? p._id;
        if (id && String(id).includes('/')) return String(id).split('/').pop();
        return id ? String(id) : '';
      };
      const normalized = raw.map((p) => {
        const fromDpp = p.dpp;
        const name = p.name ?? fromDpp?.name ?? '';
        const key = effectiveKey(p) || (fromDpp?.key && String(fromDpp.key).trim());
        const emission = p.emissionInformation ?? fromDpp?.emissionInformation;
        return { ...p, name: name || p.name, key: key || p.key, emissionInformation: emission ?? p.emissionInformation };
      });
      // Secondary client-side filter as safety net for any products that slipped through without a userId
      const filtered = normalizedUserId ? normalized.filter((p) => !p.userId || normalizeUserIdKey(p.userId) === normalizedUserId) : normalized;
      // LCA: localStorage first (no backend required), then optional backend user LCA
      const validUserId = userId && String(userId).trim() !== '' && String(userId) !== 'undefined';
      const localLcaMap = getLocalLcaMap(userId);
      let userLcaMap = {};
      try {
        if (validUserId) {
          const userLcaRes = await userLcaAPI.getByUserId(userId);
          userLcaMap = (userLcaRes?.data && typeof userLcaRes.data === 'object') ? userLcaRes.data : {};
        }
      } catch (e) {
        // Backend optional
      }
      // Load any locally cached LCA totals from previous calculations (keyed by product name only).
      let lcaCacheByName = {};
      try {
        const cacheRaw = localStorage.getItem(LCA_CACHE_KEY) || '{}';
        lcaCacheByName = JSON.parse(cacheRaw) || {};
      } catch {
        lcaCacheByName = {};
      }

      const mapped = filtered.map((p) => {
        const productWithEmission = { ...p, DPP: p.DPP ?? p.dpp, emissionInformation: p.emissionInformation };
        const totals = getScopeTotalsFromProduct(productWithEmission);
        const apiKey = effectiveKey(p) || (p._key && String(p._key).trim()) || (p.id ?? p._id ?? '');
        if (!apiKey && p.name) console.warn('[getProducts] Empty productId for product name:', p.name, 'raw p.key/id:', p.key, p.id);
        // Prefer persisted LCA value from backend (support any casing: lcaValue, lcavalue, LCAvalue, LCAValue)
        let rawLca = p.lcaValue ?? p.lcavalue ?? p.LCAvalue ?? p.LCAValue;
        if (rawLca == null && typeof p === 'object') {
          const lcaKey = Object.keys(p).find((k) => String(k).toLowerCase() === 'lcavalue');
          if (lcaKey) rawLca = p[lcaKey];
        }
        const persistedLca = rawLca != null && rawLca !== '' && !Number.isNaN(Number(rawLca)) ? Number(rawLca) : null;
        // Prefer: localStorage (no backend) > backend user LCA > product-level > totals
        const rawLocalLca = localLcaMap[apiKey] ?? localLcaMap[String(apiKey)];
        const localLca = (rawLocalLca != null && !Number.isNaN(Number(rawLocalLca))) ? Number(rawLocalLca) : null;
        const rawUserLca = userLcaMap[apiKey] ?? userLcaMap[String(apiKey)];
        const userLca = (rawUserLca != null && !Number.isNaN(Number(rawUserLca))) ? Number(rawUserLca) : null;
        const base = {
          productId: apiKey,
          productName: p.name ?? '',
          productQuantity: p.quantityValue ?? p.quantity ?? null,
          productQuantifiableUnit: p.quantifiableUnit ?? null,
          dppData: (p.functionalProperties && p.functionalProperties.dppData) || (typeof p.dppData === 'string' ? p.dppData : '[]'),
          lcaResult: localLca ?? userLca ?? persistedLca ?? totals.total,
          scope1: totals.scope1,
          scope2: totals.scope2,
          scope3: totals.scope3,
          userId: p.userId,
          uploadedFile: p.uploadedFile,
          type: p.type,
          productOrigin: p.productOrigin ?? p.productorigin,
          functionalProperties: p.functionalProperties,
          DPP: p.DPP ?? p.dpp ?? null,
          emissionInformation: p.emissionInformation ?? null,
        };

        // Overlay name cache only if no localStorage or backend LCA
        const nameNorm = (s) => String(s || '').toLowerCase().trim();
        const cacheEntry = base.productName && localLca == null && userLca == null && persistedLca == null ? lcaCacheByName[nameNorm(base.productName)] : null;
        if (cacheEntry && typeof cacheEntry === 'object') {
          if (typeof cacheEntry.total === 'number') base.lcaResult = cacheEntry.total;
          if (typeof cacheEntry.scope1 === 'number') base.scope1 = cacheEntry.scope1;
          if (typeof cacheEntry.scope2 === 'number') base.scope2 = cacheEntry.scope2;
          if (typeof cacheEntry.scope3 === 'number') base.scope3 = cacheEntry.scope3;
        }

        return base;
      });
      const customTemplates = getStoredTemplates();
      const backendNames = new Set(mapped.map((prod) => prod.productName));
      const templateProducts = customTemplates
        .filter((t) => !backendNames.has(t.name || ''))
        .map((t) => templateToProduct(t, localLcaMap, lcaCacheByName));
      setProducts([...mapped, ...templateProducts]);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      const customTemplates = getStoredTemplates();
      const fallbackLcaMap = getLocalLcaMap(userId);
      let fallbackNameCache = {};
      try { fallbackNameCache = JSON.parse(localStorage.getItem(LCA_CACHE_KEY) || '{}'); } catch { fallbackNameCache = {}; }
      const templateProducts = customTemplates.map((t) => templateToProduct(t, fallbackLcaMap, fallbackNameCache));
      setProducts(templateProducts); // no backend names on error, show all templates
      // Don't set error so empty state shows: "Click + to add your first product"
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  // Re-sync template-derived products from localStorage when on Inventory
  // so edits made on Edit Template or Browse Templates are reflected here.
  // No products.length dependency — that caused an infinite re-fetch loop.
  const syncTemplatesIntoProducts = useCallback(() => {
    setProducts((prev) => {
      if (prev.length === 0) return prev;
      const templates = getStoredTemplates();
      const byId = new Map(templates.map((t) => [t.id, t]));
      return prev
        .map((p) => {
          if (!p._fromTemplate || !p._templateId) return p;
          const t = byId.get(p._templateId);
          if (!t) return null;
          const q = t.quantity;
          const quantityNum = q != null && q !== '' ? Number(q) : null;
          return {
            ...p,
            productName: t.name || p.productName,
            productQuantity: Number.isNaN(quantityNum) ? p.productQuantity : quantityNum,
            dppData: JSON.stringify(templateToDppData(t)),
          };
        })
        .filter(Boolean);
    });
  }, []);

  useEffect(() => {
    syncTemplatesIntoProducts();
  }, [syncTemplatesIntoProducts]);

  // When user returns to this tab after editing a template elsewhere, re-sync
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && location.pathname === '/inventory') {
        syncTemplatesIntoProducts();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [location.pathname, syncTemplatesIntoProducts]);

  /** Convert inventory dppData array back to template ingredients + processes for localStorage. */
function dppDataToTemplate(dppJson) {
  let dpp;
  try {
    dpp = typeof dppJson === 'string' ? JSON.parse(dppJson) : dppJson;
  } catch {
    return { ingredients: [], processes: [] };
  }
  if (!Array.isArray(dpp)) return { ingredients: [], processes: [] };
  const ingredients = [];
  const processes = [];
  dpp.forEach((item) => {
    const ing = (item.ingredient || '').trim();
    const weightUnit = item.unit || 'kg';
    const timeUnit = item.unit || 's';
    if (ing.startsWith('Process:')) {
      const rest = ing.replace(/^Process:\s*/, '').trim();
      const paren = rest.indexOf(' (');
      const process = paren >= 0 ? rest.slice(0, paren).trim() : rest;
      const descriptionDisplay = toDisplayAmount(item.weightKg, timeUnit, true);
      const description = descriptionDisplay === '' ? '' : String(descriptionDisplay);
      processes.push({ process, description, timeUnit });
    } else {
      const weightDisplay = toDisplayAmount(item.weightKg, weightUnit, false);
      const weight = weightDisplay === '' ? '' : String(weightDisplay);
      ingredients.push({
        ingredient: ing || 'Ingredient',
        weight,
        weightUnit,
      });
    }
  });
  return { ingredients, processes };
  }

  const autoSaveProduct = async (productId, newDppData, newTotalLca = null) => {
    setProducts(currentProducts =>
      currentProducts.map(prod => {
        if (prod.productId === productId) {
          const updatedLcaResult = newTotalLca !== null ? newTotalLca : prod.lcaResult;
          return { ...prod, dppData: newDppData, lcaResult: updatedLcaResult };
        }
        return prod;
      })
    );
    const prod = productsRef.current.find((p) => p.productId === productId);
    if (!prod) return;
    if (prod._fromTemplate && prod._templateId) {
      const templates = getStoredTemplates();
      const idx = templates.findIndex((t) => t.id === prod._templateId);
      if (idx >= 0) {
        const { ingredients, processes } = dppDataToTemplate(newDppData);
        const updated = { ...templates[idx], ingredients, processes };
        if (prod.productName !== templates[idx].name) updated.name = prod.productName;
        const next = [...templates];
        next[idx] = updated;
        try {
          localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(next));
        } catch (e) {
          console.warn('Could not save template to localStorage', e);
        }
      }
      return;
    }
    try {
      const body = {
        name: prod.productName,
        type: prod.type || 'product',
        productOrigin: prod.productOrigin ?? null,
        functionalProperties: { ...(prod.functionalProperties || {}), dppData: newDppData },
        userId: prod.userId ?? null,
        uploadedFile: prod.uploadedFile ?? null,
        DPP: prod.DPP ?? null,
      };
      await productAPI.updateProduct(productId, body);
      // Sync BOM-created template cards so Browse Templates and Edit Template reflect edits
      if (prod.uploadedFile && prod.productName) {
        const templates = getStoredTemplates();
        const { ingredients, processes } = dppDataToTemplate(newDppData);
        let changed = false;
        const next = templates.map((t) => {
          if (!t.id || !t.id.startsWith('bom-') || t.name !== prod.productName) return t;
          changed = true;
          return { ...t, name: prod.productName, ingredients, processes };
        });
        if (changed) {
          try {
            localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(next));
          } catch (e) {
            console.warn('Could not sync BOM template to localStorage', e);
          }
        }
      }
    } catch (err) {
      console.error("Auto-save Error:", err);
    }
  };


  const handleFileSelect = (file) => {
    if (!file) { setProductFile(null); return; }
    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.json')) {
      alert("Please select a .csv or .json file.");
      return;
    }
    setProductFile(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // --- Upload BOM: .csv or .json, name and type only ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!userId) return alert("Error: No user is logged in.");
    if (!productFile) return alert("Please select a file first.");

    setUploading(true);
    let items = [];

    try {
      const name = productFile.name.toLowerCase();
      if (name.endsWith('.json')) {
        items = await parseJsonFile(productFile);
      } else if (name.endsWith('.csv')) {
        items = await parseCsvFile(productFile);
      } else {
        alert("Please select a .csv or .json file.");
        setUploading(false);
        return;
      }
      if (items.length === 0) {
        alert("No valid products (name and type) found in file.");
        setUploading(false);
        return;
      }
    } catch (err) {
      console.error("Error parsing file:", err);
      alert(err.message || "Error parsing file.");
      setUploading(false);
      return;
    }

    try {
      const productsToCreate = items.map(({ name, type }) => ({
        name,
        type: type || 'product',
        productOrigin: null,
        functionalProperties: null,
        userId,
        uploadedFile: productFile.name,
        DPP: null,
      }));
      await productAPI.createProducts(productsToCreate);
      // Create a template card per BOM product (empty ingredients/processes) for Browse Templates
      const existing = getStoredTemplates();
      const newTemplates = items.map(({ name }, i) => ({
        id: `bom-${Date.now()}-${i}`,
        name: name || 'Unnamed',
        ingredients: [],
        processes: [],
      }));
      try {
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify([...existing, ...newTemplates]));
      } catch (e) {
        console.warn('Could not save BOM templates to localStorage', e);
      }
      setShowAddProduct(false);
      setProductFile(null);
      fetchProducts();
    } catch (err) {
      console.error("Network error during product save:", err);
      alert("Failed to save one or more products. Check console.");
    }
    setUploading(false);
  };
  
  const performActualDeleteProduct = async (productId) => {
    const product = products.find(p => p.productId === productId);
    if (product && product._fromTemplate && product._templateId) {
      const templates = getStoredTemplates().filter((t) => t.id !== product._templateId);
      try {
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
      } catch (e) {
        console.warn('Could not update templates in localStorage', e);
      }
      setProducts(prev => prev.filter(p => p.productId !== productId));
      return;
    }
    try {
      await productAPI.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.productId !== productId));
    } catch (err) {
      console.error("Delete error:", err);
      alert('Failed to delete product.');
    }
  };

  const handleProductNameBlur = (productId, currentDisplayName) => {
    const product = products.find((p) => p.productId === productId);
    if (!product) return;
    const newName = (currentDisplayName ?? product.productName ?? '').trim();
    setProductNameEdits((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    if (newName === (product.productName || '')) return;
    setProducts((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, productName: newName } : p))
    );
    if (product._fromTemplate && product._templateId) {
      const templates = getStoredTemplates();
      const idx = templates.findIndex((t) => t.id === product._templateId);
      if (idx >= 0) {
        const next = [...templates];
        next[idx] = { ...next[idx], name: newName };
        try {
          localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(next));
        } catch (e) {
          console.warn('Could not update template name in localStorage', e);
        }
      }
    }
  };

  const handleDelete = (productId) => {
    const product = products.find(p => p.productId === productId);
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product ? product.productName : 'this product'}"? This action cannot be undone.`,
      onConfirm: () => performActualDeleteProduct(productId)
    });
  };

  // --- Component Handlers ---
  const handleComponentChange = (e, p, idx) => {
    const key = `${p.productId}_${idx}`;
    const query = e.target.value;
    setEditableIngredients(prev => ({ ...prev, [key]: query }));
    setProducts(currentProducts =>
      currentProducts.map(prod => {
        if (prod.productId === p.productId) {
          let dpp = JSON.parse(prod.dppData);
          dpp[idx].ingredient = query;
          dpp[idx].materialId = null;
          dpp[idx].lcaValue = null;
          dpp[idx].emissionFactor = null;
          return { ...prod, dppData: JSON.stringify(dpp) };
        }
        return prod;
      })
    );
  };

  const handleWeightBlur = (e, p, idx) => {
    const key = `${p.productId}_${idx}`;
    const displayVal = e.target.value;
    setSubProductWeights(prev => ({ ...prev, [key]: displayVal }));

    const product = products.find(pr => pr.productId === p.productId);
    if (!product) return;
    let dpp;
    try { dpp = JSON.parse(product.dppData); } catch { return; }
    const item = dpp[idx];
    if (!item) return;

    const isTransport = item.isTransport || false;
    const isProcess = !isTransport && isProcessItem(item);
    const unit = item.unit || (isProcess ? 's' : 'kg');
    const effectiveUnit = unit === '-' ? (isProcess ? 's' : 'kg') : unit;
    const canonical = isTransport ? Number(displayVal) || 0 : toCanonicalAmount(displayVal, effectiveUnit, isProcess);
    runLcaCalculation(p.productId, idx, canonical);
  };

  const handleUnitChange = (p, idx, newUnit) => {
    const product = products.find(pr => pr.productId === p.productId);
    if (!product) return;
    let dpp;
    try { dpp = JSON.parse(product.dppData); } catch { return; }
    const item = dpp[idx];
    if (!item || item.isTransport) return;
    dpp[idx].unit = newUnit;
    autoSaveProduct(p.productId, JSON.stringify(dpp));
    setSubProductWeights(prev => ({ ...prev, [`${p.productId}_${idx}`]: undefined }));
  };

  const handleDeleteSubcomponent = (productId, indexToDelete) => {
    const product = products.find(p => p.productId === productId);
    if (!product) return;
    let dpp = JSON.parse(product.dppData);
    const item = dpp[indexToDelete];
    let ingredientName = item?.ingredient || 'this component';

    setDeleteConfirm({
      isOpen: true,
      title: 'Delete LCA Component',
      message: `Are you sure you want to delete "${ingredientName}"?`,
      onConfirm: () => performActualDeleteSubcomponent(productId, indexToDelete)
    });
  };
  
  const performActualDeleteSubcomponent = (productId, indexToDelete) => {
    const product = products.find(p => p.productId === productId);
    if (!product) return;
    let dpp = JSON.parse(product.dppData);
    dpp.splice(indexToDelete, 1);
    
    const totalLca = dpp.reduce((sum, item) => sum + (item.lcaValue || 0), 0);
    autoSaveProduct(productId, JSON.stringify(dpp), totalLca);
  };

  const handleAddSubcomponent = (productId) => {
    const product = products.find(p => p.productId === productId);
    if (!product) return;
    let dpp = [];
    if (product.dppData) {
        try { dpp = JSON.parse(product.dppData); } catch (e) {}
    }
    dpp.push({ 
      ingredient: "", weightKg: 0, unit: 'kg', lcaValue: null,
      materialId: null, emissionFactor: null,
      isPackaging: false, isTransport: false
    });
    autoSaveProduct(productId, JSON.stringify(dpp));
  };
  
  // --- SINGLE ITEM: save weight to backend (LCA calculate not exposed by Java backend)
  const runLcaCalculation = async (productId, subcomponentIndex, weightToUse) => {
    const product = products.find(p => p.productId === productId);
    if (!product) return;
    let dpp;
    try { dpp = JSON.parse(product.dppData); } catch (e) { dpp = []; }
    if (!dpp[subcomponentIndex]) return;
    dpp[subcomponentIndex].weightKg = weightToUse;
    const newDppJson = JSON.stringify(dpp);
    setProducts(currentProducts =>
      currentProducts.map(prod =>
        prod.productId === productId ? { ...prod, dppData: newDppJson } : prod
      )
    );
    try {
      await autoSaveProduct(productId, newDppJson);
    } catch (err) {
      console.error("Error saving weight:", err);
    }
  };

  // Resolve backend document key from a raw product object (same logic as fetchProducts)
  const getBackendKey = (p) => {
    const k = (p.key && String(p.key).trim()) || (p._key && String(p._key).trim());
    if (k) return k;
    const id = p.id ?? p._id;
    if (id && String(id).includes('/')) return String(id).split('/').pop();
    return id ? String(id) : '';
  };

  // --- FULL LCA: backend by productId, or for template products match backend by name (template never stored in backend)
  const runFullLcaCalculation = async (productId) => {
    const product = products.find(p => p.productId === productId);
    console.log('[LCA] runFullLcaCalculation called', { productId, productName: product?.productName, found: !!product, _fromTemplate: product?._fromTemplate });
    if (!product) {
      console.warn('[LCA] Abort: product not found for id', productId);
      return;
    }
    // When quantity is empty (shown as "—"), do not run backend calculation; set scopes to 0.
    const q = product.productQuantity;
    const quantityEmpty = (q === null || q === undefined || (typeof q === 'string' && String(q).trim() === ''));
    if (quantityEmpty) {
      console.log('[LCA] Quantity empty – skipping backend calculation and setting scopes to 0');
      setProducts((currentProducts) =>
        currentProducts.map((prod) =>
          prod.productId === productId
            ? { ...prod, scope1: 0, scope2: 0, scope3: 0, lcaResult: 0 }
            : prod
        )
      );
      return;
    }
    let dpp;
    try { dpp = JSON.parse(product.dppData); } catch (e) {
      console.warn('[LCA] Abort: invalid dppData', productId);
      return;
    }
    if (!Array.isArray(dpp)) {
      console.warn('[LCA] Abort: dppData is not array', productId);
      return;
    }

    let backendKey = '';
    if (product._fromTemplate) {
      // Template-only: find a backend product with the same name and run LCA on it; do not store template in backend
      const name = (product.productName || product.name || '').trim();
      if (!name) {
        console.warn('[LCA] Template product has no name – cannot match by name');
        alert('Product has no name. Add a name to run LCA by matching a backend product.');
        return;
      }
      console.log('[LCA] Template product – looking up backend by name:', name);
      try {
        const nameRes = await productAPI.getAllProducts({ name });
        const list = Array.isArray(nameRes?.data) ? nameRes.data : [];
        const first = list.find((p) => (p.name || '').trim().toLowerCase() === name.toLowerCase()) || list[0];
        backendKey = first ? getBackendKey(first) : '';
        if (!backendKey) {
          console.warn('[LCA] No backend product found with name:', name);
          alert(`No backend product named "${name}" found. LCA runs on backend data only. Create the product in the backend (e.g. Upload BOM) or ensure a product with this name exists.`);
          return;
        }
        console.log('[LCA] Matched by name – backend key:', backendKey);
      } catch (e) {
        console.error('[LCA] Lookup by name failed:', e);
        alert('Could not look up product by name. Please try again.');
        return;
      }
    } else {
      if (!productId || String(productId).trim() === '') {
        console.warn('[LCA] Abort: productId is empty – backend may have sent key as "". Product:', product?.productName);
        alert('Cannot run LCA: product has no document key. Check that the backend returns a valid key or id for this product.');
        return;
      }
      backendKey = productId;
    }

    setCalculatingProductId(productId);
    try {
      if (!product._fromTemplate) await autoSaveProduct(productId, product.dppData);

      // Run LCA on backend product (by key); pass userId so backend can save to user_product_lca
      console.log('[LCA] Requesting GET /api/experiments/products/' + backendKey + '/lca', userId ? { userId } : '');
      const lcaRes = await productAPI.calculateProduct(backendKey, userId);
      console.log('[LCA] LCA response:', { status: lcaRes?.status, data: lcaRes?.data });

      // Backend persists only lcaValue; totals come from the LCA response (carbonFootprint).
      const carbonFootprint = lcaRes?.data;
      const productWithCf = carbonFootprint ? { DPP: { carbonFootprint }, emissionInformation: null } : null;
      const totals = productWithCf ? getScopeTotalsFromProduct(productWithCf) : { scope1: 0, scope2: 0, scope3: 0, total: 0 };
      console.log('[LCA] Totals from response:', totals);

      // Persist LCA in localStorage only (no backend). Survives refresh and navigation.
      // For template products, also save under the template's own productId so it survives reload
      // (template products are not in the backend product list, so backendKey won't match on reload).
      if (userId) {
        setLocalLca(userId, backendKey, totals.total);
        if (product._fromTemplate && productId !== backendKey) {
          setLocalLca(userId, productId, totals.total);
        }
        console.log('[LCA] Saved to localStorage:', { productKey: backendKey, templateId: product._fromTemplate ? productId : null, total: totals.total });
      }
      // Optional: persist to backend (comment out to use localStorage only)
      // try { await userLcaAPI.save(userId, backendKey, totals.total); } catch (e) {}
      // try { await productAPI.saveProductLca(backendKey, totals.total); } catch (e) {}

      // Refetch products so LCA (Total) comes from localStorage and persists across navigation
      try {
        await fetchProducts();
      } catch (_) {}
      console.log('[LCA] Refetching product GET /api/products/' + backendKey);
      const res = await productAPI.getProductById(backendKey);
      const updatedProduct = res?.data;
      console.log('[LCA] Refetch response:', { status: res?.status, hasProduct: !!updatedProduct, lcaValue: updatedProduct?.lcaValue ?? updatedProduct?.LCAvalue ?? updatedProduct?.LCAValue });
      if (updatedProduct || totals.total > 0) {
        // Use persisted lcaValue when present, else total from response (support both key casings)
        const refetchedLca = updatedProduct?.lcaValue ?? updatedProduct?.lcavalue ?? updatedProduct?.LCAvalue ?? updatedProduct?.LCAValue;
        const lcaResult = typeof refetchedLca === 'number' ? refetchedLca : totals.total;

        // Optional: keep local cache as fallback for template products or old sessions
        try {
          const cacheRaw = localStorage.getItem(LCA_CACHE_KEY) || '{}';
          const cache = JSON.parse(cacheRaw) || {};
          const entry = {
            scope1: totals.scope1 || 0,
            scope2: totals.scope2 || 0,
            scope3: totals.scope3 || 0,
            total: lcaResult,
            updatedAt: Date.now(),
          };
          const prodName = (product.productName || product.name || '').toString().trim();
          if (prodName) cache[prodName.toLowerCase()] = entry;
          localStorage.setItem(LCA_CACHE_KEY, JSON.stringify(cache));
        } catch (e) {
          console.warn('[LCA] Failed to update local LCA cache', e);
        }

        // Update the row so UI shows the new LCA (from response + persisted lcaValue)
        setProducts((currentProducts) =>
          currentProducts.map((prod) => {
            if (prod.productId === productId) {
              return {
                ...prod,
                DPP: updatedProduct?.DPP ?? updatedProduct?.dpp ?? prod.DPP,
                emissionInformation: updatedProduct?.emissionInformation ?? prod.emissionInformation,
                lcaResult,
                scope1: totals.scope1,
                scope2: totals.scope2,
                scope3: totals.scope3,
                functionalProperties: updatedProduct?.functionalProperties ?? prod.functionalProperties,
              };
            }
            return prod;
          })
        );
      } else {
        console.warn('[LCA] No product or totals – cannot update UI');
      }
    } catch (err) {
      console.error('[LCA] Error:', err?.response?.status, err?.response?.data ?? err?.message, err);
      const msg = err?.response?.data?.message || err?.response?.data || err?.message || "LCA calculation failed.";
      alert(typeof msg === "string" ? msg : "Failed to calculate LCA. Ensure the product is in the supply chain graph and upstream nodes have DPP data.");
    } finally {
      setCalculatingProductId((prev) => (prev === productId ? null : prev));
    }
  };

  const closeDeleteModal = () => {
    setDeleteConfirm({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };
  
  /** Format a scope value for display (round to 3 decimals, handle map). */
  const fmtScopeVal = (scope) => {
    if (scope == null) return '—';
    if (typeof scope === 'number' && !Number.isNaN(scope)) return `${Number(scope).toFixed(3)} kgCO₂e`;
    if (typeof scope === 'object') {
      const kg = scope.kgCO2e ?? scope.kgCO2e;
      if (kg != null) return `${Number(kg).toFixed(3)} kgCO₂e`;
      return Object.entries(scope).map(([k, v]) => `${k}: ${v}`).join(', ') || '—';
    }
    return String(scope);
  };
  /** Compact number only for inline scope line (e.g. "11.56"). */
  const fmtScopeNum = (scope) => {
    if (scope == null) return '—';
    if (typeof scope === 'number' && !Number.isNaN(scope)) return Number(scope).toFixed(2);
    if (typeof scope === 'object' && scope.kgCO2e != null) return Number(scope.kgCO2e).toFixed(2);
    return '—';
  };

  /** Render DPP and all backend product info in a structured layout. */
  const renderDppContent = (product) => {
    if (!product) return <p className="small-regular">No product selected.</p>;

    const productName = product.productName ?? product.name ?? '—';
    const dpp = product.DPP ?? product.dpp ?? null;

    const kv = (label, value) => {
      if (value == null || value === '') return null;
      return <div className="dpp-kv" key={label}><span className="dpp-kv__key">{label}</span><span>{String(value)}</span></div>;
    };

    return (
      <div className="dpp-modal-structured">
        <section className="dpp-section">
          <h3 className="dpp-section-title">Product</h3>
          {kv('name', productName)}
          {kv('type', product.type)}
          {kv('id', product.id)}
          {kv('key', product.key)}
          {kv('productOrigin', product.productOrigin)}
          {product.quantityValue != null && kv('quantityValue', product.quantityValue)}
          {kv('quantifiableUnit', product.quantifiableUnit)}
          {kv('userId', product.userId)}
          {kv('uploadedFile', product.uploadedFile)}
        </section>

        {(!dpp || typeof dpp !== 'object') ? (
          <section className="dpp-section">
            <h3 className="dpp-section-title">Digital Product Passport</h3>
            <p className="small-regular" style={{ color: 'rgba(var(--greys), 0.9)' }}>Run Calculation to Generate DPP.</p>
          </section>
        ) : (
          <>
            <section className="dpp-section">
              <h3 className="dpp-section-title">Digital Product Passport</h3>
              {kv('name', dpp.name)}
              {kv('manufacturer', dpp.manufacturer)}
              {kv('serialNumber', dpp.serialNumber)}
              {kv('batchNumber', dpp.batchNumber)}
              {kv('id', dpp.id)}
              {kv('key', dpp.key)}
            </section>

            <section className="dpp-section">
              <h3 className="dpp-section-title">Carbon footprint</h3>
              {(dpp.carbonFootprint ?? dpp.CarbonFootprint) && typeof (dpp.carbonFootprint ?? dpp.CarbonFootprint) === 'object' ? (
                <div className="dpp-carbon dpp-carbon--compact">
                  {(() => {
                    const cf = dpp.carbonFootprint ?? dpp.CarbonFootprint;
                    const n1 = fmtScopeNum(cf.scope1 ?? cf.Scope1); const n2 = fmtScopeNum(cf.scope2 ?? cf.Scope2); const n3 = fmtScopeNum(cf.scope3 ?? cf.Scope3);
                    return <span className="dpp-scopes-inline">S1: {n1} · S2: {n2} · S3: {n3} kgCO₂e</span>;
                  })()}
                </div>
              ) : (
                <p className="small-regular" style={{ color: 'rgba(var(--greys), 0.8)' }}>Not set</p>
              )}
            </section>

            {product.emissionInformation && typeof product.emissionInformation === 'object' && Object.keys(product.emissionInformation).length > 0 && (
              <section className="dpp-section">
                <h3 className="dpp-section-title">Emission information</h3>
                <pre className="dpp-json">{JSON.stringify(product.emissionInformation, null, 2)}</pre>
              </section>
            )}

            {product.functionalProperties && typeof product.functionalProperties === 'object' && Object.keys(product.functionalProperties).length > 0 && (
              <section className="dpp-section">
                <h3 className="dpp-section-title">Functional properties</h3>
                <pre className="dpp-json">{JSON.stringify(product.functionalProperties, null, 2).slice(0, 800)}{JSON.stringify(product.functionalProperties).length > 800 ? '…' : ''}</pre>
              </section>
            )}
          </>
        )}
      </div>
    );
  };

  const formatTotalLca = (value) => {
    if (value === null || value === undefined) return '0.000 kgCO₂e';
    return `${value.toFixed(3)} kgCO₂e`;
  };

  const filteredProducts = products
    .filter((product) =>
      product.productName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) =>
      (a.productName || '').localeCompare(b.productName || '', undefined, { sensitivity: 'base' })
    );

  return (
    <div className="container">
      <InstructionalCarousel
        pageId="inventory"
        slides={INVENTORY_CAROUSEL_SLIDES}
        newUserOnly
      />
      <Navbar />
      <div className="content-section-main">
        <div className="content-container-main"> 
          <div className="header-group">
            <h1>Inventory</h1>
            <p className = "medium-regular">Overview of your products.</p>
          </div>
          <div className = "sub-header">
            <p style = {{color: "rgba(var(--greys), 1)"}}>Showing {filteredProducts.length} of {products.length} products</p>
              <div className = "two-row-component-container">
              <div className = "input-base search-bar"><Search />
                <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <button type="button" className="default" style={{ whiteSpace: 'nowrap', width: 'auto', paddingLeft: '1rem', paddingRight: '1rem' }} onClick={() => navigate('/add-products')}>
                Browse Templates
              </button>
              <button type="button" className="outline" style={{ whiteSpace: 'nowrap', width: 'auto', paddingLeft: '1rem', paddingRight: '1rem' }} onClick={() => setShowAddProduct(true)}>
                Upload BOM
              </button>
            </div>
          </div>
          <div className="inventory-table-container">
            <table className="inventory-table">
              <thead className = "normal-bold">
                <tr>
                  <th></th>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>DPP</th>
                  <th>LCA (Scope 3)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="no-products-message">Loading products...</td>
                  </tr>
                )}
                
                {!loading && error && (
                  <tr>
                    <td colSpan={6} className="no-products-message" style={{ color: 'rgba(var(--danger), 1)' }}>
                      {error}
                    </td>
                  </tr>
                )}
                
                {!loading && !error && products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="no-products-message">
                      Add a new product. Click Upload BOM or Create Your Own.
                    </td>
                  </tr>
                )}
                
                {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="no-products-message">
                      No products match your search query.
                    </td>
                  </tr>
                )}

                {!loading && !error && filteredProducts.map(p => {
                  const dpp = p.dppData &&
                    (typeof p.dppData === 'string' ? JSON.parse(p.dppData) : p.dppData);

                  return (
                    <React.Fragment key={p.productId}>
                      <tr>
                        <td>
                          <button
                            className="icon icon-small"
                            disabled={calculatingProductId === p.productId}
                            title={expandedRows[p.productId] ? 'Collapse' : 'Expand'}
                            onClick={() => {
                              const isOpening = !expandedRows[p.productId];
                              setExpandedRows((prev) => ({ ...prev, [p.productId]: !prev[p.productId] }));
                              // Only run LCA if opening and no value has been calculated yet
                              if (isOpening && !(p.lcaResult > 0)) runFullLcaCalculation(p.productId);
                            }}
                          >
                            <Triangle style={{ transform: expandedRows[p.productId] ? 'rotate(180deg)' : 'rotate(90deg)' }} />
                          </button>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input-base"
                            style={{ width: '100%', minWidth: 0 }}
                            value={productNameEdits[p.productId] ?? p.productName ?? ''}
                            onChange={(e) => setProductNameEdits((prev) => ({ ...prev, [p.productId]: e.target.value }))}
                            onBlur={(e) => handleProductNameBlur(p.productId, e.target.value)}
                          />
                        </td>
                        <td>{p.productQuantity != null ? (p.productQuantifiableUnit ? `${p.productQuantity} ${p.productQuantifiableUnit}` : p.productQuantity) : '—'}</td>
                        <td>
                          <a href="#" className="link normal-bold" onClick={(e) => { e.preventDefault(); setShowDppModal(true); setCurrentDppProduct(p); }}>
                            View DPP
                          </a>
                        </td>
                        <td>
                          {calculatingProductId === p.productId ? (
                            <span className="lca-calculating" style={{ color: 'rgba(var(--greys), 0.9)', fontStyle: 'italic' }}>Calculating LCA…</span>
                          ) : (
                            <strong>{formatTotalLca(p.scope3 ?? 0)}</strong>
                          )}
                        </td>
                        <td>
                          <div className='two-row-component-container'>
                            <button className="icon" title="Add component" onClick={() => { console.log('[Inventory] Add component clicked (this does not run LCA)', p.productId); handleAddSubcomponent(p.productId); }}><CirclePlus /></button>
                            <button className="icon" style = {{backgroundColor: "rgba(var(--danger), 1)"}} title = "Delete product" onClick={() => handleDelete(p.productId)}>
                              <Trash2 />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedRows[p.productId] && dpp && Array.isArray(dpp) && (
                        <tr className="sub-table-row">
                          <td colSpan={6}>
                            <div className="sub-table-container">
                              <table className="sub-inventory-table">
                                <thead className = " normal-bold">
                                  <tr>
                                    <th>No.</th>
                                    <th>Product Breakdown</th>
                                    <th>Amount</th>
                                    <th>Unit</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dpp.map((item, idx) => {
                                    const key = `${p.productId}_${idx}`;
                                    const isPackaging = item.isPackaging || false;
                                    const isTransport = item.isTransport || false;
                                    const isLocked = isPackaging || isTransport;
                                    const isProcess = !isTransport && isProcessItem(item);
                                    const unitOptions = isTransport ? [{ unit: 'km', label: 'km' }] : (isProcess ? TIME_UNITS : WEIGHT_UNITS);
                                    const defaultUnit = isTransport ? 'km' : (isProcess ? 's' : 'kg');
                                    const rawUnit = (item.unit == null || item.unit === '' || item.unit === '-') ? defaultUnit : String(item.unit).trim().toLowerCase();
                                    const effectiveUnit = unitOptions.some((o) => o.unit === rawUnit) ? rawUnit : defaultUnit;
                                    const displayAmount = subProductWeights[key] !== undefined && subProductWeights[key] !== ''
                                      ? subProductWeights[key]
                                      : toDisplayAmount(item.weightKg, effectiveUnit, isProcess);

                                    return (
                                      <tr key={idx} className={isLocked ? 'packaging-row' : ''}>
                                        <td>{idx + 1}</td>
                                        <td>
                                          <input
                                            type="text"
                                            className="input-base"
                                            value={editableIngredients[key] ?? (isProcess ? processDisplayLabel(item.ingredient || '') : `Element: ${item.ingredient || ''}`)}
                                            onChange={(e) => handleComponentChange(e, p, idx)}
                                            onBlur={() => {
                                              const typedValue = editableIngredients[key];
                                              setEditableIngredients(prev => ({ ...prev, [key]: undefined }));
                                              if (typedValue === undefined) return;
                                              const toStore = isProcess ? typedValue : typedValue.replace(/^Element:\s*/, '').trim();
                                              const currentVal = isProcess ? item.ingredient : (item.ingredient || '');
                                              if (toStore === currentVal) return;
                                              const latest = productsRef.current.find((pr) => pr.productId === p.productId);
                                              if (!latest) return;
                                              let dppData;
                                              try { dppData = JSON.parse(latest.dppData); } catch { return; }
                                              if (!dppData[idx]) return;
                                              dppData[idx].ingredient = toStore;
                                              dppData[idx].materialId = null;
                                              dppData[idx].lcaValue = null;
                                              dppData[idx].emissionFactor = null;
                                              autoSaveProduct(p.productId, JSON.stringify(dppData));
                                              runFullLcaCalculation(p.productId);
                                            }}
                                            placeholder={isProcess ? 'Process: name' : 'Element: name'}
                                            disabled={isLocked && !isTransport}
                                          />
                                        </td>
                                        <td>
                                          <input
                                            type="number"
                                            className="input-base"
                                            step={isTransport ? 1 : (isProcess ? 1 : 0.000001)}
                                            value={displayAmount}
                                            min={0}
                                            onChange={(e) => setSubProductWeights(prev => ({ ...prev, [key]: e.target.value }))}
                                            onBlur={(e) => handleWeightBlur(e, p, idx)}
                                            placeholder={isTransport ? 'Distance' : (isProcess ? 'Duration' : 'Weight')}
                                          />
                                        </td>
                                        <td>
                                          <select
                                            className="input-base"
                                            value={effectiveUnit}
                                            onChange={(e) => handleUnitChange(p, idx, e.target.value)}
                                            disabled={isLocked}
                                            style={{ width: '100%', textAlign: 'left'}}
                                          >
                                            {unitOptions.map((u) => (
                                              <option key={u.unit} value={u.unit}>{u.label}</option>
                                            ))}
                                          </select>
                                        </td>
                                        <td style={{ display: 'flex', alignItems: 'center' }}>
                                          <button 
                                            className="icon" 
                                            style = {{backgroundColor: "rgba(var(--danger), 1)"}} 
                                            title={isLocked ? "Spec sheet components cannot be deleted" : "Delete component"} 
                                            onClick={() => handleDeleteSubcomponent(p.productId, idx)}
                                            disabled={isLocked}
                                          >
                                            <Trash2 size = {24} />
                                          </button>
                                        </td>
                                      </tr>
                                    )})}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* ... Modals ... */}
      {showAddProduct && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <p className = "medium-bold">Upload BOM</p>
              <button className="close-modal-btn" onClick={() => setShowAddProduct(false)}><X /></button>
            </div>
            <form id="addProductForm" onSubmit={handleAddProduct}>
              <div className = "add-product-form">
                <div className="input-group-col">
                  <label className="normal-bold">
                    Upload File <span className='submit-error'>*</span> (CSV or JSON)
                  </label>
                  {productFile && (
                      <div className = "modal-header">
                        <p className='small-regular' style = {{color: `rgba(var(--blacks), 0.8)`}}>File Uploaded: <strong>{productFile.name}</strong></p>
                        <button type="button" className="remove-file-btn" onClick={() => handleFileSelect(null)}>
                          <X size = {14}/>
                        </button>
                      </div>
                  )}
                  <label htmlFor="fileUpload" className={`file-drop-zone ${isDragging ? 'dragging' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                    <FilePlus />
                    <p className="small-regular" style={{ color: 'rgba(var(--blacks), 0.8)' }}>Drag and drop your CSV or JSON here</p>
                    <span className="outline-browse">
                      Or Browse Files
                    </span>
                    <input 
                      type="file" 
                      id="fileUpload"
                      ref={fileInputRef}
                      className="file-input-hidden" 
                      accept=".csv,.json" 
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                    />
                  </label>
                </div>
                <button type="submit" className="default" disabled={uploading || !productFile}>
                  {uploading ? "Uploading..." : "Upload BOM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
 
      <DppModal isOpen={showDppModal} onClose={() => setShowDppModal(false)} title="Digital Product Passport (DPP)">
        {renderDppContent(currentDppProduct)}
      </DppModal>
 
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        confirmLabel="Delete"
        onClose={closeDeleteModal}
        onConfirm={() => {
          deleteConfirm.onConfirm();
          closeDeleteModal();
        }}
      >
        {deleteConfirm.message}
      </ConfirmationModal>
    </div>
  );
};

export default InventoryPage;