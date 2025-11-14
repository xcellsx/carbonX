import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import logoPath from '../../assets/carbonx.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Utensils, Leaf, Droplet, ArrowRight, Zap, X, 
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, Sparkles, CircleCheck,
  ShieldUser, Wheat, Earth, Dna
} from 'lucide-react';

// --- 1. ALL POSSIBLE METRICS (Top-Level Cards) ---
const metricDefinitions = [
  { id: 'ghg', name: 'Greenhouse Gas Emissions', icon: Leaf },
  { id: 'energy', name: 'Energy Management', icon: Zap },
  { id: 'water', name: 'Water Management', icon: Droplet },
  { id: 'food', name: 'Food Safety', icon: Utensils },
  { id: 'safety', name: 'Workforce Health & Safety', icon: ShieldUser },
  { id: 'impact', name: 'Environmental & Social Impacts', icon: Earth },
  { id: 'sourcing', name: 'Ingredient Sourcing', icon: Wheat },
];

// --- 2. MASTER LIST OF ALL DATA TO BE RANDOMIZED ---
const ALL_METRIC_DATA_DEFINITIONS = {
  'ghg': { defaultMax: 2.000, decimals: 3, unit: 'kgCO2e' },
  'energy': { defaultMax: 5.000, decimals: 3, unit: 'kJ' },
  'water': { defaultMax: 20.000, decimals: 3, unit: 'm³' },
  'food': { defaultMax: 1.000, decimals: 3, unit: 'tonnes' },
  'safety': { defaultMax: 4, decimals: 0, unit: 'accidents' },
  'impact': { defaultMax: 5, decimals: 0, unit: 'audits' },
  'sourcing': { defaultMax: 100, decimals: 1, unit: '%' },
  'ghg_fleet': { defaultMax: 25.000, decimals: 3, unit: 'kJ' },
  'energy_grid': { defaultMax: 2.500, decimals: 3, unit: 'kJ' },
  'energy_renewable': { defaultMax: 5.000, decimals: 3, unit: 'kJ' },
  'water_noncompliance': { defaultMax: 20.000, decimals: 3, unit: 'm³' },
  'food_gfsi': { defaultMax: 0, decimals: 0, unit: 'audits' },
  'food_agri': { defaultMax: 0, decimals: 0, unit: 'audits' },
  'food_recalled_count': { defaultMax: 1, decimals: 0, unit: 'recalls' },
  'food_recalled_amount': { defaultMax: 1.000, decimals: 3, unit: 'tonnes' },
  'safety_rate': { defaultMax: 1, decimals: 0, unit: 'accidents' },
  'safety_trir': { defaultMax: 1, decimals: 0, unit: 'rate' },
  'safety_fatality': { defaultMax: 1, decimals: 0, unit: 'rate' },
  'safety_nmfr': { defaultMax: 1, decimals: 0, unit: 'accidents' },
  'impact_agri': { defaultMax: 100.0, decimals: 1, unit: 't' },
  'impact_audit': { defaultMax: 0, decimals: 0, unit: 'audits' },
  'sourcing_agri': { defaultMax: 100, decimals: 1, unit: '%' },
};

// --- 3. BREAKDOWN TEMPLATE (Uses dataKeys) ---
const METRIC_BREAKDOWN_DATA = {
  'ghg': {
    title: 'Greenhouse Gas Emissions', icon: Leaf,
    subMetrics: [
      { name: 'Gross Global Scope 1 Emissions', type: 'QUANTITATIVE', dataKey: 'ghg' },
      { name: 'Fleet Fuel Consumption / Percentage Renewal', type: 'QUANTITATIVE', dataKey: 'ghg_fleet' },
      { name: 'Plans for Short-Term / Long-Term Carbon Emission Management', type: 'ANALYSIS' }
    ]
  },
  'energy': {
    title: 'Energy Management', icon: Zap,
    subMetrics: [
      { name: 'Operational Energy Consumed', type: 'QUANTITATIVE', dataKey: 'energy' },
      { name: 'Percentage Grid Electricity', type: 'QUANTITATIVE', dataKey: 'energy_grid' },
      { name: 'Percentage Renewable', type: 'QUANTITATIVE', dataKey: 'energy_renewable' }
    ]
  },
  'water': {
     title: 'Water Management', icon: Droplet,
     subMetrics: [
      { name: 'Total Water Usage', type: 'QUANTITATIVE', dataKey: 'water' },
      { name: 'No. of Areas of Non-Compliance', type: 'QUANTITATIVE', dataKey: 'water_noncompliance' },
      { name: 'Plans for Mitigating Water Management Risks', type: 'ANALYSIS' }
     ]
  },
  'food': {
    title: 'Food Safety', icon: Utensils,
    subMetrics: [
      { name: 'Global Food Safety Initiative (GFSI) Audit', type: 'QUANTITATIVE', dataKey: 'food_gfsi' },
      { name: 'Percentage of Agricultural Products', type: 'QUANTITATIVE', dataKey: 'food_agri' },
      { name: 'Food Recalled', type: 'QUANTITATIVE', dataKey: 'food_recalled_count' },
      { name: 'Amount of food recalled', type: 'QUANTITATIVE', dataKey: 'food_recalled_amount' }
    ]
  },
  'safety': {
    title: 'Workforce Health & Safety', icon: ShieldUser,
    subMetrics: [
      { name: 'Accidents Rate', type: 'QUANTITATIVE', dataKey: 'safety_rate' },
      { name: 'NUMBER OF RECORDABLE INCIDENT RATE (TRIR)', type: 'QUANTITATIVE', dataKey: 'safety_trir' },
      { name: 'FATALITY RATE', type: 'QUANTITATIVE', dataKey: 'safety_fatality' },
      { name: 'YEAR MISS FREQUENCY RATE (NMFR)', type: 'QUANTITATIVE', dataKey: 'safety_nmfr' }
    ]
  },
  'impact': {
    title: 'Environmental & Social Impacts', icon: Earth,
    subMetrics: [
      { name: 'Percentage of Agricultural Products', type: 'QUANTITATIVE', dataKey: 'impact_agri' },
      { name: 'Farmers Social & Environmental Responsibility Audit', type: 'QUANTITATIVE', dataKey: 'impact_audit' },
      { name: 'Plans for Environmental & Social Risks', type: 'ANALYSIS' }
    ]
  },
  'sourcing': {
    title: 'Ingredient Sourcing', icon: Wheat,
    subMetrics: [
      { name: 'Percentage of Agricultural Products', type: 'QUANTITATIVE', dataKey: 'sourcing_agri' },
      { name: 'Principal Crops & Climate Change Risks & Opportunities', type: 'ANALYSIS' }
    ]
  }
};

// --- 4. DATA GENERATION FUNCTION ---
const generateInitialMetrics = () => {
  const data = {};
  for (const key in ALL_METRIC_DATA_DEFINITIONS) {
    const def = ALL_METRIC_DATA_DEFINITIONS[key];
    const max = def.defaultMax;
    let value;
    
    if (max === 0) {
      value = 0;
    } else if (def.decimals === 0) {
      value = Math.floor(Math.random() * (max + 1));
    } else {
      value = parseFloat((Math.random() * max).toFixed(def.decimals));
    }
    
    data[key] = { value, max, unit: def.unit, decimals: def.decimals };
  }
  return data;
};


// --- COMPONENT START ---
const DashboardPage = () => {
  const [isProUser] = useState(false); 
  const navigate = useNavigate();
  const location = useLocation(); 
  const [metrics, setMetrics] = useState(null); 
  const [showProModal, setShowProModal] = useState(false);
  const [activeMetricId, setActiveMetricId] = useState(null);

  // --- useEffect to load or generate metrics data ---
  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      navigate('/signup'); 
      return;
    }
    
    const allMetricsData = JSON.parse(localStorage.getItem('metricsData_v2')) || {};
    let userMetrics = allMetricsData[currentUserId];

    if (!userMetrics || !userMetrics.metricList) {
      navigate('/company-info'); 
      return;
    }
    
    if (!userMetrics.data) {
      userMetrics.data = generateInitialMetrics();
      allMetricsData[currentUserId] = userMetrics;
      localStorage.setItem('metricsData_v2', JSON.stringify(allMetricsData));
    }

    setMetrics(userMetrics);
    
    if (userMetrics.metricList && userMetrics.metricList.length > 0) {
      setActiveMetricId(userMetrics.metricList[0]);
    }

  }, [navigate]); 
  
  const handleSparkleClick = () => {
    if (isProUser) {
      alert("AI Feature placeholder!");
    } else {
      setShowProModal(true);
    }
  };

  // --- Loading state ---
  if (!metrics) {
    return (
      <div className="container">
        <div className="sidebar"> 
          <div className="sidebar-top">
            <img src={logoPath} alt="Logo" width="48" style={{ margin: 0, padding: 0, display: 'block' }}/>
          </div>
        </div>
        <div className="content-section-main">
          <div className="content-container-main" style={{padding: '2rem'}}>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter metrics to show based on user's list
  const metricsToShow = metricDefinitions.filter(m => 
    metrics.metricList.includes(m.id)
  );

  // Get the breakdown data template for the active metric
  const activeBreakdownTemplate = activeMetricId ? METRIC_BREAKDOWN_DATA[activeMetricId] : null;

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
            <h1>Dashboard</h1>
            <p className = "medium-regular">Overview of your industry metrics.</p>
          </div>
          
          <div className = "sub-header" style={{ display: 'flex', alignItems: 'stretch' }}>
            <div className = "header-col">
              <p className='descriptor-medium'>Key Metrics</p>
              <p style = {{color: "rgba(var(--greys), 1)"}}>
                Showing {metricsToShow.length} of {metricsToShow.length} metrics
              </p>
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
          
          {/* --- Metrics Container --- */}
          <div className = "metrics-container">
            {metricsToShow.map((metric) => {
              const metricDef = ALL_METRIC_DATA_DEFINITIONS[metric.id];
              const metricData = metrics.data[metric.id]; 
              if (!metricData || !metricDef) return null; 

              const { value, max, unit } = metricData;
              const { decimals } = metricDef;

              // --- CALCULATION IS STILL DONE ---
              const percentage = max > 0 ? (value / max) * 100 : 0;
              
              const displayValue = `${value} ${unit}`;
              const formattedMax = max.toFixed(decimals);
              const displayMax = `${formattedMax} ${unit}`;
              
              return (
                <div 
                  className={`metrics-card ${activeMetricId === metric.id ? 'active' : ''}`} 
                  key={metric.id}
                >
                  <div className="metrics-card-header">
                    {React.createElement(metric.icon)} 
                    <p className='medium-bold' style={{ color: 'rgba(var(--primary) ,1)' }}>{metric.name}</p>
                  </div>
                  <div className="metrics-content">
                    <p className="medium-bold">{displayValue}</p>
                    {/* --- REMOVED: Progress Bar & Percentage --- */}
                    <div className="progress-bar-metrics small-regular" style={{ color: 'rgba(var(--greys) ,1)' }}>
                      {/* <p>{displayMax}</p> */}
                      {/* <p>{percentage.toFixed(1)}%</p> --- REMOVED --- */}
                    </div>
                    {/* <div className="progress-bar"> ... </div> --- REMOVED --- */}
                  </div>
                  <div className='logo-animation' style={{marginTop: 'auto'}}>
                    <button 
                      className={`icon ${activeMetricId === metric.id ? 'active' : ''}`}
                      onClick={() => setActiveMetricId(metric.id)}
                    >
                      <ArrowRight />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {/* --- "Pro" card --- */}
            <div 
              className="metrics-card pro-metrics"
              onClick={!isProUser ? handleSparkleClick : undefined}
              style={!isProUser ? { cursor: 'pointer' } : {}}
            >
              <div className = "metrics-card-header" style = {{color: 'rgba(var(--blacks) ,0.5)', opacity: 0.6}}>
                <Dna />
                <p className='medium-bold'>GMO Management</p>
              </div>
              <div className = "metrics-content" style={{opacity: 0.6}}>
                <p className = "medium-bold" style = {{color: 'rgba(var(--blacks) ,0.3)'}}>Analysis</p>
                <p>Unlock CarbonX Pro to get your analysis!</p>
              </div>
              <div className='logo-animation' style={{marginTop: 'auto'}}>
                <button 
                  className="icon" 
                  onClick={handleSparkleClick}
                  style={!isProUser ? { backgroundColor: 'rgba(var(--greys), 0.2)' } : {}}
                >
                  <ArrowRight />
                </button>
              </div>
            </div> {/* End Pro Card */}

          </div> {/* End Metrics Container */}

          <div className="sub-header">
            <div className="header-col">
              <p className="descriptor-medium">Metric Breakdown</p>
            </div>
          </div>

          {/* --- METRIC BREAKDOWN SECTION --- */}
          <div>
            {activeBreakdownTemplate ? (
              <div className="metric-breakdown-card">
                <div className="metrics-card-header large-bold" style={{color: 'rgba(var(--primary), 1)'}}>
                  {React.createElement(activeBreakdownTemplate.icon, { size: 24 })}
                  <p>{activeBreakdownTemplate.title}</p>
                </div>
                <div className="metric-breakdown-list">
                  
                  {activeBreakdownTemplate.subMetrics.map((sub) => {
                    
                    let dynamicData = null;
                    if (sub.type === 'QUANTITATIVE') {
                      dynamicData = metrics.data[sub.dataKey];
                    }

                    let displayValue = '';
                    let displayPercent = '';
                    if (dynamicData) {
                      const { value, max, unit, decimals } = dynamicData;
                      const formattedMax = max.toFixed(decimals);
                      displayValue = `${value} / ${formattedMax} ${unit}`;
                      const percent = (max > 0) ? (value / max) * 100 : 0;
                      displayPercent = `${percent.toFixed(1)}%`;
                    }

                    const isAnalysis = sub.type === 'ANALYSIS';
                    const rowStyle = {
                      borderBottom: '1px solid rgba(var(--greys), 0.2)',
                      padding: '1rem',
                      opacity: isAnalysis ? '0.6' : '1', 
                      cursor: isAnalysis ? 'pointer' : 'default',
                    };

                    return (
                      <div 
                        className="sub-metric-row" 
                        style={rowStyle}
                        key={sub.name}
                        onClick={isAnalysis ? () => setShowProModal(true) : undefined}
                      >
                        <div className="sub-metric-info" style={{width: '100%'}}>
                          
                          {/* Line 1: Name and Type */}
                          <div className="input-group-row" style={{ alignItems: 'center' }}>
                            <p className="medium-bold">{sub.name}</p>
                            <p className="descriptor-medium" style={{color: "rgba(var(--greys), 1)", letterSpacing: '0.1em'}}>
                              {sub.type}
                            </p>
                          </div>
                          
                          {sub.type === 'QUANTITATIVE' ? (
                            <>
                              {/* Line 2: Value and Percent */}
                              <div className="input-group-row" style={{ alignItems: 'center', marginTop: '0.25rem' }}>
                                <p className="normal-regular">{displayValue}</p>
                                <p className="normal-regular">{displayPercent}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Analysis Row Text */}
                              <p 
                                className="normal-regular" 
                                style={{marginTop: '0.25rem'}}
                              >
                                Unlock CarbonX Pro to get your analysis!
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            ) : null }
          </div>
          
        </div> {/* End content-container-main */}
      </div> {/* End content-section-main */}

      {/* --- Pro Modal --- */}
      {showProModal && (
        <div className="modal-overlay active" onClick={() => setShowProModal(false)}>
          <div className="modal-content pro-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal-btn" style={{ width: '100%', textAlign: 'right' }} onClick={() => setShowProModal(false)}><X /></button>
            <div>
              <Sparkles size={48} color="rgba(var(--secondary), 1)" />
            </div>
            
            <p className='large-bold'>Get CarbonX Pro</p>
            
            <div className="group-pro-modal">
              <p className="normal-regular">What you will get:</p>
              
              <ul className="pro-features-list">
                <li><CircleCheck size={20} /><span>Cloud Hosting</span></li>
                <li><CircleCheck size={20} /><span>Access to Report Generator & AI Functionalities</span></li>
                <li><CircleCheck size={20} /><span>Limited access to Marketplace Community</span></li>
                <li><CircleCheck size={20} /><span>Increase your team size to 5</span></li>
                <li><CircleCheck size={20} /><span>IT Support</span></li>
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