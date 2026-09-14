function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString.replace(' ', 'T') + 'Z');
  return d.toLocaleString();
}

function statusClass(status) {
  return `status-badge status-${status.toLowerCase()}`;
}

export default function SOSHistory({ history }) {
  if (!history || history.length === 0) {
    return <p className="empty-state">No SOS alerts yet.</p>;
  }

  return (
    <table className="history-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Status</th>
          <th>Location</th>
          <th>Message</th>
        </tr>
      </thead>
      <tbody>
        {history.map((alert) => (
          <tr key={alert.id}>
            <td>{formatDate(alert.triggered_at)}</td>
            <td>
              <span className={statusClass(alert.status)}>{alert.status}</span>
            </td>
            <td>
              {alert.latitude && alert.longitude
                ? `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`
                : 'Unavailable'}
            </td>
            <td>{alert.message || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
