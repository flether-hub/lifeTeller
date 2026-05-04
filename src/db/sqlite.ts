import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

export const db = new Database(path.join(dbPath, 'fortune.db'));

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT,
      ip_location TEXT,
      name TEXT,
      calendar_type TEXT,
      birth_date TEXT,
      birth_time TEXT,
      province TEXT,
      result_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Insert default settings if not exist
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('total_daily_limit', '100');
  insertSetting.run('ip_daily_limit', '3');
  insertSetting.run('custom_api_key', '');

  // Add ip_location column if it doesn't exist
  try {
    db.exec('ALTER TABLE readings ADD COLUMN ip_location TEXT;');
  } catch (e) {}

  try {
    db.exec('ALTER TABLE readings ADD COLUMN lat REAL;');
  } catch (e) {}

  try {
    db.exec('ALTER TABLE readings ADD COLUMN lon REAL;');
  } catch (e) {}

  try {
    db.exec('ALTER TABLE readings ADD COLUMN gender TEXT;');
  } catch (e) {}
}
