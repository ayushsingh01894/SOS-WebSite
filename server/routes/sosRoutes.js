const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  createSOS,
  getActiveSOS,
  getSOSHistory,
  cancelSOS,
  resolveSOS,
  getAllAlertsForAdmin
} = require('../controllers/sosController');

router.post('/', protect, createSOS);
router.get('/active', protect, getActiveSOS);
router.get('/history', protect, getSOSHistory);
router.patch('/:id/cancel', protect, cancelSOS);
router.patch('/:id/resolve', protect, resolveSOS);

// Admin: all alerts across all users
router.get('/admin/all', protect, adminOnly, getAllAlertsForAdmin);

module.exports = router;
