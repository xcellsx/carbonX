import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CompanyInfoPage.css';

const CompanyInfoPage = () => {
  const [form, setForm] = useState({
    companyName: '',
    sector: '',
    industry: '',
    subIndustry: '',
    headquarters: '',
    reportingYear: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Check if any field is empty or only whitespace
  const isFormComplete = Object.values(form).every(val => val && val.trim().length > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Missing user id! Please sign up again.');
      return;
    }

    const payload = { ...form, userId };

    try {
      const res = await fetch('http://localhost:8080/api/company-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        navigate('/guide');
      } else {
        const msg = await res.text();
        alert('Submission failed!\n' + msg);
      }
    } catch (err) {
      alert('Error connecting to server');
    }
  };

  return (
    <div className="company-info-page-bg">
      <div className="company-info-back-btn">
        <Link to="/signup">&#8592; Back</Link>
      </div>
      <div className="company-info-logo">
        <img src="src/assets/carbonx.png" alt="Logo" />
      </div>
      <div className="company-info-panel">
        <div className="company-info-title">Let us understand you better.</div>
        <form className="company-info-form" onSubmit={handleSubmit}>
          <div className="company-info-row">
            <div className="company-info-field">
              <label>Company Name</label>
              <input name="companyName" value={form.companyName} onChange={handleChange} />
            </div>
            <div className="company-info-field">
              <label>Sector</label>
              <input name="sector" value={form.sector} onChange={handleChange} />
            </div>
          </div>
          <div className="company-info-row">
            <div className="company-info-field">
              <label>Industry</label>
              <input name="industry" value={form.industry} onChange={handleChange} />
            </div>
            <div className="company-info-field">
              <label>Sub-industry</label>
              <input name="subIndustry" value={form.subIndustry} onChange={handleChange} />
            </div>
          </div>
          <div className="company-info-row">
            <div className="company-info-field" style={{flex: 1}}>
              <label>Headquarters</label>
              <input name="headquarters" value={form.headquarters} onChange={handleChange} />
            </div>
          </div>
          <div className="company-info-row">
            <div className="company-info-field" style={{flex: 1}}>
              <label>Reporting Year</label>
              <span className="company-info-desc">Your reporting year follows your company's financial year.</span>
              <input name="reportingYear" value={form.reportingYear} onChange={handleChange} />
            </div>
          </div>
          <button
            className="company-info-btn"
            type="submit"
            disabled={!isFormComplete}
            style={{ opacity: isFormComplete ? 1 : 0.6, cursor: isFormComplete ? 'pointer' : 'not-allowed' }}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompanyInfoPage;
