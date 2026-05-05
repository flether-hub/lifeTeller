import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import Database from 'better-sqlite3';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { jwtVerify, SignJWT } from 'jose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
const app = express();
const PORT = 3000;

console.log("Initializing server setup...");

app.use(cors());
app.use(express.json());

// Initialize Database
let db: any;
try {
  const dbPath = path.join(process.cwd(), 'lifeteller_v3.db');
  console.log(`Using database at: ${dbPath}`);
  db = new Database(dbPath);
  const schemaPath = path.join(process.cwd(), 'schema.sql');
  console.log(`Reading schema from: ${schemaPath}`);
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  // Explicitly check for all needed tables
  const tables = [
    { name: 'settings', sql: 'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);' },
    { name: 'readings', sql: 'CREATE TABLE IF NOT EXISTS readings (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, ip_location TEXT, lat REAL, lon REAL, name TEXT, gender TEXT DEFAULT \'未知\', calendar_type TEXT, birth_date TEXT, birth_time TEXT, province TEXT, result_json TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);' },
    { name: 'comments', sql: 'CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, user_identifier TEXT, location TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, is_deleted INTEGER DEFAULT 0);' },
    { name: 'banned_ips', sql: 'CREATE TABLE IF NOT EXISTS banned_ips (ip TEXT PRIMARY KEY, reason TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);' },
    { name: 'quotas', sql: 'CREATE TABLE IF NOT EXISTS quotas (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, user_identifier TEXT, usage_count INTEGER DEFAULT 0, comment_count INTEGER DEFAULT 0, quota_date DATE DEFAULT (date(\'now\')), UNIQUE(ip, user_identifier, quota_date));' }
  ];

  for (const table of tables) {
      const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table.name);
      if (!exists) {
          console.log(`Table ${table.name} missing, creating it...`);
          db.exec(table.sql);
      }
  }
  console.log("Database initialized successfully.");
} catch (err) {
  console.error("CRITICAL: Database initialization failed:", err);
  // Still try to start the server but it will fail on routes
}

  const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

  // Auth Middleware
  const authenticateAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权或登录已过期' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const { payload } = await jwtVerify(token, getSecret());
      (req as any).admin = payload;
      next();
    } catch (err) {
      res.status(401).json({ error: '令牌无效或已过期' });
    }
  };

  const getClientIp = (req: express.Request) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    if (typeof ip === 'string') ip = ip.split(',')[0].trim();
    return ip;
  };

  const getUserIdentifier = (req: express.Request) => {
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/user_uid=([^;]+)/);
    return match ? match[1] : 'unknown';
  };

  const getQuotas = (ip: string, userIdentifier: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Ensure entry exists
    db.prepare(`
      INSERT OR IGNORE INTO quotas (ip, user_identifier, quota_date)
      VALUES (?, ?, ?)
    `).run(ip, userIdentifier, today);

    const userQuota = db.prepare(`
      SELECT usage_count, comment_count FROM quotas 
      WHERE ip = ? AND user_identifier = ? AND quota_date = ?
    `).get(ip, userIdentifier, today) as any || { usage_count: 0, comment_count: 0 };

    const totalUsage = (db.prepare(`
      SELECT SUM(usage_count) as total FROM quotas WHERE quota_date = ?
    `).get(today) as any)?.total || 0;

    return { userUsage: userQuota.usage_count, userComments: userQuota.comment_count, totalUsage };
  };

  const incrementUsage = (ip: string, userIdentifier: string) => {
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      UPDATE quotas SET usage_count = usage_count + 1
      WHERE ip = ? AND user_identifier = ? AND quota_date = ?
    `).run(ip, userIdentifier, today);
  };

  const incrementCommentUsage = (ip: string, userIdentifier: string) => {
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      UPDATE quotas SET comment_count = comment_count + 1
      WHERE ip = ? AND user_identifier = ? AND quota_date = ?
    `).run(ip, userIdentifier, today);
  };

  // API Routes
  // Cache for model info
  let cachedModelInfo: any = null;
  let lastCacheUpdate = 0;
  const CACHE_TTL = 3600000; // 1 hour - model info rarely changes

  app.get('/api/model-info', (req, res) => {
    try {
      const now = Date.now();
      if (cachedModelInfo && (now - lastCacheUpdate < CACHE_TTL)) {
        return res.json(cachedModelInfo);
      }

      const provider = (db.prepare('SELECT value FROM settings WHERE key = ?').get('model_provider') as any)?.value || 'gemini';
      let modelId = '';
      let providerName = '';

      if (provider === 'aliyun') {
        modelId = (db.prepare('SELECT value FROM settings WHERE key = ?').get('aliyun_model_id') as any)?.value || 'qwen-plus';
        providerName = '阿里云百炼';
      } else {
        modelId = (db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_model_id') as any)?.value || 'gemini-2.0-flash';
        providerName = 'Google Gemini';
      }

      cachedModelInfo = { provider, modelId, providerName };
      lastCacheUpdate = now;
      res.json(cachedModelInfo);
    } catch (err) {
      console.error('Error fetching model info:', err);
      // If we have a cache even if expired, use it
      if (cachedModelInfo) {
        return res.json(cachedModelInfo);
      }
      // Return a 200 with error instead of 500 to be gentler on the client
      res.json({ error: 'Failed to fetch model info', provider: 'unknown', modelId: 'AI', providerName: 'AI' });
    }
  });

  app.get('/api/config', (req, res) => {
    const totalDailyLimitStr = (db.prepare('SELECT value FROM settings WHERE key = ?').get('total_daily_limit') as any)?.value || '100';
    const ipDailyLimitStr = (db.prepare('SELECT value FROM settings WHERE key = ?').get('ip_daily_limit') as any)?.value || '3';
    
    const limitTotal = parseInt(totalDailyLimitStr);
    const limitIp = parseInt(ipDailyLimitStr);
    const ip = getClientIp(req);
    const userIdentifier = getUserIdentifier(req);
    
    const { userUsage, totalUsage } = getQuotas(ip, userIdentifier);

    res.json({
      totalLeft: Math.max(0, limitTotal - totalUsage),
      ipLeft: Math.max(0, limitIp - userUsage)
    });
  });

  app.post('/api/fortune/check', (req, res) => {
    const totalDailyLimitStr = (db.prepare('SELECT value FROM settings WHERE key = ?').get('total_daily_limit') as any)?.value || '100';
    const ipDailyLimitStr = (db.prepare('SELECT value FROM settings WHERE key = ?').get('ip_daily_limit') as any)?.value || '3';
    
    const limitTotal = parseInt(totalDailyLimitStr);
    const limitIp = parseInt(ipDailyLimitStr);
    const ip = getClientIp(req);
    const userIdentifier = getUserIdentifier(req);
    
    const { userUsage, totalUsage } = getQuotas(ip, userIdentifier);
    
    if (totalUsage >= limitTotal) return res.status(429).json({ error: '今日全站算力额度已耗尽，请明早重试' });
    if (userUsage >= limitIp) return res.status(429).json({ error: '您今日的测算额度已用完，请明早重试' });
    
    res.json({ success: true });
  });

  app.post('/api/comments', async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== 'string') return res.status(400).json({ error: '评论内容不能为空' });
      if (content.length > 500) return res.status(400).json({ error: '评论内容过长' });

      const ip = getClientIp(req);
      const userIdentifier = getUserIdentifier(req);

      // Check if IP is banned
      const isBanned = db.prepare('SELECT 1 FROM banned_ips WHERE ip = ?').get(ip);
      if (isBanned) return res.status(403).json({ error: '您的 IP 已被禁止评论' });

      // Check quota
      const { userComments } = getQuotas(ip, userIdentifier);
      if (userComments >= 2) return res.status(429).json({ error: '每个用户每天限发2条评论' });

      // Get location
      let location = "未知";
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.status === 'success') {
            location = geoData.regionName || geoData.city || geoData.country || "未知";
          }
        }
      } catch (e) {}

      // Save comment
      db.prepare(`
        INSERT INTO comments (ip, user_identifier, location, content)
        VALUES (?, ?, ?, ?)
      `).run(ip, userIdentifier, location, content);

      // Increment comment count
      incrementCommentUsage(ip, userIdentifier);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/comments', (req, res) => {
    try {
      const comments = db.prepare(`
        SELECT id, location, content, created_at, ip
        FROM comments 
        WHERE is_deleted = 0
        ORDER BY created_at DESC 
        LIMIT 10
      `).all();
      
      // Mask IP for privacy on frontend
      const maskedComments = comments.map((c: any) => {
        let maskedIp = '未知';
        if (c.ip) {
          if (c.ip.includes(':')) {
            const parts = c.ip.split(':');
            maskedIp = parts.slice(0, 3).join(':') + ':****';
          } else {
            maskedIp = c.ip.split('.').slice(0, 2).join('.') + '.*.*';
          }
        }
        return {
          ...c,
          ip: maskedIp
        };
      });

      res.json(maskedComments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/comments', authenticateAdmin, (req, res) => {
    try {
      const comments = db.prepare('SELECT * FROM comments ORDER BY created_at DESC').all();
      res.json(comments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/comments/:id', authenticateAdmin, (req, res) => {
    try {
      db.prepare('UPDATE comments SET is_deleted = 1 WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/banned-ips', authenticateAdmin, (req, res) => {
    try {
      const ips = db.prepare('SELECT * FROM banned_ips').all();
      res.json(ips);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/ban-ip', authenticateAdmin, (req, res) => {
    try {
      const { ip, reason } = req.body;
      db.prepare('INSERT OR REPLACE INTO banned_ips (ip, reason) VALUES (?, ?)').run(ip, reason || '违规评论');
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/ban-ip/:ip', authenticateAdmin, (req, res) => {
    try {
      db.prepare('DELETE FROM banned_ips WHERE ip = ?').run(req.params.ip);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

          app.post('/api/fortune/generate', async (req, res) => {
    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable NGINX buffering
    res.flushHeaders();

    try {
      const { prompt } = req.body;
      const today = new Date().toISOString().split('T')[0];
      const fullPrompt = `Today is ${today}. ${prompt}`;

      const modelProviderRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('model_provider') as { value: string } | undefined;
      const modelProvider = modelProviderRow?.value || 'gemini';

      if (modelProvider === 'aliyun') {
        const aliyunRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('aliyun_api_key') as { value: string } | undefined;
        const apiKey = aliyunRow?.value || '';
        
        if (!apiKey) {
          res.write("\n--STREAM-ERROR--\n服务器未配置阿里云 API Key");
          return res.end();
        }

        const aliyunModelRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('aliyun_model_id') as { value: string } | undefined;
        const aliyunModelId = aliyunModelRow?.value || 'kimi-k2.6';

        console.log("Using aliyun fetch!");
        const qwenRes = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: aliyunModelId,
            messages: [{ role: "user", content: fullPrompt }],
            stream: true,
          }),
        });

        if (!qwenRes.ok) {
          const errText = await qwenRes.text();
          console.error("Aliyun API error", qwenRes.status, errText);
          throw new Error(`AliYun API Error: ${qwenRes.status} ${errText}`);
        }

        if (!qwenRes.body) throw new Error("No response body");
        
        console.log("Aliyun stream received");

        // Handling fetch response body in Node.js
        const body = qwenRes.body as unknown as AsyncIterable<Uint8Array>;
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        for await (const chunk of body) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === "") continue;
            if (trimmed.startsWith("data:")) {
              const data = trimmed.slice(5).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  console.log("Chunk content:", content);
                  res.write(content);
                  if (typeof (res as any).flush === 'function') {
                    (res as any).flush();
                  }
                }
              } catch (e) {
                console.error("Parse error:", e);
              }
            }
          }
        }

        const finalLine = buffer.trim();
        if (finalLine.startsWith("data:")) {
          const data = finalLine.slice(5).trim();
          if (data !== "[DONE]") {
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                res.write(content);
                if (typeof (res as any).flush === 'function') {
                  (res as any).flush();
                }
              }
            } catch (e) {}
          }
        }
        res.end();

      } else {
        const geminiRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key') as { value: string } | undefined;
        const customKeyRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('custom_api_key') as { value: string } | undefined;
        const apiKey = geminiRow?.value || customKeyRow?.value || process.env.GEMINI_API_KEY;

        if (!apiKey) {
           res.write("\n--STREAM-ERROR--\n服务器未配置 Gemini API Key");
           return res.end();
        }

        const ai = new GoogleGenAI({ apiKey });
        const geminiModelRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_model_id') as { value: string } | undefined;
        const geminiModelId = geminiModelRow?.value || 'gemini-2.0-flash';
        
        let stream;
        try {
          stream = await ai.models.generateContentStream({
            model: geminiModelId,
            contents: fullPrompt
          });
        } catch (err: any) {
          console.error("AI API Error:", err);
          let errMsg = err?.message || String(err);
          try {
            if (errMsg.startsWith('{')) {
              const parsed = JSON.parse(errMsg);
              if (parsed.error && parsed.error.message) {
                errMsg = parsed.error.message;
              }
            } else if (errMsg.startsWith('ApiError: {')) {
              const parsed = JSON.parse(errMsg.substring(10));
              if (parsed.error && parsed.error.message) {
                errMsg = parsed.error.message;
              }
            }
          } catch(e) {}
          res.write(`\n--STREAM-ERROR--\n${errMsg}`);
          return res.end();
        }

        for await (const chunk of stream) {
          if (chunk.text) {
            res.write(chunk.text);
            if (typeof (res as any).flush === 'function') {
              (res as any).flush();
            }
          }
        }
        res.end();
      }

    } catch (err: any) {
      console.error('API Error:', err);
      let errMsg = err?.message || String(err);
      try {
        if (errMsg.startsWith('{')) {
          const parsed = JSON.parse(errMsg);
          if (parsed.error && parsed.error.message) {
            errMsg = parsed.error.message;
          }
        } else if (errMsg.startsWith('ApiError: {')) {
          const parsed = JSON.parse(errMsg.substring(10));
          if (parsed.error && parsed.error.message) {
            errMsg = parsed.error.message;
          }
        }
      } catch(e) {}
      res.write(`\n--STREAM-ERROR--\n${errMsg}`);
      res.end();
    }
  });

  app.post('/api/fortune/save', async (req, res) => {
    const { name, gender, calendar_type, date, time, province, resultJson } = req.body;
    const ip = getClientIp(req);
    
    let ip_location = "未知";
    let lat = 0;
    let lon = 0;
    
    if (ip && ip !== '127.0.0.1' && ip !== '::1' && ip !== '0.0.0.0') {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.status === 'success') {
            ip_location = geoData.regionName || geoData.city || geoData.country || "未知";
            lat = geoData.lat || 0;
            lon = geoData.lon || 0;
          }
        }
      } catch (e) {
        console.error("IP Geoloc err", e);
      }
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO readings (ip, ip_location, lat, lon, name, gender, calendar_type, birth_date, birth_time, province, result_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(ip, ip_location, lat, lon, name, gender, calendar_type, date, time, province, JSON.stringify(resultJson));
      
      // Increment usage count
      const userIdentifier = getUserIdentifier(req);
      incrementUsage(ip, userIdentifier);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/login', async (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
    if (password === adminPassword) {
      const token = await new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(getSecret());
      res.json({ token });
    } else {
      res.status(401).json({ error: '密码错误' });
    }
  });

  app.get('/api/admin/readings', authenticateAdmin, (req, res) => {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const offset = (page - 1) * limit;

    const countRes = db.prepare('SELECT COUNT(*) as count FROM readings').get() as any;
    const count = countRes?.count || 0;
    const data = db.prepare('SELECT * FROM readings ORDER BY id DESC LIMIT ? OFFSET ?').all(limit, offset);

    res.json({ data, total: count });
  });

  app.get('/api/admin/map-data', authenticateAdmin, (req, res) => {
    const points = db.prepare("SELECT ip_location, COUNT(*) as count, lat, lon FROM readings WHERE ip_location != '未知' GROUP BY ip_location").all();
    const provinces = db.prepare("SELECT province as ip_location, COUNT(*) as count, 0 as lat, 0 as lon FROM readings GROUP BY province").all();
    res.json({ points, provinces });
  });

  app.get('/api/admin/settings', authenticateAdmin, (req, res) => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as any[];
    const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    res.json(settings);
  });

  app.post('/api/admin/settings', authenticateAdmin, (req, res) => {
    const settings = req.body;
    const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    const insertMany = db.transaction((settingsObj) => {
      for (const [key, value] of Object.entries(settingsObj)) {
        stmt.run(key, String(value));
      }
    });
    insertMany(settings);
    // Invalidate cache
    cachedModelInfo = null;
    lastCacheUpdate = 0;
    res.json({ success: true });
  });

  app.delete('/api/admin/readings/:id', authenticateAdmin, (req, res) => {
    db.prepare('DELETE FROM readings WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development

  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
});
