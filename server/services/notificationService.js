// Sends real email (via Gmail/Nodemailer) and real SMS (via Twilio) when
// credentials are configured in .env. If credentials are missing, each
// channel falls back to a console "mock" log instead of crashing the app —
// this keeps the SOS flow working even without provider setup.

const nodemailer = require('nodemailer');
const twilio = require('twilio');

const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
const smsConfigured = !!(
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC') &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER
);

let mailer = null;
if (emailConfigured) {
  mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
}

let twilioClient = null;
if (smsConfigured) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (err) {
    console.error('Twilio credentials look invalid, falling back to mock SMS mode:', err.message);
    twilioClient = null;
  }
} else if (process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_PHONE_NUMBER) {
  console.warn('Twilio env vars are incomplete or invalid (SID must start with "AC") — using mock SMS mode.');
}

function formatTimestamp(date) {
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });
}

function buildMessages({ userName, userPhone, latitude, longitude, accuracy, message, triggeredAt }) {
  const hasLocation = latitude != null && longitude != null;
  const mapsLink = hasLocation ? `https://maps.google.com/?q=${latitude},${longitude}` : null;

  const when = formatTimestamp(triggeredAt || new Date());

  const smsText = `EMERGENCY SOS from ${userName} (${userPhone || 'no phone on file'}).\n${message || ''}\nLocation: ${mapsLink || 'Unavailable'}\nTime: ${when}`.trim();

  const emailText = [
    `🚨 EMERGENCY SOS ALERT`,
    ``,
    `${userName} has activated an emergency SOS and needs help.`,
    ``,
    `Name: ${userName}`,
    `Phone: ${userPhone || 'Not available'}`,
    `Time: ${when}`,
    `Message: ${message || 'Emergency assistance required'}`,
    `Latitude: ${latitude != null ? latitude : 'Unavailable'}`,
    `Longitude: ${longitude != null ? longitude : 'Unavailable'}`,
    `Accuracy: ${accuracy != null ? Math.round(accuracy) + ' meters' : 'Unavailable'}`,
    `Location on map: ${mapsLink || 'Unavailable — location permission was not granted on the sender\'s device'}`,
    ``,
    `This is an automated alert from Silent SOS. Please try contacting ${userName} directly and consider reaching out to local emergency services if you cannot.`
  ].join('\n');

  const locationRow = hasLocation
    ? `<tr><td style="padding:6px 0;color:#4c5a6e;">Location</td><td style="padding:6px 0;"><a href="${mapsLink}" style="color:#d7263d;font-weight:600;text-decoration:none;">View on Google Maps →</a></td></tr>`
    : `<tr><td style="padding:6px 0;color:#4c5a6e;">Location</td><td style="padding:6px 0;color:#b9762f;">Unavailable — location permission wasn't granted</td></tr>`;

  const emailHtml = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:480px;margin:0 auto;background:#f5f3ee;padding:24px;">
    <div style="background:#101a26;color:#fff;padding:18px 20px;border-radius:8px 8px 0 0;">
      <span style="font-size:20px;font-weight:700;">🚨 Emergency SOS Alert</span>
    </div>
    <div style="background:#ffffff;padding:20px;border-radius:0 0 8px 8px;border:1px solid #e2ded4;border-top:none;">
      <p style="font-size:15px;color:#101a26;margin-top:0;">
        <strong>${userName}</strong> has activated an emergency SOS and needs help.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#4c5a6e;width:110px;">Name</td><td style="padding:6px 0;color:#101a26;font-weight:600;">${userName}</td></tr>
        <tr><td style="padding:6px 0;color:#4c5a6e;">Phone</td><td style="padding:6px 0;color:#101a26;">${userPhone || 'Not available'}</td></tr>
        <tr><td style="padding:6px 0;color:#4c5a6e;">Time</td><td style="padding:6px 0;color:#101a26;">${when}</td></tr>
        <tr><td style="padding:6px 0;color:#4c5a6e;">Message</td><td style="padding:6px 0;color:#101a26;">${message || 'Emergency assistance required'}</td></tr>
        ${locationRow}
      </table>
      ${hasLocation ? `<a href="${mapsLink}" style="display:block;text-align:center;background:#d7263d;color:#fff;text-decoration:none;font-weight:700;padding:12px;border-radius:6px;margin-top:16px;">📍 View Live Location</a>` : ''}
      <p style="font-size:12.5px;color:#4c5a6e;margin-top:20px;margin-bottom:0;">
        This is an automated alert from Silent SOS. Please try contacting ${userName} directly, and consider reaching out to local emergency services if you cannot.
      </p>
    </div>
  </div>`;

  return { smsText, emailText, emailHtml, mapsLink, when };
}

async function sendEmail(contact, userName, text, html) {
  if (!contact.email) return { channel: 'email', status: 'SKIPPED_NO_EMAIL', recipient: contact.name };

  if (!mailer) {
    console.log('[MOCK EMAIL]', JSON.stringify({ to: contact.email, text }, null, 2));
    return { channel: 'email', status: 'MOCK_SENT', recipient: contact.email };
  }

  try {
    await mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: contact.email,
      subject: `🚨 Emergency SOS from ${userName}`,
      text,
      html
    });
    return { channel: 'email', status: 'SENT', recipient: contact.email };
  } catch (err) {
    console.error(`Failed to send email to ${contact.email}:`, err.message);
    return { channel: 'email', status: 'FAILED', recipient: contact.email, error: err.message };
  }
}

async function sendSMS(contact, text) {
  if (!twilioClient) {
    console.log('[MOCK SMS]', JSON.stringify({ to: contact.phone, text }, null, 2));
    return { channel: 'sms', status: 'MOCK_SENT', recipient: contact.phone };
  }

  try {
    // Twilio expects E.164 format (e.g. +919876543210). If the stored number
    // doesn't include a country code, this assumes India (+91) — adjust as needed.
    const to = contact.phone.startsWith('+') ? contact.phone : `+91${contact.phone}`;
    await twilioClient.messages.create({
      body: text,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    return { channel: 'sms', status: 'SENT', recipient: to };
  } catch (err) {
    console.error(`Failed to send SMS to ${contact.phone}:`, err.message);
    return { channel: 'sms', status: 'FAILED', recipient: contact.phone, error: err.message };
  }
}

async function notifyEmergencyContacts(contacts, { userName, userPhone, latitude, longitude, accuracy, message, triggeredAt }) {
  const { smsText, emailText, emailHtml } = buildMessages({
    userName,
    userPhone,
    latitude,
    longitude,
    accuracy,
    message,
    triggeredAt
  });

  const results = [];
  for (const contact of contacts) {
    const [emailResult, smsResult] = await Promise.all([
      sendEmail(contact, userName, emailText, emailHtml),
      sendSMS(contact, smsText)
    ]);
    results.push({ contact: contact.name, emailResult, smsResult });
  }

  return results;
}

async function sendOtpSms(phone, otp) {
  const text = `Your Silent SOS verification code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`;

  if (!twilioClient) {
    console.log('[MOCK OTP SMS]', JSON.stringify({ to: phone, otp, text }, null, 2));
    return { status: 'MOCK_SENT', recipient: phone };
  }

  try {
    const to = phone.startsWith('+') ? phone : `+91${phone}`;
    await twilioClient.messages.create({ body: text, from: process.env.TWILIO_PHONE_NUMBER, to });
    return { status: 'SENT', recipient: to };
  } catch (err) {
    console.error(`Failed to send OTP SMS to ${phone}:`, err.message);
    // Still log it so the account isn't unrecoverable if SMS delivery fails.
    console.log('[FALLBACK OTP LOG]', JSON.stringify({ to: phone, otp }, null, 2));
    return { status: 'FAILED', recipient: phone, error: err.message };
  }
}

module.exports = { notifyEmergencyContacts, sendOtpSms };