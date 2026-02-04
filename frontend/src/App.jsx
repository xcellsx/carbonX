import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SignupPage from './pages/Auth/SignupPage';
import LoginPage from './pages/Auth/LoginPage';
import CompanyInfoPage from './pages/Company/CompanyInfoPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import InventoryPage from './pages/Inventory/InventoryPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import NetworkPage from './pages/Network/NetworkPage';
import SettingsPage from './pages/Settings/SettingsPage';
import ReportPage from './pages/Report/ReportPage';
import SproutAiPage from './pages/SproutAI/SproutAIPage';
import AddProductsPage from './pages/AddProducts/AddProductsPage';
import EditTemplatePage from './pages/AddProducts/EditTemplatePage';

function App() {
  return (
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/company-info" element={<CompanyInfoPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/add-products" element={<AddProductsPage />} />
        <Route path="/add-products/edit/:id" element={<EditTemplatePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/report" element ={<ReportPage />} />
        <Route path="/chat" element ={<SproutAiPage />} />

      </Routes>
  );
}

export default App;