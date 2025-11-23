import React, { useState, useEffect, useRef } from 'react';
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
  Lock,
  Factory,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

const allMetricDefinitions = [
  { id: 'scope-1', name: 'Scope 1 Emissions', icon: Factory }, 
  { id: 'scope-2', name: 'Scope 2 Emissions', icon: Zap },     
  { id: 'fleet-fuel-management', name: 'Fleet Fuel Management', icon: Car },
  { id: 'energy-management', name: 'Energy Management', icon: Zap },
  { id: 'food-waste-management', name: 'Food Waste Management', icon: Recycle },
  { id: 'data-security', name: 'Data Security', icon: ShieldAlert },
  { id: 'food-safety', name: 'Food Safety', icon: Utensils },
  { id: 'product-health-nutrition', name: 'Product Health & Nutrition', icon: HeartPulse },
  { id: 'product-labelling-marketing', name: 'Product Labelling & Marketing', icon: Tags },
  { id: 'labour-practices', name: 'Labour Practices', icon: Users },
  { id: 'supply-chain-impacts', name: 'Management of Env. & Social Impacts', icon: Globe },
  { id: 'gmo', name: 'GMO Management', icon: Dna, isPro: true }, 
];

const ALL_METRIC_DATA_DEFINITIONS = {
  'SCOPE_1': { value: 120.50, unit: 'kgCO2e', decimals: 2 }, 
  'SCOPE_2': { value: 85.20, unit: 'kgCO2e', decimals: 2 },  
  
  'TOTAL_GHG': { defaultMax: 100000, decimals: 3, unit: 'kgCO2e' },
  'CALC_TRANSPORT_GHG': { defaultMax: 50000, decimals: 3, unit: 'kgCO2e' },
  
  'FB-FR-130a.1': { defaultMax: 50000.0, decimals: 2, unit: 'Gigajoules (GJ)' },
  'FB-FR-110a.1': { defaultMax: 10000.0, decimals: 2, unit: 'Gigajoules (GJ)' },

  // Metrics needing User Input
  'FB-FR-250a.1': { staticValue: 'User Input', unit: 'Metric tonnes (t)' },
  
  // --- SPECIFIC UNITS ---
  'FB-FR-230a.1': { staticValue: 'User Input', unit: 'Data Breach' }, 
  'FB-FR-230a.2': { staticValue: 'User Input', unit: '' },
  'FB-FR-230a.3': { staticValue: 'User Input', unit: '' }, // Qualitative
  
  'FB-FR-250b.1': { staticValue: 'User Input', unit: '' },
  'FB-FR-250b.2': { staticValue: 'User Input', unit: 'Recalls' }, 
  'FB-FR-250b.3': { staticValue: 'User Input', unit: '' },
  
  'FB-FR-260a.1': { staticValue: 'User Input', unit: '' }, // Qualitative
  'FB-FR-260a.2': { staticValue: 'User Input', unit: '' },
  
  'FB-FR-270a.1': { staticValue: 'User Input', unit: 'Incidents' }, 
  'FB-FR-270a.2': { staticValue: 'User Input', unit: '' },
  
  'FB-FR-330a.1': { staticValue: 'User Input', unit: '' },
  'FB-FR-330a.2': { staticValue: 'User Input', unit: '/ hour' }, 
  'FB-FR-330a.3': { staticValue: 'User Input', unit: '' },
  'FB-FR-330a.4': { staticValue: 'User Input', unit: '' },
  'FB-FR-330a.5': { staticValue: 'User Input', unit: '' },
  'FB-FR-330a.6': { staticValue: 'User Input', unit: '' },
  
  'FB-FR-430a.1': { staticValue: 'User Input', unit: '$' }, 
  'FB-FR-430a.2': { staticValue: 'User Input', unit: '' },
  'FB-FR-430a.3': { staticValue: 'User Input', unit: '' }, // Qualitative
  'FB-FR-430a.4': { staticValue: 'User Input', unit: '' }, // Qualitative
  
  'FB-FR-430b.1': { defaultMax: 100.0, decimals: 1, unit: 'Percentage (%)' },
};

const METRIC_BREAKDOWN_DATA = {
  'scope-1': {
    title: 'Scope 1 Emissions', icon: Factory,
    subMetrics: [
      { 
        name: 'Direct Emissions from Owned Sources', 
        type: 'Quantitative', 
        dataKey: 'SCOPE_1', 
        sasbCategory: 'GHG Emissions',
        proContent: 'Analysis: Your stationary combustion emissions are stable. Switching your boiler fuel from diesel to natural gas or biomass could reduce this by up to 30%. We recommend conducting a feasibility study on electrification for heating processes.'
      },
      { name: 'Source', type: 'Info', value: 'Calculated from fuel consumption data entered in Inventory.' }
    ]
  },
  'scope-2': {
    title: 'Scope 2 Emissions', icon: Zap,
    subMetrics: [
      { 
        name: 'Indirect Emissions from Purchased Energy', 
        type: 'Quantitative', 
        dataKey: 'SCOPE_2', 
        sasbCategory: 'GHG Emissions',
        proContent: 'Analysis: Electricity consumption spikes during midday processing. Installing on-site solar panels or purchasing RECs (Renewable Energy Certificates) is recommended to offset this carbon load and stabilize long-term energy costs.'
      },
      { name: 'Source', type: 'Info', value: 'Calculated from purchased electricity entries in Inventory.' }
    ]
  },
  'fleet-fuel-management': {
    title: 'Fleet Fuel Management', icon: Car,
    subMetrics: [
      { 
        name: 'Calculated Transport Emissions', 
        type: 'Quantitative', 
        dataKey: 'CALC_TRANSPORT_GHG', 
        sasbCategory: 'Inventory Calculation',
        proContent: 'Analysis: Transport emissions contribute significantly to your Scope 1 footprint. Optimizing delivery routes and consolidating shipments can yield a 10-15% reduction in fuel usage immediately.'
      },
      { 
        name: 'Fleet fuel consumed, percentage renewable', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-110a.1', 
        sasbCategory: 'Transport & Energy Management',
        proContent: 'Analysis: Current renewable fuel blend is 0%. We strongly advise transitioning to B20 biodiesel for the fleet, which requires no engine modifications but immediately lowers carbon intensity.'
      },
    ]
  },
  'energy-management': {
    title: 'Energy Management', icon: Zap,
    subMetrics: [
      { 
        name: '(1) Operational energy consumed, (2) percentage grid electricity', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-130a.1',
        sasbCategory: 'Energy Management',
        proContent: 'Analysis: Energy intensity per product unit has increased slightly. Conduct a Level 2 energy audit of the drying equipment; retrofitting with waste heat recovery pumps could improve thermal efficiency by 20%.'
      },
    ]
  },
  'food-waste-management': {
    title: 'Food Waste Management', icon: Recycle,
    subMetrics: [
      { 
        name: '(1) Amount of food waste generated', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-250a.1',
        sasbCategory: 'Waste Management',
        proContent: 'Analysis: Organic waste is currently sent to landfill, generating unnecessary methane. Partnering with a local anaerobic digestion or composting facility could divert 90% of this stream and contribute to circular economy goals.'
      },
    ]
  },
  'data-security': {
    title: 'Data Security', icon: ShieldAlert,
    subMetrics: [
      { 
        name: 'Number of data breaches', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-230a.1',
        sasbCategory: 'Customer Privacy',
        proContent: 'Analysis: No breaches recorded in the current period. Continue quarterly vulnerability scans and employee phishing simulations to maintain this status.'
      },
      { 
        name: 'Description of approach for addressing data security risks', 
        type: 'Discussion and Analysis', 
        dataKey: 'FB-FR-230a.3',
        sasbCategory: 'Customer Privacy',
        proContent: 'Analysis: We recommend adopting a defense-in-depth strategy. This includes encrypting all sensitive data at rest and in transit, enforcing Multi-Factor Authentication (MFA) for all access points, and conducting regular third-party penetration testing to validate the resilience of your internal systems against evolving cyber threats.'
      },
    ]
  },
  'food-safety': {
    title: 'Food Safety', icon: Utensils,
    subMetrics: [
      { 
        name: 'Number of recalls', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-250b.2',
        sasbCategory: 'Product Safety',
        proContent: 'Analysis: Zero recalls achieved. To sustain this, focus on preventative maintenance of detection equipment (metal detectors/X-ray) and regular mock recall drills.'
      },
      { 
        name: 'Fines and warning rate', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-250b.1',
        sasbCategory: 'Product Safety',
        proContent: 'Analysis: Maintain current HACCP protocols. We recommend reviewing supplier safety certifications annually to ensure upstream compliance does not compromise your safety rating.'
      },
    ]
  },
  'product-health-nutrition': {
    title: 'Product Health & Nutrition', icon: HeartPulse,
    subMetrics: [
      { 
        name: 'Discussion of process to manage nutritional concerns', 
        type: 'Discussion and Analysis', 
        dataKey: 'FB-FR-260a.1',
        sasbCategory: 'Product Health & Nutrition',
        proContent: 'Analysis: To mitigate health-related risks and align with consumer trends, we advise implementing a rigorous stage-gate process for new products. This involves mandatory nutritional profiling against WHO guidelines and establishing a clear roadmap for sodium and sugar reduction across your legacy portfolio.'
      },
    ]
  },
  'product-labelling-marketing': {
    title: 'Product Labelling & Marketing', icon: Tags,
    subMetrics: [
      { 
        name: 'Incidents of non-compliance with labelling regulations', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-270a.1',
        sasbCategory: 'Labelling & Marketing',
        proContent: 'Analysis: Regulatory scrutiny on "greenwashing" is intensifying. We advise a comprehensive audit of all sustainability claims on packaging against the latest EU directives and FTC Green Guides. Establishing a legal review step for all marketing materials is essential.'
      },
    ]
  },
  'labour-practices': {
    title: 'Labour Practices', icon: Users,
    subMetrics: [
      { 
        name: 'Average hourly wage', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-330a.2',
        sasbCategory: 'Wages & Benefits',
        proContent: 'Analysis: Wage levels are competitive within the sector. To improve retention, focus on non-monetary benefits such as flexible scheduling and structured upskilling programs.'
      },
    ]
  },
  'supply-chain-impacts': {
    title: 'Management of Env. & Social Impacts', icon: Globe,
    subMetrics: [
      { 
        name: 'Revenue from sustainable sourcing', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-430a.1',
        sasbCategory: 'Supply-Chain Management',
        proContent: 'Analysis: Increasing certified sustainable ingredients (e.g., Fair Trade, Rainforest Alliance) can significantly improve brand equity. We recommend setting a target of 50% certified sourcing by 2027 to enhance supply chain resilience.'
      },
      { 
        name: 'Strategy to manage env. & social risks', 
        type: 'Discussion and Analysis', 
        dataKey: 'FB-FR-430a.3',
        sasbCategory: 'Supply-Chain Management',
        proContent: 'Analysis: Sustainable supply chain management requires end-to-end visibility. We suggest prioritizing the mapping of Tier 1 and Tier 2 suppliers to identify environmental hotspots. Concurrently, enforce a Supplier Code of Conduct that mandates compliance with labor laws and zero-deforestation policies, verified through annual third-party audits.'
      },
    ]
  },
  'gmo': {
    title: 'GMO Management', icon: Dna,
    subMetrics: [
      { 
        name: 'Revenue from GMO products', 
        type: 'Quantitative', 
        dataKey: 'FB-FR-430b.1',
        sasbCategory: 'Product Sourcing',
        proContent: 'Analysis: Non-GMO demand is rising in key export markets (EU/Japan). Consider obtaining Non-GMO Project verification for your flagship products to access these premium segments.'
      },
    ]
  },
};

const generateInitialMetrics = () => {
  const data = {};
  for (const key in ALL_METRIC_DATA_DEFINITIONS) {
    const def = ALL_METRIC_DATA_DEFINITIONS[key];
    data[key] = { 
      value: def.value !== undefined ? def.value : (def.staticValue || null), 
      unit: def.unit, 
      decimals: def.decimals 
    };
  }
  return data;
};

const DashboardPage = () => {
  const [isProUser] = useState(localStorage.getItem('isProUser') === 'true'); 
  const navigate = useNavigate();
  const location = useLocation(); 
  const [metrics, setMetrics] = useState(null); 
  const [showProModal, setShowProModal] = useState(false);
  const [activeMetricId, setActiveMetricId] = useState(null);
  const [hasProducts, setHasProducts] = useState(false);
  
  const metricsScrollRef = useRef(null);

  const scrollMetrics = (direction) => {
    if (metricsScrollRef.current) {
      const scrollAmount = 300; 
      metricsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleMetricValueChange = (dataKey, newValue) => {
    setMetrics(prev => {
      if (!prev) return prev;
      const updatedData = { ...prev.data };
      
      if (updatedData[dataKey]) {
        updatedData[dataKey] = { 
          ...updatedData[dataKey], 
          value: newValue 
        };
      }
      localStorage.setItem('carbonx_dashboard_metrics', JSON.stringify(updatedData));
      return { ...prev, data: updatedData };
    });
  };

  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      navigate('/signup'); 
      return;
    }
    
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${API_BASE}/dashboard/summary/${currentUserId}`);
        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const summaryData = await response.json();
        setHasProducts(summaryData.productCount > 0);

        let baseData = generateInitialMetrics();

        const savedMetricsStr = localStorage.getItem('carbonx_dashboard_metrics');
        if (savedMetricsStr) {
            try {
                const savedMetrics = JSON.parse(savedMetricsStr);
                Object.keys(savedMetrics).forEach(key => {
                  if (baseData[key]) {
                    baseData[key].value = savedMetrics[key].value;
                  }
                });
                
                const transportEmissions = summaryData.transportEmissions || 0;
                if (baseData['CALC_TRANSPORT_GHG']) {
                  // baseData['CALC_TRANSPORT_GHG'].value = transportEmissions.toFixed(3);
                }
            } catch (e) {
                console.error("Failed to load saved metrics", e);
            }
        } else {
            const transportEmissions = summaryData.transportEmissions || 0;
            if (baseData['CALC_TRANSPORT_GHG']) {
               baseData['CALC_TRANSPORT_GHG'].value = transportEmissions.toFixed(3);
            }
            if (baseData['FB-FR-110a.1']) {
               const correlatedFuel = transportEmissions * 15;
               if (transportEmissions > 0) {
                 baseData['FB-FR-110a.1'].value = correlatedFuel.toFixed(2);
               }
            }
            if (baseData['FB-FR-130a.1']) {
                baseData['FB-FR-130a.1'].value = "1.00";
            }
        }

        let activeMetricList = summaryData.activeMetrics || [];
        const standardList = [
            "scope-1", 
            "scope-2",
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

        if (activeMetricList.length < 2) {
           activeMetricList = standardList;
        } else {
           if(!activeMetricList.includes("scope-1")) activeMetricList.unshift("scope-1");
           if(!activeMetricList.includes("scope-2")) activeMetricList.splice(1, 0, "scope-2");
        }

        setMetrics({
          metricList: activeMetricList,
          data: baseData,
          topContributors: summaryData.topContributors
        });

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
  
  const Sidebar = () => (
    <div className="sidebar">
      <div className="sidebar-top">
        <button type="button" onClick={() => navigate('/dashboard')} className="logo-button" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
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

    if (metricId === 'scope-1' || metricId === 'scope-2') {
        const key = metricId === 'scope-1' ? 'SCOPE_1' : 'SCOPE_2';
        const d = metrics.data[key];
        if(d) return { displayValue: `${d.value} ${d.unit}`, hasData: true };
    }

    // UPDATED: For Food Safety, use the Recalls metric (which has the unit)
    if (metricId === 'food-safety') {
      const metricData = metrics.data['FB-FR-250b.2']; // Recalls metric
      if (metricData) {
          const val = metricData.value;
          if (val === 'User Input' || val === '' || val === null) {
              return { displayValue: 'User Input', hasData: true };
          }
          return { displayValue: `${val} ${metricData.unit}`, hasData: true };
      }
    }

    if (metricId === 'fleet-fuel-management') {
      const metricData = metrics.data['CALC_TRANSPORT_GHG']; 
      if (metricData && metricData.value !== null && parseFloat(metricData.value) > 0) {
         return { displayValue: `${metricData.value} ${metricData.unit}`, hasData: true };
      }
      return { displayValue: 'N/A', hasData: false };
    }

    if (metricId === 'energy-management') {
        const metricData = metrics.data['FB-FR-130a.1'];
        if (metricData && metricData.value) {
            return { displayValue: `${metricData.value} ${metricData.unit}`, hasData: true };
        }
    }

    const firstQuantMetric = breakdown.subMetrics.find(sub => sub.type === 'Quantitative');
    if (firstQuantMetric) {
      const metricData = metrics.data[firstQuantMetric.dataKey];
      if (metricData) {
          const val = metricData.value;
          if (val === 'User Input' || val === '' || val === null) {
              return { displayValue: 'User Input', hasData: true };
          }
          // Check if currency unit ($)
          if (metricData.unit === '$') {
            return { displayValue: `${metricData.unit}${val}`, hasData: true };
          }
          return { displayValue: `${val} ${metricData.unit}`, hasData: true };
      }
    }
    
    const firstAnalysisMetric = breakdown.subMetrics.find(sub => sub.type === 'Discussion and Analysis');
    if (firstAnalysisMetric) {
       const metricData = metrics.data[firstAnalysisMetric.dataKey];
       if (metricData && metricData.value) {
         return { displayValue: metricData.value === 'User Input' ? 'Analysis' : metricData.value, hasData: true };
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
          
          {/* --- METRICS SCROLL CONTAINER --- */}
          <div className="metrics-scroll-wrapper" style={{position: 'relative', display: 'flex', alignItems: 'center', width: '100%'}}>
            <button 
                className="icon" 
                onClick={() => scrollMetrics('left')}
                style={{marginRight: '0.5rem', flexShrink: 0}}
            >
                <ChevronLeft />
            </button>
            
            <div className = "metrics-container" ref={metricsScrollRef} style={{ flex: 1, overflowX: 'auto', scrollBehavior: 'smooth' }}>
                {hasProducts ? (
                <>
                    {metricsForIndustry.map((metric) => {
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

            <button 
                className="icon" 
                onClick={() => scrollMetrics('right')}
                style={{marginLeft: '0.5rem', flexShrink: 0}}
            >
                <ChevronRight />
            </button>
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
                    
                    {activeBreakdownTemplate.subMetrics.map((sub, idx) => {
                      const isAnalysis = sub.type === 'Discussion and Analysis';
                      const isInfo = sub.type === 'Info';
                      const metricData = metrics.data[sub.dataKey];
                      
                      const isEditable = !isInfo && !isAnalysis;

                      let displayContent = null;

                      if (isInfo) {
                          displayContent = (
                              <p className="normal-regular" style={{fontStyle: 'italic', color: 'rgba(var(--greys), 1)'}}>
                                  {sub.value}
                              </p>
                          );
                      } else if (isAnalysis) {
                        // READ-ONLY FOR ANALYSIS
                        const value = (metricData && metricData.value) || '';
                        displayContent = (
                           <p className="medium-bold" style={{color: "rgba(var(--primary), 1)", textAlign: 'right'}}>
                              {(!value || value === 'User Input') ? 'Analysis' : value}
                           </p>
                        );
                      } else if (isEditable) {
                        // EDITABLE FIELDS
                        const inputValue = (!metricData || metricData.value === 'User Input' || metricData.value === null) 
                                           ? '' 
                                           : metricData.value;
                        const isCurrency = metricData?.unit === '$';

                        displayContent = (
                           <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end'}}>
                             {/* Show unit BEFORE input if currency */}
                             {isCurrency && <span className="normal-regular">{metricData.unit}</span>}
                             
                             <input 
                                type="number" 
                                className="input-base" 
                                placeholder="0.00"
                                value={inputValue}
                                onChange={(e) => handleMetricValueChange(sub.dataKey, e.target.value)}
                                onClick={(e) => e.stopPropagation()} 
                                style={{width: '120px', textAlign: 'right'}}
                             />
                             
                             {/* Show unit AFTER input if NOT currency */}
                             {!isCurrency && <span className="normal-regular">{metricData?.unit || ''}</span>}
                           </div>
                        );
                      } else {
                        // READ-ONLY FIELDS
                        if (metricData) {
                            const val = metricData.value === 'User Input' ? 'N/A' : metricData.value;
                            displayContent = (
                                <p className="medium-bold" style={{color: "rgba(var(--primary), 1)", textAlign: 'right'}}>
                                    {val !== null ? `${val} ${metricData.unit}` : 'N/A'}
                                </p>
                            );
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
                          key={idx}
                          onClick={isAnalysis && !isProUser ? () => setShowProModal(true) : undefined}
                        >
                          <div className="sub-metric-info" style={{width: '100%'}}>
                            <div className="input-group-row" style={{ alignItems: 'center' }}>
                              <p className="medium-bold" style={{flex: 1}}>{sub.name}</p>
                              <div style={{flex: 1, textAlign: 'right'}}>
                                {displayContent}
                              </div>
                            </div>
                            
                            <div className="metric-categories-col" style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {sub.sasbCategory && sub.sasbCategory !== 'NA' && (
                                <div>
                                  <p className="descriptor-medium" style={{color: "rgba(var(--greys), 1)"}}>SASB</p>
                                  <p className="nofmal-regular" style={{color: "rgba(var(--blacks), 1)"}}>{sub.sasbCategory}</p>
                                </div>
                              )}
                            </div>

                            {/* Pro Content / Analysis */}
                            {isProUser && sub.proContent && (
                              <div className="analysis-content" style={{marginTop: '1rem', backgroundColor: 'rgba(var(--secondary), 0.1)', padding: '1rem', borderRadius: '8px'}}>
                                <div className="pro-analysis-content">
                                   <div style={{display:'flex', gap:'0.5rem', alignItems:'center', marginBottom:'0.5rem'}}>
                                     <Sparkles size={16} color="rgba(var(--secondary), 1)" />
                                     <p className="small-bold" style={{color: 'rgba(var(--secondary), 1)'}}>Pro Insight</p>
                                   </div>
                                   <p className="normal-regular">{sub.proContent}</p>
                                </div>
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