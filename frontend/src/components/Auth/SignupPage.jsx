import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignupPage.css';

const SignupPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!fullName || !email || !password) {
    setError('Please fill in all fields');
    return;
  }

  try {
    const res = await fetch('http://localhost:8080/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password })
    });
    if (res.ok) {
      const result = await res.json(); // result object must contain "id"
      if (result.id) {
        localStorage.setItem('userId', result.id); // <-- This line is what you need!
        setError('');
        navigate('/company-info');
      } else {
        setError('Signup succeeded but no user id returned.');
      }
    } else {
      const { message } = await res.json();
      setError(message || 'Sign up failed');
    }
  } catch (err) {
    setError('Could not connect to server');
  }
};


  return (
    <div className="signup-layout">
      <div className="signup-left-panel">
        <div className="signup-form-container">
          <div className="signup-logo">
            {/* Use your logo here */}
            <img src="src/assets/carbonx.png" alt="CarbonX Logo" className="signup-logo-image"/>
          </div>
          <div className="signup-title">Welcome.</div>
          <div className="signup-subtitle">Sign up with your credentials.</div>
          <form className="signup-form" onSubmit={handleSubmit}>
            <label className="signup-label" htmlFor="fullName">Full Name</label>
            <input className="signup-input" type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required autoFocus/>
            <label className="signup-label" htmlFor="email">Email</label>
            <input className="signup-input" type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required/>
            <label className="signup-label" htmlFor="password">Password</label>
            <input className="signup-input" type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required/>
            {error && <div className="signup-error">{error}</div>}
            <button className="signup-btn" type="submit">Sign up</button>
          </form>
          <div className="signup-prompt">
            Already have an account?
            <Link className="signup-link" to="/login">Sign in here</Link>
          </div>
        </div>
      </div>
      <div className="signup-right-panel">
        <img src="src/assets/dashboard.png" alt="Sign up visual" className="signup-image"/>
      </div>
    </div>
  );
};

export default SignupPage;
