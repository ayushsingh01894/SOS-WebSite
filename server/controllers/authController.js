const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/; // 10-digit Indian mobile number
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/; // 8+ chars, at least 1 letter + 1 number

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and phone are required.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please enter a valid name.' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (!PHONE_REGEX.test(phone.replace(/\D/g, ''))) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include a letter and a number.'
      });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'That email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email, hashedPassword, phone: phone.replace(/\D/g, '') });

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
