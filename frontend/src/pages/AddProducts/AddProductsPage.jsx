import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import InstructionalCarousel from '../../components/InstructionalCarousel/InstructionalCarousel';
import Navbar from '../../components/Navbar/Navbar';
import TemplateCard from '../../components/TemplateCard/TemplateCard';
import { productAPI } from '../../services/api';
import './AddProductsPage.css';

const STORAGE_KEY = 'carbonx-custom-templates';
function getStoredTemplates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Food groups with available templates (for accordion)
const FOOD_GROUPS = [
  {
    id: 'pasta',
    label: 'Pasta',
    templates: [
      { id: 'carbonara', name: 'Carbonara', ingredients: ['Spaghetti', 'Cream', 'Egg'], processes: ['Frying', 'Boiling'] },
      { id: 'aglio-olio', name: 'Aglio Olio', ingredients: ['Spaghetti'], processes: ['Frying', 'Boiling'] },
    ],
  },
  {
    id: 'bowls',
    label: 'Bowls',
    templates: [
      { id: 'chicken-bowl', name: 'Chicken', ingredients: ['Rice', 'Chicken', 'Egg', 'Turmeric'], processes: ['Frying', 'Boiling'] },
      { id: 'beef-bowl', name: 'Beef', ingredients: ['Rice', 'Beef', 'Egg', 'Turmeric'], processes: ['Frying', 'Boiling'] },
      { id: 'pork-bowl', name: 'Pork', ingredients: ['Rice', 'Pork', 'Egg', 'Turmeric'], processes: ['Frying', 'Boiling'] },
    ],
  },
  {
    id: 'soup',
    label: 'Soup',
    templates: [
      { id: 'mushroom-soup', name: 'Mushroom Soup', ingredients: ['Mushrooms', 'Cream', 'Stock'], processes: ['Boiling', 'Blending'] },
      { id: 'clam-chowder', name: 'Clam Chowder', ingredients: ['Clams', 'Potato', 'Cream', 'Bacon'], processes: ['Boiling', 'Simmering'] },
    ],
  },
];

const ADD_PRODUCTS_CAROUSEL_SLIDES = [
  { title: 'Welcome to Browse Templates', description: 'Find product templates by category (Pasta, Bowls, Soup) or use Raw materials—the list of items from your backend. Add any template to "Customize your own" to edit and use it in your inventory.', icon: <Layers size={40} /> },
  { title: 'Customize your own', description: 'Templates you add appear at the top under Customize your own. Edit them to change name, quantity, elements, and processes. Your custom templates are saved and will show on the Inventory page.', icon: <Plus size={40} /> },
  { title: 'Search & add', description: 'Use the search bar to filter templates by name or ingredient. Click "Add" on a card to copy it to your custom list, or click "Edit" to open the template editor before adding.', icon: <Search size={40} /> },
];

const AddProductsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [templateSearch, setTemplateSearch] = useState('');
  const [accordionOpen, setAccordionOpen] = useState({ pasta: true, bowls: false, soup: false, 'raw-materials': false });
  const [customTemplates, setCustomTemplates] = useState(() => getStoredTemplates());
  const [rawMaterials, setRawMaterials] = useState([]);

  const fetchRawMaterials = useCallback(async () => {
    try {
      const res = await productAPI.getAllProducts();
      const raw = Array.isArray(res?.data) ? res.data : [];
      const normalized = raw.map((p) => {
        const fromDpp = p.dpp;
        const name = (p.name ?? fromDpp?.name ?? '').toString().trim() || '—';
        const key = p.key ?? (p.id && String(p.id).includes('/') ? String(p.id).split('/').pop() : p.id);
        return {
          id: `raw-${key ?? name}`,
          name,
          quantityValue: p.quantityValue ?? p.quantity ?? null,
          quantifiableUnit: p.quantifiableUnit ?? 'kg',
        };
      });
      setRawMaterials(normalized);
    } catch (_) {
      setRawMaterials([]);
    }
  }, []);

  useEffect(() => {
    if (location.pathname === '/add-products') {
      setCustomTemplates(getStoredTemplates());
      fetchRawMaterials();
    }
  }, [location.pathname, fetchRawMaterials]);

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

  const handleDeleteCustom = (id, e) => {
    e?.stopPropagation?.();
    saveCustomTemplates(customTemplates.filter((t) => t.id !== id));
  };

  const allAvailableTemplates = useMemo(() => FOOD_GROUPS.flatMap((g) => g.templates), []);
  const filteredBySearch = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    if (!q) return allAvailableTemplates;
    return allAvailableTemplates.filter((t) => {
      const nameMatch = t.name && t.name.toLowerCase().includes(q);
      const ingMatch = (t.ingredients || []).some((i) => {
        const s = typeof i === 'object' && i && 'ingredient' in i ? i.ingredient : String(i);
        return s.toLowerCase().includes(q);
      });
      const procMatch = (t.processes || []).some((p) => {
        const s = typeof p === 'object' && p && 'process' in p ? p.process : String(p);
        return s.toLowerCase().includes(q);
      });
      return nameMatch || ingMatch || procMatch;
    });
  }, [templateSearch, allAvailableTemplates]);

  const toggleAccordion = (groupId) => {
    setAccordionOpen((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <div className="container">
      <InstructionalCarousel pageId="add-products" slides={ADD_PRODUCTS_CAROUSEL_SLIDES} newUserOnly={false} />
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
                      name={t.name}
                      ingredients={t.ingredients}
                      processes={t.processes}
                      quantity={t.quantity}
                      onEdit={() => openEditCustom(t)}
                      onDelete={(e) => handleDeleteCustom(t.id, e)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Available Product Templates - accordion by food group */}
          <section className="templates-section">
            <div className="templates-section-header">
              <h2 className="descriptor-medium">CarbonX Product Templates</h2>
              <div className="input-base search-bar add-products-search" style={{ width: '30%' }}>
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="template-accordion">
              {[...FOOD_GROUPS]
                .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
                .map((group) => {
                const isOpen = accordionOpen[group.id];
                const groupTemplates = group.templates.filter((t) =>
                  filteredBySearch.some((f) => f.id === t.id)
                );
                if (templateSearch.trim() && groupTemplates.length === 0) return null;
                const rawTemplates = templateSearch.trim() ? groupTemplates : group.templates;
                const templatesToShow = [...rawTemplates].sort((a, b) =>
                  (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
                );
                return (
                  <div key={group.id} className="template-accordion-item">
                    <button
                      type="button"
                      className="template-accordion-trigger"
                      onClick={() => toggleAccordion(group.id)}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <span className="template-accordion-label">{group.label}</span>
                    </button>
                    {isOpen && (
                      <div className="template-cards-grid">
                        {templatesToShow.map((t) => (
                          <TemplateCard
                            key={t.id}
                            name={t.name}
                            ingredients={t.ingredients}
                            processes={t.processes}
                            quantity={t.quantity}
                            onAdd={() => addToCustom(t)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Raw materials: 16 from backend only, weight-only templates */}
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
