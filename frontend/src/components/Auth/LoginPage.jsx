import React, { useState, useEffect } from 'react'; // 1. Import useEffect
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

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
    const foundUser = existingUsers.find(user => user.email === email);

    if (foundUser) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      localStorage.setItem('userId', foundUser.id);
      setError('');
      navigate('/dashboard'); 
    } else {
      setError('Incorrect email or password.');
    }
  };

  return (
    <div className="container">
      <div className="image-section">
        <img src = {dashboard} alt="Sign up visual" className="signup-image"/>
      </div>
      <div className="form-section">
        <div className = "logo-animation">
          <Lottie animationData={animationData} style={{ height: 48, width: 48 }} />
        </div>
        <div className="form-container">
          <div className="form-header">
            <h1>Welcome Back.</h1>
            <p className='medium-regular'>Sign in with your credentials.</p>
          </div>
          <form className="form-auth" onSubmit={handleSubmit} noValidate>
            <div className= "group">
              <label className="normal-bold" htmlFor="email">Email</label>
              <input className="input-base" type="email" id="email" value={email} placeholder='Email' onChange={e => setEmail(e.target.value)} autoFocus/>
            </div>
            <div className= "group">
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