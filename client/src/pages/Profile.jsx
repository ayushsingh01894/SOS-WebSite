import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Profile() {
  const [form, setForm] = useState({ name: '', phone: '' });
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data } = await api.get('/users/profile');
        setForm({ name: data.user.name, phone: data.user.phone || '' });
        setEmail(data.user.email);
      } catch (err) {
        setError('Unable to connect to the server. Please check your internet connection.');
      }
    }
    loadProfile();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.put('/users/profile', form);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Profile</h1>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}

      <form className="profile-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input value={email} disabled />
        </label>
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Phone
          <input name="phone" value={form.phone} onChange={handleChange} />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
