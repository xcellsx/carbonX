import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as d3 from 'd3';
import Navbar from '../../components/Navbar/Navbar';
import { ChevronDown } from 'lucide-react';
import './NetworkPage.css';
import { API_BASE, productAPI } from '../../services/api';

// --- IMPACT CATEGORIES (CORRECTED UUIDs) ---
const IMPACT_CATEGORIES = [
  { 
    id: "35ead5f0-fc9d-4afc-9f17-0f2a2fbffbd2", 
    name: "Climate Change", 
    unit: "kg CO2-Eq" 
  },
  { 
    id: "3e57c0c2-2f4c-45d2-8fb4-1acbf79768db", 
    name: "Land Use", 
    unit: "m2*a crop-Eq" 
  },
  { 
    id: "557a42a6-2248-4c5b-96f0-d27b40d78aae", 
    name: "Ozone Depletion", 
    unit: "kg CFC-11-Eq" 
  },
  { 
    id: "27c8e2ca-8240-4f82-a0ad-9ccbc59677f4", 
    name: "Particulate Matter", 
    unit: "kg PM2.5-Eq" 
  },
  { 
    id: "9ebba73d-68e7-4bd8-9c64-393134782a14", 
    name: "Photochemical Oxidant Formation", 
    unit: "kg NOx-Eq" 
  }
];

// --- 1. NODE RENAMING HELPER ---
const cleanNodeName = (rawName) => {
  if (!rawName) return "Unknown Process";

  const customMappings = {
    "Rapsanbau (Rapskorn), ab Feld": "Rapeseed Farming",
    "Rapskorn Transport, ab Hof": "Transport (Road)",
    "Rapskorn Lagerung, ab Lagerung": "Storage (Warehouse)",
    "Altholztransport, frei Hacker": "Wood Transport",
    "Industrierestholz Hackschnitzel (Wassergehalt 35%) Transport, frei Hackschnitzel-Lager": "Woodchips Transport",
    "Miscanthus Hackschnitzel (Wassergehalt 15%) Transport, frei Hackschnitzel-Lager (800 kW Kessel)": "Miscanthus Transport",
    "Bandtrockner, Trocknung von nassvermahlenem Industrierestholz von 35% Wassergehalt auf 10%, frei Pelletierung": "Drying Process",
    "Polyethylene (LDPE) granulate": "LDPE Granulate",
    "Electricity, medium voltage, at grid": "Electricity (Grid)",
    "Traktorbetrieb": "Tractor Operations" 
  };

  return customMappings[rawName] || rawName;
};

// --- D3 Network Graph Component ---
const NetworkGraph = ({ data, viewMode, productName, selectedCategory }) => {
  const svgRef = useRef(null);
  const legendRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const updateSize = () => {
      if (svgRef.current && svgRef.current.parentElement) {
        setContainerSize({
          width: svgRef.current.parentElement.offsetWidth,
          height: 600
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!data || !data.nodes || data.nodes.length === 0 || !svgRef.current) {
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    const { nodes, edges, componentMap, componentNames } = data;
    const { width, height } = containerSize;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const legend = d3.select(legendRef.current);

    const g = svg.append('g');
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(componentNames);

    // --- FORCE SIMULATION ---
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id).distance(d => d.target.isRoot ? 80 : 120))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(45));

    // --- FIX MAIN PRODUCT TO CENTER ---
    const mainNode = nodes.find(n => n.isMainProduct);
    if (mainNode) {
      mainNode.fx = width / 2;
      mainNode.fy = height / 2;
    }

    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("class", "link")
      .attr("marker-end", "url(#arrowhead)")
      .attr("stroke", "#999")
      .attr("stroke-width", 1.5);

    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .call(drag(simulation));

    // Node Circle
    node.append("circle")
      .attr("r", d => (d.isMainProduct ? 18 : (d.isRoot ? 12 : 8))) 
      .attr("fill", d => {
         if (d.isMainProduct) return "#334761"; // Dark blue for Main Product
         return color(componentMap.get(d.id));
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Node Label
    node.append("text")
      .attr("x", 16)
      .attr("y", 5)
      .text(d => {
        const name = d.name || "Unnamed";
        // Show full name for Main Product, truncate others
        return (d.isMainProduct || name.length < 20) ? name : name.substring(0, 20) + "...";
      })
      .style("font-size", d => d.isMainProduct ? "14px" : "12px")
      .style("font-weight", d => d.isMainProduct ? "bold" : "normal")
      .style("fill", "#333")
      .style("pointer-events", "none");

    node.on("mouseover", (event, d) => setHoveredNode(d))
        .on("mouseout", () => setHoveredNode(null));

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
    
    function drag(simulation) {
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        if (!d.isMainProduct) {
            d.fx = null;
            d.fy = null;
        }
      }
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    legend.html("");
    legend.append("strong").text("Components");
    const legendList = legend.append("ul");
    
    componentNames.forEach(name => {
      const item = legendList.append("li").attr("class", "legend-item");
      item.append("span")
        .attr("class", "legend-color-swatch")
        .style("background-color", color(name));
      item.append("span").text(name);
    });

  }, [data, containerSize]);

  return (
    <div className="network-graph-container">
      <svg ref={svgRef} width={containerSize.width} height={containerSize.height}></svg>
      <div ref={legendRef} className="graph-legend"></div>
      
      <div className="graph-info">
        <strong>Node Information</strong>
        {hoveredNode ? (
          <div style={{marginTop: '0.5rem'}}>
            {viewMode === 'component' ? (
               <p><strong>Product:</strong> {productName}</p>
            ) : (
               <p><strong>Process:</strong> {hoveredNode.name || "Unknown"}</p>
            )}
            
            {!hoveredNode.isMainProduct && (
               <p><strong>Component:</strong> {data.componentMap.get(hoveredNode.id) || "Main Product"}</p>
            )}
            
            <hr style={{margin: '0.5rem 0', border: 'none', borderTop: '1px solid #eee'}}/>
            <p><strong>{selectedCategory.name}:</strong> {(hoveredNode.totalResult || 0).toPrecision(3)} {selectedCategory.unit}</p>
          </div>
        ) : (
          <p style={{marginTop: '0.5rem', fontStyle: 'italic', color: '#666'}}>
            Hover over a node for details.
          </p>
        )}
      </div>
    </div>
  );
};

// --- Main Page Component ---
const NetworkPage = () => {
  const [userId] = useState(localStorage.getItem('userId') || '');
  const [isProUser] = useState(localStorage.getItem('isProUser') === 'true');
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  
  // --- PERSISTENCE ---
  const [selectedProductId, setSelectedProductId] = useState(
    sessionStorage.getItem('network_selectedProductId') || ''
  );
  const [currentView, setCurrentView] = useState('consolidated'); 
  const [selectedComponentIndex, setSelectedComponentIndex] = useState(0);
  const [components, setComponents] = useState([]); 
  
  // --- Category Selection State ---
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const savedId = sessionStorage.getItem('network_selectedCategory');
    // Default to Climate Change if no saved ID or saved ID is invalid
    return IMPACT_CATEGORIES.find(c => c.id === savedId) || IMPACT_CATEGORIES[0];
  });

  const [consolidatedData, setConsolidatedData] = useState(null); 
  const [componentGraphData, setComponentGraphData] = useState([]); 
  
  const [loadingNetwork, setLoadingNetwork] = useState(false);
  const [error, setError] = useState('');

  // --- Fetch Product List ---
  const fetchProducts = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await productAPI.getAllProducts();
      const raw = Array.isArray(res.data) ? res.data : [];
      const filtered = userId ? raw.filter((p) => p.userId === userId) : raw;
      const data = filtered.map((p) => ({
        productId: p.id ?? p._id ?? p.key,
        productName: p.name,
        dppData: (p.functionalProperties && p.functionalProperties.dppData) || '[]',
        lcaResult: p.DPP?.carbonFootprint?.total ?? 0,
        userId: p.userId,
      }));
      setProducts(data);
      setError('');
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
    }
  }, [userId]);

  // --- Fetch Network Graph Data (REAL BACKEND) ---
  const fetchNetworkData = useCallback(async (productId, categoryId) => {
    if (!productId) {
      setConsolidatedData(null);
      setComponentGraphData([]);
      return;
    }
    setLoadingNetwork(true);
    setError('');

    try {
      // 1. Call Backend with Category
      const res = await fetch(`${API_BASE}/network/product-network?productId=${productId}&impactCategoryId=${categoryId}`);
      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || `Failed to fetch network`);
      }
      
      const { componentGraphs, productName, inventoryTotal } = responseData; 
      
      const nodes = new Map();
      const edges = new Set();
      const componentMap = new Map();
      const componentNames = new Set();
      let rootNodeId = null;
      
      const processedComponentGraphs = []; 

      // 2. Create Main Product Node (Consolidated View)
      const mainRootId = 'root-product';
      
      // Use inventoryTotal only if Climate Change is selected
      let mainNodeValue = 0;
      if (categoryId === "35ead5f0-fc9d-4afc-9f17-0f2a2fbffbd2" && inventoryTotal) {
          mainNodeValue = inventoryTotal;
      }

      const mainProductNode = {
        id: mainRootId,
        name: productName || "Main Product", 
        isRoot: true,
        isMainProduct: true,
        totalResult: mainNodeValue 
      };
      nodes.set(mainRootId, mainProductNode);

      // 3. Process Graphs
      for (const item of componentGraphs) {
        const { componentName, graphData } = item;
        
        if (!graphData || !graphData.nodes || (graphData.error && graphData.error === "LCA_CALCULATION_FAILED")) {
          continue; 
        }

        componentNames.add(componentName);

        const compNodes = new Map();
        const compEdges = [];
        const compMap = new Map();
        
        let componentRootId = null; 

        for (const node of graphData.nodes) {
          const providerId = node.techFlow?.provider?.["@id"];
          const isRoot = node.index === graphData.rootIndex;
          
          if (isRoot) componentRootId = node.index;

          const rawName = node.techFlow?.provider?.name;
          const displayName = isRoot ? componentName : cleanNodeName(rawName);

          const nodeData = { 
            id: node.index,
            providerId: providerId, 
            name: displayName, 
            flowName: node.techFlow?.flow?.name || "Unknown Flow",
            totalResult: node.totalResult,
            directResult: node.directResult,
            isRoot: isRoot
          };

          if (!nodes.has(node.index)) {
            nodes.set(node.index, nodeData);
          }

          compNodes.set(node.index, nodeData);
          compMap.set(node.index, componentName);
        }

        for (const edge of graphData.edges) {
           const edgeObj = {
            source: edge.providerIndex,
            target: edge.nodeIndex,
            value: edge.result
          };
          compEdges.push(edgeObj);
          edges.add(JSON.stringify(edgeObj)); 
        }

        // 4. Link to Main Product
        if (componentRootId !== null) {
            const linkToMain = {
                source: componentRootId, // Point TO Main
                target: mainRootId,      
                value: 1
            };
            edges.add(JSON.stringify(linkToMain));
            
            if (mainNodeValue === 0) {
                 const rootNode = compNodes.get(componentRootId);
                 if (rootNode) mainProductNode.totalResult += (rootNode.totalResult || 0);
            }
        }

        processedComponentGraphs.push({
          nodes: Array.from(compNodes.values()),
          edges: compEdges,
          componentMap: compMap,
          rootNodeId: graphData.rootIndex,
          componentNames: [componentName]
        });
      }

      const consolidatedComponentMap = new Map();
      processedComponentGraphs.forEach(g => {
         const name = g.componentNames[0];
         g.nodes.forEach(n => consolidatedComponentMap.set(n.id, name));
      });

      setConsolidatedData({ 
        nodes: Array.from(nodes.values()), 
        edges: Array.from(edges).map(e => JSON.parse(e)), 
        componentMap: consolidatedComponentMap, 
        rootNodeId: mainRootId,
        componentNames: Array.from(componentNames)
      });
      
      setComponentGraphData(processedComponentGraphs);

    } catch (err) {
      console.error("Error fetching network data:", err);
      setError(`Could not load network data: ${err.message}`);
      setConsolidatedData(null);
    } finally {
      setLoadingNetwork(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Restore selection from storage
  useEffect(() => {
    if (products.length > 0 && selectedProductId) {
        const productExists = products.find(p => p.productId == selectedProductId);
        if (productExists) {
            if (productExists.dppData) {
                try { setComponents(JSON.parse(productExists.dppData)); } catch(e) {}
            }
            fetchNetworkData(selectedProductId, selectedCategory.id);
        } else {
            setSelectedProductId('');
            sessionStorage.removeItem('network_selectedProductId');
        }
    }
  }, [products]);

  const handleProductChange = (e) => {
    const newProductId = e.target.value;
    setSelectedProductId(newProductId);
    sessionStorage.setItem('network_selectedProductId', newProductId); 
    
    setCurrentView('consolidated');
    setSelectedComponentIndex(0);
    
    if (newProductId) {
      const product = products.find(p => p.productId == newProductId);
      if (product && product.dppData) {
        try {
          setComponents(JSON.parse(product.dppData));
        } catch(e) { setComponents([]); }
      }
      fetchNetworkData(newProductId, selectedCategory.id);
    } else {
      setConsolidatedData(null);
      setComponentGraphData([]);
      setComponents([]);
    }
  };

  const handleCategoryChange = (e) => {
    const newCategoryId = e.target.value;
    const categoryObj = IMPACT_CATEGORIES.find(c => c.id === newCategoryId);
    setSelectedCategory(categoryObj);
    sessionStorage.setItem('network_selectedCategory', newCategoryId); 

    if (selectedProductId) {
        fetchNetworkData(selectedProductId, newCategoryId);
    }
  };

  const handleViewToggle = () => {
    setCurrentView(prev => (prev === 'consolidated' ? 'component' : 'consolidated'));
  };

  const activeGraphData = currentView === 'consolidated' 
    ? consolidatedData 
    : (componentGraphData[selectedComponentIndex] || null);

  const selectedProduct = products.find(p => p.productId == selectedProductId);
  const productName = selectedProduct ? selectedProduct.productName : "Unknown Product";

  return (
    <div className="container">
      <Navbar />
      <div className="content-section-main">
        <div className="content-container-main">
          <div className="header-group">
            <h1>Network</h1>
            <p className = "medium-regular">View your product supply chain network here.</p>
          </div>
          
          <div className="sub-header" style={{ display: 'flex', alignItems: 'stretch', gap: '1.5rem' }}>
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
          </div>

          {error && <div className="submit-error" style={{ margin: '1rem 0'}}>{error}</div>}

          {selectedProductId && (
            <div className="payment-toggle-group" style={{ borderBottom: 'none', justifyContent: 'flex-start' }}>
              <span className={currentView === 'consolidated' ? 'normal-bold' : 'normal-regular'}>
                Consolidated View
              </span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={currentView === 'component'} 
                  onChange={handleViewToggle} 
                />
                <span className="slider round"></span>
              </label>
              <span className={currentView === 'component' ? 'normal-bold' : 'normal-regular'}>
                Component View
              </span>
            </div>
          )}

          <div className="sub-header" style={{ display: 'flex', alignItems: 'stretch', gap: '1.5rem' }}>
            <div className = "header-col">
              <label htmlFor="category-select" className="normal-bold">Impact Category:</label>
              <div className="select-wrapper">
                <select 
                  id="category-select" 
                  className="input-base"
                  value={selectedCategory.id} 
                  onChange={handleCategoryChange}
                >
                  {IMPACT_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-arrow" />
              </div>
            </div>
          </div>

          {currentView === 'component' && (
            selectedProductId && components.length > 0 ? (
              <nav className="component-tabs">
                {components.map((component, index) => (
                  <button
                    key={index}
                    className={`component-tab-btn ${index === selectedComponentIndex ? 'active' : ''}`}
                    onClick={() => setSelectedComponentIndex(index)}
                  >
                    {component.component || component.ingredient || `Component ${index + 1}`}
                  </button>
                ))}
              </nav>
            ) : (
              <p className="normal-regular" style={{color: 'rgba(var(--greys), 1)', padding: '1rem 0'}}>
                {selectedProductId ? 'This product has no components to display.' : ''}
              </p>
            )
          )}


          <div className="analytics-card" style={{marginTop: '0rem'}}>
            <div className="analytics-table-container">
              {loadingNetwork ? (
                <div className="loading-message">Loading network data...</div>
              ) : activeGraphData && activeGraphData.nodes && activeGraphData.nodes.length > 0 ? (
                <NetworkGraph 
                  data={activeGraphData} 
                  viewMode={currentView} 
                  productName={productName}
                  selectedCategory={selectedCategory} 
                />
              ) : (
                <div className="no-data-message" style={{padding: '2rem'}}>
                  {selectedProductId ? "No network data available for this selection." : "Select a product to view its network."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkPage;