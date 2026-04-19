import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout, { AdminRoute } from './components/shared/Layout';
import LandingPage from './components/landing/LandingPage';
import Login from './components/auth/Login';
import Dashboard from './components/admin/Dashboard';
import Projects from './components/employee/Projects';
import Invoices from './components/admin/Invoices';
import Inventory from './components/admin/Inventory';
import Maintenance from './components/maintenance/Maintenance';
import Employees from './components/admin/Employees';
import './styles/App.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes (any authenticated user) */}
          <Route element={<Layout />}>
            <Route path="/projects" element={<Projects />} />
            <Route path="/maintenance" element={<Maintenance />} />

            {/* Admin-only routes */}
            <Route element={<AdminRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/employees" element={<Employees />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
