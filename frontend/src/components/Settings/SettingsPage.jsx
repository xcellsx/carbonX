import React, { useState, useEffect } from 'react';
import logoPath from '../../assets/carbonx.png';
import { useNavigate, useLocation } from 'react-router-dom';
import './SettingsPage.css';
import { 
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, 
} from 'lucide-react';
// Make sure this path is correct for your project structure
import { useCompanyForm } from '../../hooks/useCompanyForm'; 
// Make sure this path is correct for your project structure
import CompanyForm from '../../components/Company/CompanyForm';
import BillingSubscriptions from './BillingSubscriptions'; // Assumes it's in the same /Settings folder
import BillingHistory from './BillingHistory'; // --- NEW: Import BillingHistory ---

const isDifferent = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

const SettingsPage = () => {
  // Read the saved tab from localStorage, defaulting to 'account'
  const [activeTab, setActiveTab] = useState(
    localStorage.getItem('settingsTab') || 'account'
  );

  // --- UPDATED: Reads 'isProUser' from localStorage ---
  const [isProUser, setIsProUser] = useState(
    localStorage.getItem('isProUser') === 'true'
  ); 
  
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

  // Save the active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('settingsTab', activeTab);
  }, [activeTab]);

  // Load user data on mount
  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      console.error("SettingsPage: No user ID found in localStorage.");
      return;
    }

    const allUsers = JSON.parse(localStorage.getItem('users')) || [];
    const currentUser = allUsers.find(user => user.id === currentUserId);

    if (currentUser) {
      const loadedDetails = {
        fullName: currentUser.fullName, 
        email: currentUser.email,
        phone: currentUser.phone || ''
      };
      setUserDetails(loadedDetails);
      setInitialUserDetails(loadedDetails);
    }
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
      console.error("User ID not found, can't save settings.");
      setSaveMessage("Error: User ID not found."); 
      return;
    }

    // Save Account Details
    const allUsers = JSON.parse(localStorage.getItem('users')) || [];
    const updatedUsers = allUsers.map(user => {
      if (user.id === userId) {
        return { ...user, ...userDetails }; 
      }
      return user;
    });
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setInitialUserDetails(userDetails); 

    // Save Password
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
  
  // --- NEW: Logout Function ---
  const handleLogout = () => {
    // Clear all local storage to end the session
    localStorage.clear();
    // Navigate to the login page
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
            {/* --- UPDATED: Button container --- */}
            <div className="settings-action-buttons">
              <button 
                type="button" 
                className="default" // Use the secondary button style
                style={{marginTop: '1rem', backgroundColor: 'rgba(var(--secondary), 1)'}}
                onClick={handleLogout}
              >
                Log Out
              </button>
              <button 
                type="submit" 
                className="default" // Use the primary 'default' style
                style={{marginTop: '1rem'}} 
                disabled={!isFormDirty}
              >
                {/* --- UPDATED: Text changed --- */}
                Save Changes
              </button>
            </div>
          </form>
        );
      case 'billing':
        // --- Pass a function to update the Pro status ---
        return <BillingSubscriptions onPlanSave={() => setIsProUser(true)} />;
      case 'history':
        // --- UPDATED: Render the new component ---
        return <BillingHistory />;
      default:
        return null;
    }
  };

  return (
      <div className="container">
        {/* --- SIDEBAR --- */}
        <div className="sidebar">
          <div className="sidebar-top">
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              className="logo-button" 
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <img src={logoPath} alt="Logo" width="48" style={{ margin: 0, padding: 0, display: 'block' }}/>
            </button>
            <p className ="descriptor">Core Features</p>
            <div className="navbar">
              <button type="button" onClick={() => navigate('/dashboard')} className={`nav ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                <LayoutDashboard /><span>Dashboard</span>
              </button>
              <button type="button" className={`nav ${location.pathname === '/inventory' ? 'active' : ''}`} onClick={() => navigate('/inventory')}>
                <Archive /><span>Inventory</span>
              </button>
              <button type="button" className={`nav ${location.pathname === '/analytics' ? 'active' : ''}`} onClick={() => navigate('/analytics')}>
                <ChartColumnBig /><span>Analytics</span>
              </button>
            </div>
            <p className ="descriptor">Plugins</p>
            <div className = "navbar">
              {/* --- This button is now controlled by isProUser state --- */}
              {/* --- FIXED: Removed the '.' from type.="button" --- */}
              <button type="button" className={`nav ${location.pathname === '/network' ? 'active' : ''}`} onClick={() => navigate('/network')} disabled={!isProUser}>
                <Network /><span>Network</span>
              </button>
              <button type="button" className={`nav ${location.pathname === '/report' ? 'active' : ''}`} onClick={() => navigate('/report')} disabled={!isProUser}>
                <FileText /><span>Report</span>
              </button>
              <button type="button" className={`nav ${location.pathname === '/chat' ? 'active' : ''}`} onClick={() => navigate('/chat')} disabled={!isProUser}>
                <Sprout /><span>Sprout AI</span>
              </button>
            </div>
          </div>
          <div className="sidebar-bottom">
            <div className = "navbar">
            <button type="button" className={`nav ${location.pathname === '/settings' ? 'active' : ''}`} onClick={() => navigate("/settings")}>
              <Settings /><span>Settings</span>
            </button>
            </div>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
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