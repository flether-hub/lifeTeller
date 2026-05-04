// @ts-ignore
import jwt from 'jsonwebtoken';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_PASSWORD: string;
  GEMINI_API_KEY: string;
}

export async function initDatabase(db: D1Database): Promise<void> {
  // Use a batch to create tables and insert default settings if they don't exist
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `),
    db.prepare(`
      INSERT OR IGNORE INTO settings (key, value) VALUES ('total_daily_limit', '100')
    `),
    db.prepare(`
      INSERT OR IGNORE INTO settings (key, value) VALUES ('ip_daily_limit', '3')
    `),
    db.prepare(`
      INSERT OR IGNORE INTO settings (key, value) VALUES ('custom_api_key', '')
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT,
        ip_location TEXT,
        lat REAL,
        lon REAL,
        name TEXT,
        gender TEXT DEFAULT '未知',
        calendar_type TEXT,
        birth_date TEXT,
        birth_time TEXT,
        province TEXT,
        result_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  ]);
}

export async function getSetting(db: D1Database, key: string, defaultValue: string): Promise<string> {
  try {
    const result = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
    return result ? result.value : defaultValue;
  } catch (e) {
    // If table doesn't exist yet, return default
    return defaultValue;
  }
}

export function getBeijingDateString(): string {
  const beijingMs = Date.now() + 8 * 3600 * 1000;
  const bd = new Date(beijingMs);
  return `${bd.getUTCFullYear()}-${String(bd.getUTCMonth() + 1).padStart(2, '0')}-${String(bd.getUTCDate()).padStart(2, '0')}`;
}

export async function authenticateAdmin(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  
  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, env.JWT_SECRET);
    return true;
  } catch (err) {
    return false;
  }
}
