import React, { useState, useEffect } from 'react'; // 1. Imported useEffect
import { Link, useNavigate } from 'react-router-dom';
import './CompanyInfoPage.css';
import Lottie from 'lottie-react';
import animationData from '../../lottie/logo.json';
import { ChevronDown } from 'lucide-react';

const CompanyInfoPage = () => {
  const [form, setForm] = useState({
    companyName: '',
    sector: '',
    industry: '',
    headquarters: '',
    reportingYear: ''
  });

  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    
    if (currentUserId) {
      const allCompanyData = JSON.parse(localStorage.getItem('companyData')) || {};
      
      const userCompanyData = allCompanyData[currentUserId];
      
      if (userCompanyData) {
        setForm(userCompanyData);
      }
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isFormComplete = Object.values(form).every(val => val && val.trim().length > 0);

  const handleSubmit = (e) => {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Missing user id! Please sign up again.');
      return;
    }

    setError('');
    
    const allCompanyData = JSON.parse(localStorage.getItem('companyData')) || {};

    allCompanyData[userId] = form;

    localStorage.setItem('companyData', JSON.stringify(allCompanyData));

    navigate('/inventory');
  };

  return (
    <div className = "onboarding-container">
        <div className = "logo-animation">
          <Lottie animationData={animationData} style={{ height: 48, width: 48 }} />
        </div>
      <div className = "content-container">
          <div className = "form-header">
            <h1>Let us understand you better.</h1>
            <p className="medium-regular">Tell us about your company so we can tailor our services to meet your needs.</p>
          </div>
          {/* 6. Added noValidate to let our 'isFormComplete' handle validation */}
          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className = "content">
              <div className="form-row">
                <div className="group">
                  <label className = "normal-bold">Company Name <span className='submit-error'>*</span></label>
                  <input className="input-base" name="companyName" value={form.companyName} placeholder = "Company Name" onChange={handleChange}/>
                </div>
                <div className="group">
                  <label className="normal-bold">Sector <span className='submit-error'>*</span></label>
                  <div className="select-wrapper">
                    <select className="input-base" name="sector" id="sector" value={form.sector} onChange={handleChange} required >
                      <option value="">Select Sector</option>
                      <option value="Agriculture">Agriculture</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Technology">Technology</option>
                      <option value="Food & Beverages">Food & Beverages</option>
                    </select>
                    <ChevronDown className="select-arrow" />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="group">
                  <label className='normal-bold' htmlFor="industry">Industry <span className='submit-error'>*</span></label>
                  <div className="select-wrapper">
                    <select className="input-base" name="industry" id="industry" value={form.industry} onChange={handleChange}required>
                      <option value="">Select industry</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Retail">Retail</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Agricultural Products">Agricultural Products</option>
                    </select>
                    <ChevronDown className="select-arrow" />
                  </div>
                </div>
                <div className="group">
                  <label className="normal-bold" htmlFor="headquarters">Headquarters</label>
                  <div className="select-wrapper">
                    <select className="input-base" name="headquarters" id="headquarters" value={form.headquarters} onChange={handleChange}required >
                      <option value="">Select headquarters</option>
                      <option value="USA">USA</option>
                      <option value="Singapore">Singapore</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="Japan">Japan</option>
                    </select>
                    <ChevronDown className="select-arrow" />
                  </div>
                </div>
              </div>
              <div className="group">
                <label className = "normal-bold">Reporting Year <span className='submit-error'>*</span></label>
                <span className = "small-regular">Carbon emissions are reported yearly. It’s best practice to align your reporting year with your organization’s financial accounting period.</span>
                <input className = "input-base" name="reportingYear" value={form.reportingYear} placeholder = "MM/YY (Eg. 01/01)" onChange={handleChange} />
                <span className = "small-regular" style = {{color: "#82828280"}}>If you indicated 01/01, your calculation end date will be 31/12.</span>
              </div>
            </div>
            {error && <div className="submit-error">{error}</div>}
          <button className="default" type="submit" disabled={!isFormComplete}>
            Continue
          </button>
          </form>
        </div>
      </div>
  );
};

export default CompanyInfoPage;