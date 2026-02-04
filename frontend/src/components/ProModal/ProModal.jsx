import React from 'react';
import { Sparkles, X, CircleCheck } from 'lucide-react';
import './ProModal.css';

/**
 * Reusable CarbonX Pro upsell modal.
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {() => void} onGoToSettings
 */
const ProModal = ({ isOpen, onClose, onGoToSettings }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content pro-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="close-modal-btn"
          style={{ width: '100%', textAlign: 'right' }}
          onClick={onClose}
          aria-label="Close"
        >
          <X />
        </button>
        <div>
          <Sparkles size={48} color="rgba(var(--secondary), 1)" />
        </div>

        <p className="large-bold">Get CarbonX Pro</p>

        <div className="group-pro-modal">
          <p className="normal-regular">What you will get:</p>
          <ul className="pro-features-list">
            <li>
              <CircleCheck size={20} />
              <span>Cloud Hosting</span>
            </li>
            <li>
              <CircleCheck size={20} />
              <span>Access to Report Generator & AI Functionalities</span>
            </li>
            <li>
              <CircleCheck size={20} />
              <span>Limited access to Marketplace Community</span>
            </li>
            <li>
              <CircleCheck size={20} />
              <span>Increase your team size to 5</span>
            </li>
            <li>
              <CircleCheck size={20} />
              <span>IT Support</span>
            </li>
          </ul>
        </div>

        <button type="button" className="default" style={{ width: '100%' }} onClick={onGoToSettings}>
          Get CarbonX Pro
        </button>
      </div>
    </div>
  );
};

export default ProModal;

