import { useEffect, useState } from 'react';
import api from '../services/api';

function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString.replace(' ', 'T') + 'Z');
  return d.toLocaleString();
}

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [statsRes, alertsRes] = await Promise.all([
          api.get('/users/admin/stats'),
          api.get('/sos/admin/all')
        ]);
        setStats(statsRes.data.stats);
        setAlerts(alertsRes.data.alerts.slice(0, 15));
      } catch (err) {
        setError('Unable to connect to the server. Please check your internet connection.');
      }
    }
    loadAdminData();
  }, []);

  return (
    <div className="page">
      <h1>Admin Panel</h1>
      {error && <p className="form-error">{error}</p>}

      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.totalUsers}</span>
            <span className="admin-stat-label">Total Users</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.activeAlerts}</span>
            <span className="admin-stat-label">Active SOS</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.totalAlerts}</span>
            <span className="admin-stat-label">Total Alerts</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.resolvedAlerts}</span>
            <span className="admin-stat-label">Resolved Alerts</span>
          </div>
        </div>
      )}

      <h3>Recent SOS Alerts</h3>
      {alerts.length === 0 ? (
        <p className="empty-state">No SOS alerts recorded yet.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td>{alert.user_name}</td>
                <td>
                  <span className={`status-badge status-${alert.status.toLowerCase()}`}>
                    {alert.status}
                  </span>
                </td>
                <td>{formatDate(alert.triggered_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
