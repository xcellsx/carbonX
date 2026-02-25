import React from 'react';
import { X } from 'lucide-react';
import './DppModal.css';

/**
 * Reusable modal for displaying Digital Product Passport (DPP).
 * Renders children in a scrollable body; supports both plain text and React nodes.
 */
const DppModal = ({ isOpen, onClose, title = 'Digital Product Passport (DPP)', children }) => {
  if (!isOpen) return null;

  const isString = typeof children === 'string';

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content dpp-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '600px', maxWidth: '90%' }}>
        <div className="modal-header">
          <p className="medium-bold">{title}</p>
          <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <div className={`dpp-modal-body ${isString ? 'dpp-modal-body--pre' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DppModal;
