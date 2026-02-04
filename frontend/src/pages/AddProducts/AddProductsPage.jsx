import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import TemplateCard from '../../components/TemplateCard/TemplateCard';
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

const AddProductsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [templateSearch, setTemplateSearch] = useState('');
  const [accordionOpen, setAccordionOpen] = useState({ pasta: true, bowls: false, soup: false });
  const [customTemplates, setCustomTemplates] = useState(() => getStoredTemplates());

  // Refresh from localStorage when route is Browse Templates
  useEffect(() => {
    if (location.pathname === '/add-products') {
      setCustomTemplates(getStoredTemplates());
    }
  }, [location.pathname]);

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
            </div>
          </section>
        </div>
      </div>

    </div>
  );
};

export default AddProductsPage;
