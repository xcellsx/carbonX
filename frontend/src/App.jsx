import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SignupPage from './components/Auth/SignupPage';
import LoginPage from './components/Auth/LoginPage';
import CompanyInfoPage from './components/Company/CompanyInfoPage';
import DashboardPage from './components/Dashboard/DashboardPage';
import InventoryPage from './components/Inventory/InventoryPage';
import AnalyticsPage from './components/Analytics/AnalyticsPage';
import NetworkPage from './components/Network/NetworkPage';
import SettingsPage from './components/Settings/SettingsPage';
import ReportPage from './components/Report/ReportPage';
import SproutAiPage from './components/SproutAI/SproutAIPage';

function App() {
  return (
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/company-info" element={<CompanyInfoPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/report" element ={<ReportPage />} />
        <Route path="/chat" element ={<SproutAiPage />} />

      </Routes>
  );
}

export default App;