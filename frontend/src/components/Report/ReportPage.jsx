import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import './ReportPage.css';
import logoPath from '../../assets/carbonx.png';
import { 
  ChevronDown, Plus, Search, Trash2, X, Eye, Pencil, Download,
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, ChevronLeft, 
  ArrowUp, ArrowDown, Minus, CircleCheck, RefreshCw, BookOpen,
  Target, Users, ShieldCheck, Leaf
} from 'lucide-react';

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

// --- Helper for Section Headers in Web View ---
const ReportSection = ({ icon: Icon, title, children }) => (
    <div style={{marginBottom: '3rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '2px solid #eee', paddingBottom: '0.75rem', marginBottom: '1.5rem'}}>
            <Icon size={24} color="rgba(var(--primary), 1)" />
            <h2 style={{fontSize: '1.25rem', fontWeight: '700', color: 'rgba(var(--primary), 1)', margin: 0}}>{title}</h2>
        </div>
        {children}
    </div>
);

// --- Report Content Display (Web View) ---
const ReportContent = ({ data, onBack }) => {
  if (!data) return <div className="report-container"><p>Loading...</p></div>;

  return (
    <div className="report-container">
      <button type="button" onClick={onBack} className="nav" style={{ marginBottom: '1.5rem', background: 'transparent', padding: '0.5rem 0' }}>
        <ChevronLeft size={18} />
        <span style={{fontSize: '1rem'}}>Back to all reports</span>
      </button>

      <div className="report-header-section" style={{textAlign: 'center', paddingBottom: '3rem', borderBottom: '1px solid #eee', marginBottom: '3rem'}}>
        <h1 style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>Carbon Report</h1>
        <p className="medium-regular" style={{fontSize: '1.25rem', color: '#666'}}>Reporting Year: <span className="medium-bold">FY2025</span></p>
        <p className="medium-regular" style={{color: '#666'}}>Company: <span className="medium-bold">Golden Lion</span></p>
        <p className="medium-regular" style={{color: '#666'}}>Product Scope: <span className="medium-bold">{data.productName}</span></p>
        <div className="framework-tags" style={{justifyContent: 'center', marginTop: '1.5rem'}}>
          {data.frameworks?.map(f => <span key={f} className="framework-tag">{f}</span>)}
        </div>
      </div>

      {/* 1. BOARD STATEMENT */}
      <ReportSection icon={BookOpen} title="1. Board Statement">
        <div className="board-statement-box" style={{padding: '2rem', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '6px solid rgba(var(--primary), 1)'}}>
            <p className="normal-regular" style={{whiteSpace: 'pre-line', lineHeight: 1.8, textAlign: 'justify'}}>
                {data.boardStatement}
            </p>
            <div style={{marginTop: '1.5rem', fontStyle: 'italic', fontWeight: 'bold'}}>
                - On behalf of the Board of Directors, Golden Lion
            </div>
        </div>
      </ReportSection>

      {/* 2. ORGANISATIONAL PROFILE */}
      <ReportSection icon={Users} title="2. About Golden Lion">
         <p className="normal-regular" style={{marginBottom: '1rem', lineHeight: 1.7}}>{data.companyProfile}</p>
         
         <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem'}}>
             <div>
                 <h4 style={{marginBottom: '0.5rem'}}>Our Sustainability Approach</h4>
                 <p className="normal-regular" style={{lineHeight: 1.7}}>{data.sustainabilityApproach}</p>
             </div>
             <div>
                 <h4 style={{marginBottom: '0.5rem'}}>Stakeholder Engagement</h4>
                 <p className="normal-regular" style={{lineHeight: 1.7}}>{data.stakeholderEngagement}</p>
             </div>
         </div>
      </ReportSection>

      {/* 3. PILLAR: ENVIRONMENT */}
      <ReportSection icon={Leaf} title="3. Environmental Stewardship">
        <p className="normal-regular" style={{marginBottom: '1.5rem'}}>We are dedicated to minimizing our ecological footprint through efficient resource management and decarbonization.</p>
        <div className="factors-list">
            {data.environmentalAnalysis?.map((factor, idx) => (
                <div key={idx} className="factor-card" style={{marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                        <h4 style={{color: 'rgba(var(--primary), 1)'}}>{factor.title}</h4>
                        <span className="small-bold" style={{color: '#059669'}}>{factor.keyData}</span>
                    </div>
                    <p className="normal-regular" style={{marginBottom: '1rem', fontStyle: 'italic'}}>"{factor.strategy}"</p>
                    <p className="normal-regular" style={{lineHeight: 1.6}}><span className="small-bold">Performance:</span> {factor.performance}</p>
                    <p className="normal-regular" style={{lineHeight: 1.6, marginTop: '0.5rem'}}><span className="small-bold">2026 Outlook:</span> {factor.outlook}</p>
                </div>
            ))}
        </div>
      </ReportSection>

      {/* 4. PILLAR: SOCIAL */}
      <ReportSection icon={Users} title="4. Social Responsibility">
        <p className="normal-regular" style={{marginBottom: '1.5rem'}}>Our social strategy focuses on product safety, employee well-being, and community trust.</p>
        <div className="factors-list">
            {data.socialAnalysis?.map((factor, idx) => (
                <div key={idx} className="factor-card" style={{marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                        <h4 style={{color: 'rgba(var(--primary), 1)'}}>{factor.title}</h4>
                        <span className="small-bold" style={{color: '#059669'}}>{factor.keyData}</span>
                    </div>
                    <p className="normal-regular" style={{marginBottom: '1rem', fontStyle: 'italic'}}>"{factor.strategy}"</p>
                    <p className="normal-regular" style={{lineHeight: 1.6}}><span className="small-bold">Performance:</span> {factor.performance}</p>
                    <p className="normal-regular" style={{lineHeight: 1.6, marginTop: '0.5rem'}}><span className="small-bold">2026 Outlook:</span> {factor.outlook}</p>
                </div>
            ))}
        </div>
      </ReportSection>

      {/* 5. PILLAR: GOVERNANCE */}
      <ReportSection icon={ShieldCheck} title="5. Governance & Ethics">
        <p className="normal-regular" style={{marginBottom: '1.5rem'}}>Strong governance underpins our integrity, data security, and compliance measures.</p>
        <div className="factors-list">
            {data.governanceAnalysis?.map((factor, idx) => (
                <div key={idx} className="factor-card" style={{marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                        <h4 style={{color: 'rgba(var(--primary), 1)'}}>{factor.title}</h4>
                        <span className="small-bold" style={{color: '#059669'}}>{factor.keyData}</span>
                    </div>
                    <p className="normal-regular" style={{marginBottom: '1rem', fontStyle: 'italic'}}>"{factor.strategy}"</p>
                    <p className="normal-regular" style={{lineHeight: 1.6}}><span className="small-bold">Performance:</span> {factor.performance}</p>
                    <p className="normal-regular" style={{lineHeight: 1.6, marginTop: '0.5rem'}}><span className="small-bold">2026 Outlook:</span> {factor.outlook}</p>
                </div>
            ))}
        </div>
      </ReportSection>

      {/* 6. TARGETS */}
      <ReportSection icon={Target} title="6. 2030 Sustainability Roadmap">
          <div className="inventory-table-container">
            <table className="inventory-table" style={{width: '100%'}}>
                <thead>
                    <tr>
                        <th>Target Area</th>
                        <th>2030 Goal</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.futureTargets?.map((t, i) => (
                        <tr key={i}>
                            <td className="medium-bold">{t.area}</td>
                            <td>{t.goal}</td>
                            <td><span style={{backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem'}}>{t.status}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </ReportSection>
    </div>
  );
};

const ReportPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [isProUser] = useState(localStorage.getItem('isProUser') === 'true');

  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('list');
  const [selectedReportData, setSelectedReportData] = useState(null); 
  const [deleteConfirm, setDeleteConfirm] = useState({isOpen: false, title: '', message: '', onConfirm: () => {},});
  const [showNewReportModal, setShowNewReportModal] = useState(false);

  // --- EXTENSIVE PUBLICATION-READY DATA (Golden Lion Brand) ---
  const FULL_SAMPLE_REPORT = {
    productName: "Dried White Sesame (Batch 2024-Q4)",
    boardStatement: "Dear Stakeholders,\n\nThe Board of Directors of Golden Lion is pleased to present our Annual Sustainability Report for FY2025. In a year marked by global climate challenges, we remained steadfast in our mission to deliver high-quality food products while aggressively reducing our carbon footprint. \n\nSustainability is not merely a compliance requirement for us; it is a core pillar of our business strategy. The Board has direct oversight of ESG risks and opportunities, ensuring that climate resilience is integrated into every financial and operational decision. This year, we successfully validated our 2030 emissions reduction targets and expanded our responsible sourcing program to cover 80% of our raw material spend.\n\nWe are committed to transparency and are proud to align this report with the Global Reporting Initiative (GRI) Standards and the TCFD recommendations.",
    companyProfile: "Golden Lion is a leading processor of premium agricultural commodities, specializing in sesame seeds and related food ingredients. Headquartered in Singapore, we serve a global customer base across 15 countries. Our operations encompass sourcing, processing, packaging, and distribution, all managed with a focus on quality and sustainability.",
    sustainabilityApproach: "Our approach is anchored in the concept of 'Double Materiality', considering both the impact of our operations on the environment and society, and the financial impact of climate risks on our business. We prioritize actions that drive decarbonization, circularity, and social equity.",
    stakeholderEngagement: "We actively engage with investors, customers, employees, and suppliers through annual surveys, quarterly town halls, and supplier audits. Key concerns raised this year included Scope 3 transparency and plastic packaging waste, both of which are addressed in this report.",
    frameworks: ["GRI Standards 2021", "SASB Processed Foods", "GHG Protocol", "TCFD"],
    
    // Grouped Data for easier display
    environmentalAnalysis: [
      {
        title: "Scope 1 & 2 Emissions",
        keyData: "205.7 kgCO2e (Total)",
        strategy: "To achieve Net Zero in our operations by 2040 through electrification and renewable energy adoption.",
        performance: "We achieved a 2.5% reduction in Scope 1 (120.50 kgCO2e) by optimizing boiler efficiency. Scope 2 (85.20 kgCO2e) saw a minor increase due to production growth, but intensity per tonne improved by 5%.",
        outlook: "Pilot installation of solar PV panels at our primary processing facility is scheduled for Q3 2025."
      },
      {
        title: "Fleet Fuel Management",
        keyData: "15.50 kgCO2e",
        strategy: "Transitioning logistics to low-carbon fuels and optimizing route efficiency.",
        performance: "Transport emissions dropped by 5% due to dynamic route planning. However, renewable fuel usage remains at 0% due to local supply chain constraints.",
        outlook: "We have signed a contract to secure B20 biodiesel for 30% of our fleet starting FY2026."
      },
      {
        title: "Energy & Waste",
        keyData: "90% Waste Diversion",
        strategy: "Driving circular economy principles to eliminate waste sent to landfill.",
        performance: "Operational energy consumption was held steady at 1.00 GJ. Food waste generation was reduced to 0.5 tonnes, with 90% diverted to animal feed.",
        outlook: "Installing waste heat recovery units on drying ovens to cut natural gas usage by 15%."
      },
      {
        title: "Supply Chain (Env)",
        keyData: "$45k Sust. Rev",
        strategy: "Partnering with suppliers to map and reduce upstream Scope 3 emissions.",
        performance: "Revenue from certified sustainable sources rose 15%. We initiated carbon footprint data collection for Tier 1 suppliers.",
        outlook: "Mandatory environmental scorecards for all new suppliers by 2026."
      }
    ],
    socialAnalysis: [
      {
        title: "Food Safety & Quality",
        keyData: "0 Recalls",
        strategy: "Upholding the highest standards of food safety (HACCP/GFSI) to protect consumer health.",
        performance: "Zero recalls and zero fines. We successfully passed two unannounced external safety audits.",
        outlook: "Upgrading X-ray detection systems to further minimize contamination risks."
      },
      {
        title: "Product Health",
        keyData: "100% Compliance",
        strategy: "Reformulating products to reduce sodium and sugar in line with WHO guidelines.",
        performance: "Achieved 100% compliance for nutritional profiling. Launched a new low-sodium sesame snack line.",
        outlook: "Researching plant-based fortification to enhance micronutrient profiles."
      },
      {
        title: "Labour & Human Rights",
        keyData: "$18.50/hr Wage",
        strategy: "Ensuring fair wages and a safe, inclusive workplace free from discrimination.",
        performance: "Maintained an average hourly wage of $18.50 (15% above local minimum). Employee turnover reduced by 4%.",
        outlook: "Rolling out a 'Future Skills' digital literacy program for all production staff."
      }
    ],
    governanceAnalysis: [
      {
        title: "Data Security",
        keyData: "0 Breaches",
        strategy: "Implementing Zero Trust architecture to safeguard proprietary and customer data.",
        performance: "No data breaches or cybersecurity incidents occurred. Completed quarterly vulnerability assessments.",
        outlook: "Mandatory Multi-Factor Authentication (MFA) rollout for all systems by Q3."
      },
      {
        title: "Ethics & Compliance",
        keyData: "0 Incidents",
        strategy: "Zero tolerance for corruption and strict adherence to marketing regulations.",
        performance: "Zero confirmed incidents of corruption or non-compliance with labeling laws. 100% of staff completed ethics training.",
        outlook: "Implementing an AI-driven compliance monitoring tool for real-time regulatory updates."
      },
      {
        title: "GMO Management",
        keyData: "0% GMO Rev",
        strategy: "Meeting market demand for clean-label, non-GMO ingredients.",
        performance: "Strict segregation maintained. 0% of revenue derived from GMO products.",
        outlook: "Obtaining 'Non-GMO Project Verified' seal for bulk product lines."
      }
    ],
    futureTargets: [
        { area: "Carbon Emissions", goal: "Reduce Scope 1 & 2 by 42% by 2030 (SBTi aligned)", status: "On Track" },
        { area: "Renewable Energy", goal: "100% Renewable Electricity by 2030", status: "In Progress" },
        { area: "Packaging", goal: "100% Recyclable or Compostable Packaging by 2028", status: "On Track" },
        { area: "Supply Chain", goal: "Deforestation-free supply chain by 2027", status: "Not Started" }
    ]
  };

  const fetchReportsList = () => {
    setLoading(true);
    setTimeout(() => {
      const stored = localStorage.getItem('carbonx_reports');
      let parsed = stored ? JSON.parse(stored) : [];
      
      // Force update to new structure if missing 'companyProfile'
      if (parsed.length === 0 || (parsed[0] && !parsed[0].fullData?.companyProfile)) {
         parsed = [{
           id: 1,
           reportName: "FY2025 Carbon Disclosure",
           description: "Annual carbon footprint & sustainability analysis.",
           date: "2025-11-23",
           fullData: FULL_SAMPLE_REPORT
         }];
         localStorage.setItem('carbonx_reports', JSON.stringify(parsed));
      }
      setReportsList(parsed);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchReportsList();
  }, []);

  const resetToSample = () => {
      const parsed = [{
           id: 1,
           reportName: "FY2025 Carbon Disclosure",
           description: "Annual carbon footprint & sustainability analysis.",
           date: "2025-11-23",
           fullData: FULL_SAMPLE_REPORT
      }];
      localStorage.setItem('carbonx_reports', JSON.stringify(parsed));
      setReportsList(parsed);
      alert("Report reset to comprehensive Golden Lion data!");
  };
  
  const performActualDeleteReport = (reportId) => {
    const updatedList = reportsList.filter(r => r.id !== reportId);
    setReportsList(updatedList);
    localStorage.setItem('carbonx_reports', JSON.stringify(updatedList));
  };

  const handleDelete = (reportId) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Report',
      message: 'Are you sure you want to delete this report?',
      onConfirm: () => performActualDeleteReport(reportId)
    });
  };

  const closeDeleteModal = () => setDeleteConfirm({isOpen: false, title: '', message: '', onConfirm: () => {}});

  const handleViewReport = (report) => {
    const data = report.fullData || FULL_SAMPLE_REPORT;
    setSelectedReportData(data);
    setCurrentView('detail');
  };

  // --- ADVANCED PDF GENERATION ---
  const handleDownloadReport = (report) => {
    const doc = new jsPDF();
    const data = report.fullData || FULL_SAMPLE_REPORT;
    let finalY = 0;

    // --- PAGE 1: COVER PAGE ---
    doc.setFillColor(51, 71, 97); // Brand Blue
    doc.rect(0, 0, 210, 297, 'F'); // Full page bg
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.text("SUSTAINABILITY", 20, 100);
    doc.text("REPORT 2025", 20, 115);
    
    doc.setFontSize(14);
    doc.text("Driving Decarbonization & Value Creation", 20, 130);
    
    doc.setFontSize(20);
    doc.text("GOLDEN LION", 20, 230);
    
    doc.setFontSize(12);
    doc.text(`Product Scope: ${data.productName}`, 20, 250);
    doc.text("Generated by CarbonX Platform", 20, 260);
    
    doc.addPage();

    // --- PAGE 2: BOARD STATEMENT & ABOUT US ---
    doc.setTextColor(0);
    doc.setFontSize(16);
    doc.text("1. Board Statement", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    const stmt = doc.splitTextToSize(data.boardStatement, 180);
    doc.text(stmt, 14, 30);
    
    finalY = 30 + (stmt.length * 5) + 15;
    
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("2. About Golden Lion", 14, finalY);
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    const profile = doc.splitTextToSize(data.companyProfile, 180);
    doc.text(profile, 14, finalY + 10);
    
    finalY += (profile.length * 5) + 20;
    
    // Approaches side by side
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Our Sustainability Approach", 14, finalY);
    doc.text("Stakeholder Engagement", 110, finalY);
    
    doc.setFontSize(9);
    doc.setTextColor(80);
    const approach = doc.splitTextToSize(data.sustainabilityApproach, 90);
    const stakeholders = doc.splitTextToSize(data.stakeholderEngagement, 90);
    
    doc.text(approach, 14, finalY + 7);
    doc.text(stakeholders, 110, finalY + 7);
    
    doc.addPage();
    finalY = 20;

    // --- HELPER FOR PRINTING SECTIONS ---
    const printSection = (title, items) => {
        if(finalY > 240) { doc.addPage(); finalY = 20; }
        
        // Section Header
        doc.setFillColor(240, 240, 240);
        doc.rect(14, finalY, 182, 10, 'F');
        doc.setFontSize(14);
        doc.setTextColor(51, 71, 97);
        doc.text(title, 18, finalY + 7);
        finalY += 20;
        
        items.forEach(item => {
             if(finalY > 240) { doc.addPage(); finalY = 20; }
             
             // Item Title & Key Data
             doc.setFontSize(12);
             doc.setTextColor(0);
             doc.setFont("helvetica", "bold");
             doc.text(item.title, 14, finalY);
             
             doc.setFontSize(10);
             doc.setTextColor(22, 163, 74); // Green
             doc.text(item.keyData, 196, finalY, { align: 'right' });
             
             finalY += 6;
             
             // Strategy
             doc.setFontSize(9);
             doc.setTextColor(80);
             doc.setFont("helvetica", "italic");
             const strat = doc.splitTextToSize(`"${item.strategy}"`, 182);
             doc.text(strat, 14, finalY);
             finalY += (strat.length * 4) + 4;
             
             // Performance
             doc.setFont("helvetica", "normal");
             doc.setTextColor(0);
             doc.text("Performance:", 14, finalY);
             doc.setTextColor(60);
             const perf = doc.splitTextToSize(item.performance, 160);
             doc.text(perf, 38, finalY);
             finalY += (perf.length * 4) + 4;
             
             // Outlook
             doc.setTextColor(0);
             doc.text("Outlook:", 14, finalY);
             doc.setTextColor(60);
             const out = doc.splitTextToSize(item.outlook, 160);
             doc.text(out, 38, finalY);
             finalY += (out.length * 4) + 10;
        });
    };

    // Print Pillars
    printSection("3. Environmental Stewardship", data.environmentalAnalysis);
    printSection("4. Social Responsibility", data.socialAnalysis);
    printSection("5. Governance & Ethics", data.governanceAnalysis);

    doc.addPage();
    finalY = 20;
    
    // --- PAGE X: TARGETS ---
    doc.setFontSize(16);
    doc.setTextColor(51, 71, 97);
    doc.text("6. 2030 Sustainability Roadmap", 14, finalY);
    finalY += 10;
    
    const targetRows = data.futureTargets?.map(t => [t.area, t.goal, t.status]) || [];
    autoTable(doc, {
        startY: finalY,
        head: [['Target Area', '2030 Goal', 'Current Status']],
        body: targetRows,
        theme: 'grid',
        headStyles: { fillColor: [51, 71, 97] },
        styles: { fontSize: 10, cellPadding: 3 }
    });

    const fileName = `GoldenLion_Sustainability_Report_FY2025.pdf`;
    doc.save(fileName);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedReportData(null);
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
                <p className = "medium-regular">Manage your carbon footprint & sustainability reports.</p>
              </div>
              <div className = "sub-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <p style = {{color: "rgba(var(--greys), 1)"}}>Showing {filteredReports.length} of {reportsList.length} reports</p>
                <div className = "two-row-component-container">
                  <button className="icon" title="Reset to Full Sample" onClick={resetToSample} style={{backgroundColor: '#f3f4f6', color: '#666'}}>
                     <RefreshCw size={16} />
                  </button>
                  <div className = "input-base search-bar">
                    <Search />
                    <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <button className = "icon" onClick={() => setShowNewReportModal(true)}><Plus /></button>
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
                            No reports found. Click the <Plus size={16} style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 4px' }} /> button to generate a new one.
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