import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import logoPath from '../../assets/carbonx.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Utensils, Leaf, Droplet, ArrowRight, Zap, X, 
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, Sparkles, CircleCheck,
  ShieldUser, Wheat, Earth, Dna, Plus,
  Database, 
  Car, 
  Recycle, 
  ShieldAlert, 
  HeartPulse, 
  Tags, 
  Users, 
  Globe, 
  Lock
} from 'lucide-react';

// --- API CONFIGURATION ---
const API_BASE = 'http://localhost:8080/api';

// --- 1. METRIC DEFINITIONS ---
const allMetricDefinitions = [
  { id: 'fleet-fuel-management', name: 'Fleet Fuel Management', icon: Car },
  { id: 'energy-management', name: 'Energy Management', icon: Zap },
  { id: 'food-waste-management', name: 'Food Waste Management', icon: Recycle },
  { id: 'data-security', name: 'Data Security', icon: ShieldAlert },
  { id: 'food-safety', name: 'Food Safety', icon: Utensils },
  { id: 'product-health-nutrition', name: 'Product Health & Nutrition', icon: HeartPulse },
  { id: 'product-labelling-marketing', name: 'Product Labelling & Marketing', icon: Tags },
  { id: 'labour-practices', name: 'Labour Practices', icon: Users },
  { id: 'supply-chain-impacts', name: 'Management of Env. & Social Impacts', icon: Globe },
  // RESTORED: set isPro to true
  { id: 'gmo', name: 'GMO Management', icon: Dna, isPro: true }, 
];

// --- 2. MASTER LIST OF ALL DATA (Based on SASB codes) ---
const ALL_METRIC_DATA_DEFINITIONS = {
  'TOTAL_GHG': { defaultMax: 100000, decimals: 3, unit: 'kgCO2e' },
  'CALC_TRANSPORT_GHG': { defaultMax: 50000, decimals: 3, unit: 'kgCO2e' },
  
  // Energy
  'FB-FR-130a.1': { defaultMax: 50000.0, decimals: 2, unit: 'Gigajoules (GJ)' },

  // Fleet Fuel
  'FB-FR-110a.1': { defaultMax: 10000.0, decimals: 2, unit: 'Gigajoules (GJ)' },

  // Food Waste
  'FB-FR-250a.1': { staticValue: 'User Input', unit: 'Metric tonnes (t)' },

  // Data Security
  'FB-FR-230a.1': { staticValue: 'User Input', unit: '' },
  'FB-FR-230a.2': { staticValue: 'User Input', unit: '' },
  'FB-FR-230a.3': { staticValue: 'User Input', unit: '' },

  // Food Safety
  'FB-FR-250b.1': { staticValue: 'User Input', unit: '' },
  'FB-FR-250b.2': { staticValue: 'User Input', unit: '' },
  'FB-FR-250b.3': { staticValue: 'User Input', unit: '' },

  // Product Health & Nutrition
  'FB-FR-260a.1': { staticValue: 'User Input', unit: '' },
  'FB-FR-260a.2': { staticValue: 'User Input', unit: '' },

  // Product Labelling
  'FB-FR-270a.1': { staticValue: 'User Input', unit: '' },
  'FB-FR-270a.2': { staticValue: 'User Input', unit: '' },

  // Labour Practices
  'FB-FR-330a.1': { staticValue: 'User Input', unit: '' },
  'FB-FR-330a.2': { staticValue: 'User Input', unit: '' },
  'FB-FR-330a.3': { staticValue: 'User Input', unit: '' },
  'FB-FR-330a.4': { staticValue: 'User Input', unit: '' },
  'FB-FR-330a.5': { staticValue: 'User Input', unit: '' },
  'FB-FR-330a.6': { staticValue: 'User Input', unit: '' },

  // Supply Chain / ESG
  'FB-FR-430a.1': { staticValue: 'User Input', unit: '' },
  'FB-FR-430a.2': { staticValue: 'User Input', unit: '' },
  'FB-FR-430a.3': { staticValue: 'User Input', unit: '' },
  'FB-FR-430a.4': { staticValue: 'User Input', unit: '' },
  
  // GMO
  'FB-FR-430b.1': { defaultMax: 100.0, decimals: 1, unit: 'Percentage (%)' },
};

// --- 3. BREAKDOWN TEMPLATE ---
const METRIC_BREAKDOWN_DATA = {
  'fleet-fuel-management': {
    title: 'Fleet Fuel Management', icon: Car,
    subMetrics: [
      { 
        name: 'Calculated Transport Emissions (from Inventory)', 
        type: 'Quantitative', 
        dataKey: 'CALC_TRANSPORT_GHG', 
        sasbCategory: 'Inventory Calculation',
        scope3Category: 'Category 4: Upstream transportation & distribution'
      },
      { 
        name: 'Fleet fuel consumed, percentage renewable', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-110a.1',
        sasbCategory: 'Transport & Energy Management',
        scope3Category: 'Category 4: Upstream transportation & distribution'
      },
    ]
  },
  'energy-management': {
    title: 'Energy Management', icon: Zap,
    subMetrics: [
      { 
        name: '(1) Operational energy consumed, (2) percentage grid electricity, (3) percentage renewable', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-130a.1',
        sasbCategory: 'Energy Management',
        scope3Category: 'Category 3: Fuel- and energy-related activities'
      },
    ]
  },
  'food-waste-management': {
    title: 'Food Waste Management', icon: Recycle,
    subMetrics: [
      { 
        name: '(1) Amount of food waste generated, (2) percentage diverted from the waste stream', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-250a.1',
        sasbCategory: 'Waste Management',
        scope3Category: 'Category 5: Waste generated in operations'
      },
    ]
  },
  'data-security': {
    title: 'Data Security', icon: ShieldAlert,
    subMetrics: [
      { 
        name: '(1) Number of data breaches, (2) percentage that are instances of identity theft', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-230a.1',
        sasbCategory: 'Customer Privacy',
        scope3Category: 'NA'
      },
      { 
        name: 'Number of customers affected', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-230a.2',
        sasbCategory: 'Customer Privacy',
        scope3Category: 'NA'
      },
      { 
        name: 'Description of approach for addressing data security risks', 
        type: 'Discussion and Analysis', 
        dataKey: 'FB-FR-230a.3',
        sasbCategory: 'Customer Privacy',
        scope3Category: 'NA'
      },
    ]
  },
  'food-safety': {
    title: 'Food Safety', icon: Utensils,
    subMetrics: [
      { 
        name: 'Fines and warning rate / violation rate', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-250b.1',
        sasbCategory: 'Product Safety',
        scope3Category: 'NA'
      },
      { 
        name: 'Number of recalls', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-250b.2',
        sasbCategory: 'Product Safety',
        scope3Category: 'NA'
      },
      { 
        name: 'Percentage of recalls related to private-label products', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-250b.3',
        sasbCategory: 'Product Safety',
        scope3Category: 'NA'
      },
    ]
  },
  'product-health-nutrition': {
    title: 'Product Health & Nutrition', icon: HeartPulse,
    subMetrics: [
      { 
        name: 'Discussion of the process to identify and manage products and ingredients linked to nutritional and health concerns', 
        type: 'Discussion and Analysis', 
        dataKey: 'FB-FR-260a.1',
        sasbCategory: 'Product Health & Nutrition',
        scope3Category: 'NA'
      },
      { 
        name: 'Number of incidents of non-compliance with health/safety regulations', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-260a.2',
        sasbCategory: 'Product Health & Nutrition',
        scope3Category: 'NA'
      },
    ]
  },
  'product-labelling-marketing': {
    title: 'Product Labelling & Marketing', icon: Tags,
    subMetrics: [
      { 
        name: 'Number of incidents of non-compliance with labelling regulations', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-270a.1',
        sasbCategory: 'Labelling & Marketing',
        scope3Category: 'NA'
      },
      { 
        name: 'Total amount of legal action fines as a result of legal proceedings associated with advertising and labelling practices', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-270a.2',
        sasbCategory: 'Labelling & Marketing',
        scope3Category: 'NA'
      },
    ]
  },
  'labour-practices': {
    title: 'Labour Practices', icon: Users,
    subMetrics: [
      { 
        name: 'Revenue from products derived from genetically modified organisms (GMOs)', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-330a.1', 
        sasbCategory: 'Employee Engagement',
        scope3Category: 'NA'
      },
      { 
        name: '(1) Average hourly wage and (2) percentage of in-store/distribution centre employees... average hourly wage', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-330a.2',
        sasbCategory: 'Wages & Benefits',
        scope3Category: 'NA'
      },
      { 
        name: 'Percentage of... average hourly wage, by region', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-330a.3',
        sasbCategory: 'Wages & Benefits',
        scope3Category: 'NA'
      },
      { 
        name: 'Percentage of active employees covered under collective bargaining agreements', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-330a.4',
        sasbCategory: 'Labor Relations',
        scope3Category: 'NA'
      },
      { 
        name: 'Number of work stoppage days', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-330a.5',
        sasbCategory: 'Labor Relations',
        scope3Category: 'NA'
      },
      { 
        name: 'Total amount of legal action fines as a result of legal proceedings associated with (1) labour law violations and (2) workplace discrimination', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-330a.6',
        sasbCategory: 'Labor Relations',
        scope3Category: 'NA'
      },
    ]
  },
  'supply-chain-impacts': {
    title: 'Management of Env. & Social Impacts', icon: Globe,
    subMetrics: [
      { 
        name: 'Revenue from products that promote sustainable sourcing', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-430a.1',
        sasbCategory: 'Supply-Chain Management',
        scope3Category: 'Category 1: Purchased goods & services'
      },
      { 
        name: 'Percentage of revenue from (1) eggs that originated from a cage-free environment and (2) pork produced without the use of gestation crates', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-430a.2',
        sasbCategory: 'Animal Welfare / Supply Chain',
        scope3Category: 'Category 1: Purchased goods & services'
      },
      { 
        name: 'Discussion of strategy to manage environmental and social risks within the supply chain, including animal welfare', 
        type: 'Discussion and Analysis', 
        dataKey: 'FB-FR-430a.3',
        sasbCategory: 'Supply-Chain Management / Sourcing',
        scope3Category: 'NA'
      },
      { 
        name: 'Discussion of strategies to reduce the environmental impact of packaging', 
        type: 'Discussion and Analysis', 
        dataKey: 'FB-FR-430a.4',
        sasbCategory: 'Supply-Chain Management / Sourcing',
        scope3Category: 'Category 12: End-of-life treatment of sold products'
      },
    ]
  },
  'gmo': {
    title: 'GMO Management', icon: Dna,
    subMetrics: [
      { 
        name: 'Revenue from products derived from genetically modified organisms (GMOs)', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-430b.1',
        sasbCategory: 'Product Sourcing & Labelling',
        scope3Category: 'Category 1: Purchased goods & services'
      },
    ]
  },
};

// --- 4. DATA INITIALIZATION ---
const generateInitialMetrics = () => {
  const data = {};
  for (const key in ALL_METRIC_DATA_DEFINITIONS) {
    const def = ALL_METRIC_DATA_DEFINITIONS[key];
    // Default to null if not static; use static value if present (e.g., 'User Input')
    data[key] = { 
      value: def.staticValue || null, 
      unit: def.unit, 
      decimals: def.decimals 
    };
  }
  return data;
};

// --- COMPONENT START ---
const DashboardPage = () => {
  // FIXED: Standardized to === 'true'
  const [isProUser] = useState(localStorage.getItem('isProUser') === 'true'); 
  const navigate = useNavigate();
  const location = useLocation(); 
  const [metrics, setMetrics] = useState(null); 
  const [showProModal, setShowProModal] = useState(false);
  const [activeMetricId, setActiveMetricId] = useState(null);
  const [hasProducts, setHasProducts] = useState(false);

  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      navigate('/signup'); 
      return;
    }
    
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${API_BASE}/dashboard/summary/${currentUserId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const summaryData = await response.json();
        setHasProducts(summaryData.productCount > 0);

        const baseData = generateInitialMetrics();

        // 2. Inject Real Transport GHG
        const transportEmissions = summaryData.transportEmissions || 0;
        if (baseData['CALC_TRANSPORT_GHG']) {
          baseData['CALC_TRANSPORT_GHG'].value = transportEmissions.toFixed(3);
        }

        // --- 3. Correlate Fleet Fuel with Transport Emissions ---
        // If we have transport emissions, calculate correlated fuel usage for the breakdown
        // Assumption: 1 kgCO2e approx 0.014 GJ (Diesel) -> arbitrary correlation for demo
        if (baseData['FB-FR-110a.1']) {
           const correlatedFuel = transportEmissions * 15;
           // Only update if it's non-zero, otherwise keep null or 0
           if (transportEmissions > 0) {
             baseData['FB-FR-110a.1'].value = correlatedFuel.toFixed(2);
           }
        }

        // --- 4. INJECT ENERGY DATA ---
        // Populate the data key so it appears in BOTH the card and breakdown
        if (baseData['FB-FR-130a.1']) {
            baseData['FB-FR-130a.1'].value = "1.00";
        }

        // --- FIX: FORCE DEMO METRICS IF EMPTY ---
        // REMOVED 'total-ghg-emissions' from this list
        let activeMetricList = summaryData.activeMetrics || [];
        if (activeMetricList.length < 2) {
           activeMetricList = [
            "fleet-fuel-management",
            "energy-management",
            "food-waste-management",
            "data-security",
            "food-safety",
            "product-health-nutrition",
            "product-labelling-marketing",
            "labour-practices",
            "supply-chain-impacts",
            "gmo"
           ];
        }

        const finalMetrics = {
          metricList: activeMetricList,
          data: baseData,
          topContributors: summaryData.topContributors
        };

        setMetrics(finalMetrics);

        if (activeMetricList.length > 0) {
          setActiveMetricId(prevId => prevId || activeMetricList[0]);
        }

      } catch (error) {
        console.error("Error loading dashboard:", error);
      }
    };

    fetchDashboardData();

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
  
  // --- SIDEBAR JSX (Reusable) ---
  const Sidebar = () => (
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
  );

  const metricsForIndustry = allMetricDefinitions.filter(m => 
    metrics.metricList.includes(m.id)
  );
  
  const activeBreakdownTemplate = activeMetricId ? METRIC_BREAKDOWN_DATA[activeMetricId] : null;

  const getTopLevelData = (metricId) => {
    const breakdown = METRIC_BREAKDOWN_DATA[metricId];
    if (!breakdown || !metrics) return { displayValue: 'N/A', hasData: false };

    // 1. FLEET / TRANSPORT
    if (metricId === 'fleet-fuel-management') {
      const metricData = metrics.data['CALC_TRANSPORT_GHG']; 
      if (metricData && metricData.value !== null && parseFloat(metricData.value) > 0) {
         return { displayValue: `${metricData.value} ${metricData.unit}`, hasData: true };
      }
      return { displayValue: 'N/A', hasData: false };
    }

    // 2. ENERGY (Now uses the same data key as breakdown)
    if (metricId === 'energy-management') {
        const metricData = metrics.data['FB-FR-130a.1'];
        if (metricData && metricData.value) {
            return { displayValue: `${metricData.value} ${metricData.unit}`, hasData: true };
        }
    }

    // 3. GENERIC METRICS (Including User Inputs)
    // Check for quantitative first
    const firstQuantMetric = breakdown.subMetrics.find(sub => sub.type === 'Quantitative');
    if (firstQuantMetric) {
      const metricData = metrics.data[firstQuantMetric.dataKey];
      
      // If it's explicitly "User Input", show that
      if (metricData && metricData.value === 'User Input') {
         return { displayValue: 'User Input', hasData: true };
      }
      
      // Otherwise show number if valid
      if (metricData && metricData.value !== null) {
         return { displayValue: `${metricData.value} ${metricData.unit}`, hasData: true };
      }
    }
    
    // Check Analysis
    const firstAnalysisMetric = breakdown.subMetrics.find(sub => sub.type === 'Discussion and Analysis');
    if (firstAnalysisMetric) {
       const metricData = metrics.data[firstAnalysisMetric.dataKey];
       if (metricData && metricData.value) {
         return { displayValue: metricData.value, hasData: true };
       }
    }
    
    return { displayValue: 'N/A', hasData: false };
  };

  return (
    <div className="container">
      <Sidebar />

      <div className="content-section-main">
        <div className="content-container-main"> 
          
          <div className="header-group">
            <h1>Dashboard</h1>
            <p className = "medium-regular">Overview of your industry metrics.</p>
          </div>
          
          <div className = "sub-header" style={{ display: 'flex', alignItems: 'stretch' }}>
            <div className = "header-col">
              <p className='descriptor-medium'>Key Metrics</p>
              {hasProducts ? (
                <p style = {{color: "rgba(var(--greys), 1)"}}>
                  Showing {metricsForIndustry.length} of {allMetricDefinitions.length} metrics
                </p>
              ) : (
                <p style = {{color: "rgba(var(--greys), 1)"}}>
                  No products added yet.
                </p>
              )}
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
          
          <div className = "metrics-container">
            {hasProducts ? (
              <>
                {metricsForIndustry.map((metric) => {
                  // RESTORED: Lock Logic Logic
                  const isLocked = metric.isPro && !isProUser;
                  const { displayValue, hasData } = getTopLevelData(metric.id);
                  
                  if (isLocked) {
                    return (
                      <div 
                        className="metrics-card pro-metrics"
                        key={metric.id}
                        onClick={handleSparkleClick}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className = "metrics-card-header" style = {{color: 'rgba(var(--blacks) ,0.5)', opacity: 0.6}}>
                          {React.createElement(metric.icon, { 
                              size: 24, 
                              strokeWidth: 1.5,
                              color: 'rgba(var(--blacks), 0.5)' 
                          })} 
                          <p className='medium-bold'>{metric.name}</p>
                        </div>
                        <div className = "metrics-content" style={{opacity: 0.6}}>
                          <p className = "medium-bold" style = {{color: 'rgba(var(--blacks) ,0.3)'}}>Analysis</p>
                          <p>Unlock CarbonX Pro to get your analysis!</p>
                        </div>
                        <div className='logo-animation' style={{marginTop: 'auto'}}>
                          <button 
                            className="icon"
                            onClick={handleSparkleClick}
                            style={{ backgroundColor: 'rgba(var(--greys), 0.2)', color: 'rgba(var(--secondary), 1)' }}
                          >
                            <Lock size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div 
                      className={`metrics-card ${activeMetricId === metric.id ? 'active' : ''}`} 
                      key={metric.id}
                    >
                      <div className="metrics-card-header">
                        {/* Pass size, strokeWidth, and color here */}
                        {React.createElement(metric.icon, { 
                            size: 24, 
                            strokeWidth: 1.5,
                            color: 'rgba(var(--primary), 1)' 
                        })} 
                        <p className='medium-bold' style={{ color: 'rgba(var(--primary) ,1)' }}>{metric.name}</p>
                      </div>
                      <p className="medium-bold">{displayValue.trim()}</p>

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
              </>
            ) : (
              <p className="dashboard-empty-text">
                Please add a product into inventory to see your key metrics.
              </p>
            )}
          </div>

          <div className="sub-header">
            <div className="header-col">
              <p className="descriptor-medium">Metric Breakdown</p>
            </div>
          </div>

          {/* --- METRIC BREAKDOWN SECTION --- */}
          <div>
            {hasProducts ? (
              activeBreakdownTemplate ? (
                <div className="metric-breakdown-card">
                  <div className="metrics-card-header large-bold" style={{color: 'rgba(var(--primary), 1)'}}>
                    {React.createElement(activeBreakdownTemplate.icon, { size: 24 })}
                    <p>{activeBreakdownTemplate.title}</p>
                  </div>
                  <div className="metric-breakdown-list">
                    
                    {activeBreakdownTemplate.subMetrics.map((sub) => {
                      
                      const isAnalysis = sub.type === 'Discussion and Analysis';
                      let displayValue = '';
                      
                      if (isAnalysis) {
                        const metricData = metrics.data[sub.dataKey];
                        displayValue = (metricData && metricData.value) || '(require input from company)';
                      } else {
                        const metricData = metrics.data[sub.dataKey];
                        if (metricData) {
                          if (metricData.value === 'User Input') {
                             displayValue = 'User Input';
                          } else if (metricData.value !== null) {
                            const { value, unit } = metricData;
                            displayValue = `${value} ${unit}`;
                          } else {
                            displayValue = 'N/A';
                          }
                        }
                      }
                      
                      const rowStyle = {
                        borderBottom: '1px solid rgba(var(--greys), 0.2)',
                        padding: '1rem',
                        opacity: isAnalysis && !isProUser ? '0.6' : '1', 
                        cursor: isAnalysis && !isProUser ? 'pointer' : 'default',
                      };

                      return (
                        <div 
                          className="sub-metric-row" 
                          style={rowStyle}
                          key={sub.name}
                          onClick={isAnalysis && !isProUser ? () => setShowProModal(true) : undefined}
                        >
                          <div className="sub-metric-info" style={{width: '100%'}}>
                            <div className="input-group-row" style={{ alignItems: 'flex-start' }}>
                              <p className="medium-bold" style={{flex: 1}}>{sub.name}</p>
                              <p className="medium-bold" style={{color: "rgba(var(--primary), 1)", textAlign: 'right'}}>
                                {displayValue}
                              </p>
                            </div>
                            
                            <div className="metric-categories-col" style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {sub.sasbCategory && sub.sasbCategory !== 'NA' && (
                                <div>
                                  <p className="descriptor-medium" style={{color: "rgba(var(--greys), 1)"}}>SASB</p>
                                  <p className="nofmal-regular" style={{color: "rgba(var(--blacks), 1)"}}>{sub.sasbCategory}</p>
                                </div>
                              )}
                              {sub.scope3Category && sub.scope3Category !== 'NA' && (
                                <div>
                                  <p className="descriptor-medium" style={{color: "rgba(var(--greys), 1)"}}>Scope 3</p>
                                  <p className="normal-regular" style={{color: "rgba(var(--blacks), 1)"}}>{sub.scope3Category}</p>
                                </div>
                              )}
                            </div>

                            {isAnalysis && isProUser && (
                              <div className="analysis-content" style={{marginTop: '1rem'}}>
                                {sub.proContent ? (
                                  <>
                                    {sub.proContent.header ? (
                                      <div className="pro-analysis-content">
                                        <p className="normal-regular">{sub.proContent.header}</p>
                                        <ul className="pro-analysis-list">
                                          {sub.proContent.list.map((item, index) => (
                                            <li key={index} className="normal-regular">{item}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : (
                                      <div className="pro-analysis-content">
                                        {Array.isArray(sub.proContent) ? sub.proContent.map((item, index) => (
                                          <p key={index} className="normal-regular" style={index > 0 ? {marginTop: '0.5rem'} : {}}>
                                            {item}
                                          </p>
                                        )) : <p className="normal-regular">{String(sub.proContent)}</p>}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <p className="normal-regular" style={{fontStyle: 'italic'}}>
                                    (Pro analysis content for this metric is not yet available.)
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="dashboard-empty-text">Select a metric above to see the breakdown.</p>
              )
            ) : (
              <p className="dashboard-empty-text">
                Please add a product into inventory to see your key metrics.
              </p>
            )}
          </div>
          
        </div>
      </div>

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
            
            <button type="button" className="default" style={{ width: '100%' }} onClick={() => navigate('/settings')}>
              Get CarbonX Pro
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;