import React from 'react';
import { X } from 'lucide-react';

/**
 * Reusable confirmation modal.
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Called when overlay or Cancel is clicked
 * @param {function} onConfirm - Called when the confirm button is clicked
 * @param {string} title - Modal title
 * @param {string} [confirmLabel='Confirm'] - Confirm button text (e.g. 'Delete', 'Confirm')
 * @param {string} [cancelLabel='Cancel'] - Cancel button text
 * @param {string} [confirmVariant='danger'] - 'danger' (red) or 'primary' for confirm button
 * @param {React.ReactNode} children - Modal body (message/content)
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  children,
}) => {
  if (!isOpen) return null;

  const confirmStyle =
    confirmVariant === 'danger'
      ? { backgroundColor: 'rgba(var(--danger), 1)', padding: '0.5rem 1rem' }
      : { padding: '0.5rem 1rem' };

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
        <div className="confirm-modal-buttons button-modal">
          <button type="button" className="default" style={{ padding: '0.5rem 1rem' }} onClick={onClose}>
            {cancelLabel}
          </button>
          <button type="button" className="default" style={confirmStyle} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
