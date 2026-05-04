import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin_password';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Database setup
  const db = new Database('lifeteller.db');
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    INSERT OR IGNORE INTO settings (key, value) VALUES ('total_daily_limit', '100');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('ip_daily_limit', '3');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('custom_api_key', '');
    
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
    );
  `);

  // Auth Middleware
  function authenticate(req: any, res: any, next: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Helper to get settings
  function getSetting(key: string, defaultValue: string): string {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? row.value : defaultValue;
  }

  // API Routes
  app.get('/api/config', (req, res) => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const totalLimit = parseInt(getSetting('total_daily_limit', '100'));
      const ipLimit = parseInt(getSetting('ip_daily_limit', '3'));

      const today = new Date().toISOString().split('T')[0];
      const totalUsed = (db.prepare("SELECT COUNT(*) as count FROM readings WHERE date(created_at) = ?").get(today) as any).count;
      const ipUsed = (db.prepare("SELECT COUNT(*) as count FROM readings WHERE date(created_at) = ? AND ip = ?").get(today, ip.toString()) as any).count;

      res.json({
        totalLeft: Math.max(0, totalLimit - totalUsed),
        ipLeft: Math.max(0, ipLimit - ipUsed)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/fortune/generate', async (req, res) => {
    try {
      const { prompt } = req.body;
      const customKey = getSetting('custom_api_key', '');
      const apiKey = customKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: '服务器未配置 API Key' });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash"];
      let lastError: any = null;
      let responseText = "";

      for (const modelId of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelId });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          if (text) {
            responseText = text.trim()
              .replace(/^```json\s*/i, '')
              .replace(/\s*```$/i, '')
              .replace(/^```\s*/, '')
              .replace(/\s*```$/, '')
              .trim();
            
            if (!responseText.startsWith('{')) {
              const match = responseText.match(/\{[\s\S]*\}/);
              if (match) responseText = match[0];
            }
            break;
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (!responseText && lastError) throw lastError;

      res.json({ result: responseText });
    } catch (err: any) {
      console.error('Generate error:', err);
      res.status(500).json({ error: err.message || 'AI 生成失败' });
    }
  });

  app.post('/api/fortune/save', async (req, res) => {
    try {
      const { name, gender, date, time, calendar_type, province, resultJson } = req.body;
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      
      db.prepare(
        'INSERT INTO readings (ip, name, gender, calendar_type, birth_date, birth_time, province, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(ip.toString(), name, gender || '未知', calendar_type, date, time, province, JSON.stringify(resultJson));

      res.json({ success: true });
    } catch (err: any) {
      console.error('Save error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Routes
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token });
    } else {
      res.status(401).json({ error: '密码错误' });
    }
  });

  app.get('/api/admin/readings', authenticate, (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const items = db.prepare('SELECT * FROM readings ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
    const total = (db.prepare('SELECT COUNT(*) as count FROM readings').get() as any).count;
    
    res.json({ data: items, total });
  });

  app.delete('/api/admin/readings/:id', authenticate, (req, res) => {
    db.prepare('DELETE FROM readings WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/admin/settings', authenticate, (req, res) => {
    const total = getSetting('total_daily_limit', '100');
    const ip = getSetting('ip_daily_limit', '3');
    const key = getSetting('custom_api_key', '');
    res.json({ total_daily_limit: total, ip_daily_limit: ip, custom_api_key: key });
  });

  app.post('/api/admin/settings', authenticate, (req, res) => {
    const { total_daily_limit, ip_daily_limit, custom_api_key } = req.body;
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('total_daily_limit', total_daily_limit.toString());
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('ip_daily_limit', ip_daily_limit.toString());
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('custom_api_key', custom_api_key || '');
    res.json({ success: true });
  });

  app.get('/api/admin/map-data', authenticate, (req, res) => {
    const readings = db.prepare('SELECT ip_location, lat, lon, province FROM readings').all() as any[];
    const points: any[] = [];
    
    readings.forEach(r => {
      if (r.lat && r.lon) {
        points.push({ lat: r.lat, lon: r.lon, ip_location: r.ip_location || r.province || '未知' });
      }
    });

    res.json({ points, provinces: [] });
  });

  // Vite middleware / Static files
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const buildPath = path.resolve(__dirname, 'build');
    if (fs.existsSync(buildPath)) {
      app.use(express.static(buildPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(buildPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();

