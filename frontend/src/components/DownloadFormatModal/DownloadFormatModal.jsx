import React from 'react';
import { X, FileText, Download } from 'lucide-react';
import './DownloadFormatModal.css';

/**
 * Modal to choose download format (PDF or DOCX) for a report.
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Called when overlay or Cancel is clicked
 * @param {function} onSelectPdf - Called when user chooses PDF
 * @param {function} onSelectDocx - Called when user chooses DOCX
 * @param {string} [reportName] - Optional report name to show in the prompt
 */
const DownloadFormatModal = ({
  isOpen,
  onClose,
  onSelectPdf,
  onSelectDocx,
  reportName,
}) => {
  if (!isOpen) return null;

  const handlePdf = () => {
    onSelectPdf();
    onClose();
  };

  const handleDocx = () => {
    onSelectDocx();
    onClose();
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="download-format-modal-content modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <p className="medium-bold">Download report</p>
          <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <div className="download-format-modal-body">
          <p className="normal-regular">
            {reportName ? `Choose a format for "${reportName}"` : 'Choose download format'}
          </p>
          <div className="download-format-options">
            <button
              type="button"
              className="download-format-option"
              onClick={handlePdf}
              aria-label="Download as PDF"
            >
              <Download size={24} />
              <span>PDF</span>
            </button>
            <button
              type="button"
              className="download-format-option"
              onClick={handleDocx}
              aria-label="Download as Word document"
            >
              <FileText size={24} />
              <span>DOCX</span>
            </button>
          </div>
        </div>
        <div className="confirm-modal-buttons button-modal">
          <button type="button" className="default" style={{ padding: '0.5rem 1rem' }} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadFormatModal;
