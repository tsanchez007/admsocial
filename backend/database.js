const Database = require('better-sqlite3');
const path     = require('path');

const db = new Database(path.join(__dirname, 'socialapp.db'));

// Crear tablas si no existen
db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        text        TEXT,
        image_url   TEXT,
        scheduled_at TEXT NOT NULL,
        instagram   INTEGER DEFAULT 0,
        facebook    INTEGER DEFAULT 0,
        status      TEXT DEFAULT 'scheduled',
        created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        platform      TEXT NOT NULL,
        username      TEXT NOT NULL,
        access_token  TEXT,
        page_id       TEXT,
        ig_account_id TEXT,
        status        TEXT DEFAULT 'connected',
        created_at    TEXT DEFAULT (datetime('now'))
    );
`);

console.log('[DB] Base de datos lista ✅');

module.exports = db;
