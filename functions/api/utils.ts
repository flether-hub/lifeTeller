import jwt from 'jsonwebtoken';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_PASSWORD: string;
  GEMINI_API_KEY: string;
}

export async function getSetting(db: D1Database, key: string, defaultValue: string): Promise<string> {
  const result = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
  return result ? result.value : defaultValue;
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
