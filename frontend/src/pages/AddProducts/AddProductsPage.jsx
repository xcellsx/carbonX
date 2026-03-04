import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import InstructionalCarousel from '../../components/InstructionalCarousel/InstructionalCarousel';
import Navbar from '../../components/Navbar/Navbar';
import TemplateCard from '../../components/TemplateCard/TemplateCard';
import { productAPI, networkAPI, processAPI } from '../../services/api';
import './AddProductsPage.css';

/*
 * Browse Templates – data sources:
 * 1. getProducts (GET /api/products)  → Raw materials accordion
 * 2. getGraph    (GET /api/graph/productgraph?productid= or empty) → CarbonX Templates (product chains)
 * 3. getProcess  (GET /api/processes) → Processes accordion
 */

// Backend returns result as array [ { nodes, links } ]; normalize to one object
function normalizeGraphResponse(res) {
  const raw = res?.data;
  if (raw == null) return { nodes: [], links: [] };
  const obj = Array.isArray(raw) && raw.length > 0 ? raw[0] : raw;
  return {
    nodes: Array.isArray(obj?.nodes) ? obj.nodes : [],
    links: Array.isArray(obj?.links) ? obj.links : (Array.isArray(obj?.edges) ? obj.edges : []),
  };
}

const STORAGE_KEY = 'carbonx-custom-templates';
function getStoredTemplates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

const ADD_PRODUCTS_CAROUSEL_SLIDES = [
  { title: 'Welcome to Browse Templates', description: 'Find product templates by category (Pasta, Bowls, Soup) or use Raw materials—the list of items from your backend. Add any template to "Customize your own" to edit and use it in your inventory.', icon: <Layers size={40} /> },
  { title: 'Customize your own', description: 'Templates you add appear at the top under Customize your own. Edit them to change name, quantity, elements, and processes. Your custom templates are saved and will show on the Inventory page.', icon: <Plus size={40} /> },
  { title: 'Search & add', description: 'Use the search bar to filter templates by name or ingredient. Click "Add" on a card to copy it to your custom list, or click "Edit" to open the template editor before adding.', icon: <Search size={40} /> },
];

const AddProductsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [templateSearch, setTemplateSearch] = useState('');
  const [accordionOpen, setAccordionOpen] = useState({ 'graph-cards': true, 'raw-materials': false, processes: false });
  const [customTemplates, setCustomTemplates] = useState(() => getStoredTemplates());
  const [rawMaterials, setRawMaterials] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState('');
  // Per-product graphs (raw product name -> { nodes, links }) for template cards
  const [productGraphsMap, setProductGraphsMap] = useState({});
  const [productGraphsLoading, setProductGraphsLoading] = useState(false);

  const fetchRawMaterials = useCallback(async () => {
    try {
      const res = await productAPI.getAllProducts();
      const raw = Array.isArray(res?.data) ? res.data : [];
      console.log('[AddProducts] getProducts response:', raw?.length ?? 0, 'items', raw?.length ? raw : '(empty)');
      const normalized = raw.map((p) => {
        const fromDpp = p.dpp;
        const name = (p.name ?? fromDpp?.name ?? '').toString().trim() || '—';
        const key = p.key ?? (p.id && String(p.id).includes('/') ? String(p.id).split('/').pop() : p.id);
        return {
          id: `raw-${key ?? name}`,
          productKey: key ?? name,
          name,
          quantityValue: p.quantityValue ?? p.quantity ?? null,
          quantifiableUnit: p.quantifiableUnit ?? 'kg',
        };
      });
      setRawMaterials(normalized);
    } catch (e) {
      console.warn('[AddProducts] getProducts failed:', e?.message);
      setRawMaterials([]);
    }
  }, []);

  const fetchProcesses = useCallback(async () => {
    try {
      const res = await processAPI.getProcesses();
      const list = Array.isArray(res?.data) ? res.data : [];
      const normalized = list.map((p) => {
        const name = (p.name ?? '').toString().trim() || '—';
        const key = p.key ?? (p.id && String(p.id).includes('/') ? String(p.id).split('/').pop() : p.id);
        return {
          id: `process-${key ?? name}`,
          name,
          type: p.type ?? '—',
        };
      });
      setProcesses(normalized);
    } catch (_) {
      setProcesses([]);
    }
  }, []);

  const fetchGraph = useCallback(async () => {
    setGraphLoading(true);
    setGraphError('');
    try {
      const res = await networkAPI.getProductGraph();
      const { nodes, links } = normalizeGraphResponse(res);
      const edges = links;
      setGraphData({ nodes, edges });

      // Console: what the graph looks like (open DevTools → Console to see)
      console.log('[Graph] Fetched from GET /api/graph/productgraph (or empty):', {
        nodeCount: nodes.length,
        linkCount: edges.length,
        nodes,
        links: edges,
        rawResponse: res?.data,
      });

      // Log graph for tomato sauce and spaghetti respectively
      const productNodes = nodes.filter((n) => n.type === 'products' || n.type === 'product');
      const nameMatch = (n, name) => {
        const label = (n.label ?? n.name ?? '').toString().trim().toLowerCase();
        return label === name.toLowerCase() || label.includes(name.toLowerCase());
      };
      const tomatoSauceNode = productNodes.find((n) => nameMatch(n, 'tomato sauce'));
      const spaghettiNode = productNodes.find((n) => nameMatch(n, 'spaghetti'));

      if (tomatoSauceNode) {
        try {
          const tomatoRes = await networkAPI.getProductGraph(tomatoSauceNode.id);
          const tomatoGraph = normalizeGraphResponse(tomatoRes);
          console.log('[Graph] TOMATO SAUCE – productid=' + tomatoSauceNode.id, tomatoGraph);
          console.log('[Graph] TOMATO SAUCE nodes:', tomatoGraph.nodes);
          console.log('[Graph] TOMATO SAUCE links:', tomatoGraph.links);
        } catch (e) {
          console.warn('[Graph] Failed to fetch graph for tomato sauce:', e?.message);
        }
      } else {
        console.log('[Graph] No product node found for "tomato sauce" in graph.');
      }

      if (spaghettiNode) {
        try {
          const spaghettiRes = await networkAPI.getProductGraph(spaghettiNode.id);
          const spaghettiGraph = normalizeGraphResponse(spaghettiRes);
          console.log('[Graph] SPAGHETTI – productid=' + spaghettiNode.id, spaghettiGraph);
          console.log('[Graph] SPAGHETTI nodes:', spaghettiGraph.nodes);
          console.log('[Graph] SPAGHETTI links:', spaghettiGraph.links);
        } catch (e) {
          console.warn('[Graph] Failed to fetch graph for spaghetti:', e?.message);
        }
      } else {
        console.log('[Graph] No product node found for "spaghetti" in graph.');
      }
    } catch (err) {
      console.error('[Graph] Failed to fetch product graph:', err?.message, err);
      console.log('[Graph] Request was: GET /api/graph/productgraph or initial empty graph (see Network tab for full URL)');
      setGraphError(err?.message || 'Could not load graph from backend.');
      setGraphData({ nodes: [], edges: [] });
    } finally {
      setGraphLoading(false);
    }
  }, []);

  // Fetch individual graph for each raw product so every product gets a template
  // Backend /api/graph/productgraph expects productid = document key (e.g. _key), not name
  const fetchProductGraphs = useCallback(async (rawList) => {
    if (!rawList || rawList.length === 0) {
      setProductGraphsMap({});
      return;
    }
    setProductGraphsLoading(true);
    const next = {};
    await Promise.all(
      rawList.map(async (rm) => {
        const name = (rm.name || '').trim();
        if (!name || name === '—') return;
        const productId = rm.productKey ?? rm.name;
        try {
          const res = await networkAPI.getProductGraphArango(productId);
          const { nodes, links } = normalizeGraphResponse(res);
          if (nodes.length > 0 || links.length > 0) {
            next[name] = { nodes, links };
            console.log('[Graph] Product graph for "' + name + '" (productid=' + productId + '):', { nodes, links });
          }
        } catch (e) {
          console.warn('[Graph] Failed for "' + name + '" (productid=' + productId + '):', e?.message);
        }
      })
    );
    setProductGraphsMap(next);
    console.log('[Graph] All product graphs loaded:', Object.keys(next).length, 'products with graph data', next);
    setProductGraphsLoading(false);
  }, []);

  useEffect(() => {
    if (location.pathname === '/add-products') {
      setCustomTemplates(getStoredTemplates());
      fetchRawMaterials();
      fetchProcesses();
      fetchGraph();
    }
  }, [location.pathname, fetchRawMaterials, fetchProcesses, fetchGraph]);

  useEffect(() => {
    if (location.pathname === '/add-products' && rawMaterials.length > 0) {
      fetchProductGraphs(rawMaterials);
    }
  }, [location.pathname, rawMaterials, fetchProductGraphs]);

  // Reflect template edits from Inventory or other tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue != null) {
        try {
          setCustomTemplates(JSON.parse(e.newValue));
        } catch (_) {}
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && location.pathname === '/add-products') {
        setCustomTemplates(getStoredTemplates());
      }
    };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [location.pathname]);

  const saveCustomTemplates = (templates) => {
    setCustomTemplates(templates);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (e) {
      console.warn('Could not save custom templates', e);
    }
  };

  const handleAddCustomTemplate = () => {
    navigate('/add-products/edit/new');
  };

  const openEditCustom = (t) => {
    navigate(`/add-products/edit/${t.id}`);
  };

  const openCopyFromAvailable = (t) => {
    navigate('/add-products/edit/new', { state: { templateToCopy: t } });
  };

  const addToCustom = (t) => {
    const newTemplate = {
      ...t,
      id: `custom-${Date.now()}`,
    };
    saveCustomTemplates([...customTemplates, newTemplate]);
  };

  const addRawMaterialToCustom = (rm) => {
    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: rm.name,
      ingredients: [],
      processes: [],
      quantity: rm.quantityValue != null && rm.quantityValue !== '' ? String(rm.quantityValue) : '',
    };
    saveCustomTemplates([...customTemplates, newTemplate]);
  };

  const addProcessToCustom = (proc) => {
    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: proc.name,
      ingredients: [],
      processes: [{ process: proc.name, ...(proc.type && proc.type !== '—' ? { type: proc.type } : {}) }],
      quantity: '',
    };
    saveCustomTemplates([...customTemplates, newTemplate]);
  };

  const handleCustomQuantityChange = (templateId, newQuantity) => {
    setCustomTemplates((prev) => {
      const next = prev.map((t) =>
        t.id === templateId ? { ...t, quantity: newQuantity } : t
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Could not save custom templates', e);
      }
      return next;
    });
  };

  const handleDeleteCustom = (id, e) => {
    e?.stopPropagation?.();
    saveCustomTemplates(customTemplates.filter((t) => t.id !== id));
  };

  // Build one template from one product's graph (nodes + links)
  // Backend sends link.type as "inputs" | "outputs" (collection name); normalize for mapping
  const templateFromProductGraph = useCallback((productName, nodes, links) => {
    const nodeMap = new Map((nodes || []).map((n) => [n.id, n]));
    const label = (id) => nodeMap.get(id)?.label ?? nodeMap.get(id)?.name ?? id;
    const ls = links || [];
    const outputLinksByProduct = new Map();
    const inputLinksByProcess = new Map();
    ls.forEach((l) => {
      const t = (l.type || '').toLowerCase();
      if (t === 'outputs' || t === 'output') {
        const productId = l.target;
        if (!outputLinksByProduct.has(productId)) outputLinksByProduct.set(productId, []);
        outputLinksByProduct.get(productId).push(l);
      } else if (t === 'inputs' || t === 'input') {
        const processId = l.target;
        if (!inputLinksByProcess.has(processId)) inputLinksByProcess.set(processId, []);
        inputLinksByProcess.get(processId).push(l);
      }
    });
    const productNameLower = String(productName || '').trim().toLowerCase();
    const mainNode = (nodes || []).find(
      (n) =>
        (n.type === 'products' || n.type === 'product') &&
        (String(n.label ?? n.name ?? '').trim().toLowerCase() === productNameLower ||
          (n.id && String(n.id).toLowerCase().includes(productNameLower)))
    );
    if (!mainNode) return null;
    const productId = mainNode.id;
    const outLinks = outputLinksByProduct.get(productId) || [];
    if (outLinks.length === 0) return { id: `graph-${productId}`, name: productName, ingredients: [], processes: [] };

    const processLabels = [...new Set(outLinks.map((l) => label(l.source)).filter(Boolean))];
    const ingredientIds = new Set();
    outLinks.forEach((l) => {
      (inputLinksByProcess.get(l.source) || []).forEach((inL) => ingredientIds.add(inL.source));
    });
    const ingredientLabels = [...new Set([...ingredientIds].map((id) => label(id)).filter(Boolean))];
    return {
      id: `graph-${productId}`,
      name: label(productId) || mainNode.label || productName,
      ingredients: ingredientLabels,
      processes: processLabels,
    };
  }, []);

  // Template cards: only products that have inputs (elements) appear under CarbonX Templates
  const graphTemplates = useMemo(() => {
    const fromPerProduct = [];
    const productNames = Object.keys(productGraphsMap || {});
    productNames.forEach((productName) => {
      const g = productGraphsMap[productName];
      if (!g || (!g.nodes?.length && !g.links?.length)) return;
      const t = templateFromProductGraph(productName, g.nodes, g.links);
      if (t && Array.isArray(t.ingredients) && t.ingredients.length > 0) {
        fromPerProduct.push(t);
      }
    });
    if (fromPerProduct.length > 0) {
      return fromPerProduct.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
    }

    // Fallback: build from full graph (same as before)
    const nodes = graphData.nodes || [];
    const links = graphData.edges || [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const label = (id) => nodeMap.get(id)?.label ?? nodeMap.get(id)?.name ?? id;
    const outputLinksByProduct = new Map();
    const inputLinksByProcess = new Map();
    links.forEach((l) => {
      const t = (l.type || '').toLowerCase();
      if (t === 'outputs' || t === 'output') {
        const productId = l.target;
        if (!outputLinksByProduct.has(productId)) outputLinksByProduct.set(productId, []);
        outputLinksByProduct.get(productId).push(l);
      } else if (t === 'inputs' || t === 'input') {
        const processId = l.target;
        if (!inputLinksByProcess.has(processId)) inputLinksByProcess.set(processId, []);
        inputLinksByProcess.get(processId).push(l);
      }
    });
    const productType = (n) => n.type === 'products' || n.type === 'product';
    const productNodes = nodes.filter((n) => productType(n));
    const templates = [];
    productNodes.forEach((node) => {
      const productId = node.id;
      const outLinks = outputLinksByProduct.get(productId) || [];
      if (outLinks.length === 0) return;
      const processLabels = [...new Set(outLinks.map((l) => label(l.source)).filter(Boolean))];
      const ingredientIds = new Set();
      outLinks.forEach((l) => {
        const processId = l.source;
        (inputLinksByProcess.get(processId) || []).forEach((inL) => ingredientIds.add(inL.source));
      });
      const ingredientLabels = [...new Set([...ingredientIds].map((id) => label(id)).filter(Boolean))];
      if (ingredientLabels.length === 0) return;
      templates.push({
        id: `graph-${productId}`,
        name: label(productId) || node.label || productId,
        ingredients: ingredientLabels,
        processes: processLabels,
      });
    });
    return templates.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  }, [productGraphsMap, graphData.nodes, graphData.edges, templateFromProductGraph]);

  // Log inputs that form spaghetti and tomato sauce (direct + recursive)
  useEffect(() => {
    if (!graphTemplates.length) return;

    const nameMatches = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

    const getAllInputsRecursive = (productName, visited = new Set()) => {
      const key = productName.toLowerCase();
      if (visited.has(key)) return { ingredients: [], processes: [] };
      visited.add(key);

      const t = graphTemplates.find((x) => nameMatches(x.name, productName));
      if (!t) return { ingredients: [], processes: [] };

      const allIngredients = [...new Set(t.ingredients || [])];
      const allProcesses = [...new Set(t.processes || [])];

      (t.ingredients || []).forEach((ing) => {
        const sub = getAllInputsRecursive(ing, visited);
        sub.ingredients.forEach((s) => allIngredients.push(s));
        sub.processes.forEach((s) => allProcesses.push(s));
      });

      return {
        ingredients: [...new Set(allIngredients)],
        processes: [...new Set(allProcesses)],
      };
    };

    ['spaghetti', 'tomato sauce'].forEach((productName) => {
      const t = graphTemplates.find((x) => nameMatches(x.name, productName));
      if (!t) {
        console.log(`[Graph] Inputs that form "${productName}": (product not found in graph)`);
        return;
      }
      const direct = {
        ingredients: t.ingredients || [],
        processes: t.processes || [],
      };
      const recursive = getAllInputsRecursive(productName);
      console.log(`[Graph] Inputs that form "${productName}":`, {
        directInputs: direct,
        allInputsRecursive: recursive,
      });
    });
  }, [graphTemplates]);

  const toggleAccordion = (groupId) => {
    setAccordionOpen((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <div className="container">
      <InstructionalCarousel pageId="add-products" slides={ADD_PRODUCTS_CAROUSEL_SLIDES} newUserOnly />
      <Navbar />
      <div className="content-section-main">
        <div className="content-container-main">
          <div className="header-group">
            <h1>Browse Templates</h1>
            <p className="medium-regular">Find All Available Templates Here.</p>
          </div>

          {/* CUSTOMIZE YOUR OWN - at the top, stores user's updated/edited templates */}
          <section className="customize-section">
            <div className="customize-header">
              <div>
                <h2 className="descriptor-medium" style={{ marginBottom: '1rem'}}>Customize your own</h2>
                <p className="customize-subtext">Edit any template or click on the + to add your own. Your custom templates are saved below.</p>
              </div>
              <button type="button" className="icon" onClick={handleAddCustomTemplate} title="Add custom template">
                <Plus size={20} />
              </button>
            </div>
            <div className="customize-area">
              {customTemplates.length === 0 ? (
                <div className="customize-placeholder">
                  <p>Edit any template or click on the + to add your own.</p>
                </div>
              ) : (
                <div className="customize-cards">
                  {[...customTemplates]
                    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
                    .map((t) => (
                    <TemplateCard
                      key={t.id}
                      templateId={t.id}
                      name={t.name}
                      ingredients={t.ingredients}
                      processes={t.processes}
                      quantity={t.quantity}
                      onQuantityChange={handleCustomQuantityChange}
                      onEdit={() => openEditCustom(t)}
                      onDelete={(e) => handleDeleteCustom(t.id, e)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* CarbonX Product Templates section */}
          <section className="templates-section">
            <div className="templates-section-header">
              <h2 className="descriptor-medium">CarbonX Product Templates</h2>
            </div>

            <div className="template-accordion">
              {/* CarbonX Templates – only products that have inputs (elements) from the graph */}
              <div className="template-accordion-item">
                <button
                  type="button"
                  className="template-accordion-trigger"
                  onClick={() => toggleAccordion('graph-cards')}
                  aria-expanded={accordionOpen['graph-cards']}
                >
                  {accordionOpen['graph-cards'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  <span className="template-accordion-label">CarbonX Templates</span>
                  <span className="raw-materials-count">({graphTemplates.length})</span>
                </button>
                {accordionOpen['graph-cards'] && (
                  <div className="template-cards-grid">
                    {(graphLoading || productGraphsLoading) ? (
                      <p className="graph-table-message">Loading graph templates...</p>
                    ) : graphError ? (
                      <p className="graph-table-message graph-table-error">{graphError}</p>
                    ) : graphTemplates.length === 0 ? (
                      <p className="graph-table-message">No product chains with inputs in the graph yet. Add products, processes, and input/output links in the backend.</p>
                    ) : (
                      graphTemplates.map((t) => (
                        <TemplateCard
                          key={t.id}
                          name={t.name}
                          ingredients={t.ingredients}
                          processes={t.processes}
                          quantity={t.quantity}
                          onAdd={() => addToCustom(t)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Processes from backend (GET /api/processes) */}
              <div key="processes" className="template-accordion-item">
                <button
                  type="button"
                  className="template-accordion-trigger"
                  onClick={() => toggleAccordion('processes')}
                  aria-expanded={accordionOpen['processes']}
                >
                  {accordionOpen['processes'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  <span className="template-accordion-label">Processes</span>
                  <span className="raw-materials-count">({processes.length})</span>
                </button>
                {accordionOpen['processes'] && (
                  <div className="template-cards-grid">
                    {processes.length === 0 ? (
                      <p className="graph-table-message">No processes from backend. Add processes via API.</p>
                    ) : (
                      processes
                        .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
                        .map((proc) => (
                          <TemplateCard
                            key={proc.id}
                            name={proc.name}
                            processes={proc.type && proc.type !== '—' ? [proc.type] : []}
                            onAdd={() => addProcessToCustom(proc)}
                          />
                        ))
                    )}
                  </div>
                )}
              </div>

              {/* Raw materials from backend (GET /api/products) */}
              {rawMaterials.length > 0 && (
                <div key="raw-materials" className="template-accordion-item">
                  <button
                    type="button"
                    className="template-accordion-trigger"
                    onClick={() => toggleAccordion('raw-materials')}
                    aria-expanded={accordionOpen['raw-materials']}
                  >
                    {accordionOpen['raw-materials'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <span className="template-accordion-label">Raw materials</span>
                    <span className="raw-materials-count">({rawMaterials.length})</span>
                  </button>
                  {accordionOpen['raw-materials'] && (
                    <div className="template-cards-grid">
                      {rawMaterials
                        .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
                        .map((rm) => (
                          <TemplateCard
                            key={rm.id}
                            name={rm.name}
                            quantity={rm.quantityValue != null && rm.quantityValue !== '' ? rm.quantityValue : ''}
                            weightOnly
                            weightUnit={rm.quantifiableUnit || 'kg'}
                            onAdd={() => addRawMaterialToCustom(rm)}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

    </div>
  );
};

export default AddProductsPage;
