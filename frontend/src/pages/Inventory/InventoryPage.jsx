import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './InventoryPage.css';
import { productAPI, maritimeAPI, normalizeUserIdKey } from '../../services/api';
import { estimateProductLcaFromWeb } from '../../services/openRouter';
import {
  getStoredCustomTemplates as getStoredTemplates,
  setStoredCustomTemplates as setStoredTemplates,
} from '../../utils/customTemplatesStorage';
import { getScopeTotalsFromProduct } from '../../utils/emission';
import Navbar from '../../components/Navbar/Navbar';
import { Search, X, Triangle, CirclePlus, Trash2, FilePlus, Package, ListOrdered, FileUp } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';
import DppModal from '../../components/DppModal/DppModal';
import InstructionalCarousel from '../../components/InstructionalCarousel/InstructionalCarousel';

const splitCsvLine = (line) => {
  // Split CSV while preserving commas inside quoted values.
  return String(line)
    .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    .map((v) => v.trim().replace(/^"|"$/g, ''));
};

// --- CSV parser ---
// Standard mode: requires name + type.
// Maritime mode: accepts name/type OR MMSI-based logs and auto-generates vessel names.
const parseCsvFile = (file, maritimeMode = false) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided."));
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let text = e.target.result;
        if (text.charCodeAt(0) === 0xFEFF) text = text.substring(1);
        const lines = text.split(/[\r\n]+/).filter(line => line.trim() !== '');
        if (lines.length < 2) return reject(new Error("CSV must have a header and at least one data row."));
        const headers = splitCsvLine(lines[0]);
        const lower = headers.map(h => h.toLowerCase());
        const nameIdx = lower.findIndex(h => h === 'product name' || h === 'name' || h === 'vessel name' || h === 'vessel');
        const typeIdx = lower.findIndex(h => h === 'type');
        const mmsiIdx = lower.findIndex(h => h === 'mmsi');
        const data = [];
        const seen = new Set();
        for (let i = 1; i < lines.length; i++) {
          const values = splitCsvLine(lines[i]);
          const explicitName = nameIdx >= 0 ? (values[nameIdx] || '').trim() : '';
          const typeRaw = typeIdx >= 0 ? (values[typeIdx] || '').trim() : '';
          const mmsi = mmsiIdx >= 0 ? (values[mmsiIdx] || '').trim() : '';

          if (explicitName) {
            data.push({ name: explicitName, type: typeRaw || (maritimeMode ? 'vessel' : 'product'), mmsi: mmsi || null });
            continue;
          }

          if (maritimeMode && mmsi) {
            if (seen.has(mmsi)) continue;
            seen.add(mmsi);
            data.push({ name: `Vessel ${mmsi}`, type: typeRaw || 'vessel', mmsi });
          }
        }

        if (data.length === 0) {
          if (maritimeMode) {
            return reject(new Error('For maritime upload, include either "name"/"vessel name" or "MMSI" column with data.'));
          }
          return reject(new Error('CSV must have columns "Product Name" (or "name") and "Type".'));
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
  const qty = quantityNum != null && Number.isFinite(Number(quantityNum)) && Number(quantityNum) > 0 ? Number(quantityNum) : 1;
  const savedQty = getLcaQtySnapshot(templateProductId);
  const quantityMatchesCalculated = savedQty != null ? Math.abs(savedQty - qty) < 1e-9 : true;
  // Read scope breakdown from name cache if available
  const nameKey = (template.name || '').toLowerCase().trim();
  const cached = nameKey ? lcaCacheByName[nameKey] : null;
  const hasCalculatedLca = (rawLca != null && !Number.isNaN(Number(rawLca))) && quantityMatchesCalculated;
  return {
    productId: templateProductId,
    productName: template.name || 'Unnamed template',
    productQuantity: Number.isNaN(quantityNum) ? null : quantityNum,
    productQuantifiableUnit: null,
    dppData: JSON.stringify(dpp),
    lcaResult: quantityMatchesCalculated ? lcaResult : 0,
    hasCalculatedLca: !!hasCalculatedLca,
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

function hydrateDppWeights(dppRaw, productByName) {
  let dpp;
  try {
    dpp = typeof dppRaw === 'string' ? JSON.parse(dppRaw) : dppRaw;
  } catch {
    return '[]';
  }
  if (!Array.isArray(dpp)) return '[]';

  const next = dpp.map((item) => {
    const out = { ...item };
    const isProcess = isProcessItem(out);
    const isTransport = out.isTransport || false;
    if (isProcess || isTransport) return out;

    const current = Number(out.weightKg);
    const hasWeight = Number.isFinite(current) && current > 0;
    if (hasWeight) return out;

    const ingredientName = String(out.ingredient || '').replace(/^Element:\s*/i, '').trim().toLowerCase();
    const source = ingredientName ? productByName.get(ingredientName) : null;
    if (!source || source.quantityValue == null || Number.isNaN(Number(source.quantityValue))) return out;

    const preferredUnit = (out.unit && out.unit !== '-') ? out.unit : (source.quantifiableUnit || 'kg');
    out.weightKg = toCanonicalAmount(source.quantityValue, preferredUnit, false);
    if (!out.unit || out.unit === '-') out.unit = preferredUnit;
    return out;
  });

  return JSON.stringify(next);
}

function parseDppArray(dppRaw) {
  try {
    const parsed = typeof dppRaw === 'string' ? JSON.parse(dppRaw) : dppRaw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function hasPositiveBreakdownWeight(dppRaw) {
  const dpp = parseDppArray(dppRaw);
  if (dpp.length === 0) return false;
  return dpp.some((item) => {
    const w = Number(item?.weightKg);
    return Number.isFinite(w) && w > 0;
  });
}

function toFiniteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function extractMmsiFromProduct(product = {}) {
  const direct = String(product?.mmsi || product?.MMSI || product?.functionalProperties?.mmsi || '').trim();
  if (direct) return direct;
  const fromName = String(product?.productName || product?.name || '').match(/\b\d{7,12}\b/);
  return fromName ? fromName[0] : '';
}

/** Parse GET /api/maritime/lca response → scope1 kgCO2e (rough voyage model). */
function scope1FromMaritimeLcaResponse(lcaRes) {
  const rawScope1 = lcaRes?.data?.scope1;
  return toFiniteNumber(
    typeof rawScope1 === 'number' ? rawScope1 : rawScope1?.kgCO2e,
    0
  );
}

function quantityFactor(quantityValue) {
  const q = Number(quantityValue);
  if (!Number.isFinite(q)) return 1;
  return q >= 0 ? q : 1;
}

// --- JSON parser: array of { name, type } or single object ---
const parseJsonFile = (file, maritimeMode = false) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided."));
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const arr = Array.isArray(json) ? json : [json];
        const data = arr
          .map((item) => ({
            name: (item.name ?? item.productName ?? item.vesselName ?? item.vessel ?? item.mmsi ?? '').toString().trim(),
            type: (item.type ?? (maritimeMode ? 'vessel' : 'product')).toString().trim(),
            mmsi: (item.mmsi ?? item.MMSI ?? '').toString().trim() || null,
          }))
          .filter((item) => item.name);
        if (data.length === 0) return reject(new Error("JSON must contain at least one object with \"name\" (or vesselName/mmsi) and optionally \"type\"."));
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
const DPP_CACHE_BY_PRODUCT_KEY = 'carbonx_dpp_cache_by_product_v1';

// LCA stored by userId + productKey (localStorage only, no backend). Survives refresh/navigation.
// Shape: { [normalizedUserId]: { [productKey]: lcaValue } }
const LCA_LOCAL_BY_USER_PRODUCT_KEY = 'carbonx_lca_by_user_product_v1';
const LCA_QTY_SNAPSHOT_KEY = 'carbonx_lca_qty_snapshot_v1';

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

function getLcaQtySnapshotMap() {
  try {
    const raw = localStorage.getItem(LCA_QTY_SNAPSHOT_KEY) || '{}';
    const parsed = JSON.parse(raw) || {};
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch {
    return {};
  }
}

function getLcaQtySnapshot(productKey) {
  const map = getLcaQtySnapshotMap();
  const v = map[String(productKey)];
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function setLcaQtySnapshot(productKey, quantityValue) {
  if (!productKey) return;
  const q = Number(quantityValue);
  const normalizedQty = Number.isFinite(q) && q > 0 ? q : 1;
  try {
    const map = getLcaQtySnapshotMap();
    map[String(productKey)] = normalizedQty;
    localStorage.setItem(LCA_QTY_SNAPSHOT_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('[LCA] setLcaQtySnapshot failed', e);
  }
}

function getLocalDppCache() {
  try {
    const raw = localStorage.getItem(DPP_CACHE_BY_PRODUCT_KEY) || '{}';
    const parsed = JSON.parse(raw) || {};
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch {
    return {};
  }
}

function dppCacheNameKey(productName) {
  const name = String(productName || '').trim().toLowerCase();
  return name ? `name:${name}` : '';
}

function setLocalDppCache(productKey, dppValue, productName = '') {
  if (!dppValue) return;
  try {
    const cache = getLocalDppCache();
    if (productKey) cache[String(productKey)] = dppValue;
    const nameKey = dppCacheNameKey(productName);
    if (nameKey) cache[nameKey] = dppValue;
    localStorage.setItem(DPP_CACHE_BY_PRODUCT_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('[DPP] setLocalDppCache failed', e);
  }
}

const InventoryPage = () => {
  const location = useLocation();
  const [userId] = useState(localStorage.getItem('userId') || '');
  const navigate = useNavigate();
  const isMaritimeMode = useCallback(() => {
    try {
      const allCompanyData = JSON.parse(localStorage.getItem('companyData') || '{}');
      const storageKey = userId.includes('/') ? userId.split('/').pop() : userId;
      const company = allCompanyData[userId] ?? allCompanyData[storageKey] ?? null;
      const sector = String(company?.sector || '').toLowerCase().trim();
      const industry = String(company?.industry || '').toLowerCase().trim();
      return (
        sector.includes('maritime') ||
        industry.includes('maritime') ||
        sector.includes('marine transport') ||
        industry.includes('marine transport')
      );
    } catch {
      return false;
    }
  }, [userId]);
  const maritimeMode = isMaritimeMode();
  const labels = maritimeMode
    ? {
        pageTitle: 'Voyage Emissions',
        subtitle: 'Overview of your vessels and voyage emissions.',
        entityPlural: 'vessels',
        entitySingular: 'vessel',
        nameHeader: 'Vessel Name / MMSI',
        quantityHeader: 'Data Source',
        lcaHeader: 'Voyage LCA',
      }
    : {
        pageTitle: 'Inventory',
        subtitle: 'Overview of your products.',
        entityPlural: 'products',
        entitySingular: 'product',
        nameHeader: 'Product Name',
        quantityHeader: 'Quantity',
        lcaHeader: 'LCA (Scope 3)',
      };

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
  const [productQuantityEdits, setProductQuantityEdits] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {},
  });
  const [lcaDirtyMap, setLcaDirtyMap] = useState({});

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
      if (maritimeMode) {
        const logsRes = await maritimeAPI.getShipLogs();
        const rawLogs = Array.isArray(logsRes?.data) ? logsRes.data : [];
        const byMmsi = new Map();

        rawLogs.forEach((log, idx) => {
          const mmsi = String(log?.mmsi || log?.MMSI || '').trim();
          if (!mmsi) return;
          const ts = String(log?.timestamp || '').trim();
          const existing = byMmsi.get(mmsi);
          if (!existing) {
            byMmsi.set(mmsi, {
              productId: `mmsi-${mmsi}`,
              productName: `Vessel ${mmsi}`,
              productQuantity: null,
              productQuantifiableUnit: null,
              dppData: '[]',
              lcaResult: 0,
              scope1: 0,
              scope2: 0,
              scope3: 0,
              userId: '',
              type: 'vessel',
              hasCalculatedLca: false,
              functionalProperties: { mmsi },
              mmsi,
              _logCount: 1,
              _firstTimestamp: ts,
              _lastTimestamp: ts,
              _seq: idx,
            });
            return;
          }
          existing._logCount += 1;
          if (ts && (!existing._firstTimestamp || ts < existing._firstTimestamp)) existing._firstTimestamp = ts;
          if (ts && (!existing._lastTimestamp || ts > existing._lastTimestamp)) existing._lastTimestamp = ts;
        });

        const mapped = Array.from(byMmsi.values())
          .sort((a, b) => a.productName.localeCompare(b.productName, undefined, { sensitivity: 'base' }));
        const withPending = mapped.map((p) => ({ ...p, _maritimeLcaPending: true }));
        setProducts(withPending);

        const lcaResults = await Promise.all(
          mapped.map(async (v) => {
            const mmsi = extractMmsiFromProduct(v);
            if (!mmsi) {
              return { productId: v.productId, scope1: 0 };
            }
            try {
              const lcaRes = await maritimeAPI.getLca(mmsi);
              return { productId: v.productId, scope1: scope1FromMaritimeLcaResponse(lcaRes) };
            } catch (err) {
              console.warn('[Maritime LCA] Auto-fetch failed for MMSI', mmsi, err?.message);
              return { productId: v.productId, scope1: 0 };
            }
          })
        );

        setProducts((prev) =>
          prev.map((prod) => {
            const r = lcaResults.find((x) => x.productId === prod.productId);
            if (!r) return { ...prod, _maritimeLcaPending: false };
            const scope1 = r.scope1;
            return {
              ...prod,
              _maritimeLcaPending: false,
              hasCalculatedLca: true,
              scope1,
              scope2: 0,
              scope3: scope1,
              lcaResult: scope1,
              DPP: {
                ...(prod.DPP || {}),
                name: prod.productName || '',
                carbonFootprint: { scope1, scope2: 0, scope3: scope1 },
              },
            };
          })
        );
        return;
      }

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
      // Strict per-user isolation on the client as an additional safety net.
      // Only show products that explicitly belong to the active user.
      const filtered = normalizedUserId
        ? normalized.filter((p) => p.userId && normalizeUserIdKey(p.userId) === normalizedUserId)
        : normalized;
      const productByName = new Map(
        filtered
          .filter((p) => p?.name)
          .map((p) => [String(p.name).trim().toLowerCase(), { quantityValue: p.quantityValue ?? p.quantity, quantifiableUnit: p.quantifiableUnit ?? 'kg' }])
      );
      // LCA: localStorage first (no backend required), then optional backend user LCA
      const validUserId = userId && String(userId).trim() !== '' && String(userId) !== 'undefined';
      const localLcaMap = getLocalLcaMap(userId);
      // Backend /users/:id/lca endpoint is not reliable in current backend routing.
      // Keep LCA persistence fully client-side via localStorage map.
      const userLcaMap = {};
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
        const currentQty = (() => {
          const q = Number(p.quantityValue ?? p.quantity);
          return Number.isFinite(q) && q > 0 ? q : 1;
        })();
        const savedQty = getLcaQtySnapshot(apiKey);
        const quantityMatchesCalculated = savedQty != null ? Math.abs(savedQty - currentQty) < 1e-9 : true;
        const hasBackendCalculatedLca = localLca != null || userLca != null || persistedLca != null;
        const base = {
          productId: apiKey,
          productName: p.name ?? '',
          productQuantity: p.quantityValue ?? p.quantity ?? null,
          productQuantifiableUnit: p.quantifiableUnit ?? null,
          dppData: (p.functionalProperties && p.functionalProperties.dppData) || (typeof p.dppData === 'string' ? p.dppData : '[]'),
          lcaResult: quantityMatchesCalculated ? (localLca ?? userLca ?? persistedLca ?? totals.total) : 0,
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
          hasCalculatedLca: hasBackendCalculatedLca && quantityMatchesCalculated,
        };

        if (!base.DPP) {
          const dppCache = getLocalDppCache();
          const cachedDpp = dppCache[String(apiKey)] ?? dppCache[dppCacheNameKey(base.productName)];
          if (cachedDpp) base.DPP = cachedDpp;
        }

        base.dppData = hydrateDppWeights(base.dppData, productByName);
        if (!hasPositiveBreakdownWeight(base.dppData)) {
          base.scope1 = 0;
          base.scope2 = 0;
          base.scope3 = 0;
          base.lcaResult = 0;
          base.hasCalculatedLca = false;
        }
        if (!quantityMatchesCalculated) {
          base.scope1 = 0;
          base.scope2 = 0;
          base.scope3 = 0;
          base.lcaResult = 0;
          base.hasCalculatedLca = false;
        }

        // Overlay scope cache by product name so Scope 1/2/3 stays in sync after reload.
        // lcaResult source remains unchanged (local/user/persisted precedence above).
        const nameNorm = (s) => String(s || '').toLowerCase().trim();
        const cacheEntry = base.productName ? lcaCacheByName[nameNorm(base.productName)] : null;
        if (cacheEntry && typeof cacheEntry === 'object') {
          if (typeof cacheEntry.scope1 === 'number') base.scope1 = cacheEntry.scope1;
          if (typeof cacheEntry.scope2 === 'number') base.scope2 = cacheEntry.scope2;
          if (typeof cacheEntry.scope3 === 'number') base.scope3 = cacheEntry.scope3;
          if (localLca == null && userLca == null && persistedLca == null && typeof cacheEntry.total === 'number') {
            base.lcaResult = cacheEntry.total;
          }
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
      setProducts(templateProducts);
      const status = err.response?.status;
      const unreachable =
        !err.response ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        (status === 500 && (!err.response?.data || Object.keys(err.response.data || {}).length === 0));
      if (unreachable) {
        setError(
          'Cannot reach the CarbonX API. Start ArangoDB (localhost:8529), then run the backend on port 8080 (e.g. cd backend && mvn spring-boot:run). With npm run dev, /api is proxied to http://localhost:8080 unless VITE_API_PROXY_TARGET overrides it.'
        );
      } else {
        const detail =
          (typeof err.response?.data === 'string' && err.response.data) ||
          err.response?.data?.message ||
          err.message ||
          'Request failed';
        setError(`Could not load products (${status ?? 'network'}). ${detail}`);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, maritimeMode]);

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
    if (maritimeMode) return;
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
          const nextQuantity = Number.isNaN(quantityNum) ? p.productQuantity : quantityNum;
          const quantityChanged = nextQuantity !== p.productQuantity;
          return {
            ...p,
            productName: t.name || p.productName,
            productQuantity: nextQuantity,
            dppData: JSON.stringify(templateToDppData(t)),
            ...(quantityChanged ? { hasCalculatedLca: false, scope1: 0, scope2: 0, scope3: 0, lcaResult: 0 } : {}),
          };
        })
        .filter(Boolean);
    });
  }, [maritimeMode]);

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
          setStoredTemplates(next);
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
            setStoredTemplates(next);
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

  // --- Upload details: .csv or .json ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!userId) return alert("Error: No user is logged in.");
    if (!productFile) return alert("Please select a file first.");

    setUploading(true);
    let items = [];

    try {
      const name = productFile.name.toLowerCase();
      if (name.endsWith('.json')) {
        items = await parseJsonFile(productFile, maritimeMode);
      } else if (name.endsWith('.csv')) {
        items = await parseCsvFile(productFile, maritimeMode);
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
      const productsToCreate = items.map(({ name, type, mmsi }) => ({
        name,
        type: type || 'product',
        productOrigin: null,
        functionalProperties: maritimeMode && mmsi ? { mmsi } : null,
        userId,
        uploadedFile: productFile.name,
        DPP: null,
      }));
      await productAPI.createProducts(productsToCreate);
      // Non-maritime mode keeps existing template-card behavior.
      if (!maritimeMode) {
        const existing = getStoredTemplates();
        const newTemplates = items.map(({ name }, i) => ({
          id: `bom-${Date.now()}-${i}`,
          name: name || 'Unnamed',
          ingredients: [],
          processes: [],
        }));
        try {
          setStoredTemplates([...existing, ...newTemplates]);
        } catch (e) {
          console.warn('Could not save BOM templates to localStorage', e);
        }
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
        setStoredTemplates(templates);
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
          setStoredTemplates(next);
        } catch (e) {
          console.warn('Could not update template name in localStorage', e);
        }
      }
    }
  };

  const handleProductQuantityBlur = async (productId, currentDisplayQuantity) => {
    const product = products.find((p) => p.productId === productId);
    if (!product) return;

    const parsedQty = Number(currentDisplayQuantity);
    const newQty = Number.isFinite(parsedQty) && parsedQty >= 0 ? parsedQty : null;
    const prevQty = product.productQuantity != null ? Number(product.productQuantity) : null;

    setProductQuantityEdits((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });

    const changed =
      (prevQty == null && newQty != null) ||
      (prevQty != null && newQty == null) ||
      (prevQty != null && newQty != null && Math.abs(prevQty - newQty) > 1e-9);
    if (!changed) return;

    setProducts((prev) =>
      prev.map((p) =>
        p.productId === productId
          ? { ...p, productQuantity: newQty, hasCalculatedLca: false, scope1: 0, scope2: 0, scope3: 0, lcaResult: 0 }
          : p
      )
    );
    setLcaDirtyMap((prev) => ({ ...prev, [productId]: true }));

    // Persist quantity first, then run backend LCA automatically.
    if (product._fromTemplate && product._templateId) {
      const templates = getStoredTemplates();
      const idx = templates.findIndex((t) => t.id === product._templateId);
      if (idx >= 0) {
        const next = [...templates];
        next[idx] = { ...next[idx], quantity: newQty == null ? '' : String(newQty) };
        try {
          setStoredTemplates(next);
        } catch (e) {
          console.warn('Could not update template quantity in localStorage', e);
        }
      }
    } else {
      try {
        const body = {
          name: product.productName,
          type: product.type || 'product',
          quantityValue: newQty,
          quantifiableUnit: product.productQuantifiableUnit ?? 'kg',
          productOrigin: product.productOrigin ?? null,
          functionalProperties: { ...(product.functionalProperties || {}), dppData: product.dppData },
          userId: product.userId ?? null,
          uploadedFile: product.uploadedFile ?? null,
          DPP: product.DPP ?? null,
        };
        await productAPI.updateProduct(productId, body);
      } catch (err) {
        console.error('Failed to update quantity:', err);
      }
    }

    runFullLcaCalculation(productId, newQty);
  };

  const handleDelete = (productId) => {
    const product = products.find(p => p.productId === productId);
    setDeleteConfirm({
      isOpen: true,
      title: maritimeMode ? 'Delete Vessel' : 'Delete Product',
      message: `Are you sure you want to delete "${product ? product.productName : `this ${labels.entitySingular}`}"? This action cannot be undone.`,
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
    setLcaDirtyMap((prev) => ({ ...prev, [p.productId]: true }));
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
    setLcaDirtyMap((prev) => ({ ...prev, [p.productId]: true }));
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
    setLcaDirtyMap((prev) => ({ ...prev, [p.productId]: true }));
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
    setLcaDirtyMap((prev) => ({ ...prev, [productId]: true }));
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
    setLcaDirtyMap((prev) => ({ ...prev, [productId]: true }));
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
    const zeroBreakdown = !hasPositiveBreakdownWeight(newDppJson);
    setProducts(currentProducts =>
      currentProducts.map(prod =>
        prod.productId === productId
          ? {
              ...prod,
              dppData: newDppJson,
              ...(zeroBreakdown ? { lcaResult: 0, scope1: 0, scope2: 0, scope3: 0 } : {}),
            }
          : prod
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
  const runFullLcaCalculation = async (productId, quantityOverride = null) => {
    const product = products.find(p => p.productId === productId);
    console.log('[LCA] runFullLcaCalculation called', { productId, productName: product?.productName, found: !!product, _fromTemplate: product?._fromTemplate });
    if (!product) {
      console.warn('[LCA] Abort: product not found for id', productId);
      return;
    }
    if (maritimeMode) {
      const mmsi = extractMmsiFromProduct(product);
      if (!mmsi) {
        alert('Missing MMSI for this vessel. Include an MMSI column in your upload, or add MMSI in the vessel name.');
        return;
      }
      setCalculatingProductId(productId);
      try {
        const lcaRes = await maritimeAPI.getLca(mmsi);
        const scope1 = scope1FromMaritimeLcaResponse(lcaRes);
        setProducts((currentProducts) =>
          currentProducts.map((prod) =>
            prod.productId === productId
              ? {
                  ...prod,
                  scope1,
                  scope2: 0,
                  scope3: scope1, // Displayed in the existing LCA column for maritime rows
                  lcaResult: scope1,
                  hasCalculatedLca: true,
                  DPP: {
                    ...(prod.DPP || {}),
                    name: prod.productName || '',
                    carbonFootprint: { scope1, scope2: 0, scope3: scope1 },
                  },
                }
              : prod
          )
        );
        setLcaDirtyMap((prev) => ({ ...prev, [productId]: false }));
      } catch (err) {
        console.error('[Maritime LCA] Error:', err?.response?.status, err?.response?.data ?? err?.message, err);
        const status = err?.response?.status;
        const unreachable = status === 502 || status === 503 || status === 504 || err?.code === 'ECONNREFUSED' || !err?.response;
        alert(
          unreachable
            ? 'Could not reach the API while calculating voyage LCA. Start the Spring Boot backend (default port 8080) and check that Vite proxies /api to it (VITE_API_PROXY_TARGET).'
            : 'Failed to calculate vessel LCA. If logs exist for this MMSI in the maritime database, try again; otherwise voyage emissions will show as 0.'
        );
      } finally {
        setCalculatingProductId((prev) => (prev === productId ? null : prev));
      }
      return;
    }
    // When quantity is empty (shown as "—"), do not run backend calculation; set scopes to 0.
    const q = quantityOverride != null ? quantityOverride : product.productQuantity;
    const quantityEmpty =
      (q === null || q === undefined || (typeof q === 'string' && String(q).trim() === '')) ||
      (Number.isFinite(Number(q)) && Number(q) <= 0);
    if (quantityEmpty) {
      console.log('[LCA] Quantity empty – skipping backend calculation and setting scopes to 0');
      setProducts((currentProducts) =>
        currentProducts.map((prod) =>
          prod.productId === productId
            ? { ...prod, scope1: 0, scope2: 0, scope3: 0, lcaResult: 0, hasCalculatedLca: false }
            : prod
        )
      );
      setLcaDirtyMap((prev) => ({ ...prev, [productId]: false }));
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
    if (!hasPositiveBreakdownWeight(dpp)) {
      console.log('[LCA] Breakdown weights are all zero/empty – forcing Scope 3 to 0');
      setProducts((currentProducts) =>
        currentProducts.map((prod) =>
          prod.productId === productId
            ? { ...prod, scope1: 0, scope2: 0, scope3: 0, lcaResult: 0, hasCalculatedLca: false }
            : prod
        )
      );
      if (userId) {
        setLocalLca(userId, productId, 0);
      }
      setLcaDirtyMap((prev) => ({ ...prev, [productId]: false }));
      return;
    }

    let backendKey = '';
    const tryWebLcaFallback = async () => {
      const components = parseDppArray(product.dppData)
        .map((item) => String(item?.ingredient || '').replace(/^Process:\s*/i, '').trim())
        .filter(Boolean)
        .slice(0, 20);
      const estimate = await estimateProductLcaFromWeb({
        productName: product.productName || product.name || 'Unknown product',
        quantity: q != null && Number.isFinite(Number(q)) ? Number(q) : 1,
        unit: product.productQuantifiableUnit || 'unit',
        components,
      });
      if (!estimate) return false;

      const factor = quantityFactor(q);
      const scaled = {
        scope1: estimate.scope1 * factor,
        scope2: estimate.scope2 * factor,
        scope3: estimate.scope3 * factor,
        total: estimate.total * factor,
      };

      if (userId) {
        setLocalLca(userId, productId, scaled.total);
      }
      setLcaQtySnapshot(productId, q);

      try {
        const cacheRaw = localStorage.getItem(LCA_CACHE_KEY) || '{}';
        const cache = JSON.parse(cacheRaw) || {};
        const nameKey = String(product.productName || '').toLowerCase().trim();
        if (nameKey) {
          cache[nameKey] = {
            scope1: scaled.scope1,
            scope2: scaled.scope2,
            scope3: scaled.scope3,
            total: scaled.total,
            confidence: estimate.confidence,
            rationale: estimate.rationale,
            source: 'web-estimate',
            updatedAt: Date.now(),
          };
          localStorage.setItem(LCA_CACHE_KEY, JSON.stringify(cache));
        }
      } catch (_) {}

      setProducts((currentProducts) =>
        currentProducts.map((prod) =>
          prod.productId === productId
            ? {
                ...prod,
                scope1: scaled.scope1,
                scope2: scaled.scope2,
                scope3: scaled.scope3,
                lcaResult: scaled.total,
                hasCalculatedLca: true,
              }
            : prod
        )
      );
      setLcaDirtyMap((prev) => ({ ...prev, [productId]: false }));
      return true;
    };

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
          const estimated = await tryWebLcaFallback();
          if (!estimated) {
            alert(`No backend product named "${name}" found, and web LCA estimation also failed. Try creating the product in backend or add more product breakdown details.`);
          }
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
      console.log('[LCA] Requesting GET /api/lca/rough', { backendKey, ...(userId ? { userId } : {}) });
      const lcaRes = await productAPI.calculateProduct(backendKey, userId);
      console.log('[LCA] LCA response:', { status: lcaRes?.status, data: lcaRes?.data });

      // Prefer direct scope values returned by backend LCA endpoint.
      // Fallback to generic parser for legacy payload shapes.
      const lcaData = lcaRes?.data;
      let totals;
      if (lcaData && typeof lcaData === 'object') {
        const hasDirectScopes =
          lcaData.scope1 != null || lcaData.Scope1 != null ||
          lcaData.scope2 != null || lcaData.Scope2 != null ||
          lcaData.scope3 != null || lcaData.Scope3 != null;
        if (hasDirectScopes) {
          const scope1 = toFiniteNumber(lcaData.scope1 ?? lcaData.Scope1, 0);
          const scope2 = toFiniteNumber(lcaData.scope2 ?? lcaData.Scope2, 0);
          const scope3 = toFiniteNumber(lcaData.scope3 ?? lcaData.Scope3, 0);
          totals = { scope1, scope2, scope3, total: scope1 + scope2 + scope3 };
        } else {
          const productWithCf = { DPP: { carbonFootprint: lcaData }, emissionInformation: null };
          totals = getScopeTotalsFromProduct(productWithCf);
        }
      } else {
        totals = { scope1: 0, scope2: 0, scope3: 0, total: 0 };
      }
      const factor = quantityFactor(q);
      const scaledTotals = {
        scope1: totals.scope1 * factor,
        scope2: totals.scope2 * factor,
        scope3: totals.scope3 * factor,
        total: totals.total * factor,
      };
      console.log('[LCA] Totals from response:', totals);

      // Persist LCA in localStorage only (no backend). Survives refresh and navigation.
      // For template products, also save under the template's own productId so it survives reload
      // (template products are not in the backend product list, so backendKey won't match on reload).
      if (userId) {
        setLocalLca(userId, backendKey, scaledTotals.total);
        if (product._fromTemplate && productId !== backendKey) {
          setLocalLca(userId, productId, scaledTotals.total);
        }
        console.log('[LCA] Saved to localStorage:', { productKey: backendKey, templateId: product._fromTemplate ? productId : null, total: scaledTotals.total });
      }
      setLcaQtySnapshot(backendKey, q);
      if (productId !== backendKey) {
        setLcaQtySnapshot(productId, q);
      }
      // Optional: persist to backend (comment out to use localStorage only)
      // try { await userLcaAPI.save(userId, backendKey, totals.total); } catch (e) {}
      // try { await productAPI.saveProductLca(backendKey, totals.total); } catch (e) {}

      console.log('[LCA] Refetching product GET /api/products/' + backendKey);
      const res = await productAPI.getProductById(backendKey);
      const updatedProduct = res?.data;
      console.log('[LCA] Refetch response:', { status: res?.status, hasProduct: !!updatedProduct, lcaValue: updatedProduct?.lcaValue ?? updatedProduct?.LCAvalue ?? updatedProduct?.LCAValue });
      if (updatedProduct || scaledTotals.total >= 0) {
        // Use persisted lcaValue when present, else total from response (support both key casings)
        const refetchedLca = updatedProduct?.lcaValue ?? updatedProduct?.lcavalue ?? updatedProduct?.LCAvalue ?? updatedProduct?.LCAValue;
        const lcaResult = typeof refetchedLca === 'number' ? refetchedLca * factor : scaledTotals.total;

        // Optional: keep local cache as fallback for template products or old sessions
        try {
          const cacheRaw = localStorage.getItem(LCA_CACHE_KEY) || '{}';
          const cache = JSON.parse(cacheRaw) || {};
          const entry = {
            scope1: scaledTotals.scope1 || 0,
            scope2: scaledTotals.scope2 || 0,
            scope3: scaledTotals.scope3 || 0,
            total: lcaResult,
            updatedAt: Date.now(),
          };
          const prodName = (product.productName || product.name || '').toString().trim();
          if (prodName) cache[prodName.toLowerCase()] = entry;
          localStorage.setItem(LCA_CACHE_KEY, JSON.stringify(cache));
        } catch (e) {
          console.warn('[LCA] Failed to update local LCA cache', e);
        }

        // Update the row so UI shows backend-calculated scopes directly.
        setProducts((currentProducts) =>
          currentProducts.map((prod) => {
            if (prod.productId === productId) {
              const dppFromBackend = updatedProduct?.DPP ?? updatedProduct?.dpp ?? null;
              const computedDpp = dppFromBackend ?? {
                name: product.productName || prod.productName || '',
                carbonFootprint: {
                  scope1: totals.scope1,
                  scope2: totals.scope2,
                  scope3: totals.scope3,
                },
              };
              setLocalDppCache(backendKey, computedDpp, product.productName);
              if (productId !== backendKey) {
                setLocalDppCache(productId, computedDpp, product.productName);
              }
              return {
                ...prod,
                DPP: computedDpp ?? prod.DPP,
                emissionInformation: updatedProduct?.emissionInformation ?? prod.emissionInformation,
                lcaResult,
                scope1: scaledTotals.scope1,
                scope2: scaledTotals.scope2,
                scope3: scaledTotals.scope3,
                hasCalculatedLca: true,
                functionalProperties: updatedProduct?.functionalProperties ?? prod.functionalProperties,
              };
            }
            return prod;
          })
        );
        setLcaDirtyMap((prev) => ({ ...prev, [productId]: false }));
      } else {
        console.warn('[LCA] No product or totals – cannot update UI');
      }
    } catch (err) {
      console.error('[LCA] Error:', err?.response?.status, err?.response?.data ?? err?.message, err);
      const estimated = await tryWebLcaFallback();
      if (!estimated) {
        const msg = err?.response?.data?.message || err?.response?.data || err?.message || "LCA calculation failed.";
        alert(typeof msg === "string" ? msg : "Failed to calculate LCA. Ensure the product is in the supply chain graph and upstream nodes have DPP data.");
      }
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
  /** kgCO₂e numeric string; keep 3 dp so table and DPP modal match. */
  const fmtScopeNum = (scope) => {
    if (scope == null) return '—';
    if (typeof scope === 'number' && !Number.isNaN(scope)) return Number(scope).toFixed(3);
    if (typeof scope === 'object' && scope.kgCO2e != null) return Number(scope.kgCO2e).toFixed(3);
    return '—';
  };

  const scopeToKg = (scope) => {
    if (scope == null) return null;
    if (typeof scope === 'number' && Number.isFinite(scope)) return scope;
    if (typeof scope === 'object' && scope.kgCO2e != null) {
      const n = Number(scope.kgCO2e);
      return Number.isFinite(n) ? n : null;
    }
    return null;
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
          <h3 className="dpp-section-title">{maritimeMode ? 'Vessel' : 'Product'}</h3>
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
                    if (maritimeMode) {
                      if (product._maritimeLcaPending) {
                        return (
                          <span className="dpp-scopes-inline" style={{ fontStyle: 'italic', color: 'rgba(var(--greys), 0.85)' }}>
                            Voyage LCA is still loading…
                          </span>
                        );
                      }
                      const rowS1 = Number(product.scope1 ?? 0);
                      const cfS1 = scopeToKg(cf.scope1 ?? cf.Scope1);
                      const cfS2 = scopeToKg(cf.scope2 ?? cf.Scope2);
                      const cfS3 = scopeToKg(cf.scope3 ?? cf.Scope3);
                      const dppMismatch =
                        cfS1 != null &&
                        (Math.abs(cfS1 - rowS1) > 1e-3 ||
                          (cfS2 != null && Math.abs(cfS2 - Number(product.scope2 ?? 0)) > 1e-3) ||
                          (cfS3 != null && Math.abs(cfS3 - Number(product.scope3 ?? 0)) > 1e-3));
                      return (
                        <>
                          <div className="dpp-scopes-inline">
                            Voyage LCA: <strong>{formatTotalLca(rowS1)}</strong>
                          </div>
                          <p className="small-regular" style={{ color: 'rgba(var(--greys), 0.75)', marginTop: '0.35rem' }}>
                            Scopes (kgCO₂e): S1: {fmtScopeNum(cf.scope1 ?? cf.Scope1)} · S2: {fmtScopeNum(cf.scope2 ?? cf.Scope2)} · S3:{' '}
                            {fmtScopeNum(cf.scope3 ?? cf.Scope3)}
                          </p>
                          {!dppMismatch && (
                            <p className="small-regular" style={{ color: 'rgba(var(--success), 0.95)', marginTop: '0.35rem' }}>
                              Row and passport figures are consistent.
                            </p>
                          )}
                          {dppMismatch && (
                            <p className="small-regular" style={{ color: 'rgba(var(--danger), 1)', marginTop: '0.35rem' }}>
                              Row data and passport snapshot differ — refresh the page or reopen after voyage LCA finishes loading.
                            </p>
                          )}
                        </>
                      );
                    }
                    const n1 = fmtScopeNum(cf.scope1 ?? cf.Scope1);
                    const n2 = fmtScopeNum(cf.scope2 ?? cf.Scope2);
                    const n3 = fmtScopeNum(cf.scope3 ?? cf.Scope3);
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
    const n = Number(value);
    if (!Number.isFinite(n)) return '0.000 kgCO₂e';
    return `${n.toFixed(3)} kgCO₂e`;
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
            <h1>{labels.pageTitle}</h1>
            <p className = "medium-regular">{labels.subtitle}</p>
          </div>
          <div className = "sub-header">
            <p style = {{color: "rgba(var(--greys), 1)"}}>Showing {filteredProducts.length} of {products.length} {labels.entityPlural}</p>
              <div className = "two-row-component-container">
              <div className = "input-base search-bar"><Search />
                <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              {!maritimeMode && (
                <button type="button" className="default" style={{ whiteSpace: 'nowrap', width: 'auto', paddingLeft: '1rem', paddingRight: '1rem' }} onClick={() => navigate('/add-products')}>
                  Browse Templates
                </button>
              )}
              {!maritimeMode && (
                <button type="button" className="outline" style={{ whiteSpace: 'nowrap', width: 'auto', paddingLeft: '1rem', paddingRight: '1rem' }} onClick={() => setShowAddProduct(true)}>
                  Upload BOM
                </button>
              )}
            </div>
          </div>
          <div className="inventory-table-container">
            <table className="inventory-table">
              <thead className = "normal-bold">
                <tr>
                  {!maritimeMode && <th />}
                  <th>{labels.nameHeader}</th>
                  {!maritimeMode && <th>{labels.quantityHeader}</th>}
                  <th>DPP</th>
                  <th>{labels.lcaHeader}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={maritimeMode ? 4 : 6} className="no-products-message">Loading {labels.entityPlural}...</td>
                  </tr>
                )}
                
                {!loading && error && (
                  <tr>
                    <td colSpan={maritimeMode ? 5 : 6} className="no-products-message" style={{ color: 'rgba(var(--danger), 1)' }}>
                      {error}
                    </td>
                  </tr>
                )}
                
                {!loading && !error && products.length === 0 && (
                  <tr>
                    <td colSpan={maritimeMode ? 4 : 6} className="no-products-message">
                      {maritimeMode
                        ? 'No backend vessel logs found. Ensure maritime ship log data exists in the backend.'
                        : `Add a new ${labels.entitySingular}. Click Upload BOM or Create Your Own.`}
                    </td>
                  </tr>
                )}
                
                {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={maritimeMode ? 4 : 6} className="no-products-message">
                      {`No ${labels.entityPlural} match your search query.`}
                    </td>
                  </tr>
                )}

                {!loading && !error && filteredProducts.map(p => {
                  const dpp = p.dppData &&
                    (typeof p.dppData === 'string' ? JSON.parse(p.dppData) : p.dppData);

                  return (
                    <React.Fragment key={p.productId}>
                      <tr>
                        {!maritimeMode && (
                          <td>
                            <button
                              className="icon icon-small"
                              disabled={calculatingProductId === p.productId}
                              title={expandedRows[p.productId] ? 'Collapse' : 'Expand'}
                              onClick={() => {
                                const isOpening = !expandedRows[p.productId];
                                setExpandedRows((prev) => ({ ...prev, [p.productId]: !prev[p.productId] }));
                                if (
                                  isOpening &&
                                  (!p.hasCalculatedLca || lcaDirtyMap[p.productId])
                                ) {
                                  runFullLcaCalculation(p.productId);
                                }
                              }}
                            >
                              <Triangle style={{ transform: expandedRows[p.productId] ? 'rotate(180deg)' : 'rotate(90deg)' }} />
                            </button>
                          </td>
                        )}
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
                        {!maritimeMode && (
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <input
                                type="number"
                                min={0}
                                step="0.000001"
                                className="input-base"
                                style={{ width: '7rem' }}
                                value={productQuantityEdits[p.productId] ?? (p.productQuantity ?? '')}
                                onChange={(e) =>
                                  setProductQuantityEdits((prev) => ({ ...prev, [p.productId]: e.target.value }))
                                }
                                onBlur={(e) => handleProductQuantityBlur(p.productId, e.target.value)}
                              />
                            </div>
                          </td>
                        )}
                        <td>
                          <a
                            href="#"
                            className="link normal-bold"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowDppModal(true);
                              setCurrentDppProduct(p);
                              if (!maritimeMode && (!p.hasCalculatedLca || !p.DPP)) {
                                runFullLcaCalculation(p.productId);
                              }
                            }}
                          >
                            View DPP
                          </a>
                        </td>
                        <td>
                          {maritimeMode ? (
                            p._maritimeLcaPending ? (
                              <span
                                className="lca-calculating"
                                style={{ color: 'rgba(var(--greys), 0.9)', fontStyle: 'italic' }}
                              >
                                Calculating voyage LCA…
                              </span>
                            ) : (
                              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
                                {formatTotalLca(p.scope3 ?? 0)}
                              </strong>
                            )
                          ) : calculatingProductId === p.productId ? (
                            <span className="lca-calculating" style={{ color: 'rgba(var(--greys), 0.9)', fontStyle: 'italic' }}>
                              Calculating LCA…
                            </span>
                          ) : (
                            <strong>{p.hasCalculatedLca ? formatTotalLca(p.scope3 ?? 0) : formatTotalLca(0)}</strong>
                          )}
                        </td>
                        <td>
                          <div className='two-row-component-container'>
                            {!maritimeMode && (
                              <>
                                <button className="icon" title="Add component" onClick={() => { console.log('[Inventory] Add component clicked (this does not run LCA)', p.productId); handleAddSubcomponent(p.productId); }}><CirclePlus /></button>
                                <button className="icon" style = {{backgroundColor: "rgba(var(--danger), 1)"}} title = "Delete product" onClick={() => handleDelete(p.productId)}>
                                  <Trash2 />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {!maritimeMode && expandedRows[p.productId] && dpp && Array.isArray(dpp) && dpp.length > 0 && (
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
      {!maritimeMode && showAddProduct && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <p className = "medium-bold">{maritimeMode ? 'Upload Vessel Details' : 'Upload BOM'}</p>
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
                  {uploading ? "Uploading..." : (maritimeMode ? "Upload Vessel Details" : "Upload BOM")}
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