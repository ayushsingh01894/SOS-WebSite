const { db } = require('../config/database');

function create(userId, { name, phone, email, relationship, priority }) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO emergency_contacts (user_id, name, phone, email, relationship, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.run(sql, [userId, name, phone, email || null, relationship || null, priority || 1], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, user_id: userId, name, phone, email, relationship, priority: priority || 1 });
    });
  });
}

function findAllByUser(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY priority ASC, created_at ASC',
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
    db.get('SELECT * FROM emergency_contacts WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function update(id, { name, phone, email, relationship, priority }) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE emergency_contacts
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          relationship = COALESCE(?, relationship),
          priority = COALESCE(?, priority)
      WHERE id = ?
    `;
    db.run(sql, [name, phone, email, relationship, priority, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

function remove(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM emergency_contacts WHERE id = ?', [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

module.exports = { create, findAllByUser, findById, update, remove };
