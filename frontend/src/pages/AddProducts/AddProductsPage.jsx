import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import InstructionalCarousel from '../../components/InstructionalCarousel/InstructionalCarousel';
import Navbar from '../../components/Navbar/Navbar';
import TemplateCard from '../../components/TemplateCard/TemplateCard';
import { productAPI, processAPI, templateAPI } from '../../services/api';
import {
  getStoredCustomTemplates,
  setStoredCustomTemplates,
  CUSTOM_TEMPLATES_STORAGE_PREFIX,
} from '../../utils/customTemplatesStorage';
import './AddProductsPage.css';

/*
 * Browse Templates – data sources:
 * 1. getProducts (GET /api/products)  → Raw materials accordion
 * 2. getGraph    (GET /api/templates/products/{key}/map) → CarbonX Templates (product chains)
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
  const [customTemplates, setCustomTemplates] = useState(() => getStoredCustomTemplates());
  const [rawMaterials, setRawMaterials] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState('');
  // Per-product graphs (raw product name -> { nodes, links }) for template cards
  const [productGraphsMap, setProductGraphsMap] = useState({});
  const [productGraphsLoading, setProductGraphsLoading] = useState(false);
  const [connectedProductKeys, setConnectedProductKeys] = useState(new Set());

  const fetchRawMaterials = useCallback(async () => {
    try {
      const res = await productAPI.getAllProducts();
      const raw = Array.isArray(res?.data) ? res.data : [];
      console.log('[AddProducts] getProducts response:', raw?.length ?? 0, 'items', raw?.length ? raw : '(empty)');
      const normalized = raw.map((p) => {
        const fromDpp = p.dpp;
        const name = (p.name ?? fromDpp?.name ?? '').toString().trim() || '—';
        const key = p.key
          ?? p._key
          ?? (p.id && String(p.id).includes('/') ? String(p.id).split('/').pop() : p.id)
          ?? (p._id && String(p._id).includes('/') ? String(p._id).split('/').pop() : p._id);
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
      // This backend does not expose /api/graph/productgraph.
      // Product template graphs are fetched per product via /api/templates/{collection}/{key}/map.
      setGraphData({ nodes: [], edges: [] });
      const connectedRes = await templateAPI.getConnectedProductNodes();
      const ids = Array.isArray(connectedRes?.data?.products) ? connectedRes.data.products : [];
      const keys = new Set(
        ids
          .map((id) => (typeof id === 'string' && id.includes('/') ? id.split('/').pop() : id))
          .filter(Boolean)
      );
      setConnectedProductKeys(keys);
    } catch (err) {
      console.error('[Graph] Failed to initialize template graph state:', err?.message, err);
      setGraphError(err?.message || 'Could not load graph from backend.');
      setGraphData({ nodes: [], edges: [] });
      setConnectedProductKeys(new Set());
    } finally {
      setGraphLoading(false);
    }
  }, []);

  // Fetch individual graph for each raw product so every product gets a template.
  // Backend expects a document key for /api/templates/products/{key}/map.
  const fetchProductGraphs = useCallback(async (rawList) => {
    if (connectedProductKeys.size === 0) {
      setProductGraphsMap({});
      return;
    }
    const nameByKey = new Map(
      (rawList || []).flatMap((rm) => {
        const rawKey = rm?.productKey;
        if (!rawKey) return [];
        const k = String(rawKey).includes('/') ? String(rawKey).split('/').pop() : String(rawKey);
        return [[k, (rm?.name || '').trim()]];
      })
    );
    setProductGraphsLoading(true);
    const next = {};
    await Promise.all(
      [...connectedProductKeys].map(async (productId) => {
        const key = String(productId).includes('/') ? String(productId).split('/').pop() : String(productId);
        const fallbackName = nameByKey.get(key) || '';
        try {
          const res = await templateAPI.getTemplateMap('products', key);
          const { nodes, links } = normalizeGraphResponse(res);
          if (nodes.length > 0 || links.length > 0) {
            next[key] = { productKey: key, productName: fallbackName, nodes, links };
            console.log('[Graph] Product template graph loaded (key=' + key + '):', { nodes, links });
          }
        } catch (e) {
          console.warn('[Graph] Failed for product key=' + key + ':', e?.message);
        }
      })
    );
    setProductGraphsMap(next);
    console.log('[Graph] Connected product keys:', connectedProductKeys.size, 'graphs loaded:', Object.keys(next).length, next);
    setProductGraphsLoading(false);
  }, [connectedProductKeys]);

  useEffect(() => {
    if (location.pathname === '/add-products') {
      setCustomTemplates(getStoredCustomTemplates());
      fetchRawMaterials();
      fetchProcesses();
      fetchGraph();
    }
  }, [location.pathname, fetchRawMaterials, fetchProcesses, fetchGraph]);

  useEffect(() => {
    if (location.pathname === '/add-products') {
      fetchProductGraphs(rawMaterials);
    }
  }, [location.pathname, rawMaterials, fetchProductGraphs]);

  // Reflect template edits from Inventory or other tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (
        e.key != null &&
        e.key.startsWith(CUSTOM_TEMPLATES_STORAGE_PREFIX) &&
        e.newValue != null
      ) {
        try {
          setCustomTemplates(JSON.parse(e.newValue));
        } catch (_) {}
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && location.pathname === '/add-products') {
        setCustomTemplates(getStoredCustomTemplates());
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
      setStoredCustomTemplates(templates);
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
        setStoredCustomTemplates(next);
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
  const templateFromProductGraph = useCallback((productName, nodes, links, productKey = '') => {
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
    const normalizedKey = String(productKey || '').trim();
    const mainNode = (nodes || []).find(
      (n) =>
        (n.type === 'products' || n.type === 'product') &&
        ((productNameLower && String(n.label ?? n.name ?? '').trim().toLowerCase() === productNameLower) ||
          (normalizedKey && String(n.id || '').split('/').pop() === normalizedKey) ||
          (productNameLower && n.id && String(n.id).toLowerCase().includes(productNameLower)))
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
    const productEntries = Object.values(productGraphsMap || {});
    productEntries.forEach((g) => {
      if (!g || (!g.nodes?.length && !g.links?.length)) return;
      const t = templateFromProductGraph(g.productName, g.nodes, g.links, g.productKey);
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

  const templateSearchNorm = templateSearch.trim().toLowerCase();

  const templateMatchesSearch = useCallback(
    (name, ingredients = [], processes = []) => {
      if (!templateSearchNorm) return true;
      if ((name || '').toLowerCase().includes(templateSearchNorm)) return true;
      for (const item of Array.isArray(ingredients) ? ingredients : []) {
        const s =
          typeof item === 'object' && item && 'ingredient' in item
            ? String(item.ingredient || '')
            : String(item || '');
        if (s.toLowerCase().includes(templateSearchNorm)) return true;
      }
      for (const item of Array.isArray(processes) ? processes : []) {
        const s =
          typeof item === 'object' && item && 'process' in item
            ? String(item.process || '')
            : String(item || '');
        const typ = typeof item === 'object' && item && item.type ? String(item.type) : '';
        if (s.toLowerCase().includes(templateSearchNorm) || typ.toLowerCase().includes(templateSearchNorm)) {
          return true;
        }
      }
      return false;
    },
    [templateSearchNorm]
  );

  const filteredGraphTemplates = useMemo(
    () => graphTemplates.filter((t) => templateMatchesSearch(t.name, t.ingredients, t.processes)),
    [graphTemplates, templateMatchesSearch]
  );

  const filteredCustomTemplatesForSearch = useMemo(
    () => customTemplates.filter((t) => templateMatchesSearch(t.name, t.ingredients, t.processes)),
    [customTemplates, templateMatchesSearch]
  );

  const toggleAccordion = (groupId) => {
    setAccordionOpen((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <div className="container add-products-page">
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
              ) : filteredCustomTemplatesForSearch.length === 0 ? (
                <div className="customize-placeholder">
                  <p>No custom templates match your search.</p>
                </div>
              ) : (
                <div className="customize-cards">
                  {[...filteredCustomTemplatesForSearch]
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

            <div className="templates-search-row">
              <Search size={18} className="templates-search-icon" aria-hidden />
              <input
                type="search"
                className="input-base templates-search-input"
                placeholder="Filter CarbonX & custom templates (name, ingredient, process)…"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                aria-label="Filter template cards only; processes and raw materials stay fully listed below"
              />
            </div>
            {templateSearchNorm ? (
              <p className="templates-search-hint medium-regular">
                Showing filtered template cards above.{' '}
                <strong>Processes</strong> and <strong>Raw materials</strong> lists below are not filtered—use them to add any item.
              </p>
            ) : null}

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
                  <span className="raw-materials-count">
                    ({filteredGraphTemplates.length}
                    {templateSearchNorm && graphTemplates.length !== filteredGraphTemplates.length
                      ? ` / ${graphTemplates.length}`
                      : ''}
                    )
                  </span>
                </button>
                {accordionOpen['graph-cards'] && (
                  <div className="template-cards-grid">
                    {(graphLoading || productGraphsLoading) ? (
                      <p className="graph-table-message">Loading graph templates...</p>
                    ) : graphError ? (
                      <p className="graph-table-message graph-table-error">{graphError}</p>
                    ) : graphTemplates.length === 0 ? (
                      <p className="graph-table-message">No product chains with inputs in the graph yet. Add products, processes, and input/output links in the backend.</p>
                    ) : filteredGraphTemplates.length === 0 ? (
                      <p className="graph-table-message">No templates match your search.</p>
                    ) : (
                      filteredGraphTemplates.map((t) => (
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
