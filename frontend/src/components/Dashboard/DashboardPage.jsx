import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import logoPath from '../../assets/carbonx.png'; // Removed
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronDown, Plus, Search, Triangle, Trash2, X, 
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, Sparkles, CircleCheck,
  Circle
} from 'lucide-react';


const DashboardPage = () => {
  const [isProUser] = useState(false); 
  const [totalEmissions] = useState(12.5);
  const navigate = useNavigate();
  const location = useLocation(); 

  const [showProModal, setShowProModal] = useState(false);

  // --- Static Bar Chart Data ---
  const [contributors] = useState([
    { name: 'Product A', value: 0.8 },
    { name: 'Product B', value: 0.5 },
    { name: 'Product C', value: 0.2 },
  ]);
  const [yAxisLabels] = useState(['1.000', '0.500', '0.000']);
  const [yAxisMax] = useState(1.0);

  // --- Frontend-Only Pie Chart Logic ---
  const [efficiencyTarget, setEfficiencyTarget] = useState(0);
  const [piePercentage, setPiePercentage] = useState(0);
  const [pieAngle, setPieAngle] = useState(0);
  const [amountLeft, setAmountLeft] = useState(0);

  useEffect(() => {
    const storedTarget = parseFloat(sessionStorage.getItem('efficiencyTarget')) || 0;
    setEfficiencyTarget(storedTarget);

    let percentage = 0;
    if (storedTarget > 0) {
      percentage = Math.min((totalEmissions / storedTarget) * 100, 100);
    }
    const angle = (percentage / 100) * 360;
    const left = Math.max(0, storedTarget - totalEmissions);

    setPiePercentage(Math.round(percentage));
    setPieAngle(angle);
    setAmountLeft(left);
  }, [totalEmissions, efficiencyTarget]);

  const handleTargetChange = (e) => {
    const newTargetValue = parseFloat(e.target.value) || 0;
    sessionStorage.setItem('efficiencyTarget', newTargetValue);
    setEfficiencyTarget(newTargetValue);
  };
  
  // --- NEW: Click handler for Sparkle button ---
  const handleSparkleClick = () => {
    if (isProUser) {
      // Logic for Pro users (e.g., open AI feature)
      alert("AI Feature placeholder!");
    } else {
      // Logic for Free users (open "Get Pro" modal)
      setShowProModal(true);
    }
  };

  return (
    <div className="container">
      <div className="sidebar">
        <div className="sidebar-top">
          {/* Use placeholder logo */}
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
          <div className = "table-header-content-db">
            <div class = "header-col">
              <p className='descriptor-medium'>Key Metrics</p>
              <p style = {{color: "rgba(var(--greys), 1)"}}>Showing 7 of 7 metrics</p>
            </div>
            <div className = "button-container">
              <button 
                className = "icon" 
                onClick={handleSparkleClick}

                style={!isProUser ? { backgroundColor: 'rgba(var(--greys), 0.2)' } : {}}
              >
                <Sparkles />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Pro Modal --- */}
      {showProModal && (
        <div className="modal-overlay active" onClick={() => setShowProModal(false)}>
          <div className="modal-content pro-modal" onClick={e => e.stopPropagation()}>
            <div className="closebtnheader">
              <button className="close-modal-btn" onClick={() => setShowProModal(false)}><X /></button>
            </div>
              <div>
                <Sparkles size={48} color="rgba(var(--secondary), 1)" />
              </div>
              
              <p className='large-bold'>Get CarbonX Pro</p>
              
              <div className="group-pro-modal">
                <p className="normal-regular">What you will get:</p>
                
                <ul className="pro-features-list">
                  <li>
                    <CircleCheck size={20} />
                    <span>Cloud Hosting</span>
                  </li>
                  <li>
                    <CircleCheck size={20} />
                    <span>Access to Report Generator & AI Functionalities</span>
                  </li>
                  <li>
                    <CircleCheck size={20} />
                    <span>Limited access to Marketplace Community</span>
                  </li>
                  <li>
                    <CircleCheck size={20} />
                    <span>Increase your team size to 5</span>
                  </li>
                  <li>
                    <CircleCheck size={20} />
                    <span>IT Support</span>
                  </li>
                </ul>
              </div>
              
              <button type="button" className="default" style={{ width: '100%' }} onClick={() => alert('Redirecting to Pro page!')}>
                Get CarbonX Pro
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;