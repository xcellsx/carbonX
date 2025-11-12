import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import Lottie from 'lottie-react';
import animationData from '../../lottie/logo.json';
import dashboard from '../../assets/dashboard.png';

const SignupPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });  
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 1. Check for empty fields
    if (!fullName || !email || !password) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    // 2. Add simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if any user in the list has this email
    const emailInUse = existingUsers.find(user => user.email === email);

    if (emailInUse) {
      setMessage({ type: 'warning', text: 'This email is already in use. Please sign in.' });      
      return;
    }

    const userId = `user_${new Date().getTime()}`;
    
    const newUser = {
      id: userId,
      fullName: fullName,
      email: email,
    };

    const updatedUsers = [...existingUsers, newUser];
    
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    localStorage.setItem('userId', userId);

    setMessage('');
    navigate('/company-info');
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
          <form className="form-auth" onSubmit={handleSubmit} noValidate>
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
            <div className = {`submit-${message.type}`}>{message.text}</div>
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