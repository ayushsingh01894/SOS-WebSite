import { useEffect, useState } from 'react';
import api from '../services/api';
import SOSHistory from '../components/SOSHistory';

export default function SOSHistoryPage() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        const { data } = await api.get('/sos/history');
        setHistory(data.history);
      } catch (err) {
        setError('Unable to connect to the server. Please check your internet connection.');
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="page">
      <h1>SOS History</h1>
      {error && <p className="form-error">{error}</p>}
      <SOSHistory history={history} />
    </div>
  );
}
