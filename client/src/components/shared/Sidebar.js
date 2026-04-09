import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'electrician' || user?.role === 'dwaraka';

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2><span className="sun-icon">☀️</span> Solar Manager</h2>
      </div>

      <div className="sidebar-user">
        <div className="user-name">{user?.name}</div>
        <div className="user-role">{user?.role === 'electrician' ? 'Local Electrician' : user?.role === 'dwaraka' ? 'Dwaraka Group' : user?.role}</div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
          <span className="nav-icon">🏠</span> Home
        </NavLink>

        {!isTechnician && (
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>
        )}

        {!isTechnician && (
          <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🔧</span> Projects
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/invoices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📄</span> Invoices
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/inventory" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📦</span> Inventory
          </NavLink>
        )}

        <NavLink to="/maintenance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🛠️</span> Maintenance
        </NavLink>

        {isAdmin && (
          <NavLink to="/employees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">👥</span> User Management
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-icon">🚪</span> Logout
        </button>
      </div>
    </div>
  );
}
