const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  getAllUsers,
  getAdminStats
} = require('../controllers/userController');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin-only
router.get('/admin/users', protect, adminOnly, getAllUsers);
router.get('/admin/stats', protect, adminOnly, getAdminStats);

module.exports = router;
