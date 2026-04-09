import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, projectsRes] = await Promise.all([
          api.get('/projects/dashboard'),
          api.get('/projects?limit=5'),
        ]);
        setStats(statsRes.data);
        setRecentProjects(projectsRes.data.slice(0, 5));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <span style={{ color: '#64748b' }}>Welcome back, {user?.name}!</span>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-value">{stats.totalProjects}</div>
            <div className="stat-label">Total Projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-value">{stats.activeProjects}</div>
            <div className="stat-label">Active Projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.completedProjects}</div>
            <div className="stat-label">Completed</div>
          </div>
          {user?.role === 'admin' && (
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">₹{Number(stats.totalRevenue).toLocaleString()}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
          )}
          <div className="stat-card">
            <div className="stat-icon">🔧</div>
            <div className="stat-value">{stats.pendingMaintenance}</div>
            <div className="stat-label">Pending Maintenance</div>
          </div>
          {user?.role === 'admin' && (
            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-value">{stats.lowStockItems}</div>
              <div className="stat-label">Low Stock Items</div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: 18 }}>Recent Projects</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Customer</th>
                <th>System Size</th>
                <th>Status</th>
                <th>Start Date</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No projects yet</td></tr>
              ) : (
                recentProjects.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.project_name}</td>
                    <td>{p.customer_name}</td>
                    <td>{p.system_size_kw} kW</td>
                    <td><span className={`badge badge-${p.status}`}>{p.status.replace('_', ' ')}</span></td>
                    <td>{p.start_date ? new Date(p.start_date).toLocaleDateString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
