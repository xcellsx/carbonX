import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as d3 from 'd3';
import './NetworkPage.css';
import logoPath from '../../assets/carbonx.png';
import { 
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, ChevronDown, Sparkles, Lock
} from 'lucide-react';

// --- Helper function (Unchanged) ---
const generateMockGraphData = (componentName, index, productName) => {
  const childNodeId = 100 + index;
  const grandChildNodeId = 200 + index;
  
  const rootNode = { 
    index: 1, 
    techFlow: { provider: { name: productName || 'Final Product' } }, 
    totalResult: 1000 
  };
  
  const childNode = { 
    index: childNodeId, 
    techFlow: { provider: { name: componentName } }, 
    totalResult: (Math.random() * 400 + 100)
  };
  
  const grandChildNode = { 
    index: grandChildNodeId, 
    techFlow: { provider: { name: `Raw Material for ${componentName.split(' ')[0]}` } }, 
    totalResult: (Math.random() * 100 + 50)
  };

  return {
    rootIndex: 1,
    nodes: [rootNode, childNode, grandChildNode],
    edges: [
      { providerIndex: 1, nodeIndex: childNodeId, result: childNode.totalResult },
      { providerIndex: childNodeId, nodeIndex: grandChildNodeId, result: grandChildNode.totalResult }
    ]
  };
};


// --- D3 Network Graph Component (UPDATED) ---
const NetworkGraph = ({ data }) => {
 const svgRef = useRef(null);
 const legendRef = useRef(null);
 const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
 
 // --- NEW: State to hold hovered node data ---
 const [hoveredNode, setHoveredNode] = useState(null);
 // --- REMOVED: tooltipRef ---

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

   const { nodes, edges, componentMap, rootNodeId, componentNames } = data;
   const { width, height } = containerSize;

   const svg = d3.select(svgRef.current);
   svg.selectAll("*").remove();

   // --- REMOVED: tooltip ---
   const legend = d3.select(legendRef.current);

   const g = svg.append('g');
   const zoom = d3.zoom()
     .scaleExtent([0.1, 4])
     .on('zoom', (event) => {
       g.attr('transform', event.transform);
     });
   svg.call(zoom);

   const color = d3.scaleOrdinal(d3.schemeCategory10)
     .domain(componentNames);

   const simulation = d3.forceSimulation(nodes)
     .force('link', d3.forceLink(edges).id(d => d.id).distance(150))
     .force('charge', d3.forceManyBody().strength(-400))
     .force('center', d3.forceCenter(width / 2, height / 2))
     .force('collide', d3.forceCollide().radius(35));

   svg.append("defs").selectAll("marker")
     .data(["end"])
     .enter().append("marker")
     .attr("id", "arrowhead")
     .attr("viewBox", "0 -5 10 10")
     .attr("refX", 20)
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
     .attr("marker-end", "url(#arrowhead)");

   const node = g.append("g")
     .attr("class", "nodes")
     .selectAll("g")
     .data(nodes)
     .join("g")
     .attr("class", "node")
     .call(drag(simulation));

   node.append("circle")
     .attr("r", d => (d.isRoot) ? 12 : 8)
     .attr("fill", d => (d.isRoot) ? "#334761" : color(componentMap.get(d.id)))
     .attr("stroke", "#fff")
     .attr("stroke-width", 1.5);

   node.append("text")
     .attr("x", 12)
     .attr("y", 4)
     .text(d => {
       const name = d.name || "Unnamed";
       return name.length > 25 ? name.substring(0, 25) + "..." : name;
     });

   // --- UPDATED: Mouse events now set React state ---
   node.on("mouseover", (event, d) => {
     setHoveredNode(d);
   })
   .on("mouseout", () => {
     setHoveredNode(null);
   });

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
       d.fx = null;
       d.fy = null;
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

 }, [data, containerSize]); // No change to dependencies

 return (
   <div className="network-graph-container">
     <svg ref={svgRef} width={containerSize.width} height={containerSize.height}></svg>
     <div ref={legendRef} className="graph-legend"></div>
     
     {/* --- NEW STATIC INFO BOX --- */}
     <div className="graph-info">
       <strong>Node Information</strong>
       {hoveredNode ? (
         <div style={{marginTop: '0.5rem'}}>
           <p><strong>Process:</strong> {hoveredNode.name || "Unknown"}</p>
           <p><strong>Component:</strong> {data.componentMap.get(hoveredNode.id) || "Main Product"}</p>
           <hr style={{margin: '0.5rem 0', border: 'none', borderTop: '1px solid #eee'}}/>
           <p><strong>Climate Change:</strong> {(hoveredNode.totalResult || 0).toPrecision(3)} kgCO2e</p>
         </div>
       ) : (
         <p style={{marginTop: '0.5rem', fontStyle: 'italic', color: '#666'}}>
           Hover over a node for details.
         </p>
       )}
     </div>
     {/* --- END NEW BOX --- */}

     {/* --- REMOVED: tooltip div --- */}
   </div>
 );
};


// --- Main Page Component (Unchanged) ---
const NetworkPage = () => {
  const [isProUser] = useState(localStorage.getItem('isProUser') === 'true'); 
  const navigate = useNavigate();
  const location = useLocation();

  const [userId] = useState(localStorage.getItem('userId') || '');
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  
  const [currentView, setCurrentView] = useState('consolidated');
  const [selectedComponentIndex, setSelectedComponentIndex] = useState(0);
  const [components, setComponents] = useState([]); 

  const [consolidatedData, setConsolidatedData] = useState(null); 
  const [componentGraphData, setComponentGraphData] = useState([]); 
  
  const [loadingNetwork, setLoadingNetwork] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(() => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      return;
    }
    try {
      const allProductData = JSON.parse(localStorage.getItem('productData')) || {};
      const userProducts = allProductData[userId] || [];
      setProducts(userProducts);
      setError('');
    } catch (err) {
      console.error("Failed to fetch products from localStorage:", err);
      setError('Could not load product list.');
      setProducts([]);
    }
  }, [userId]);

  const fetchNetworkData = useCallback((productComponents, productName) => {
    if (!productComponents || productComponents.length === 0) {
      setConsolidatedData(null);
      setComponentGraphData([]);
      return;
    }
    setLoadingNetwork(true);
    setError('');
    
    setTimeout(() => {
      try {
        const newComponentGraphs = productComponents.map((component, index) => {
          const componentName = component.ingredient || `Component ${index + 1}`;
          return {
            componentName: componentName,
            graphData: generateMockGraphData(componentName, index, productName)
          };
        });
        
        const responseData = { componentGraphs: newComponentGraphs, locations: {} };

        const { componentGraphs } = responseData;
        const nodes = new Map();
        const edges = new Set();
        const componentMap = new Map();
        const componentNames = new Set();
        let rootNodeId = null;
        
        const processedComponentGraphs = []; 

        for (const item of componentGraphs) {
          const { componentName, graphData } = item;
          if (!graphData || !graphData.nodes) continue;

          componentNames.add(componentName);
          if (rootNodeId === null) rootNodeId = graphData.rootIndex;

          const compNodes = new Map();
          const compEdges = [];
          const compMap = new Map();
          
          for (const node of graphData.nodes) {
            const providerId = node.techFlow?.provider?.["@id"] || `p${node.index}`;
            
            const nodeName = node.index === graphData.rootIndex
              ? (productName || 'Final Product')
              : (node.techFlow?.provider?.name || "Unknown");

            const nodeData = {
              id: node.index,
              providerId: providerId,
              name: nodeName,
              totalResult: node.totalResult,
              isRoot: node.index === graphData.rootIndex
            };
            
            if (!nodes.has(node.index)) {
              nodes.set(node.index, nodeData);
            }
            componentMap.set(node.index, componentName);

            compNodes.set(node.index, nodeData);
            compMap.set(node.index, componentName);
          }
          
          for (const edge of graphData.edges) {
            const edgeObj = {
              source: edge.providerIndex,
              target: edge.nodeIndex,
              value: edge.result
            };
            edges.add(JSON.stringify(edgeObj)); 
            compEdges.push(edgeObj); 
          }

          processedComponentGraphs.push({
            nodes: Array.from(compNodes.values()),
            edges: compEdges,
            componentMap: compMap,
            rootNodeId: graphData.rootIndex,
            componentNames: [componentName] 
          });
        }

        setConsolidatedData({
          nodes: Array.from(nodes.values()),
          edges: Array.from(edges).map(e => JSON.parse(e)),
          componentMap,
          rootNodeId,
          componentNames: Array.from(componentNames),
        });
        
        setComponentGraphData(processedComponentGraphs);

      } catch (err) {
        console.error("Error processing mock data:", err);
        setError("Failed to process network data.");
      } finally {
        setLoadingNetwork(false);
      }
    }, 500); 
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      const firstProductId = products[0].productId;
      setSelectedProductId(firstProductId);
    }
  }, [products, selectedProductId]);

  const selectedProduct = products.find(p => p.productId == selectedProductId);
  useEffect(() => {
    if (selectedProduct && selectedProduct.dppData) {
      try {
        const parsedComponents = JSON.parse(selectedProduct.dppData);
        setComponents(parsedComponents);
        setSelectedComponentIndex(0); 
      } catch (e) {
        console.error("Failed to parse DPP data for tabs:", e);
        setComponents([]);
      }
    } else {
      setComponents([]);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (components && components.length > 0 && selectedProduct) {
      fetchNetworkData(components, selectedProduct.productName);
    } else if (selectedProductId) {
      setConsolidatedData(null);
      setComponentGraphData([]);
    }
  }, [components, selectedProduct, fetchNetworkData]);

  const handleProductChange = (e) => {
    const newProductId = e.target.value;
    setSelectedProductId(newProductId);
    setCurrentView('consolidated');
    setSelectedComponentIndex(0);
   
    if (!newProductId) {
      setComponents([]);
      setConsolidatedData(null);
      setComponentGraphData([]);
    }
  };

  const handleComponentSelect = (index) => {
    setSelectedComponentIndex(index);
  };
 
  const handleViewToggle = () => {
    setCurrentView(prevView => (prevView === 'consolidated' ? 'component' : 'consolidated'));
  };

  const getGraphData = () => {
    if (currentView === 'consolidated') {
      return consolidatedData;
    }
    if (componentGraphData && componentGraphData[selectedComponentIndex]) {
      return componentGraphData[selectedComponentIndex];
    }
    return null; 
  };
  
  const activeGraphData = getGraphData();

  return (
    <div className="container">
      <div className="sidebar">
        {/* ... Sidebar JSX (unchanged) ... */}
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
              <h1>Network</h1>
              <p className = "medium-regular">View your product supply chain network here.</p>
            </div>
            <div className="sub-header" style={{ display: 'flex', alignItems: 'stretch' }}>
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

          {/* --- Toggle Switch (Unchanged) --- */}
          <div className="payment-toggle-group" style={{ borderBottom: 'none' }}>
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

          {/* --- Component Tabs (Unchanged) --- */}
          {currentView === 'component' && (
            selectedProductId && components.length > 0 ? (
              <nav className="component-tabs">
                {components.map((component, index) => (
                  <button
                    key={index}
                    className={`component-tab-btn ${index === selectedComponentIndex ? 'active' : ''}`}
                    onClick={() => handleComponentSelect(index)}
                  >
                    {component.ingredient || `Component ${index + 1}`}
                  </button>
                ))}
              </nav>
            ) : (
              <p className="normal-regular" style={{color: 'rgba(var(--greys), 1)', padding: '1rem 0'}}>
                {selectedProductId ? 'This product has no components to display.' : 'Please select a product.'}
              </p>
            )
          )}
          
          {/* --- Network Card (Unchanged) --- */}
          <div className="analytics-card" style={{marginTop: '0rem'}}>
            <div className="analytics-table-container">
              {loadingNetwork ? (
                <div className="loading-message">Loading data...</div>
              ) : activeGraphData ? (
                <NetworkGraph data={activeGraphData} />
              ) : (
                <div className="no-data-message" style={{padding: '2rem'}}>
                  {selectedProductId ? "No network data for this selection." : "Select a product to view its network."}
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