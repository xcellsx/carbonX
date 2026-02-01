import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Archive, ChartColumnBig, Network, FileText, Sprout, Settings } from 'lucide-react';
import './TemplatesPage.css';

const TemplatesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="templates-page">
      <div className="sidebar">
        <div className="sidebar-top">
          <div className="logo-placeholder" />
          <p className="descriptor">Core</p>
          <div className="navbar">
            <button type="button" onClick={() => navigate('/dashboard')} className="nav">
              <LayoutDashboard /><span>Dashboard</span>
            </button>
            <button type="button" onClick={() => navigate('/inventory')} className="nav">
              <Archive /><span>Inventory</span>
            </button>
            <button type="button" onClick={() => navigate('/analytics')} className="nav">
              <ChartColumnBig /><span>Analytics</span>
            </button>
          </div>
          <p className="descriptor">Plugins</p>
          <div className="navbar">
            <button type="button" onClick={() => navigate('/network')} className="nav">
              <Network /><span>Network</span>
            </button>
            <button type="button" onClick={() => navigate('/report')} className="nav">
              <FileText /><span>Report</span>
            </button>
            <button type="button" onClick={() => navigate('/chat')} className="nav">
              <Sprout /><span>Sprout AI</span>
            </button>
          </div>
        </div>
        <div className="sidebar-bottom">
          <button type="button" className="nav" onClick={() => navigate('/settings')}>
            <Settings /><span>Settings</span>
          </button>
        </div>
      </div>

      <div className="content-section-main">
        <div className="content-container-main">
          <div className="header-group">
            <h1>Templates</h1>
            <p className="medium-regular">Create your own product from templates. (Coming soon.)</p>
          </div>
          <div className="templates-placeholder">
            <p>This page is not created yet. Use Upload BOM on the Inventory page to add products from a CSV or JSON file.</p>
            <button type="button" className="default" onClick={() => navigate('/inventory')} style={{ marginTop: '1rem' }}>
              Back to Inventory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;
