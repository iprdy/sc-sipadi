import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import { Homepage } from './pages/Homepage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { InsightPage } from './pages/InsightPage';
import { PredictionModelPage } from './pages/PredictionModelPage';
import { AboutPage } from './pages/AboutPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FilterProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/about" element={<Navigate to="/dashboard/about" replace />} />

            {/* Dashboard Protected/Simulated Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard/monitoring" replace />} />
              <Route path="monitoring" element={<MonitoringPage />} />
              <Route path="analysis" element={<AnalysisPage />} />
              <Route path="insight" element={<InsightPage />} />
              <Route path="prediction-model" element={<PredictionModelPage />} />
              <Route path="about" element={<AboutPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FilterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
