import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import logoPath from '../../assets/carbonx.png';
import { useNavigate, useLocation } from 'react-router-dom'; // 👈 ADD THIS
import { 
  ChevronDown, Plus, Search, Triangle, Trash2, X, 
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, Sparkles
} from 'lucide-react';


const DashboardPage = () => {
  const [isProUser] = useState(false); // Manually toggle this for free/pro testing

  // --- Static Dashboard Data ---
  // Replaced backend fetch with static defaults
  const [totalEmissions] = useState(12.5);
  const navigate = useNavigate(); // 👈 ADD THIS
  const location = useLocation(); // 👈 ADD THIS


  // --- Static Bar Chart Data ---
  const [contributors] = useState([
    { name: 'Product A', value: 0.8 },
    { name: 'Product B', value: 0.5 },
    { name: 'Product C', value: 0.2 },
  ]);
  const [yAxisLabels] = useState(['1.000', '0.500', '0.000']);
  const [yAxisMax] = useState(1.0);

  // --- Frontend-Only Pie Chart Logic ---
  // This logic is kept as it's based on sessionStorage and local state
  const [efficiencyTarget, setEfficiencyTarget] = useState(0);
  const [piePercentage, setPiePercentage] = useState(0);
  const [pieAngle, setPieAngle] = useState(0);
  const [amountLeft, setAmountLeft] = useState(0);

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

  // Handler for efficiency target input change (Frontend-Only)
  const handleTargetChange = (e) => {
    const newTargetValue = parseFloat(e.target.value) || 0;
    sessionStorage.setItem('efficiencyTarget', newTargetValue); // Save to sessionStorage
    setEfficiencyTarget(newTargetValue); // Update state to trigger pie chart recalculation
  };

  // --- Render Logic ---
  // No more isLoading or error states
  return (
    <div className="container">
      <div className="sidebar">
        <div className="sidebar-top">
          <img src={logoPath} alt="Logo" width="48" style={{ margin: 0, padding: 0, display: 'block' }}/>
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
          <button type="button" className={`nav ${location.pathname === '/settings' ? 'active' : ''}`} onClick={() => navigate("/settings")}>
            <Settings /><span>Settings</span>
          </button>
        </div>
      </div>

      <div className="content-body">
        <div className="content"> 
          <div className="form-header">
            <h1>Dashboard</h1>
            <p className = "medium-regular">Overview of your industry metrics.</p>
          </div>
          <div className = "table-header-content">
            <p style = {{color: "rgba(var(--greys), 1)"}}>Showing 7 of 7 metrics</p>
            <div className = "button-container">
              <button className = "icon" onClick={() => setShowAddProduct(true)} disabled><Sparkles /></button>
            </div>
          </div>
        </div>
      </div>
    </div> // This closes .container
  ); // This closes the return statement
};

export default DashboardPage;