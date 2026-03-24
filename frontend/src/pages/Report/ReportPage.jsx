import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ReportPage.css';
import Navbar from '../../components/Navbar/Navbar';
import {
  ChevronDown, Plus, Search, Trash2, Eye, Pencil, Download, ChevronLeft,
  ArrowUp, ArrowDown, Minus, CircleCheck, RefreshCw, BookOpen,
  Target, Users, ShieldCheck, Leaf, X, Sprout, FileText, Sparkles, RotateCcw
} from 'lucide-react';
import InstructionalCarousel from '../../components/InstructionalCarousel/InstructionalCarousel';
import { chatCompletion } from '../../services/openRouter';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';
import DownloadFormatModal from '../../components/DownloadFormatModal/DownloadFormatModal';
import { exportReportToDocxBlob } from '../../utils/reportToDocx';
import { useProSubscription } from '../../hooks/useProSubscription';
import { getEffectiveTargets } from '../../utils/reportTargets';

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
const ReportContent = ({ data, onBack, onGoToSproutAI, onAIClick, onDownload }) => {
  if (!data) {
    return (
      <div className="report-container">
        <button type="button" onClick={onBack} className="nav report-back-btn" style={{ marginBottom: '1.5rem', background: 'transparent', padding: '0.5rem 0' }}>
          <ChevronLeft size={18} />
          <span style={{ fontSize: '1rem' }}>Back to all reports</span>
        </button>
        <div className="report-container" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <p className="medium-regular" style={{ marginBottom: '1rem' }}>No report content available.</p>
          <p className="normal-regular" style={{ color: 'rgba(var(--greys), 1)', marginBottom: '1.5rem' }}>Generate this report in SproutAI to view and download it.</p>
          {onGoToSproutAI && (
            <button type="button" className="default" onClick={onGoToSproutAI}>Go to Sprout AI</button>
          )}
        </div>
      </div>
    );
  }

  // Derive company name and reporting year for header from stored Company Info when available.
  let headerCompanyName = data.companyName || data.productName || 'Sustainability Report';
  let headerReportingYear = null;
  try {
    const allCompanyData = JSON.parse(localStorage.getItem('companyData') || '{}');
    const userId = localStorage.getItem('userId') || '';
    const storageKey = userId.includes('/') ? userId.split('/').pop() : userId;
    const company = allCompanyData[userId] ?? allCompanyData[storageKey] ?? null;
    if (company && typeof company === 'object') {
      if (company.companyName) headerCompanyName = company.companyName;
      const rawYear = (company.reportingYear || '').toString().trim();
      const yearMatch = rawYear.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        headerReportingYear = `FY${yearMatch[1]}`;
      }
    }
  } catch (e) {
    // ignore
  }

  // If we still don't have a sane reporting year, default to previous calendar year (e.g. if today is 2026, show FY2025).
  if (!headerReportingYear) {
    const nowYear = new Date().getFullYear();
    headerReportingYear = `FY${nowYear - 1}`;
  }
  const reportingYearNumber = Number(String(headerReportingYear).replace(/\D/g, '')) || (new Date().getFullYear() - 1);
  const nextOutlookYear = reportingYearNumber + 1;

  // KPI snapshot from LCA cache (fallback when report payload doesn't provide KPIs).
  let kpiSnapshot = { scope1: 0, scope2: 0, scope3: 0, total: 0, productCount: 0 };
  try {
    const lcaByName = JSON.parse(localStorage.getItem('carbonx_lca_cache_by_name_v1') || '{}');
    const entries = Object.values(lcaByName).filter((e) => e && typeof e === 'object');
    kpiSnapshot.productCount = entries.length;
    entries.forEach((e) => {
      kpiSnapshot.scope1 += Number(e.scope1) || 0;
      kpiSnapshot.scope2 += Number(e.scope2) || 0;
      kpiSnapshot.scope3 += Number(e.scope3) || 0;
    });
    kpiSnapshot.total = kpiSnapshot.scope1 + kpiSnapshot.scope2 + kpiSnapshot.scope3;
  } catch (_) {}

  const ensureArray = (arr, fallbackTitle) => {
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return [{
      title: fallbackTitle,
      keyData: 'Data pending',
      strategy: 'The organization is establishing a reporting baseline for this topic.',
      performance: 'Initial data collection and validation are in progress.',
      outlook: 'Targets and implementation roadmap will be refined after baseline completion.',
    }];
  };
  const environmentalAnalysis = ensureArray(data.environmentalAnalysis, 'Environmental Performance');
  const socialAnalysis = ensureArray(data.socialAnalysis, 'Social Performance');
  const governanceAnalysis = ensureArray(data.governanceAnalysis, 'Governance Performance');

  return (
    <div className="report-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button type="button" onClick={onBack} className="nav report-back-btn" style={{ background: 'transparent', padding: '0.5rem 0' }}>
          <ChevronLeft size={18} />
          <span style={{fontSize: '1rem'}}>Back to all reports</span>
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="icon"
              title="Download report"
              style={{ backgroundColor: 'rgba(var(--success), 1)', color: '#fff' }}
            >
              <Download size={18} />
            </button>
          )}
          {onAIClick && (
            <button
              type="button"
              onClick={onAIClick}
              className="icon"
              title="Edit report with AI"
              style={{ backgroundColor: 'rgba(var(--primary), 1)', color: '#fff' }}
            >
              <Sparkles size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="report-header-section" style={{textAlign: 'center', paddingBottom: '3rem', borderBottom: '1px solid #eee', marginBottom: '3rem'}}>
        <h1 style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>
          {data.reportTitle || `${headerCompanyName} Sustainability Report`}
        </h1>
        <p className="medium-regular" style={{fontSize: '1.25rem', color: '#666'}}>
          Reporting Year: <span className="medium-bold">{headerReportingYear || '—'}</span>
        </p>
        <p className="medium-regular" style={{color: '#666'}}>
          Scope: <span className="medium-bold">{data.productName || headerCompanyName || '—'}</span>
        </p>
        <div className="framework-tags" style={{justifyContent: 'center', marginTop: '1.5rem'}}>
          {data.frameworks?.map(f => <span key={f} className="framework-tag">{f}</span>)}
        </div>
      </div>

      {/* 1. BOARD STATEMENT */}
      <ReportSection icon={BookOpen} title="1. Board Statement">
        <div className="board-statement-box" style={{padding: '2rem', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '6px solid rgba(var(--primary), 1)'}}>
            <p className="normal-regular" style={{whiteSpace: 'pre-line', lineHeight: 1.8, textAlign: 'justify'}}>
                {data.boardStatement || 'This report summarizes the organization\'s sustainability performance, governance oversight, and transition priorities for the current reporting period.'}
            </p>
            <div style={{marginTop: '1.5rem', fontStyle: 'italic', fontWeight: 'bold'}}>
                - On behalf of the Board of Directors, {data.companyName || data.productName || 'the Company'}
            </div>
        </div>
      </ReportSection>

      {/* 2. ORGANISATIONAL PROFILE */}
      <ReportSection icon={Users} title={`2. About ${data.companyName || data.productName || 'the Company'}`}>
         <p className="normal-regular" style={{marginBottom: '1rem', lineHeight: 1.7}}>{data.companyProfile || 'The organization operates in its stated sector and is developing a structured sustainability program aligned with stakeholder expectations and reporting obligations.'}</p>
         
         <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem'}}>
             <div>
                 <h4 style={{marginBottom: '0.5rem'}}>Our Sustainability Approach</h4>
                 <p className="normal-regular" style={{lineHeight: 1.7}}>{data.sustainabilityApproach || 'We use a risk-and-opportunity lens to prioritize actions with measurable environmental, social, and governance outcomes.'}</p>
             </div>
             <div>
                 <h4 style={{marginBottom: '0.5rem'}}>Stakeholder Engagement</h4>
                 <p className="normal-regular" style={{lineHeight: 1.7}}>{data.stakeholderEngagement || 'Stakeholder inputs from customers, employees, suppliers, and regulators inform our yearly sustainability priorities and target setting.'}</p>
             </div>
         </div>
      </ReportSection>

      {/* 3. REPORTING BOUNDARY & METHODOLOGY */}
      <ReportSection icon={FileText} title="3. Reporting Boundary & Methodology">
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
          <div className="factor-card" style={{padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
            <h4 style={{marginBottom: '0.5rem'}}>Organizational Boundary</h4>
            <p className="normal-regular" style={{lineHeight: 1.6}}>
              This report covers operations and value-chain activities within the reporting scope defined for {headerCompanyName}. Scope 1, Scope 2, and Scope 3 values reflect data available in CarbonX at the time of generation.
            </p>
          </div>
          <div className="factor-card" style={{padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
            <h4 style={{marginBottom: '0.5rem'}}>Methodology</h4>
            <p className="normal-regular" style={{lineHeight: 1.6}}>
              Emissions are structured using the GHG Protocol scope model and product-level LCA calculations where available. Report figures should be interpreted alongside source-data completeness and coverage assumptions.
            </p>
          </div>
        </div>
      </ReportSection>

      {/* 4. KPI SNAPSHOT */}
      <ReportSection icon={Target} title={`4. KPI Snapshot (${headerReportingYear})`}>
        <div className="inventory-table-container">
          <table className="inventory-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="medium-bold">Scope 1 Emissions</td><td>{kpiSnapshot.scope1.toFixed(2)} kgCO2e</td></tr>
              <tr><td className="medium-bold">Scope 2 Emissions</td><td>{kpiSnapshot.scope2.toFixed(2)} kgCO2e</td></tr>
              <tr><td className="medium-bold">Scope 3 Emissions</td><td>{kpiSnapshot.scope3.toFixed(2)} kgCO2e</td></tr>
              <tr><td className="medium-bold">Total GHG Emissions</td><td>{kpiSnapshot.total.toFixed(2)} kgCO2e</td></tr>
              <tr><td className="medium-bold">Products with LCA data</td><td>{kpiSnapshot.productCount}</td></tr>
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* 5. PILLAR: ENVIRONMENT */}
      <ReportSection icon={Leaf} title="5. Environmental Stewardship">
        <p className="normal-regular" style={{marginBottom: '1.5rem'}}>We are dedicated to minimizing our ecological footprint through efficient resource management and decarbonization.</p>
        <div className="factors-list">
            {environmentalAnalysis.map((factor, idx) => (
                <div key={idx} className="factor-card" style={{marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                        <h4 style={{color: 'rgba(var(--primary), 1)'}}>{factor.title}</h4>
                        <span className="small-bold" style={{color: '#059669'}}>{factor.keyData}</span>
                    </div>
                    <p className="normal-regular" style={{marginBottom: '1rem', fontStyle: 'italic'}}>"{factor.strategy}"</p>
                    <p className="normal-regular" style={{lineHeight: 1.6}}><span className="small-bold">Performance:</span> {factor.performance}</p>
                    <p className="normal-regular" style={{lineHeight: 1.6, marginTop: '0.5rem'}}><span className="small-bold">{nextOutlookYear} Outlook:</span> {factor.outlook}</p>
                </div>
            ))}
        </div>
      </ReportSection>

      {/* 6. PILLAR: SOCIAL */}
      <ReportSection icon={Users} title="6. Social Responsibility">
        <p className="normal-regular" style={{marginBottom: '1.5rem'}}>Our social strategy focuses on product safety, employee well-being, and community trust.</p>
        <div className="factors-list">
            {socialAnalysis.map((factor, idx) => (
                <div key={idx} className="factor-card" style={{marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                        <h4 style={{color: 'rgba(var(--primary), 1)'}}>{factor.title}</h4>
                        <span className="small-bold" style={{color: '#059669'}}>{factor.keyData}</span>
                    </div>
                    <p className="normal-regular" style={{marginBottom: '1rem', fontStyle: 'italic'}}>"{factor.strategy}"</p>
                    <p className="normal-regular" style={{lineHeight: 1.6}}><span className="small-bold">Performance:</span> {factor.performance}</p>
                    <p className="normal-regular" style={{lineHeight: 1.6, marginTop: '0.5rem'}}><span className="small-bold">{nextOutlookYear} Outlook:</span> {factor.outlook}</p>
                </div>
            ))}
        </div>
      </ReportSection>

      {/* 7. PILLAR: GOVERNANCE */}
      <ReportSection icon={ShieldCheck} title="7. Governance & Ethics">
        <p className="normal-regular" style={{marginBottom: '1.5rem'}}>Strong governance underpins our integrity, data security, and compliance measures.</p>
        <div className="factors-list">
            {governanceAnalysis.map((factor, idx) => (
                <div key={idx} className="factor-card" style={{marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                        <h4 style={{color: 'rgba(var(--primary), 1)'}}>{factor.title}</h4>
                        <span className="small-bold" style={{color: '#059669'}}>{factor.keyData}</span>
                    </div>
                    <p className="normal-regular" style={{marginBottom: '1rem', fontStyle: 'italic'}}>"{factor.strategy}"</p>
                    <p className="normal-regular" style={{lineHeight: 1.6}}><span className="small-bold">Performance:</span> {factor.performance}</p>
                    <p className="normal-regular" style={{lineHeight: 1.6, marginTop: '0.5rem'}}><span className="small-bold">{nextOutlookYear} Outlook:</span> {factor.outlook}</p>
                </div>
            ))}
        </div>
      </ReportSection>

      {/* 8. DATA QUALITY & ASSURANCE */}
      <ReportSection icon={CircleCheck} title="8. Data Quality & Assurance">
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
          <div className="factor-card" style={{padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
            <h4 style={{marginBottom: '0.5rem'}}>Data Quality & Limitations</h4>
            <p className="normal-regular" style={{lineHeight: 1.6}}>
              Report outputs depend on available inventory, process links, and factor coverage. Data gaps or partial boundaries may reduce comparability across periods.
            </p>
          </div>
          <div className="factor-card" style={{padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
            <h4 style={{marginBottom: '0.5rem'}}>Assurance Status</h4>
            <p className="normal-regular" style={{lineHeight: 1.6}}>
              This report is currently prepared with internal data controls. External assurance status should be documented once third-party verification is completed.
            </p>
          </div>
        </div>
      </ReportSection>

      {/* 9. TARGETS */}
      <ReportSection icon={Target} title="9. 2030 Sustainability Roadmap">
          {(!data.futureTargets || data.futureTargets.length === 0) && (
            <p className="normal-regular" style={{ color: 'rgba(var(--greys), 1)', fontStyle: 'italic', marginBottom: '1rem', fontSize: '0.875rem' }}>
              No targets were specified — the following are suggested benchmarks aligned to the Singapore Green Plan 2030 and SBTi 1.5°C pathway. Use the AI editor to customise them.
            </p>
          )}
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
                    {getEffectiveTargets(data).map((t, i) => (
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

const REPORT_CAROUSEL_SLIDES = [
  { title: 'Welcome to Report', description: 'View and manage your sustainability reports. Reports are AI-generated from Sprout AI—request a report in chat and it will appear here with a name and description.', icon: <FileText size={40} /> },
  { title: 'Report list', description: 'Search and sort your reports. Click a report to open it and read the full content. Use "Back to all reports" to return to the list.', icon: <FileText size={40} /> },
  { title: 'Download', description: 'Open a report and click Download to save it as PDF or DOCX. Generate new reports by going to Sprout AI and asking for a sustainability or carbon report.', icon: <Download size={40} /> },
];

const REPORT_VIEW_CAROUSEL_SLIDES = [
  { title: 'Viewing a report', description: 'This is the full report content. Scroll to read the board statement, company profile, environmental and social analysis, and future targets.', icon: <BookOpen size={40} /> },
  { title: 'Download', description: 'Click Download to choose PDF or DOCX and save the report to your device. Use "Back to all reports" to return to the list.', icon: <Download size={40} /> },
];

const ReportPage = () => {
  const navigate = useNavigate();
  
  const { isProUser } = useProSubscription();

  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('list');
  const [selectedReportData, setSelectedReportData] = useState(null); 
  const [deleteConfirm, setDeleteConfirm] = useState({isOpen: false, title: '', message: '', onConfirm: () => {},});
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [downloadModalReport, setDownloadModalReport] = useState(null);
  const [showEditorPanel, setShowEditorPanel] = useState(false);
  const [editorInput, setEditorInput] = useState('');
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [editorHistory, setEditorHistory] = useState([]); // stack of previous fullData for undo
  const [viewingReportId, setViewingReportId] = useState(null);
  const editorInputRef = useRef(null);

  // --- Demo/sample report data (fictional Golden Lion brand).
  // Used ONLY when the user explicitly clicks the "Load demo report" button.
  // All normal reports shown here are generated by SproutAI using live AI models.
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

  const location = useLocation();
  const openReportIdFromState = location.state?.openReportId;

  const fetchReportsList = () => {
    setLoading(true);
    setTimeout(() => {
      const stored = localStorage.getItem('carbonx_reports');
      const parsed = stored ? JSON.parse(stored) : [];
      setReportsList(Array.isArray(parsed) ? parsed : []);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchReportsList();
  }, []);

  useEffect(() => {
    if (!openReportIdFromState || reportsList.length === 0) return;
    const report = reportsList.find(r => r.id === openReportIdFromState);
    if (report) {
      setSelectedReportData(report.fullData || null);
      setViewingReportId(report.id || null);
      setEditorHistory([]);
      setCurrentView('detail');
    }
    window.history.replaceState({}, '', location.pathname);
  }, [openReportIdFromState, reportsList, location.pathname]);

  const resetToSample = () => {
      const parsed = [{
           id: 1,
           reportName: "Demo: FY2025 Carbon Disclosure",
           description: "Demo report with fictional data for presentation/testing.",
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
    setSelectedReportData(report.fullData || null);
    setViewingReportId(report.id || null);
    setEditorHistory([]);
    setCurrentView('detail');
  };

  const safeFileName = (name) => (name || 'report').replace(/[^a-zA-Z0-9-_.\s]/g, '').replace(/\s+/g, '_').slice(0, 80);

  const handleSparkleClick = () => {
    setShowEditorPanel(true);
    setEditorError('');
    setTimeout(() => editorInputRef.current?.focus(), 100);
  };

  const handleEditorUndo = () => {
    if (editorHistory.length === 0) return;
    const prev = editorHistory[editorHistory.length - 1];
    setEditorHistory(h => h.slice(0, -1));
    setSelectedReportData(prev);
    // Also persist the undo to localStorage
    setReportsList(list => {
      const updated = list.map(r => r.fullData === selectedReportData ? { ...r, fullData: prev } : r);
      localStorage.setItem('carbonx_reports', JSON.stringify(updated));
      return updated;
    });
  };

  const handleEditorApply = async () => {
    const instruction = editorInput.trim();
    if (!instruction || !selectedReportData || editorLoading) return;
    setEditorLoading(true);
    setEditorError('');

    const EDITOR_SYSTEM = `You are an AI report editor. The user will give you a JSON sustainability report and an editing instruction.
Apply the instruction to modify the report, then return ONLY the updated JSON object — no markdown, no code fences, no extra text.
Preserve all fields that are not affected by the instruction. The JSON must have the same top-level structure as the input.`;

    const userMsg = `Editing instruction: ${instruction}

Current report JSON:
${JSON.stringify(selectedReportData, null, 2).slice(0, 8000)}`;

    try {
      const raw = await chatCompletion(
        [
          { role: 'system', content: EDITOR_SYSTEM },
          { role: 'user', content: userMsg },
        ],
        { model: 'google/gemini-2.0-flash-001', max_tokens: 4096, temperature: 0.4 }
      );
      let text = raw.trim();
      const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeMatch) text = codeMatch[1].trim();
      const updated = JSON.parse(text);
      if (!updated || typeof updated !== 'object') throw new Error('AI returned invalid JSON');

      // Save previous state for undo
      setEditorHistory(h => [...h, selectedReportData]);
      setSelectedReportData(updated);
      setEditorInput('');

      // Persist to localStorage using the report ID
      setReportsList(list => {
        const updatedList = list.map(r =>
          r.id === viewingReportId ? { ...r, fullData: updated } : r
        );
        localStorage.setItem('carbonx_reports', JSON.stringify(updatedList));
        return updatedList;
      });
    } catch (err) {
      setEditorError(`Failed to apply changes: ${err.message}. Please try a simpler instruction.`);
    } finally {
      setEditorLoading(false);
    }
  };

  // --- PDF GENERATION (report content only; no hardcoded template) ---
  const handleDownloadReport = (report) => {
    if (!report.fullData || !report.fullData.boardStatement) {
      alert('No report content to download. Generate this report in SproutAI first.');
      return;
    }
    const data = report.fullData;
    const doc = new jsPDF();
    let finalY = 0;

    // --- PAGE 1: COVER PAGE ---
    doc.setFillColor(51, 71, 97);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.text("SUSTAINABILITY", 20, 100);
    doc.text("REPORT 2025", 20, 115);
    doc.setFontSize(14);
    doc.text("Driving Decarbonization & Value Creation", 20, 130);
    doc.setFontSize(20);
    doc.text((data.productName || 'Sustainability Report').slice(0, 40), 20, 230);
    doc.setFontSize(12);
    doc.text(`Scope: ${(data.productName || '').slice(0, 50)}`, 20, 250);
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
    doc.text(`2. About ${data.companyName || data.productName || 'the Company'}`, 14, finalY);
    doc.setFontSize(10);
    doc.setTextColor(60);
    const profile = doc.splitTextToSize(data.companyProfile || '', 180);
    doc.text(profile, 14, finalY + 10);
    finalY += (profile.length * 5) + 20;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Our Sustainability Approach", 14, finalY);
    doc.text("Stakeholder Engagement", 110, finalY);
    doc.setFontSize(9);
    doc.setTextColor(80);
    const approach = doc.splitTextToSize((data.sustainabilityApproach || ''), 90);
    const stakeholders = doc.splitTextToSize((data.stakeholderEngagement || ''), 90);
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
             if (!item || typeof item !== 'object') return;
             if (finalY > 240) { doc.addPage(); finalY = 20; }
             const titleStr = item.title || '';
             const keyStr = item.keyData || '';
             const stratStr = item.strategy || '';
             const perfStr = item.performance || '';
             const outStr = item.outlook || '';
             // Page overflow guard before each item
             if (finalY > 240) { doc.addPage(); finalY = 20; }
             doc.setFontSize(11);
             doc.setTextColor(0);
             doc.setFont("helvetica", "bold");
             const titleLines = doc.splitTextToSize(titleStr, 182);
             doc.text(titleLines, 14, finalY);
             finalY += (titleLines.length * 5) + 2;
             if (keyStr) {
               doc.setFontSize(9);
               doc.setTextColor(22, 163, 74);
               doc.setFont("helvetica", "normal");
               const keyLines = doc.splitTextToSize(keyStr, 182);
               doc.text(keyLines, 14, finalY);
               finalY += (keyLines.length * 4) + 3;
             }
             doc.setFontSize(9);
             doc.setTextColor(80);
             doc.setFont("helvetica", "italic");
             const strat = doc.splitTextToSize(stratStr ? `"${stratStr}"` : '', 182);
             if (strat.length > 0 && strat[0]) {
               doc.text(strat, 14, finalY);
               finalY += (strat.length * 4) + 3;
             }
             doc.setFont("helvetica", "bold");
             doc.setTextColor(40);
             doc.setFontSize(9);
             if (perfStr) {
               if (finalY > 265) { doc.addPage(); finalY = 20; }
               doc.text("Performance:", 14, finalY);
               doc.setFont("helvetica", "normal");
               doc.setTextColor(60);
               const perf = doc.splitTextToSize(perfStr, 158);
               doc.text(perf, 40, finalY);
               finalY += (perf.length * 4) + 3;
             }
             if (outStr) {
               if (finalY > 265) { doc.addPage(); finalY = 20; }
               doc.setFont("helvetica", "bold");
               doc.setTextColor(40);
               doc.text("Outlook:", 14, finalY);
               doc.setFont("helvetica", "normal");
               doc.setTextColor(60);
               const out = doc.splitTextToSize(outStr, 158);
               doc.text(out, 40, finalY);
               finalY += (out.length * 4) + 8;
             } else {
               finalY += 5;
             }
        });
    };

    printSection("3. Environmental Stewardship", data.environmentalAnalysis || []);
    printSection("4. Social Responsibility", data.socialAnalysis || []);
    printSection("5. Governance & Ethics", data.governanceAnalysis || []);

    doc.addPage();
    finalY = 20;
    
    // --- PAGE X: TARGETS ---
    doc.setFontSize(16);
    doc.setTextColor(51, 71, 97);
    doc.text("6. 2030 Sustainability Roadmap", 14, finalY);
    finalY += 10;
    
    const targetRows = getEffectiveTargets(data).map(t => [t.area || '', t.goal || '', t.status || '']);
    autoTable(doc, {
        startY: finalY,
        head: [['Target Area', '2030 Goal', 'Current Status']],
        body: targetRows,
        theme: 'grid',
        tableWidth: 'wrap',
        margin: { left: 14, right: 14 },
        headStyles: {
          fillColor: [51, 71, 97],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          textColor: [30, 30, 30],
          fontSize: 9,
          cellPadding: 4,
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 95 },
          2: { cellWidth: 45 },
        },
        styles: { overflow: 'linebreak', lineColor: [200, 200, 200], lineWidth: 0.3 },
    });

    doc.save(`${safeFileName(report.reportName || data.productName)}.pdf`);
  };

  const handleDownloadDocx = async (report) => {
    if (!report.fullData || !report.fullData.boardStatement) {
      alert('No report content to download. Generate this report in SproutAI first.');
      return;
    }
    try {
      const blob = await exportReportToDocxBlob(report.fullData);
      saveAs(blob, `${safeFileName(report.reportName || report.fullData.productName)}.docx`);
    } catch (e) {
      alert('Failed to generate Word document. Try again or download as PDF.');
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedReportData(null);
    setShowEditorPanel(false);
    setEditorHistory([]);
    setViewingReportId(null);
  };

  const filteredReports = reportsList.filter(report =>
    report.reportName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container">
      <InstructionalCarousel pageId="report" slides={REPORT_CAROUSEL_SLIDES} newUserOnly />
      {currentView === 'detail' && (
        <InstructionalCarousel pageId="report-view" slides={REPORT_VIEW_CAROUSEL_SLIDES} newUserOnly />
      )}
      <Navbar />
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
                  <button className="icon" title="Load demo report (fictional data)" onClick={resetToSample} style={{backgroundColor: '#f3f4f6', color: '#666'}}>
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
                        <th className="report-table-description-col">Description</th>
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
                            <td className="report-table-description-col">{report.description}</td>
                            <td>{report.date ? new Date(report.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                            <td>
                              <div className='two-row-component-container' style={{ gap: '0.5rem' }}>
                                <button className="icon" title="View Report" onClick={() => handleViewReport(report)} style={{ backgroundColor: 'rgba(var(--info), 1)' }}>
                                  <Eye size={16} />
                                </button>
                                <button className="icon" title="Download" onClick={() => setDownloadModalReport(report)} style={{ backgroundColor: 'rgba(var(--success), 1)' }}>
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
              <ReportContent
                data={selectedReportData}
                onBack={handleBackToList}
                onGoToSproutAI={() => navigate('/chat')}
                onAIClick={handleSparkleClick}
                onDownload={() => {
                  const liveReport = reportsList.find(r => r.id === viewingReportId);
                  setDownloadModalReport(liveReport
                    ? { ...liveReport, fullData: selectedReportData }
                    : { reportName: 'report', fullData: selectedReportData });
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      <ConfirmationModal isOpen={deleteConfirm.isOpen} title={deleteConfirm.title} onClose={closeDeleteModal} onConfirm={() => { deleteConfirm.onConfirm(); closeDeleteModal(); }}>
        {deleteConfirm.message}
      </ConfirmationModal>

      <GenerateReportModal isOpen={showNewReportModal} onClose={() => setShowNewReportModal(false)} onNavigate={() => { setShowNewReportModal(false); navigate('/chat'); }} />

      <DownloadFormatModal
        isOpen={!!downloadModalReport}
        onClose={() => setDownloadModalReport(null)}
        reportName={downloadModalReport?.reportName}
        onSelectPdf={() => downloadModalReport && handleDownloadReport(downloadModalReport)}
        onSelectDocx={() => downloadModalReport && handleDownloadDocx(downloadModalReport)}
      />

      {/* AI Report Editor Panel */}
      {showEditorPanel && currentView === 'detail' && (
        <div className="report-editor-panel">
          <div className="report-editor-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} color="rgba(var(--primary), 1)" />
              <span className="medium-bold" style={{ fontSize: 'var(--normal)' }}>AI Report Editor</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {editorHistory.length > 0 && (
                <button
                  type="button"
                  className="report-editor-undo"
                  onClick={handleEditorUndo}
                  title="Undo last change"
                  disabled={editorLoading}
                >
                  <RotateCcw size={14} />
                  Undo
                </button>
              )}
              <button type="button" className="report-editor-close" onClick={() => setShowEditorPanel(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
          </div>

          <p className="normal-regular" style={{ fontSize: 'var(--small)', color: 'rgba(var(--greys), 1)', marginBottom: '0.75rem' }}>
            Describe the change you want — e.g. "remove the energy consumption section", "update the board statement to be more concise", "add a target for net zero by 2040".
          </p>

          {editorError && (
            <p className="submit-error" style={{ marginBottom: '0.5rem', fontSize: 'var(--small)' }}>{editorError}</p>
          )}

          <div className="report-editor-input-row">
            <textarea
              ref={editorInputRef}
              className="report-editor-textarea"
              placeholder="What would you like to change?"
              value={editorInput}
              onChange={e => setEditorInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleEditorApply(); }}
              disabled={editorLoading}
              rows={3}
            />
            <button
              type="button"
              className="icon" style={{ backgroundColor: 'rgba(var(--primary), 1)', color: '#fff' }}
              onClick={handleEditorApply}
              disabled={editorLoading || !editorInput.trim()}
              title="Apply change (Ctrl+Enter)"
            >
              {editorLoading
                ? <div className="report-editor-spinner" />
                : <CircleCheck size={18} />
              }
            </button>
          </div>
          {editorLoading && (
            <p className="normal-regular" style={{ fontSize: 'var(--small)', color: 'rgba(var(--greys), 1)', marginTop: '0.5rem' }}>
              Applying changes…
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportPage;