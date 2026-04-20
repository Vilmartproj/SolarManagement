import React, { useState, useCallback } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Close sidebar on route change
  React.useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="main-content">
        <div className="top-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
          <span className="top-header-user">👤 {user?.name} ({user?.role === 'electrician' ? 'Local Electrician' : user?.role === 'dwcra' ? 'DWCRA Group' : user?.role})</span>
          <button className="btn btn-sm top-header-logout" onClick={handleLogout}>🚪 Logout</button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/maintenance" />;

  return <Outlet />;
}
