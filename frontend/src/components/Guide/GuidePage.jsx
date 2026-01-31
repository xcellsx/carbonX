import React, { useState, useEffect, useCallback } from 'react';
import './GuidePage.css';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE = 'http://localhost:8081/api';

function GuidePage() {
  const navigate = useNavigate();
  const [userId] = useState(localStorage.getItem('userId') || '');
  const [fullName] = useState(localStorage.getItem('signupFullName') || '');

  const [products, setProducts] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productName, setProductName] = useState('');
  const [productFile, setProductFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // For DPP modal
  const [showDppModal, setShowDppModal] = useState(false);
  const [currentDpp, setCurrentDpp] = useState('');
  const [activeTask, setActiveTask] = useState(0);

  // Task 2 state
  const [expandedRows, setExpandedRows] = useState({});
  const [subProductWeights, setSubProductWeights] = useState({});
  const [lcaResults, setLcaResults] = useState({});
  const [calculating, setCalculating] = useState({});
  
  // State for saving
  const [saving, setSaving] = useState(false);

  // State for suggestions
  const [editableProcesses, setEditableProcesses] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [activeSuggestionBox, setActiveSuggestionBox] = useState(null);
  const [editableComponents, setEditableComponents] = useState({});

  const fetchProducts = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/inventory/user/${userId}`);
      if (!res.ok) throw new Error(`Server responded with status: ${res.status}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
    }
  }, [userId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
        fetchProducts();
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
          dpp.push({ component: `Component ${dpp.length + 1}`, process: "", weightKg: 0, processId: null, lcaValue: null }); // Added lcaValue
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

    } catch (err) {
      console.error("Save Error:", err);
      alert("Error saving changes: " + err.message);
    }
    setSaving(false);
  };

  if (!userId) {
    return (
      <div style={{ padding: '80px', textAlign: 'center' }}>
        <h3>No user session found. Please log in again.</h3>
        <p>(Make sure 'userId' is set in localStorage after login.)</p>
      </div>
    );
  }

  function formatDpp(currentDpp) {
    if (!currentDpp || currentDpp === '[No DPP stored]') return '[No DPP stored]';
    try {
      let data = currentDpp;
      if (typeof data === 'string' && (data.trim().startsWith('[') || data.trim().startsWith('{'))) {
        data = JSON.parse(data);
      }
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return '[Invalid DPP JSON] ' + String(currentDpp);
    }
  }

  // Helper function to format the total LCA result
  const formatTotalLca = (value) => {
    if (value === null || value === undefined) {
        return '0.000 kgCO₂e'; // Default to 0 if null or undefined
    }
    if (typeof value === 'number') {
        return `${value.toFixed(3)} kgCO₂e`;
    }
    return 'N/A'; // Handle other cases if necessary
  };


  return (
    <div className="guide-container">
      <div className="company-info-back-btn">
        <Link to="/company-info">← Back</Link>
      </div>
      <div className="company-info-logo">
        <img src="src/assets/carbonx.png" alt="Logo" />
      </div>
      <div className="guide-card">
         <header className="guide-header">
           <h1 className="header-title">
             {fullName ? `Welcome, ${fullName}!` : "Welcome!"}
           </h1>
           <div className="header-divider">
             <p className="header-sub">Let's get you onboarded! Complete the following tasks.</p>
             <Link className="skip-link" to="/dashboard">Skip</Link>
           </div>
         </header>
         <div className="task-accordion">
 
           {/* Task 1 */}
           <section className={`task${activeTask === 0 ? ' active' : ''}`}>
             <div className="task-header" onClick={() => setActiveTask(activeTask === 0 ? -1 : 0)}>
               <span>Task 1 of 2 <b>Add a new product into <span className="accent">Inventory</span></b></span>
               <span>{activeTask === 0 ? '▼' : '▶'}</span>
             </div>
             <div className="task-content" style={{ display: activeTask === 0 ? 'block' : 'none' }}>
               <div className="inventory-section">
                 <h3>Inventory</h3>
                 <div className="sub-header-box">
                   <p>Overview of your products.</p>
                   <button className="add-new-btn" onClick={() => setShowAddProduct(true)}>Add New</button>
                 </div>
                 <div className="table-alignment">
                   <table className="inventory-table">
                     <thead>
                       <tr>
                         <th>Product Name</th>
                         <th>Uploaded File</th>
                         <th>View BoM</th>
                         <th>View DPP</th>
                         <th>Total LCA Result</th> {/* <-- ADDED HEADER */}
                       </tr>
                     </thead>
                     <tbody>
                       {products.length === 0 ? (
                         <tr>
                           <td colSpan={5}><div className="no-products-message">Your products will appear here.</div></td> {/* <-- Updated colspan */}
                         </tr>
                       ) : (
                         products.map(p => (
                           <tr key={p.productId}>
                             <td>{p.productName}</td>
                             <td>{p.uploadedFile}</td>
                             <td>
                               {p.uploadedFile ? (
                                 <a
                                   href={`${API_BASE}/inventory/file/${encodeURIComponent(p.uploadedFile)}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="dpp-link"
                                 >View BoM</a>
                               ) : (
                                 <span style={{ color: '#A9A9A9' }}>[No File]</span>
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
                             {/* --- ADDED TOTAL LCA CELL --- */}
                             <td><strong>{formatTotalLca(p.lcaResult)}</strong></td>
                           </tr>
                         ))
                       )}
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
           </section>

          {/* Task 2 */}
          <section className={`task${activeTask === 1 ? ' active' : ''}`}>
            <div className="task-header" onClick={() => setActiveTask(activeTask === 1 ? -1 : 1)}>
              <span>Task 2 of 2 <b>Perform Carbon Calculation & Explore Inventory</b></span>
              <span>{activeTask === 1 ? '▼' : '▶'}</span>
            </div>
            <div className="task-content" style={{ display: activeTask === 1 ? 'block' : 'none' }}>
              <div className="inventory-section">
                <h3>Inventory with LCA Calculation</h3>
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Product Name</th>
                      <th>Uploaded File</th>
                      <th>View BoM</th>
                      <th>View DPP</th>
                      <th>Total LCA Result</th> {/* <-- ADDED HEADER */}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const dpp = p.dppData &&
                        (typeof p.dppData === 'string' ? JSON.parse(p.dppData) : p.dppData);

                      return (
                        <React.Fragment key={p.productId}>
                          <tr>
                            <td>
                              <button onClick={() => setExpandedRows(prev => ({
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
                                  className="dpp-link"
                                >View BoM</a>
                              ) : <span style={{ color: '#A9A9A9' }}>[No File]</span>}
                            </td>
                            <td>
                              <button className="dpp-link"
                                onClick={() => {
                                  setShowDppModal(true);
                                  setCurrentDpp(p.dppData || '[No DPP stored]');
                                }}>
                                View DPP
                              </button>
                            </td>
                            {/* --- ADDED TOTAL LCA CELL --- */}
                            <td><strong>{formatTotalLca(p.lcaResult)}</strong></td>
                          </tr>
                          {expandedRows[p.productId] && dpp && Array.isArray(dpp) && (
                            <tr>
                              {/* --- Updated colspan --- */}
                              <td colSpan={6}> 
                                <table style={{ width: "100%" }}>
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
                                      const lcaValue = item.lcaValue !== undefined ? item.lcaValue : lcaResults[key];
                                      
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

                                        <td>{item.weightKg}</td>
                                        
                                        <td>
                                          <input
                                            type="number"
                                            value={subProductWeights[key] ?? item.weightKg}
                                            min={0}
                                            step={0.01}
                                            onChange={e => setSubProductWeights(prev => ({
                                              ...prev,
                                              [key]: e.target.value
                                            }))}
                                            onBlur={(e) => handleWeightBlur(e, p, idx)}
                                            style={{ width: 60 }}
                                          />
                                        </td>
                                        
                                        <td>
                                          <strong>
                                            {(() => {
                                                if (lcaValue === undefined) {
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

                                              console.log(`[LCA Request ${key}] Sending:`, { 
                                                process: processIdentifier, 
                                                weight: weightToSend 
                                              });

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
                                                
                                                console.log(`[LCA Response ${key}] Received value:`, value);
                                                
                                                setLcaResults(prev => ({ ...prev, [key]: value })); // Set temp state

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
                                                setLcaResults(prev => ({ ...prev, [key]: "Error" }));
                                              }
                                              setCalculating(prev => ({ ...prev, [key]: false }));
                                            }}
                                          >{calculating[key] ? "Calculating..." : "Calculate LCA"}</button>
                                        </td>
                                      </tr>
                                    )})}
                                  </tbody>
                                </table>
                                {/* --- Buttons Container --- */}
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
          </section>
        </div>
        <footer className="guide-footer">
           <button id="dashboardButton" className="active" onClick={() => navigate('/dashboard')}>
             Go to Dashboard
           </button>
         </footer>
         {/* Add Product Modal */}
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
                   <span>{productFile ? productFile.name : 'Click or drag file'}</span>
                 </div>
                 <button type="submit" className="create-dpp-btn" disabled={uploading}>
                   {uploading ? "Uploading..." : "Create Product"}
                 </button>
               </form>
             </div>
           </div>
         )}
         {/* DPP Modal */}
         {showDppModal && (
           <div className="modal-overlay active" onClick={() => setShowDppModal(false)}>
             <div className="modal-content" onClick={e => e.stopPropagation()}>
               <div className="modal-header">
                 <h2>DPP Data</h2>
                 <button className="close-modal-btn" onClick={() => setShowDppModal(false)}>&times;</button>
               </div>
               <pre style={{
                 maxWidth: "650px",
                 overflow: "auto",
                 whiteSpace: "pre-wrap",
                 wordBreak: "break-all"
               }}>
                 {formatDpp(currentDpp)}
               </pre>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}

export default GuidePage;