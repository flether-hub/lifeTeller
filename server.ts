import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { db, initDb } from './src/db/sqlite';
import path from 'path';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Error handler for body-parser
app.use((err: any, req: any, res: any, next: any) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: '数据过大，请返回重试。' });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: '无效的要求' });
  }
  next();
});

// Initialize Database
initDb();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

// Middleware to extract IP
app.use((req: any, res, next) => {
  let ipRaw = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
  let ip = '';
  if (Array.isArray(ipRaw)) {
    ip = ipRaw[0];
  } else if (typeof ipRaw === 'string') {
    ip = ipRaw.split(',')[0].trim();
  }
  req.clientIp = ip || '未知IP';
  next();
});

// Helper to get settings
function getSetting(key: string, defaultValue: string): string {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? row.value : defaultValue;
}

function getBeijingDateString() {
  const beijingMs = Date.now() + 8 * 3600 * 1000;
  const bd = new Date(beijingMs);
  return `${bd.getUTCFullYear()}-${String(bd.getUTCMonth() + 1).padStart(2, '0')}-${String(bd.getUTCDate()).padStart(2, '0')}`;
}

// API Routes
app.get('/api/config', (req: any, res) => {
  try {
    const ip = req.clientIp as string;
    const today = getBeijingDateString();

    const totalLimit = parseInt(getSetting('total_daily_limit', '100'));
    const ipLimit = parseInt(getSetting('ip_daily_limit', '3'));

    const totalUsed = (db.prepare("SELECT COUNT(*) as count FROM readings WHERE date(datetime(created_at, '+8 hours')) = ?").get(today) as {count: number}).count;
    const ipUsed = (db.prepare("SELECT COUNT(*) as count FROM readings WHERE date(datetime(created_at, '+8 hours')) = ? AND ip = ?").get(today, ip) as {count: number}).count;

    res.json({
      totalLeft: Math.max(0, totalLimit - totalUsed),
      ipLeft: Math.max(0, ipLimit - ipUsed)
    });
  } catch (err: any) {
    console.error('Error in /api/config:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fortune/check', (req: any, res) => {
  try {
    const ip = req.clientIp as string;
    const today = getBeijingDateString();

    const totalLimit = parseInt(getSetting('total_daily_limit', '100'));
    const ipLimit = parseInt(getSetting('ip_daily_limit', '3'));

    const totalUsed = (db.prepare("SELECT COUNT(*) as count FROM readings WHERE date(datetime(created_at, '+8 hours')) = ?").get(today) as {count: number}).count;
    const ipUsed = (db.prepare("SELECT COUNT(*) as count FROM readings WHERE date(datetime(created_at, '+8 hours')) = ? AND ip = ?").get(today, ip) as {count: number}).count;

    if (totalUsed >= totalLimit) {
      return res.status(429).json({ error: '今日全站算命次数已用完，请明日再来。', debugInfo: ["达到全站使用上限"] });
    }
    if (ipUsed >= ipLimit) {
      return res.status(429).json({ error: '您今日的算命次数已用完，请明日再来。', debugInfo: ["达到单IP使用上限"] });
    }
    
    const customKey = getSetting('custom_api_key', '');
    
    res.json({ ok: true, customKey });
  } catch (err: any) {
    console.error('Error in /api/fortune/check:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fortune/generate', async (req: any, res) => {
  try {
    const { prompt } = req.body;
    const customKey = getSetting('custom_api_key', '');
    const apiKey = customKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "服务器未配置 API Key" });
    }

    const ai = new GoogleGenAI({ apiKey });
    let modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro", "gemini-1.5-flash"];

    try {
      const availableModels: string[] = [];
      const response = await ai.models.list();
      for await (const page of response) {
         if (page.name && page.name.includes("gemini")) {
             availableModels.push(page.name.replace("models/", ""));
         }
      }

      if (availableModels.length > 0) {
        const getScore = (name: string) => {
          let score = 0;
          if (name.includes("pro")) score += 1000;
          else if (name.includes("flash")) score += 500;
          
          if (name.includes("exp") || name.includes("experimental")) score -= 5000;
          if (name.includes("vision")) score -= 100;
          
          const versionMatch = name.match(/gemini-(\d+\.\d+)/);
          if (versionMatch) {
              score += parseFloat(versionMatch[1]) * 100;
          }
          return score;
        };

        availableModels.sort((a, b) => getScore(b) - getScore(a));
        modelsToTry = availableModels;
        console.log("Models to try in order:", modelsToTry.slice(0, 5));
      }
    } catch (e) {
      console.error("Failed to list models, using fallback", e);
    }

    let lastError: any = null;
    let responseText = "";

    for (const modelToTry of modelsToTry) {
      try {
        console.log("Trying model:", modelToTry);
        const response = await ai.models.generateContent({
          model: modelToTry,
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        if (response.text) {
           responseText = response.text;
           // Clean up common AI artifacts more robustly
           responseText = responseText
             .replace(/^[^{]*(\{[\s\S]*\})[^}]*$/, '$1') // Extract furthest { and }
             .replace(/^```json\s*/i, '')
             .replace(/\s*```$/i, '')
             .trim();
           lastError = null;
           break;
        }
      } catch (err: any) {
        lastError = err;
        console.error(`Model ${modelToTry} attempt failed:`, err.message);
        // If the error is about API key, stop immediately
        if (err.message && (err.message.includes('API key not valid') || err.message.includes('API_KEY_INVALID'))) {
            break;
        }
        // Otherwise, continue to try the next model
      }
    }

    if (lastError) {
      throw lastError; // Throw the last error so it is caught and handled below
    }

    res.json({ result: responseText });
  } catch (err: any) {
    console.error('Error in /api/fortune/generate:', err);
    let errorMessage = err.message || 'AI 生成失败';
    if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
      errorMessage = '服务器 API Key 无效或未配置，请联系管理员在后台设置正确的 Gemini API Key 才能推演天机。';
    } else if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = '免费接口测算人数过多，当前服务配额已暂满，请您一两分钟后重试。';
    } else if (errorMessage.includes('503') || errorMessage.includes('OVERLOADED')) {
      errorMessage = '大模型服务器暂不可用请求过载，请稍候再来。';
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Add a simple health check route
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.post('/api/fortune/save', async (req: any, res) => {
  const ip = req.clientIp as string;
  const { name, gender, date, time, calendar_type, province, resultJson } = req.body;

  if (!name || !date || !time || !province || !resultJson) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  let ip_location = '未知';
  let lat: number | null = null;
  let lon: number | null = null;
  try {
    if (ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== '未知IP') {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.status === 'success') {
          ip_location = geoData.regionName || geoData.city || geoData.country || '未知';
          lat = geoData.lat;
          lon = geoData.lon;
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch IP location:', e);
  }

  try {
    const existing = db.prepare('SELECT id FROM readings WHERE ip = ? AND name = ? AND calendar_type = ? AND birth_date = ? AND birth_time = ? AND province = ?').get(ip, name, calendar_type, date, time, province) as { id: number } | undefined;
    
    if (existing) {
      const update = db.prepare('UPDATE readings SET result_json = ?, ip_location = ?, lat = ?, lon = ?, gender = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?');
      update.run(JSON.stringify(resultJson), ip_location, lat, lon, gender || '未知', existing.id);
    } else {
      const insert = db.prepare('INSERT INTO readings (ip, ip_location, lat, lon, name, gender, calendar_type, birth_date, birth_time, province, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      insert.run(ip, ip_location, lat, lon, name, gender || '未知', calendar_type, date, time, province, JSON.stringify(resultJson));
    }
    
    res.json({ success: true, ip_location, lat, lon });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Auth
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Admin Middleware
const authenticateAdmin = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/admin/settings', authenticateAdmin, (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all();
    const obj: Record<string, string> = {};
    settings.forEach((r: any) => obj[r.key] = r.value);
    res.json(obj);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/settings', authenticateAdmin, (req, res) => {
  try {
    const { total_daily_limit, ip_daily_limit, custom_api_key } = req.body;
    const update = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
    update.run(total_daily_limit, 'total_daily_limit');
    update.run(ip_daily_limit, 'ip_daily_limit');
    
    if (custom_api_key !== undefined) {
      update.run(custom_api_key, 'custom_api_key');
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/readings', authenticateAdmin, (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const totalRes = db.prepare('SELECT COUNT(*) as count FROM readings').get() as { count: number };
    const rows = db.prepare('SELECT id, ip, ip_location, name, gender, calendar_type, birth_date, birth_time, province, created_at, result_json FROM readings ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
    
    res.json({
      data: rows,
      total: totalRes.count,
      page,
      limit
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/readings/:id', authenticateAdmin, (req, res) => {
  const id = req.params.id;
  try {
    db.prepare('DELETE FROM readings WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/map-data', authenticateAdmin, (req, res) => {
  try {
    const points = db.prepare('SELECT ip_location, AVG(lat) as lat, AVG(lon) as lon, COUNT(*) as count FROM readings WHERE lat IS NOT NULL AND lon IS NOT NULL GROUP BY ip_location').all();
    // Also return province data as fallback for bar chart
    const provinces = db.prepare('SELECT province, COUNT(*) as count FROM readings GROUP BY province').all();
    res.json({ points, provinces });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
