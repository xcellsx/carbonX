import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AnalyticsPage.css';
import logoPath from '../../assets/carbonx.png';
import { 
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, ChevronDown, Sparkles, Lock
} from 'lucide-react';

// --- Mock Analytics Data ---
const MOCK_ANALYTICS_DATA = {
  'mock-steel': {
    inputs: [
      { flowName: 'Iron ore', category: 'Resources, in ground', amount: '1.20', unit: 't', location: 'Brazil' },
      { flowName: 'Coking coal', category: 'Resources, in ground', amount: '0.770', unit: 't', location: 'Australia' },
      { flowName: 'Electricity', category: 'From grid', amount: '0.500', unit: 'MWh', location: 'Regional Grid' },
    ],
    outputs: [
      { flowName: 'Carbon dioxide', category: 'Emissions to air', amount: '2.10', unit: 't', location: 'Global' },
      { flowName: 'Slag (Blast furnace)', category: 'Waste', amount: '0.300', unit: 't', location: 'On-site' },
      { flowName: 'Wastewater', category: 'Emissions to water', amount: '1.50', unit: 'm3', location: 'Local River' },
    ],
    impacts: [
      { category: 'Global Warming (GWP 100a)', amount: '2100', unit: 'kg CO2-eq', location: 'Global' },
      { category: 'Water Depletion', amount: '15.2', unit: 'm3', location: 'Regional' },
      { category: 'Particulate Matter', amount: '1.25', unit: 'kg PM2.5-eq', location: 'Global' },
    ]
  },
  'mock-aluminum': {
    inputs: [
      { flowName: 'Bauxite', category: 'Resources, in ground', amount: '4.50', unit: 't', location: 'Australia' },
      { flowName: 'Electricity', category: 'From grid', amount: '15.7', unit: 'MWh', location: 'Regional Grid' },
      { flowName: 'Caustic soda', category: 'Chemicals', amount: '0.120', unit: 't', location: 'Imported' },
    ],
    outputs: [
      { flowName: 'Carbon dioxide', category: 'Emissions to air', amount: '1.80', unit: 't', location: 'Global' },
      { flowName: 'Red mud', category: 'Waste', amount: '2.50', unit: 't', location: 'On-site Landfill' },
      { flowName: 'Sulfur dioxide', category: 'Emissions to air', amount: '0.050', unit: 't', location: 'Global' },
    ],
    impacts: [
      { category: 'Global Warming (GWP 100a)', amount: '9200', unit: 'kg CO2-eq', location: 'Global' },
      { category: 'Eutrophication', amount: '3.50', unit: 'kg P-eq', location: 'Regional' },
      { category: 'Acidification', amount: '22.1', unit: 'kg SO2-eq', location: 'Global' },
    ]
  },
  'mock-pla': {
    inputs: [
      { flowName: 'Corn starch', category: 'Resources, agriculture', amount: '1.60', unit: 't', location: 'USA' },
      { flowName: 'Electricity', category: 'From grid', amount: '2.00', unit: 'MWh', location: 'USA' },
      { flowName: 'Enzymes', category: 'Chemicals', amount: '0.050', unit: 't', location: 'Imported' },
    ],
    outputs: [
      { flowName: 'Polylactic acid resin', category: 'Product', amount: '1.00', unit: 't', location: 'Factory' },
      { flowName: 'Wastewater (fermentation)', category: 'Emissions to water', amount: '3.20', unit: 'm3', location: 'Local Treatment' },
      { flowName: 'Organic waste', category: 'Waste', amount: '0.150', unit: 't', location: 'Compost' },
    ],
    impacts: [
      { category: 'Global Warming (GWP 100a)', amount: '1800', unit: 'kg CO2-eq', location: 'Global' },
      { category: 'Land Use', amount: '0.500', unit: 'ha*a', location: 'Regional' },
      { category: 'Eutrophication', amount: '1.10', unit: 'kg P-eq', location: 'Regional' },
    ]
  },
  'mock-nylon': {
    inputs: [
      { flowName: 'Crude oil', category: 'Resources, in ground', amount: '2.50', unit: 't', location: 'Imported' },
      { flowName: 'Natural gas', category: 'Resources, in ground', amount: '1.20', unit: 't', location: 'Regional' },
      { flowName: 'Water (process)', category: 'Resources', amount: '50.0', unit: 'm3', location: 'Local' },
    ],
    outputs: [
      { flowName: 'Nylon 6 resin', category: 'Product', amount: '1.00', unit: 't', location: 'Factory' },
      { flowName: 'Carbon dioxide', category: 'Emissions to air', amount: '3.10', unit: 't', location: 'Global' },
      { flowName: 'Wastewater', category: 'Emissions to water', amount: '45.0', unit: 'm3', location: 'Local Treatment' },
    ],
    impacts: [
      { category: 'Global Warming (GWP 100a)', amount: '6500', unit: 'kg CO2-eq', location: 'Global' },
      { category: 'Fossil fuel depletion', amount: '40.0', unit: 'MJ', location: 'Global' },
      { category: 'Water Depletion', amount: '5.00', unit: 'm3', location: 'Local' },
    ]
  },
  'mock-polyester': {
    inputs: [
      { flowName: 'Crude oil (for PTA)', category: 'Resources', amount: '0.850', unit: 't', location: 'Imported' },
      { flowName: 'Natural gas (for MEG)', category: 'Resources', amount: '0.400', unit: 't', location: 'Regional' },
      { flowName: 'Electricity', category: 'Grid', amount: '0.300', unit: 'MWh', location: 'Regional Grid' },
    ],
    outputs: [
      { flowName: 'Polyester fibers', category: 'Product', amount: '1.00', unit: 't', location: 'Factory' },
      { flowName: 'Carbon dioxide', category: 'Emissions to air', amount: '2.50', unit: 't', location: 'Global' },
      { flowName: 'Wastewater (esterification)', category: 'Emissions to water', amount: '2.00', unit: 'm3', location: 'Local Treatment' },
    ],
    impacts: [
      { category: 'Global Warming (GWP 100a)', amount: '3200', unit: 'kg CO2-eq', location: 'Global' },
      { category: 'Fossil fuel depletion', amount: '35.0', unit: 'MJ', location: 'Global' },
      { category: 'Ecotoxicity', amount: '1.50', unit: 'CTUe', location: 'Regional' },
    ]
  },
  'mock-default': {
    inputs: [
      { flowName: 'Default Raw Material', category: 'Resources', amount: '1.00', unit: 'kg', location: 'Global' },
      { flowName: 'Default Electricity', category: 'Grid', amount: '0.500', unit: 'kWh', location: 'Regional' },
      { flowName: 'Default Water', category: 'Resources', amount: '2.50', unit: 'L', location: 'Local' },
    ],
    outputs: [
      { flowName: 'Default Product', category: 'Product', amount: '1.00', unit: 'kg', location: 'Factory' },
      { flowName: 'Default CO2', category: 'Emissions to air', amount: '1.20', unit: 'kg', location: 'Global' },
      { flowName: 'Default Wastewater', category: 'Emissions to water', amount: '1.00', unit: 'L', location: 'Local' },
    ],
    impacts: [
      { category: 'Global Warming', amount: '12.3', unit: 'kg CO2-eq', location: 'Global' },
      { category: 'Water Use', amount: '2.50', unit: 'L', location: 'Local' },
      { category: 'Sample Impact', amount: '0.010', unit: 'kg-eq', location: 'Global' },
    ],
  }
};

// --- Mock Data for Pro Analysis Card ---
const MOCK_PRODUCT_ANALYSIS = {
  topContributors: [
    { name: 'Component 1 (Steel)', amount: '1500 kgCO2e' },
    { name: 'Component 3 (Aluminum)', amount: '920 kgCO2e' },
    { name: 'Component 2 (PLA)', amount: '180 kgCO2e' },
    { name: 'Transport', amount: '50 kgCO2e' },
    { name: 'End-of-Life', amount: '25 kgCO2e' },
  ],
  suggestions: [
    'Investigate sourcing lower-carbon steel for Component 1.',
    'Explore recycled aluminum options for Component 3.'
  ]
};

// --- Material Name-to-ID Lookup ---
const mockMaterialSuggestions = [
  { name: "Steel", openLcaMaterialId: 'mock-steel' },
  { name: "Stainless Steel", openLcaMaterialId: 'mock-stainless-steel' },
  { name: "Aluminum", openLcaMaterialId: 'mock-aluminum' },
  { name: "Copper", openLcaMaterialId: 'mock-copper' },
  { name: "Glass", openLcaMaterialId: 'mock-glass' },
  { name: "PLA", openLcaMaterialId: 'mock-pla' },
  { name: "ABS Plastic", openLcaMaterialId: 'mock-abs' },
  { name: "Polycarbonate", openLcaMaterialId: 'mock-polycarbonate' },
  { name: "Nylon 6", openLcaMaterialId: 'mock-nylon' },
  { name: "Nylon", openLcaMaterialId: 'mock-nylon' },
  { name: "Polyester Mesh", openLcaMaterialId: 'mock-polyester' },
  { name: "Rubber", openLcaMaterialId: 'mock-rubber' },
];

const materialNameToId = mockMaterialSuggestions.reduce((acc, cur) => {
  acc[cur.name.toLowerCase()] = cur.openLcaMaterialId;
  return acc;
}, {});


const AnalyticsPage = () => {
  const [userId] = useState(localStorage.getItem('userId') || '');
  const [isProUser] = useState(localStorage.getItem('isProUser') === 'true');
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedComponentIndex, setSelectedComponentIndex] = useState(0);
  const [analyticsData, setAnalyticsData] = useState({ inputs: [], outputs: [], impacts: [] });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('inputs');

  const fetchProducts = useCallback(() => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      return;
    }
    try {
      const allProductData = JSON.parse(localStorage.getItem('productData')) || {};
      const userProducts = allProductData[userId] || [];
      setProducts(userProducts);
      setError('');
    } catch (err) {
      console.error("Failed to fetch products from localStorage:", err);
      setError('Could not load product list.');
      setProducts([]);
    }
  }, [userId]);

  const loadAnalyticsForComponent = useCallback((productId, componentIndex) => {
    if (!productId) {
      setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
      return;
    }
    
    setLoadingAnalytics(true);
    setError('');

    const product = products.find(p => p.productId == productId);
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
      setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
      setLoadingAnalytics(false);
      return;
    }
    
    // Use 'ingredient' field (which is the component name)
    const materialName = selectedComponent.ingredient ? selectedComponent.ingredient.toLowerCase() : null;
    const materialId = selectedComponent.materialId || 
                       (materialName ? materialNameToId[materialName] : null);

    setTimeout(() => {
      setError(''); // Clear old errors

      if (materialId && MOCK_ANALYTICS_DATA[materialId]) {
        setAnalyticsData(MOCK_ANALYTICS_DATA[materialId]);
      } else if (selectedComponent.ingredient) {
        setAnalyticsData(MOCK_ANALYTICS_DATA['mock-default']);
        setError(`Showing sample data. No specific analytics for material: ${selectedComponent.ingredient}`);
      } else {
        setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
        setError('This component has no material selected.');
      }
      setLoadingAnalytics(false);
    }, 500);
  }, [products]);
  
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      const firstProductId = products[0].productId;
      setSelectedProductId(firstProductId);
      setSelectedComponentIndex(0);
      loadAnalyticsForComponent(firstProductId, 0);
    }
  }, [products, selectedProductId, loadAnalyticsForComponent]);

  const handleProductChange = (e) => {
    const newProductId = e.target.value;
    setSelectedProductId(newProductId);
    setSelectedComponentIndex(0);
    loadAnalyticsForComponent(newProductId, 0);
  };
  
  const handleComponentSelect = (index) => {
    setSelectedComponentIndex(index);
    loadAnalyticsForComponent(selectedProductId, index);
  };

  const selectedProduct = products.find(p => p.productId == selectedProductId);
  let components = [];
  if (selectedProduct && selectedProduct.dppData) {
    try {
      components = JSON.parse(selectedProduct.dppData);
    } catch (e) {
      console.error("Failed to parse DPP data for tabs");
    }
  }

  const renderTableData = () => {
    let data;
    let headers;

    if (activeAnalysisTab === 'inputs') {
      data = analyticsData.inputs;
      headers = ['Input', 'Category', 'Amount', 'Unit', 'Location'];
    } else if (activeAnalysisTab === 'outputs') {
      data = analyticsData.outputs;
      headers = ['Output', 'Category', 'Amount', 'Unit', 'Location'];
    } else { // impacts
      data = analyticsData.impacts;
      headers = ['Impact Category', 'Amount', 'Unit', 'Location'];
    }

    return (
      <div className="analytics-table-container">
        <table className="analytics-table">
          <thead>
            <tr>
              {headers.map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.flowName || item.category}</td>
                  {headers.length === 5 && <td>{item.category}</td>}
                  <td>{item.amount}</td>
                  <td>{item.unit}</td>
                  <td>{item.location}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="no-data-message">
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
      <div className="sidebar">
        <div className="sidebar-top">
          <button 
            type="button" 
            onClick={() => navigate('/dashboard')}
            className="logo-button" 
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <img src={logoPath} alt="Logo" width="48" style={{ margin: 0, padding: 0, display: 'block' }}/>
          </button>
          <p className ="descriptor">Core Features</p>
          <div className="navbar">
            <button type="button" onClick={() => navigate('/dashboard')} className={`nav ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              <LayoutDashboard /><span>Dashboard</span>
            </button>
            <button type="button" className={`nav ${location.pathname === '/inventory' ? 'active' : ''}`} onClick={() => navigate('/inventory')}>
              <Archive /><span>Inventory</span>
            </button>
            <button type="button" className={`nav ${location.pathname === '/analytics' ? 'active' : ''}`} onClick={() => navigate('/analytics')}>
              <ChartColumnBig /><span>Analytics</span>
            </button>
          </div>
          <p className ="descriptor">Plugins</p>
          <div className = "navbar">
            <button type="button" className={`nav ${location.pathname === '/network' ? 'active' : ''}`} onClick={() => navigate('/network')} disabled={!isProUser}>
              <Network /><span>Network</span>
            </button>
            <button type="button" className={`nav ${location.pathname === '/report' ? 'active' : ''}`} onClick={() => navigate('/report')} disabled={!isProUser}>
              <FileText /><span>Report</span>
            </button>
            <button type="button" className={`nav ${location.pathname === '/chat' ? 'active' : ''}`} onClick={() => navigate('/chat')} disabled={!isProUser}>
              <Sprout /><span>Sprout AI</span>
            </button>
          </div>
        </div>
        <div className="sidebar-bottom">
          <button type="button" className={`nav ${location.pathname === '/settings' ? 'active' : ''}`} onClick={() => navigate("/settings")}>
            <Settings /><span>Settings</span>
          </button>
        </div>
      </div>

      <div className="content-section-main">
        <div className="content-container-main">
          <header className="header-group">
            <h1>Analytics</h1>
            <p className="medium-regular">Breakdown of your products and processes.</p>
          </header>

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
              <button className = "icon">
                <Sparkles />
              </button>
            </div>
          </div>
          
          {error && <div className="submit-error" style={{ marginBottom: '15px'}}>{error}</div>}

          <div className = "sub-header">
            <div className = "header-col">
              <p className='descriptor-medium'>Product Analysis</p>
            </div>
          </div>
          
          <div className="product-analysis-card">
            {!isProUser && (
              <div className="blur-overlay" onClick={() => navigate('/settings')}>
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
                  {/* --- UPDATED: Use 'ingredient' for tab name --- */}
                  {component.ingredient || `Component ${index + 1}`}
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
              <nav className="component-analysis-tabs">
                <button 
                  className={activeAnalysisTab === 'inputs' ? 'active' : ''}
                  onClick={() => setActiveAnalysisTab('inputs')}
                >
                  Inputs
                </button>
                <button 
                  className={activeAnalysisTab === 'outputs' ? 'active' : ''}
                  onClick={() => setActiveAnalysisTab('outputs')}
                >
                  Outputs
                </button>
                <button 
                  className={activeAnalysisTab === 'impacts' ? 'active' : ''}
                  onClick={() => setActiveAnalysisTab('impacts')}
                >
                  Impact Categories
                </button>
              </nav>

              {loadingAnalytics ? (
                <div className="loading-message">Loading analytics data...</div>
              ) : (
                renderTableData()
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;