import React from 'react';
import { X } from 'lucide-react';
import './DppModal.css';

/**
 * Reusable modal for displaying Digital Product Passport (DPP) or any pre-formatted text content.
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Called when overlay or close button is clicked
 * @param {string} [title='Digital Product Passport (DPP)'] - Modal title
 * @param {React.ReactNode} children - Modal body (e.g. formatted DPP text in a <pre>)
 */
const DppModal = ({ isOpen, onClose, title = 'Digital Product Passport (DPP)', children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content dpp-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '600px', maxWidth: '90%' }}>
        <div className="modal-header">
          <p className="medium-bold">{title}</p>
          <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <pre className="dpp-modal-pre">{children}</pre>
      </div>
    </div>
  );
};

export default DppModal;
