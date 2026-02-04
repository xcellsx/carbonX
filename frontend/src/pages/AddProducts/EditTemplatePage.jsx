import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import ErrorModal from '../../components/ErrorModal/ErrorModal';
import './EditTemplatePage.css';

const STORAGE_KEY = 'carbonx-custom-templates';

function getStoredTemplates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveStoredTemplates(templates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

const WEIGHT_SI_UNITS = ['kg', 'g', 'mg', 'µg', 't'];
const TIME_SI_UNITS = ['s', 'min', 'h', 'd'];

// Canonical: kg (weight), seconds (duration). Used for unit conversion.
const WEIGHT_TO_KG = { kg: 1, g: 0.001, mg: 1e-6, µg: 1e-9, t: 1000 };
const TIME_TO_S = { s: 1, min: 60, h: 3600, d: 86400 };

function toCanonicalWeight(displayNum, unit) {
  const factor = WEIGHT_TO_KG[unit] ?? 1;
  const n = Number(displayNum);
  return Number.isNaN(n) ? 0 : n * factor;
}

function fromCanonicalWeight(canonicalKg, unit) {
  const factor = WEIGHT_TO_KG[unit] ?? 1;
  if (canonicalKg == null || Number.isNaN(canonicalKg)) return '';
  const v = canonicalKg / factor;
  return v === Math.floor(v) ? String(v) : String(Number(v.toFixed(6)));
}

function toCanonicalTime(displayNum, unit) {
  const factor = TIME_TO_S[unit] ?? 1;
  const n = Number(displayNum);
  return Number.isNaN(n) ? 0 : n * factor;
}

function fromCanonicalTime(canonicalSec, unit) {
  const factor = TIME_TO_S[unit] ?? 1;
  if (canonicalSec == null || Number.isNaN(canonicalSec)) return '';
  const v = canonicalSec / factor;
  return v === Math.floor(v) ? String(v) : String(Number(v.toFixed(6)));
}

/** Normalize to { ingredient, weight, weightUnit }[] */
function normalizeIngredients(val) {
  if (!Array.isArray(val)) return [];
  return val.map((item) => {
    if (typeof item === 'object' && item && 'ingredient' in item) {
      const unit = String(item.weightUnit ?? 'kg').trim();
      return {
        ingredient: String(item.ingredient ?? ''),
        weight: String(item.weight ?? ''),
        weightUnit: WEIGHT_SI_UNITS.includes(unit) ? unit : 'kg',
      };
    }
    return { ingredient: String(item), weight: '', weightUnit: 'kg' };
  });
}

/** Normalize to { process, description (duration value), timeUnit }[] */
function normalizeProcesses(val) {
  if (!Array.isArray(val)) return [];
  return val.map((item) => {
    if (typeof item === 'object' && item && 'process' in item) {
      const unit = String(item.timeUnit ?? 's').trim();
      return {
        process: String(item.process ?? ''),
        description: String(item.description ?? ''),
        timeUnit: TIME_SI_UNITS.includes(unit) ? unit : 's',
      };
    }
    return { process: String(item), description: '', timeUnit: 's' };
  });
}

const EditTemplatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = id === 'new';

  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [errorModal, setErrorModal] = useState({ open: false, message: '' });

  useEffect(() => {
    if (isNew) {
      const toCopy = location.state?.templateToCopy;
      if (toCopy) {
        setProductName(toCopy.name || '');
        setQuantity(toCopy.quantity != null && toCopy.quantity !== '' ? String(toCopy.quantity) : '');
        setIngredients(normalizeIngredients(toCopy.ingredients));
        setProcesses(normalizeProcesses(toCopy.processes));
      } else {
        setProductName('New template');
        setQuantity('');
        setIngredients([]);
        setProcesses([]);
      }
      return;
    }
    const list = getStoredTemplates();
    const template = list.find((t) => t.id === id);
    if (template) {
      setProductName(template.name || '');
      setQuantity(template.quantity != null && template.quantity !== '' ? String(template.quantity) : '');
      setIngredients(normalizeIngredients(template.ingredients));
      setProcesses(normalizeProcesses(template.processes));
    } else {
      setProductName('');
      setQuantity('');
      setIngredients([]);
      setProcesses([]);
    }
  }, [id, isNew, location.state?.templateToCopy]);

  const addIngredient = () => {
    setIngredients((prev) => [...prev, { ingredient: '', weight: '', weightUnit: 'kg' }]);
  };

  const updateIngredient = (index, field, value) => {
    setIngredients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeIngredient = (index) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const addProcess = () => {
    setProcesses((prev) => [...prev, { process: '', description: '', timeUnit: 's' }]);
  };

  const updateProcess = (index, field, value) => {
    setProcesses((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeProcess = (index) => {
    setProcesses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleWeightUnitChange = (index, newUnit) => {
    const row = ingredients[index];
    if (!row) return;
    const canonical = toCanonicalWeight(parseFloat(row.weight) || 0, row.weightUnit ?? 'kg');
    const newDisplay = fromCanonicalWeight(canonical, newUnit);
    setIngredients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], weight: newDisplay, weightUnit: newUnit };
      return next;
    });
  };

  const handleTimeUnitChange = (index, newUnit) => {
    const row = processes[index];
    if (!row) return;
    const canonical = toCanonicalTime(parseFloat(row.description) || 0, row.timeUnit ?? 's');
    const newDisplay = fromCanonicalTime(canonical, newUnit);
    setProcesses((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], description: newDisplay, timeUnit: newUnit };
      return next;
    });
  };

  const handleSave = () => {
    const name = (productName || '').trim();
    const validIngredients = ingredients.filter((r) => (r.ingredient || '').trim());
    const validProcesses = processes.filter((r) => (r.process || '').trim());

    if (!name) {
      setErrorModal({ open: true, message: 'Please enter a product name.' });
      return;
    }
    if (validIngredients.length === 0) {
      setErrorModal({ open: true, message: 'Please add at least one element with a name.' });
      return;
    }
    if (validProcesses.length === 0) {
      setErrorModal({ open: true, message: 'Please add at least one process with a name.' });
      return;
    }

    const list = getStoredTemplates();
    const payload = {
      id: isNew ? `custom-${Date.now()}` : id,
      name,
      quantity: quantity.trim() === '' ? undefined : (Number(quantity) || quantity.trim()),
      ingredients: validIngredients,
      processes: validProcesses,
    };

    if (isNew) {
      saveStoredTemplates([...list, payload]);
    } else {
      const idx = list.findIndex((t) => t.id === id);
      if (idx >= 0) {
        const next = [...list];
        next[idx] = payload;
        saveStoredTemplates(next);
      } else {
        saveStoredTemplates([...list, payload]);
      }
    }
    navigate('/add-products');
  };

  return (
    <div className="container">
      <Navbar />
      <div className="content-section-main">
        <div className="content-container-main">
          <div className="header-group">
            <h1>Edit Template</h1>
            <p className="medium-regular">Edit the Template to Customize to Your Products.</p>
          </div>

          <div className="edit-template-field edit-template-name-row">
            <div className="edit-template-field-group">
              <label className="edit-template-label">Product Name:</label>
              <input
                type="text"
                className="input-base edit-template-name-input"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Aglio Olio"
              />
            </div>
            <div className="edit-template-field-group">
              <label className="edit-template-label">Quantity:</label>
              <input
                type="number"
                className="input-base"
                min={0}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 1"
              />
            </div>
          </div>

          <section className="edit-template-section">
            <div className="edit-template-section-header">
              <label className="edit-template-label">Elements:</label>
              <button type="button" className="edit-template-add-btn" onClick={addIngredient} title="Add element">
                <Plus size={18} />
              </button>
            </div>
            <div className="edit-template-table-wrap">
              <table className="edit-template-table edit-template-table-elements">
                <colgroup>
                  <col className="edit-template-col-name" />
                  <col className="edit-template-col-amount" />
                  <col className="edit-template-col-unit" />
                  <col className="edit-template-col-action" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Element</th>
                    <th>Weight</th>
                    <th>Weight SI units</th>
                    <th className="edit-template-th-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="edit-template-empty-row">
                        No elements. Click + to add.
                      </td>
                    </tr>
                  ) : (
                    ingredients.map((row, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            type="text"
                            className="input-base edit-template-cell-input"
                            value={row.ingredient}
                            onChange={(e) => updateIngredient(i, 'ingredient', e.target.value)}
                            placeholder="e.g. Spaghetti"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input-base edit-template-cell-input"
                            value={row.weight}
                            onChange={(e) => updateIngredient(i, 'weight', e.target.value)}
                            placeholder="e.g. 1000"
                          />
                        </td>
                        <td>
                          <select
                            className="input-base edit-template-cell-input"
                            value={row.weightUnit ?? 'kg'}
                            onChange={(e) => handleWeightUnitChange(i, e.target.value)}
                            aria-label="Weight unit"
                          >
                            {WEIGHT_SI_UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </td>
                        <td className="edit-template-td-action">
                          <button
                            type="button"
                            className="default"
                            style={{ backgroundColor: 'rgba(var(--danger), 1)', padding: '0.5rem 1rem' }}
                            onClick={() => removeIngredient(i)}
                            title="Remove row"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="edit-template-section">
            <div className="edit-template-section-header">
              <label className="edit-template-label">Processes:</label>
              <button type="button" className="edit-template-add-btn" onClick={addProcess} title="Add process">
                <Plus size={18} />
              </button>
            </div>
            <div className="edit-template-table-wrap">
              <table className="edit-template-table edit-template-table-processes">
                <colgroup>
                  <col className="edit-template-col-name" />
                  <col className="edit-template-col-amount" />
                  <col className="edit-template-col-unit" />
                  <col className="edit-template-col-action" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Process</th>
                    <th>Duration</th>
                    <th>Time SI units</th>
                    <th className="edit-template-th-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="edit-template-empty-row">
                        No processes. Click + to add.
                      </td>
                    </tr>
                  ) : (
                    processes.map((row, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            type="text"
                            className="input-base edit-template-cell-input"
                            value={row.process}
                            onChange={(e) => updateProcess(i, 'process', e.target.value)}
                            placeholder="e.g. Boiling"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input-base edit-template-cell-input"
                            value={row.description}
                            onChange={(e) => updateProcess(i, 'description', e.target.value)}
                            placeholder="e.g. 10"
                          />
                        </td>
                        <td>
                          <select
                            className="input-base edit-template-cell-input"
                            value={row.timeUnit ?? 's'}
                            onChange={(e) => handleTimeUnitChange(i, e.target.value)}
                            aria-label="Time unit"
                          >
                            {TIME_SI_UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </td>
                        <td className="edit-template-td-action">
                          <button
                            type="button"
                            className="default"
                            style={{ backgroundColor: 'rgba(var(--danger), 1)', padding: '0.5rem 1rem' }}
                            onClick={() => removeProcess(i)}
                            title="Remove row"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="edit-template-actions">
            <button type="button" className="edit-template-btn edit-template-cancel" onClick={() => navigate('/add-products')}>
              Cancel
            </button>
            <button type="button" className="edit-template-btn edit-template-save" onClick={handleSave}>
              Save Template
            </button>
          </div>
        </div>
      </div>

      <ErrorModal
        isOpen={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: '' })}
        title="Please complete all fields"
      >
        {errorModal.message}
      </ErrorModal>
    </div>
  );
};

export default EditTemplatePage;
