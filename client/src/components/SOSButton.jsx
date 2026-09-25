import { useState } from 'react';
import api from '../services/api';

function getFreshLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  });
}

export default function SOSButton({ activeAlert, onAlertChange, location, locationError }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    setLoading(true);
    setError('');
    try {
      // If we don't already have a location fix, try once more right now —
      // the dashboard's earlier attempt may have run before permission was granted.
      const finalLocation = location || (await getFreshLocation());

      const { data } = await api.post('/sos', {
        latitude: finalLocation?.latitude ?? null,
        longitude: finalLocation?.longitude ?? null,
        accuracy: finalLocation?.accuracy ?? null,
        message: 'Emergency assistance required'
      });
      onAlertChange(data.alert);
      setConfirming(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send SOS. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!activeAlert) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.patch(`/sos/${activeAlert.id}/cancel`);
      onAlertChange(data.alert.status === 'CANCELLED' ? null : data.alert);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to cancel SOS.');
    } finally {
      setLoading(false);
    }
  }

  if (activeAlert) {
    return (
      <div className="sos-card sos-card-active">
        <div className="sos-active-badge">🚨 ACTIVE SOS</div>
        <p>Help is on the way. Your emergency contacts have been notified.</p>
        {error && <p className="sos-error">{error}</p>}
        <button className="sos-cancel-btn" onClick={handleCancel} disabled={loading}>
          {loading ? 'Cancelling...' : 'Cancel SOS'}
        </button>
      </div>
    );
  }

  return (
    <div className="sos-card">
      {locationError && <p className="sos-warning">{locationError}</p>}
      {error && <p className="sos-error">{error}</p>}

      {!confirming ? (
        <button className="sos-button" onClick={() => setConfirming(true)}>
          <span className="sos-icon">🚨</span>
          <span className="sos-label">EMERGENCY SOS</span>
          <span className="sos-sublabel">Tap to request help</span>
        </button>
      ) : (
        <div className="sos-confirm">
          <p>Are you sure you want to send an emergency SOS?</p>
          <div className="sos-confirm-actions">
            <button className="sos-confirm-yes" onClick={handleSend} disabled={loading}>
              {loading ? 'Sending...' : 'Yes, Send SOS'}
            </button>
            <button className="sos-confirm-no" onClick={() => setConfirming(false)} disabled={loading}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
