import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './InventoryPage.css';
import logoPath from '../../assets/carbonx.png';
import { productAPI } from '../../services/api';
import {
  LayoutDashboard,
  Archive,
  ChartColumnBig,
  Network,
  FileText,
  Sprout,
  Settings,
  Search,
  X,
  Triangle,
  CirclePlus,
  Trash2,
  FilePlus
} from 'lucide-react';

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

// --- Confirmation Modal ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) {
    return null;
  }
  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <p className="medium-bold">{title}</p>
          <button className="close-modal-btn" onClick={onClose}><X /></button>
        </div>
        <div className="normal-regular">
          {children}
        </div>
        <div className="confirm-modal-buttons button-modal">
          <button className="default" style={{ padding: '0.5rem 1rem' }} onClick={onClose}>
            Cancel
          </button>
          <button className="default" style={{ backgroundColor: 'rgba(var(--danger), 1)', padding: '0.5rem 1rem' }} onClick={onConfirm}>
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
  const [calculating, setCalculating] = useState({});
  const [editableIngredients, setEditableIngredients] = useState({});
  const [activeSuggestionBox, setActiveSuggestionBox] = useState(null);
  const [suggestions, setSuggestions] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {},
  });
  
  const [isProUser] = useState(localStorage.getItem('isProUser') === 'true');

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
      const mapped = filtered.map((p) => ({
        productId: p.id ?? p._id ?? p.key,
        productName: p.name,
        dppData: (p.functionalProperties && p.functionalProperties.dppData) || (typeof p.dppData === 'string' ? p.dppData : '[]'),
        lcaResult: p.DPP?.carbonFootprint?.total ?? p.lcaResult ?? 0,
        userId: p.userId,
        uploadedFile: p.uploadedFile,
        type: p.type,
        productOrigin: p.productOrigin,
        functionalProperties: p.functionalProperties,
        DPP: p.DPP,
      }));
      setProducts(mapped);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
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
    try {
      const prod = productsRef.current.find((p) => p.productId === productId);
      if (!prod) return;
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
    try {
      await productAPI.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.productId !== productId));
    } catch (err) {
      console.error("Delete error:", err);
      alert('Failed to delete product.');
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
    setActiveSuggestionBox(key);
    
    setProducts(currentProducts => currentProducts.map(prod => {
        if (prod.productId === p.productId) {
          let dpp = JSON.parse(prod.dppData);
          dpp[idx].ingredient = query;
          dpp[idx].materialId = null;
          dpp[idx].lcaValue = null;
          dpp[idx].emissionFactor = null;
          return { ...prod, dppData: JSON.stringify(dpp) };
        }
        return prod;
    }));

    if (query.length < 2) {
      setSuggestions(prev => ({ ...prev, [key]: [] }));
      return;
    }
    
    const mockSuggestions = [
      { name: "Steel", openLcaMaterialId: 'mock-steel' }, { name: "Stainless Steel", openLcaMaterialId: 'mock-stainless-steel' },
      { name: "Aluminum", openLcaMaterialId: 'mock-aluminum' }, { name: "Copper", openLcaMaterialId: 'mock-copper' },
      { name: "Glass", openLcaMaterialId: 'mock-glass' }, { name: "PLA", openLcaMaterialId: 'mock-pla' },
      { name: "ABS Plastic", openLcaMaterialId: 'mock-abs' }, { name: "Polycarbonate", openLcaMaterialId: 'mock-polycarbonate' },
      { name: "Nylon 6", openLcaMaterialId: 'mock-nylon' }, { name: "Nylon", openLcaMaterialId: 'mock-nylon' },
      { name: "Polyester Mesh", openLcaMaterialId: 'mock-polyester' }, { name: "Rubber", openLcaMaterialId: 'mock-rubber' },
      { name: "Dried white sesame", openLcaMaterialId: 'mock-sesame' }, { name: "Plastic pouch", openLcaMaterialId: 'mock-plastic-pouch' }, 
      { name: "Transport (Road)", openLcaMaterialId: 'mock-transport-road' }, { name: "Transport (Sea)", openLcaMaterialId: 'mock-transport-sea' },
    ].filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
    setSuggestions(prev => ({ ...prev, [key]: mockSuggestions }));
  };

  const handleSuggestionClick = (p, idx, suggestion) => {
    const key = `${p.productId}_${idx}`;
    let newDppData;
    let weightToUse;
    setProducts(currentProducts => {
      const newProducts = currentProducts.map(prod => {
        if (prod.productId === p.productId) {
          let dpp = JSON.parse(prod.dppData);
          dpp[idx].ingredient = suggestion.name;
          dpp[idx].materialId = suggestion.openLcaMaterialId;
          dpp[idx].lcaValue = null;
          dpp[idx].emissionFactor = null;
          weightToUse = dpp[idx].weightKg;
          newDppData = JSON.stringify(dpp);
          return { ...prod, dppData: newDppData };
        }
        return prod;
      });
      return newProducts;
    });
    setEditableIngredients(prev => ({ ...prev, [key]: undefined }));
    setSuggestions(prev => ({ ...prev, [key]: [] }));
    setActiveSuggestionBox(null);
    if (newDppData) {
      autoSaveProduct(p.productId, newDppData);
      runLcaCalculation(p.productId, idx, weightToUse);
    }
  };

  const handleWeightBlur = (e, p, idx) => {
    const key = `${p.productId}_${idx}`;
    const newWeight = Number(e.target.value);
    setSubProductWeights(prev => ({ ...prev, [key]: newWeight }));
    
    const product = products.find(pr => pr.productId === p.productId);
    if (!product) return;
    
    // Trigger calculation directly
    runLcaCalculation(p.productId, idx, newWeight);
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
    const key = `${productId}_${subcomponentIndex}`;
    setCalculating(prev => ({ ...prev, [key]: true }));

    const product = products.find(p => p.productId === productId);
    if (!product) {
      setCalculating(prev => ({ ...prev, [key]: false }));
      return;
    }
    let dpp;
    try { dpp = JSON.parse(product.dppData); } catch (e) { dpp = []; }
    if (!dpp[subcomponentIndex]) {
      setCalculating(prev => ({ ...prev, [key]: false }));
      return;
    }
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
    } finally {
      setCalculating(prev => ({ ...prev, [key]: false }));
    }
  };

  // --- FULL LCA: save DPP to backend (LCA calculate not exposed by Java backend)
  const runFullLcaCalculation = async (productId) => {
    const product = products.find(p => p.productId === productId);
    if (!product) return;
    let dpp;
    try { dpp = JSON.parse(product.dppData); } catch (e) { return; }
    if (!Array.isArray(dpp)) return;

    const newCalculatingState = {};
    dpp.forEach((_, idx) => {
      newCalculatingState[`${productId}_${idx}`] = true;
    });
    setCalculating(prev => ({ ...prev, ...newCalculatingState }));

    try {
      await autoSaveProduct(productId, product.dppData);
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      const finishedCalculatingState = {};
      dpp.forEach((_, idx) => {
        finishedCalculatingState[`${productId}_${idx}`] = false;
      });
      setCalculating(prev => ({ ...prev, ...finishedCalculatingState }));
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

    output += "\n--- LCA COMPONENTS ---\n";
    if (dppData.length > 0) {
      dppData.forEach((item, index) => {
        output += `  [${index + 1}] Component: ${item.ingredient}\n`;
        output += `      Amount: ${item.weightKg} ${item.unit || 'kg'}\n`; 
        output += `      LCA Value: ${item.lcaValue ? item.lcaValue.toFixed(3) + ' kgCO2e' : 'Not calculated'}\n`;
        if (item.isPackaging) output += `      (Packaging Component)\n`;
        if (item.isTransport) output += `      (Transport Component)\n`;
      });
    } else {
      output += "No components listed for this product.\n";
    }
    return output;
  };

  const formatTotalLca = (value) => {
    if (value === null || value === undefined) return '0.000 kgCO₂e';
    return `${value.toFixed(3)} kgCO₂e`;
  };

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <button type="button" className="outline" style={{ whiteSpace: 'nowrap', width: 'auto', paddingLeft: '1rem', paddingRight: '1rem' }} onClick={() => navigate('/templates')}>
                Create Your Own
              </button>
              <button type="button" className="default" style={{ whiteSpace: 'nowrap', width: 'auto', paddingLeft: '1rem', paddingRight: '1rem' }} onClick={() => setShowAddProduct(true)}>
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
                  <th>Uploaded File</th>
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
                        <td>{p.productName}</td>
                        <td>{p.uploadedFile}</td>
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
                                    <th>LCA Component</th>
                                    <th>Amount / Distance</th>
                                    <th>Unit</th>
                                    <th>LCA (kgCO2e)</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dpp.map((item, idx) => {
                                    const key = `${p.productId}_${idx}`;
                                    const lcaValue = item.lcaValue;
                                    const isPackaging = item.isPackaging || false;
                                    const isTransport = item.isTransport || false;
                                    const isLocked = isPackaging || isTransport;
                                    
                                    const displayUnit = isTransport ? 'km' : (item.unit || 'kg');

                                    return (
                                      <tr key={idx} className={isLocked ? 'packaging-row' : ''}>
                                        <td>{idx + 1}</td>
                                        <td>
                                          <div>
                                            <input 
                                              type="text" 
                                              className="input-base" 
                                              value={editableIngredients[key] ?? item.ingredient} 
                                              onChange={(e) => handleComponentChange(e, p, idx)} 
                                              onBlur={() => {
                                                setTimeout(() => setActiveSuggestionBox(null), 150);
                                                const typedValue = editableIngredients[key];
                                                if (typedValue !== undefined && typedValue !== item.ingredient) {
                                                  let dpp = JSON.parse(p.dppData);
                                                  dpp[idx].ingredient = typedValue;
                                                  dpp[idx].materialId = null;
                                                  dpp[idx].lcaValue = null;
                                                  dpp[idx].emissionFactor = null;
                                                  autoSaveProduct(p.productId, JSON.stringify(dpp));
                                                  runFullLcaCalculation(p.productId); 
                                                }
                                                setEditableIngredients(prev => ({...prev, [key]: undefined}));
                                              }} 
                                              onFocus={() => {
                                                setActiveSuggestionBox(key);
                                                if (!item.ingredient) {
                                                  handleComponentChange({ target: { value: '' }}, p, idx);
                                                }
                                              }} 
                                              placeholder="Search LCA Components"
                                              disabled={isLocked && !isTransport} 
                                            />
                                            {activeSuggestionBox === key && suggestions[key] && suggestions[key].length > 0 && (
                                              <div className="suggestion-dropdown">
                                                {suggestions[key].map((sug, sugIdx) => (
                                                  <div key={sug.openLcaMaterialId || sugIdx} className="suggestion-item" onMouseDown={() => handleSuggestionClick(p, idx, sug)}>
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
                                            className="input-base" 
                                            step={isTransport ? 1 : 0.001} 
                                            value={subProductWeights[key] ?? item.weightKg} 
                                            min={0} 
                                            onChange={e => setSubProductWeights(prev => ({
                                                ...prev,
                                                [key]: e.target.value
                                              }))} 
                                            onBlur={(e) => handleWeightBlur(e, p, idx)}
                                            placeholder={isTransport ? "Distance" : "Weight"}
                                          />
                                        </td>
                                        <td>
                                          <input 
                                            type="text"
                                            className="input-base"
                                            value={displayUnit}
                                            disabled 
                                            style={{ width: '80px', textAlign: 'center' }}
                                          />
                                        </td>
                                        <td>
                                          <strong>
                                            {calculating[key] ? (
                                              <span style={{ color: 'rgba(var(--black), 0.8)'}}>Calculating...</span>
                                            ) : (
                                              (() => {
                                                  if (lcaValue === undefined || lcaValue === null) {
                                                    return 'Not calculated';
                                                  }
                                                  if (typeof lcaValue === 'number') {
                                                    if (lcaValue > 0 && lcaValue < 0.001) {
                                                        return `< 0.001 kgCO₂e`; 
                                                    }
                                                    return `${lcaValue.toFixed(3)} kgCO₂e`;
                                                  }
                                                  return lcaValue;
                                              })()
                                            )}
                                          </strong>
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
                    Upload File <span className='submit-error'>*</span> (CSV or JSON, name and type only)
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
 
      {showDppModal && (
        <div className="modal-overlay active" onClick={() => setShowDppModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '600px', maxWidth: '90%' }}>
            <div className="modal-header">
              <p className="medium-bold">Digital Product Passport (DPP)</p>
              <button className="close-modal-btn" onClick={() => setShowDppModal(false)}><X /></button>
            </div>
            <pre className="dpp-modal-pre">
              {formatDpp(currentDppProduct)}
            </pre>
          </div>
        </div>
      )}
 
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