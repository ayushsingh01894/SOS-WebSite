const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || './database/silent_sos.db';

// Ensure the database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`Connected to SQLite database at ${DB_PATH}`);
  }
});

// Enforce foreign key constraints
db.run('PRAGMA foreign_keys = ON');

function initDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        phone_verified INTEGER NOT NULL DEFAULT 0,
        otp_code TEXT,
        otp_expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration: add OTP/verification columns if this DB predates them.
    db.all(`PRAGMA table_info(users)`, [], (err, columns) => {
      if (err) return console.error('Migration check failed:', err.message);
      const names = columns.map((c) => c.name);
      const addIfMissing = (col, def) => {
        if (!names.includes(col)) {
          db.run(`ALTER TABLE users ADD COLUMN ${col} ${def}`, (alterErr) => {
            if (alterErr) console.error(`Migration failed (add ${col}):`, alterErr.message);
            else console.log(`Migration applied: users.${col} added`);
          });
        }
      };
      addIfMissing('phone_verified', 'INTEGER NOT NULL DEFAULT 0');
      addIfMissing('otp_code', 'TEXT');
      addIfMissing('otp_expires_at', 'DATETIME');
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        relationship TEXT,
        priority INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Migration: add "email" column if this DB was created before this field existed.
    db.all(`PRAGMA table_info(emergency_contacts)`, [], (err, columns) => {
      if (err) return console.error('Migration check failed:', err.message);
      const hasEmail = columns.some((col) => col.name === 'email');
      if (!hasEmail) {
        db.run(`ALTER TABLE emergency_contacts ADD COLUMN email TEXT`, (alterErr) => {
          if (alterErr) console.error('Migration failed (add email column):', alterErr.message);
          else console.log('Migration applied: emergency_contacts.email added');
        });
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS sos_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        latitude REAL,
        longitude REAL,
        location_accuracy REAL,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables ready: users, emergency_contacts, sos_alerts');
  });
}

module.exports = { db, initDatabase };
