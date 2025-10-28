import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignupPage from './components/Auth/SignupPage';
import LoginPage from './components/Auth/LoginPage';
import CompanyInfoPage from './components/Company/CompanyInfoPage';
import GuidePage from './components/Guide/GuidePage';
import DashboardPage from './components/Dashboard/DashboardPage';
import InventoryPage from './components/Inventory/InventoryPage';

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
      </Routes>
    </Router>
  );
}

export default App;
