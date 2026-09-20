import { useEffect, useState } from 'react';
import api from '../services/api';
import EmergencyContactCard from '../components/EmergencyContactCard';

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', relationship: '', priority: 1 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadContacts() {
    try {
      const { data } = await api.get('/contacts');
      setContacts(data.contacts);
    } catch (err) {
      setError('Unable to connect to the server. Please check your internet connection.');
    }
  }

  useEffect(() => {
    loadContacts();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setError('Name and phone are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/contacts', form);
      setForm({ name: '', phone: '', email: '', relationship: '', priority: 1 });
      await loadContacts();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add contact.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(id, updatedFields) {
    try {
      await api.put(`/contacts/${id}`, updatedFields);
      await loadContacts();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update contact.');
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/contacts/${id}`);
      await loadContacts();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete contact.');
    }
  }

  return (
    <div className="page">
      <h1>Emergency Contacts</h1>
      {error && <p className="form-error">{error}</p>}

      <form className="add-contact-form" onSubmit={handleAdd}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
        <input
          name="email"
          type="email"
          placeholder="Email (optional, for email alerts)"
          value={form.email}
          onChange={handleChange}
        />
        <input
          name="relationship"
          placeholder="Relationship"
          value={form.relationship}
          onChange={handleChange}
        />
        <input
          name="priority"
          type="number"
          min="1"
          placeholder="Priority"
          value={form.priority}
          onChange={handleChange}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Contact'}
        </button>
      </form>

      {contacts.length === 0 ? (
        <p className="empty-state">No emergency contacts yet. Add one above.</p>
      ) : (
        <div className="contact-list">
          {contacts.map((contact) => (
            <EmergencyContactCard
              key={contact.id}
              contact={contact}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
