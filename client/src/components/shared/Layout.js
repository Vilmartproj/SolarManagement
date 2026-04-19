import React from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="top-header">
          <span className="top-header-user">👤 {user?.name} ({user?.role === 'electrician' ? 'Local Electrician' : user?.role === 'dwaraka' ? 'Dwaraka Group' : user?.role})</span>
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
