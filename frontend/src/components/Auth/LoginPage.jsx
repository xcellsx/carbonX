import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import Lottie from 'lottie-react';
import animationData from '../../lottie/logo.json';
import dashboard from '../../assets/dashboard.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // --- NEW: Load remembered email on component mount ---
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    // Backend validation (from original code)
    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (res.ok) {
        const loggedInUser = await res.json(); 
        
        if (loggedInUser && loggedInUser.id) {
          // --- NEW: Handle "Remember Me" logic on successful login ---
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
          
          // --- Original Logic ---
          localStorage.setItem('userId', loggedInUser.id);
          setError('');
          navigate('/dashboard');
        } else {
          setError('Login successful but no user ID was returned.');
        }
      } else {
        setError('Incorrect email or password');
      }
    } catch (err) {
      setError('Could not connect to server');
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
            <button className="default" type="submit">Sign In</button>
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