import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import logoPath from '../../assets/carbonx.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Utensils, Leaf, Droplet, ArrowRight, Zap, X, 
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, Sparkles, CircleCheck,
  ShieldUser, Wheat, Earth, Dna, Plus,
  Database, // --- NEW ICONS ---
  Car, // Fleet
  Recycle, // Food Waste
  ShieldAlert, // Data Security
  HeartPulse, // Product Health
  Tags, // Product Labelling
  Users, // Labour
  Globe, // Supply Chain
  Lock
} from 'lucide-react';

// --- 1. UPDATED: Metric cards are now based on TOPICS ---
const allMetricDefinitions = [
  { id: 'total-ghg-emissions', name: 'Total GHG Emissions', icon: Leaf, isPro: false }, // --- NEW ---
  { id: 'fleet-fuel-management', name: 'Fleet Fuel Management', icon: Car },
  { id: 'energy-management', name: 'Energy Management', icon: Zap },
  { id: 'food-waste-management', name: 'Food Waste Management', icon: Recycle },
  { id: 'data-security', name: 'Data Security', icon: ShieldAlert },
  { id: 'food-safety', name: 'Food Safety', icon: Utensils },
  { id: 'product-health-nutrition', name: 'Product Health & Nutrition', icon: HeartPulse },
  { id: 'product-labelling-marketing', name: 'Product Labelling & Marketing', icon: Tags },
  { id: 'labour-practices', name: 'Labour Practices', icon: Users },
  { id: 'supply-chain-impacts', name: 'Management of Env. & Social Impacts in the Supply Chain', icon: Globe },
  // --- Pro Metric ---
  { id: 'gmo', name: 'GMO Management', icon: Dna, isPro: true },
];

// --- 2. MASTER LIST OF ALL DATA (Based on SASB codes) ---
const ALL_METRIC_DATA_DEFINITIONS = {
  // --- NEW ---
  'TOTAL_GHG': { defaultMax: 100000, decimals: 3, unit: 'kgCO2e' },
  'CALC_TRANSPORT_GHG': { defaultMax: 50000, decimals: 3, unit: 'kgCO2e' },
  
  'FB-FR-110a.1': { defaultMax: 10000.0, decimals: 2, unit: 'Gigajoules (GJ)' },
  'FB-FR-130a.1': { defaultMax: 50000.0, decimals: 2, unit: 'Gigajoules (GJ)' },
  'FB-FR-250a.1': { defaultMax: 1000.0, decimals: 2, unit: 'Metric tonnes (t)' },
  'FB-FR-230a.1': { defaultMax: 5, decimals: 0, unit: 'Number' },
  'FB-FR-230a.2': { defaultMax: 0, decimals: 0, unit: 'Number' },
  'FB-FR-230a.3': { staticValue: '(require input from company)', unit: '' },
  'FB-FR-250b.1': { defaultMax: 10, decimals: 0, unit: 'Rate' },
  'FB-FR-250b.2': { defaultMax: 5, decimals: 0, unit: 'Number' },
  'FB-FR-250b.3': { defaultMax: 100, decimals: 1, unit: 'Percentage (%)' },
  'FB-FR-260a.1': { staticValue: '(require input from company)', unit: '' },
  'FB-FR-260a.2': { defaultMax: 0, decimals: 0, unit: 'Number' },
  'FB-FR-270a.1': { defaultMax: 0, decimals: 0, unit: 'Number' },
  'FB-FR-270a.2': { defaultMax: 0, decimals: 2, unit: 'Presentation Currency' },
  'FB-FR-330a.1': { defaultMax: 100, decimals: 1, unit: 'Percentage (%)' },
  'FB-FR-330a.2': { defaultMax: 30.0, decimals: 2, unit: 'Presentation Currency' },
  'FB-FR-330a.3': { defaultMax: 100.0, decimals: 1, unit: 'Percentage (%)' },
  'FB-FR-330a.4': { defaultMax: 100.0, decimals: 1, unit: 'Percentage (%)' },
  'FB-FR-330a.5': { defaultMax: 0, decimals: 0, unit: 'Number' },
  'FB-FR-330a.6': { defaultMax: 0, decimals: 2, unit: 'Presentation Currency' },
  'FB-FR-430a.1': { defaultMax: 100.0, decimals: 1, unit: 'Percentage (%)' },
  'FB-FR-430a.2': { defaultMax: 100.0, decimals: 1, unit: 'Percentage (%)' },
  'FB-FR-430a.3': { staticValue: '(require input from company)', unit: '' },
  'FB-FR-430a.4': { staticValue: '(require input from company)', unit: '' },
  'FB-FR-430b.1': { defaultMax: 100.0, decimals: 1, unit: 'Percentage (%)' },
};


// --- 3. BREAKDOWN TEMPLATE (Based on SASB) ---
const METRIC_BREAKDOWN_DATA = {
  'total-ghg-emissions': {
    title: 'Total GHG Emissions', icon: Leaf,
    subMetrics: [
      { 
        name: 'Total Product Carbon Footprint (Cradle-to-Gate)', 
        type: 'Quantitative', 
        dataKey: 'TOTAL_GHG',
        sasbCategory: 'Product Footprinting',
        scope3Category: 'Category 1: Purchased goods & services'
      },
    ]
  },
  'fleet-fuel-management': {
    title: 'Fleet Fuel Management', icon: Car,
    // --- UPDATED: Swapped order ---
    subMetrics: [
      { 
        name: 'Calculated Transport Emissions (from Inventory)', 
        type: 'Quantitative', 
        dataKey: 'CALC_TRANSPORT_GHG', // New key
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
    title: 'Management of Env. & Social Impacts in the Supply Chain', icon: Globe,
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

// --- 4. DATA GENERATION FUNCTION ---
const generateInitialMetrics = () => {
  const data = {};
  for (const key in ALL_METRIC_DATA_DEFINITIONS) {
    const def = ALL_METRIC_DATA_DEFINITIONS[key];
    const max = def.defaultMax;
    let value;
    
    if (def.staticValue) {
      value = def.staticValue;
    } else if (max === 0) {
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
  const [isProUser] = useState(localStorage.getItem('isProUser') === 'true'); 
  const navigate = useNavigate();
  const location = useLocation(); 
  const [metrics, setMetrics] = useState(null); 
  const [showProModal, setShowProModal] = useState(false);
  const [activeMetricId, setActiveMetricId] = useState(null);
  const [hasProducts, setHasProducts] = useState(false);

  // --- UPDATED: useEffect now calculates Total GHG ---
  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      navigate('/signup'); 
      return;
    }
    
    // Check for products
    const allProductData = JSON.parse(localStorage.getItem('productData')) || {};
    const userProducts = allProductData[currentUserId] || [];
    setHasProducts(userProducts.length > 0);

    // Get (or create) metrics data
    const allMetricsData = JSON.parse(localStorage.getItem('metricsData_v2')) || {};
    let userMetrics = allMetricsData[currentUserId];

    if (!userMetrics || !userMetrics.metricList) {
      navigate('/company-info'); 
      return;
    }
    
    if (!userMetrics.data) {
      userMetrics.data = generateInitialMetrics();
    }

    // --- THIS IS THE NEW LOGIC ---
    let totalLcaSum = 0;
    let totalTransportLcaSum = 0;
    
    userProducts.forEach(product => {
      // 1. Add to Total GHG
      totalLcaSum += product.lcaResult || 0;
      
      // 2. Add to Transport GHG
      try {
        const dpp = JSON.parse(product.dppData || '[]');
        dpp.forEach(component => {
          if (component.isTransport) {
            totalTransportLcaSum += component.lcaValue || 0;
          }
        });
      } catch (e) {
        console.error("Failed to parse dppData for GHG calculation", e);
      }
    });

    // 3. Overwrite the (possibly random) values with the real ones
    if (userMetrics.data['TOTAL_GHG']) {
      userMetrics.data['TOTAL_GHG'].value = totalLcaSum.toFixed(3);
    }
    
    // --- UPDATED: Inject calculated transport sum into its own metric ---
    if (userMetrics.data['CALC_TRANSPORT_GHG']) {
      userMetrics.data['CALC_TRANSPORT_GHG'].value = totalTransportLcaSum.toFixed(3);
    }
    // We NO LONGER overwrite 'FB-FR-110a.1'
    
    // --- END NEW LOGIC ---

    // Save the updated metrics (with correct GHG) back to localStorage
    allMetricsData[currentUserId] = userMetrics;
    localStorage.setItem('metricsData_v2', JSON.stringify(allMetricsData));

    // Set the final, correct metrics to state
    setMetrics(userMetrics);
    
    if (userMetrics.metricList && userMetrics.metricList.length > 0) {
      setActiveMetricId(userMetrics.metricList[0]);
    }

  }, [navigate]); // Re-runs every time Dashboard is loaded
  
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

  // --- UPDATED: Filter logic ---
  // Get all metric definitions that are in the user's metricList
  const metricsForIndustry = allMetricDefinitions.filter(m => 
    metrics.metricList.includes(m.id)
  );
  
  const activeBreakdownTemplate = activeMetricId ? METRIC_BREAKDOWN_DATA[activeMetricId] : null;

  // --- UPDATED: getTopLevelData ---
  const getTopLevelData = (metricId) => {
    const breakdown = METRIC_BREAKDOWN_DATA[metricId];
    if (!breakdown || !metrics) return { displayValue: 'N/A' };

    // --- Special case for Total GHG (Calculated) ---
    if (metricId === 'total-ghg-emissions') {
      const metricData = metrics.data['TOTAL_GHG'];
      if (!metricData) return { displayValue: 'N/A' };
      return { displayValue: `${metricData.value} ${metricData.unit}` };
    }

    // --- NEW SPECIAL CASE for Fleet Fuel (Dummy) ---
    if (metricId === 'fleet-fuel-management') {
      const metricData = metrics.data['FB-FR-110a.1']; // Get the dummy GJ value
      if (!metricData) return { displayValue: 'N/A' };
      return { displayValue: `${metricData.value} ${metricData.unit}` };
    }
    // --- END NEW ---

    // Find the first quantitative sub-metric to display (for all *other* cards)
    const firstQuantMetric = breakdown.subMetrics.find(sub => sub.type === 'Quantitative');
    
    if (firstQuantMetric) {
      const metricData = metrics.data[firstQuantMetric.dataKey];
      if (!metricData) return { displayValue: 'N/G' };
      const { value, unit } = metricData;
      return { displayValue: `${value} ${unit}` };
    }
    
    // If no quantitative, find the first analysis one
    const firstAnalysisMetric = breakdown.subMetrics.find(sub => sub.type === 'Discussion and Analysis');
    if (firstAnalysisMetric) {
       const metricData = metrics.data[firstAnalysisMetric.dataKey];
       return { displayValue: metricData ? metricData.value : '(require input from company)' };
    }
    
    return { displayValue: 'N/A' };
  };

  return (
    <div className="container">
      <Sidebar /> {/* Reuse sidebar */}

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
              {hasProducts ? (
                <p style = {{color: "rgba(var(--greys), 1)"}}>
                  {/* --- FIXED: This text is now correct --- */}
                  Showing {metricsForIndustry.length} of {metricsForIndustry.length} metrics
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
          
          {/* --- Metrics Container --- */}
          <div className = "metrics-container">
            {hasProducts ? (
              <>
                {/* --- UPDATED: Map over the single, combined list --- */}
                {metricsForIndustry.map((metric) => {
                  
                  // --- NEW: Check if this is a locked pro metric ---
                  const isLocked = metric.isPro && !isProUser;

                  if (isLocked) {
                    // --- Render the "Locked Pro Card" ---
                    return (
                      <div 
                        className="metrics-card pro-metrics"
                        key={metric.id}
                        onClick={handleSparkleClick}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className = "metrics-card-header" style = {{color: 'rgba(var(--blacks) ,0.5)', opacity: 0.6}}>
                          {React.createElement(metric.icon)} 
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

                  // --- Render the normal, active card ---
                  const { displayValue } = getTopLevelData(metric.id); 
                  
                  return (
                    <div 
                      className={`metrics-card ${activeMetricId === metric.id ? 'active' : ''}`} 
                      key={metric.id}
                    >
                      <div className="metrics-card-header">
                        {React.createElement(metric.icon)} 
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
              // --- NEW: Empty text ---
              <p className="dashboard-empty-text">
                Please add a product into inventory to see your key metrics.
              </p>
            )}
          </div> {/* End Metrics Container */}

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
                          const { value, unit } = metricData;
                          // --- UPDATED (Task 3): Removed /max ---
                          displayValue = `${value} ${unit}`;
                        } else {
                          displayValue = 'N/A';
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
                            
                            {/* Line 1: Name and Value */}
                            <div className="input-group-row" style={{ alignItems: 'flex-start' }}>
                              <p className="medium-bold" style={{flex: 1}}>{sub.name}</p>
                              <p className="medium-bold" style={{color: "rgba(var(--primary), 1)", textAlign: 'right'}}>
                                {displayValue}
                              </p>
                            </div>
                            
                            {/* --- UPDATED (Task 1 & 2): New SASB/Scope 3 formatting --- */}
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

                            {/* --- UPDATED (Task 4): Pro Content for Analysis --- */}
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
                <p className="dashboard-empty-text" style={{ padding: '2rem 0' }}>
                  Please select a metric card to see its breakdown.
                </p>
              )
            ) : (
              <p className="dashboard-empty-text" style={{ padding: '2rem 0' }}>
                Your metric breakdown will appear here once you add a product.
              </p>
            )}
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