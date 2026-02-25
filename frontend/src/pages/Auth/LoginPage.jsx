import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import Lottie from 'lottie-react';
import animationData from '../../lottie/logo.json';
import dashboard from '../../assets/dashboard.png';
import { authAPI } from '../../services/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.removeItem('isProUser');
      localStorage.removeItem('settingsTab');
      localStorage.setItem('userId', data.id || data.key || `user-${Date.now()}`);
      const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ') || data.email || '';
      try {
        localStorage.setItem('carbonx_user_profile', JSON.stringify({ fullName, email: data.email || email, phone: data.phone || '' }));
      } catch (_) {}
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg === 'Account is not registered.') {
        setError('Account is not registered');
      } else {
        setError(msg || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="image-section">
        <img src = {dashboard} alt="Sign up visual" className="image-section-img"/>
      </div>
      <div className="content-section">
        <div className = "logo-animation">
          <Lottie animationData={animationData} style={{ height: 48, width: 48 }} />
        </div>
        <div className="content-container">
          <div className="header-group">
            <h1>Welcome Back.</h1>
            <p className='medium-regular'>Sign in with your credentials.</p>
          </div>
          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className= "input-group-col">
              <label className="normal-bold" htmlFor="email">Email</label>
              <input className="input-base" type="email" id="email" value={email} placeholder='Email' onChange={e => setEmail(e.target.value)} autoFocus/>
            </div>
            <div className= "input-group-col">
            <label className="normal-bold" htmlFor="password">Password</label>
            <input className="input-base" type="password" id="password" value={password} placeholder='Password' onChange={e => setPassword(e.target.value)}/>
            </div>
            <div className="options">
              <label className="login-checkbox">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}/>
                <span> Remember Me</span>
              </label>
              <Link className="link" to="/forgot-password">Forget Password</Link>
            </div>
            {error && <div className="submit-error">{error}</div>}
            <button className="default" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <div className="prompt">
            Don’t have an account? {''}
            <Link to="/signup" className="link normal-bold">Sign up here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;