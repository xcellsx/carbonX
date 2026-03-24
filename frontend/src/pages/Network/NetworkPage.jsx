import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as d3 from 'd3';
import Navbar from '../../components/Navbar/Navbar';
import { ChevronDown, Network } from 'lucide-react';
import InstructionalCarousel from '../../components/InstructionalCarousel/InstructionalCarousel';
import './NetworkPage.css';
import { API_BASE, productAPI, networkAPI, getLocalLcaMap } from '../../services/api';
import { useProSubscription } from '../../hooks/useProSubscription';
import { getScopeTotalsFromProduct as getScopeTotalsFromProductUtil, formatEmission as formatEmissionUtil } from '../../utils/emission';

// --- CARBON EMISSION SCOPES ---
const EMISSION_SCOPES = [
  { id: "all", name: "All scopes", unit: "kg CO2e", description: "View all emission scopes together" },
  { id: "scope1", name: "Scope 1", unit: "kg CO2e", description: "Direct emissions from owned or controlled sources" },
  { id: "scope2", name: "Scope 2", unit: "kg CO2e", description: "Indirect emissions from purchased energy" },
  { id: "scope3", name: "Scope 3", unit: "kg CO2e", description: "All other indirect emissions in the value chain" },
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

const NETWORK_CAROUSEL_SLIDES = [
  { title: 'Welcome to Network', description: 'Visualise your product supply chain and impact flows. Select a product and an impact category to see how processes and materials connect and contribute to that impact.', icon: <Network size={40} /> },
  { title: 'Product & impact category', description: 'Use the dropdowns to choose a product from your inventory and an impact category (e.g. Climate Change, Land Use). The graph updates to show the network for that combination.', icon: <Network size={40} /> },
  { title: 'Consolidated vs component view', description: 'Toggle between Consolidated View (single graph) and Component View (per-component breakdown) to explore the supply chain at different levels of detail.', icon: <Network size={40} /> },
];

// --- Same template helpers as Analytics/Inventory ---
const STORAGE_KEY_TEMPLATES = 'carbonx-custom-templates';
function getStoredTemplates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}
const WEIGHT_TO_KG = { kg: 1, g: 0.001, mg: 1e-6, µg: 1e-9, t: 1000 };
const TIME_TO_S = { s: 1, min: 60, h: 3600, d: 86400 };
function toCanonicalWeight(n, unit) { const v = Number(n); return Number.isNaN(v) ? 0 : v * (WEIGHT_TO_KG[unit] ?? 1); }
function toCanonicalTime(n, unit)   { const v = Number(n); return Number.isNaN(v) ? 0 : v * (TIME_TO_S[unit]   ?? 1); }
function templateToDppData(template) {
  const dpp = [];
  (Array.isArray(template.ingredients) ? template.ingredients : []).forEach((item) => {
    const name = typeof item === 'object' && item && 'ingredient' in item ? (item.ingredient || '').trim() : String(item || '');
    const weightStr = typeof item === 'object' && item && 'weight' in item ? String(item.weight || '') : '';
    const weightUnit = (typeof item === 'object' && item && 'weightUnit' in item) ? (item.weightUnit || 'kg') : 'kg';
    dpp.push({ ingredient: name || 'Ingredient', weightKg: toCanonicalWeight(weightStr, weightUnit), unit: weightUnit, lcaValue: null, materialId: null, emissionFactor: null, isPackaging: false, isTransport: false });
  });
  (Array.isArray(template.processes) ? template.processes : []).forEach((item) => {
    const processName = typeof item === 'object' && item && 'process' in item ? String(item.process || '').trim() : String(item || '');
    const desc = typeof item === 'object' && item && 'description' in item ? String(item.description || '').trim() : '';
    const timeUnit = (typeof item === 'object' && item && 'timeUnit' in item) ? (item.timeUnit || 's') : 's';
    dpp.push({ ingredient: processName ? `Process: ${processName}` : 'Process', weightKg: toCanonicalTime(desc, timeUnit), unit: timeUnit, lcaValue: null, materialId: null, emissionFactor: null, isPackaging: false, isTransport: false });
  });
  return dpp;
}
function templateToProduct(template, localLcaMap = {}) {
  const templateProductId = `template-${template.id}`;
  const rawLca = localLcaMap[templateProductId];
  // Also check by-name cache for scope breakdown
  const nameKey = (template.name || '').toLowerCase().trim();
  const localLcaByName = (() => { try { return JSON.parse(localStorage.getItem('carbonx_lca_cache_by_name_v1') || '{}'); } catch { return {}; } })();
  const cachedByName = nameKey ? localLcaByName[nameKey] : null;
  const lcaResult = cachedByName?.total ?? ((rawLca != null && !Number.isNaN(Number(rawLca))) ? Number(rawLca) : 0);
  return {
    productId: templateProductId,
    productName: template.name || 'Unnamed template',
    dppData: JSON.stringify(templateToDppData(template)),
    lcaResult,
    scope1: cachedByName?.scope1 ?? 0,
    scope2: cachedByName?.scope2 ?? 0,
    scope3: cachedByName?.scope3 ?? lcaResult,
    DPP: null,
    emissionInformation: null,
  };
}

// --- Vessel route demo for Transportation industry (no backend data required) ---
const VESSEL_DEMO_PRODUCT_ID = 'vessel-route-demo';
const VESSEL_DEMO_GRAPH = {
  nodes: [
    { id: 'vessel-demo-port-a', name: 'Port A (Origin)', type: 'location', isMainProduct: false, isRoot: false },
    { id: 'vessel-demo-vessel', name: 'Vessel / Voyage', type: 'vessel', isMainProduct: true, isRoot: true },
    { id: 'vessel-demo-port-b', name: 'Port B (Destination)', type: 'location', isMainProduct: false, isRoot: false },
  ],
  edges: [
    { source: 'vessel-demo-port-a', target: 'vessel-demo-vessel' },
    { source: 'vessel-demo-vessel', target: 'vessel-demo-port-b' },
  ],
  componentMap: new Map([
    ['vessel-demo-port-a', 'location'],
    ['vessel-demo-vessel', 'vessel'],
    ['vessel-demo-port-b', 'location'],
  ]),
  componentNames: ['location', 'vessel'],
  rootNodeId: VESSEL_DEMO_PRODUCT_ID,
  productName: 'Vessel route: Port A → Port B',
};

const getScopeTotalsFromProduct = getScopeTotalsFromProductUtil;
const formatEmission = formatEmissionUtil;

// --- D3 Network Graph Component ---
const MINIMAP = { w: 220, h: 158, pad: 8 };

const NetworkGraph = ({ data, viewMode, productName, selectedScope, selectedProduct, products, allBackendProducts = [] }) => {
  const svgRef = useRef(null);
  const minimapSvgRef = useRef(null);
  const legendRef = useRef(null);
  const fitAppliedRef = useRef(false);
  const layoutBoundsRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 820 });
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return undefined;
    const updateSize = () => {
      setContainerSize({
        width: el.offsetWidth,
        height: Math.max(640, el.offsetHeight)
      });
    };
    updateSize();
    const ro = new ResizeObserver(() => updateSize());
    ro.observe(el);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    fitAppliedRef.current = false;
    layoutBoundsRef.current = null;

    if (!data || !data.nodes || data.nodes.length === 0 || !svgRef.current) {
      d3.select(svgRef.current).selectAll("*").remove();
      if (minimapSvgRef.current) d3.select(minimapSvgRef.current).selectAll("*").remove();
      return undefined;
    }

    const { nodes, edges, componentMap, componentNames } = data;
    const { width, height } = containerSize;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const minimapSvg = d3.select(minimapSvgRef.current);
    minimapSvg.selectAll("*").remove();
    const legend = d3.select(legendRef.current);

    const g = svg.append('g').attr('class', 'network-graph-root');

    const updateMinimapViewport = (transform) => {
      const bounds = layoutBoundsRef.current;
      const vp = minimapSvg.select('.minimap-viewport');
      if (!bounds || vp.empty() || !width || !height) return;
      const innerW = MINIMAP.w - 2 * MINIMAP.pad;
      const innerH = MINIMAP.h - 2 * MINIMAP.pad;
      const s = Math.min(innerW / bounds.width, innerH / bounds.height);
      const ox = MINIMAP.pad + (innerW - s * bounds.width) / 2;
      const oy = MINIMAP.pad + (innerH - s * bounds.height) / 2;
      const mapPoint = (gx, gy) => [ox + (gx - bounds.x) * s, oy + (gy - bounds.y) * s];
      const pts = [[0, 0], [width, 0], [width, height], [0, height]]
        .map(([sx, sy]) => {
          const [gx, gy] = transform.invert([sx, sy]);
          return mapPoint(gx, gy).join(',');
        })
        .join(' ');
      vp.attr('points', pts);
    };

    const zoom = d3.zoom()
      .scaleExtent([0.06, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        updateMinimapViewport(event.transform);
      });
    svg.call(zoom);

    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(componentNames);

    // --- FORCE SIMULATION (main product not pinned to center) ---
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id).distance(d => d.target.isRoot ? 80 : 120))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(45));

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

    const getNodeColor = (d) => {
      if (d.isMainProduct) return "#334761"; // Dark blue for final product
      const type = componentMap.get(d.id);
      if (type === 'product') return "#59a5b2";
      if (type === 'process') return "#000000"; // Black for process nodes
      return color(type);
    };

    // Node Circle (final product a bit smaller, not 18)
    node.append("circle")
      .attr("r", d => (d.isMainProduct ? 14 : (d.isRoot ? 12 : 8)))
      .attr("fill", d => getNodeColor(d))
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

    simulation.on("end", () => {
      if (fitAppliedRef.current) return;
      fitAppliedRef.current = true;
      requestAnimationFrame(() => {
        const root = g.node();
        if (!root) return;
        let bbox;
        try {
          bbox = root.getBBox();
        } catch {
          return;
        }
        if (!bbox.width || !bbox.height) return;

        const pad = 56;
        const k = Math.min(
          (width - 2 * pad) / bbox.width,
          (height - 2 * pad) / bbox.height
        );
        const tx = width / 2 - k * (bbox.x + bbox.width / 2);
        const ty = height / 2 - k * (bbox.y + bbox.height / 2);
        const t = d3.zoomIdentity.translate(tx, ty).scale(k);
        svg.call(zoom.transform, t);

        layoutBoundsRef.current = {
          x: bbox.x,
          y: bbox.y,
          width: bbox.width,
          height: bbox.height,
        };

        const innerW = MINIMAP.w - 2 * MINIMAP.pad;
        const innerH = MINIMAP.h - 2 * MINIMAP.pad;
        const b = layoutBoundsRef.current;
        const ms = Math.min(innerW / b.width, innerH / b.height);
        const ox = MINIMAP.pad + (innerW - ms * b.width) / 2;
        const oy = MINIMAP.pad + (innerH - ms * b.height) / 2;
        const mapX = (gx) => ox + (gx - b.x) * ms;
        const mapY = (gy) => oy + (gy - b.y) * ms;

        minimapSvg
          .append("rect")
          .attr("class", "minimap-frame")
          .attr("x", MINIMAP.pad)
          .attr("y", MINIMAP.pad)
          .attr("width", innerW)
          .attr("height", innerH)
          .attr("rx", 6)
          .attr("fill", "rgba(253,253,253,0.94)")
          .attr("stroke", "rgba(0,0,0,0.1)");

        minimapSvg
          .append("g")
          .attr("class", "minimap-edges")
          .selectAll("line")
          .data(edges)
          .join("line")
          .attr("stroke", "rgba(150,150,150,0.55)")
          .attr("stroke-width", 0.9)
          .attr("x1", (d) => mapX(d.source.x))
          .attr("y1", (d) => mapY(d.source.y))
          .attr("x2", (d) => mapX(d.target.x))
          .attr("y2", (d) => mapY(d.target.y));

        minimapSvg
          .append("g")
          .attr("class", "minimap-nodes")
          .selectAll("circle")
          .data(nodes)
          .join("circle")
          .attr("cx", (d) => mapX(d.x))
          .attr("cy", (d) => mapY(d.y))
          .attr("r", (d) => (d.isMainProduct ? 3.2 : d.isRoot ? 2.6 : 1.8))
          .attr("fill", (d) => {
            if (d.isMainProduct) return "#334761";
            const type = componentMap.get(d.id);
            if (type === "product") return "#59a5b2";
            if (type === "process") return "#222";
            return "#888";
          });

        minimapSvg
          .append("polygon")
          .attr("class", "minimap-viewport")
          .attr("fill", "rgba(51, 71, 97, 0.14)")
          .attr("stroke", "rgba(51, 71, 97, 0.55)")
          .attr("stroke-width", 1)
          .attr("pointer-events", "none");

        updateMinimapViewport(t);
      });
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
      const lower = String(name || '').toLowerCase();
      const swatchColor =
        lower === 'product' ? "#59a5b2" :
        lower === 'process' ? "#000000" :
        color(name);
      const label =
        lower === 'product' ? 'Product' :
        lower === 'process' ? 'Process' :
        (String(name || '').charAt(0).toUpperCase() + String(name || '').slice(1));
      item.append("span")
        .attr("class", "legend-color-swatch")
        .style("background-color", swatchColor);
      item.append("span").text(label);
    });
    const finalItem = legendList.append("li").attr("class", "legend-item");
    finalItem.append("span")
      .attr("class", "legend-color-swatch")
      .style("background-color", "#334761");
    finalItem.append("span").text("Final product");

    return () => {
      simulation.stop();
    };
  }, [data, containerSize]);

  const nameNorm = (s) => String(s ?? '').toLowerCase().trim();
  const productList = products || [];

  // Helper: find a product by name — checks user products first, then all backend raw products
  const findByName = (nodeName) => {
    const n = nameNorm(nodeName);
    // Check user products list (has pre-computed scope1/2/3)
    const fromUserList = productList.find((p) => nameNorm(p.productName) === n);
    if (fromUserList) return { product: fromUserList, fromBackend: false };
    // Fall back to all raw backend products (have DPP / emissionInformation)
    const fromBackend = allBackendProducts.find((p) => nameNorm(p.name ?? '') === n);
    if (fromBackend) return { product: fromBackend, fromBackend: true };
    return null;
  };

  const hasEmission = (p) => p?.DPP?.carbonFootprint || p?.emissionInformation;

  let emissionProduct = null;
  let emissionFromBackend = false;
  if (hoveredNode) {
    if (hoveredNode.isMainProduct) {
      if (hasEmission(selectedProduct) || selectedProduct?.lcaResult > 0) {
        emissionProduct = selectedProduct;
      } else {
        const found = findByName(productName);
        emissionProduct = found?.product ?? null;
        emissionFromBackend = found?.fromBackend ?? false;
      }
    } else {
      const found = findByName(hoveredNode.name);
      emissionProduct = found?.product ?? null;
      emissionFromBackend = found?.fromBackend ?? false;
    }
  }

  // Prefer pre-computed scope fields; for raw backend products use getScopeTotalsFromProduct
  const hasCachedScopes = (p) => p && (p.scope1 > 0 || p.scope2 > 0 || p.scope3 > 0 || p.lcaResult > 0);
  const scopeTotals = emissionProduct
    ? ((!emissionFromBackend && hasCachedScopes(emissionProduct))
        ? { scope1: emissionProduct.scope1 ?? 0, scope2: emissionProduct.scope2 ?? 0, scope3: emissionProduct.scope3 ?? 0, total: emissionProduct.lcaResult ?? 0 }
        : getScopeTotalsFromProduct(emissionProduct))
    : null;

  // Tooltip formatting: round to 3 decimal places for display without affecting underlying values.
  const formatTooltipEmission = (value) =>
    value == null || Number.isNaN(value) ? '—' : Number(value).toFixed(3);

  return (
    <div className="network-graph-container">
      <svg ref={svgRef} width={containerSize.width} height={containerSize.height} />
      <div className="network-graph-minimap" aria-hidden="true">
        <span className="network-graph-minimap-label">Overview</span>
        <svg ref={minimapSvgRef} width={MINIMAP.w} height={MINIMAP.h} className="network-graph-minimap-svg" />
      </div>
      <p className="network-graph-interaction-hint">
        Scroll or pinch to zoom · drag the background to pan
      </p>
      <div className="graph-tooltip">
        <div ref={legendRef} className="graph-tooltip-legend"></div>
        <div className="graph-tooltip-info">
          <strong>Node information</strong>
          {hoveredNode ? (
            <div style={{ marginTop: '0.5rem' }}>
              {viewMode === 'component' ? (
                <p><strong>Product:</strong> {productName}</p>
              ) : (
                <p><strong>{hoveredNode.isMainProduct ? 'Final product' : 'Process'}:</strong> {hoveredNode.name || 'Unknown'}</p>
              )}
              {!hoveredNode.isMainProduct && (
                <p><strong>Component:</strong> {data?.componentMap?.get(hoveredNode.id) || 'product'}</p>
              )}
              <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #eee' }} />
              {selectedScope.id === 'all' && scopeTotals ? (
                <>
                  <p><strong>Scope 1:</strong> {formatTooltipEmission(scopeTotals.scope1)} kg CO2e</p>
                  <p><strong>Scope 2:</strong> {formatTooltipEmission(scopeTotals.scope2)} kg CO2e</p>
                  <p><strong>Scope 3:</strong> {formatTooltipEmission(scopeTotals.scope3)} kg CO2e</p>
                  <p><strong>Total CO2e:</strong> {formatTooltipEmission(scopeTotals.total)} kg CO2e</p>
                </>
              ) : scopeTotals ? (
                <p><strong>{selectedScope.name}:</strong> {formatTooltipEmission(selectedScope.id === 'scope1' ? scopeTotals.scope1 : selectedScope.id === 'scope2' ? scopeTotals.scope2 : scopeTotals.scope3)} {selectedScope.unit}</p>
              ) : (
                <p><strong>{selectedScope.name}:</strong> {formatTooltipEmission(hoveredNode.totalResult)} {selectedScope.unit}</p>
              )}
            </div>
          ) : (
            <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#666' }}>Hover over a node for details.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
const NetworkPage = () => {
  const [userId] = useState(localStorage.getItem('userId') || '');
  const { isProUser } = useProSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  /** User-owned + template products only — drives the dropdown. */
  const [userProducts, setUserProducts] = useState([]);
  /** All raw backend products (unfiltered) — used for component name → emissionInformation lookups. */
  const [rawProductsData, setRawProductsData] = useState([]);
  /** Backend product name (lowercase) → document key. Used for graph API so we never send template id. */
  const [backendNameToKey, setBackendNameToKey] = useState(() => new Map());

  // --- Transportation industry: show vessel route demo (Port A → Vessel → Port B) when no templates/data ---
  const companyData = (() => {
    try {
      const raw = localStorage.getItem('companyData') || '{}';
      const data = JSON.parse(raw);
      const uid = localStorage.getItem('userId') || '';
      const key = uid.includes('/') ? uid.split('/').pop() : uid;
      return data[uid] ?? data[key] ?? null;
    } catch {
      return null;
    }
  })();
  const sector = (companyData?.sector || '').trim();
  const industry = (companyData?.industry || '').trim();
  const isTransportationIndustry = sector === 'Transportation';
  const vesselDemoProduct = {
    productId: VESSEL_DEMO_PRODUCT_ID,
    productName: 'Vessel route: Port A → Port B (demo)',
    _isVesselDemo: true,
  };
  const displayProducts = isTransportationIndustry ? [vesselDemoProduct, ...userProducts] : userProducts;
  
  // --- PERSISTENCE ---
  const [selectedProductId, setSelectedProductId] = useState(
    sessionStorage.getItem('network_selectedProductId') || ''
  );
  const [currentView, setCurrentView] = useState('consolidated');
  const [components, setComponents] = useState([]);
  const [selectedComponentIndex, setSelectedComponentIndex] = useState(0);
  
  // --- Scope Selection State ---
  const [selectedScope, setSelectedScope] = useState(() => {
    const savedId = sessionStorage.getItem('network_selectedScope');
    return EMISSION_SCOPES.find(s => s.id === savedId) || EMISSION_SCOPES[0];
  });

  const [consolidatedData, setConsolidatedData] = useState(null);
  const [componentGraphData, setComponentGraphData] = useState([]);
  const [componentMeta, setComponentMeta] = useState([]);
  
  const [loadingNetwork, setLoadingNetwork] = useState(false);
  const [error, setError] = useState('');

  // Helper function to filter graph for a specific component
  // Returns a subgraph showing only nodes/edges that feed into the component
  const filterGraphForComponent = (fullGraph, componentName) => {
    if (!fullGraph || !componentName) return null;
    
    const normalizeName = (name) => String(name || '').toLowerCase().trim();
    const normalizedComponentName = normalizeName(componentName);
    
    // Find the component node in the graph (match by name)
    const componentNode = fullGraph.nodes.find((node) => {
      const nodeName = normalizeName(node.name);
      return nodeName === normalizedComponentName || 
             nodeName.includes(normalizedComponentName) || 
             normalizedComponentName.includes(nodeName);
    });
    
    if (!componentNode) {
      console.log('[Network] Component not found in graph:', componentName);
      return null;
    }
    
    // Build a set of node IDs that feed into this component (backward traversal)
    const includedNodeIds = new Set([componentNode.id]);
    const edgesToInclude = new Set();
    let changed = true;
    
    // Traverse backwards: find all nodes that have edges pointing to included nodes
    while (changed) {
      changed = false;
      fullGraph.edges.forEach((edge) => {
        // If target is in included set, add source and this edge
        if (includedNodeIds.has(edge.target)) {
          if (!includedNodeIds.has(edge.source)) {
            includedNodeIds.add(edge.source);
            changed = true;
          }
          edgesToInclude.add(JSON.stringify(edge));
        }
      });
    }
    
    // Filter nodes and edges
    const filteredNodes = fullGraph.nodes.filter((node) => includedNodeIds.has(node.id));
    const filteredEdges = fullGraph.edges.filter((edge) => 
      includedNodeIds.has(edge.source) && includedNodeIds.has(edge.target)
    );
    
    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      componentMap: fullGraph.componentMap,
      rootNodeId: componentNode.id,
      componentNames: fullGraph.componentNames,
    };
  };

  // --- Fetch Product List (exact same logic as Analytics/Inventory) ---
  const fetchProducts = useCallback(async () => {
    try {
      let mapped = [];
      const backendNames = new Set();
      const nameToKey = new Map();
      try {
        const res = await productAPI.getAllProducts();
        const raw = Array.isArray(res?.data) ? res.data : [];
        const normalized = raw.map((p) => {
          const fromDpp = p.dpp;
          const name = p.name ?? fromDpp?.name ?? '';
          const key = p.key ?? fromDpp?.key ?? (p.id && String(p.id).includes('/') ? String(p.id).split('/').pop() : p.id);
          const emission = p.emissionInformation ?? fromDpp?.emissionInformation;
          return { ...p, name: name || p.name, key: key || p.key, emissionInformation: emission ?? p.emissionInformation };
        });
        // Store ALL products for component emissionInformation lookups and graph API key resolution
        setRawProductsData(normalized);
        normalized.forEach((p) => {
          const n = (p.name ?? '').toString().trim();
          const k = (p.key && String(p.key).trim()) || (p._key && String(p._key).trim()) || (p.id && String(p.id).includes('/') ? String(p.id).split('/').pop() : String(p.id ?? ''));
          if (n && k) nameToKey.set(n.toLowerCase(), k);
        });
        // Filter to current user's products only (same as Analytics)
        const filtered = userId ? normalized.filter((p) => p.userId === userId) : normalized;
        const localLcaMap = getLocalLcaMap(userId);
        mapped = filtered.map((p) => {
          const productId = p.key ?? p._key ?? (p.id && String(p.id).includes('/') ? String(p.id).split('/').pop() : p.id) ?? p._id ?? p.id;
          backendNames.add(p.name || '');
          const localLca = productId != null ? localLcaMap[String(productId)] : null;
          // Compute scope totals from DPP for tooltip
          const rawTotals = getScopeTotalsFromProductUtil({ DPP: p.DPP ?? p.dpp, emissionInformation: p.emissionInformation });
          let lcaResult = (localLca != null && !Number.isNaN(Number(localLca))) ? Number(localLca) : (rawTotals.total || p.lcaResult || 0);
          // Check localStorage by-name cache for persisted scope breakdown
          const nameKey = (p.name ?? '').toLowerCase().trim();
          const localLcaByName = (() => { try { return JSON.parse(localStorage.getItem('carbonx_lca_cache_by_name_v1') || '{}'); } catch { return {}; } })();
          const cachedByName = nameKey ? localLcaByName[nameKey] : null;
          const scope1 = cachedByName?.scope1 ?? rawTotals.scope1 ?? 0;
          const scope2 = cachedByName?.scope2 ?? rawTotals.scope2 ?? 0;
          const scope3 = cachedByName?.scope3 ?? rawTotals.scope3 ?? 0;
          if (cachedByName?.total) lcaResult = cachedByName.total;
          return {
            productId,
            productName: p.name ?? '',
            dppData: (p.functionalProperties && p.functionalProperties.dppData) || (typeof p.dppData === 'string' ? p.dppData : '[]'),
            lcaResult,
            scope1,
            scope2,
            scope3,
            DPP: p.DPP ?? p.dpp ?? null,
            emissionInformation: p.emissionInformation ?? null,
            backendProductId: p.id && String(p.id).includes('/') ? p.id : (productId ? `products/${productId}` : null),
          };
        });
      } catch (err) {
        console.warn('[Network] could not fetch API products', err);
        setRawProductsData([]);
      }
      setBackendNameToKey(nameToKey);
      const localLcaMap = getLocalLcaMap(userId);
      const customTemplates = getStoredTemplates();
      const templateProducts = customTemplates
        .filter((t) => !backendNames.has(t.name || ''))
        .map((t) => templateToProduct(t, localLcaMap));
      const merged = [...mapped, ...templateProducts].sort((a, b) =>
        (a.productName || '').localeCompare(b.productName || '', undefined, { sensitivity: 'base' })
      );
      setProducts(merged);
      setUserProducts(merged);
      setError('');
    } catch (err) {
      console.error('[Network] Failed to load product list:', err);
      setError('Could not load product list.');
      const localLcaMap = getLocalLcaMap(userId);
      const templateProducts = getStoredTemplates().map((t) => templateToProduct(t, localLcaMap));
      setProducts(templateProducts);
      setUserProducts(templateProducts);
    }
  }, [userId]);

  // --- Fetch Network Graph Data from backend product-graph API ---
  const fetchNetworkData = useCallback(async (productId, currentProducts = []) => {
    if (!productId) {
      setConsolidatedData(null);
      setComponentGraphData([]);
      setComponentMeta([]);
      return;
    }
    setLoadingNetwork(true);
    setError('');

    // Vessel route demo for Transportation industry (no API call)
    if (productId === VESSEL_DEMO_PRODUCT_ID) {
      setConsolidatedData(VESSEL_DEMO_GRAPH);
      setComponentGraphData([VESSEL_DEMO_GRAPH]);
      setComponentMeta([{ name: 'Vessel / Voyage', hasInputs: true }]);
      setLoadingNetwork(false);
      return;
    }

    const productsList = currentProducts.length > 0 ? currentProducts : products;
    const selectedProduct = productsList.find(p => p.productId == productId);
    const productName = selectedProduct?.productName || '';
    // Backend expects productid = document key (e.g. "1") or product name (e.g. "spaghetti")
    const productKey = typeof productId === 'string' && productId.startsWith('products/')
      ? productId.split('/').pop()
      : productId;
    const graphProductId = selectedProduct?.backendProductId ?? productId;
    const graphProductKey = typeof graphProductId === 'string' && graphProductId.includes('/')
      ? graphProductId.split('/').pop()
      : graphProductId;
    // Never use template id for the graph API. Resolve by product name → backend document key.
    const isTemplateProduct = typeof productKey === 'string' && productKey.startsWith('template-');
    const nameNorm = (s) => String(s ?? '').trim().toLowerCase();
    // Prefer: 1) key from full backend list (backendNameToKey), 2) key from dropdown list, 3) never template id
    const backendKeyFromNameMap = productName?.trim() ? (backendNameToKey.get(nameNorm(productName)) ?? null) : null;
    const backendProductWithSameName = productName?.trim()
      ? productsList.find((p) => !String(p.productId ?? '').startsWith('template-') && nameNorm(p.productName) === nameNorm(productName))
      : null;
    const backendKeyFromList = backendProductWithSameName
      ? (typeof backendProductWithSameName.backendProductId === 'string' && backendProductWithSameName.backendProductId.includes('/')
          ? backendProductWithSameName.backendProductId.split('/').pop()
          : backendProductWithSameName.productId)
      : null;
    const resolvedBackendKey = backendKeyFromNameMap ?? backendKeyFromList;

    const parseGraphResponse = (res) => {
      const raw = res?.data;
      if (raw == null) return { nodes: [], links: [] };
      // Backend may return array [ { nodes, links } ] or Arango-style { result: [ { nodes, links } ] }
      let obj = null;
      if (Array.isArray(raw) && raw.length > 0) {
        obj = raw[0];
      } else if (raw && typeof raw === 'object' && Array.isArray(raw.result) && raw.result.length > 0) {
        obj = raw.result[0];
      } else {
        obj = raw;
      }
      return {
        nodes: Array.isArray(obj?.nodes) ? obj.nodes : [],
        links: Array.isArray(obj?.links) ? obj.links : (Array.isArray(obj?.edges) ? obj.edges : []),
      };
    };

    try {
      // Never send template id. Use backend document key (from name map or selected product), or product name as last resort.
      const apiKey = isTemplateProduct
        ? (resolvedBackendKey || (productName?.trim() || null))
        : (graphProductKey || productKey);
      if (!apiKey) {
        setConsolidatedData(null);
        setComponentGraphData([]);
        setComponentMeta([]);
        setLoadingNetwork(false);
        return;
      }
      let res = await networkAPI.getProductGraphArango(apiKey);
      let { nodes: backendNodes, links: backendLinks } = parseGraphResponse(res);
      console.log('[Network] getProductGraph(apiKey="' + apiKey + '") →', backendNodes.length, 'nodes,', backendLinks.length, 'links');

      // If we got no edges, try by product name (backend might resolve name to key)
      if (backendLinks.length === 0 && productName?.trim() && apiKey !== productName.trim()) {
        res = await networkAPI.getProductGraphArango(productName.trim());
        const fallback = parseGraphResponse(res);
        if (fallback.nodes.length > 0 || fallback.links.length > 0) {
          backendNodes = fallback.nodes;
          backendLinks = fallback.links;
        }
      }

      if (backendNodes.length === 0 && backendLinks.length === 0) {
        setConsolidatedData(null);
        setComponentGraphData([]);
        setComponentMeta([]);
        setLoadingNetwork(false);
        return;
      }

      const label = (n) => n.label ?? n.name ?? n.id;
      const nodeType = (n) => (n.type === 'products' || n.type === 'product') ? 'product' : 'process';
      const isMainProductNode = (n) => {
        if (n.type !== 'products' && n.type !== 'product') return false;
        if (n.id === graphProductId || n.id === productId) return true;
        if (productId && (n.id === `products/${productId}` || n.id.endsWith(`/${productId}`))) return true;
        if (productName && (label(n) === productName || (n.label || n.name || '') === productName)) return true;
        return false;
      };
      // Final product node shows product name (e.g. "spaghetti"), not template/id
      const nodeList = backendNodes.map((n) => ({
        id: n.id,
        name: isMainProductNode(n) ? (productName || label(n)) : label(n),
        type: nodeType(n),
        isMainProduct: isMainProductNode(n),
        isRoot: isMainProductNode(n),
        totalResult: 0,
      }));

      const edgeList = backendLinks.map((e) => ({
        source: e.source,
        target: e.target,
      }));

      const componentMap = new Map();
      nodeList.forEach((n) => componentMap.set(n.id, n.type || 'product'));
      const componentNames = [...new Set(nodeList.map((n) => n.type || 'product'))];

      // Consolidated view = full supply chain from product graph API (nodes + links)
      const consolidated = {
        nodes: nodeList,
        edges: edgeList,
        componentMap,
        rootNodeId: productId,
        productName,
        componentNames,
      };

      // Console log graph data for debugging (same shape as passed to D3)
      const displayName = selectedProduct?.productName || 'Unknown';
      console.log('[Network] ========== GRAPH DATA FOR', displayName.toUpperCase(), '==========');
      console.log('[Network] Product ID:', productId);
      console.log('[Network] Product Name:', displayName);
      console.log('[Network] Total Nodes:', nodeList.length, '| Total Edges:', edgeList.length);
      console.log('[Network] Nodes (for D3):', nodeList.map(n => ({ id: n.id, name: n.name, type: n.type })));
      console.log('[Network] Edges (for D3):', edgeList.map(e => ({ source: e.source, target: e.target })));
      console.log('[Network] Component Map:', Object.fromEntries(componentMap));
      console.log('[Network] Root Node ID:', productId);
      console.log('[Network] ============================================');

      setConsolidatedData(consolidated);
      
      // Build component-specific graphs and meta (hasInputs per component for greyed tabs)
      let componentGraphs = [];
      let meta = [];
      
      if (selectedProduct && selectedProduct.dppData) {
        try {
          const dppComponents = JSON.parse(selectedProduct.dppData);
          const normalizeName = (s) => String(s || '').toLowerCase().trim();
          
          componentGraphs = dppComponents.map((comp) => {
            const componentName = (comp.ingredient || comp.component || '').toString().trim().replace(/^Process:\s*/, '');
            if (!componentName) return null;
            return filterGraphForComponent(consolidated, componentName) || consolidated;
          }).filter(Boolean);
          
          // Which components have at least one input edge in the full graph?
          meta = dppComponents.map((comp) => {
            const componentName = (comp.ingredient || comp.component || '').toString().trim().replace(/^Process:\s*/, '');
            const normalizedName = normalizeName(componentName);
            const node = consolidated.nodes.find((n) => {
              const nName = normalizeName(n.name);
              return nName === normalizedName || nName.includes(normalizedName) || normalizedName.includes(nName);
            });
            const targetId = node?.id;
            const hasInputs = !!targetId && consolidated.edges.some((e) => e.target === targetId || e.target?.id === targetId);
            return { name: componentName || 'Component', hasInputs };
          });
        } catch (e) {
          console.error('[Network] Error parsing dppData for component graphs:', e);
          componentGraphs = [consolidated];
        }
      } else {
        componentGraphs = [consolidated];
      }
      
      setComponentMeta(meta);
      setComponentGraphData(componentGraphs.length > 0 ? componentGraphs : [consolidated]);
    } catch (err) {
      console.error("Error fetching network data:", err);
      setError(`Could not load network data: ${err.message}`);
      setConsolidatedData(null);
      setComponentGraphData([]);
      setComponentMeta([]);
    } finally {
      setLoadingNetwork(false);
    }
  }, [backendNameToKey]);

  // --- Fetch component product data for Elements/Processes breakdown (mirrors Analytics) ---
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Refetch products when user returns to this tab so network tooltip shows latest LCA (saved by backend after LCA on Inventory)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && location.pathname === '/network') fetchProducts();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [fetchProducts, location.pathname]);

  // Restore selection from storage, or default to first available product (or vessel demo for Transportation)
  useEffect(() => {
    if (displayProducts.length === 0) return;
    const productExists = displayProducts.find(p => p.productId == selectedProductId);
    if (productExists) {
      if (productExists._isVesselDemo) {
        fetchNetworkData(VESSEL_DEMO_PRODUCT_ID, products);
      } else {
        if (productExists.dppData) {
          try { setComponents(JSON.parse(productExists.dppData)); } catch(e) {}
        }
        fetchNetworkData(selectedProductId, products);
      }
    } else {
      if (selectedProductId) {
        setSelectedProductId('');
        sessionStorage.removeItem('network_selectedProductId');
      }
      const defaultProduct = displayProducts.find(p => (p.productName || '').toLowerCase().trim() === 'spaghetti') || displayProducts[0];
      setSelectedProductId(defaultProduct.productId);
      sessionStorage.setItem('network_selectedProductId', defaultProduct.productId);
      if (defaultProduct._isVesselDemo) {
        fetchNetworkData(VESSEL_DEMO_PRODUCT_ID, products);
      } else {
        if (defaultProduct.dppData) {
          try { setComponents(JSON.parse(defaultProduct.dppData)); } catch(e) {}
        }
        fetchNetworkData(defaultProduct.productId, products);
      }
    }
  }, [products, displayProducts, fetchNetworkData]);

  const handleProductChange = (e) => {
    const newProductId = e.target.value;
    setSelectedProductId(newProductId);
    sessionStorage.setItem('network_selectedProductId', newProductId); 
    
    setCurrentView('consolidated');
    setSelectedComponentIndex(0);

    if (newProductId) {
      if (newProductId === VESSEL_DEMO_PRODUCT_ID) {
        setComponents([{ ingredient: 'Vessel / Voyage' }]);
        fetchNetworkData(VESSEL_DEMO_PRODUCT_ID, products);
      } else {
        const product = products.find(p => p.productId == newProductId);
        if (product && product.dppData) {
          try {
            setComponents(JSON.parse(product.dppData));
          } catch(e) { setComponents([]); }
        }
        fetchNetworkData(newProductId, products);
      }
    } else {
      setConsolidatedData(null);
      setComponentGraphData([]);
      setComponentMeta([]);
      setComponents([]);
    }
  };

  const handleScopeChange = (e) => {
    const newScopeId = e.target.value;
    const scopeObj = EMISSION_SCOPES.find(s => s.id === newScopeId) || EMISSION_SCOPES[0];
    setSelectedScope(scopeObj);
    sessionStorage.setItem('network_selectedScope', newScopeId);
  };

  const handleViewToggle = () => {
    setCurrentView(prev => (prev === 'consolidated' ? 'component' : 'consolidated'));
  };

  const selectedProduct = displayProducts.find(p => p.productId == selectedProductId);
  const productName = selectedProduct ? selectedProduct.productName : "Unknown Product";

  return (
    <div className="container">
      <InstructionalCarousel pageId="network" slides={NETWORK_CAROUSEL_SLIDES} newUserOnly />
      <Navbar />
      <div className="content-section-main">
        <div className="content-container-main">
          <div className="header-group">
            <h1>Network</h1>
            <p className = "medium-regular">View your product supply chain network here.</p>
          </div>
          
          <div className="network-toolbar">
            <div className="network-toolbar-row-product-view">
              <div className="header-col network-product-col">
                <label htmlFor="product-select" className="normal-bold">Select your product:</label>
                <div className="select-wrapper">
                  <select
                    id="product-select"
                    className="input-base"
                    value={selectedProductId}
                    onChange={handleProductChange}
                    disabled={displayProducts.length === 0}
                  >
                    <option value="">{displayProducts.length === 0 ? "No products found" : "-- Select a product --"}</option>
                    {displayProducts.map(product => (
                      <option key={product.productId} value={product.productId}>
                        {product.productName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="select-arrow" />
                </div>
              </div>
              <div className={`network-view-column${!selectedProductId ? " network-view-column--disabled" : ""}`}>
                <span className="normal-bold network-view-heading" id="network-view-heading">
                  Select View
                </span>
                <div
                  className="network-view-toggle-wrap"
                  role="group"
                  aria-labelledby="network-view-heading"
                >
                  <span className={`view-label ${currentView === 'consolidated' ? 'active' : ''}`}>Consolidated View</span>
                  <label className={`switch ${!selectedProductId ? 'switch-disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={currentView === 'component'}
                      onChange={handleViewToggle}
                      disabled={!selectedProductId}
                      aria-disabled={!selectedProductId}
                    />
                    <span className="slider round"></span>
                  </label>
                  <span className={`view-label ${currentView === 'component' ? 'active' : ''}`}>Component View</span>
                </div>
              </div>
            </div>
            <div className="network-scope-radios">
              <div id="network-scope-legend" className="normal-bold network-scope-legend">
                Carbon Emission Scope:
              </div>
              <div
                className="scope-radio-group"
                role="radiogroup"
                aria-labelledby="network-scope-legend"
              >
                {EMISSION_SCOPES.map(scope => (
                  <label key={scope.id} className="scope-radio-label">
                    <input
                      type="radio"
                      name="network-emission-scope"
                      value={scope.id}
                      checked={selectedScope.id === scope.id}
                      onChange={handleScopeChange}
                    />
                    <span>{scope.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && <div className="submit-error" style={{ marginBottom: '0.5rem' }}>{error}</div>}

          {/* Consolidated View: D3 supply-chain graph */}
          {currentView === 'consolidated' && (
            <div className="analytics-card network-page" style={{ marginTop: 0 }}>
              <div className="analytics-table-container">
                {loadingNetwork ? (
                  <div className="loading-message">Loading network data...</div>
                ) : consolidatedData?.nodes?.length > 0 ? (
                  <NetworkGraph
                    data={consolidatedData}
                    viewMode="consolidated"
                    productName={productName}
                    selectedScope={selectedScope}
                    selectedProduct={selectedProduct}
                    products={products}
                    allBackendProducts={rawProductsData}
                  />
                ) : (
                  <div className="no-data-message">
                    {selectedProductId ? "No network data available for this selection." : "Select a product to view its network."}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Component View: per-component D3 graph (only components with upstream links) */}
          {currentView === 'component' && (() => {
            const visibleComponents = components
              .map((comp, index) => ({ comp, index, meta: componentMeta[index] }))
              .filter(({ comp, meta }) => {
                const ingredient = (comp.ingredient || '').toString().trim();
                return !ingredient.startsWith('Process:') && meta?.hasInputs;
              });
            const activeGraphData = componentGraphData[selectedComponentIndex] || null;
            return (
              <>
                {selectedProductId && visibleComponents.length > 0 ? (
                  <nav className="component-tabs">
                    {visibleComponents.map(({ comp, index, meta }) => (
                      <button
                        key={index}
                        className={`component-tab-btn ${index === selectedComponentIndex ? 'active' : ''}`}
                        onClick={() => setSelectedComponentIndex(index)}
                      >
                        {comp.component || comp.ingredient || meta?.name || `Component ${index + 1}`}
                      </button>
                    ))}
                  </nav>
                ) : selectedProductId ? (
                  <p className="normal-regular" style={{ color: 'rgba(var(--greys), 1)', padding: '1rem 0' }}>
                    No components with upstream connections found.
                  </p>
                ) : null}
                <div className="analytics-card network-page" style={{ marginTop: 0 }}>
                  <div className="analytics-table-container">
                    {loadingNetwork ? (
                      <div className="loading-message">Loading network data...</div>
                    ) : activeGraphData?.nodes?.length > 0 ? (
                      <NetworkGraph
                        data={activeGraphData}
                        viewMode="component"
                        productName={productName}
                        selectedScope={selectedScope}
                        selectedProduct={selectedProduct}
                        products={products}
                        allBackendProducts={rawProductsData}
                      />
                    ) : (
                      <div className="no-data-message">
                        {selectedProductId ? 'No network data available for this component.' : 'Select a product to view its network.'}
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default NetworkPage;