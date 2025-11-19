import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import './ReportPage.css';
import logoPath from '../../assets/carbonx.png';
import { 
  ChevronDown, Plus, Search, Trash2, X, Eye, Pencil, Download,
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, ChevronLeft, 
  ArrowUp, ArrowDown, Minus, CheckCircle, XCircle 
} from 'lucide-react';

// --- NEW IMPORTS FOR PDF GENERATION ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Confirmation Modal ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <p className="medium-bold">{title}</p>
          <button className="close-modal-btn" onClick={onClose}><X /></button>
        </div>
        <div className="normal-regular">{children}</div>
        <div className="confirm-modal-buttons button-modal">
          <button className="default" style={{ padding: '0.5rem 1rem' }} onClick={onClose}>Cancel</button>
          <button className="default" style={{ backgroundColor: 'rgba(var(--danger), 1)', padding: '0.5rem 1rem' }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

// --- Generate Report Modal ---
const GenerateReportModal = ({ isOpen, onClose, onNavigate }) => {
  if (!isOpen) return null;
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
          <button className="default" style={{ padding: '0.5rem 1rem' }} onClick={onNavigate}>Go to Sprout AI</button>
        </div>
      </div>
    </div>
  );
};

// --- Highlight Card Component ---
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

// --- Factor Card Component ---
const FactorCard = ({ factor }) => {
  return (
    <div className="factor-card">
      <div className="header-group" style={{gap: '0.5rem'}}>
        <h5>{factor.title}</h5>
        <p className="normal-regular" style={{fontStyle: 'italic', color: 'rgba(var(--greys), 1)'}}>"{factor.commitment}"</p>
      </div>
      <p className="normal-regular" style={{margin: '1rem 0'}}>{factor.performanceSummary}</p>
      <div className="factor-metrics-table">
        <table className="inventory-table">
          <tbody>
            {factor.metrics?.map((metric, idx) => (
              <tr key={idx}>
                <td className="normal-regular">{metric.label}</td>
                <td className="normal-bold" style={{textAlign: 'right', width: '30%'}}>{metric.value}</td>
                <td className="small-regular" style={{color: 'rgba(var(--greys), 1)', textAlign: 'right', width: '30%'}}>{metric.change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Report Detail View ---
const ReportContent = ({ data, onBack }) => {
  if (!data) return <div className="report-container"><p>Loading...</p></div>;

  return (
    <div className="report-container">
      <button type="button" onClick={onBack} className="nav" style={{ marginBottom: '1.5rem', background: 'transparent', padding: '0.5rem 0' }}>
        <ChevronLeft size={18} />
        <span style={{fontSize: '1rem'}}>Back to all reports</span>
      </button>

      <div className="report-header-section">
        <div className="header-group">
          <h1>Sustainability Report</h1>
          <p className="medium-regular">Product: <span className="medium-bold">{data.productName}</span></p>
        </div>
        <p className="normal-regular" style={{marginTop: '1.5rem', fontStyle: 'italic', maxWidth: '80ch'}}>{data.boardStatement}</p>
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
  const [showNewReportModal, setShowNewReportModal] = useState(false);

  const [isProUser] = useState(localStorage.getItem('isProUser') === 'true');
  
  // --- Fetch from LocalStorage ---
  const fetchReportsList = () => {
    setLoading(true);
    try {
      setTimeout(() => {
        const storedReports = localStorage.getItem('carbonx_reports');
        if (storedReports) {
            setReportsList(JSON.parse(storedReports));
        } else {
            setReportsList([]); 
        }
        setError('');
        setLoading(false);
      }, 300);
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
    const updatedList = reportsList.filter(r => r.id !== reportId);
    setReportsList(updatedList);
    localStorage.setItem('carbonx_reports', JSON.stringify(updatedList));
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
    setDeleteConfirm({isOpen: false, title: '', message: '', onConfirm: () => {},});
  };

  const handleViewReport = (report) => {
    setSelectedReportData(report.fullData);
    setCurrentView('detail');
  };

  const handleEditReport = (report) => {
    navigate('/chat');
  };

  // --- NEW: REAL PDF GENERATION LOGIC ---
  const handleDownloadReport = (report) => {
    const doc = new jsPDF();
    const data = report.fullData || {};

    // 1. Header
    doc.setFontSize(22);
    doc.setTextColor(51, 71, 97); // CarbonX Primary Blue
    doc.text("Sustainability Report", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated by CarbonX`, 14, 28);
    doc.text(`Date: ${report.date}`, 160, 28);

    // 2. Product Info
    doc.setDrawColor(200);
    doc.line(14, 32, 196, 32); // Divider line

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Product: ${data.productName || report.reportName}`, 14, 42);

    // Board Statement (wrapped text)
    doc.setFontSize(10);
    doc.setTextColor(60);
    const splitStatement = doc.splitTextToSize(data.boardStatement || "", 180);
    doc.text(splitStatement, 14, 50);

    let finalY = 50 + (splitStatement.length * 5);

    // 3. Performance Highlights (Table)
    doc.setFontSize(14);
    doc.setTextColor(51, 71, 97);
    doc.text("Performance Highlights", 14, finalY + 10);
    
    const highlightRows = data.performanceHighlights?.map(h => [h.label, h.value, h.change]) || [];
    autoTable(doc, {
      startY: finalY + 15,
      head: [['Metric', 'Value', 'Change']],
      body: highlightRows,
      theme: 'striped',
      headStyles: { fillColor: [51, 71, 97] },
      styles: { fontSize: 10 }
    });

    finalY = doc.lastAutoTable.finalY + 10;

    // 4. Target Summary (Table)
    doc.text("Target Summary", 14, finalY + 10);
    const targetRows = data.targetSummary?.map(t => [t.target, t.status, t.performance]) || [];
    
    autoTable(doc, {
      startY: finalY + 15,
      head: [['Target', 'Status', 'Performance']],
      body: targetRows,
      theme: 'grid',
      headStyles: { fillColor: [51, 71, 97] },
      styles: { fontSize: 10 },
      columnStyles: { 
        0: { cellWidth: 80 },
        1: { cellWidth: 30, fontStyle: 'bold' },
        2: { cellWidth: 'auto' }
      }
    });

    // 5. Save File
    const fileName = `CarbonX_Report_${report.reportName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedReportData(null);
  };

  const handleNewReport = () => {
    setShowNewReportModal(true);
  };

  const filteredReports = reportsList.filter(report =>
    report.reportName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container">
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
          <button type="button" className={`nav ${location.pathname === '/settings' ? 'active' : ''}`} onClick={() => navigate("/settings")}>
            <Settings /><span>Settings</span>
          </button>
        </div>
      </div>

      <div className="content-section-main">
        {error && (
          <div className="content-container-main"><p className="submit-error">{error}</p></div>
        )}

        {currentView === 'list' ? (
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
                  <button className = "icon" onClick={handleNewReport}><Plus /></button>
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
                        <tr><td colSpan={4} className="no-products-message">Loading reports...</td></tr>
                      )}
                      
                      {!loading && !error && reportsList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="no-products-message">
                            No reports found. Click the <Plus size={16} style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 4px' }} /> button to add your first report.
                          </td>
                        </tr>
                      )}
                      
                      {!loading && !error && reportsList.length > 0 && filteredReports.length === 0 && (
                        <tr><td colSpan={4} className="no-products-message">No reports match your search query.</td></tr>
                      )}

                      {!loading && !error && filteredReports.map(report => {
                        return (
                          <tr key={report.id}>
                            <td className="normal-bold">{report.reportName}</td>
                            <td>{report.description}</td>
                            <td>{report.date}</td>
                            <td>
                              <div className='two-row-component-container' style={{ gap: '0.5rem' }}>
                                <button className="icon" title="View Report" onClick={() => handleViewReport(report)} style={{ backgroundColor: 'rgba(var(--info), 1)' }}>
                                  <Eye size={16} />
                                </button>
                                {/* --- DOWNLOAD BUTTON --- */}
                                <button className="icon" title="Download PDF" onClick={() => handleDownloadReport(report)} style={{ backgroundColor: 'rgba(var(--success), 1)' }}>
                                  <Download size={16} />
                                </button>
                                <button className="icon" title="Delete Report" onClick={() => handleDelete(report.id)} style={{ backgroundColor: 'rgba(var(--danger), 1)' }}>
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
          <div className="content-container-main">
            <div className="analytics-card"> 
              <ReportContent data={selectedReportData} onBack={handleBackToList} />
            </div>
          </div>
        )}
      </div>
      
      <ConfirmationModal isOpen={deleteConfirm.isOpen} title={deleteConfirm.title} onClose={closeDeleteModal} onConfirm={() => { deleteConfirm.onConfirm(); closeDeleteModal(); }}>
        {deleteConfirm.message}
      </ConfirmationModal>

      <GenerateReportModal isOpen={showNewReportModal} onClose={() => setShowNewReportModal(false)} onNavigate={() => { setShowNewReportModal(false); navigate('/chat'); }} />
    </div>
  );
};

export default ReportPage;