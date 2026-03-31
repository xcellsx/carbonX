import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './AnalyticsPage.css';
import Navbar from '../../components/Navbar/Navbar';
import { ChevronDown, Sparkles, Lock, X, BarChart3 } from 'lucide-react';
import InstructionalCarousel from '../../components/InstructionalCarousel/InstructionalCarousel';
import { API_BASE, productAPI, processAPI, maritimeAPI, getLocalLcaMap } from '../../services/api';
import { generateProductAnalysisSuggestions } from '../../services/openRouter';
import { getScopeTotalsFromProduct } from '../../utils/emission';
import ProModal from '../../components/ProModal/ProModal';
import AIChatPopup from '../../components/AIChatPopup/AIChatPopup';
import { useProSubscription } from '../../hooks/useProSubscription';

// --- Same data source as Inventory: localStorage templates + API products ---
const STORAGE_KEY_TEMPLATES = 'carbonx-custom-templates';
function getStoredTemplates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

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

const ANALYTICS_CAROUSEL_SLIDES = [
  { title: 'Welcome to Analytics', description: 'Here you can analyse environmental impacts and life cycle data. Analytics uses your inventory products and their DPP data to show impacts by category (e.g. climate change, land use).', icon: <BarChart3 size={40} /> },
  { title: 'Impact categories', description: 'Select an impact category (Climate Change, Land Use, Ozone Depletion, etc.) to see how your products contribute. Data is derived from your product breakdowns and LCA calculations.', icon: <BarChart3 size={40} /> },
  { title: 'AI summary', description: 'Use the sparkles button to open the AI assistant and ask for a summary of your analytics or to explore your impact data in plain language.', icon: <Sparkles size={40} /> },
];

const MARITIME_ANALYTICS_CAROUSEL_SLIDES = [
  { title: 'Welcome to Analytics', description: 'For maritime profiles, select a vessel (MMSI) from ship logs. Analytics shows voyage LCA as Scope 1 / 2 / 3 totals from the backend rough voyage model (no ingredient breakdown).', icon: <BarChart3 size={40} /> },
  { title: 'Scopes 1–3', description: 'Use the Scope 1, 2, and 3 tabs to see the same voyage totals formatted per scope. Detailed category breakdowns (e.g. stationary combustion) appear when full emission inventories exist—voyage mode is totals only.', icon: <BarChart3 size={40} /> },
  { title: 'AI summary', description: 'Use the sparkles button to open the AI assistant for a plain-language summary of your vessel emissions.', icon: <Sparkles size={40} /> },
];

function isMaritimeCompanyProfile() {
  try {
    const uid = localStorage.getItem('userId') || '';
    const allCompanyData = JSON.parse(localStorage.getItem('companyData') || '{}');
    const storageKey = uid.includes('/') ? uid.split('/').pop() : uid;
    const company = allCompanyData[uid] ?? allCompanyData[storageKey] ?? null;
    const s = String(company?.sector || '').toLowerCase().trim();
    const i = String(company?.industry || '').toLowerCase().trim();
    return (
      s.includes('maritime') ||
      i.includes('maritime') ||
      s.includes('marine transport') ||
      i.includes('marine transportation') ||
      i.includes('marine transport')
    );
  } catch {
    return false;
  }
}

function scope1FromMaritimeLcaResponse(lcaRes) {
  const raw = lcaRes?.data?.scope1;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (raw && typeof raw === 'object' && raw.kgCO2e != null) {
    const n = Number(raw.kgCO2e);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function templateToProduct(template, localLcaMap = {}) {
  const dpp = templateToDppData(template);
  const templateProductId = `template-${template.id}`;
  const rawLca = localLcaMap[templateProductId];
  const lcaResult = (rawLca != null && !Number.isNaN(Number(rawLca))) ? Number(rawLca) : 0;
  return {
    productId: templateProductId,
    productName: template.name || 'Unnamed template',
    dppData: JSON.stringify(dpp),
    lcaResult,
  };
}

// --- UPDATED: Data based on your Inventory Calculation Image ---
const MOCK_PRODUCT_ANALYSIS = {
  topContributors: [
    { name: 'Raw White Sesame Seeds', amount: '0.850 kgCO2e' },
    { name: 'Plastic Packaging (LDPE)', amount: '0.055 kgCO2e' },
    { name: 'Cardboard Box', amount: '0.032 kgCO2e' },
    { name: 'Transport (Truck)', amount: '0.015 kgCO2e' },
    { name: 'Electricity (Processing)', amount: '0.005 kgCO2e' },
  ],
  suggestions: [
    'Source organic sesame seeds to reduce fertilizer-related emissions.',
    'Switch to recycled or biodegradable materials for plastic packaging.',
    'Optimize truck transport routes to lower fuel consumption.'
  ]
};

// --- AI Suggestions Modal (for Pro users) ---
const AiSuggestionsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content pro-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <button className="close-modal-btn" style={{ width: '100%', textAlign: 'right' }} onClick={onClose}><X /></button>
        <div><Sparkles size={48} color="rgba(var(--secondary), 1)" /></div>
        <p className="large-bold">AI Suggestions</p>
        <p className="normal-regular" style={{ textAlign: 'center' }}>
          This is where CarbonX will generate optimization suggestions based on your inventory data.
        </p>
        <button type="button" className="default" style={{ width: '100%' }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

const AnalyticsPage = () => {
  // --- State for User Profile & Logic ---
  const [userId] = useState(localStorage.getItem('userId') || '');
  const { isProUser } = useProSubscription();
  const navigate = useNavigate();
  const maritimeMode = isMaritimeCompanyProfile();

  const [products, setProducts] = useState([]);
  
  // --- Initialize state from sessionStorage ---
  const [selectedProductId, setSelectedProductId] = useState(
    sessionStorage.getItem('analytics_selectedProductId') || ''
  );
  // Separate indices for elements and processes so their tables are fully independent
  const [selectedElementIndex, setSelectedElementIndex] = useState(
    parseInt(sessionStorage.getItem('analytics_selectedElementIndex') || '0', 10)
  );
  const [selectedProcessIndex, setSelectedProcessIndex] = useState(
    parseInt(sessionStorage.getItem('analytics_selectedProcessIndex') || '0', 10)
  );

  // Combined data state
  const [analyticsData, setAnalyticsData] = useState({ inputs: [], outputs: [], impacts: [] });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');
  
  // Separate input products for elements and processes
  const [elementInputProducts, setElementInputProducts] = useState([]);
  const [processInputProducts, setProcessInputProducts] = useState([]);
  const [loadingElementInputs, setLoadingElementInputs] = useState(false);
  const [loadingProcessInputs, setLoadingProcessInputs] = useState(false);
  
  // Raw products data from API (for component matching)
  const [rawProductsData, setRawProductsData] = useState([]);
  const [rawProcessesData, setRawProcessesData] = useState([]);
  
  // UI State
  const [activeScopeElements, setActiveScopeElements] = useState('scope1');
  const [activeScopeProcesses, setActiveScopeProcesses] = useState('scope1');
  const [showProModal, setShowProModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  
  // Product Analysis AI insights
  const [productInsights, setProductInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // --- Helper to sort "Values" before "No Values" ---
  const sortDataValuesFirst = (dataArray) => {
    return dataArray.sort((a, b) => {
      const valA = parseFloat(a.amount) || 0;
      const valB = parseFloat(b.amount) || 0;
      const isZeroA = valA === 0;
      const isZeroB = valB === 0;

      if (!isZeroA && isZeroB) return -1; 
      if (isZeroA && !isZeroB) return 1;  
      
      return 0; 
    });
  };

  // --- Fetch Product List (same sources as Inventory: API + localStorage templates) ---
  const fetchProducts = useCallback(async () => {
    try {
      if (isMaritimeCompanyProfile()) {
        try {
          const logsRes = await maritimeAPI.getShipLogs();
          const rawLogs = Array.isArray(logsRes?.data) ? logsRes.data : [];
          const mmsiSet = new Set();
          rawLogs.forEach((log) => {
            const m = String(log?.mmsi || log?.MMSI || '').trim();
            if (m) mmsiSet.add(m);
          });
          const mmsiList = [...mmsiSet].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
          const lcaByMmsi = await Promise.all(
            mmsiList.map(async (mmsi) => {
              try {
                const lcaRes = await maritimeAPI.getLca(mmsi);
                return scope1FromMaritimeLcaResponse(lcaRes);
              } catch {
                return 0;
              }
            })
          );
          const mapped = mmsiList.map((mmsi, idx) => {
            const scope1 = lcaByMmsi[idx] ?? 0;
            const name = `Vessel ${mmsi}`;
            return {
              productId: `mmsi-${mmsi}`,
              productName: name,
              dppData: '[]',
              lcaResult: scope1,
              scope1,
              scope2: 0,
              scope3: scope1,
              DPP: {
                name,
                carbonFootprint: {
                  scope1: { kgCO2e: scope1 },
                  scope2: { kgCO2e: 0 },
                  scope3: { kgCO2e: scope1 },
                },
              },
              emissionInformation: null,
              _maritimeVessel: true,
              mmsi,
            };
          });
          setProducts(mapped);
          setRawProductsData([]);
          setRawProcessesData([]);
          setError(mapped.length === 0 ? 'No vessel logs found in the maritime database.' : '');
        } catch (err) {
          console.warn('Analytics: maritime fetch failed', err);
          setProducts([]);
          setRawProductsData([]);
          setRawProcessesData([]);
          setError('Could not load vessels from ship logs.');
        }
        return;
      }

      let mapped = [];
      const backendNames = new Set();
      try {
        const res = await productAPI.getAllProducts();
        console.log('[Analytics] getProducts response:', res);
        console.log('[Analytics] getProducts data:', res?.data);
        console.log('[Analytics] getProducts data type:', typeof res?.data, Array.isArray(res?.data) ? `array length ${res.data.length}` : '');
        const raw = Array.isArray(res?.data) ? res.data : [];
        
        // Normalize items that have nested dpp (e.g. DPP/emission view): use dpp.name/key when top-level missing
        const normalized = raw.map((p) => {
          const fromDpp = p.dpp;
          const name = p.name ?? fromDpp?.name ?? '';
          const key = p.key ?? fromDpp?.key ?? (p.id && String(p.id).includes('/') ? String(p.id).split('/').pop() : p.id);
          const emission = p.emissionInformation ?? fromDpp?.emissionInformation;
          return { ...p, name: name || p.name, key: key || p.key, emissionInformation: emission ?? p.emissionInformation };
        });
        
        // Store ALL normalized products in rawProductsData (for component matching - need all products, not just user's)
        console.log('[Analytics] Setting rawProductsData with', normalized.length, 'products (ALL products for component matching)');
        console.log('[Analytics] Raw products sample:', normalized.slice(0, 3).map(p => ({ name: p.name, userId: p.userId, hasEmissionInfo: !!p.emissionInformation })));
        setRawProductsData(normalized);
        
        // Filter by userId only for the products dropdown (user's products)
        const filtered = userId ? normalized.filter((p) => p.userId === userId) : normalized;
        
        const localLcaMap = getLocalLcaMap(userId);
        mapped = filtered.map((p) => {
          const productId = p.key ?? p._key ?? (p.id && String(p.id).includes('/') ? String(p.id).split('/').pop() : p.id) ?? p._id ?? p.id;
          backendNames.add(p.name || '');
          // Prefer localStorage-persisted LCA from Inventory, then fall back to DPP scopes
          const localLca = productId != null ? localLcaMap[String(productId)] : null;
          let lcaResult = (localLca != null && !Number.isNaN(Number(localLca))) ? Number(localLca) : (p.lcaResult ?? 0);
          if (lcaResult === 0 && p.DPP?.carbonFootprint) {
            const cf = p.DPP.carbonFootprint;
            lcaResult =
              (cf.scope1?.value ?? cf.Scope1?.value ?? 0) +
              (cf.scope2?.value ?? cf.Scope2?.value ?? 0) +
              (Object.values(cf.scope3 || cf.Scope3 || {}).reduce((sum, m) => sum + (m?.value ?? 0), 0));
          }
          return {
            productId,
            productName: p.name,
            dppData: (p.functionalProperties && p.functionalProperties.dppData) || (typeof p.dppData === 'string' ? p.dppData : '[]'),
            lcaResult,
            DPP: p.DPP,
            emissionInformation: p.emissionInformation,
          };
        });
        const processRes = await processAPI.getProcesses();
        const processRaw = Array.isArray(processRes?.data) ? processRes.data : [];
        const normalizedProcesses = processRaw.map((p) => {
          const fromDpp = p.dpp;
          const name = p.name ?? fromDpp?.name ?? '';
          const key = p.key ?? p._key ?? (p.id && String(p.id).includes('/') ? String(p.id).split('/').pop() : p.id);
          const emission = p.emissionInformation ?? fromDpp?.emissionInformation;
          return { ...p, name: name || p.name, key: key || p.key, emissionInformation: emission ?? p.emissionInformation };
        });
        setRawProcessesData(normalizedProcesses);
      } catch (err) {
        console.warn('Analytics: could not fetch API products', err);
        setRawProductsData([]); // Set empty array on error
        setRawProcessesData([]);
      }
      const localLcaMap = getLocalLcaMap(userId);
      const customTemplates = getStoredTemplates();
      const templateProducts = customTemplates
        .filter((t) => !backendNames.has(t.name || ''))
        .map((t) => templateToProduct(t, localLcaMap));
      const merged = [...mapped, ...templateProducts].sort((a, b) =>
        (a.productName || '').localeCompare(b.productName || '', undefined, { sensitivity: 'base' })
      );
      setProducts(merged);
      setError('');
    } catch (err) {
      console.error('Failed to load product list:', err);
      setError('Could not load product list.');
      setProducts([]);
      setRawProductsData([]); // Set empty array on error
      setRawProcessesData([]);
    }
  }, [userId]);

  // Simplified - we now use scope data from graph inputs instead of analytics API
  const fetchAnalyticsDataForProduct = async (productId, componentIndex, currentProducts) => {
    // This function is kept for compatibility but no longer calls the analytics API
    // Scope data is now fetched from graph inputs' emissionInformation
    setLoadingAnalytics(false);
    setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
  };

  // --- Initial Load ---
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fetch component product with emissionInformation from rawProductsData (backend getProducts API)
  // Simply maps component name to product name from getProducts API
  const fetchInputProducts = useCallback(async (componentName, componentMaterialId, setProducts, setLoading, sourceType = 'product') => {
    setLoading(true);
    try {
      let inputProductsData = [];
      const sourceData = sourceType === 'process' ? rawProcessesData : rawProductsData;
      if (!componentName || sourceData.length === 0) {
        setProducts([]);
        return;
      }
      const normalizeString = (str) => String(str || '').toLowerCase().trim().replace(/\s+/g, ' ');
      const normalizedComponentName = normalizeString(componentName);
      let matchedProduct = null;
      if (componentMaterialId) {
        const productId = componentMaterialId.toString();
        matchedProduct = sourceData.find((p) => {
          const pId = p.key ?? p._key ?? (p.id && String(p.id).includes('/') ? String(p.id).split('/').pop() : p.id) ?? p._id ?? p.id;
          const pIdStr = pId?.toString();
          const keyOnly = productId.includes('/') ? productId.split('/').pop() : productId;
          return (
            pIdStr === productId ||
            pIdStr === keyOnly ||
            pIdStr === `products/${keyOnly}` ||
            pIdStr === `processes/${keyOnly}`
          );
        });
      }
      if (!matchedProduct) {
        matchedProduct = sourceData.find((p) => {
          if (!p || !p.name) return false;
          return normalizeString(p.name) === normalizedComponentName;
        });
      }
      if (matchedProduct) {
        const productId = matchedProduct.key ?? matchedProduct._key ??
          (matchedProduct.id && String(matchedProduct.id).includes('/') ? String(matchedProduct.id).split('/').pop() : matchedProduct.id) ?? matchedProduct._id ?? matchedProduct.id;
        inputProductsData = [{
          id: productId,
          name: matchedProduct.name,
          emissionInformation: matchedProduct.emissionInformation,
        }];
      }
      setProducts(inputProductsData);
    } catch (err) {
      console.error('Failed to fetch component product:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [rawProductsData, rawProcessesData]);

  // Generate AI insights for Product Analysis — always product-level totals, not per-ingredient
  const generateProductInsights = useCallback(async (product) => {
    if (!product || !isProUser) {
      setProductInsights(null);
      return;
    }
    setLoadingInsights(true);
    try {
      // Use product-level scope totals (localStorage-persisted LCA values take priority)
      const localLcaByName = (() => { try { return JSON.parse(localStorage.getItem('carbonx_lca_cache_by_name_v1') || '{}'); } catch { return {}; } })();
      const nameKey = (product.productName || '').toLowerCase().trim();
      const cachedByName = nameKey ? localLcaByName[nameKey] : null;

      // Prefer localStorage scope breakdown, then product fields, then raw DPP totals
      const rawTotals = getScopeTotalsFromProduct(product);
      const scope1 = cachedByName?.scope1 ?? product.scope1 ?? rawTotals.scope1 ?? 0;
      const scope2 = cachedByName?.scope2 ?? product.scope2 ?? rawTotals.scope2 ?? 0;
      const scope3 = cachedByName?.scope3 ?? product.scope3 ?? rawTotals.scope3 ?? 0;
      const total  = cachedByName?.total  ?? product.lcaResult ?? rawTotals.total ?? 0;

      // Build contributors as Scope 1/2/3 breakdown of the whole product
      const scopeEntries = [
        { name: 'Scope 1 (Direct)', val: scope1 },
        { name: 'Scope 2 (Purchased Energy)', val: scope2 },
        { name: 'Scope 3 (Value Chain)', val: scope3 },
      ].filter((e) => e.val > 0).sort((a, b) => b.val - a.val);

      const contributors = scopeEntries.length > 0
        ? scopeEntries.map((e) => ({
            name: e.name,
            amount: `${Number(e.val).toFixed(3)} kgCO2e`,
          }))
        : [{ name: 'No emission data available', amount: '-' }];

      // Parse components for context (packaging/transport flags only)
      let components = [];
      try { components = JSON.parse(product.dppData || '[]'); } catch (_) {}

      // Rule-based fallback suggestions
      const fallbackSuggestions = [];
      if (scope3 > 0 && scope3 >= scope1 && scope3 >= scope2) {
        fallbackSuggestions.push(`Scope 3 (${Number(scope3).toFixed(2)} kgCO2e) is your largest emission source — focus on supply chain and procurement.`);
      } else if (scope1 > 0) {
        fallbackSuggestions.push(`Scope 1 emissions (${Number(scope1).toFixed(2)} kgCO2e) are your largest source — consider fuel-switching or efficiency improvements.`);
      } else if (scope2 > 0) {
        fallbackSuggestions.push(`Scope 2 emissions (${Number(scope2).toFixed(2)} kgCO2e) dominate — switching to renewable electricity could significantly cut your footprint.`);
      }
      if (components.some((c) => c.isPackaging)) fallbackSuggestions.push('Consider switching to recycled or biodegradable packaging materials.');
      if (components.some((c) => c.isTransport)) fallbackSuggestions.push('Optimise transportation routes and consider lower-emission alternatives.');
      if (fallbackSuggestions.length === 0) fallbackSuggestions.push('Continue monitoring your product emissions and identify opportunities to reduce impact.');

      // AI-generated suggestions
      let suggestions = fallbackSuggestions;
      try {
        const aiSuggestions = await generateProductAnalysisSuggestions({
          productName: product.productName || product.productId || 'Product',
          topContributors: contributors,
          scope1: Number(scope1).toFixed(3),
          scope2: Number(scope2).toFixed(3),
          scope3: Number(scope3).toFixed(3),
          total: Number(total).toFixed(3),
          hasPackaging: components.some((c) => c.isPackaging),
          hasTransport: components.some((c) => c.isTransport),
        });
        if (aiSuggestions.length > 0) suggestions = aiSuggestions;
      } catch (e) {
        console.warn('Analytics: AI suggestions failed, using fallback', e);
      }

      setProductInsights({
        topContributors: contributors,
        suggestions: suggestions.length > 0 ? suggestions : ['No specific suggestions available at this time.'],
      });
    } catch (err) {
      console.error('Failed to generate insights:', err);
      setProductInsights(null);
    } finally {
      setLoadingInsights(false);
    }
  }, [isProUser]);

  // --- Effect to load stored product when 'products' list arrives ---
  useEffect(() => {
    if (products.length > 0 && selectedProductId) {
      const productExists = products.find(p => p.productId == selectedProductId);
      if (productExists) {
        fetchAnalyticsDataForProduct(selectedProductId, 0, products);
        generateProductInsights(productExists);
      } else {
        setSelectedProductId('');
        sessionStorage.removeItem('analytics_selectedProductId');
        setSelectedElementIndex(0);
        setSelectedProcessIndex(0);
        sessionStorage.removeItem('analytics_selectedElementIndex');
        sessionStorage.removeItem('analytics_selectedProcessIndex');
        setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
        setElementInputProducts([]);
        setProcessInputProducts([]);
        setProductInsights(null);
      }
    }
  }, [products, generateProductInsights]); 


  // --- Handle Product Selection ---
  const handleProductChange = (e) => {
    const newProductId = e.target.value;
    setSelectedProductId(newProductId);
    sessionStorage.setItem('analytics_selectedProductId', newProductId); 

    setSelectedElementIndex(0);
    setSelectedProcessIndex(0);
    sessionStorage.setItem('analytics_selectedElementIndex', '0');
    sessionStorage.setItem('analytics_selectedProcessIndex', '0');
    setActiveScopeElements('scope1');
    setActiveScopeProcesses('scope1');
    
    if (newProductId) {
      const allProducts = products;
      const product = allProducts.find((p) => p.productId == newProductId);
      if (product) {
        fetchAnalyticsDataForProduct(newProductId, 0, allProducts);
        generateProductInsights(product);
        if (product._maritimeVessel) {
          setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
        } else if (product.dppData) {
          try {
            const comps = JSON.parse(product.dppData);
            if (comps.length === 0) {
              setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
            }
          } catch {
            setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
          }
        } else {
          setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
        }
      } else {
        setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
        setProductInsights(null);
      }
    } else {
      setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
      setProductInsights(null);
    }
  };

  // --- Handle Element / Process Tab Selection ---
  const handleElementSelect = (localIdx) => {
    setSelectedElementIndex(localIdx);
    sessionStorage.setItem('analytics_selectedElementIndex', localIdx);
  };
  const handleProcessSelect = (localIdx) => {
    setSelectedProcessIndex(localIdx);
    sessionStorage.setItem('analytics_selectedProcessIndex', localIdx);
  };

  // --- Helper to parse components for tabs ---
  const selectedProduct = products.find(p => p.productId == selectedProductId);
  let components = [];
  if (selectedProduct && selectedProduct.dppData) {
    try {
      components = JSON.parse(selectedProduct.dppData);
    } catch (e) {
      console.error("Failed to parse DPP data for tabs");
    }
  }

  // Split components into Elements and Processes
  const elements = components
    .filter((comp) => {
      const ingredient = (comp.ingredient || '').toString().trim();
      return !ingredient.startsWith('Process:') && !comp.isTransport && !comp.isPackaging;
    })
    .sort((a, b) => (a.ingredient || '').localeCompare(b.ingredient || '', undefined, { sensitivity: 'base' }));

  const processes = components
    .filter((comp) => {
      const ingredient = (comp.ingredient || '').toString().trim();
      return ingredient.startsWith('Process:');
    })
    .sort((a, b) => {
      const nameA = (a.ingredient || '').replace(/^Process:\s*/i, '');
      const nameB = (b.ingredient || '').replace(/^Process:\s*/i, '');
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });
  
  // Extract scope data from emissionInformation
  const extractScopeFromEmissionInfo = (emissionInfo, scopeKey) => {
    console.log('[Analytics] ========== EXTRACT SCOPE FROM EMISSION INFO ==========');
    console.log('[Analytics] extractScopeFromEmissionInfo:', { scopeKey, emissionInfo });
    
    if (!emissionInfo) {
      console.log('[Analytics] No emissionInfo provided');
      return [];
    }
    
    if (!emissionInfo[scopeKey]) {
      console.log('[Analytics] No', scopeKey, 'in emissionInfo. Available keys:', Object.keys(emissionInfo));
      return [];
    }
    
    const scope = emissionInfo[scopeKey];
    console.log('[Analytics] Scope data for', scopeKey, ':', JSON.stringify(scope, null, 2));
    console.log('[Analytics] Scope type:', typeof scope, 'isArray:', Array.isArray(scope));
    const results = [];
    
    // Scope structure: Map<String, Map<String, Double>>
    // e.g., scope1: { "stationaryCombustion": { "CO2": { "kg": 10.5 }, "CH4": { "kg": 0.2 } }, ... }
    // e.g., scope3: { "category1": { "CO2": { "kg": 5.0 } }, "category2": { "CO2": { "kg": 3.0 } }, ... }
    // OR: scope3: { "category": { "CO2": { "kg": 0.1 } }, "CO2": { "kg": 0.1 } }
    if (typeof scope === 'object' && scope !== null) {
      Object.entries(scope).forEach(([category, gases]) => {
        console.log('[Analytics] --- Processing category:', category, '---');
        console.log('[Analytics] Category value (gases):', JSON.stringify(gases, null, 2));
        console.log('[Analytics] Category value type:', typeof gases, 'isArray:', Array.isArray(gases));
        
        if (gases && typeof gases === 'object' && gases !== null) {
          // Sum all gas values (CO2, CH4, N2O, etc.) for this category
          let totalKg = 0;
          Object.entries(gases).forEach(([gas, values]) => {
            console.log('[Analytics]   Processing gas:', gas, 'values:', JSON.stringify(values, null, 2));
            console.log('[Analytics]   Values type:', typeof values, 'isArray:', Array.isArray(values));
            
            if (values && typeof values === 'object' && values !== null && !Array.isArray(values)) {
              // Handle nested structure like { "kg": 10.5 } or { "kg": 0.1 }
              Object.entries(values).forEach(([unit, value]) => {
                console.log('[Analytics]     Unit:', unit, 'Value:', value, 'Type:', typeof value);
                if (typeof value === 'number' && !isNaN(value)) {
                  // Convert to kgCO2e (assuming kg is already CO2e equivalent, or convert based on gas type)
                  if (unit === 'kg' || unit === 'kgCO2e') {
                    console.log('[Analytics]     Adding', value, 'kg to total for category', category);
                    totalKg += value;
                  }
                }
              });
            } else if (typeof values === 'number' && !isNaN(values)) {
              console.log('[Analytics]     Adding direct numeric value', values, 'to total for category', category);
              totalKg += values;
            } else if (Array.isArray(values)) {
              console.log('[Analytics]     Skipping array values');
            } else {
              console.log('[Analytics]     Skipping non-numeric, non-object values');
            }
          });
          
          console.log('[Analytics] Total kg for category', category, ':', totalKg);
          // Format category name (convert camelCase to readable, handle category1 -> Category 1)
          let categoryName = category
            .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters
            .replace(/([a-z])(\d)/g, '$1 $2') // Add space before numbers (e.g., category1 -> category 1)
            .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
            .trim();
          
          // Handle special case: if it's "Category" followed by a number, ensure proper formatting
          if (/^category\s*\d+$/i.test(category)) {
            const match = category.match(/^category\s*(\d+)$/i);
            if (match) {
              categoryName = `Category ${match[1]}`;
            }
          }
          
          console.log('[Analytics] Adding result for category:', categoryName, 'amount:', totalKg.toPrecision(3));
          results.push({
            category: categoryName,
            amount: totalKg.toPrecision(3),
            unit: 'kgCO2e',
          });
        } else {
          console.log('[Analytics] Skipping category', category, 'because gases is not an object');
        }
      });
    }
    
    console.log('[Analytics] ========== EXTRACTED RESULTS ==========');
    console.log('[Analytics] Extracted results:', results);
    console.log('[Analytics] Results count:', results.length);
    return results;
  };

  // Extract a numeric category number from a label like "Category 3" or "category3" → 3, else Infinity
  const categoryOrder = (label) => {
    const m = String(label || '').match(/\d+/);
    return m ? parseInt(m[0], 10) : Infinity;
  };

  // Get scope data from a given set of input products' emissionInformation
  const getScopeDataFromInputs = (scopeKey, inputProductsList) => {
    if (!inputProductsList || inputProductsList.length === 0) return [];
    const allScopeData = [];
    inputProductsList.forEach((componentProduct) => {
      if (!componentProduct.emissionInformation) return;
      const scopeData = extractScopeFromEmissionInfo(componentProduct.emissionInformation, scopeKey);
      scopeData.forEach((item) => allScopeData.push(item));
    });
    if (scopeKey === 'scope3') {
      return allScopeData.sort((a, b) => categoryOrder(a.category) - categoryOrder(b.category));
    }
    return allScopeData.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
  };

  // Get scope data from selected product's DPP (fallback)
  const getScopeDataFromDPP = () => {
    if (!selectedProduct || !selectedProduct.DPP?.carbonFootprint) {
      return { scope1: [], scope2: [], scope3: [] };
    }
    const cf = selectedProduct.DPP.carbonFootprint;
    const scope1 = cf.scope1 || cf.Scope1;
    const scope2 = cf.scope2 || cf.Scope2;
    const scope3 = cf.scope3 || cf.Scope3 || {};
    
    const formatScopeData = (scope, scopeName) => {
      if (!scope) return [];
      
      // Handle Map<String, Double> format (e.g., {"kgCO2e": 20.2})
      if (typeof scope === 'object' && !scope.value && !Array.isArray(scope)) {
        return Object.entries(scope).map(([unit, value]) => ({
          category: scopeName,
          amount: (typeof value === 'number' ? value : 0).toPrecision(3),
          unit: unit || 'kgCO2e',
        })).filter((item) => parseFloat(item.amount) > 0);
      }
      
      // Handle Metric object format (e.g., {value: 20.2, unit: "kgCO2e"})
      if (scope.value !== undefined) {
        return [{
          category: scopeName,
          amount: scope.value.toPrecision(3),
          unit: scope.unit || 'kgCO2e',
        }];
      }
      
      // Handle Map<String, Metric> format for scope3
      if (typeof scope === 'object' && Object.keys(scope).length > 0) {
        return Object.entries(scope).map(([category, metric]) => {
          const value = metric?.value ?? (typeof metric === 'number' ? metric : 0);
          return {
            category: category || scopeName,
            amount: value.toPrecision(3),
            unit: metric?.unit || 'kgCO2e',
          };
        }).filter((item) => parseFloat(item.amount) > 0);
      }
      
      return [];
    };
    
    const scope3Data = formatScopeData(scope3, 'Scope 3')
      .sort((a, b) => categoryOrder(a.category) - categoryOrder(b.category));
    return {
      scope1: formatScopeData(scope1, 'Scope 1'),
      scope2: formatScopeData(scope2, 'Scope 2'),
      scope3: scope3Data,
    };
  };

  /** Maritime / voyage-only: one row per scope from vessel DPP (no ingredient tables). */
  const getMaritimeVesselScopeData = (scopeKey) => {
    const dppData = getScopeDataFromDPP();
    return dppData[scopeKey] || [];
  };

  // Get scope data for elements — prefer element input products, fallback to DPP
  const getElementScopeData = (scopeKey) => {
    const inputData = getScopeDataFromInputs(scopeKey, elementInputProducts);
    if (inputData.length > 0) return inputData;
    const dppData = getScopeDataFromDPP();
    return dppData[scopeKey] || [];
  };

  // Get scope data for processes — prefer process input products, fallback to DPP
  const getProcessScopeData = (scopeKey) => {
    const inputData = getScopeDataFromInputs(scopeKey, processInputProducts);
    if (inputData.length > 0) return inputData;
    const dppData = getScopeDataFromDPP();
    return dppData[scopeKey] || [];
  };

  // Legacy helper used by AI context summary — merge both
  const getScopeData = (scopeKey) => {
    const el = getScopeDataFromInputs(scopeKey, elementInputProducts);
    const pr = getScopeDataFromInputs(scopeKey, processInputProducts);
    const merged = [...el, ...pr];
    if (merged.length > 0) return merged;
    const dppData = getScopeDataFromDPP();
    return dppData[scopeKey] || [];
  };

  // Update element input products when selected element changes
  useEffect(() => {
    if (!selectedProduct || elements.length === 0) {
      setElementInputProducts([]);
      return;
    }
    const el = elements[selectedElementIndex] ?? elements[0];
    if (!el) { setElementInputProducts([]); return; }
    const componentName = (el.ingredient || '').toString().trim();
    const componentMaterialId = el.materialId || null;
    fetchInputProducts(componentName, componentMaterialId, setElementInputProducts, setLoadingElementInputs, 'product');
  }, [selectedElementIndex, selectedProductId, fetchInputProducts, elements.length]);

  // Update process input products when selected process changes
  useEffect(() => {
    if (!selectedProduct || processes.length === 0) {
      setProcessInputProducts([]);
      return;
    }
    const proc = processes[selectedProcessIndex] ?? processes[0];
    if (!proc) { setProcessInputProducts([]); return; }
    const componentName = (proc.ingredient || '').toString().trim().replace(/^Process:\s*/, '');
    const componentMaterialId = proc.materialId || null;
    fetchInputProducts(componentName, componentMaterialId, setProcessInputProducts, setLoadingProcessInputs, 'process');
  }, [selectedProcessIndex, selectedProductId, fetchInputProducts, processes.length]);

  // When Top 5 was "No emission data available" but we have scope data, use that so the card and AI see the same data as the table
  useEffect(() => {
    if (!productInsights?.topContributors?.length) return;
    if (productInsights.topContributors.length !== 1 || productInsights.topContributors[0].name !== 'No emission data available') return;
    if (elementInputProducts.length === 0 && processInputProducts.length === 0) return;
    const s1 = getScopeData('scope1');
    const s2 = getScopeData('scope2');
    const s3 = getScopeData('scope3');
    const merged = [...s1, ...s2, ...s3]
      .map((i) => ({ name: i.category, amount: `${i.amount} ${(i.unit || '').trim()}`.trim() }))
      .sort((a, b) => parseFloat(String(b.amount)) - parseFloat(String(a.amount)))
      .slice(0, 5);
    if (merged.length === 0) return;
    setProductInsights((prev) => (prev ? { ...prev, topContributors: merged } : prev));
  }, [elementInputProducts, processInputProducts, productInsights, activeScopeElements]);

  // --- RENDER SCOPE TABLE DATA ---
  const renderScopeTableData = (scopeKey, getScopeDataFn) => {
    const data = getScopeDataFn(scopeKey);
    // Overlay calculated LCA values from localStorage where available
    const localLcaMap = getLocalLcaMap(userId);
    const enriched = data.map((item) => {
      // Try to find a matching product in localLcaMap by category name
      const matchKey = Object.keys(localLcaMap).find(
        (k) => (k || '').toLowerCase().includes((item.category || '').toLowerCase())
      );
      const calcVal = matchKey != null ? Number(localLcaMap[matchKey]) : null;
      return {
        ...item,
        amount: (calcVal != null && !Number.isNaN(calcVal) && calcVal > 0)
          ? calcVal.toFixed(3)
          : item.amount,
      };
    });
    const headers = ['Category', 'Amount', 'Unit'];

    return (
      <div className="analytics-table-container">
        <table className="analytics-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {headers.map((h, i) => {
                 let style = { textAlign: 'left', padding: '12px', backgroundColor: 'rgba(51, 71, 97, 1)', color: 'white' };
                 if (h === 'Category') style = { ...style, width: '50%' }; 
                 else if (h === 'Amount') style = { ...style, width: '30%', textAlign: 'right', paddingRight: '1.5rem' }; 
                 else if (h === 'Unit') style = { ...style, width: '20%' }; 
                 
                 return <th key={h} style={style}>{h}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {enriched.length > 0 ? (
              enriched.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', width: '50%', whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word', verticalAlign: 'top' }}>
                    {item.category}
                  </td>
                  <td style={{ padding: '12px', width: '30%', textAlign: 'right', paddingRight: '1.5rem', verticalAlign: 'top' }}>
                    {item.amount}
                  </td>
                  <td style={{ padding: '12px', width: '20%', textAlign: 'left', verticalAlign: 'top' }}>
                    {item.unit}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="no-data-message" style={{ textAlign: 'center', padding: '12px', fontStyle: 'italic', color: '#888' }}>
                  No {scopeKey.replace('scope', 'Scope ')} data available for this component.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Summary of current Analytics page data for the AI popup (so it can summarise the page)
  const analyticsContextSummary = React.useMemo(() => {
    const lines = [];
    lines.push(
      maritimeMode
        ? `Vessels in analytics list: ${products.length}`
        : `Products in inventory: ${products.length}`
    );
    if (products.length > 0) {
      const names = products.slice(0, 15).map((p) => p.productName || p.productId).filter(Boolean);
      lines.push(`${maritimeMode ? 'Vessel names' : 'Product names'}: ${names.join(', ')}${products.length > 15 ? '…' : ''}`);
    }
    if (selectedProduct) {
      lines.push(
        `Currently selected ${maritimeMode ? 'vessel' : 'product'}: ${selectedProduct.productName || selectedProduct.productId}`
      );
      if (components.length > 0) {
        const el = elements[selectedElementIndex];
        const pr = processes[selectedProcessIndex];
        if (el) lines.push(`Selected element: ${(el.ingredient || '').toString().trim() || `Element ${selectedElementIndex + 1}`}`);
        if (pr) lines.push(`Selected process: ${(pr.ingredient || '').toString().trim().replace(/^Process:\s*/, '') || `Process ${selectedProcessIndex + 1}`}`);
        lines.push(`Total components (ingredients + processes): ${components.length}`);
      }
      const scope1 = getScopeData('scope1');
      const scope2 = getScopeData('scope2');
      const scope3 = getScopeData('scope3');
      if (scope1.length > 0 || scope2.length > 0 || scope3.length > 0) {
        const top = (arr, n = 3) => arr.slice(0, n).map((i) => `${i.category}: ${i.amount} ${i.unit || ''}`).join('; ');
        if (scope1.length > 0) lines.push(`Scope 1 (top): ${top(scope1)}`);
        if (scope2.length > 0) lines.push(`Scope 2 (top): ${top(scope2)}`);
        if (scope3.length > 0) lines.push(`Scope 3 (top): ${top(scope3)}`);
      }
    }
    if (productInsights) {
      const scopeBreakdown = (productInsights.topContributors || []);
      if (scopeBreakdown.length > 0) {
        lines.push('Product emissions by scope:');
        scopeBreakdown.forEach((c) => lines.push(`  - ${c.name}: ${c.amount}`));
      }
      const suggestions = productInsights.suggestions || [];
      if (suggestions.length > 0) lines.push(`Suggestions: ${suggestions.slice(0, 3).join(' ')}`);
    }
    return lines.join('\n') || 'No analytics data loaded yet.';
  }, [
    maritimeMode,
    products,
    selectedProductId,
    selectedProduct,
    components,
    selectedElementIndex,
    selectedProcessIndex,
    productInsights,
    elementInputProducts,
    processInputProducts,
    activeScopeElements,
  ]);

  return (
    <div className="container">
      <InstructionalCarousel
        pageId="analytics"
        slides={maritimeMode ? MARITIME_ANALYTICS_CAROUSEL_SLIDES : ANALYTICS_CAROUSEL_SLIDES}
        newUserOnly
      />
      <Navbar />
      <div className="content-section-main">
        <div className="content-container-main">
          <header className="header-group">
            <h1>Analytics</h1>
            <p className="medium-regular">
              {maritimeMode
                ? 'Voyage LCA by vessel (Scope 1–3 totals from backend ship logs).'
                : 'Breakdown of your products and processes.'}
            </p>
          </header>
          
          {/* --- Product / vessel selection --- */}
          <div className="sub-header" style={{ display: 'flex', alignItems: 'stretch' }}>
            <div className = "header-col">
              <label htmlFor="product-select" className="normal-bold">
                {maritimeMode ? 'Select vessel:' : 'Select your product:'}
              </label>
              <div className="select-wrapper">
                <select 
                  id="product-select" 
                  className="input-base"
                  value={selectedProductId} 
                  onChange={handleProductChange}
                  disabled={products.length === 0}
                >
                  <option value="">
                    {products.length === 0
                      ? maritimeMode
                        ? 'No vessels found'
                        : 'No products found'
                      : maritimeMode
                        ? '-- Select a vessel --'
                        : '-- Select a product --'}
                  </option>
                  {products.map(product => (
                    <option key={product.productId} value={product.productId}>
                      {product.productName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-arrow" />
              </div>
            </div>

            <div className = "button-container">
              <button 
                className = "icon"
                title={isProUser ? "Open AI assistant" : "Unlock CarbonX Pro for AI"}
                style={!isProUser ? { backgroundColor: 'rgba(var(--greys), 0.2)' } : {}}
                onClick={() => {
                  if (isProUser) {
                    setShowChatPopup(true);
                  } else {
                    setShowProModal(true);
                  }
                }}
              >
                <Sparkles />
              </button>
            </div>
          </div>
          
          {error && <div className="submit-error" style={{ marginBottom: '15px'}}>{error}</div>}

          {/* --- Product Analysis Section (Only visible when product selected) --- */}
          {selectedProductId && (
            <>
              <div className = "sub-header">
                <div className = "header-col">
                  <p className='descriptor-medium'>{maritimeMode ? 'Vessel analysis' : 'Product Analysis'}</p>
                </div>
              </div>
              
              <div className="product-analysis-card">
                {!isProUser && (
                  <div className="blur-overlay" onClick={() => setShowProModal(true)}>
                    <Lock />
                    <p className="medium-bold">Unlock CarbonX Pro</p>
                    <p className="normal-regular">to see your product-level analysis.</p>
                  </div>
                )}
                <div className={`product-analysis-content ${!isProUser ? 'blurred' : ''}`}>
                  {loadingInsights ? (
                    <div className="product-analysis-loading">
                      <p className="normal-regular product-analysis-loading-text">
                        Generating AI insights...
                      </p>
                    </div>
                  ) : productInsights ? (
                    <>
                      <div className="analysis-column">
                        <p className="medium-bold">Emissions by Scope</p>
                        <ul className="analysis-list">
                          {productInsights.topContributors.map((item, i) => (
                            <li key={i}>
                              <span>{item.name}</span>
                              <span>{item.amount}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="analysis-column">
                        <p className="medium-bold">Suggestions</p>
                        <ul className="analysis-list simple">
                          {productInsights.suggestions.map((item, i) => (
                            <li key={i}><span>{item}</span></li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                      <p className="normal-regular">No insights available. Ensure your product has DPP data.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* --- Component Analysis Section --- */}
          <div className = "sub-header" style={{marginTop: '2rem'}}>
            <div className = "header-col">
              <p className='descriptor-medium'>
                {maritimeMode ? 'Voyage emissions by scope' : 'Component Analysis'}
              </p>
            </div>
          </div>

          {selectedProductId && maritimeMode && selectedProduct?._maritimeVessel ? (
            <div className="component-analysis-container" style={{ marginBottom: '2rem' }}>
              <p className="normal-regular" style={{ color: 'rgba(var(--greys), 1)', marginBottom: '1rem' }}>
                Rough voyage model from AIS (same as Voyage Emissions). There is no ingredient or process breakdown—only
                Scope 1 / 2 / 3 totals (S2 is zero; S3 mirrors voyage total for passport compatibility).
              </p>
              <div className="chip-group" style={{ marginBottom: '1rem' }}>
                {['scope1', 'scope2', 'scope3'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`chip ${activeScopeElements === s ? 'active' : ''}`}
                    onClick={() => setActiveScopeElements(s)}
                  >
                    {s.replace('scope', 'Scope ')}
                  </button>
                ))}
              </div>
              {renderScopeTableData(activeScopeElements, getMaritimeVesselScopeData)}
            </div>
          ) : selectedProductId && components.length > 0 ? (
            <>
              {/* Elements Section with Table */}
              {elements.length > 0 && (
                <div style={{ marginBottom: processes.length > 0 ? '2rem' : '2rem' }}>
                  <p className="medium-bold" style={{ marginBottom: '1rem' }}>Elements</p>
                  <nav className="component-tabs" style={{ marginBottom: '1rem' }}>
                    {elements.map((element, idx) => (
                      <button
                        key={idx}
                        className={`component-tab-btn ${idx === selectedElementIndex ? 'active' : ''}`}
                        onClick={() => handleElementSelect(idx)}
                      >
                        {element.ingredient || `Element ${idx + 1}`}
                      </button>
                    ))}
                  </nav>
                  {selectedProduct && (
                    <div className="component-analysis-container">
                      <div className="chip-group" style={{ marginBottom: '1rem' }}>
                        {['scope1', 'scope2', 'scope3'].map((s) => (
                          <button
                            key={s}
                            className={`chip ${activeScopeElements === s ? 'active' : ''}`}
                            onClick={() => setActiveScopeElements(s)}
                          >
                            {s.replace('scope', 'Scope ')}
                          </button>
                        ))}
                      </div>
                      {loadingAnalytics || loadingElementInputs ? (
                        <div className="loading-message">Loading data…</div>
                      ) : (
                        renderScopeTableData(activeScopeElements, getElementScopeData)
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Processes Section with Table */}
              {processes.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <p className="medium-bold" style={{ marginBottom: '1rem' }}>Processes</p>
                  <nav className="component-tabs" style={{ marginBottom: '1rem' }}>
                    {processes.map((process, idx) => {
                      const processName = (process.ingredient || '').toString().trim().replace(/^Process:\s*/, '');
                      return (
                        <button
                          key={idx}
                          className={`component-tab-btn ${idx === selectedProcessIndex ? 'active' : ''}`}
                          onClick={() => handleProcessSelect(idx)}
                        >
                          {processName || `Process ${idx + 1}`}
                        </button>
                      );
                    })}
                  </nav>
                  {selectedProduct && (
                    <div className="component-analysis-container">
                      <div className="chip-group" style={{ marginBottom: '1rem' }}>
                        {['scope1', 'scope2', 'scope3'].map((s) => (
                          <button
                            key={s}
                            className={`chip ${activeScopeProcesses === s ? 'active' : ''}`}
                            onClick={() => setActiveScopeProcesses(s)}
                          >
                            {s.replace('scope', 'Scope ')}
                          </button>
                        ))}
                      </div>
                      {loadingAnalytics || loadingProcessInputs ? (
                        <div className="loading-message">Loading data…</div>
                      ) : (
                        renderScopeTableData(activeScopeProcesses, getProcessScopeData)
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="normal-regular" style={{color: 'rgba(var(--greys), 1)'}}>
              {selectedProductId
                ? maritimeMode
                  ? ''
                  : 'This product has no components.'
                : maritimeMode
                  ? 'Select a vessel to see voyage scope breakdown.'
                  : 'Please select a product to see component details.'}
            </p>
          )}
        </div>
      </div>
      
      <ProModal 
        isOpen={showProModal} 
        onClose={() => setShowProModal(false)}
        onGoToSettings={() => {
          setShowProModal(false);
          navigate('/settings', { state: { tab: 'billing' } });
        }}
      />
      <AiSuggestionsModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />

      <AIChatPopup
        isOpen={showChatPopup}
        onClose={() => setShowChatPopup(false)}
        pageContext="Analytics"
        contextSummary={analyticsContextSummary}
      />
    </div>
  );
};

export default AnalyticsPage;