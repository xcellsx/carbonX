import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom'; // Keep NavLink import
import './InventoryPage.css';

const API_BASE = 'http://localhost:8080/api';

const InventoryPage = () => {
  const [userId] = useState(localStorage.getItem('userId') || '');
  // State for user data (needed for sidebar)
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true); // Added for sidebar loading

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // State from GuidePage.jsx (keep as is)
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productName, setProductName] = useState('');
  const [productFile, setProductFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDppModal, setShowDppModal] = useState(false);
  const [currentDpp, setCurrentDpp] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [subProductWeights, setSubProductWeights] = useState({});
  const [lcaResults, setLcaResults] = useState({});
  const [calculating, setCalculating] = useState({});
  const [saving, setSaving] = useState(false);
  const [editableProcesses, setEditableProcesses] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [activeSuggestionBox, setActiveSuggestionBox] = useState(null);
  const [editableComponents, setEditableComponents] = useState({});

  // Fetch User Profile Data (Copied from DashboardPage.jsx for sidebar)
  const fetchUserProfile = useCallback(async () => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/profile`);
      if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }
      const profile = await res.json();

      setUserName(profile.fullName || 'User');
      setCompanyName(profile.companyName || 'Company');

      let initials = 'U';
      if (profile.fullName) {
        const nameParts = profile.fullName.split(' ');
        initials = (nameParts[0].charAt(0) + (nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : '')).toUpperCase();
      }
      setUserInitials(initials);
      // Don't clear main error state here, keep profile loading separate
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Set defaults on error, maybe a specific profile error state?
      setUserName('User');
      setCompanyName('Company');
      setUserInitials('U');
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);


  const fetchProducts = useCallback(async () => {
    if (!userId) {
      setError('No user session found. Please log in.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/inventory/user/${userId}`);
      if (!res.ok) throw new Error(`Server responded with status: ${res.status}`);
      const data = await res.json();
      setProducts(data);
      setError('');
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError('Could not load inventory data.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserProfile(); // Fetch profile for sidebar
    fetchProducts();
  }, [fetchUserProfile, fetchProducts]); // Updated dependencies

  // Handle "Add New" form submission
  const handleAddProduct = async e => {
    e.preventDefault();
    if (!productName || !productFile || !userId) {
      alert('Product name, BoM file, and user session required!');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('productName', productName);
    formData.append('file', productFile);
    try {
      const res = await fetch(`${API_BASE}/inventory/bom-upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setShowAddProduct(false);
        setProductName('');
        setProductFile(null);
        fetchProducts(); // Refresh the list
      } else {
        const errorText = await res.text();
        console.error("Product creation failed:", res.status, errorText);
        alert('Product creation failed!');
      }
    } catch (err) {
      console.error("Network error during product add:", err);
      alert('Network error');
    }
    setUploading(false);
  };

  // Handle product deletion
  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/inventory/${productId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Remove product from local state for instant UI update
        setProducts(prevProducts => prevProducts.filter(p => p.productId !== productId));
      } else {
        alert('Failed to delete product.');
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert('Error connecting to server.');
    }
  };

  // --- Handlers from GuidePage.jsx (keep as is) ---
  const handleProcessChange = async (e, p, idx) => {
    const key = `${p.productId}_${idx}`;
    const query = e.target.value;
    setEditableProcesses(prev => ({ ...prev, [key]: query }));
    setActiveSuggestionBox(key);
    setProducts(currentProducts => {
      return currentProducts.map(prod => {
        if (prod.productId === p.productId) {
          let dpp = JSON.parse(prod.dppData);
          dpp[idx].process = query;
          dpp[idx].processId = null;
          return { ...prod, dppData: JSON.stringify(dpp) };
        }
        return prod;
      });
    });
    if (query.length < 2) {
      setSuggestions(prev => ({ ...prev, [key]: [] }));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/products?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(prev => ({ ...prev, [key]: data }));
      }
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    }
  };

  const handleSuggestionClick = (p, idx, suggestion) => {
    const key = `${p.productId}_${idx}`;
    setProducts(currentProducts => {
      return currentProducts.map(prod => {
        if (prod.productId === p.productId) {
          let dpp = JSON.parse(prod.dppData);
          dpp[idx].process = suggestion.name;
          dpp[idx].processId = suggestion.openLcaProcessId;
          return { ...prod, dppData: JSON.stringify(dpp) };
        }
        return prod;
      });
    });
    setEditableProcesses(prev => ({ ...prev, [key]: undefined }));
    setSuggestions(prev => ({ ...prev, [key]: [] }));
    setActiveSuggestionBox(null);
  };

  const handleComponentChange = (e, p, idx) => {
    const key = `${p.productId}_${idx}`;
    const newName = e.target.value;
    setEditableComponents(prev => ({ ...prev, [key]: newName }));
  };

  const handleComponentBlur = (p, idx) => {
    const key = `${p.productId}_${idx}`;
    const newName = editableComponents[key];
    if (newName === undefined) return;
    setProducts(currentProducts => {
      return currentProducts.map(prod => {
        if (prod.productId === p.productId) {
          let dpp = JSON.parse(prod.dppData);
          dpp[idx].component = newName;
          return { ...prod, dppData: JSON.stringify(dpp) };
        }
        return prod;
      });
    });
    setEditableComponents(prev => ({ ...prev, [key]: undefined }));
  };

  const handleAddSubcomponent = (productId) => {
    setProducts(currentProducts => {
      return currentProducts.map(prod => {
        if (prod.productId === productId) {
          let dpp = [];
          if (prod.dppData) {
              try { dpp = JSON.parse(prod.dppData); } catch (e) {}
          }
          dpp.push({ component: `Component ${dpp.length + 1}`, process: "", weightKg: 0, processId: null, lcaValue: null });
          return { ...prod, dppData: JSON.stringify(dpp) };
        }
        return prod;
      });
    });
  };

  const handleWeightBlur = (e, p, idx) => {
    const key = `${p.productId}_${idx}`;
    const newWeight = Number(e.target.value);
    setSubProductWeights(prev => ({ ...prev, [key]: newWeight }));
    setProducts(currentProducts => {
      return currentProducts.map(prod => {
        if (prod.productId === p.productId) {
          try {
            let dpp = JSON.parse(prod.dppData);
            dpp[idx].weightKg = newWeight;
            return { ...prod, dppData: JSON.stringify(dpp) };
          } catch (err) {
            console.error("Failed to parse DPP data for weight update", err);
            return prod;
          }
        }
        return prod;
      });
    });
  };

  const handleSaveDpp = async (productId) => {
    setSaving(true);
    const productToSave = products.find(p => p.productId === productId);
    if (!productToSave) {
      alert("Error: Could not find product to save.");
      setSaving(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/inventory/dpp/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: productToSave.dppData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save changes.");
      }
      alert("Save successful!");
      // Refetch to get the updated lcaResult on the main product
      fetchProducts();
    } catch (err) {
      console.error("Save Error:", err);
      alert("Error saving changes: " + err.message);
    }
    setSaving(false);
  };

  // --- Helper Functions ---

  const formatDpp = (dppData) => {
    if (!dppData || dppData === '[No DPP stored]') return '[No DPP stored]';
    try {
      let data = dppData;
      if (typeof data === 'string' && (data.trim().startsWith('[') || data.trim().startsWith('{'))) {
        data = JSON.parse(data);
      }
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return '[Invalid DPP JSON] ' + String(dppData);
    }
  };

  const formatTotalLca = (value) => {
    if (value === null || value === undefined) {
      return '0.000 kgCO₂e';
    }
    return `${value.toFixed(3)} kgCO₂e`;
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-layout"> {/* Use dashboard layout class */}
      {/* --- START OF REPLACEMENT --- */}
      <div className="sidebar">
        <div className="sidebar-top">
          <div className="logo">
            <picture>
              <source srcSet="/src/assets/carbonx.png" media="(prefers-color-scheme: dark)" /> {/* Adjusted path */}
              <img src="/src/assets/carbonx.png" alt="Logo" width="30" /> {/* Adjusted path */}
            </picture>
          </div>
          <nav className="nav-menu">
            <NavLink to="/dashboard" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>Dashboard</span>
            </NavLink>
             <NavLink to="/inventory" className="nav-item"> {/* NavLink automatically adds 'active' class */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              <span>Inventory</span>
            </NavLink>
            {/* Add other NavLinks similarly */}
            <NavLink to="/analytics" className="nav-item">
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
          {/* Settings link removed from nav-menu */}
          <NavLink to="/settings" className="user-profile"> {/* Make profile area a link */}
            <div className="user-avatar">{loadingProfile ? '...' : userInitials}</div>
            <div className="user-info">
              <div className="name">{loadingProfile ? 'Loading...' : userName}</div>
              <div className="company">{loadingProfile ? 'Loading...' : companyName}</div>
            </div>
          </NavLink>
        </div>
      </div>
      {/* --- END OF REPLACEMENT --- */}

      {/* Main Content */}
      <div className="main-content">
        <header className="dashboard-header"> {/* Use dashboard header class */}
          <h1>Inventory</h1>
          <p>Overview of your products.</p>
        </header>

        {error && <div className="error-message">{error}</div>} {/* Display errors */}

        <div className="inventory-controls">
          <div className="search-bar">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="add-new-btn-inventory" onClick={() => setShowAddProduct(true)}>
            Add New
          </button>
        </div>

        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th></th>{/* Expander */}
                <th>Product Name</th>
                <th>Uploaded File</th>
                <th>View BoM</th>
                <th>View DPP</th>
                <th>Total LCA Result</th>
                <th>Actions</th>{/* Delete */}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7}>Loading...</td></tr>}
              {!loading && !error && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="no-products-message">
                      {searchQuery ? 'No products match your search.' : 'Your products will appear here.'}
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !error && filteredProducts.map(p => {
                const dpp = p.dppData &&
                  (typeof p.dppData === 'string' ? JSON.parse(p.dppData) : p.dppData);

                return (
                  <React.Fragment key={p.productId}>
                    {/* Main Row */}
                    <tr>
                      <td>
                        <button className="expand-btn" onClick={() => setExpandedRows(prev => ({
                          ...prev, [p.productId]: !prev[p.productId]
                        }))}>
                          {expandedRows[p.productId] ? '▼' : '▶'}
                        </button>
                      </td>
                      <td>{p.productName}</td>
                      <td>{p.uploadedFile}</td>
                      <td>
                        {p.uploadedFile ? (
                          <a
                            href={`${API_BASE}/inventory/file/${encodeURIComponent(p.uploadedFile)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="view-file-btn"
                          >View BoM</a>
                        ) : (
                          <span className="no-file-text">[No File]</span>
                        )}
                      </td>
                      <td>
                        <button className="dpp-link" onClick={() => {
                          setShowDppModal(true);
                          setCurrentDpp(p.dppData || '[No DPP stored]');
                        }}>
                          View DPP
                        </button>
                      </td>
                      <td><strong>{formatTotalLca(p.lcaResult)}</strong></td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(p.productId)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {expandedRows[p.productId] && dpp && Array.isArray(dpp) && (
                      <tr className="sub-table-row">
                        <td colSpan={7}>
                          <div className="sub-table-container">
                            <table className="sub-inventory-table">
                              <thead>
                                <tr>
                                  <th>Subcomponent</th>
                                  <th>Process</th>
                                  <th>Weight (kg)</th>
                                  <th>New Weight</th>
                                  <th>LCA Output</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {dpp.map((item, idx) => {
                                  const key = `${p.productId}_${idx}`;
                                  const lcaValue = item.lcaValue; // Use value from saved dppData

                                  return (
                                  <tr key={idx}>
                                    <td>
                                        <input
                                          type="text"
                                          className="suggestion-input"
                                          value={editableComponents[key] ?? item.component}
                                          onChange={(e) => handleComponentChange(e, p, idx)}
                                          onBlur={() => handleComponentBlur(p, idx)}
                                          placeholder="Component name"
                                        />
                                    </td>

                                    <td>
                                      <div className="suggestion-box">
                                        <input
                                          type="text"
                                          className="suggestion-input"
                                          value={editableProcesses[key] ?? item.process}
                                          onChange={(e) => handleProcessChange(e, p, idx)}
                                          onBlur={() => setTimeout(() => setActiveSuggestionBox(null), 150)}
                                          onFocus={() => {
                                            setActiveSuggestionBox(key);
                                            if (!item.process) {
                                                handleProcessChange({ target: { value: '' }}, p, idx);
                                            }
                                          }}
                                          placeholder="Type to search process..."
                                        />
                                        {activeSuggestionBox === key && suggestions[key] && suggestions[key].length > 0 && (
                                          <div className="suggestion-dropdown">
                                            {suggestions[key].map((sug, sugIdx) => (
                                              <div
                                                key={sug.openLcaProcessId || sugIdx}
                                                className="suggestion-item"
                                                onMouseDown={() => handleSuggestionClick(p, idx, sug)}
                                              >
                                                {sug.name}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </td>

                                    <td>{item.weightKg.toFixed(2)}</td>

                                    <td>
                                      <input
                                        type="number"
                                        className="weight-input"
                                        value={subProductWeights[key] ?? item.weightKg}
                                        min={0}
                                        step={0.01}
                                        onChange={e => setSubProductWeights(prev => ({
                                          ...prev,
                                          [key]: e.target.value
                                        }))}
                                        onBlur={(e) => handleWeightBlur(e, p, idx)}
                                      />
                                    </td>

                                    <td>
                                      <strong>
                                        {(() => {
                                            if (lcaValue === undefined || lcaValue === null) {
                                                return 'Not calculated';
                                            }
                                            if (typeof lcaValue === 'number') {
                                                return `${lcaValue.toFixed(3)} kgCO₂e`;
                                            }
                                            return lcaValue;
                                        })()}
                                      </strong>
                                    </td>

                                    <td>
                                      <button
                                        className="calculate-lca-btn"
                                        disabled={calculating[key] || !(item.processId || item.process)}
                                        onClick={async () => {
                                          setCalculating(prev => ({ ...prev, [key]: true }));

                                          const processIdentifier = item.processId || item.process;
                                          const newWeightString = subProductWeights[key];

                                          const weightToSend = (newWeightString !== undefined && newWeightString !== null && newWeightString !== "")
                                            ? Number(newWeightString)
                                            : item.weightKg;

                                          try {
                                            const res = await fetch(`${API_BASE}/openlca/calculate`, {
                                              method: "POST",
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                inventoryId: p.productId,
                                                components: [{
                                                  processId: processIdentifier,
                                                  weight: weightToSend,
                                                }],
                                              }),
                                            });

                                            if (!res.ok) {
                                              const errorData = await res.json();
                                              throw new Error(errorData.message || "Calculation failed");
                                            }

                                            const data = await res.json();
                                            const value = data.results?.[0]?.lcaValue;

                                            // Set permanent state in dppData
                                            setProducts(currentProducts => {
                                              return currentProducts.map(prod => {
                                                if (prod.productId === p.productId) {
                                                  try {
                                                    let dpp = JSON.parse(prod.dppData);
                                                    dpp[idx].lcaValue = value;
                                                    return { ...prod, dppData: JSON.stringify(dpp) };
                                                  } catch(err) { return prod; }
                                                }
                                                return prod;
                                              });
                                            });

                                          } catch (err) {
                                            console.error(`[LCA Error ${key}]`, err);
                                            alert("LCA Calculation Error: " + err.message);
                                          }
                                          setCalculating(prev => ({ ...prev, [key]: false }));
                                        }}
                                      >{calculating[key] ? "..." : "Calculate LCA"}</button>
                                    </td>
                                  </tr>
                                )})}
                              </tbody>
                            </table>

                            <div className="subcomponent-buttons-container">
                              <button
                                className="add-subcomponent-yellow-btn"
                                onClick={() => handleAddSubcomponent(p.productId)}
                              >
                                + Add Subcomponent
                              </button>
                              <button
                                className="save-navy-btn"
                                disabled={saving}
                                onClick={() => handleSaveDpp(p.productId)}
                              >
                                {saving ? "Saving..." : "Save Product Changes"}
                              </button>
                            </div>
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

      {/* Add Product Modal (keep as is) */}
      {showAddProduct && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add a New Product</h2>
              <button className="close-modal-btn" onClick={() => setShowAddProduct(false)}>&times;</button>
            </div>
            <form id="addProductForm" onSubmit={handleAddProduct}>
              <div className="form-group">
                <label htmlFor="productName">Product Name</label>
                <input
                  type="text"
                  id="productName"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>BoM File (CSV)</label>
                <input
                  type="file"
                  id="fileUpload"
                  className="file-input"
                  accept=".csv"
                  onChange={e => setProductFile(e.target.files[0])}
                  required
                />
                <span className="file-name-display">{productFile ? productFile.name : 'Click or drag file'}</span>
              </div>
              <button type="submit" className="create-dpp-btn" disabled={uploading}>
                {uploading ? "Uploading..." : "Create Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DPP Modal (keep as is) */}
      {showDppModal && (
        <div className="modal-overlay active" onClick={() => setShowDppModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>DPP Data</h2>
              <button className="close-modal-btn" onClick={() => setShowDppModal(false)}>&times;</button>
            </div>
            <pre className="dpp-modal-pre">
              {formatDpp(currentDpp)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;