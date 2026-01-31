import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import './AnalyticsPage.css';

const API_BASE = 'http://localhost:8081/api';

const AnalyticsPage = () => {
  // --- State for User Profile (from InventoryPage) ---
  const [userId] = useState(localStorage.getItem('userId') || '');
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  // --- State for Analytics Page ---
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedComponentIndex, setSelectedComponentIndex] = useState(0);
  const [analyticsData, setAnalyticsData] = useState({ inputs: [], outputs: [], impacts: [] });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');

  // --- Fetch User Profile (for Sidebar) ---
  const fetchUserProfile = useCallback(async () => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/profile`);
      if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
      const profile = await res.json();
      setUserName(profile.fullName || 'User');
      setCompanyName(profile.companyName || 'Company');
      let initials = 'U';
      if (profile.fullName) {
        const nameParts = profile.fullName.split(' ');
        initials = (nameParts[0].charAt(0) + (nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : '')).toUpperCase();
      }
      setUserInitials(initials);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setUserName('User');
      setCompanyName('Company');
      setUserInitials('U');
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  // --- Fetch Product List (for Dropdown) ---
  const fetchProducts = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/inventory/user/${userId}`);
      if (!res.ok) throw new Error(`Server responded with status: ${res.status}`);
      const data = await res.json();
      setProducts(data);
      setError('');
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError('Could not load product list.');
      setProducts([]);
    }
  }, [userId]);

  // --- Fetch Analytics Data (for Tables) ---
  // *** This function is no longer called directly, but kept for reference ***
  const fetchAnalyticsData = useCallback(async (productId, componentIndex) => {
    if (!productId) {
      setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
      return;
    }
    setLoadingAnalytics(true);
    setError('');

    // --- Find the selected component ---
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
      // This can happen if dppData is empty.
      setLoadingAnalytics(false);
      setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
      return;
    }

    // Get the process identifier (UUID or Name) and weight
    const { processId, process, weightKg } = selectedComponent;
    const identifier = processId || process; // Use UUID if available, else fall back to name
    const weight = weightKg || 0;

    if (!identifier) {
      setError('Selected component has no process defined.');
      setLoadingAnalytics(false);
      return;
    }

    // --- Create URL-friendly parameters ---
    const params = new URLSearchParams({
      processIdentifier: identifier,
      weight: weight
    });

    try {
      // --- Call new backend endpoints ---
      const [flowsRes, impactsRes] = await Promise.all([
         fetch(`${API_BASE}/analytics/flows?${params.toString()}`),
         fetch(`${API_BASE}/analytics/impacts?${params.toString()}`)
      ]);

      if (!flowsRes.ok) throw new Error(`Failed to fetch flows: ${await flowsRes.text()}`);
      if (!impactsRes.ok) throw new Error(`Failed to fetch impacts: ${await impactsRes.text()}`);

      const rawFlows = await flowsRes.json();
      const rawImpacts = await impactsRes.json();

      // --- Process data just like in openlcav2.html ---
      // 1. Process Flows (Inputs/Outputs)
      const inputs = [];
      const outputs = [];
      if (Array.isArray(rawFlows)) {
        rawFlows.forEach(flow => {
          if (flow.enviFlow) {
             // --- EDIT START: Filter out 0 values ---
             const amountValue = parseFloat(flow.amount || 0);
             if (amountValue !== 0) {
                const item = {
                  flowName: flow.enviFlow.flow?.name || 'Unknown',
                  category: flow.enviFlow.flow?.category || '-',
                  amount: amountValue.toPrecision(3),
                  unit: flow.enviFlow.flow?.refUnit || 'unit'
                };
                if (flow.enviFlow.isInput) {
                  inputs.push(item);
                } else {
                  outputs.push(item);
                }
             }
             // --- EDIT END ---
          }
        });
      }

      // 2. Process Impacts
      const impacts = [];
      if (Array.isArray(rawImpacts)) {
        rawImpacts.forEach(impact => {
          if (impact.impactCategory) {
            // --- EDIT START: Filter out 0 values ---
            const amountValue = parseFloat(impact.amount || 0);
            if (amountValue !== 0) {
                impacts.push({
                  category: impact.impactCategory.name || 'Unknown',
                  amount: amountValue.toPrecision(3),
                  unit: impact.impactCategory.refUnit || 'unit'
                });
            }
            // --- EDIT END ---
          }
        });
      }

      setAnalyticsData({ inputs, outputs, impacts });

    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(`Could not load analytics data: ${err.message}`);
      setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
    } finally {
      setLoadingAnalytics(false);
    }
  }, [products]); // depends on 'products' to find component data

  // --- Initial Data Load ---
  useEffect(() => {
    fetchUserProfile();
    fetchProducts();
  }, [fetchUserProfile, fetchProducts]);

  // --- Handle Product Selection ---
  const handleProductChange = (e) => {
    const newProductId = e.target.value;
    setSelectedProductId(newProductId);
    setSelectedComponentIndex(0); // Reset to the first component
    
    if (newProductId) {
      // We must pass 'products' here manually because state update is async
      const allProducts = products; 
      const product = allProducts.find(p => p.productId == newProductId);
      if (product && product.dppData) {
         try {
           const components = JSON.parse(product.dppData);
           if (components.length > 0) {
             // Pass 'allProducts' to the fetcher so it can find the product
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
      setAnalyticsData({ inputs: [], outputs: [], impacts: [] }); // Clear data
    }
  };

  // --- Wrapper function to pass 'products' state to fetcher ---
  // This is needed because the 'products' state might not be updated
  // immediately when handleProductChange is called.
  const fetchAnalyticsDataForProduct = async (productId, componentIndex, currentProducts) => {
    if (!productId) {
      setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
      return;
    }
    setLoadingAnalytics(true);
    setError('');

    const product = currentProducts.find(p => p.productId == productId);
    // ... (rest of the logic from fetchAnalyticsData) ...
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

    const { processId, process, weightKg } = selectedComponent;
    const identifier = processId || process;
    const weight = weightKg || 0;

    if (!identifier) {
      setError('Selected component has no process defined.');
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

      const inputs = [];
      const outputs = [];
      if (Array.isArray(rawFlows)) {
        rawFlows.forEach(flow => {
          if (flow.enviFlow) {
             // --- This check for Flows (Inputs/Outputs) remains ---
             const amountValue = parseFloat(flow.amount || 0);
             if (amountValue !== 0) {
               const item = {
                flowName: flow.enviFlow.flow?.name || 'Unknown',
                category: flow.enviFlow.flow?.category || '-',
                amount: amountValue.toPrecision(3),
                unit: flow.enviFlow.flow?.refUnit || 'unit'
              };
              if (flow.enviFlow.isInput) {
                inputs.push(item);
              } else {
                outputs.push(item);
              }
            }
            // --- End of check for Flows ---
          }
        });
      }

      const impacts = [];
      if (Array.isArray(rawImpacts)) {
        rawImpacts.forEach(impact => {
          if (impact.impactCategory) {
            // --- EDIT: Removing the filter for Impact Categories ---
            const amountValue = parseFloat(impact.amount || 0);
            // if (amountValue !== 0) { // <-- This check is REMOVED
              impacts.push({
                category: impact.impactCategory.name || 'Unknown',
                amount: amountValue.toPrecision(3),
                unit: impact.impactCategory.refUnit || 'unit'
              });
            // } // <-- This check is REMOVED
            // --- END OF EDIT ---
          }
        });
      }


      setAnalyticsData({ inputs, outputs, impacts });

    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(`Could not load analytics data: ${err.message}`);
      setAnalyticsData({ inputs: [], outputs: [], impacts: [] });
    } finally {
      setLoadingAnalytics(false);
    }
  };
  
  // --- NEW: Handle Component Tab Selection ---
  const handleComponentSelect = (index) => {
    setSelectedComponentIndex(index);
    fetchAnalyticsDataForProduct(selectedProductId, index, products);
  };

  const isLoading = loadingProfile;

  // --- Helper to get components for rendering ---
  const selectedProduct = products.find(p => p.productId == selectedProductId);
  let components = [];
  if (selectedProduct && selectedProduct.dppData) {
    try {
      components = JSON.parse(selectedProduct.dppData);
    } catch (e) {
      console.error("Failed to parse DPP data for tabs");
    }
  }

  return (
    <div className="dashboard-layout">
      {/* --- Sidebar (Unchanged) --- */}
      <div className="sidebar">
        <div className="sidebar-top">
          <div className="logo">
            <picture>
              <source srcSet="/src/assets/carbonx.png" media="(prefers-color-scheme: dark)" />
              <img src="/src/assets/carbonx.png" alt="Logo" width="30" />
            </picture>
          </div>
          <nav className="nav-menu">
            <NavLink to="/dashboard" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/inventory" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              <span>Inventory</span>
            </NavLink>
            <NavLink to="/analytics" className="nav-item active">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              <span>Analytics</span>
            </NavLink>
            <NavLink to="/network" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>Network</span>
            </NavLink>
            <NavLink to="/report" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>Report</span>
            </NavLink>
            <NavLink to="/chat" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span>AI Chat</span>
            </NavLink>
          </nav>
        </div>
        <div className="sidebar-bottom">
          <NavLink to="/settings" className="user-profile">
            <div className="user-avatar">{isLoading ? '...' : userInitials}</div>
            <div className="user-info">
              <div className="name">{isLoading ? 'Loading...' : userName}</div>
              <div className="company">{isLoading ? 'Loading...' : companyName}</div>
            </div>
          </NavLink>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Analytics</h1>
          <p>Breakdown of your products and processes.</p>
        </header>

        {error && <div className="error-message" style={{color: 'red', marginBottom: '15px'}}>{error}</div>}

        {/* --- Product Selector --- */}
        <div className="product-selector-container">
          <label htmlFor="product-select">Select your product:</label>
          <select 
            id="product-select" 
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
        </div>

        {/* --- Component Tabs --- */}
        {selectedProductId && components.length > 0 && (
          <nav className="component-tabs">
            {components.map((component, index) => (
              <button
                key={index}
                className={`component-tab-btn ${index === selectedComponentIndex ? 'active' : ''}`}
                onClick={() => handleComponentSelect(index)}
              >
                {component.component || `Component ${index + 1}`}
              </button>
            ))}
          </nav>
        )}

        {/* --- Analytics Cards --- */}
        {loadingAnalytics ? (
          <div className="loading-message">Loading analytics data...</div>
        ) : (
          selectedProductId && (
            <div className="analytics-grid">
              {/* --- Inputs Card --- */}
              <div className="analytics-card">
                <h3>Inputs</h3>
                <div className="analytics-table-container">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Flow Name</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.inputs.length > 0 ? (
                        analyticsData.inputs.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.flowName}</td>
                            <td>{item.category}</td>
                            <td>{item.amount}</td>
                            <td>{item.unit}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="no-data-message">No input data available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* --- Outputs Card --- */}
              <div className="analytics-card">
                <h3>Outputs</h3>
                <div className="analytics-table-container">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Flow Name</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.outputs.length > 0 ? (
                        analyticsData.outputs.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.flowName}</td>
                            <td>{item.category}</td>
                            <td>{item.amount}</td>
                            <td>{item.unit}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="no-data-message">No output data available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* --- Impact Category Card --- */}
              <div className="analytics-card">
                <h3>Impact Category</h3>
                <div className="analytics-table-container">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Impact Category</th>
                        <th>Amount</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.impacts.length > 0 ? (
                        analyticsData.impacts.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.category}</td>
                            <td>{item.amount}</td>
                            <td>{item.unit}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="no-data-message">No impact data available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;


