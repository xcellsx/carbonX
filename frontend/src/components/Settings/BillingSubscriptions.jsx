import React, { useState, useEffect } from 'react';
import { Check, Info, X } from 'lucide-react'; // --- NEW: Added X ---
import './BillingSubscriptions.css'; 

const
  isDifferent = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

// --- NEW: Reusable Confirmation Modal ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
// ... (modal component is unchanged) ...
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <p className="medium-bold">{title}</p>
          <button className="close-modal-btn" onClick={onClose}><X /></button>
        </div>
        <div className="normal-regular" style={{ padding: '1rem 0' }}>
          {children}
        </div>
        <div className="confirm-modal-buttons button-modal">
          <button className="default secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="default" onClick={onConfirm}>
            Switch Plan
          </button>
        </div>
      </div>
    </div>
  );
};


const BillingSubscriptions = ({ onPlanSave }) => {
  // --- Mock Data ---
// ... (state setup is unchanged) ...
  const userId = localStorage.getItem('userId') || 'guest';
  const initialUserBillingData = JSON.parse(localStorage.getItem(`billing_${userId}`)) || {
    plan: 'basic',
    nameOnCard: '',
    cardNumber: '',
    cvv: '',
    cardExpiry: '',
    billingAddress: '',
    postalCode: '',
    country: '',
  };

  const [billingInfo, setBillingInfo] = useState(initialUserBillingData);
  const [initialBillingInfo, setInitialBillingInfo] = useState(initialUserBillingData);
  const [saveMessage, setSaveMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [savedPlan, setSavedPlan] = useState(initialUserBillingData.plan);
  const [isAnnual, setIsAnnual] = useState(false);

  // --- NEW: State for modal and payment info ---
  const [hasPaymentInfo, setHasPaymentInfo] = useState(
    initialUserBillingData.nameOnCard.trim() !== ''
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [targetPlan, setTargetPlan] = useState(null); // Which plan to switch to

  const plans = [
    // ... (plans array is unchanged) ...
// ... (plan data is unchanged) ...
    {
      id: 'basic',
      name: 'CarbonX Basic',
      price: '0.00',
      term: '/month',
      subtext: 'Free Plan',
      subtextClass: 'plan-subtext-default',
      features: [
        'Access to Core Features',
        'Overview of Metrics',
        'In-depth Breakdown of Metrics',
        'Unlimited LCA Calculations',
        'Team size limited to 1',
      ],
      buttonText: 'Select Basic Plan',
    },
    {
      id: 'pro',
      name: 'CarbonX Pro',
      price: '833.33',
      annualPrice: '10000.00',
      term: '/month',
      subtext: 'Save 10% by paying annually',
      subtextClass: 'plan-save-info large-bold',
      features: [
        'Cloud Hosting',
        'Access to Additional Features',
        'Unlimited access to Marketplace',
        'Increase your team size to 5',
        'IT Support',
      ],
      buttonText: 'Get CarbonX Pro',
    },
    {
      id: 'enterprise',
      name: 'CarbonX Enterprise',
      price: 'Custom',
      term: '/month',
      subtext: 'Quotations based',
      subtextClass: 'plan-subtext-default',
      features: [
        'Cloud Hosting',
        'Access to Additional Features',
        'Unlimited access to Marketplace',
        'Increase your team size to more than 10',
        'IT Support',
      ],
      buttonText: 'Contact Us',
    },
  ];

  const isBillingInfoDirty = isDifferent(initialBillingInfo, billingInfo);
  const selectedPlanDetails = plans.find(p => p.id === billingInfo.plan);

  const handleBillingInfoChange = (e) => {
// ... (function is unchanged) ...
    if (saveMessage) setSaveMessage('');
    if (formError) setFormError('');
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
  };

  // --- UPDATED: handleSelectPlan now shows modal ---
  const handleSelectPlan = (planId) => {
// ... (function is unchanged) ...
    if (planId === savedPlan) return; // Clicked current plan

    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@carbonx.com?subject=CarbonX Enterprise Inquiry';
      return;
    }
    
    // If user has payment info, show modal. Otherwise, switch immediately.
    if (hasPaymentInfo) {
      setTargetPlan(planId); // Store which plan they want to switch to
      setShowConfirmModal(true);
    } else {
      // First-time user selecting a plan
      setBillingInfo(prev => ({ ...prev, plan: planId }));
      if (planId === 'pro') setIsAnnual(true);
    }
  };

  // --- NEW: Function to handle the modal confirmation ---
  const handleConfirmPlanSwitch = () => {
// ... (function is unchanged) ...
    const planId = targetPlan;
    if (!planId) return;

    setBillingInfo(prev => ({ ...prev, plan: planId }));
    if (planId === 'pro') setIsAnnual(true);
    
    // This makes the OLD "Current Plan" button disappear
    // and enables the "Save" button
    setSavedPlan(null); 
    
    setShowConfirmModal(false);
    setTargetPlan(null);
  };

  const handleSaveBillingInfo = (e) => {
// ... (function is unchanged) ...
    e.preventDefault();
    setSaveMessage('');
    setFormError('');

    // --- (Validation logic is unchanged) ---
    if (billingInfo.plan === 'pro' && !hasPaymentInfo) { // Only validate if new pro
      const requiredFields = [
        'nameOnCard', 'cardNumber', 'cvv', 'cardExpiry', 
        'billingAddress', 'postalCode', 'country'
      ];
      
      const unfilledFields = requiredFields.filter(field => !billingInfo[field] || billingInfo[field].trim() === '');
      
      if (unfilledFields.length > 0) {
        setFormError('Please fill in all billing information fields to upgrade to Pro.');
        return;
      }
    }

    console.log("Saving billing information:", billingInfo, "Annual:", isAnnual);
    
    localStorage.setItem(`billing_${userId}`, JSON.stringify(billingInfo));
    
    const isPro = billingInfo.plan === 'pro';
    localStorage.setItem('isProUser', isPro ? 'true' : 'false');

    if (isPro) {
      onPlanSave(); 

      // --- Create an invoice (unchanged) ---
      const history = JSON.parse(localStorage.getItem(`billingHistory_${userId}`)) || [];
      const newInvoice = {
        id: `#00${history.length + 1}`,
        date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        product: `CarbonX Pro (${isAnnual ? 'Annually' : 'Monthly'})`,
        amount: isAnnual ? selectedPlanDetails.annualPrice : selectedPlanDetails.price,
        status: 'Paid',
      };
      history.push(newInvoice);
      localStorage.setItem(`billingHistory_${userId}`, JSON.stringify(history));
    }

    setInitialBillingInfo(billingInfo);
    setSavedPlan(billingInfo.plan);
    setHasPaymentInfo(true); // --- NEW: Mark user as having payment info ---
    setSaveMessage('Billing information saved successfully!');
  };

  return (
    <div className="form">
      
      <div className="sub-header">
        <div className="header-col">
          <p className='descriptor-medium'>CarbonX Subscription Plans</p>
        </div>
      </div>

      <div className="subscription-plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card ${billingInfo.plan === plan.id ? 'current-plan' : ''}`}>
            <div className="plan-header">
              {/* ... (header content unchanged) ... */}
              <span className="normal-bold">{plan.name}</span>
              <div className="plan-amounts">
                {plan.price === 'Custom' ? (
                  <h2>{plan.price}</h2>
                ) : (
                  <h2>${plan.price}</h2>
                )}
                <span className="normal-regular">{plan.term}</span>
              </div>
              
              {plan.subtext && (
                <p className={`large-bold ${plan.subtextClass}`}>
                  {plan.subtext}
                </p>
              )}
            </div>
            
            <ul className="plan-features">
              {/* ... (features list unchanged) ... */}
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <Check size={16} className="plan-feature-icon" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            {/* --- UPDATED: Button Rendering Logic --- */}
            <div className="plan-actions">
              {savedPlan === plan.id ? (
                // 1. SAVED PLAN
                <button
                  type="button"
                  className="default"
                  disabled
                >
                  Current Plan
                </button>
              ) : (
                // 2. NOT THE SAVED PLAN
                <button
                  type="button"
                  className={`default ${billingInfo.plan === plan.id ? 'active' : ''}`}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {/* --- FIXED: This text is no longer dynamic --- */}
                  {plan.buttonText}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- Billing Information --- */}
      <div className="sub-header">
        <div className="header-col">
          <p className='descriptor-medium'>Billing Information</p>
        </div>
      </div>

      <div className="billing-layout-grid">
        
        <form onSubmit={handleSaveBillingInfo} className="billing-form-col">
          <div className="input-group-row">
            <div className="input-group-col">
              <label className="normal-bold" htmlFor="nameOnCard">Name on Card</label>
              <input className="input-base" type="text" id="nameOnCard" name="nameOnCard" value={billingInfo.nameOnCard} onChange={handleBillingInfoChange} placeholder="John Doe" />
            </div>
            <div className="input-group-col">
              <label className="normal-bold" htmlFor="cardNumber">Card Number</label>
              <input className="input-base" type="text" id="cardNumber" name="cardNumber" value={billingInfo.cardNumber} onChange={handleBillingInfoChange} placeholder="XXXX XXXX XXXX XXXX" maxLength="19" />
            </div>
          </div>
          <div className="input-group-row">
            <div className="input-group-col">
              <label className="normal-bold" htmlFor="cvv">CVV</label>
              <input className="input-base" type="text" id="cvv" name="cvv" value={billingInfo.cvv} onChange={handleBillingInfoChange} placeholder="XXX" maxLength="4" />
            </div>
            <div className="input-group-col">
              <label className="normal-bold" htmlFor="cardExpiry">Card Expiry</label>
              <input className="input-base" type="text" id="cardExpiry" name="cardExpiry" value={billingInfo.cardExpiry} onChange={handleBillingInfoChange} placeholder="MM/YY (Eg. 10/30)" maxLength="5" />
            </div>
          </div>
          <div className="input-group-col" style={{ marginBottom: '1rem' }}>
            <label className="normal-bold" htmlFor="billingAddress">Billing Address</label>
            <input className="input-base" type="text" id="billingAddress" name="billingAddress" value={billingInfo.billingAddress} onChange={handleBillingInfoChange} placeholder="Address" />
          </div>
          <div className="input-group-row">
            <div className="input-group-col">
              <label className="normal-bold" htmlFor="postalCode">Postal Code</label>
              <input className="input-base" type="text" id="postalCode" name="postalCode" value={billingInfo.postalCode} onChange={handleBillingInfoChange} placeholder="XXXXXX" />
            </div>
            <div className="input-group-col">
              <label className="normal-bold" htmlFor="country">Country</label>
              <input className="input-base" type="text" id="country" name="country" value={billingInfo.country} onChange={handleBillingInfoChange} placeholder="Country" />
            </div>
          </div>

          <div style={{ flexGrow: 1 }}></div>

          {formError && (
            <div className="submit-error" style={{ marginTop: '1rem' }}>
              {formError}
            </div>
          )}
          {saveMessage && (
            <div className="submit-success" style={{ marginTop: '1rem' }}>
              {saveMessage}
            </div>
          )}
          {/* --- THIS IS THE UPDATED BUTTON --- */}
          <button
            type="submit"
            className="default" 
            style={{ marginTop: '1rem', width: '100%' }}
            disabled={!isBillingInfoDirty && savedPlan === billingInfo.plan}
          >
            {/* If plan has changed, show "Change Plan", otherwise "Save" */}
            {savedPlan !== billingInfo.plan
              ? "Change Plan"
              : "Save Billing Information"
            }
          </button>
        </form>

        {/* --- PAYMENT SUMMARY: (Unchanged) --- */}
        {billingInfo.plan === 'pro' && savedPlan !== 'pro' && (
// ... (rest of JSX is unchanged) ...
          <div className="payment-summary-col">
            <div className="payment-summary-card">
              <div className="payment-toggle-group">
                <span className={!isAnnual ? 'normal-bold' : 'normal-regular'}>Monthly</span>
                <label className="switch">
                  <input type="checkbox" checked={isAnnual} onChange={() => setIsAnnual(!isAnnual)} />
                  <span className="slider round"></span>
                </label>
                <span className={isAnnual ? 'normal-bold' : 'normal-regular'}>Annually</span>
              </div>

              <div className="payment-summary-details">
                <p className="normal-bold">Payment for</p>
                <p className="large-bold" style={{ margin: '0.25rem 0' }}>CarbonX Pro</p>
                
                {isAnnual && (
                  <p className="plan-save-info" style={{ margin: '0 0 1rem 0' }}>
                    Save 10% by paying annually
                  </p>
                )}
                
                <h2 className="payment-summary-price">
                  {isAnnual ? (
                    <>
                      ${selectedPlanDetails.annualPrice}
                      <span className="normal-regular">/year</span>
                    </>
                  ) : (
                    <>
                      ${selectedPlanDetails.price}
                      <span className="normal-regular">/month</span>
                    </>
                  )}
                </h2>
                
                <p className="small-regular payment-summary-footer">
                  Please check your card information before paying. Your payment confirmation will be sent to your email.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- NEW: Render the Confirmation Modal --- */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Confirm Plan Switch"
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmPlanSwitch}
      >
        Are you sure you want to switch to the 
        <strong style={{ color: 'rgba(var(--primary), 1)' }}>
          {/* Find the name of the plan they're switching to */}
          &nbsp;{plans.find(p => p.id === targetPlan)?.name}&nbsp;
        </strong>
        plan?
      </ConfirmationModal>
    </div>
  );
};

export default BillingSubscriptions;