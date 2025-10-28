import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { NavLink } from 'react-router-dom';
import './DashboardPage.css';

const API_BASE = 'http://localhost:8080/api'; // Define API base URL

const DashboardPage = () => {
  // State for user data - Initialize with defaults or null
  const [userId] = useState(localStorage.getItem('userId') || ''); // Get userId from localStorage
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [companyName, setCompanyName] = useState('');

  // State for dashboard data
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [efficiencyTarget, setEfficiencyTarget] = useState(0);

  // State for activities - Keep static for now as data isn't from backend summary
  const [lcaActivityStatus] = useState('Not Started'); // Example static status
  const [productActivityStatus] = useState('Not Started'); // Example static status
  const [lcaActivityText, setLcaActivityText] = useState('Calculated LCA for...');

  // State for bar chart
  const [contributors, setContributors] = useState([]); // Now an array of objects {name: string, value: number}
  const [yAxisLabels, setYAxisLabels] = useState([]);
  const [yAxisMax, setYAxisMax] = useState(0.1);

  // State for pie chart
  const [piePercentage, setPiePercentage] = useState(0);
  const [pieAngle, setPieAngle] = useState(0);
  const [amountLeft, setAmountLeft] = useState(0);

  // State for loading/error handling
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState('');

  // Fetch User Profile Data
  const fetchUserProfile = useCallback(async () => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/profile`);
      if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }
      const profile = await res.json();

      setUserName(profile.fullName || 'User');
      setCompanyName(profile.companyName || 'Company');

      // Calculate initials
      let initials = 'U';
      if (profile.fullName) {
        const nameParts = profile.fullName.split(' ');
        initials = (nameParts[0].charAt(0) + (nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : '')).toUpperCase();
      }
      setUserInitials(initials);
      setError(''); // Clear previous errors on success

    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError('Could not load user profile.');
      // Set defaults on error
      setUserName('User');
      setCompanyName('Company');
      setUserInitials('U');
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]); // Dependency: userId

  // Fetch Dashboard Summary Data
  const fetchDashboardSummary = useCallback(async () => {
    if (!userId) {
      // Don't set error here, handled by fetchUserProfile
      setLoadingSummary(false);
      return;
    }
    setLoadingSummary(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/summary/${userId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch dashboard summary: ${res.status}`);
      }
      const summary = await res.json(); // Expects { totalEmissions: number, topContributors: [{name: string, value: number}] }

      setTotalEmissions(summary.totalEmissions || 0);

      // --- Update Bar Chart ---
      const activeContributors = summary.topContributors || [];
      setContributors(activeContributors); // Directly use the fetched data

      if (activeContributors.length > 0) {
        const dataMaxValue = Math.max(...activeContributors.map(d => d.value));
        const calculatedYAxisMax = Math.ceil(dataMaxValue * 10) / 10 || 0.1;

        setYAxisMax(calculatedYAxisMax);
        setYAxisLabels([
          (calculatedYAxisMax).toFixed(3),
          (calculatedYAxisMax * 0.5).toFixed(3),
          '0.000'
        ]);
        // Update LCA Activity text based on actual contributors if needed
        setLcaActivityText(`Calculated LCA for ${activeContributors.map(c => c.name).slice(0, 1).join(', ')}...`);

      } else {
        setYAxisMax(0.1);
        setYAxisLabels([]);
        setLcaActivityText('Calculated LCA for...');
      }
      setError(''); // Clear previous errors

    } catch (err) {
      console.error("Error fetching dashboard summary:", err);
      setError('Could not load dashboard data.');
      // Reset data on error
      setTotalEmissions(0);
      setContributors([]);
      setYAxisMax(0.1);
      setYAxisLabels([]);
    } finally {
      setLoadingSummary(false);
    }
  }, [userId]); // Dependency: userId

  // Effect to load data on mount and when userId changes
  useEffect(() => {
    fetchUserProfile();
    fetchDashboardSummary();
  }, [fetchUserProfile, fetchDashboardSummary]); // Add fetch functions as dependencies

  // Effect to update Pie Chart when relevant data changes
  useEffect(() => {
    const storedTarget = parseFloat(sessionStorage.getItem('efficiencyTarget')) || 0;
    setEfficiencyTarget(storedTarget); // Load target from session storage initially

    let percentage = 0;
    if (storedTarget > 0) {
      percentage = Math.min((totalEmissions / storedTarget) * 100, 100);
    }
    const angle = (percentage / 100) * 360;
    const left = Math.max(0, storedTarget - totalEmissions);

    setPiePercentage(Math.round(percentage));
    setPieAngle(angle);
    setAmountLeft(left);
  }, [totalEmissions, efficiencyTarget]); // Recalculate pie when totalEmissions or target changes

  // Handler for efficiency target input change
  const handleTargetChange = (e) => {
    const newTargetValue = parseFloat(e.target.value) || 0;
    sessionStorage.setItem('efficiencyTarget', newTargetValue); // Save to sessionStorage
    setEfficiencyTarget(newTargetValue); // Update state to trigger pie chart recalculation
  };

  // --- Render Logic ---
  const isLoading = loadingProfile || loadingSummary;

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        {/* Sidebar content remains the same */}
        <div className="sidebar-top">
          <div className="logo">
            <picture>
              <source srcSet="src/assets/carbonx.png" media="(prefers-color-scheme: dark)" />
              <img src="src/assets/carbonx.png" alt="Logo" width="30" />
            </picture>
          </div>
          <nav className="nav-menu">
            <NavLink to="/dashboard" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>Dashboard</span>
            </NavLink>
             <NavLink to="/inventory" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              <span>Inventory</span>
            </NavLink>
            <NavLink to="/analytics" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              <span>Analytics</span>
            </NavLink>
            <NavLink to="/network" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>Network</span>
            </NavLink>
            <NavLink to="/report" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>Report</span>
            </NavLink>
            <NavLink to="/chat" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span>AI Chat</span>
            </NavLink>
          </nav>
        </div>
        <div className="sidebar-bottom">
          <NavLink to="/settings" className="user-profile">
            <div className="user-avatar">{isLoading ? '...' : userInitials}</div>
            <div className="user-info">
              <div className="name">{isLoading ? 'Loading...' : userName}</div>
              <div className="company">{isLoading ? 'Loading...' : companyName}</div>
            </div>
          </NavLink>
        </div>
      </div>

      <main className="main-content">
        <header>
          <h1>Dashboard</h1>
          <p>Overview of your carbon emissions and activities.</p>
        </header>

        {error && <div className="error-message">{error}</div>} {/* Display errors */}

        {isLoading ? (
          <div>Loading dashboard data...</div>
        ) : (
          <div className="dashboard-grid">
            <div className="card emissions-card">
              <div className="card-header">
                <span className="card-title">Current Total Carbon Emissions</span>
                <span className="info-icon" data-tooltip="This section shows you the total sum of all your carbon emissions from your products, top 4 contributors and an AI summary.">ⓘ</span>
              </div>
              <div className="emissions-total">
                <div className="label">Sum of all carbon emissions:</div>
                {/* Use fetched totalEmissions */}
                <div className="value">{totalEmissions.toFixed(3)} kgCO2e</div>
              </div>
              <div className="card-header" style={{ marginTop: '30px' }}>
                <span className="card-title">Top Contributors of Carbon Emissions</span>
              </div>
              <div className="chart-area">
                <div className="y-axis">
                  {yAxisLabels.map((label, index) => <span key={index}>{label}</span>)}
                </div>
                <div className="bar-chart-container">
                  {contributors.length > 0 ? (
                    // Use fetched contributors data
                    contributors.map(data => (
                      <div className="bar-wrapper" key={data.name}>
                        {/* Use contributor 'value' for height */}
                        <div className="bar" style={{ height: `${(data.value / yAxisMax) * 100}%` }}></div>
                        <div className="bar-label">{data.name}</div>
                      </div>
                    ))
                  ) : (
                    <div className="no-products-message" style={{ fontSize: '13px' }}>No contributor data available.</div>
                  )}
                </div>
              </div>
              <div className="ai-summary">
                 <div className="card-header">
                   <span className="card-title">Summary</span>
                 </div>
                 <p className="summary-text">No info available.</p>
               </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Activities</span>
                <span className="info-icon" data-tooltip="This section shows you the top 5 actions you have carried out within our app.">ⓘ</span>
              </div>
              <div className="activities-list">
                 {/* Activities are still static based on state */}
                 <div className="activity-item">
                   <div className="description">
                     <div className="main">{lcaActivityText}</div>
                     <div className="sub">Inventory</div>
                   </div>
                   <div className={`status-badge ${totalEmissions > 0 ? 'completed' : 'not-started'}`}>
                    {totalEmissions > 0 ? 'Completed' : 'Not Started'}
                   </div>
                 </div>
                 <div className="activity-item">
                   <div className="description">
                     <div className="main">Added a New Product</div>
                     <div className="sub">Inventory</div>
                   </div>
                   <div className={`status-badge ${contributors.length > 0 ? 'completed' : 'not-started'}`}>
                      {contributors.length > 0 ? 'Completed' : 'Not Started'}
                   </div>
                 </div>
                 <div className="activity-item">
                   <div className="description">
                     <div className="main">Complete Onboarding</div>
                     <div className="sub"></div>
                   </div>
                   <div className="status-badge completed">Completed</div>
                 </div>
               </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Efficiency Target</span>
                <span className="info-icon" data-tooltip="This section shows the comparison between your actual target and the amount left to hit the target.">ⓘ</span>
              </div>
              <div className="pie-chart-container">
                <div
                  className="pie-chart"
                  style={{ background: `conic-gradient(light-dark(var(--navy), var(--blue)) ${pieAngle}deg, var(--border-color) ${pieAngle}deg)` }}
                >
                  <div className="pie-chart-center">{piePercentage}%</div>
                </div>
                <div className="pie-legend">
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: 'light-dark(var(--navy), var(--blue))' }}></div>
                    {/* Use fetched totalEmissions */}
                    <div className="legend-text">Current Emissions: <span className="value">{totalEmissions.toFixed(3)} kgCO2e</span></div>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: 'var(--border-color)' }}></div>
                    <div className="legend-text">Amount Left: <span className="value">{amountLeft.toFixed(3)} kgCO2e</span></div>
                  </div>
                </div>
              </div>
              <div className="target-input-container">
                <label htmlFor="efficiencyTargetInput">Set Target (kgCO2e)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0" // Prevent negative targets
                  id="efficiencyTargetInput"
                  className="target-input-editable"
                  value={efficiencyTarget} // Controlled input
                  onChange={handleTargetChange} // Update state and sessionStorage
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;