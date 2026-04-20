// ── In-App Notification System (localStorage-based) ──

const NOTIF_KEY = 'solar_notifications';

export function getNotifications(userId) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    return all.filter(n => n.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
  } catch { return []; }
}

export function getUnreadCount(userId) {
  return getNotifications(userId).filter(n => !n.read).length;
}

export function addNotification({ userId, title, message }) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    const notif = {
      id: Date.now() + Math.random(),
      userId,
      title,
      message,
      read: false,
      timestamp: Date.now(),
    };
    all.push(notif);
    // Keep only last 50 per user
    const filtered = all.slice(-200);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(filtered));

    // Fire browser notification if permitted
    sendBrowserNotification(title, message);

    // Dispatch event so bell icon updates in real-time
    window.dispatchEvent(new Event('notifications-updated'));

    return notif;
  } catch { return null; }
}

export function markAsRead(notifId) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    const idx = all.findIndex(n => n.id === notifId);
    if (idx !== -1) all[idx].read = true;
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('notifications-updated'));
  } catch { /* ignore */ }
}

export function markAllAsRead(userId) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    all.forEach(n => { if (n.userId === userId) n.read = true; });
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('notifications-updated'));
  } catch { /* ignore */ }
}

// ── Browser Notification API ──

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/logo192.png',
        badge: '/logo192.png',
      });
    } catch { /* ignore — may fail on some mobile browsers */ }
  }
}

// ── Helper: notify technician(s) on assignment ──

export function notifyAssignment({ assignedTo, electricianName, projectName, issueType, technicianUsers }) {
  if (!assignedTo || !technicianUsers?.length) return;

  // Map assigned_to value to role
  const roleMap = { local_electrician: 'electrician', dwcra_group: 'dwcra' };
  const targetRole = roleMap[assignedTo];

  // Find matching technician user(s)
  let targets = technicianUsers.filter(u => u.role === targetRole);
  if (electricianName) {
    const specific = targets.filter(u => u.name === electricianName);
    if (specific.length) targets = specific;
  }

  const issueLabel = issueType?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Maintenance';

  targets.forEach(user => {
    addNotification({
      userId: user.id,
      title: '🔧 New Maintenance Assignment',
      message: `You have been assigned: ${issueLabel} for "${projectName || 'Unknown Project'}". Please check your maintenance dashboard.`,
    });
  });
}
