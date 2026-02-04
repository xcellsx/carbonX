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
 * quantity: optional main product quantity (you can add editing in Edit Template later)
 */
const TemplateCard = ({ name, ingredients = [], processes = [], quantity, onEdit, onAdd, onDelete }) => {
  const ingList = Array.isArray(ingredients) ? ingredients : [];
  const procList = Array.isArray(processes) ? processes : [];
  const elements = ingList.map(elementName).filter(Boolean);
  const processNamesList = procList.map(processName).filter(Boolean);

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
      {quantity != null && quantity !== '' && (
        <p className="template-card-meta">
          <strong>Quantity:</strong> {quantity}
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
    </div>
  );
};

export default TemplateCard;
