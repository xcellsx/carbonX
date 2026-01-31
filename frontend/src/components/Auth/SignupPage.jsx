import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import Lottie from 'lottie-react';
import animationData from '../../lottie/logo.json';
import dashboard from '../../assets/dashboard.png'

const SignupPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!fullName || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    // Backend Error Handling
    try {
      const res = await fetch('http://localhost:8081/api/auth/signup', {
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
    setError('Could not connect to server');}
  };

  return (
    <div className = "container">
      <div className = "image-section">
        <img src = {dashboard} alt="Sign up visual" className="signup-image"/>
      </div>
      <div className = "form-section">
        <div className = "logo-animation">
          <Lottie animationData={animationData} style={{ height: 48, width: 48 }} />
        </div>
        <div className="form-container">
          <div className="form-header">
            <h1>Welcome.</h1>
            <p className = "medium-regular">Sign up with your credentials.</p>
          </div>
          <form className="form-auth" onSubmit={handleSubmit}>
            <div className = "group">
              <label className="normal-bold" htmlFor="fullName">Full Name</label>
              <input className="input-base" type="text" id="fullName" value={fullName} placeholder="Full Name" onChange={e => setFullName(e.target.value)} autoFocus/>
            </div>
            <div className = "group">
            <label className="normal-bold" htmlFor="email">Email</label>
            <input className="input-base" type="email" id="email" value={email} placeholder="Email" onChange={e => setEmail(e.target.value)}/>
            </div>
            <div className = "group">
            <label className="normal-bold" htmlFor="password">Password</label>
            <input className="input-base" type="password" id="password" value={password} placeholder="Password" onChange={e => setPassword(e.target.value)}/>
            </div>
            {error && <div className = "submit-error">{error}</div>}
            <button className="default" type="submit">Sign Up</button>
          </form>
          <div className="prompt">
            Already have an account? {' '}
            <Link className="link" to="/login">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
