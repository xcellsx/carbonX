import React, { useState, useEffect, useRef } from 'react'; // 1. Added useRef
import { useNavigate, useLocation } from 'react-router-dom'; 
import './InventoryPage.css';
import logoPath from '../../assets/carbonx.png';
import { 
  ChevronDown, Plus, Search, Triangle, Trash2, X, 
  LayoutDashboard, Archive, ChartColumnBig, Network, FileText, Sprout, Settings 
} from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) {
    return null;
  }
  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <h2>{title}</h2>
          <button className="close-modal-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="confirm-modal-body">
          {children}
        </div>
        <div className="confirm-modal-buttons">
          <button className="confirm-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="confirm-btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const InventoryPage = () => {
  const [userId] = useState(localStorage.getItem('userId') || '');
  const navigate = useNavigate();
  const location = useLocation(); 
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productName, setProductName] = useState('');
  const [productFile, setProductFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDppModal, setShowDppModal] = useState(false);
  const [currentDpp, setCurrentDpp] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [subProductWeights, setSubProductWeights] = useState({});
  const [calculating, setCalculating] = useState({});
  const [editableProcesses, setEditableProcesses] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [activeSuggestionBox, setActiveSuggestionBox] = useState(null);
  const [editableComponents, setEditableComponents] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // 2. Added isDragging state and fileInputRef from GuidePage
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  // --- All functions from InventoryPage (fetchUserProfile, etc.) ---
  
  const fetchUserProfile = () => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    try {
      const allUsers = JSON.parse(localStorage.getItem('users')) || [];
      const currentUser = allUsers.find(user => user.id === userId);
      
      if (currentUser) {
        setUserName(currentUser.fullName || 'User');
        setCompanyName(currentUser.companyName || 'Company');
        let initials = 'U';
        if (currentUser.fullName) {
          const nameParts = currentUser.fullName.split(' ');
          initials = (nameParts[0].charAt(0) + (nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : '')).toUpperCase();
        }
        setUserInitials(initials);
      } else {
        throw new Error("Current user not found in localStorage.");
      }
    } catch (err) {
      console.error("Error fetching user profile from localStorage:", err);
      setUserName('Mock User');
      setCompanyName('Mock Company');
      setUserInitials('MU');
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchProducts = () => {
    if (!userId) {
      setError('No user session found. Please log in.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const allProductData = JSON.parse(localStorage.getItem('productData')) || {};
      const userProducts = allProductData[userId] || [];
      setProducts(userProducts);
      setError('');
    } catch (err) {
      console.error("Failed to fetch products from localStorage:", err);
      setError('Could not load inventory data.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchProducts();
  }, [userId]);
  
  const autoSaveProduct = (productId, newDppData) => {
    setProducts(currentProducts =>
      currentProducts.map(prod =>
        prod.productId === productId ? { ...prod, dppData: newDppData } : prod
      )
    );
    try {
      const allProductData = JSON.parse(localStorage.getItem('productData')) || {};
      const userProducts = allProductData[userId] || [];
      const updatedUserProducts = userProducts.map(prod =>
        prod.productId === productId ? { ...prod, dppData: newDppData } : prod
      );
      allProductData[userId] = updatedUserProducts;
      localStorage.setItem('productData', JSON.stringify(allProductData));
      fetchProducts();
    } catch (err) {
      console.error("Auto-save to localStorage Error:", err);
      alert("Error saving changes.");
    }
  };

  // 3. Replaced handleAddProduct with the one from GuidePage
  const handleAddProduct = (e) => {
    e.preventDefault();
    setUploading(true); // Simulate upload start
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      alert("Error: No user is logged in.");
      setUploading(false);
      return;
    }

    const newProduct = {
      productId: new Date().getTime(),
      productName: productName,
      uploadedFile: productFile ? productFile.name : 'No file',
      dppData: JSON.stringify([ // Creates mock DPP data
        { component: "Mock Component 1", process: "", weightKg: 10, processId: null, lcaValue: null },
        { component: "Mock Component 2", process: "", weightKg: 5, processId: null, lcaValue: null }
      ]),
      lcaResult: 0 // Default LCA
    };

    try {
      const allProductData = JSON.parse(localStorage.getItem('productData')) || {};
      const userProducts = allProductData[currentUserId] || [];
      const updatedUserProducts = [...userProducts, newProduct];
      
      allProductData[currentUserId] = updatedUserProducts;
      localStorage.setItem('productData', JSON.stringify(allProductData));

      setProducts(updatedUserProducts);
      setShowAddProduct(false);
      setProductName('');
      setProductFile(null);
    } catch (err) {
       console.error("Error adding product to localStorage:", err);
       alert('Error saving new product.');
    }
    setUploading(false);
  };
  
  // Kept InventoryPage's delete logic (it uses the modal)
  const performActualDeleteProduct = (productId) => {
    try {
      const allProductData = JSON.parse(localStorage.getItem('productData')) || {};
      const userProducts = allProductData[userId] || [];
      const updatedUserProducts = userProducts.filter(p => p.productId !== productId);
      allProductData[userId] = updatedUserProducts;
      localStorage.setItem('productData', JSON.stringify(allProductData));
      setProducts(updatedUserProducts);
    } catch (err) {
      console.error("Delete error (localStorage):", err);
      alert('Error deleting product.');
    }
  };

  const handleDelete = (productId) => {
    const product = products.find(p => p.productId === productId);
    const productName = product ? product.productName : 'this product';
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Product',
      message: `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      onConfirm: () => performActualDeleteProduct(productId)
    });
  };

  // Kept all other InventoryPage handlers (handleProcessChange, etc.)
  const handleProcessChange = (e, p, idx) => {
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
    const mockSuggestions = [
      { name: "Mock: Steel production", openLcaProcessId: 'mock-steel' },
      { name: "Mock: Aluminum casting", openLcaProcessId: 'mock-aluminum' },
      { name: "Mock: Plastic injection", openLcaProcessId: 'mock-plastic' }
    ].filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
    setSuggestions(prev => ({ ...prev, [key]: mockSuggestions }));
  };

  const handleComponentChange = (e, p, idx) => {
    const key = `${p.productId}_${idx}`;
    const newName = e.target.value;
    setEditableComponents(prev => ({ ...prev, [key]: newName }));
  };
  
  const performActualDeleteSubcomponent = (productId, indexToDelete) => {
    const product = products.find(p => p.productId === productId);
    if (!product) return;
    let dpp = JSON.parse(product.dppData);
    dpp.splice(indexToDelete, 1);
    autoSaveProduct(productId, JSON.stringify(dpp));
  };

  const handleDeleteSubcomponent = (productId, indexToDelete) => {
    const product = products.find(p => p.productId === productId);
    let componentName = 'this subcomponent';
    if(product) {
      try {
        const dpp = JSON.parse(product.dppData);
        componentName = dpp[indexToDelete]?.component || componentName;
      } catch (e) {}
    }
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Subcomponent',
      message: `Are you sure you want to delete "${componentName}"?`,
      onConfirm: () => performActualDeleteSubcomponent(productId, indexToDelete)
    });
  };
  
  const runLcaCalculation = (productId, subcomponentIndex, weightToUse) => {
    const key = `${productId}_${subcomponentIndex}`;
    setCalculating(prev => ({ ...prev, [key]: true }));
    const product = products.find(p => p.productId === productId);
    if (!product) {
      alert("Error: Product not found in state.");
      setCalculating(prev => ({ ...prev, [key]: false }));
      return;
    }
    let dpp = JSON.parse(product.dppData);
    const item = dpp[subcomponentIndex];
    const processIdentifier = item.processId || item.process;
    if (!processIdentifier) {
      alert("Error: Cannot calculate without a process.");
      setCalculating(prev => ({ ...prev, [key]: false }));
      return;
    }
    console.log(`Mock calculating LCA for ${processIdentifier} with weight ${weightToUse}`);
    setTimeout(() => {
      const mockLcaValue = weightToUse * (Math.random() * 0.5 + 0.1);
      dpp[subcomponentIndex].lcaValue = mockLcaValue;
      dpp[subcomponentIndex].weightKg = weightToUse;
      autoSaveProduct(productId, JSON.stringify(dpp));
      setCalculating(prev => ({ ...prev, [key]: false }));
      console.log(`Mock calculation complete. Result: ${mockLcaValue}`);
    }, 1000);
  };

  const handleSuggestionClick = (p, idx, suggestion) => {
    const key = `${p.productId}_${idx}`;
    let newDppData;
    setProducts(currentProducts => {
      const newProducts = currentProducts.map(prod => {
        if (prod.productId === p.productId) {
          let dpp = JSON.parse(prod.dppData);
          dpp[idx].process = suggestion.name;
          dpp[idx].processId = suggestion.openLcaProcessId;
          dpp[idx].lcaValue = null;
          newDppData = JSON.stringify(dpp);
          return { ...prod, dppData: newDppData };
        }
        return prod;
      });
      return newProducts;
    });
    setEditableProcesses(prev => ({ ...prev, [key]: undefined }));
    setSuggestions(prev => ({ ...prev, [key]: [] }));
    setActiveSuggestionBox(null);
    if (newDppData) {
      autoSaveProduct(p.productId, newDppData);
    }
  };

  const handleComponentBlur = (p, idx) => {
    const key = `${p.productId}_${idx}`;
    const newName = editableComponents[key];
    if (newName === undefined) return;
    let newDppData;
    setProducts(currentProducts => {
      const newProducts = currentProducts.map(prod => {
        if (prod.productId === p.productId) {
          let dpp = JSON.parse(prod.dppData);
          dpp[idx].component = newName;
          newDppData = JSON.stringify(dpp);
          return { ...prod, dppData: newDppData };
        }
        return prod;
      });
      return newProducts;
    });
    setEditableComponents(prev => ({ ...prev, [key]: undefined }));
    if (newDppData) {
      autoSaveProduct(p.productId, newDppData);
    }
  };

  const handleAddSubcomponent = (productId) => {
    const product = products.find(p => p.productId === productId);
    if (!product) return;
    let dpp = [];
    if (product.dppData) {
        try { dpp = JSON.parse(product.dppData); } catch (e) {}
    }
    dpp.push({ 
      component: `Component ${dpp.length + 1}`, 
      process: "", 
      weightKg: 0, 
      lcaValue: null,
      processId: null 
    });
    autoSaveProduct(productId, JSON.stringify(dpp));
  };
  
  const handleWeightBlur = (e, p, idx) => {
    const key = `${p.productId}_${idx}`;
    const newWeight = Number(e.target.value);
    setSubProductWeights(prev => ({ ...prev, [key]: newWeight }));
    const product = products.find(pr => pr.productId === p.productId);
    if (!product) return;
    let dpp = JSON.parse(product.dppData);
    const item = dpp[idx];
    if (item.lcaValue !== null && item.lcaValue !== undefined) {
      runLcaCalculation(p.productId, idx, newWeight);
    } else {
      item.weightKg = newWeight;
      autoSaveProduct(p.productId, JSON.stringify(dpp));
    }
  };
  
  const closeDeleteModal = () => {
    setDeleteConfirm({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
    });
  };

  // 4. Added new file handler functions from GuidePage
  const handleFileSelect = (file) => {
    if (file) {
      // You can add file type validation here if needed
      if (!file.name.endsWith('.csv')) {
         alert("Please upload a .csv file.");
         return;
      }
      setProductFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  // --- FORMATTING & FILTERING ---
  const formatDpp = (dppData) => {
    if (!dppData || dppData === '[No DPP stored]') return '[No DPP stored]';
    try {
      let data = dppData;
      if (typeof data === 'string' && (data.trim().startsWith('[') || data.trim().startsWith('{'))) {
        data = JSON.parse(data);
      }
      const displayData = data.map(item => ({
        component: item.component,
        process: item.process,
        weightKg: item.weightKg,
        lcaValue: item.lcaValue
      }));
      return JSON.stringify(displayData, null, 2); 
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

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- RENDER ---
  return (
    <div className="container">
      {/* Sidebar is unchanged and correct */}
      <div className="sidebar">
        <div className="sidebar-top">
          <img src={logoPath} alt="Logo" width="48" style={{ margin: 0, padding: 0, display: 'block' }}/>
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
            <button type="button" className={`nav ${location.pathname === '/network' ? 'active' : ''}`} onClick={() => navigate('/network')}>
              <Network /><span>Network</span>
            </button>
            <button type="button" className={`nav ${location.pathname === '/report' ? 'active' : ''}`} onClick={() => navigate('/report')}>
              <FileText /><span>Report</span>
            </button>
            <button type="button" className={`nav ${location.pathname === '/chat' ? 'active' : ''}`} onClick={() => navigate('/chat')}>
              <Sprout /><span>Sprout AI</span>
            </button>
          </div>
        </div>
        <div className="sidebar-bottom">
          <button 
            type="button" 
            className={`nav ${location.pathname === '/settings' ? 'active' : ''}`} 
            onClick={() => navigate("/settings")}
          >
            <Settings /><span>Settings</span>
          </button>
        </div>
      </div>

      <div className="content-body">
        <div className="content"> 
          <div className="form-header">
            <h1>Inventory</h1>
            <p className = "medium-regular">Overview of your products.</p>
          </div>
          <div className = "table-header-content">
            <p style = {{color: "rgba(var(--greys), 1)"}}>Showing {filteredProducts.length} of {products.length} products</p>
            <div className = "button-container">
              <div className = "input-base search-bar"><Search />
                <input 
                  type="text" 
                  placeholder="Search" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className = "icon" onClick={() => setShowAddProduct(true)}><Plus /></button>
            </div>
          </div>
          <div className="inventory-table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Product Name</th>
                  <th>Uploaded File</th>
                  <th>View BoM</th>
                  <th>View DPP</th>
                  <th>Total LCA Result</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && !error && filteredProducts.map(p => {
                  const dpp = p.dppData &&
                    (typeof p.dppData === 'string' ? JSON.parse(p.dppData) : p.dppData);

                  return (
                    <React.Fragment key={p.productId}>
                      {/* Main Row */}
                      <tr>
                        <td>
                          <button className="icon" onClick={() => setExpandedRows(prev => ({
                            ...prev, [p.productId]: !prev[p.productId]
                          }))}>
                            <Triangle size={16} style={{ transform: expandedRows[p.productId] ? 'rotate(0deg)' : 'rotate(90deg)' }} />
                          </button>
                        </td>
                        <td>{p.productName}</td>
                        <td>{p.uploadedFile}</td>
                        <td>
                          {p.uploadedFile ? (
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                alert(`This would show the file: ${p.uploadedFile}`);
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="dpp-link"
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
                        <td>
                          <button 
                            className="icon" style = {{background: "rgba(var(--danger))"}}
                            title = "Delete product" 
                            onClick={() => handleDelete(p.productId)}>
                            <Trash2 />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row (unchanged) */}
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
                                    <th>LCA Output</th>
                                    <th>Calculate</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dpp.map((item, idx) => {
                                    const key = `${p.productId}_${idx}`;
                                    const lcaValue = item.lcaValue;
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
                                              onBlur={() => {
                                                setTimeout(() => setActiveSuggestionBox(null), 150);
                                                const typedValue = editableProcesses[key];
                                                if (typedValue !== undefined && typedValue !== item.process) {
                                                    let dpp = JSON.parse(p.dppData);
                                                    dpp[idx].process = typedValue;
                                                    dpp[idx].processId = null; 
                                                    dpp[idx].lcaValue = null;
                                                    autoSaveProduct(p.productId, JSON.stringify(dpp));
                                                }
                                                setEditableProcesses(prev => ({...prev, [key]: undefined}));
                                              }}
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
                                            {calculating[key] ? (
                                              <span style={{ color: '#888', fontStyle: 'italic' }}>Calculating...</span>
                                            ) : (
                                              (() => {
                                                  if (lcaValue === undefined || lcaValue === null) {
                                                    return 'Not calculated';
                                                  }
                                                  if (typeof lcaValue === 'number') {
                                                    return `${lcaValue.toFixed(3)} kgCO₂e`;
                                                  }
                                                  return lcaValue;
                                              })()
                                            )}
                                          </strong>
                                        </td>
                                        <td>
                                          {(!calculating[key] && (lcaValue === undefined || lcaValue === null)) && (
                                            <button
                                              className="calculate-lca-btn"
                                              disabled={!(item.processId || item.process)}
                                              onClick={() => {
                                                const newWeightString = subProductWeights[key];
                                                const weightToSend = (newWeightString !== undefined && newWeightString !== null && newWeightString !== "")
                                                  ? Number(newWeightString)
                                                  : item.weightKg;
                                                runLcaCalculation(p.productId, idx, weightToSend);
                                              }}
                                            >
                                              Calculate LCA
                                            </button>
                                          )}
                                        </td>
                                        <td>
                                          <button
                                            className="icon icon-small" style = {{background: "rgba(var(--danger))"}}
                                            title="Delete subcomponent"
                                            onClick={() => handleDeleteSubcomponent(p.productId, idx)}
                                          >
                                            <Trash2 />
                                          </button>
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
      </div>
  
      {/* 5. REPLACED the 'Add Product' modal with the new one from GuidePage */}
      {showAddProduct && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <p className = "medium-bold">Add a New Product</p>
              <button className="close-modal-btn" onClick={() => setShowAddProduct(false)}><X /></button>
            </div>
            <form id="addProductForm" onSubmit={handleAddProduct}>
              <div className="form-group">
                <label htmlFor="productName">Product Name *</label>
                <input 
                  type="text" 
                  id="productName" 
                  placeholder="Product Name"
                  value={productName} 
                  onChange={(e) => setProductName(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="fileUpload">
                  {productFile 
                    ? `File Uploaded: ${productFile.name}` 
                    : "Upload File"}
                </label>
                
                <div 
                  className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    id="fileUpload"
                    ref={fileInputRef}
                    className="file-input-hidden"
                    accept=".csv"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                  />
                  
                  <p className="file-drop-zone-text">Drag and drop your file here</p>
                  
                  <button 
                    type="button" 
                    className="browse-files-btn" 
                    onClick={handleBrowseClick}
                  >
                    Browse Files
                  </button>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="create-dpp-btn" 
                disabled={uploading || !productName || !productFile}
              >
                {uploading ? "Uploading..." : "Add Product"}
              </button>
            </form>
          </div>
        </div>
      )}
  
      {/* DPP Modal (unchanged) */}
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
  
      {/* Confirmation Modal (unchanged) */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
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