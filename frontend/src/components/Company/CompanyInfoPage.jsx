// frontend/src/components/Company/CompanyInfoPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CompanyInfoPage.css';
import Lottie from 'lottie-react';
import animationData from '../../lottie/logo.json';
import { useCompanyForm } from '../../hooks/useCompanyForm';
import CompanyForm from '../../components/Company/CompanyForm';

// --- DELETE METRIC_CONFIG entirely from here! --- 

const CompanyInfoPage = () => {
  const { form, handleChange } = useCompanyForm();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isFormComplete = Object.values(form).every(val => val && val.trim().length > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Missing user id! Please sign up again.');
      return;
    }
    setError('');

    const payload = { ...form, userId };

    try {
      const res = await fetch('http://localhost:8080/api/company-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // 1. Get the REAL data calculated by the backend
        const savedData = await res.json(); 

        // 2. Save Company Info locally
        const allCompanyData = JSON.parse(localStorage.getItem('companyData')) || {};
        allCompanyData[userId] = form;
        localStorage.setItem('companyData', JSON.stringify(allCompanyData));

        // 3. Save the METRICS returned by the backend
        // We trust the backend completely now.
        const allMetricsData = JSON.parse(localStorage.getItem('metricsData_v2')) || {};
        const userMetrics = allMetricsData[userId] || {}; 
        
        // USE THE RESPONSE FROM JAVA
        userMetrics.metricList = savedData.activeMetrics; 
        
        allMetricsData[userId] = userMetrics;
        localStorage.setItem('metricsData_v2', JSON.stringify(allMetricsData));

        navigate('/inventory');
      } else {
        const msg = await res.text();
        setError('Submission failed!\n' + msg);
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to server');
    }
  };

  return (
    <div className="container">
      <div className="content-section">
        <div className="logo-animation">
          <Lottie animationData={animationData} style={{ height: 48, width: 48 }} />
        </div>
        <div className="content-container">
          <div className="header-group">
            <h1>Let us understand you better.</h1>
            <p className="medium-regular">Tell us about your company so we can tailor our services to meet your needs.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', gap: '2rem'}}>
              <div className="form-content">
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