// 1. Added 'useRef' to the React imports
import React, { useState, useEffect, useRef } from 'react';
// import './GuidePage.css';
import { useNavigate, Link } from 'react-router-dom';
import Lottie from 'lottie-react';
import animationData from '../../lottie/logo.json';
import { ChevronDown, Plus, Search, Triangle, Trash2, X } from 'lucide-react';

// Backend logic is fully removed.

function GuidePage() {
  const navigate = useNavigate();

  // --- Real State ---
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState('');
  const [productFile, setProductFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showDppModal, setShowDppModal] = useState(false);
  const [activeTask, setActiveTask] = useState(-1);
  const [currentDpp, setCurrentDpp] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 2. Added 'isDragging' state for the new file drop zone
  const [isDragging, setIsDragging] = useState(false);

  // --- State for Collapsible Rows ---
  const [expandedRows, setExpandedRows] = useState({});

  const [fullName, setFullName] = useState("User");

  // --- Mock/Hard-coded states ---
  const calculating = {};
  const saving = false;

  // 3. Added 'fileInputRef' to control the hidden file input
  const fileInputRef = useRef(null);
  
  // Load user's name and products from localStorage
  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      console.warn("No user ID found.");
      return; 
    }

    // Load Full Name
    const allUsers = JSON.parse(localStorage.getItem('users')) || [];
    const currentUser = allUsers.find(user => user.id === currentUserId);
    if (currentUser) {
      setFullName(currentUser.fullName);
    }

    // Load Products
    const allProductData = JSON.parse(localStorage.getItem('productData')) || {};
    const userProducts = allProductData[currentUserId] || [];
    setProducts(userProducts);

  }, []);

  // --- Helper Functions ---
  function formatDpp(dpp) { 
    if (!dpp) return "";
    try {
      if (typeof dpp === 'string') {
        return JSON.stringify(JSON.parse(dpp), null, 2);
      }
      return JSON.stringify(dpp, null, 2);
    } catch(e) { 
      return dpp;
    }
  }
  
  const formatTotalLca = (value) => value ? `${value.toFixed(3)} kgCO₂e` : '0.000 kgCO₂e';

  // Re-wrote handleAddProduct to save to localStorage
  const handleAddProduct = (e) => {
    e.preventDefault();
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      alert("Error: No user is logged in.");
      return;
    }

    const newProduct = {
      productId: new Date().getTime(),
      productName: productName,
      uploadedFile: productFile ? productFile.name : 'No file',
      dppData: JSON.stringify([
        { component: "Component A (Mock)", process: "Process A", weightKg: 10, processId: 'p1', lcaValue: 1.234 },
        { component: "Component B (Mock)", process: "Process B", weightKg: 5, processId: 'p2', lcaValue: 0.567 }
      ]),
      lcaResult: 1.801
    };

    const allProductData = JSON.parse(localStorage.getItem('productData')) || {};
    const userProducts = allProductData[currentUserId] || [];
    const updatedUserProducts = [...userProducts, newProduct];
    
    allProductData[currentUserId] = updatedUserProducts;
    localStorage.setItem('productData', JSON.stringify(allProductData));

    setProducts(updatedUserProducts);
    setShowAddProduct(false);
    setProductName('');
    setProductFile(null);
  };

  // Created a real delete function
  const handleDeleteProduct = (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      alert("Error: No user is logged in.");
      return;
    }

    const allProductData = JSON.parse(localStorage.getItem('productData')) || {};
    const userProducts = allProductData[currentUserId] || [];
    
    const updatedUserProducts = userProducts.filter(p => p.productId !== productId);
    
    allProductData[currentUserId] = updatedUserProducts;
    localStorage.setItem('productData', JSON.stringify(allProductData));

    setProducts(updatedUserProducts);
  };

  // 4. Added new file handler functions for the drop zone
  const handleFileSelect = (file) => {
    if (file) {
      // You can add file type validation here if needed, e.g.
      // if (file.type !== "text/csv") {
      //   alert("Please upload a .csv file.");
      //   return;
      // }
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

  // Filtering logic
  const filteredProducts = products.filter(p =>
    p.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to toggle collapsible rows
  const toggleRow = (productId) => {
    setExpandedRows(prevExpandedRows => ({
      ...prevExpandedRows,
      [productId]: !prevExpandedRows[productId]
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
                {activeTask === 1 && (
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

                    {/* --- TASK 2 TABLE --- */}
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
                          let dpp = null;
                          try {
                            dpp = (typeof p.dppData === 'string' ? JSON.parse(p.dppData) : p.dppData);
                          } catch (e) {
                            console.error("Failed to parse DPP data:", p.dppData);
                          }
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
                                    onClick={() => handleDeleteProduct(p.productId)}>
                                    <Trash2 />
                                  </button>
                                </td>
                              </tr>

                              {/* --- COLLAPSIBLE SUB-TABLE ROW --- */}
                              {isExpanded && dpp && Array.isArray(dpp) && dpp.length > 0 && (
                                <tr className="tr-sub-table">
                                  <td colSpan={7}>
                                    <div className="sub-table-wrapper">
                                      <table className="sub-inventory-table">
                                        <thead>
                                          <tr>
                                            <th className="th-icon">No</th> 
                                            <th>Material</th> 
                                            <th>Weight</th>
                                            <th>LCA</th>
                                            <th className="th-icon"></th> 
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(() => {
                                            const item = dpp[0];
                                            if (!item) return null;
                                            
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
                )}
              </div>
            </div>
            <button id="dashboardButton" className="default" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </div>

          {/* 5. Updated the 'Add Product' modal JSX to match the Figma design */}
          {showAddProduct && (
            <div className="modal-overlay active">
              <div className="modal-content">
                <div className="modal-header">
                  <p className = "medium-bold">Add a New Product</p>
                  <button className="close-modal-btn" onClick={() => setShowAddProduct(false)}><X /></button>
                </div>
                <form id="addProductForm" onSubmit={handleAddProduct}>
                  <div className="form-group">
                    {/* Label is now outside/above the input per standard forms */}
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
                  
                  {/* --- NEW FILE UPLOAD SECTION --- */}
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
                      {/* Hidden file input, controlled by ref */}
                      <input 
                        type="file" 
                        id="fileUpload"
                        ref={fileInputRef}
                        className="file-input-hidden" // This class hides the default input
                        accept=".csv" // Assuming you still want CSVs
                        onChange={(e) => handleFileSelect(e.target.files[0])}
                      />
                      
                      <p className="file-drop-zone-text">Drag and drop your file here</p>
                      
                      <button 
                        type="button" // Important: type="button" prevents form submission
                        className="browse-files-btn" 
                        onClick={handleBrowseClick} // Triggers the hidden input
                      >
                        Browse Files
                      </button>
                    </div>
                  </div>
                  
                  {/* 6. Updated submit button text and disabled logic */}
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