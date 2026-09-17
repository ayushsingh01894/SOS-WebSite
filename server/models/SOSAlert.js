const { db } = require('../config/database');

function create(userId, { latitude, longitude, accuracy, message }) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO sos_alerts (user_id, latitude, longitude, location_accuracy, message, status)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `;
    db.run(
      sql,
      [userId, latitude ?? null, longitude ?? null, accuracy ?? null, message || null],
      function (err) {
        if (err) return reject(err);
        resolve({
          id: this.lastID,
          user_id: userId,
          latitude,
          longitude,
          location_accuracy: accuracy,
          message,
          status: 'ACTIVE'
        });
      }
    );
  });
}

function findActiveByUser(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM sos_alerts WHERE user_id = ? AND status = 'ACTIVE' ORDER BY triggered_at DESC LIMIT 1`,
      [userId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
}

function findHistoryByUser(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM sos_alerts WHERE user_id = ? ORDER BY triggered_at DESC',
      [userId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM sos_alerts WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function updateStatus(id, status) {
  return new Promise((resolve, reject) => {
    const resolvedAt = status === 'ACTIVE' ? null : new Date().toISOString();
    const sql = `
      UPDATE sos_alerts
      SET status = ?, resolved_at = ?
      WHERE id = ?
    `;
    db.run(sql, [status, resolvedAt, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

function findAllForAdmin() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT sos_alerts.*, users.name as user_name, users.email as user_email
      FROM sos_alerts
      JOIN users ON users.id = sos_alerts.user_id
      ORDER BY triggered_at DESC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function countByStatus(status) {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM sos_alerts WHERE status = ?', [status], (err, row) => {
      if (err) return reject(err);
      resolve(row.count);
    });
  });
}

function countAll() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM sos_alerts', [], (err, row) => {
      if (err) return reject(err);
      resolve(row.count);
    });
  });
}

module.exports = {
  create,
  findActiveByUser,
  findHistoryByUser,
  findById,
  updateStatus,
  findAllForAdmin,
  countByStatus,
  countAll
};
