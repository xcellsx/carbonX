import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import Lottie from 'lottie-react';
import animationData from '../../lottie/logo.json';
import dashboard from '../../assets/dashboard.png';
import { authAPI, usersAPI } from '../../services/api';

const SignupPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    usersAPI.getAll()
      .then((res) => {
        console.log('Existing users:', res.data);
        if (Array.isArray(res.data) && res.data.length > 0) {
          console.log('Existing user emails:', res.data.map((u) => u.email));
        }
      })
      .catch((err) => console.warn('Could not fetch existing users:', err.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!fullName || !email || !password) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    try {
      const { data } = await authAPI.register({ fullName, email, password });
      localStorage.removeItem('isProUser');
      localStorage.removeItem('settingsTab');
      localStorage.setItem('userId', data.id || data.key || `user-${Date.now()}`);
      const savedFullName = [data.firstName, data.lastName].filter(Boolean).join(' ') || fullName || '';
      try {
        localStorage.setItem('carbonx_user_profile', JSON.stringify({ fullName: savedFullName, email: data.email || email, phone: '' }));
      } catch (_) {}
      navigate('/company-info');
    } catch (err) {
      const status = err.response?.status;
      const body = err.response?.data;
      const msg = body?.message || (status === 409 ? 'An account with this email already exists.' : 'Sign up failed. Please try again.');
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
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
            
            <button className="default" type="submit" disabled={loading}>
              {loading ? 'Signing up…' : 'Sign Up'}
            </button>
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