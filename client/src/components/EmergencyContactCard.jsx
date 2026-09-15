import { useState } from 'react';

export default function EmergencyContactCard({ contact, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: contact.name,
    phone: contact.phone,
    email: contact.email || '',
    relationship: contact.relationship || '',
    priority: contact.priority || 1
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSave() {
    onUpdate(contact.id, form);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="contact-card contact-card-editing">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" />
        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" />
        <input
          name="relationship"
          value={form.relationship}
          onChange={handleChange}
          placeholder="Relationship"
        />
        <input
          name="priority"
          type="number"
          min="1"
          value={form.priority}
          onChange={handleChange}
          placeholder="Priority"
        />
        <div className="contact-card-actions">
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-card">
      <div className="contact-card-info">
        <strong>{contact.name}</strong>
        <span>{contact.phone}</span>
        {contact.email && <span className="contact-relationship">{contact.email}</span>}
        {contact.relationship && <span className="contact-relationship">{contact.relationship}</span>}
        <span className="contact-priority">Priority: {contact.priority}</span>
      </div>
      <div className="contact-card-actions">
        <button onClick={() => setEditing(true)}>Edit</button>
        <button onClick={() => onDelete(contact.id)} className="contact-delete-btn">
          Delete
        </button>
      </div>
    </div>
  );
}
