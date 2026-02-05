import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SettingsPage.css';
import Navbar from '../../components/Navbar/Navbar';
// Make sure this path is correct for your project structure
import { useCompanyForm } from '../../hooks/useCompanyForm'; 
// Make sure this path is correct for your project structure
import CompanyForm from '../Company/CompanyForm';
import BillingSubscriptions from './BillingSubscriptions'; 
import BillingHistory from './BillingHistory';
import { API_BASE } from '../../services/api';
import { useProSubscription } from '../../hooks/useProSubscription';

const isDifferent = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

const SettingsPage = () => {
  // Read the saved tab from localStorage, defaulting to 'account'
  const [activeTab, setActiveTab] = useState(
    localStorage.getItem('settingsTab') || 'account'
  );

  const { isProUser, refreshSubscription } = useProSubscription(); 
  
  const [password, setPassword] = useState(''); 
  const [saveMessage, setSaveMessage] = useState('');
  
  const [initialUserDetails, setInitialUserDetails] = useState({
    fullName: '', 
    email: '',
    phone: ''
  });
  const [userDetails, setUserDetails] = useState({
    fullName: '', 
    email: '',
    phone: ''
  });

  const navigate = useNavigate();
  const location = useLocation();

  const { 
    form: companyForm, 
    handleChange: handleCompanyFormChange, 
    isDirty: isCompanyFormDirty, 
    resetForm: resetCompanyForm 
  } = useCompanyForm();

  // Handle navigation to billing tab (e.g., from ProGate upgrade button)
  useEffect(() => {
    if (location.state?.tab === 'billing') {
      setActiveTab('billing');
    }
  }, [location.state]);

  // Save the active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('settingsTab', activeTab);
  }, [activeTab]);

  // --- UPDATED: Load user data from Backend API on mount ---
  useEffect(() => {
    const fetchUserData = async () => {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        console.error("SettingsPage: No user ID found in localStorage.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/users/${currentUserId}/profile`);
        if (res.ok) {
          const data = await res.json();
          
          // Map the API response to your state
          // Note: 'phone' is not currently returned by your backend endpoint
          const loadedDetails = {
            fullName: data.fullName || '', 
            email: data.email || '',
            phone: data.phone || '' 
          };
          
          setUserDetails(loadedDetails);
          setInitialUserDetails(loadedDetails);
        } else {
          console.error("Failed to fetch user profile:", res.status);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchUserData();
  }, []); 

  const onDetailsChange = (e) => {
    if (saveMessage) setSaveMessage(''); 
    const { id, value } = e.target;
    setUserDetails(prevDetails => ({
      ...prevDetails,
      [id]: value
    }));
  };

  const onPasswordChange = (e) => {
    if (saveMessage) setSaveMessage(''); 
    setPassword(e.target.value);
  };
  
  const onCompanyFormChange = (e) => {
    if (saveMessage) setSaveMessage(''); 
    handleCompanyFormChange(e); 
  };

  const isUserDetailsDirty = isDifferent(initialUserDetails, userDetails);
  const isPasswordDirty = password !== '';
  const isFormDirty = isUserDetailsDirty || isPasswordDirty || isCompanyFormDirty;

  const handleSaveAllSettings = (e) => {
    e.preventDefault();
    
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setSaveMessage("Error: User ID not found."); 
      return;
    }

    // TODO: Update this to send a POST/PUT request to your backend
    // Currently it just saves to LocalStorage which won't persist across devices
    
    // Save Account Details locally for now
    const allUsers = JSON.parse(localStorage.getItem('users')) || [];
    const updatedUsers = allUsers.map(user => {
      if (user.id === userId) {
        return { ...user, ...userDetails }; 
      }
      return user;
    });
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setInitialUserDetails(userDetails); 

    if (isPasswordDirty) { 
      console.log('Saving new password...', { password });
      setPassword(''); 
    }

    // Save Company Info
    const allCompanyData = JSON.parse(localStorage.getItem('companyData')) || {};
    allCompanyData[userId] = companyForm;
    localStorage.setItem('companyData', JSON.stringify(allCompanyData));
    resetCompanyForm(); 
    
    setSaveMessage('Settings saved successfully!');
  };
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };
  
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <form className="form" onSubmit={handleSaveAllSettings}>
            <div className="sub-header">
              <div className="header-col">
                <p className='descriptor-medium'>Account Settings</p>
              </div>
            </div>
            {/* Account Settings Inputs */}
            <div className="input-group-row">
              <div className="input-group-col">
                <label className="normal-bold" htmlFor="fullName">Full Name</label>
                <input className="input-base" type="text" id="fullName" value={userDetails.fullName} onChange={onDetailsChange} />
              </div>
              <div className="input-group-col">
                <label className="normal-bold" htmlFor="email">Email</label>
                <input className='input-base' type="email" id="email" value={userDetails.email} onChange={onDetailsChange} />
              </div>
            </div>
            <div className="input-group-row">
              <div className="input-group-col">
                <label className="normal-bold" htmlFor="phone">Phone Number</label>
                <input className="input-base" type="tel" id="phone" value={userDetails.phone} onChange={onDetailsChange} placeholder="e.g. +1 (555) 123-4567" />
              </div>
              <div className="input-group-col">
                <label className="normal-bold" htmlFor="password">Set New Password</label>
                <input className='input-base' type="password" id="password" value={password} onChange={onPasswordChange} placeholder="Enter a new password" />
              </div>
            </div>

            {/* Company Details Inputs */}
            <div className="sub-header">
              <div className="header-col">
                <p className='descriptor-medium'>Company Details</p>
              </div>
            </div>
            <CompanyForm form={companyForm} handleChange={onCompanyFormChange} /> 
            
            {/* Save Button & Message */}
            {saveMessage && (
              <div className="submit-success" style={{ marginTop: '1rem' }}>
                {saveMessage}
              </div>
            )}
            
            <div className="settings-action-buttons">
              <button 
                type="button" 
                className="default" 
                style={{marginTop: '1rem', backgroundColor: 'rgba(var(--secondary), 1)'}}
                onClick={handleLogout}
              >
                Log Out
              </button>
              <button 
                type="submit" 
                className="default" 
                style={{marginTop: '1rem'}} 
                disabled={!isFormDirty}
              >
                Save Changes
              </button>
            </div>
          </form>
        );
      case 'billing':
        return <BillingSubscriptions onPlanSave={refreshSubscription} />;
      case 'history':
        return <BillingHistory />;
      default:
        return null;
    }
  };

  return (
      <div className="container">
        <Navbar />
        <div className="content-section-main">
          <div className="content-container-main"> 
            
            <div className="header-group">
              <h1>Settings</h1>
              <p className = "medium-regular">Manage and view your settings.</p>
            </div>
            
            <div className = "chip-group small-regular">
              <button 
                type="button" 
                className = {`chip ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => setActiveTab('account')}
              >
                Account
              </button>
              <button 
                type="button" 
                className = {`chip ${activeTab === 'billing' ? 'active' : ''}`}
                onClick={() => setActiveTab('billing')}
              >
                Billing & Subscriptions
              </button>
              <button 
                type="button" 
                className = {`chip ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                Billing History
              </button>
            </div>
            
            {renderActiveTabContent()}

          </div>
        </div>
      </div>
  );
};

export default SettingsPage;