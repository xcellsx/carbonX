import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignupPage from './components/Auth/SignupPage';
import LoginPage from './components/Auth/LoginPage';
import CompanyInfoPage from './components/Company/CompanyInfoPage';
import GuidePage from './components/Guide/GuidePage';
import DashboardPage from './components/Dashboard/DashboardPage';
import InventoryPage from './components/Inventory/InventoryPage';
import AnalyticsPage from './components/Analytics/AnalyticsPage';
import NetworkPage from './components/Network/NetworkPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/company-info" element={<CompanyInfoPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/network" element={<NetworkPage />} />
      </Routes>
    </Router>
  );
}

export default App;
