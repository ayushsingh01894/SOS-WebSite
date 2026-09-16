const { db } = require('../config/database');

// Repository layer for the "users" table.
// Keeping all raw SQL here means the rest of the app (controllers/services)
// stays database-agnostic and easier to migrate to MongoDB later.

function create({ name, email, hashedPassword, phone }) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO users (name, email, password, phone, role)
      VALUES (?, ?, ?, ?, 'user')
    `;
    db.run(sql, [name, email, hashedPassword, phone || null], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, name, email, phone, role: 'user' });
    });
  });
}

function findByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE id = ?',
      [id],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
}

function updateProfile(id, { name, phone }) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE users
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    db.run(sql, [name, phone, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

function findAll() {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC',
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

function countAll() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
      if (err) return reject(err);
      resolve(row.count);
    });
  });
}

function setOtp(id, otp, expiresAt) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
      [otp, expiresAt, id],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  });
}

function verifyOtpAndActivate(id) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET phone_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE id = ?`,
      [id],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  });
}

module.exports = {
  create,
  findByEmail,
  findById,
  updateProfile,
  findAll,
  countAll,
  setOtp,
  verifyOtpAndActivate
};
