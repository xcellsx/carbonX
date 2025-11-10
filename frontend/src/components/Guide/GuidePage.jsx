import React, { useState, useEffect, useCallback } from 'react';
import './GuidePage.css';
import { useNavigate, Link } from 'react-router-dom';
import Lottie from 'lottie-react';
import animationData from '../../lottie/logo.json';
import { ChevronDown, Plus, Search, Triangle, Trash2, X } from 'lucide-react';

// const API_BASE = 'http://localhost:8080/api'; // <-- Logic

function GuidePage() {
  const navigate = useNavigate();

  // --- Real State ---
  const [products, setProducts] = useState([]); 
  const [productName, setProductName] = useState('');
  const [productFile, setProductFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showDppModal, setShowDppModal] = useState(false);
  const [activeTask, setActiveTask] = useState(-1); // Starts closed
  const [currentDpp, setCurrentDpp] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // --- State for Collapsible Rows ---
  const [expandedRows, setExpandedRows] = useState({}); // Default {} = all collapsed

  // --- Mock/Hard-coded states for UI Mockup ---
  const fullName = "Test User";
  const calculating = {}; // Mock
  const saving = false; // Mock
  
  // --- Helper Functions ---
  function formatDpp(dpp) { 
    if (!dpp) return "";
    if (typeof dpp === 'string' && !dpp.startsWith('{')) {
      try { return JSON.stringify(JSON.parse(dpp), null, 2) } catch(e) { return dpp; }
    }
    return dpp;
  }
  
  const formatTotalLca = (value) => value ? `${value.toFixed(3)} kgCO₂e` : '0.000 kgCO₂e';

  // Mock a submit handler that ADDS FAKE DATA
  const handleAddProduct = (e) => {
    e.preventDefault();
    
    const fakeProductToAdd = {
      productId: products.length + 1,
      productName: `Sample Product ${products.length + 1}`,
      uploadedFile: 'BoM_Sample.csv',
      dppData: JSON.stringify([
        { component: "Component A (Material)", process: "Process A", weightKg: 10, processId: 'p1', lcaValue: 1.234 },
        { component: "Component B (Material)", process: "Process B", weightKg: 5, processId: 'p2', lcaValue: 0.567 }
      ]),
      lcaResult: 1.801
    };
    setProducts(currentProducts => [...currentProducts, fakeProductToAdd]);
    setShowAddProduct(false);
    setProductName('');
    setProductFile(null);
  };

  // Filtering logic
  const filteredProducts = products.filter(p =>
    p.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Function to toggle collapsible rows ---
  const toggleRow = (productId) => {
    setExpandedRows(prevExpandedRows => ({
      ...prevExpandedRows,
      [productId]: !prevExpandedRows[productId] // Toggles the boolean value
    }));
  };

  return (
    <div className="onboarding-container">
      <div className="logo-animation">
        <Lottie animationData={animationData} style={{ height: 48, width: 48 }} />
      </div>
      <div className="content-container">
        <div className = "guide-container">
          <div className ="guide-content">
            <div className="form=header">
              <h1>{fullName ? `Welcome, ${fullName}!` : "Welcome!"}</h1>
              <p className="medium-regular">Let's get you onboarded! Complete the following tasks.</p>
            </div>
            <div className="task-accordion">
              {/* --- TASK 1 --- */}
              <div className = "tasks">
                <div 
                  className={`task-header top${activeTask === 0 ? ' active' : ''}`}
                  onClick={() => setActiveTask(activeTask === 0 ? -1 : 0)}
                  style={{ cursor: 'pointer' }}
                > 
                  <p className = "normal-bold">Task 1: Add a product into Inventory</p>
                  <ChevronDown />
                </div>
                <div className = "inventory-content">
                  <div className = "form-header"> 
                    <h4 style = {{color: "rgba(var(--primary"}}>Inventory</h4>
                    <p className = "small-regular">Overview of your products.</p>
                  </div>
                  <div className = "table-header-content">
                    <p style = {{color: "rgba(var(--grey), 1)"}} className = "small-regular">Showing {filteredProducts.length} of {products.length} products</p>
                    <div className = "button-container">
                      <div className = "input-base search-bar"><Search size = {14}/>
                        <input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                      </div>
                      <button className = "icon icon-small" onClick={() => setShowAddProduct(true)}><Plus /></button>
                    </div>
                  </div>
                  <table className="inventory-table small-regular">
                    <thead>
                      <tr>
                        <th className = "th-icon"></th>
                        <th>Product</th>
                        <th>Uploaded File</th>
                        <th>BoM</th>
                        <th>DPP</th>
                        <th>Total LCA</th>
                        <th className = "th-icon"></th>
                      </tr>
                    </thead>
                    <tbody>
                    {filteredProducts.length === 0 ? ( 
                      <tr>
                        <td colSpan={7} className="td-empty">
                          <div className="no-products-message small-regular">
                            {searchTerm 
                            ? 'No products found.' 
                            : 'Add a new product. Click on the + button.'
                            }
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(p => (
                        <tr key={p.productId} className="tr-data">
                          <td className="td-icon">
                            <button className="icon icon-small" disabled >
                              <Triangle style={{ transform: 'rotate(90deg)' }} />
                            </button>
                          </td>
                          <td>{p.productName}</td>
                          <td>{p.uploadedFile}</td>
                          <td>
                            {p.uploadedFile ? (
                              <a
                                href="#"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="dpp-link"
                                onClick={(e) => e.preventDefault()}
                              >View BoM</a>
                            ) : (
                              <span style={{ color: '#828282' }}>[No File]</span>
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
                          <td className="td-icon">
                            <button 
                              className="icon icon-small" style = {{background: "rgba(var(--danger))"}} 
                              onClick={() => alert('Mock Delete ' + p.productName)}>
                              <Trash2 />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* --- TASK 2 --- */}
              <div className = "tasks">
                <div 
                  className={`task-header bottom${activeTask === 1 ? ' active' : ''}`}
                  onClick={() => setActiveTask(activeTask === 1 ? -1 : 1)} 
                  style={{ cursor: 'pointer' }}
                >
                  <p className = "normal-bold">Task 2: Calculate LCA</p>
                  <ChevronDown />
                </div>
                <div className = "inventory-content">
                  <div className = "form-header"> 
                    <h4 style = {{color: "rgba(var(--primary"}}>Inventory</h4>
                    <p className = "small-regular">Overview of your products.</p>
                  </div>
                  
                  <div className = "table-header-content">
                    <p style = {{color: "rgba(var(--grey), 1)"}} className = "small-regular">Showing {filteredProducts.length} of {products.length} products</p>
                    <div className = "button-container">
                      <div className = "input-base search-bar"><Search size = {14}/>
                        <input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                      </div>
                      <button className = "icon icon-small" onClick={() => setShowAddProduct(true)}><Plus /></button>
                    </div>
                  </div>

                  {/* --- TASK 2 TABLE (Reverted Logic) --- */}
                  <table className="inventory-table small-regular">
                    <thead>
                      <tr>
                        <th className = "th-icon"></th>
                        <th>Product Name</th>
                        <th>Uploaded File</th>
                        <th>BoM File</th>
                        <th>DPP</th>
                        <th>Total LCA</th>
                        <th className = "th-icon"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => {
                        const dpp = p.dppData && (typeof p.dppData === 'string' ? JSON.parse(p.dppData) : p.dppData);
                        const isExpanded = !!expandedRows[p.productId];

                        return (
                          <React.Fragment key={p.productId}>
                            {/* --- MAIN PRODUCT ROW --- */}
                            <tr className="tr-data">
                              <td className="td-icon">
                                <button className="icon icon-small" onClick={() => toggleRow(p.productId)}>
                                  <Triangle style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(90deg)' }} />
                                </button>
                              </td>
                              <td>{p.productName}</td>
                              <td>{p.uploadedFile}</td>
                              <td>
                                {p.uploadedFile ? (
                                  <a href="#" className="dpp-link" onClick={(e) => e.preventDefault()}>View BoM</a>
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
                              <td><strong>{formatTotalLca(p.lcaResult)}</strong></td>
                              <td className="td-icon">
                                <button 
                                  className="icon icon-small" style = {{background: "rgba(var(--danger))"}} 
                                  onClick={() => alert('Mock Delete ' + p.productName)}>
                                  <Trash2 />
                                </button>
                              </td>
                            </tr>

                            {/* --- COLLAPSIBLE SUB-TABLE ROW (NEW UI) --- */}
                            {isExpanded && dpp && Array.isArray(dpp) && dpp.length > 0 && (
                              <tr className="tr-sub-table">
                                <td colSpan={7}>
                                  {/* THIS WRAPPER CREATES THE PADDING EFFECT */}
                                  <div className="sub-table-wrapper">
                                    <table className="sub-inventory-table">
                                      <thead>
                                        <tr>
                                          <th className="th-icon">No</th> 
                                          {/* "Material" spans to fill space */}
                                          <th>Material</th> 
                                          <th>Weight</th>
                                          <th>LCA</th>
                                          <th className="th-icon"></th> 
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {/* Only showing the first component as requested */}
                                        {(() => {
                                          const item = dpp[0]; // Get only the first component
                                          const key = `${p.productId}_0`;
                                          const lcaValue = item.lcaValue;
                                          
                                          return (
                                            <tr key={key}>
                                              <td className="td-icon">1</td>
                                              <td>{item.component}</td>
                                              <td>{item.weightKg}</td>
                                              <td>
                                                {lcaValue !== undefined ? `${lcaValue.toFixed(3)} kgCO₂e` : 'N/A'}
                                              </td>
                                              <td className="td-icon">
                                                <button 
                                                  className="icon icon-small" style={{ background: "rgba(var(--danger))" }}
                                                  onClick={() => alert('Mock Delete Sub-item')}
                                                >
                                                  <Trash2 />
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })()}
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
            <button id="dashboardButton" className="default" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </div>

          {/* Add Product Modal */}
          {showAddProduct && (
            <div className="modal-overlay active">
              <div className="modal-content">
                <div className="modal-header">
                  <p className = "medium-bold">Add a New Product</p>
                  <button className="close-modal-btn" onClick={() => setShowAddProduct(false)}><X /></button>
                </div>
                <form id="addProductForm" onSubmit={handleAddProduct}>
                  <div className="form-group">
                    <label htmlFor="productName">Product Name</label>
                    <input 
                      type="text" 
                      id="productName" 
                      value={productName} 
                      onChange={(e) => setProductName(e.target.value)} 
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
                      onChange={(e) => setProductFile(e.target.files[0])} 
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
    </div>
  );
}

export default GuidePage;