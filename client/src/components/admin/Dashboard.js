import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const STATUS_COLORS = { completed: '#10b981', in_progress: '#f59e0b', planning: '#3b82f6', on_hold: '#64748b', cancelled: '#ef4444' };
const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };

function BarChart({ data, labelKey, valueKey, colorMap, title }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-bars">
        {data.map((item, i) => (
          <div key={item[labelKey]} className="bar-row">
            <span className="bar-label">{item[labelKey].replace(/_/g, ' ')}</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${(item[valueKey] / max) * 100}%`,
                  background: colorMap?.[item[labelKey]] || COLORS[i % COLORS.length],
                }}
              />
            </div>
            <span className="bar-value">{item[valueKey]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerticalBarChart({ data, labelKey, valueKey, title }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="vbar-container">
        {data.map((item, i) => (
          <div key={item[labelKey]} className="vbar-col">
            <span className="vbar-value">{item[valueKey]}</span>
            <div className="vbar-track">
              <div
                className="vbar-fill"
                style={{
                  height: `${(item[valueKey] / max) * 100}%`,
                  background: COLORS[i % COLORS.length],
                }}
              />
            </div>
            <span className="vbar-label">{formatMonth(item[labelKey])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMonth(str) {
  try {
    const [y, m] = str.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m, 10) - 1]} '${y.slice(2)}`;
  } catch { return str; }
}

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

      {/* ── Summary Stat Cards ── */}
      {stats && (
        <>
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

          {/* ── Charts Section ── */}
          <div className="charts-grid">
            {stats.projectsByVillage?.length > 0 && (
              <BarChart
                data={stats.projectsByVillage}
                labelKey="village"
                valueKey="count"
                title="🏘️ Projects by Village"
              />
            )}

            {stats.projectsByMonth?.length > 0 && (
              <VerticalBarChart
                data={stats.projectsByMonth}
                labelKey="month"
                valueKey="count"
                title="📅 Projects by Month"
              />
            )}

            {stats.projectsByStatus?.length > 0 && (
              <BarChart
                data={stats.projectsByStatus}
                labelKey="status"
                valueKey="count"
                colorMap={STATUS_COLORS}
                title="📊 Projects by Status"
              />
            )}

            {stats.maintenanceByType?.length > 0 && (
              <BarChart
                data={stats.maintenanceByType}
                labelKey="type"
                valueKey="count"
                title="🔧 Maintenance by Type"
              />
            )}

            {stats.maintenanceByStatus?.length > 0 && (
              <BarChart
                data={stats.maintenanceByStatus}
                labelKey="status"
                valueKey="count"
                colorMap={STATUS_COLORS}
                title="📋 Maintenance by Status"
              />
            )}

            {stats.maintenanceByPriority?.length > 0 && (
              <BarChart
                data={stats.maintenanceByPriority}
                labelKey="priority"
                valueKey="count"
                colorMap={PRIORITY_COLORS}
                title="🚨 Maintenance by Priority"
              />
            )}
          </div>
        </>
      )}

      {/* ── Recent Projects Table ── */}
      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: 18 }}>Recent Projects</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Customer</th>
                <th>Village</th>
                <th>System Size</th>
                <th>Status</th>
                <th>Start Date</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No projects yet</td></tr>
              ) : (
                recentProjects.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.project_name}</td>
                    <td>{p.customer_name}</td>
                    <td>{p.village || '-'}</td>
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
