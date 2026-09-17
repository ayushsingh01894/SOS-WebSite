const User = require('../models/User');
const SOSAlert = require('../models/SOSAlert');

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body;
    await User.updateProfile(req.user.id, { name, phone });
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

// Admin: list all users + basic stats
async function getAllUsers(req, res, next) {
  try {
    const users = await User.findAll();
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

async function getAdminStats(req, res, next) {
  try {
    const [totalUsers, activeAlerts, totalAlerts, resolvedAlerts] = await Promise.all([
      User.countAll(),
      SOSAlert.countByStatus('ACTIVE'),
      SOSAlert.countAll(),
      SOSAlert.countByStatus('RESOLVED')
    ]);
    res.json({
      success: true,
      stats: { totalUsers, activeAlerts, totalAlerts, resolvedAlerts }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, getAllUsers, getAdminStats };
