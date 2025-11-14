import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CompanyInfoPage.css'; // Make sure you have this CSS file
import Lottie from 'lottie-react';
import animationData from '../../lottie/logo.json'; // Make sure this path is correct
import { ChevronDown } from 'lucide-react';
import { useCompanyForm } from '../../hooks/useCompanyForm'; // Assuming this hook exists
import CompanyForm from '../../components/Company/CompanyForm'; // Make sure this path is correct

// --- 1. UPDATED METRIC CONFIGURATION "DATABASE" ---
const METRIC_CONFIG = {
  'Food & Beverages': {
    'Food Retailers & Distributors': [
      'fleet-fuel-management',
      'energy-management',
      'food-waste-management',
      'data-security',
      'food-safety',
      'product-health-nutrition',
      'product-labelling-marketing',
      'labour-practices',
      'supply-chain-impacts',
      'gmo' // Pro metric
    ],
    // --- Other F&B industries (using old metrics as placeholders) ---
    'Agricultural Products': ['ghg', 'water', 'sourcing', 'impact'],
    'Alcoholic Beverages': ['ghg', 'water', 'sourcing', 'impact'],
    '(Meat, Poultry & Dairy)': ['ghg', 'water', 'sourcing', 'impact'],
    'Non-alcoholic Beverages': ['ghg', 'water', 'sourcing', 'impact'],
    'Processed Foods': ['ghg', 'water', 'sourcing', 'impact'],
    'Restaurants': ['ghg', 'water', 'sourcing', 'impact'],
    'Tobacco': ['ghg', 'water', 'sourcing', 'impact'],
  },
};
// A fallback list if the user's selection isn't in the config
const DEFAULT_METRICS = ['ghg', 'energy', 'water'];


const CompanyInfoPage = () => {
  // Use the reusable hook to manage form state and loading
  const { form, handleChange } = useCompanyForm();
  
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if form is complete
  const isFormComplete = Object.values(form).every(val => val && val.trim().length > 0);

  const handleSubmit = (e) => {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Missing user id! Please sign up again.');
      return;
    }

    setError('');
    
    // --- Part 1: Save Company Info ---
    const allCompanyData = JSON.parse(localStorage.getItem('companyData')) || {};
    allCompanyData[userId] = form;
    localStorage.setItem('companyData', JSON.stringify(allCompanyData));

    // --- Part 2: Determine and Save Metric List ---
    const userSector = form.sector;
    const userIndustry = form.industry;
    let userMetricList = DEFAULT_METRICS; // Use fallback

    if (METRIC_CONFIG[userSector] && METRIC_CONFIG[userSector][userIndustry]) {
      userMetricList = METRIC_CONFIG[userSector][userIndustry];
    }

    const allMetricsData = JSON.parse(localStorage.getItem('metricsData_v2')) || {};
    
    const userMetrics = allMetricsData[userId] || {}; 
    
    userMetrics.metricList = userMetricList; 
    
    allMetricsData[userId] = userMetrics;
    
    localStorage.setItem('metricsData_v2', JSON.stringify(allMetricsData));

    // --- Part 3: Navigate to Inventory (or Dashboard) ---
    // We navigate to Dashboard now, as Inventory might be empty
    navigate('/inventory'); 
  };

  return (
    <div className="container">
      <div className = "content-section">
        <div className = "logo-animation">
          <Lottie animationData={animationData} style={{ height: 48, width: 48 }} />
        </div>
        <div className = "content-container">
          <div className = "header-group">
            <h1>Let us understand you better.</h1>
            <p className="medium-regular">Tell us about your company so we can tailor our services to meet your needs.</p>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', gap: '2rem'}}>
            <div className = "form-content">
              
              {/* --- Render the reusable form component --- */}
              <CompanyForm form={form} handleChange={handleChange} />

            </div>
            {error && <div className="submit-error">{error}</div>}
            <button className="default" type="submit" disabled={!isFormComplete}>
              Continue
            </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoPage;