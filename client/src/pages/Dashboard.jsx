import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SOSButton from '../components/SOSButton';
import LocationCard from '../components/LocationCard';
import SOSHistory from '../components/SOSHistory';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeAlert, setActiveAlert] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [history, setHistory] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [loadError, setLoadError] = useState('');

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      () => {
        setLocationError('Unable to access your location. Please enable location permission and try again.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [activeRes, contactsRes, historyRes] = await Promise.all([
        api.get('/sos/active'),
        api.get('/contacts'),
        api.get('/sos/history')
      ]);
      setActiveAlert(activeRes.data.alert);
      setContacts(contactsRes.data.contacts.slice(0, 5));
      setHistory(historyRes.data.history.slice(0, 5));
    } catch (err) {
      setLoadError('Unable to connect to the server. Please check your internet connection.');
    }
  }, []);

  useEffect(() => {
    detectLocation();
    loadData();
  }, [detectLocation, loadData]);

  return (
    <div className="page dashboard-page">
      <h1>Welcome, {user?.name}</h1>

      {loadError && <p className="form-error">{loadError}</p>}

      <SOSButton
        activeAlert={activeAlert}
        onAlertChange={setActiveAlert}
        location={location}
        locationError={locationError}
      />

      <LocationCard location={location} locationError={locationError} onRetry={detectLocation} />

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h3>Emergency Contacts</h3>
          <Link to="/emergency-contacts">Manage</Link>
        </div>
        {contacts.length === 0 ? (
          <p className="empty-state">No emergency contacts added yet.</p>
        ) : (
          <div className="contact-chip-list">
            {contacts.map((c) => (
              <span key={c.id} className="contact-chip">{c.name}</span>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h3>Recent SOS Alerts</h3>
          <Link to="/sos-history">View all</Link>
        </div>
        <SOSHistory history={history} />
      </section>
    </div>
  );
}
