import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CompanyInfoPage.css';
import Lottie from 'lottie-react';
import animationData from '../../lottie/logo.json';
// import { useCompanyForm } from '../../hooks/useCompanyForm';
import CompanyForm from '../../components/Company/CompanyForm';

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Check if any field is empty or only whitespace
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
        navigate('/guide');
      } else {
        const msg = await res.text();
        setError('Submission failed!\n' + msg);
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  return (
    <div className = "container">
      <div className = "content-section">
        <div className = "logo-animation">
          <Lottie animationData={animationData} style={{ height: 48, width: 48 }} />
        </div>
      <div className = "content-container">
          <div className = "header-group">
            <h1>Let us understand you better.</h1>
            <p className="medium-regular">Tell us about your company so we can tailor our services to meet your needs.</p>
          </div>
          <form onSubmit={handleSubmit}>
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
