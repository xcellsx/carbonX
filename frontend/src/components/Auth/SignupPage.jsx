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
  // Initialize state as an object
  const [message, setMessage] = useState({ type: '', text: '' }); 
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset message
    setMessage({ type: '', text: '' });

    // 1. Check for empty fields
    if (!fullName || !email || !password) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    // 2. Add simple email validation (New Logic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    // Backend Error Handling
    try {
      const res = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password })
      });

      if (res.ok) {
        const result = await res.json();
        
        if (result.id) {
          // 3. Session Cleanup (New Logic)
          localStorage.removeItem('isProUser');
          localStorage.removeItem('settingsTab');

          localStorage.setItem('userId', result.id);
          
          setMessage({ type: '', text: '' }); // Clear errors
          navigate('/company-info');
        } else {
          setMessage({ type: 'error', text: 'Signup succeeded but no user id returned.' });
        }
      } else {
        // 4. Handle "Email already in use" or other backend errors
        const data = await res.json();
        // Ensure your backend returns { message: "Email already in use" } for duplicates
        setMessage({ type: 'error', text: data.message || 'Sign up failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not connect to server' });
    }
  };

  return (
    <div className = "container">
      <div className = "image-section">
        <img src = {dashboard} alt="Sign up visual" className="image-section-img"/>
      </div>
      <div className = "content-section">
        <div className = "logo-animation">
          <Lottie animationData={animationData} style={{ height: 48, width: 48 }} />
        </div>
        <div className="content-container">
          <div className="header-group">
            <h1>Welcome.</h1>
            <p className = "medium-regular">Sign up with your credentials.</p>
          </div>
          {/* Added noValidate to disable browser default bubbles so your custom errors show */}
          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className = "input-group-col">
              <label className="normal-bold" htmlFor="fullName">Full Name</label>
              <input className="input-base" type="text" id="fullName" value={fullName} placeholder="Full Name" onChange={e => setFullName(e.target.value)} autoFocus/>
            </div>
            <div className = "input-group-col">
            <label className="normal-bold" htmlFor="email">Email</label>
            <input className="input-base" type="email" id="email" value={email} placeholder="Email" onChange={e => setEmail(e.target.value)}/>
            </div>
            <div className = "input-group-col">
            <label className="normal-bold" htmlFor="password">Password</label>
            <input className="input-base" type="password" id="password" value={password} placeholder="Password" onChange={e => setPassword(e.target.value)}/>
            </div>
            
            {/* Conditional rendering to avoid empty div taking up space */}
            {message.text && (
                <div className={`submit-${message.type}`}>{message.text}</div>
            )}
            
            <button className="default" type="submit">Sign Up</button>
          </form>
          <div className="prompt">
            Already have an account? {' '}
            <Link className="link normal-bold" to="/login">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;