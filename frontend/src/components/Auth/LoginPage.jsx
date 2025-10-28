import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    // Example only! Replace with your backend call.
    try {
      // This fetch call targets the backend for login validation
      const res = await fetch('http://localhost:8080/api/auth/login', { // <-- Backend endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) // Sends email and password
      });
      if (res.ok) {
        // If backend responds with OK (2xx status), navigate to dashboard
        setError('');
        navigate('/dashboard'); // Or your real dashboard route
      } else {
        // If backend responds with an error status, show an error
        setError('Incorrect email or password');
      }
    } catch (err) {
      // Handle network errors (e.g., backend not running)
      setError('Could not connect to server');
    }
  };

  return (
    <div className="login-layout">
      <div className="login-left-panel">
        <div className="login-form-container">
          <div className="login-logo">
            <img src="src/assets/carbonx.png" alt="CarbonX Logo" className="login-logo-image"/>
          </div>
          <div className="login-title">Welcome Back.</div>
          <div className="login-subtitle">Sign in with your credentials.</div>
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-label" htmlFor="email">Email</label>
            <input className="login-input" type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required/>
            <label className="login-label" htmlFor="password">Password</label>
            <input className="login-input" type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required/>
            <div className="login-options-row">
              <label className="login-checkbox">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                <span>Remember Me</span>
              </label>
              <Link className="login-link" to="/forgot-password">Forget Password</Link>
            </div>
            {error && <div className="login-error">{error}</div>}
            <button className="login-btn" type="submit">Sign in</button>
          </form>
          <div className="login-prompt">
            Don’t have an account?<Link to="/signup" className="login-link-signup">Sign up here</Link>
          </div>
        </div>
      </div>
      <div className="login-right-panel">
        <img src="src/assets/dashboard.png" alt="Dashboard Preview" className="login-image"/>
      </div>
    </div>
  );
};

export default LoginPage;
