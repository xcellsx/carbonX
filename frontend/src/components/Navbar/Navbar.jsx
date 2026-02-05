import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Archive,
  ChartColumnBig,
  Network,
  FileText,
  Sprout,
  Settings,
  LayoutTemplate,
  Pencil,
} from 'lucide-react';
import logoPath from '../../assets/carbonx.png';
import { useProSubscription } from '../../hooks/useProSubscription';

/**
 * Shared app sidebar/navbar. Use inside a layout with class "container".
 * Highlights the current route and disables plugin links when not Pro.
 */
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isProUser } = useProSubscription();

  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="logo-button"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <img src={logoPath} alt="Logo" width="48" style={{ margin: 0, padding: 0, display: 'block' }} />
        </button>
        <p className="descriptor">Core Features</p>
        <div className="navbar">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className={`nav ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard /><span>Dashboard</span>
          </button>
          <div className="nav-group">
            <button
              type="button"
              className={`nav ${(location.pathname === '/inventory' || location.pathname === '/add-products' || location.pathname.startsWith('/add-products/edit')) ? 'active' : ''}`}
              onClick={() => navigate('/inventory')}
            >
              <Archive /><span>Inventory</span>
            </button>
            {(location.pathname === '/inventory' || location.pathname === '/add-products' || location.pathname.startsWith('/add-products/edit')) && (
              <div className="navbar-sub">
                <button
                  type="button"
                  className={`nav nav-sub ${location.pathname === '/add-products' ? 'active' : ''}`}
                  onClick={() => navigate('/add-products')}
                >Add Templates
                </button>
                <button
                  type="button"
                  className={`nav nav-sub ${location.pathname.startsWith('/add-products/edit') ? 'active' : ''}`}
                  onClick={() => navigate('/add-products/edit/new')}
                >Edit Templates
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className={`nav ${location.pathname === '/analytics' ? 'active' : ''}`}
            onClick={() => navigate('/analytics')}
          >
            <ChartColumnBig /><span>Analytics</span>
          </button>
        </div>
        <p className="descriptor">Plugins</p>
        <div className="navbar">
          <button
            type="button"
            className={`nav ${location.pathname === '/network' ? 'active' : ''}`}
            onClick={() => navigate('/network')}
            disabled={!isProUser}
          >
            <Network /><span>Network</span>
          </button>
          <button
            type="button"
            className={`nav ${location.pathname === '/report' ? 'active' : ''}`}
            onClick={() => navigate('/report')}
            disabled={!isProUser}
          >
            <FileText /><span>Report</span>
          </button>
          <button
            type="button"
            className={`nav ${location.pathname === '/chat' ? 'active' : ''}`}
            onClick={() => navigate('/chat')}
            disabled={!isProUser}
          >
            <Sprout /><span>Sprout AI</span>
          </button>
        </div>
      </div>
      <div className="sidebar-bottom">
        <button
          type="button"
          className={`nav ${location.pathname === '/settings' ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
        >
          <Settings /><span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
