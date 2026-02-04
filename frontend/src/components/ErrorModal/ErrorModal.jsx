import React from 'react';
import { X } from 'lucide-react';

/**
 * Reusable error/validation modal with a single "Go Back" CTA.
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Called when overlay, close button, or "Go Back" is clicked
 * @param {string} title - Modal title (e.g. "Missing information")
 * @param {React.ReactNode} children - Modal body (error message)
 */
const ErrorModal = ({ isOpen, onClose, title = 'Something went wrong', children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <p className="medium-bold">{title}</p>
          <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <div className="normal-regular">{children}</div>
        <div className="confirm-modal-buttons button-modal" style={{ justifyContent: 'center' }}>
          <button type="button" className="default" style={{ padding: '0.5rem 1rem' }} onClick={onClose}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
