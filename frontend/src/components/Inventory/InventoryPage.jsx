import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import './InventoryPage.css';
import logoPath from '../../assets/carbonx.png';
import { 
  ChevronDown, Plus, Search, Triangle, Trash2, X, 
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, FilePlus, CirclePlus 
} from 'lucide-react';

// --- UPDATED: Smarter CSV parser ---
const parseCsvFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided."));

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/[\r\n]+/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          return reject(new Error("CSV must have a header and at least one data row."));
        }

        const headerLine = lines[0].trim();
        const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
        const lowerCaseHeaders = headers.map(h => h.toLowerCase());

        // Find required column indices
        const productNameIndex = lowerCaseHeaders.indexOf('product name');
        const ingredientIndex = lowerCaseHeaders.indexOf('ingredients'); // This is the component name
        const weightIndex = lowerCaseHeaders.indexOf('net weight (kg)');
        const packagingTypeIndex = lowerCaseHeaders.indexOf('packaging type');
        const packagingWeightIndex = lowerCaseHeaders.indexOf('packaging weight (g)');
        const transportModeIndex = lowerCaseHeaders.indexOf('transportation mode');

        const missingColumns = [];
        if (productNameIndex === -1) missingColumns.push('"Product Name"');
        if (ingredientIndex === -1) missingColumns.push('"Ingredients" (for LCA Component)');
        if (weightIndex === -1) missingColumns.push('"Net Weight (kg)"');
        if (packagingTypeIndex === -1) missingColumns.push('"Packaging Type"');
        if (packagingWeightIndex === -1) missingColumns.push('"Packaging Weight (g)"');
        if (transportModeIndex === -1) missingColumns.push('"Transportation Mode"');

        if (missingColumns.length > 0) {
          return reject(new Error(`Invalid CSV header. File is missing required columns: ${missingColumns.join(', ')}`));
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

          if (values.length < headers.length) {
             console.warn("Skipping malformed CSV line:", line);
             return null;
          }

          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index].replace(/"/g, '');
          });
          
          return {
            productName: rowData['Product Name'],
            ingredient: rowData['Ingredients'], 
            metadata: rowData // Store the entire row
          };

        }).filter(item => item !== null && item.productName && item.ingredient);

        resolve(data);
      } catch (err) {
        reject(new Error("An error occurred during parsing: " + err.message));
      }
    };
    
    reader.onerror = (e) => reject(new Error("Error reading file: " + e.target.error));
    reader.readAsText(file);
  });
};

// --- UPDATED: PDF Parsing Simulation ---
const parsePdfFile = (file) => {
  return new Promise((resolve, reject) => {
    alert(`Simulating PDF parse for: ${file.name}\n\nReading complex spec sheets from PDFs is difficult. For best results, please use the CSV template.\n\nMock data will be added for now.`);

    setTimeout(() => {
      const mockParsedData = [
        { 
          productName: 'PDF-Parsed Chair', 
          ingredient: 'Steel (from PDF)', 
          metadata: { 
            "Product Name": "PDF-Parsed Chair", 
            "Product GTIN/EAN/UPC": "PDF-123456", 
            "Brand": "MockBrand",
            "Ingredients": "Steel (from PDF)",
            "Net Weight (kg)": "10.5",
            "Country of Origin": "Mockland",
            "Packaging Type": "Cardboard Box",
            "Packaging Weight (g)": "500",
            "Transportation Mode": "Sea"
          } 
        },
      ];
      resolve(mockParsedData);
    }, 1500); 
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
  const [productFile, setProductFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDppModal, setShowDppModal] = useState(false);
  const [currentDppProduct, setCurrentDppProduct] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [subProductWeights, setSubProductWeights] = useState({});
  const [calculating, setCalculating] = useState({});
  const [editableIngredients, setEditableIngredients] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [activeSuggestionBox, setActiveSuggestionBox] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({isOpen: false, title: '', message: '', onConfirm: () => {},});

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  const [isProUser] = useState(localStorage.getItem('isProUser') === 'true');
  
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
  
  const autoSaveProduct = (productId, newDppData, newTotalLca = null, newMetadata = null) => {
    setProducts(currentProducts =>
      currentProducts.map(prod => {
        if (prod.productId === productId) {
          const updatedLcaResult = newTotalLca !== null ? newTotalLca : prod.lcaResult;
          const updatedMetadata = newMetadata !== null ? newMetadata : prod.metadata;
          return { ...prod, dppData: newDppData, lcaResult: updatedLcaResult, metadata: updatedMetadata };
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
          const updatedMetadata = newMetadata !== null ? newMetadata : prod.metadata;
          return { ...prod, dppData: newDppData, lcaResult: updatedLcaResult, metadata: updatedMetadata };
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

    let parsedData = [];
    try {
      if (productFile && productFile.name.endsWith('.pdf')) {
        parsedData = await parsePdfFile(productFile);
      } 
      else if (productFile && productFile.name.endsWith('.csv')) {
        parsedData = await parseCsvFile(productFile);
      } else {
        throw new Error("Invalid file type.");
      }

      if (parsedData.length === 0) {
        alert("Error: The file was empty or contained no valid data rows.");
        setUploading(false);
        return;
      }
    } catch (err) {
      console.error("Error parsing file:", err);
      alert(`Error parsing file: ${err.message}`);
      setUploading(false);
      return;
    }

    const productsMap = new Map();
    parsedData.forEach(item => {
      const { productName, ingredient, metadata } = item;
      
      if (!productsMap.has(productName)) {
        const initialDpp = [];
        
        const netWeightKg = parseFloat(metadata['Net Weight (kg)']);
        const packagingWeightG = parseFloat(metadata['Packaging Weight (g)']);
        const packagingWeightKg = isNaN(packagingWeightG) ? 0 : packagingWeightG / 1000;
        const packagingType = metadata['Packaging Type'];
        const transportMode = metadata['Transportation Mode'];

        const ingredientWeightKg = isNaN(netWeightKg) ? 0 : netWeightKg - packagingWeightKg;
        
        if (packagingType && !isNaN(packagingWeightKg)) {
          initialDpp.push({
            ingredient: packagingType,
            weightKg: packagingWeightKg, 
            unit: 'kg',
            materialId: null,
            lcaValue: null,
            emissionFactor: null,
            isPackaging: true,
            isTransport: false
          });
        }
        
        if (transportMode) {
           initialDpp.push({
            ingredient: `Transport (${transportMode})`,
            weightKg: 0, 
            unit: 'km',
            materialId: null,
            lcaValue: null,
            emissionFactor: null,
            isPackaging: false,
            isTransport: true
          });
        }

        productsMap.set(productName, {
          dpp: initialDpp,
          metadata: metadata,
          calculatedIngredientWeight: ingredientWeightKg 
        });
      }
      
      const productData = productsMap.get(productName);
      const ingredients = ingredient.split(';') 
        .map(ing => ing.trim())
        .filter(ing => ing);

      if (ingredients.length <= 1) {
        productData.dpp.push({
          ingredient: ingredient,
          weightKg: productData.calculatedIngredientWeight, 
          unit: 'kg',
          materialId: null,
          lcaValue: null,
          emissionFactor: null,
          isPackaging: false,
          isTransport: false
        });
      } else {
        const weightPerIngredient = productData.calculatedIngredientWeight / ingredients.length;
        ingredients.forEach(ingName => {
          productData.dpp.push({
            ingredient: ingName,
            weightKg: weightPerIngredient,
            unit: 'kg',
            materialId: null,
            lcaValue: null,
            emissionFactor: null,
            isPackaging: false,
            isTransport: false
          });
        });
      }
    });

    const newProducts = [];
    productsMap.forEach((data, productName) => {
      delete data.calculatedIngredientWeight; 

      newProducts.push({
        productId: new Date().getTime() + Math.random(),
        productName: productName,
        uploadedFile: productFile ? productFile.name : 'No file',
        dppData: JSON.stringify(data.dpp),
        metadata: data.metadata, 
        lcaResult: 0
      });
    });

    try {
      const allProductData = JSON.parse(localStorage.getItem('productData')) || {};
      const userProducts = allProductData[userId] || [];
      const updatedUserProducts = [...userProducts, ...newProducts];
      
      allProductData[userId] = updatedUserProducts;
      localStorage.setItem('productData', JSON.stringify(allProductData));

      setProducts(updatedUserProducts);
      setShowAddProduct(false);
      setProductFile(null);
    } catch (err) {
       console.error("Error adding products to localStorage:", err);
       alert('Error saving new products.');
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

  const handleComponentChange = (e, p, idx) => {
    const key = `${p.productId}_${idx}`;
    const query = e.target.value;
    setEditableIngredients(prev => ({ ...prev, [key]: query }));
    setActiveSuggestionBox(key);
    setProducts(currentProducts => {
      return currentProducts.map(prod => {
        if (prod.productId === p.productId) {
          let dpp = JSON.parse(prod.dppData);
          dpp[idx].ingredient = query;
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
      { name: "Nylon", openLcaMaterialId: 'mock-nylon' },
      { name: "Polyester Mesh", openLcaMaterialId: 'mock-polyester' },
      { name: "Rubber", openLcaMaterialId: 'mock-rubber' },
      { name: "Dried white sesame", openLcaMaterialId: 'mock-sesame' },
      { name: "Plastic pouch", openLcaMaterialId: 'mock-plastic-pouch' }, 
      { name: "Transport (Road)", openLcaMaterialId: 'mock-transport-road' },
      { name: "Transport (Sea)", openLcaMaterialId: 'mock-transport-sea' },
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
    if (!product) return;
    
    let dpp = JSON.parse(product.dppData);
    const item = dpp[indexToDelete];
    
    if (item.isPackaging) {
      alert("Packaging is part of the product spec sheet and cannot be deleted here.");
      return;
    }
    if (item.isTransport) {
      alert("Transport is part of the product spec sheet and cannot be deleted here.");
      return;
    }

    let ingredientName = item?.ingredient || 'this component';
    if (ingredientName.trim() === "") {
      ingredientName = 'this component';
    }

    setDeleteConfirm({
      isOpen: true,
      title: 'Delete LCA Component',
      message: `Are you sure you want to delete "${ingredientName}"?`,
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
    const materialIdentifier = item.materialId || item.ingredient;
    if (!materialIdentifier) {
      alert("Error: Cannot calculate without an LCA Component.");
      setCalculating(prev => ({ ...prev, [key]: false }));
      return;
    }

    let emissionFactor = item.emissionFactor;
    if (emissionFactor === null || emissionFactor === undefined) {
      emissionFactor = Math.random() * (5.0 - 0.5) + 0.5; // Mock emission factor
      if (item.isPackaging) emissionFactor = 1.5; 
      if (item.isTransport) emissionFactor = 0.5; // Mock for transport
      dpp[subcomponentIndex].emissionFactor = emissionFactor;
    }

    let calculatedLcaValue = 0;
    if (item.isTransport) {
      const distance = weightToUse; // In this case, "weight" is "distance"
      calculatedLcaValue = distance * emissionFactor;
      dpp[subcomponentIndex].weightKg = distance;
    } else {
      calculatedLcaValue = weightToUse * emissionFactor;
      dpp[subcomponentIndex].weightKg = weightToUse;
    }
    
    dpp[subcomponentIndex].lcaValue = calculatedLcaValue;

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
      (item.materialId || item.ingredient) &&
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
        const materialIdentifier = item.materialId || item.ingredient;
        if (!materialIdentifier) {
          return item;
        }
        
        let weightToUse = item.weightKg;

        let emissionFactor = item.emissionFactor;
        if (emissionFactor === null || emissionFactor === undefined) {
          emissionFactor = Math.random() * (5.0 - 0.5) + 0.5;
          if (item.isPackaging) emissionFactor = 1.5;
          if (item.isTransport) emissionFactor = 0.5;
        }
        
        let calculatedLcaValue = 0;

        if (item.isTransport) {
          // If weight is 0, use a mock distance
          const distance = (weightToUse === 0) ? 100 : weightToUse; // Mock 100 km if 0
          calculatedLcaValue = distance * emissionFactor;
          item.weightKg = distance; // Save the distance back
        } else {
          calculatedLcaValue = weightToUse * emissionFactor;
        }

        return {
          ...item,
          lcaValue: calculatedLcaValue,
          emissionFactor: emissionFactor,
          weightKg: item.weightKg // Ensure weight is saved
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

  const handleAddSubcomponent = (productId) => {
    const product = products.find(p => p.productId === productId);
    if (!product) return;
    let dpp = [];
    if (product.dppData) {
        try { dpp = JSON.parse(product.dppData); } catch (e) {}
    }
    dpp.push({ 
      ingredient: "",
      weightKg: 0, 
      unit: 'kg', // Default to kg for manual adds
      lcaValue: null,
      materialId: null,
      emissionFactor: null,
      isPackaging: false,
      isTransport: false
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
    
    if (item.materialId || item.ingredient) {
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

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.pdf')) {
      alert("Please upload a .csv or .pdf file.");
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

  const formatDpp = (product) => {
    if (!product) return '[No DPP stored]';
    
    let dppData;
    try {
      dppData = JSON.parse(product.dppData);
    } catch (e) {
      dppData = [];
    }
    
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
        if(metadata[key]) { 
          output += `${key}: ${metadata[key]}\n`;
        }
      }
    });

    output += "\n--- LCA COMPONENTS ---\n";
    if (dppData.length > 0) {
      dppData.forEach((item, index) => {
        output += `  [${index + 1}] Component: ${item.ingredient}\n`;
        output += `      Amount: ${item.weightKg} ${item.unit || 'kg'}\n`; 
        output += `      LCA Value: ${item.lcaValue ? item.lcaValue.toFixed(3) + ' kgCO2e' : 'Not calculated'}\n`;
        if (item.isPackaging) {
          output += `      (Packaging Component)\n`;
        }
        if (item.isTransport) {
          output += `      (Transport Component)\n`;
        }
      });
    } else {
      output += "No components listed for this product.\n";
    }

    return output;
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
                  {/* --- UPDATED: Removed Product Spec Sheet Column --- */}
                  <th>DPP</th>
                  <th>Total LCA Result</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    {/* --- UPDATED: ColSpan is 6 --- */}
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
                      No products found. Click the <Plus size={16} style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 4px' }} /> button to add your first product.
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
                        {/* --- REMOVED "Product Spec Sheet" <td> --- */}
                        <td>
                          <a href="#" className="link normal-bold" onClick={(e) => { e.preventDefault(); setShowDppModal(true); setCurrentDppProduct(p); }}>
                            View DPP
                          </a>
                        </td>
                        <td><strong>{formatTotalLca(p.lcaResult)}</strong></td>
                        <td>
                          <div className='two-row-component-container'>
                            <button className="icon" onClick={() => handleAddSubcomponent(p.productId)}><CirclePlus /></button>
                            <button className="icon" style = {{backgroundColor: "rgba(var(--danger), 1)"}} title = "Delete product" onClick={() => handleDelete(p.productId)}>
                              <Trash2 />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedRows[p.productId] && dpp && Array.isArray(dpp) && (
                        <tr className="sub-table-row">
                          {/* --- UPDATED: ColSpan is 6 --- */}
                          <td colSpan={6}>
                            <div className="sub-table-container">
                              <table className="sub-inventory-table">
                                <thead className = " normal-bold">
                                  <tr>
                                    <th>No.</th>
                                    <th>LCA Component</th>
                                    <th>Amount</th>
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
                                                  runLcaCalculation(p.productId, idx, dpp[idx].weightKg);
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
                                              disabled={isLocked}
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
                                            value={subProductWeights[key] ?? item.weightKg} 
                                            min={0} 
                                            step={isTransport ? 1 : 0.001}
                                            onChange={e => setSubProductWeights(prev => ({
                                                ...prev,
                                                [key]: e.target.value
                                              }))} 
                                            onBlur={(e) => handleWeightBlur(e, p, idx)}
                                            // --- THIS IS THE FIX: Amount is now editable for all rows ---
                                          />
                                        </td>
                                        <td>
                                          <input 
                                            type="text"
                                            className="input-base"
                                            value={item.unit || 'kg'}
                                            disabled // This field is read-only
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
                                          <button 
                                            className="icon" 
                                            style = {{backgroundColor: "rgba(var(--danger), 1)"}} 
                                            title={isLocked ? "Spec sheet components cannot be deleted" : "Delete component"} 
                                            onClick={() => handleDeleteSubcomponent(p.productId, idx)}
                                            disabled={isLocked}
                                          >
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
      
      {/* --- UPDATED: Add Product Modal --- */}
      {showAddProduct && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <p className = "medium-bold">Add New Products</p>
              <button className="close-modal-btn" onClick={() => setShowAddProduct(false)}><X /></button>
            </div>
            <form id="addProductForm" onSubmit={handleAddProduct}>
              <div className = "add-product-form">
              
              <div className="input-group-col">
                <label className="normal-bold">
                  Upload File <span className='submit-error'>*</span>
                </label>
                {/* --- REMOVED: Subtext --- */}

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
                  <p className="small-regular" style={{ color: 'rgba(var(--blacks), 0.8)' }}>Drag and drop your CSV or PDF here</p>
                  <span className="outline-browse">
                    Or Browse Files
                  </span>
                  <input 
                    type="file" 
                    id="fileUpload"
                    className="file-input-hidden" 
                    accept=".csv,.pdf" 
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                  />
                </label>
              </div>
              
              <button type="submit" className="default" disabled={uploading || !productFile}>
                {uploading ? "Uploading..." : "Add Products"}
              </button>
              </div>
            </form>
          </div>
        </div>
      )}
  
      {/* --- UPDATED: DPP Modal --- */}
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