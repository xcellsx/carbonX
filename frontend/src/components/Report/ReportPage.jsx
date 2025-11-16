import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import './ReportPage.css';
import logoPath from '../../assets/carbonx.png';
import { 
  ChevronDown, Plus, Search, Trash2, X, Eye, Pencil,
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, ChevronLeft, // Sprout is already here
  ArrowUp, ArrowDown, Minus, CheckCircle, XCircle 
} from 'lucide-react';

// --- Confirmation Modal (Unchanged) ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) {
    return null;
  }
  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <p className="medium-bold">{title}</p>
          <button className="close-modal-btn" onClick={onClose}><X /></button>
        </div>
        <div className="normal-regular">
          {children}
        </div>
        <div className="confirm-modal-buttons button-modal">
          <button className="default" style={{ padding: '0.5rem 1rem' }} onClick={onClose}>
            Cancel
          </button>
          <button className="default" style={{ backgroundColor: 'rgba(var(--danger), 1)', padding: '0.5rem 1rem' }} onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// --- NEW: Generate Report Modal ---
const GenerateReportModal = ({ isOpen, onClose, onNavigate }) => {
  if (!isOpen) {
    return null;
  }
  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div className="modal-header">
          <p className="medium-bold">Generate New Report</p>
          <button className="close-modal-btn" onClick={onClose}><X /></button>
        </div>
        <div className="normal-regular" style={{ padding: '1rem 0' }}>
          <Sprout size={48} style={{ marginBottom: '1rem', color: 'rgba(var(--primary), 1)' }} />
          <p>Generate your reports from SproutAI!</p>
        </div>
        <div className="confirm-modal-buttons button-modal" style={{ justifyContent: 'center' }}>
          <button className="default" style={{ padding: '0.5rem 1rem' }} onClick={onNavigate}>
            Go to Sprout AI
          </button>
        </div>
      </div>
    </div>
  );
};

// --- UPDATED: Mock Report Data (now for Sesame) ---
const MOCK_REPORT_DATA = {
  productName: 'Dried White Sesame - Golden Lion',
  boardStatement: "This report details the life cycle analysis of our 'Dried White Sesame - Golden Lion' product, focusing on its supply chain from farm to packaging. We are committed to transparency in our agricultural and transport-related emissions.",
  frameworks: ["GRI Standards", "SASB (Food & Beverage)"],
  performanceHighlights: [
    { label: "Total Product Footprint", value: "1.37 kg CO2e", change: "N/A", type: "neutral", source: "Baseline Report" },
    { label: "Farming (Sesame)", value: "1.20 kg CO2e", change: "87.6%", type: "negative", source: "Component Share" },
    { label: "Packaging (Plastic Pouch)", value: "0.15 kg CO2e", change: "10.9%", type: "negative", source: "Component Share" },
    { label: "Transport (Road)", value: "0.02 kg CO2e", change: "1.5%", type: "negative", source: "Component Share" },
  ],
  materialFactors: [
    {
      title: "Upstream: Agricultural Production (Sesame)",
      commitment: "To work with suppliers to promote sustainable farming practices and reduce on-farm emissions.",
      performanceSummary: "Farming represents the largest portion of the footprint (87.6%). The primary drivers are land use change and fertilizers. Water consumption for irrigation is also a key impact area.",
      metrics: [
        { label: "Global Warming (GWP 100a)", value: "1.20 kg CO2-eq", change: "per kg product" },
        { label: "Land Use", value: "1.50 m2*a", change: "per kg product" },
        { label: "Eutrophication", value: "0.02 kg P-eq", change: "per kg product" },
      ]
    },
    {
      title: "Upstream: Packaging (Plastic Pouch)",
      commitment: "To source lower-impact packaging materials and explore recyclable or compostable alternatives.",
      performanceSummary: "The plastic pouch, while lightweight, is derived from fossil fuels and contributes ~11% of the total footprint. This is our second-largest hotspot.",
      metrics: [
        { label: "Global Warming (GWP 100a)", value: "0.15 kg CO2-eq", change: "per kg product" },
        { label: "Fossil Fuel Depletion", value: "2.10 MJ", change: "per kg product" },
      ]
    },
    {
      title: "Upstream: Transportation",
      commitment: "To optimize logistics and prefer lower-emission transport modes where feasible.",
      performanceSummary: "Transport currently represents a small fraction of the total footprint. We will continue to monitor this as shipment volumes increase.",
      metrics: [
        { label: "Transport (Road)", value: "0.02 kg CO2-eq", change: "per kg product" },
      ]
    },
  ],
  targetSummary: [
    { target: "Identify low-emission fertilizer options with suppliers", status: "On Track", performance: "Currently in discussion with two major suppliers." },
    { target: "Trial a recyclable-film alternative for plastic pouch", status: "Not Achieved", performance: "R&D postponed due to material sourcing delays." },
    { target: "Maintain transport emissions below 3% of total footprint", status: "Achieved", performance: "Transport emissions are currently 1.5% of total." },
  ]
};

// --- UPDATED: Mock Reports List ---
const MOCK_REPORTS_LIST = [
  {
    id: 'rpt_001',
    reportName: 'Q4 2025 - Dried Sesame Analysis',
    description: 'LCA report for Dried White Sesame product line.',
    date: '2025-11-15',
    fullData: MOCK_REPORT_DATA 
  }
  // --- Office Chair Report Removed ---
];

// --- Highlight Card Component (Unchanged) ---
const HighlightCard = ({ item }) => {
  const isNegative = item.type === 'negative';
  const isNeutral = item.type === 'neutral';
  const colorClass = isNegative ? 'text-danger' : 'text-success';
  const Icon = isNegative ? ArrowUp : isNeutral ? Minus : ArrowDown;

  return (
    <div className="highlight-card">
      <p className="small-regular" style={{color: 'rgba(var(--greys), 1)'}}>{item.label}</p>
      <p className="large-bold" style={{margin: '0.25rem 0'}}>{item.value}</p>
      <div className={`small-regular ${isNeutral ? 'text-neutral' : colorClass}`} style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
        <Icon size={14} />
        <span>{item.change}</span>
        <span className="text-neutral" style={{marginLeft: '0.25rem'}}> ({item.source})</span>
      </div>
    </div>
  );
};

// --- Material Factor Card Component (Unchanged) ---
const FactorCard = ({ factor }) => {
  return (
    <div className="factor-card">
      <div className="header-group" style={{gap: '0.5rem'}}>
        <h5>{factor.title}</h5>
        <p className="normal-regular" style={{fontStyle: 'italic', color: 'rgba(var(--greys), 1)'}}>
          "{factor.commitment}"
        </p>
      </div>
      <p className="normal-regular" style={{margin: '1rem 0'}}>{factor.performanceSummary}</p>
      <div className="factor-metrics-table">
        <table className="inventory-table">
          <tbody>
            {factor.metrics?.map((metric, idx) => (
              <tr key={idx}>
                <td className="normal-regular">{metric.label}</td>
                <td className="normal-bold" style={{textAlign: 'right', width: '30%'}}>{metric.value}</td>
                <td className="small-regular" style={{color: 'rgba(var(--greys), 1)', textAlign: 'right', width: '30%'}}>
                  {metric.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Report Content (Detail View) (Unchanged) ---
const ReportContent = ({ data, onBack }) => {
  if (!data) {
    return (
      <div className="report-container" style={{padding: '1.5rem'}}>
        <p className="no-products-message">Loading report details...</p>
      </div>
    );
  }

  return (
    <div className="report-container">
      <button 
        type="button" 
        onClick={onBack} 
        className="nav"
        style={{ marginBottom: '1.5rem', background: 'transparent', padding: '0.5rem 0' }}
      >
        <ChevronLeft size={18} />
        <span style={{fontSize: '1rem'}}>Back to all reports</span>
      </button>

      <div className="report-header-section">
        <div className="header-group">
          <h1>Sustainability Report</h1>
          <p className="medium-regular">Product: <span className="medium-bold">{data.productName}</span></p>
        </div>
        <p className="normal-regular" style={{marginTop: '1.5rem', fontStyle: 'italic', maxWidth: '80ch'}}>
          {data.boardStatement}
        </p>
        <div className="framework-tags">
          <span className="small-bold">Reporting Frameworks:</span>
          {data.frameworks?.map(f => <span key={f} className="framework-tag">{f}</span>)}
        </div>
      </div>

      <h5 className="report-section-header">PERFORMANCE AT A GLANCE</h5>
      <div className="highlights-grid">
        {data.performanceHighlights?.map(item => <HighlightCard key={item.label} item={item} />)}
      </div>

      <h5 className="report-section-header">MATERIAL SUSTAINABILITY FACTORS</h5>
      <div className="factors-grid">
        {data.materialFactors?.map(factor => <FactorCard key={factor.title} factor={factor} />)}
      </div>

      <h5 className="report-section-header">TARGET SUMMARY</h5>
      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Target</th>
              <th style={{width: '120px'}}>Status</th>
              <th>Performance in FY2025</th>
            </tr>
          </thead>
          <tbody>
            {data.targetSummary?.map((item, idx) => (
              <tr key={idx}>
                <td className="normal-regular">{item.target}</td>
                <td>
                  <span className={`target-table-status ${item.status === 'Achieved' ? 'success' : 'danger'}`}>
                    {item.status === 'Achieved' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {item.status}
                  </span>
                </td>
                <td className="normal-regular">{item.performance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main Page Component ---
const ReportPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentView, setCurrentView] = useState('list');
  const [selectedReportData, setSelectedReportData] = useState(null); 
  const [deleteConfirm, setDeleteConfirm] = useState({isOpen: false, title: '', message: '', onConfirm: () => {},});

  // --- NEW: State for the new report modal ---
  const [showNewReportModal, setShowNewReportModal] = useState(false);

  const [isProUser] = useState(localStorage.getItem('isProUser') === 'true');
  
  // --- (All functions below are unchanged until handleNewReport) ---
  const fetchReportsList = () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setReportsList(MOCK_REPORTS_LIST);
        setError('');
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError('Could not load reports list.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsList();
  }, []);
  
  const performActualDeleteReport = (reportId) => {
    setReportsList(prevList => prevList.filter(r => r.id !== reportId));
  };

  const handleDelete = (reportId) => {
    const report = reportsList.find(r => r.id === reportId);
    const reportName = report ? report.reportName : 'this report';
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Report',
      message: `Are you sure you want to delete "${reportName}"? This action cannot be undone.`,
      onConfirm: () => performActualDeleteReport(reportId)
    });
  };

  const closeDeleteModal = () => {
    setDeleteConfirm({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
    });
  };

  const handleViewReport = (report) => {
    setSelectedReportData(report.fullData);
    setCurrentView('detail');
  };

  const handleEditReport = (report) => {
    navigate('/chat');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedReportData(null);
  };

  // --- UPDATED: handleNewReport ---
  const handleNewReport = () => {
    setShowNewReportModal(true);
  };

  const filteredReports = reportsList.filter(report =>
    report.reportName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container">
      <div className="sidebar">
        {/* --- Sidebar (Unchanged) --- */}
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
          <button type="button" className={`nav ${location.pathname === '/settings' ? 'active' : ''}`} onClick={() => navigate("/settings")}>
            <Settings /><span>Settings</span>
          </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="content-section-main">
        {error && (
          <div className="content-container-main">
            <p className="submit-error">{error}</p>
          </div>
        )}

        {currentView === 'list' ? (
          
          // --- LIST VIEW (Unchanged) ---
          <>
            <div className="content-container-main"> 
              <div className="header-group">
                <h1>Reports</h1>
                <p className = "medium-regular">Find your generated reports here.</p>
              </div>
              <div className = "sub-header">
                <p style = {{color: "rgba(var(--greys), 1)"}}>Showing {filteredReports.length} of {reportsList.length} reports</p>
                <div className = "two-row-component-container">
                  <div className = "input-base search-bar">
                    <Search />
                    <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <button className = "icon" onClick={handleNewReport}>
                    <Plus />
                  </button>
                </div>
              </div>
              
              <div className="analytics-card" style={{ padding: 0, marginTop: 0 }}>
                <div className="inventory-table-container">
                  <table className="inventory-table">
                    <thead className = "normal-bold">
                      <tr>
                        <th>Report Name</th>
                        <th>Description</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr>
                          <td colSpan={4} className="no-products-message">Loading reports...</td>
                        </tr>
                      )}
                      
                      {!loading && !error && reportsList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="no-products-message">
                            No reports found. Click the <Plus size={16} style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 4px' }} /> button to add your first report.
                          </td>
                        </tr>
                      )}
                      
                      {!loading && !error && reportsList.length > 0 && filteredReports.length === 0 && (
                        <tr>
                          <td colSpan={4} className="no-products-message">
                            No reports match your search query.
                          </td>
                        </tr>
                      )}

                      {!loading && !error && filteredReports.map(report => {
                        return (
                          <tr key={report.id}>
                            <td className="normal-bold">{report.reportName}</td>
                            <td>{report.description}</td>
                            <td>{report.date}</td>
                            <td>
                              <div className='two-row-component-container' style={{ gap: '0.5rem' }}>
                                <button 
                                  className="icon" 
                                  title="View Report" 
                                  onClick={() => handleViewReport(report)}
                                  style={{ backgroundColor: 'rgba(var(--info), 1)' }}
                                >
                                  <Eye size={16} />
                                </button>
                                <button 
                                  className="icon" 
                                  title="Edit with Sprout AI" 
                                  onClick={() => handleEditReport(report)}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button 
                                  className="icon" 
                                  title="Delete Report" 
                                  onClick={() => handleDelete(report.id)}
                                  style={{ backgroundColor: 'rgba(var(--danger), 1)' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>

        ) : (
          
          // --- DETAIL VIEW (Unchanged) ---
          <div className="content-container-main">
            <div className="analytics-card"> 
              <ReportContent data={selectedReportData} onBack={handleBackToList} />
            </div>
          </div>

        )}
      </div>
      
      {/* --- Delete Confirmation Modal --- */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        onClose={closeDeleteModal}
        onConfirm={() => {
          deleteConfirm.onConfirm();
          closeDeleteModal();
        }}
      >
        {deleteConfirm.message}
      </ConfirmationModal>

      {/* --- NEW: Generate Report Modal --- */}
      <GenerateReportModal
        isOpen={showNewReportModal}
        onClose={() => setShowNewReportModal(false)}
        onNavigate={() => {
          setShowNewReportModal(false);
          navigate('/chat');
        }}
      />
    </div>
  );
};

export default ReportPage;