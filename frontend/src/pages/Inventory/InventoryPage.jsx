import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './InventoryPage.css';
import { productAPI } from '../../services/api';
import Navbar from '../../components/Navbar/Navbar';
import { Search, X, Triangle, CirclePlus, Trash2, FilePlus } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';
import DppModal from '../../components/DppModal/DppModal';

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
function templateToProduct(template) {
  const dpp = templateToDppData(template);
  const q = template.quantity;
  const quantityNum = q != null && q !== '' ? Number(q) : null;
  return {
    productId: `template-${template.id}`,
    productName: template.name || 'Unnamed template',
    productQuantity: Number.isNaN(quantityNum) ? null : quantityNum,
    productQuantifiableUnit: null,
    dppData: JSON.stringify(dpp),
    lcaResult: 0,
    userId: '',
    type: 'product',
    _fromTemplate: true,
    _templateId: template.id,
  };
}

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
  const [subProductWeights, setSubProductWeights] = useState({});
  const [editableIngredients, setEditableIngredients] = useState({});
  const [productNameEdits, setProductNameEdits] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {},
  });

  const fetchProducts = useCallback(async () => {
    if (!userId) {
      setError('No user session found. Please log in.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await productAPI.getAllProducts();
      const raw = Array.isArray(res?.data) ? res.data : [];
      const filtered = userId ? raw.filter((p) => p.userId === userId) : raw;
      const mapped = filtered.map((p) => {
        // Calculate total LCA from DPP carbon footprint scopes
        let lcaResult = p.lcaResult ?? 0;
        if (p.DPP?.carbonFootprint) {
          const cf = p.DPP.carbonFootprint;
          lcaResult = 
            (cf.scope1?.value ?? cf.Scope1?.value ?? 0) +
            (cf.scope2?.value ?? cf.Scope2?.value ?? 0) +
            (Object.values(cf.scope3 || cf.Scope3 || {}).reduce((sum, m) => sum + (m?.value ?? 0), 0));
        }
        
        // Backend delete/update use document key; prefer key over full _id
        const apiKey = p.key ?? p._key ?? (p.id && String(p.id).includes('/') ? String(p.id).split('/').pop() : p.id) ?? p._id ?? p.id;
        return {
          productId: apiKey,
          productName: p.name,
          productQuantity: p.quantityValue ?? p.quantity ?? null,
          productQuantifiableUnit: p.quantifiableUnit ?? null,
          dppData: (p.functionalProperties && p.functionalProperties.dppData) || (typeof p.dppData === 'string' ? p.dppData : '[]'),
          lcaResult: lcaResult,
          userId: p.userId,
          uploadedFile: p.uploadedFile,
          type: p.type,
          productOrigin: p.productOrigin,
          functionalProperties: p.functionalProperties,
          DPP: p.DPP,
        };
      });
      const customTemplates = getStoredTemplates();
      const backendNames = new Set(mapped.map((prod) => prod.productName));
      const templateProducts = customTemplates
        .filter((t) => !backendNames.has(t.name || ''))
        .map((t) => templateToProduct(t));
      setProducts([...mapped, ...templateProducts]);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      const customTemplates = getStoredTemplates();
      const templateProducts = customTemplates.map((t) => templateToProduct(t));
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
  // so edits made on Edit Template or Browse Templates are reflected here
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
    if (location.pathname !== '/inventory') return;
    syncTemplatesIntoProducts();
  }, [location.pathname, products.length, syncTemplatesIntoProducts]);

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

  // --- FULL LCA: Call backend to calculate LCA and generate/update DPP
  const runFullLcaCalculation = async (productId) => {
    const product = products.find(p => p.productId === productId);
    if (!product) return;
    let dpp;
    try { dpp = JSON.parse(product.dppData); } catch (e) { return; }
    if (!Array.isArray(dpp)) return;

    if (product._fromTemplate) return;

    try {
      // First ensure DPP data is saved
      await autoSaveProduct(productId, product.dppData);
      
      // Call backend to calculate LCA and generate DPP
      const response = await productAPI.calculateProduct(productId);
      const updatedProduct = response.data;
      
      if (updatedProduct) {
        // Calculate total carbon footprint from DPP
        const carbonFootprint = updatedProduct.DPP?.carbonFootprint;
        let updatedLcaResult = 0;
        if (carbonFootprint) {
          // Handle both camelCase (Jackson default) and PascalCase (Java field names)
          const scope1 = carbonFootprint.scope1 || carbonFootprint.Scope1;
          const scope2 = carbonFootprint.scope2 || carbonFootprint.Scope2;
          const scope3 = carbonFootprint.scope3 || carbonFootprint.Scope3;
          updatedLcaResult = 
            (scope1?.value ?? 0) +
            (scope2?.value ?? 0) +
            (Object.values(scope3 || {}).reduce((sum, m) => sum + (m?.value ?? 0), 0));
        }
        
        // Update local state with backend-calculated DPP and carbon footprint
        setProducts(currentProducts =>
          currentProducts.map(prod => {
            if (prod.productId === productId) {
              return {
                ...prod,
                DPP: updatedProduct.DPP,
                lcaResult: updatedLcaResult,
                functionalProperties: updatedProduct.functionalProperties,
              };
            }
            return prod;
          })
        );
        
        // Refresh the product list to get the latest data
        await fetchProducts();
      }
    } catch (err) {
      console.error("Error calculating LCA:", err);
      alert("Failed to calculate LCA. Please check that all DPP items have valid LCA values.");
    }
  };

  const closeDeleteModal = () => {
    setDeleteConfirm({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };
  
  const formatDpp = (product) => {
    if (!product) return '[No DPP stored]';
    let dppData;
    try { dppData = JSON.parse(product.dppData); } catch (e) { dppData = []; }
    const metadata = product.metadata || {};
    
    let output = "--- PRODUCT DETAILS ---\n";
    output += `Product Name: ${metadata['Product Name'] || product.productName}\n`;
    output += `Brand: ${metadata['Brand'] || 'N/A'}\n`;
    output += `Product GTIN/EAN/UPC: ${metadata['Product GTIN/EAN/UPC'] || 'N/A'}\n`;
    output += `Country of Origin: ${metadata['Country of Origin'] || 'N/A'}\n`;
    output += `Certifications: ${metadata['Certifications'] || 'N/A'}\n`;
    
    output += "\n--- OTHER METADATA ---\n";
    Object.keys(metadata).forEach(key => {
      if (!['Product Name', 'Brand', 'Product GTIN/EAN/UPC', 'Country of Origin', 'Certifications', 'Ingredients', 'Net Weight (kg)', 'Packaging Type', 'Packaging Weight (g)', 'Transportation Mode'].includes(key)) {
        if(metadata[key]) { output += `${key}: ${metadata[key]}\n`; }
      }
    });

    output += "\n--- PRODUCT BREAKDOWN ---\n";
    if (dppData.length > 0) {
      dppData.forEach((item, index) => {
        const isProcess = (item.ingredient || '').startsWith('Process:');
        const lineLabel = isProcess ? processDisplayLabel(item.ingredient) : `Element: ${item.ingredient || '—'}`;
        const unit = item.unit || (isProcess ? 's' : 'kg');
        const effectiveUnit = unit === '-' ? (isProcess ? 's' : 'kg') : unit;
        const amountDisplay = toDisplayAmount(item.weightKg, effectiveUnit, isProcess);
        const unitLabel = (isProcess ? TIME_UNITS : WEIGHT_UNITS).find((u) => u.unit === effectiveUnit)?.label || effectiveUnit;
        output += `  [${index + 1}] ${lineLabel}\n`;
        output += `      Amount: ${amountDisplay} ${unitLabel}\n`;
        output += `      LCA Value: ${item.lcaValue ? item.lcaValue.toFixed(3) + ' kgCO2e' : 'Not calculated'}\n`;
        if (item.isPackaging) output += `      (Packaging Component)\n`;
        if (item.isTransport) output += `      (Transport Component)\n`;
      });
    } else {
      output += "No elements or processes listed for this product.\n";
    }
    return output;
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
                  <th>Total LCA Result</th>
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
                            onClick={() => {
                              const isOpening = !expandedRows[p.productId];
                              setExpandedRows(prev => ({ ...prev, [p.productId]: !prev[p.productId] }));
                              if (isOpening) {
                                runFullLcaCalculation(p.productId);
                              }
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
                        <td><strong>{formatTotalLca(p.lcaResult)}</strong></td>
                        <td>
                          <div className='two-row-component-container'>
                            <button className="icon" title="Add component" onClick={() => handleAddSubcomponent(p.productId)}><CirclePlus /></button>
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
        {formatDpp(currentDppProduct)}
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