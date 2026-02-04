import React, { useState, useEffect } from 'react';
import './BillingHistory.css'; // We'll create this CSS file

const BillingHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId') || 'guest';
    const history = JSON.parse(localStorage.getItem(`billingHistory_${userId}`)) || [];
    setInvoices(history);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="form"><p>Loading history...</p></div>;
  }

  return (
    <div className="form">
      <div className="sub-header">
        <div className="header-col">
          <p className='descriptor-medium'>Transactions</p>
        </div>
      </div>

      <div className="billing-history-table">
        {/* --- Table Header --- */}
        <div className="history-table-header">
          <div className="history-table-cell">Date</div>
          <div className="history-table-cell">Amount</div>
          <div className="history-table-cell">Product</div>
          <div className="history-table-cell">Status</div>
          <div className="history-table-cell">Invoice #</div>
        </div>

        {/* --- Table Body --- */}
        {invoices.length === 0 ? (
          <div className="history-table-empty">
            <p>You do not have any transactions</p>
          </div>
        ) : (
          invoices.map((invoice, index) => (
            <div className="history-table-row" key={index}>
              <div className="history-table-cell" data-label="Date">{invoice.date}</div>
              <div className="history-table-cell" data-label="Amount">${invoice.amount}</div>
              <div className="history-table-cell" data-label="Product">{invoice.product}</div>
              <div className="history-table-cell" data-label="Status">
                <span className="status-pill">{invoice.status}</span>
              </div>
              <div className="history-table-cell" data-label="Invoice #">{invoice.id}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BillingHistory;