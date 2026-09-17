const SOSAlert = require('../models/SOSAlert');
const EmergencyContact = require('../models/EmergencyContact');
const User = require('../models/User');
const { notifyEmergencyContacts } = require('../services/notificationService');

async function createSOS(req, res, next) {
  try {
    const existingActive = await SOSAlert.findActiveByUser(req.user.id);
    if (existingActive) {
      return res.status(409).json({ success: false, message: 'You already have an active SOS alert.' });
    }

    const { latitude, longitude, accuracy, message } = req.body;
    const alert = await SOSAlert.create(req.user.id, { latitude, longitude, accuracy, message });

    // Notify emergency contacts (mock service for this college project)
    const [user, contacts] = await Promise.all([
      User.findById(req.user.id),
      EmergencyContact.findAllByUser(req.user.id)
    ]);
    const notifications = await notifyEmergencyContacts(contacts, {
      userName: user.name,
      userPhone: user.phone,
      latitude,
      longitude,
      accuracy,
      message,
      triggeredAt: new Date(alert.triggered_at || Date.now())
    });

    res.status(201).json({ success: true, alert, notified: notifications.length });
  } catch (err) {
    next(err);
  }
}

async function getActiveSOS(req, res, next) {
  try {
    const alert = await SOSAlert.findActiveByUser(req.user.id);
    res.json({ success: true, alert: alert || null });
  } catch (err) {
    next(err);
  }
}

async function getSOSHistory(req, res, next) {
  try {
    const history = await SOSAlert.findHistoryByUser(req.user.id);
    res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
}

async function cancelSOS(req, res, next) {
  try {
    const alert = await SOSAlert.findById(req.params.id);
    if (!alert || alert.user_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'SOS alert not found.' });
    }
    if (alert.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Only an active SOS alert can be cancelled.' });
    }
    await SOSAlert.updateStatus(req.params.id, 'CANCELLED');
    const updated = await SOSAlert.findById(req.params.id);
    res.json({ success: true, alert: updated });
  } catch (err) {
    next(err);
  }
}

async function resolveSOS(req, res, next) {
  try {
    const alert = await SOSAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'SOS alert not found.' });
    }
    // A user may resolve their own alert; admins may resolve any alert.
    if (alert.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to resolve this alert.' });
    }
    await SOSAlert.updateStatus(req.params.id, 'RESOLVED');
    const updated = await SOSAlert.findById(req.params.id);
    res.json({ success: true, alert: updated });
  } catch (err) {
    next(err);
  }
}

// Admin: view all alerts across users
async function getAllAlertsForAdmin(req, res, next) {
  try {
    const alerts = await SOSAlert.findAllForAdmin();
    res.json({ success: true, alerts });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSOS,
  getActiveSOS,
  getSOSHistory,
  cancelSOS,
  resolveSOS,
  getAllAlertsForAdmin
};
