const EmergencyContact = require('../models/EmergencyContact');

async function getContacts(req, res, next) {
  try {
    const contacts = await EmergencyContact.findAllByUser(req.user.id);
    res.json({ success: true, contacts });
  } catch (err) {
    next(err);
  }
}

async function createContact(req, res, next) {
  try {
    const { name, phone, email, relationship, priority } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }
    const contact = await EmergencyContact.create(req.user.id, { name, phone, email, relationship, priority });
    res.status(201).json({ success: true, contact });
  } catch (err) {
    next(err);
  }
}

async function updateContact(req, res, next) {
  try {
    const contact = await EmergencyContact.findById(req.params.id);
    if (!contact || contact.user_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }
    const { name, phone, email, relationship, priority } = req.body;
    await EmergencyContact.update(req.params.id, { name, phone, email, relationship, priority });
    const updated = await EmergencyContact.findById(req.params.id);
    res.json({ success: true, contact: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteContact(req, res, next) {
  try {
    const contact = await EmergencyContact.findById(req.params.id);
    if (!contact || contact.user_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }
    await EmergencyContact.remove(req.params.id);
    res.json({ success: true, message: 'Contact deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getContacts, createContact, updateContact, deleteContact };
