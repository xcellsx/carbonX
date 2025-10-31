import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import * as d3 from 'd3';
import './NetworkPage.css';

const API_BASE = 'http://localhost:8080/api';

// --- GeoJSON for the world map (simplified) ---
const worldGeoJson = {
  "type": "FeatureCollection",
  "features": [
    {"type":"Feature","properties":{"name":"Antarctica"},"geometry":{"type":"Polygon","coordinates":[[[-59.57,-80.04],[-57.53,-80.76],[-53.8,-80.88],[-50.41,-81.25],[-49.7,-81.56],[-46.7,-81.14],[-44.62,-80.99],[-40.86,-80.88],[-38.63,-80.52],[-36.21,-80.64],[-33.68,-80.29],[-31.64,-80.29],[-30.4,-80.18],[-28.36,-80.07],[-25.5,-80.07],[-23.64,-79.62],[-21.95,-79.28],[-19.6,-78.43],[-16.14,-77.3],[-13.8,-76.74],[-11.1,-75.74],[-8.04,-75.03],[-5.34,-74.32],[-3.4,-73.97],[-1.71,-73.41],[1.92,-72.6],[4.27,-72.09],[7.13,-71.74],[10.18,-71.63],[13.04,-71.42],[15.54,-71.42],[19.01,-70.97],[21.9,-70.76],[24.25,-70.66],[26.41,-70.66],[28.57,-70.45],[30.73,-70.34],[33.23,-70.34],[35.4,-70.34],[37.75,-70.13],[40.29,-69.83],[42.45,-69.83],[45.24,-69.52],[47.22,-69.52],[49.03,-69.41],[51.52,-69.41],[54.22,-69.31],[56.57,-69.31],[58.73,-69.31],[61.23,-69.21],[63.4,-69.21],[65.74,-69.1],[68.09,-68.99],[70.26,-68.99],[72.6,-68.99],[75.14,-68.78],[77.31,-68.78],[79.66,-68.68],[82.19,-68.47],[84.36,-68.47],[86.71,-68.37],[89.24,-68.16],[91.59,-68.06],[93.76,-68.06],[95.93,-67.95],[98.28,-67.85],[100.45,-67.85],[102.8,-67.74],[105.33,-67.53],[107.5,-67.53],[109.85,-67.43],[112.2,-67.43],[114.55,-67.32],[116.9,-67.32],[119.25,-67.32],[121.78,-67.11],[123.95,-67.11],[126.3,-67.01],[128.65,-67.01],[131,-66.9],[133.35,-66.9],[135.52,-66.9],[137.87,-66.8],[140.04,-66.8],[142.39,-66.8],[144.56,-66.8],[146.91,-66.7],[149.08,-66.7],[151.43,-66.69],[153.6,-66.69],[155.95,-66.69],[158.12,-66.8],[160.29,-66.8],[162.64,-66.9],[164.81,-67.01],[167.16,-67.11],[169.33,-67.32],[171.68,-67.43],[173.85,-67.64],[175.83,-67.95],[177.82,-68.27],[179.99,-68.68],[-177.82,-69.1],[-175.46,-69.52],[-173.29,-69.83],[-170.94,-70.13],[-168.77,-70.45],[-166.42,-70.76],[-164.07,-71.08],[-161.9,-71.42],[-159.55,-71.85],[-157.38,-72.17],[-154.85,-72.71],[-152.68,-73.04],[-150.15,-73.69],[-147.8,-74.22],[-145.45,-74.65],[-143.28,-74.97],[-140.93,-75.4],[-138.58,-75.83],[-136.41,-76.15],[-134.06,-76.48],[-131.71,-76.91],[-129.54,-77.23],[-127.19,-77.56],[-124.84,-77.99],[-122.67,-78.31],[-120.32,-78.64],[-118.15,-78.96],[-115.8,-79.28],[-113.63,-79.6],[-111.28,-79.92],[-109.11,-80.14],[-106.76,-80.46],[-104.59,-80.67],[-102.24,-80.99],[-100.07,-81.31],[-97.9,-81.63],[-95.55,-81.96],[-93.38,-82.17],[-91.03,-82.49],[-88.86,-82.7],[-86.51,-83.02],[-84.34,-83.23],[-82.17,-83.34],[-79.82,-83.55],[-77.65,-83.65],[-75.3,-83.65],[-73.13,-83.55],[-70.96,-83.34],[-68.61,-83.02],[-66.44,-82.49],[-64.09,-81.85],[-61.92,-81.14],[-59.57,-80.04]]]}},
    {"type":"Feature","properties":{"name":"Greenland"},"geometry":{"type":"Polygon","coordinates":[[[-46.68,83.63],[-44.25,83.63],[-41.06,83.63],[-38.2,83.48],[-35.88,83.48],[-33.56,83.33],[-31.25,83.33],[-28.93,83.18],[-26.61,83.03],[-24.47,82.73],[-23.01,82.28],[-22.38,81.98],[-22.56,81.53],[-23.38,81.23],[-24.38,81.08],[-25.21,80.78],[-26.21,80.63],[-26.91,80.18],[-27.74,79.88],[-28.57,79.73],[-29.27,79.43],[-29.97,79.28],[-30.49,78.83],[-31.2,78.53],[-31.72,78.08],[-32.42,77.78],[-33.12,77.33],[-33.83,77.03],[-34.88,76.58],[-35.76,76.43],[-36.81,75.98],[-37.86,75.68],[-38.91,75.38],[-39.96,75.08],[-41.01,74.78],[-42.06,74.33],[-43.29,73.88],[-44.34,73.58],[-45.57,73.13],[-46.62,72.83],[-47.85,72.38],[-48.9,72.08],[-50.13,71.63],[-51.18,71.33],[-52.4,70.88],[-53.45,70.58],[-54.68,70.13],[-55.73,69.83],[-56.96,69.38],[-57.84,69.23],[-59.07,68.78],[-59.95,68.63],[-61.18,68.18],[-62.23,67.88],[-63.45,67.43],[-64.33,67.28],[-65.56,66.83],[-66.44,66.68],[-67.67,66.23],[-68.55,66.08],[-69.78,65.63],[-70.66,65.48],[-71.89,65.03],[-72.77,64.88],[-73.28,64.58],[-73.63,64.13],[-73.46,63.68],[-73.11,63.23],[-72.58,62.78],[-71.87,62.33],[-70.99,61.88],[-69.94,61.43],[-68.71,60.98],[-67.31,60.68],[-65.73,60.38],[-64.15,60.08],[-62.39,59.93],[-60.63,59.78],[-58.87,59.63],[-57.11,59.63],[-55.17,59.78],[-53.24,59.93],[-51.31,60.08],[-49.37,60.23],[-47.44,60.53],[-45.68,60.68],[-44.27,60.98],[-43.92,60.53],[-43.57,60.08],[-43.57,59.63],[-43.75,59.18],[-44.27,58.88],[-44.97,58.58],[-45.68,58.43],[-46.56,58.13],[-47.44,58.13],[-48.32,57.98],[-49.2,57.83],[-50.08,57.83],[-50.96,57.68],[-51.84,57.68],[-52.72,57.53],[-53.77,57.53],[-54.82,57.53],[-55.87,57.53],[-56.92,57.53],[-57.97,57.53],[-59.02,57.53],[-60.07,57.53],[-61.12,57.53],[-62.17,57.53],[-63.22,57.53],[-64.27,57.53],[-65.32,57.53],[-66.37,57.53],[-67.42,57.53],[-68.47,57.53],[-69.52,57.53],[-70.57,57.53],[-71.62,57.53],[-72.67,57.53],[-73.72,57.53],[-74.77,57.53],[-75.82,57.53],[-76.87,57.53],[-77.92,57.53],[-78.97,57.53],[-80.02,57.53],[-81.07,57.53],[-82.12,57.53],[-83.17,57.53],[-83.17,58.58],[-83.17,59.63],[-83.17,60.68],[-83.17,61.73],[-83.17,62.78],[-83.17,63.83],[-83.17,64.88],[-83.17,65.93],[-83.17,66.98],[-83.17,68.03],[-83.17,69.08],[-83.17,70.13],[-83.17,71.18],[-83.17,72.23],[-83.17,73.28],[-83.17,74.33],[-83.17,75.38],[-83.17,76.43],[-83.17,77.48],[-83.17,78.53],[-82.12,78.83],[-81.07,79.13],[-80.02,79.43],[-78.97,79.73],[-77.92,80.03],[-76.87,80.33],[-75.82,80.63],[-74.77,80.93],[-73.72,81.23],[-72.67,81.53],[-71.62,81.83],[-70.57,82.13],[-69.52,82.43],[-68.47,82.73],[-67.42,83.03],[-66.37,83.33],[-65.32,83.48],[-64.27,83.63],[-63.22,83.78],[-62.17,83.78],[-61.12,83.93],[-60.07,83.93],[-59.02,83.93],[-57.97,83.93],[-56.92,83.93],[-55.87,83.93],[-54.82,83.93],[-53.77,83.93],[-52.72,83.93],[-51.67,83.93],[-50.62,83.93],[-49.57,83.93],[-48.52,83.93],[-47.47,83.78],[-46.68,83.63]]]}}
    // ... (rest of geojson features)
  ]
};

// --- Hardcoded map of location codes to coordinates ---
const locationCoords = {
  "DE": [10.4515, 51.1657],  // Germany
  "US": [-95.7129, 37.0902],  // USA
  "CN": [104.1954, 35.8617], // China
  "JP": [138.2529, 36.2048],  // Japan
  "IN": [77.1025, 28.7041],  // India
  "GB": [-3.4360, 55.3781],  // Great Britain
  "FR": [2.2137, 46.2276],   // France
  "IT": [12.5674, 41.8719],  // Italy
  "BR": [-47.8825, -14.2350], // Brazil
  "CA": [-106.3468, 56.1304], // Canada
  "RU": [105.3188, 61.5240], // Russia
  "AU": [133.7751, -25.2744], // Australia
  "GLO": [0, 0], // Global
  "RoW": [0, 0], // Rest of World
  "CH": [8.2275, 46.8182] // Switzerland
  // Add more as needed
};

// --- D3 Network Graph Component ---
const NetworkGraph = ({ data }) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const legendRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

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

    const tooltip = d3.select(tooltipRef.current);
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

    node.on("mouseover", (event, d) => {
      const componentName = componentMap.get(d.id) || "Main Product";
      tooltip.style("opacity", 1)
        .html(`
          <strong>Process:</strong> ${d.name || "Unknown"}<br>
          <strong>Component:</strong> ${componentName}<br>
          <hr>
          <strong>Climate Change:</strong> ${(d.totalResult || 0).toPrecision(3)} kgCO2e
        `);
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
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

  }, [data, containerSize]);

  return (
    <div className="network-graph-container">
      <svg ref={svgRef} width={containerSize.width} height={containerSize.height}></svg>
      <div ref={legendRef} className="graph-legend"></div>
      <div ref={tooltipRef} className="graph-tooltip"></div>
    </div>
  );
};


// --- Map View Component ---
const MapView = ({ data }) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const legendRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

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
    if (!data || !data.nodes || !svgRef.current) {
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }
    
    // --- FIX: Destructure componentNames and locations from data ---
    const { nodes, componentMap, componentNames, locations } = data;
    const { width, height } = containerSize;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const tooltip = d3.select(tooltipRef.current);
    const legend = d3.select(legendRef.current);

    // --- Create Map Projection ---
    const projection = d3.geoMercator()
      .center([20, 10])
      .scale(width / 5.5)
      .translate([width / 2, height / 1.8]);

    const pathGenerator = d3.geoPath().projection(projection);

    // --- ADDED: Zoom behavior for the map ---
    const zoom = d3.zoom()
      .scaleExtent([1, 8]) // Only allow zooming in
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // --- ADDED: Main 'g' element for zooming ---
    const g = svg.append("g");

    // --- Draw Map Background (inside 'g') ---
    g.append("g")
      .selectAll("path")
      .data(worldGeoJson.features)
      .join("path")
      .attr("d", pathGenerator)
      .attr("class", "map-country");
      
    // --- Get Home Location (assuming 'DE' for demo) ---
    const homeLocationCode = "DE"; 
    const homeLocation = locationCoords[homeLocationCode] || [10.45, 51.16]; 
    const homeCoords = projection(homeLocation);

    // --- Color Scale (same as graph) ---
    const color = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(componentNames);

    // --- Filter and project node locations ---
    const locationNodes = nodes
      .map(node => {
        // --- FIX: Use the 'locations' map from props ---
        const locationCode = locations[node.providerId]; // Use providerId
        return {
          ...node,
          location: locationCode,
          coords: locationCode && locationCoords[locationCode] ? projection(locationCoords[locationCode]) : null,
          componentName: componentMap.get(node.id) || "Unknown"
        };
      })
      // --- FIX: Added check for valid coords ---
      .filter(node => 
        node.coords && 
        node.coords.length === 2 && 
        !isNaN(node.coords[0]) && 
        !isNaN(node.coords[1]) &&
        node.location !== homeLocationCode
      );

    // --- Draw Links (Arcs) (inside 'g') ---
    // --- FIX: Added check for valid homeCoords ---
    if(homeCoords && !isNaN(homeCoords[0])) {
      g.append("g")
        .attr("class", "map-links")
        .selectAll("path")
        .data(locationNodes)
        .join("path")
        .attr("class", "map-link")
        .attr("d", d => {
          const source = d.coords;
          const target = homeCoords;
          const dx = target[0] - source[0];
          const dy = target[1] - source[1];
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${source[0]},${source[1]}A${dr},${dr} 0 0,1 ${target[0]},${target[1]}`;
        });
    }

    // --- Draw Nodes (Suppliers) (inside 'g') ---
    const node = g.append("g")
      .attr("class", "map-nodes")
      .selectAll("g")
      .data(locationNodes)
      .join("g")
      .attr("transform", d => `translate(${d.coords[0]}, ${d.coords[1]})`);

    node.append("circle")
      .attr("r", 5)
      .attr("class", "map-node-circle")
      .style("fill", d => color(d.componentName)); // Color by component

    // --- Draw Home Node (inside 'g') ---
    // --- FIX: Added check for valid homeCoords ---
    if(homeCoords && !isNaN(homeCoords[0])) {
      g.append("g")
        .attr("class", "map-home-node")
        .attr("transform", `translate(${homeCoords[0]}, ${homeCoords[1]})`)
        .append("circle")
        .attr("r", 8)
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
              .html(`
                <strong>Main Product / Facility</strong><br>
                <strong>Location:</strong> ${homeLocationCode}
              `)
              .style("left", (event.pageX + 15) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", () => {
            tooltip.style("opacity", 0);
          });
    }

    // --- Tooltip for Map ---
    node.on("mouseover", (event, d) => {
        tooltip.style("opacity", 1)
          .html(`
            <strong>${d.name || "Unknown"}</strong><br>
            <strong>Component:</strong> ${d.componentName}<br>
            <strong>Location:</strong> ${d.location}<br>
            <strong>Climate Change:</strong> ${d.totalResult.toPrecision(3)} kgCO2e
          `)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    // --- Create Legend for Map ---
    legend.html(""); // Clear old legend
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
      {/* --- Legend and Tooltip are now static elements --- */}
      <div ref={legendRef} className="graph-legend"></div>
      <div ref={tooltipRef} className="graph-tooltip"></div> {/* Use static tooltip */}
    </div>
  );
};


// --- Main Page Component ---
const NetworkPage = () => {
  // --- State for User Profile ---
  const [userId] = useState(localStorage.getItem('userId') || '');
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  // --- State for Network Page ---
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [networkData, setNetworkData] = useState(null); // State for merged graph data
  const [loadingNetwork, setLoadingNetwork] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState('graph'); // 'graph' or 'map'

  // --- Fetch User Profile (for Sidebar) ---
  const fetchUserProfile = useCallback(async () => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/profile`);
      if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
      const profile = await res.json();
      setUserName(profile.fullName || 'User');
      setCompanyName(profile.companyName || 'Company');
      let initials = 'U';
      if (profile.fullName) {
        const nameParts = profile.fullName.split(' ');
        initials = (nameParts[0].charAt(0) + (nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : '')).toUpperCase();
      }
      setUserInitials(initials);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setUserName('User');
      setCompanyName('Company');
      setUserInitials('U');
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  // --- Fetch Product List (for Dropdown) ---
  const fetchProducts = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/inventory/user/${userId}`);
      if (!res.ok) throw new Error(`Server responded with status: ${res.status}`);
      const data = await res.json();
      setProducts(data);
      setError('');
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError('Could not load product list.');
      setProducts([]);
    }
  }, [userId]);

  // --- Fetch Network Graph Data (for all components) ---
  const fetchNetworkData = useCallback(async (productId) => {
    if (!productId) {
      setNetworkData(null);
      return;
    }
    setLoadingNetwork(true);
    setError('');

    try {
      // Call the correct endpoint
      const res = await fetch(`${API_BASE}/network/product-network?productId=${productId}`);
      
      const responseData = await res.json(); // { componentGraphs: [], locations: {} }

      if (!res.ok) {
        const errorMsg = responseData.message || `Failed to fetch network: ${res.statusText}`;
        throw new Error(errorMsg);
      }
      
      const { componentGraphs, locations } = responseData;
      
      // --- Merge graph data ---
      const nodes = new Map();
      const edges = new Set();
      const componentMap = new Map(); // Map(node.index -> componentName)
      const componentNames = new Set(); // <-- Store unique names for legend
      let rootNodeId = null;

      for (const item of componentGraphs) {
        const { componentName, graphData } = item;
        
        if (!graphData || !graphData.nodes || (graphData.error && graphData.error === "LCA_CALCULATION_FAILED")) {
          console.warn(`Skipping component ${componentName}: No valid graph data. Reason: ${graphData.message}`);
          continue;
        }

        componentNames.add(componentName); // <-- Add name to set

        if (rootNodeId === null) {
          rootNodeId = graphData.rootIndex;
        }

        for (const node of graphData.nodes) {
          const providerId = node.techFlow?.provider?.["@id"]; // <-- Get provider ID
          
          if (!nodes.has(node.index)) {
            // Unpack data from the openLCA structure
            nodes.set(node.index, { 
              id: node.index,
              providerId: providerId, // <-- Store provider ID
              name: node.techFlow?.provider?.name || "Unknown Process",
              flowName: node.techFlow?.flow?.name || "Unknown Flow",
              totalResult: node.totalResult,
              directResult: node.directResult,
              isRoot: node.index === graphData.rootIndex
            });
          }
          componentMap.set(node.index, componentName);
        }

        for (const edge of graphData.edges) {
          edges.add(JSON.stringify({
            source: edge.providerIndex,
            target: edge.nodeIndex,
            value: edge.result
          }));
        }
      }

      const finalNodes = Array.from(nodes.values());
      const finalEdges = Array.from(edges).map(e => JSON.parse(e));

      setNetworkData({ 
        nodes: finalNodes, 
        edges: finalEdges, 
        componentMap, 
        rootNodeId,
        componentNames: Array.from(componentNames),
        locations: locations // <-- Pass locations map
      });

    } catch (err) {
      console.error("Error fetching/merging network data:", err);
      setError(`Could not load network data: ${err.message}`);
      setNetworkData(null);
    } finally {
      setLoadingNetwork(false);
    }
  }, []);

  // --- Initial Data Load ---
  useEffect(() => {
    fetchUserProfile();
    fetchProducts();
  }, [fetchUserProfile, fetchProducts]);

  // --- Handle Product Selection ---
  const handleProductChange = (e) => {
    const newProductId = e.target.value;
    setSelectedProductId(newProductId);
    
    if (newProductId) {
      fetchNetworkData(newProductId); // Fetch data for the whole product
    } else {
      setNetworkData(null); // Clear data
    }
  };
  
  const isLoading = loadingProfile;

  return (
    <div className="dashboard-layout">
      {/* --- Sidebar (Unchanged) --- */}
      <div className="sidebar">
        <div className="sidebar-top">
          <div className="logo">
            <picture>
              <source srcSet="/src/assets/carbonx.png" media="(prefers-color-scheme: dark)" />
              <img src="/src/assets/carbonx.png" alt="Logo" width="30" />
            </picture>
          </div>
          <nav className="nav-menu">
            <NavLink to="/dashboard" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/inventory" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              <span>Inventory</span>
            </NavLink>
            <NavLink to="/analytics" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              <span>Analytics</span>
            </NavLink>
            <NavLink to="/network" className="nav-item active">
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
          <NavLink to="/settings" className="user-profile">
            <div className="user-avatar">{isLoading ? '...' : userInitials}</div>
            <div className="user-info">
              <div className="name">{isLoading ? 'Loading...' : userName}</div>
              <div className="company">{isLoading ? 'Loading...' : companyName}</div>
            </div>
          </NavLink>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Network</h1>
          <p>View your product supply chain here.</p>
        </header>

        {error && <div className="error-message" style={{color: 'red', marginBottom: '15px'}}>{error}</div>}

        {/* --- Product Selector --- */}
        <div className="product-selector-container">
          <label htmlFor="product-select">Select your product:</label>
          <select 
            id="product-select" 
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
        </div>
        
        {/* --- Component tabs are REMOVED --- */}

        {/* --- Network Card --- */}
        <div className="analytics-card">
          <div className="network-card-header">
            <h3>{currentView === 'graph' ? 'Network Graph' : 'Map View'}</h3>
            {/* --- View Toggle --- */}
            <div className="view-toggle">
              <button 
                className={`view-toggle-btn ${currentView === 'graph' ? 'active' : ''}`}
                onClick={() => setCurrentView('graph')}
              >
                Network Graph
              </button>
              <button 
                className={`view-toggle-btn ${currentView === 'map' ? 'active' : ''}`}
                onClick={() => setCurrentView('map')}
              >
                Map View
              </button>
            </div>
          </div>
          <div className="analytics-table-container">
            {loadingNetwork ? (
              <div className="loading-message">Loading data...</div>
            ) : networkData && networkData.nodes.length > 0 ? (
              <>
                {/* Use 'display: none' to keep D3 state when toggling */}
                <div style={{ display: currentView === 'graph' ? 'block' : 'none' }}>
                  <NetworkGraph data={networkData} />
                </div>
                <div style={{ display: currentView === 'map' ? 'block' : 'none' }}>
                  <MapView data={networkData} />
                </div>
              </>
            ) : (
              <div className="no-data-message">
                {selectedProductId ? "No network data for this product's components." : "Select a product to view its network."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkPage;

