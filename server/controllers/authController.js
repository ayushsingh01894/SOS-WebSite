const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOtpSms, sendOtpEmail } = require('../services/notificationService');

const OTP_EXPIRY_MINUTES = 10;

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit code
}

async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and phone are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'That email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, hashedPassword, phone });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    await User.setOtp(user.id, otp, expiresAt);
    await Promise.all([sendOtpSms(phone, otp), sendOtpEmail(email, otp)]);

    res.status(201).json({
      success: true,
      message: 'Account created. Enter the verification code sent to your email.',
      email: user.email
    });
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and code are required.' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    if (user.phone_verified) {
      return res.status(400).json({ success: false, message: 'This account is already verified.' });
    }
    if (!user.otp_code || !user.otp_expires_at) {
      return res.status(400).json({ success: false, message: 'No pending code. Please request a new one.' });
    }
    if (new Date(user.otp_expires_at).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'This code has expired. Please request a new one.' });
    }
    if (String(otp).trim() !== user.otp_code) {
      return res.status(400).json({ success: false, message: 'Incorrect verification code.' });
    }

    await User.verifyOtpAndActivate(user.id);

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

async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    if (user.phone_verified) {
      return res.status(400).json({ success: false, message: 'This account is already verified.' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    await User.setOtp(user.id, otp, expiresAt);
    await Promise.all([sendOtpSms(user.phone, otp), sendOtpEmail(user.email, otp)]);

    res.json({ success: true, message: 'A new verification code has been sent to your email.' });
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

    if (!user.phone_verified) {
      // Give them a fresh code automatically so the verification screen works right away.
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
      await User.setOtp(user.id, otp, expiresAt);
      await Promise.all([sendOtpSms(user.phone, otp), sendOtpEmail(user.email, otp)]);

      return res.status(403).json({
        success: false,
        needsVerification: true,
        email: user.email,
        message: 'Your account is not verified yet. A new code has been sent to your email.'
      });
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

module.exports = { register, login, verifyOtp, resendOtp };