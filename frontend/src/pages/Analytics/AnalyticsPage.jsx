import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './AnalyticsPage.css';
import Navbar from '../../components/Navbar/Navbar';
import { ChevronDown, Sparkles, Lock, X } from 'lucide-react';
import { API_BASE, productAPI } from '../../services/api';
import ProModal from '../../components/ProModal/ProModal';

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

function templateToProduct(template) {
  const dpp = templateToDppData(template);
  return {
    productId: `template-${template.id}`,
    productName: template.name || 'Unnamed template',
    dppData: JSON.stringify(dpp),
    lcaResult: 0,
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
  const [isProUser] = useState(localStorage.getItem('isProUser') === 'true');
  const navigate = useNavigate();
  
  
  const [products, setProducts] = useState([]);
  
  // --- Initialize state from sessionStorage ---
  const [selectedProductId, setSelectedProductId] = useState(
    sessionStorage.getItem('analytics_selectedProductId') || ''
  );
  const [selectedComponentIndex, setSelectedComponentIndex] = useState(
    parseInt(sessionStorage.getItem('analytics_selectedComponentIndex') || '0', 10)
  );

  // Combined data state
  const [analyticsData, setAnalyticsData] = useState({ inputs: [], outputs: [], impacts: [] });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');
  
  // UI State
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('inputs');
  const [showProModal, setShowProModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

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
      let mapped = [];
      const backendNames = new Set();
      try {
        const res = await productAPI.getAllProducts();
        const raw = Array.isArray(res?.data) ? res.data : [];
        const filtered = userId ? raw.filter((p) => p.userId === userId) : raw;
        mapped = filtered.map((p) => {
          const productId = p.key ?? p._key ?? (p.id && String(p.id).includes('/') ? String(p.id).split('/').pop() : p.id) ?? p._id ?? p.id;
          backendNames.add(p.name || '');
          return {
            productId,
            productName: p.name,
            dppData: (p.functionalProperties && p.functionalProperties.dppData) || (typeof p.dppData === 'string' ? p.dppData : '[]'),
            lcaResult: p.DPP?.carbonFootprint?.total ?? p.lcaResult ?? 0,
          };
        });
      } catch (err) {
        console.warn('Analytics: could not fetch API products', err);
      }
      const customTemplates = getStoredTemplates();
      const templateProducts = customTemplates
        .filter((t) => !backendNames.has(t.name || ''))
        .map((t) => templateToProduct(t));
      const merged = [...mapped, ...templateProducts].sort((a, b) =>
        (a.productName || '').localeCompare(b.productName || '', undefined, { sensitivity: 'base' })
      );
      setProducts(merged);
      setError('');
    } catch (err) {
      console.error('Failed to load product list:', err);
      setError('Could not load product list.');
      setProducts([]);
    }
  }, [userId]);

  const fetchAnalyticsDataForProduct = async (productId, componentIndex, currentProducts) => {
    if (!productId) {
      setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
      return;
    }
    setLoadingAnalytics(true);
    setError('');

    const product = currentProducts.find(p => p.productId == productId);
    if (!product) {
      setError('Selected product not found.');
      setLoadingAnalytics(false);
      return;
    }
    
    let components = [];
    try {
      components = JSON.parse(product.dppData || '[]');
    } catch (e) {
      setError('Failed to parse product components.');
      setLoadingAnalytics(false);
      return;
    }

    const selectedComponent = components[componentIndex];
    if (!selectedComponent) {
      setLoadingAnalytics(false);
      setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
      return;
    }

    // Handle different key names
    const identifier = selectedComponent.processId 
                    || selectedComponent.materialId 
                    || selectedComponent.process 
                    || selectedComponent.ingredient;

    const weight = selectedComponent.weightKg || 0;

    if (!identifier) {
      console.error("ERROR: Identifier is missing for component:", selectedComponent);
      setError(`Selected component (Index: ${componentIndex}) has no process defined.`);
      setLoadingAnalytics(false);
      return;
    }

    const params = new URLSearchParams({
      processIdentifier: identifier,
      weight: weight
    });

    try {
      const [flowsRes, impactsRes] = await Promise.all([
         fetch(`${API_BASE}/analytics/flows?${params.toString()}`),
         fetch(`${API_BASE}/analytics/impacts?${params.toString()}`)
      ]);

      if (!flowsRes.ok) throw new Error(`Failed to fetch flows: ${await flowsRes.text()}`);
      if (!impactsRes.ok) throw new Error(`Failed to fetch impacts: ${await impactsRes.text()}`);

      const rawFlows = await flowsRes.json();
      const rawImpacts = await impactsRes.json();

      let inputs = [];
      let outputs = [];
      if (Array.isArray(rawFlows)) {
        rawFlows.forEach(flow => {
          if (flow.enviFlow) {
             const amountValue = parseFloat(flow.amount || 0);
             const item = {
               flowName: flow.enviFlow.flow?.name || 'Unknown',
               category: flow.enviFlow.flow?.category || '-',
               amount: amountValue.toPrecision(3),
               unit: flow.enviFlow.flow?.refUnit || 'unit',
               location: flow.enviFlow.flow?.location || '-'
             };

             if (flow.enviFlow.isInput) {
               inputs.push(item);
             } else {
               outputs.push(item);
             }
          }
        });
      }

      let impacts = [];
      if (Array.isArray(rawImpacts)) {
        rawImpacts.forEach(impact => {
          if (impact.impactCategory) {
            const amountValue = parseFloat(impact.amount || 0);
            impacts.push({
              category: impact.impactCategory.name || 'Unknown',
              amount: amountValue.toPrecision(3),
              unit: impact.impactCategory.refUnit || 'unit',
              location: '-'
            });
          }
        });
      }

      inputs = sortDataValuesFirst(inputs);
      outputs = sortDataValuesFirst(outputs);
      impacts = sortDataValuesFirst(impacts);

      setAnalyticsData({ inputs, outputs, impacts });
      setError('');
    } catch (err) {
      console.warn('Analytics API unavailable, using inventory data:', err.message);
      setError('');
      // Fallback: show component from inventory (no external database)
      const comp = selectedComponent;
      const flowName = (comp.ingredient || identifier || 'Component').toString().trim();
      const amount = (weight != null && weight !== '') ? Number(weight) : 0;
      const unit = comp.unit || 'kg';
      const inputs = [{
        flowName,
        category: 'From inventory',
        amount: amount.toPrecision(3),
        unit,
        location: '-',
      }];
      setAnalyticsData({
        inputs,
        outputs: [],
        impacts: [{ category: 'Impact data requires a connected database.', amount: '-', unit: '-', location: '-' }],
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // --- Initial Load ---
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- Effect to load stored product when 'products' list arrives ---
  useEffect(() => {
    if (products.length > 0 && selectedProductId) {
      const productExists = products.find(p => p.productId == selectedProductId);
      
      if (productExists) {
        fetchAnalyticsDataForProduct(selectedProductId, selectedComponentIndex, products);
      } else {
        setSelectedProductId('');
        sessionStorage.removeItem('analytics_selectedProductId');
        setSelectedComponentIndex(0);
        sessionStorage.removeItem('analytics_selectedComponentIndex');
        setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
      }
    }
  }, [products]); 


  // --- Handle Product Selection ---
  const handleProductChange = (e) => {
    const newProductId = e.target.value;
    setSelectedProductId(newProductId);
    sessionStorage.setItem('analytics_selectedProductId', newProductId); 

    setSelectedComponentIndex(0); 
    sessionStorage.setItem('analytics_selectedComponentIndex', '0'); 
    
    if (newProductId) {
      const allProducts = products; 
      const product = allProducts.find(p => p.productId == newProductId);
      if (product && product.dppData) {
         try {
           const components = JSON.parse(product.dppData);
           if (components.length > 0) {
             fetchAnalyticsDataForProduct(newProductId, 0, allProducts);
           } else {
             setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
           }
         } catch (e) {
            setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
         }
      } else {
         setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
      }
    } else {
      setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
    }
  };

  // --- Handle Component Tab Selection ---
  const handleComponentSelect = (index) => {
    setSelectedComponentIndex(index);
    sessionStorage.setItem('analytics_selectedComponentIndex', index); 
    fetchAnalyticsDataForProduct(selectedProductId, index, products);
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

  const selectedComponent = components[selectedComponentIndex];
  const isSelectedProcess = ((selectedComponent?.ingredient || '').toString().trim()).startsWith('Process:');

  // Remove Outputs tab for Elements; if currently selected, fall back to Inputs.
  useEffect(() => {
    if (!isSelectedProcess && activeAnalysisTab === 'outputs') {
      setActiveAnalysisTab('inputs');
    }
  }, [isSelectedProcess, activeAnalysisTab]);
  
  // --- RENDER TABLE DATA ---
  const renderTableData = () => {
    let data;
    let headers;

    if (activeAnalysisTab === 'inputs') {
      data = analyticsData.inputs;
      headers = ['Input', 'Category', 'Amount', 'Unit'];
    } else if (activeAnalysisTab === 'outputs') {
      data = analyticsData.outputs;
      headers = ['Output', 'Category', 'Amount', 'Unit'];
    } else { 
      data = analyticsData.impacts;
      headers = ['Impact Category', 'Amount', 'Unit'];
    }

    return (
      <div className="analytics-table-container">
        <table className="analytics-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {headers.map((h, i) => {
                 let style = { textAlign: 'left', padding: '12px', backgroundColor: 'rgba(51, 71, 97, 1)', color: 'white' };
                 if (i === 0) style = { ...style, width: '40%' }; 
                 else if (h === 'Unit') style = { ...style, width: '15%' }; 
                 else if (h === 'Amount') style = { ...style, width: '20%', textAlign: 'right', paddingRight: '1.5rem' };
                 else if (h === 'Category') style = { ...style, width: '25%' }; 
                 
                 return <th key={h} style={style}>{h}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', width: '40%', whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word', verticalAlign: 'top' }}>
                    {item.flowName || item.category}
                  </td>
                  {activeAnalysisTab !== 'impacts' && (
                    <td style={{ padding: '12px', width: '25%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'top' }}>
                      {item.category}
                    </td>
                  )}
                  <td style={{ padding: '12px', width: '20%', textAlign: 'right', paddingRight: '1.5rem', verticalAlign: 'top' }}>
                    {item.amount}
                  </td>
                  <td style={{ padding: '12px', width: '15%', textAlign: 'left', verticalAlign: 'top' }}>
                    {item.unit}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="no-data-message" style={{ textAlign: 'center', padding: '24px', fontStyle: 'italic', color: '#888' }}>
                  No {activeAnalysisTab} data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container">
      <Navbar />
      <div className="content-section-main">
        <div className="content-container-main">
          <header className="header-group">
            <h1>Analytics</h1>
            <p className="medium-regular">Breakdown of your products and processes.</p>
          </header>
          
          {/* --- Product Selection --- */}
          <div className="sub-header" style={{ display: 'flex', alignItems: 'stretch' }}>
            <div className = "header-col">
              <label htmlFor="product-select" className="normal-bold">Select your product:</label>
              <div className="select-wrapper">
                <select 
                  id="product-select" 
                  className="input-base"
                  value={selectedProductId} 
                  onChange={handleProductChange}
                  disabled={products.length === 0}
                >
                  <option value="">{products.length === 0 ? "No products found" : "-- Select a product --"}</option>
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
                title={isProUser ? "Get AI Suggestions" : "Unlock CarbonX Pro for AI Suggestions"}
                style={!isProUser ? { backgroundColor: 'rgba(var(--greys), 0.2)' } : {}}
                onClick={() => {
                  if (isProUser) {
                    setShowAiModal(true);
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
                  <p className='descriptor-medium'>Product Analysis</p>
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
                  <div className="analysis-column">
                    <p className="medium-bold">Top 5 Highest Contributors</p>
                    <ul className="analysis-list">
                      {MOCK_PRODUCT_ANALYSIS.topContributors.map((item, i) => (
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
                      {MOCK_PRODUCT_ANALYSIS.suggestions.map((item, i) => (
                        <li key={i}><span>{item}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* --- Component Analysis Section --- */}
          <div className = "sub-header" style={{marginTop: '2rem'}}>
            <div className = "header-col">
              <p className='descriptor-medium'>Component Analysis</p>
            </div>
          </div>

          {selectedProductId && components.length > 0 ? (
            <nav className="component-tabs">
              {components.map((component, index) => (
                <button
                  key={index}
                  className={`component-tab-btn ${index === selectedComponentIndex ? 'active' : ''}`}
                  onClick={() => handleComponentSelect(index)}
                >
                  {component.component || component.ingredient || `Component ${index + 1}`}
                </button>
              ))}
            </nav>
          ) : (
            <p className="normal-regular" style={{color: 'rgba(var(--greys), 1)'}}>
              {selectedProductId ? 'This product has no components.' : 'Please select a product to see component details.'}
            </p>
          )}

          {selectedProductId && components.length > 0 && (
            <div className="component-analysis-container">
              {/* Tabs for Input/Output/Impacts */}
              <div className="chip-group" style={{ marginBottom: '1rem'}}>
                <button 
                  className={`chip ${activeAnalysisTab === 'inputs' ? 'active' : ''}`}
                  onClick={() => setActiveAnalysisTab('inputs')}
                >
                  Inputs
                </button>
                {isSelectedProcess && (
                  <button 
                    className={`chip ${activeAnalysisTab === 'outputs' ? 'active' : ''}`}
                    onClick={() => setActiveAnalysisTab('outputs')}
                  >
                    Outputs
                  </button>
                )}
                <button 
                  className={`chip ${activeAnalysisTab === 'impacts' ? 'active' : ''}`}
                  onClick={() => setActiveAnalysisTab('impacts')}
                >
                  Impact Categories
                </button>
              </div>

              {loadingAnalytics ? (
                <div className="loading-message">Loading analytics data...</div>
              ) : (
                renderTableData()
              )}
            </div>
          )}
        </div>
      </div>
      
      <ProModal 
        isOpen={showProModal} 
        onClose={() => setShowProModal(false)}
        onGoToSettings={() => {
          setShowProModal(false);
          navigate('/settings');
        }}
      />
      <AiSuggestionsModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />
    </div>
  );
};

export default AnalyticsPage;