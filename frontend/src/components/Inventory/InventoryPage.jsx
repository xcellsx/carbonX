import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import './InventoryPage.css';
import logoPath from '../../assets/carbonx.png';
import { 
  ChevronDown, Plus, Search, Triangle, Trash2, X, 
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, FilePlus, CirclePlus 
} from 'lucide-react';

const parseCsvFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file provided."));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
          return reject(new Error("CSV must have a header and at least one data row."));
        }

        const headerLine = lines[0].trim();
        const expectedHeader = "Component,Material,Weight (kg)";

        const normalizeHeader = (header) => header.replace(/\s/g, '').toLowerCase();

        if (normalizeHeader(headerLine) !== normalizeHeader(expectedHeader)) {
           return reject(new Error(`Invalid CSV header. Expected: "${expectedHeader}" (Got: "${headerLine}")`));
        }
        
        const data = lines.slice(1).map(line => {
          const values = [];
          let inQuote = false;
          let currentField = '';
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
              inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
              values.push(currentField.trim());
              currentField = '';
            } else {
              currentField += char;
            }
          }
          values.push(currentField.trim());

          if (values.length !== 3) {
             console.warn("Skipping malformed CSV line:", line);
             return null;
          }

          const weight = parseFloat(values[2]);
          return {
            component: values[0].replace(/"/g, ''),
            material: values[1].replace(/"/g, ''),
            weightKg: isNaN(weight) ? 0 : weight,
            materialId: null,
            lcaValue: null,
            emissionFactor: null
          };
        }).filter(item => item !== null);

        resolve(data);
      } catch (err) {
        reject(new Error("An error occurred during parsing: " + err.message));
      }
    };
    
    reader.onerror = (e) => {
      reject(new Error("Error reading file: " + e.target.error));
    };

    reader.readAsText(file);
  });
};


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
  const [productName, setProductName] = useState('');
  const [productFile, setProductFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDppModal, setShowDppModal] = useState(false);
  const [currentDpp, setCurrentDpp] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [subProductWeights, setSubProductWeights] = useState({});
  const [calculating, setCalculating] = useState({});
  const [editableMaterials, setEditableMaterials] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [activeSuggestionBox, setActiveSuggestionBox] = useState(null);
  const [editableComponents, setEditableComponents] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({isOpen: false, title: '', message: '', onConfirm: () => {},});

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  const [isProUser, setIsProUser] = useState(false);
  
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
    fetchProducts();
  }, [userId]);
  
  const autoSaveProduct = (productId, newDppData, newTotalLca = null) => {
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
      const allProductData = JSON.parse(localStorage.getItem('productData')) || {};
      const userProducts = allProductData[userId] || [];
      
      const updatedUserProducts = userProducts.map(prod => {
        if (prod.productId === productId) {
          const updatedLcaResult = newTotalLca !== null ? newTotalLca : prod.lcaResult;
          return { ...prod, dppData: newDppData, lcaResult: updatedLcaResult };
        }
        return prod;
      });

      allProductData[userId] = updatedUserProducts;
      localStorage.setItem('productData', JSON.stringify(allProductData));
    } catch (err) {
      console.error("Auto-save to localStorage Error:", err);
      alert("Error saving changes.");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setUploading(true);

    if (!userId) {
      alert("Error: No user is logged in.");
      setUploading(false);
      return;
    }

    let parsedDppData = [];
    try {
      parsedDppData = await parseCsvFile(productFile);
      if (parsedDppData.length === 0) {
        alert("Error: The CSV file was empty or contained no valid data rows.");
        setUploading(false);
        return;
      }
    } catch (err) {
      console.error("Error parsing CSV:", err);
      alert(`Error parsing file: ${err.message}`);
      setUploading(false);
      return;
    }

    const newProduct = {
      productId: new Date().getTime(),
      productName: productName,
      uploadedFile: productFile ? productFile.name : 'No file',
      dppData: JSON.stringify(parsedDppData),
      lcaResult: 0
    };

    try {
      const allProductData = JSON.parse(localStorage.getItem('productData')) || {};
      const userProducts = allProductData[userId] || [];
      const updatedUserProducts = [...userProducts, newProduct];
      
      allProductData[userId] = updatedUserProducts;
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

  const handleMaterialChange = (e, p, idx) => {
    const key = `${p.productId}_${idx}`;
    const query = e.target.value;
    setEditableMaterials(prev => ({ ...prev, [key]: query }));
    setActiveSuggestionBox(key);
    setProducts(currentProducts => {
      return currentProducts.map(prod => {
        if (prod.productId === p.productId) {
          let dpp = JSON.parse(prod.dppData);
          dpp[idx].material = query;
          dpp[idx].materialId = null;
          dpp[idx].lcaValue = null;
          dpp[idx].emissionFactor = null;
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
      { name: "Steel", openLcaMaterialId: 'mock-steel' },
      { name: "Stainless Steel", openLcaMaterialId: 'mock-stainless-steel' },
      { name: "Aluminum", openLcaMaterialId: 'mock-aluminum' },
      { name: "Copper", openLcaMaterialId: 'mock-copper' },
      { name: "Glass", openLcaMaterialId: 'mock-glass' },
      { name: "PLA", openLcaMaterialId: 'mock-pla' },
      { name: "ABS Plastic", openLcaMaterialId: 'mock-abs' },
      { name: "Polycarbonate", openLcaMaterialId: 'mock-polycarbonate' },
      { name: "Nylon 6", openLcaMaterialId: 'mock-nylon' },
      { name: "Polyester Mesh", openLcaMaterialId: 'mock-polyester' },
      { name: "Rubber", openLcaMaterialId: 'mock-rubber' },
    ].filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
    setSuggestions(prev => ({ ...prev, [key]: mockSuggestions }));
  };
  
  const performActualDeleteSubcomponent = (productId, indexToDelete) => {
    const product = products.find(p => p.productId === productId);
    if (!product) return;
    let dpp = JSON.parse(product.dppData);
    dpp.splice(indexToDelete, 1);
    
    const totalLca = dpp.reduce((sum, item) => {
      return sum + (item.lcaValue || 0);
    }, 0);
    
    autoSaveProduct(productId, JSON.stringify(dpp), totalLca);
  };

  const handleDeleteSubcomponent = (productId, indexToDelete) => {
    const product = products.find(p => p.productId === productId);

    let materialName = 'this material'; 
    if(product) {
      try {
        const dpp = JSON.parse(product.dppData);
        materialName = dpp[indexToDelete]?.material || materialName;
        
        if (materialName.trim() === "") {
          materialName = 'this material';
        }
      } catch (e) {}
    }

    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Material',
      message: `Are you sure you want to delete "${materialName}"?`,
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
    const materialIdentifier = item.materialId || item.material;
    if (!materialIdentifier) {
      alert("Error: Cannot calculate without a material.");
      setCalculating(prev => ({ ...prev, [key]: false }));
      return;
    }

    let emissionFactor = item.emissionFactor;
    if (emissionFactor === null || emissionFactor === undefined) {
      emissionFactor = Math.random() * (5.0 - 0.5) + 0.5;
      dpp[subcomponentIndex].emissionFactor = emissionFactor;
    }

    const calculatedLcaValue = weightToUse * emissionFactor;
    dpp[subcomponentIndex].lcaValue = calculatedLcaValue;
    dpp[subcomponentIndex].weightKg = weightToUse;

    const totalLca = dpp.reduce((sum, item) => {
      return sum + (item.lcaValue || 0);
    }, 0);

    autoSaveProduct(productId, JSON.stringify(dpp), totalLca);
    setCalculating(prev => ({ ...prev, [key]: false }));
  };

  const runFullLcaCalculation = (productId) => {
    const product = products.find(p => p.productId === productId);
    if (!product) return;

    let dpp;
    try {
      dpp = JSON.parse(product.dppData);
    } catch (e) { return; }

    if (!Array.isArray(dpp)) return;

    const needsCalculation = dpp.some(item => 
      (item.materialId || item.material) &&
      (item.lcaValue === null || item.lcaValue === undefined ||
       item.emissionFactor === null || item.emissionFactor === undefined)
    );

    if (!needsCalculation) {
      return;
    }

    const newCalculatingState = {};
    dpp.forEach((item, idx) => {
      const key = `${productId}_${idx}`;
      newCalculatingState[key] = true;
    });
    setCalculating(prev => ({ ...prev, ...newCalculatingState }));

    setTimeout(() => {
      const updatedDpp = dpp.map((item, idx) => {
        const materialIdentifier = item.materialId || item.material;
        if (!materialIdentifier) {
          return item;
        }
        
        const weightToUse = item.weightKg;

        let emissionFactor = item.emissionFactor;
        if (emissionFactor === null || emissionFactor === undefined) {
          emissionFactor = Math.random() * (5.0 - 0.5) + 0.5;
        }
        
        const calculatedLcaValue = weightToUse * emissionFactor;

        return {
          ...item,
          lcaValue: calculatedLcaValue,
          emissionFactor: emissionFactor,
        };
      });

      const totalLca = updatedDpp.reduce((sum, item) => {
        return sum + (item.lcaValue || 0);
      }, 0);

      autoSaveProduct(productId, JSON.stringify(updatedDpp), totalLca);

      const finishedCalculatingState = {};
      dpp.forEach((item, idx) => {
        const key = `${productId}_${idx}`;
        finishedCalculatingState[key] = false;
      });
      setCalculating(prev => ({ ...prev, ...finishedCalculatingState }));

    }, 1000);
  };

  const handleSuggestionClick = (p, idx, suggestion) => {
    const key = `${p.productId}_${idx}`;
    let newDppData;
    let weightToUse;
    setProducts(currentProducts => {
      const newProducts = currentProducts.map(prod => {
        if (prod.productId === p.productId) {
          let dpp = JSON.parse(prod.dppData);
          dpp[idx].material = suggestion.name;
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
    setEditableMaterials(prev => ({ ...prev, [key]: undefined }));
    setSuggestions(prev => ({ ...prev, [key]: [] }));
    setActiveSuggestionBox(null);
    if (newDppData) {
      autoSaveProduct(p.productId, newDppData);
      runLcaCalculation(p.productId, idx, weightToUse);
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
      material: "",
      weightKg: 0, 
      lcaValue: null,
      materialId: null,
      emissionFactor: null
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
    
    if (item.materialId || item.material) {
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

  const handleFileSelect = (file) => {
    if (!file) {
      setProductFile(null);
      return;
    }

    if (!file.name.endsWith('.csv')) {
      alert("Please upload a .csv file.");
      return;
    }
    
    setProductFile(file);
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

  const formatDpp = (dppData) => {
    if (!dppData || dppData === '[No DPP stored]') return '[No DPP stored]';
    try {
      let data = dppData;
      if (typeof data === 'string' && (data.trim().startsWith('[') || data.trim().startsWith('{'))) {
        data = JSON.parse(data);
      }
      const displayData = data.map(item => ({
        component: item.component,
        material: item.material,
        weightKg: item.weightKg,
        lcaValue: item.lcaValue,
        emissionFactor: item.emissionFactor
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

  return (
    <div className="container">
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
              <button className = "icon" onClick={() => setShowAddProduct(true)}><Plus /></button>
            </div>
          </div>
          <div className="inventory-table-container">
            <table className="inventory-table">
              <thead className = "normal-bold">
                <tr>
                  <th></th>
                  <th>Product Name</th>
                  <th>Uploaded File</th>
                  <th>BoM</th>
                  <th>DPP</th>
                  <th>Total LCA Result</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="no-products-message">Loading products...</td>
                  </tr>
                )}
                
                {!loading && error && (
                  <tr>
                    <td colSpan={7} className="no-products-message" style={{ color: 'rgba(var(--danger), 1)' }}>
                      {error}
                    </td>
                  </tr>
                )}
                
                {!loading && !error && products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="no-products-message">
                      No products found. Click the <Plus size={16} style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 4px' }} /> button to add your first product.
                    </td>
                  </tr>
                )}
                
                {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="no-products-message">
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
                          {p.uploadedFile ? (
                            <a href="#" onClick={(e) => { e.preventDefault(); alert(`This would show the file: ${p.uploadedFile}`); }} target="_blank" rel="noopener noreferrer" className="link normal-bold">
                              BoM File
                            </a>
                          ) : (
                            <span style={{ color: '#828282' }}>[No File]</span>
                          )}
                        </td>
                        <td>
                          <a href="#" className="link normal-bold" onClick={(e) => { e.preventDefault(); setShowDppModal(true); setCurrentDpp(p.dppData || '[No DPP stored]'); }}>
                            View DPP
                          </a>
                        </td>
                        <td><strong>{formatTotalLca(p.lcaResult)}</strong></td>
                        <td>
                          <div className='two-row-component-container'>
                            <button className="icon" onClick={() => handleAddSubcomponent(p.productId)}><CirclePlus /></button>
                            <button className="icon" style = {{background: "rgba(var(--danger))"}} title = "Delete product" onClick={() => handleDelete(p.productId)}>
                              <Trash2 />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedRows[p.productId] && dpp && Array.isArray(dpp) && (
                        <tr className="sub-table-row">
                          <td colSpan={7}>
                            <div className="sub-table-container">
                              <table className="sub-inventory-table">
                                <thead className = " normal-bold">
                                  <tr>
                                    <th>No.</th>
                                    <th>Material</th>
                                    <th>Weight</th>
                                    <th>LCA (kgCO2e)</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dpp.map((item, idx) => {
                                    const key = `${p.productId}_${idx}`;
                                    const lcaValue = item.lcaValue;
                                    return (
                                      <tr key={idx}>
                                        <td>{idx + 1}</td>
                                        <td>
                                          <div>
                                            <input type="text" className="input-base" value={editableMaterials[key] ?? item.material} onChange={(e) => handleMaterialChange(e, p, idx)} onBlur={() => {
                                                setTimeout(() => setActiveSuggestionBox(null), 150);
                                                const typedValue = editableMaterials[key];
                                                if (typedValue !== undefined && typedValue !== item.material) {
                                                  let dpp = JSON.parse(p.dppData);
                                                  dpp[idx].material = typedValue;
                                                  dpp[idx].materialId = null;
                                                  dpp[idx].lcaValue = null;
                                                  dpp[idx].emissionFactor = null;
                                                  autoSaveProduct(p.productId, JSON.stringify(dpp));
                                                  runLcaCalculation(p.productId, idx, dpp[idx].weightKg);
                                                }
                                                setEditableMaterials(prev => ({...prev, [key]: undefined}));
                                              }} onFocus={() => {
                                                setActiveSuggestionBox(key);
                                                if (!item.material) {
                                                  handleMaterialChange({ target: { value: '' }}, p, idx);
                                                }
                                              }} placeholder="Search Materials"
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
                                          <input type="number" className="input-base" value={subProductWeights[key] ?? item.weightKg} min={0} step={0.01} onChange={e => setSubProductWeights(prev => ({
                                              ...prev,
                                              [key]: e.target.value
                                            }))} onBlur={(e) => handleWeightBlur(e, p, idx)}
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
                                                    return `${lcaValue.toFixed(3)} kgCO₂e`;
                                                  }
                                                  return lcaValue;
                                              })()
                                            )}
                                          </strong>
                                        </td>
                                        <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                          <button className="icon" style = {{background: "rgba(var(--danger))"}} title="Delete subcomponent" onClick={() => handleDeleteSubcomponent(p.productId, idx)}>
                                            <Trash2 size = {16} />
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
      {showAddProduct && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <p className = "medium-bold">Add a New Product</p>
              <button className="close-modal-btn" onClick={() => setShowAddProduct(false)}><X /></button>
            </div>
            <form id="addProductForm" onSubmit={handleAddProduct}>
              <div className = "add-product-form">
              <div className="input-group-col">
                <label className = "normal-bold" htmlFor="productName">Product Name <span className='submit-error'>*</span></label>
                <input className='input-base'type="text" id="productName" placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} required />
              </div>
              
              <div className="input-group-col">
                <label className="normal-bold">
                  Upload File <span className='submit-error'>*</span>
                </label>

                {productFile && (
                    <div className = "modal-header">
                      <p className='small-regular' style = {{color: `rgba(var(--blacks), 0.8)`}}>File Uploaded: <strong>{productFile.name}</strong></p>
                      <button type="button" className="remove-file-btn" onClick={() => handleFileSelect(null)}>
                        <X size = {14}/>
                      </button>
                    </div>
                )}

                <label htmlFor="fileUpload" className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}onDragOver={handleDragOver}onDragLeave={handleDragLeave}onDrop={handleDrop}>
                  <FilePlus />
                  <p className="small-regular" style={{ color: 'rgba(var(--blacks), 0.8)' }}>Drag and drop your file here</p>
                  <span className="outline-browse">
                    Or Browse Files
                  </span>
                  <input 
                    type="file" 
                    id="fileUpload"
                    className="file-input-hidden" 
                    accept=".csv"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                  />
                </label>
              </div>
              
              <button type="submit" className="default" disabled={uploading || !productName || !productFile}>
                {uploading ? "Uploading..." : "Add Product"}
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
              <p className="medium-bold">DPP Data</p>
              <button className="close-modal-btn" onClick={() => setShowDppModal(false)}><X /></button>
            </div>
            <pre className="dpp-modal-pre">
              {formatDpp(currentDpp)}
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