import React from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import './TemplateCard.css';

/** Element name only: string or { ingredient, weight } — no weights/units */
function elementName(item) {
  if (item == null) return '';
  if (typeof item === 'object' && 'ingredient' in item) {
    return String(item.ingredient ?? '').trim();
  }
  return String(item);
}

/** Process name only: string or { process, description } — no time/units */
function processName(item) {
  if (item == null) return '';
  if (typeof item === 'object' && 'process' in item) {
    return String(item.process ?? '').trim();
  }
  return String(item);
}

/**
 * Reusable template card for Browse Templates page.
 * ingredients: string[] or { ingredient, weight }[]
 * processes: string[] or { process, description }[]
 * quantity: optional main product quantity.
 * onQuantityChange: optional (templateId, newValue) => void — when provided, quantity is editable inline and saves immediately.
 * weightOnly: when true, show only Weight (quantity + weightUnit), hide Elements/Processes (for raw materials).
 * weightUnit: unit for weight display when weightOnly (e.g. 'kg').
 */
const TemplateCard = ({ templateId, name, ingredients = [], processes = [], quantity, onQuantityChange, weightOnly, weightUnit = 'kg', onEdit, onAdd, onDelete }) => {
  const ingList = Array.isArray(ingredients) ? ingredients : [];
  const procList = Array.isArray(processes) ? processes : [];
  const elements = ingList.map(elementName).filter(Boolean);
  const processNamesList = procList.map(processName).filter(Boolean);
  const displayQ = quantity != null && quantity !== '' ? quantity : '';
  const canEditQuantity = Boolean(onQuantityChange && templateId != null && !weightOnly);

  const handleQuantityChange = (e) => {
    const raw = e.target.value;
    if (onQuantityChange && templateId != null) {
      const num = raw === '' ? undefined : Number(raw);
      const value = raw === '' ? undefined : (Number.isNaN(num) ? raw : num);
      onQuantityChange(templateId, value);
    }
  };
  const handleQuantityBlur = (e) => {
    const raw = (e.target.value || '').toString().trim();
    if (onQuantityChange && templateId != null) {
      const num = raw === '' ? undefined : Number(raw);
      const value = raw === '' ? undefined : (Number.isNaN(num) ? raw : num);
      onQuantityChange(templateId, value);
    }
  };

  return (
    <div className="template-card">
      <div className="template-card-header">
        <span className="template-card-name">{name}</span>
        <div className="template-card-actions">
          {onAdd && (
            <button type="button" className="default" style = {{ padding: '0.5rem 1rem' }} onClick={onAdd} title="Add to Customize your own">
              Add
            </button>
          )}
          {onEdit && (
            <button type="button" className="outline" style = {{ padding: '0.5rem 1rem' }} onClick={onEdit} title="Edit template">
              Edit
            </button>
          )}
          {onDelete && (
            <button type="button" className="default" style={{ backgroundColor: 'rgba(var(--danger), 1)', padding: '0.5rem 1rem' }} onClick={onDelete} title="Remove template">
              Delete
            </button>
          )}
        </div>
      </div>
      {weightOnly ? (
        <p className="template-card-meta">
          <strong>Weight:</strong>{' '}
          {quantity != null && quantity !== '' ? `${quantity} ${weightUnit}` : '—'}
        </p>
      ) : (
        <>
          {/* Always show Quantity row when editable (custom cards); otherwise only when there's a value */}
          {(canEditQuantity || displayQ !== '') && (
            <p className="template-card-meta">
              <strong>Quantity:</strong>{' '}
              {canEditQuantity ? (
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="template-card-quantity-input"
                  value={displayQ}
                  onChange={handleQuantityChange}
                  onBlur={handleQuantityBlur}
                  aria-label="Quantity"
                />
              ) : (
                displayQ
              )}
            </p>
          )}
          <p className="template-card-meta">
            <strong>Elements:</strong>{' '}
            {elements.length ? (
              elements.map((el, i) => (
                <React.Fragment key={i}>
                  {i > 0 && ', '}
                  <span className="ingredient-link">{el}</span>
                </React.Fragment>
              ))
            ) : (
              '—'
            )}
          </p>
          <p className="template-card-meta">
            <strong>Processes:</strong>{' '}
            {processNamesList.length ? processNamesList.join(', ') : '—'}
          </p>
        </>
      )}
    </div>
  );
};

export default TemplateCard;
