import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, requestNotificationPermission } from '../../utils/notifications';
import Sidebar from './Sidebar';

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const refreshNotifs = useCallback(() => {
    if (user) {
      setUnreadCount(getUnreadCount(user.id));
      setNotifications(getNotifications(user.id).slice(0, 20));
    }
  }, [user]);

  useEffect(() => {
    requestNotificationPermission();
    refreshNotifs();
    const handler = () => refreshNotifs();
    window.addEventListener('notifications-updated', handler);
    // Poll every 10s for cross-tab updates
    const interval = setInterval(refreshNotifs, 10000);
    return () => { window.removeEventListener('notifications-updated', handler); clearInterval(interval); };
  }, [refreshNotifs]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <div className="notif-wrapper" ref={notifRef}>
            <button className="notif-bell" onClick={() => { setNotifOpen(o => !o); refreshNotifs(); }} aria-label="Notifications">
              🔔
              {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <strong>Notifications</strong>
                  {unreadCount > 0 && (
                    <button className="notif-mark-all" onClick={() => { markAllAsRead(user.id); refreshNotifs(); }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="notif-dropdown-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`notif-item ${n.read ? '' : 'notif-unread'}`}
                        onClick={() => { markAsRead(n.id); refreshNotifs(); }}
                      >
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-msg">{n.message}</div>
                        <div className="notif-item-time">{new Date(n.timestamp).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
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
