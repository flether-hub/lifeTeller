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
  const dbPath = path.join(process.cwd(), 'lifeteller.db');
  console.log(`Using database at: ${dbPath}`);
  db = new Database(dbPath);
  const schemaPath = path.join(process.cwd(), 'schema.sql');
  console.log(`Reading schema from: ${schemaPath}`);
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
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

  const getTodaysCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return (db.prepare("SELECT COUNT(*) as count FROM readings WHERE date(created_at) = ?").get(today) as any)?.count || 0;
  };

  const getIpTodaysCount = (ip: string) => {
    const today = new Date().toISOString().split('T')[0];
    return (db.prepare("SELECT COUNT(*) as count FROM readings WHERE ip = ? AND date(created_at) = ?").get(ip, today) as any)?.count || 0;
  };

  // API Routes
  app.get('/api/model-info', (req, res) => {
    try {
      const provider = (db.prepare('SELECT value FROM settings WHERE key = ?').get('model_provider') as any)?.value || 'gemini';
      let modelId = '';
      let providerName = '';

      if (provider === 'aliyun') {
        modelId = (db.prepare('SELECT value FROM settings WHERE key = ?').get('aliyun_model_id') as any)?.value || 'qwen-plus';
        providerName = '阿里云百炼 (Qwen)';
      } else {
        modelId = (db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_model_id') as any)?.value || 'gemini-2.0-flash';
        providerName = 'Google Gemini';
      }

      res.json({ provider, modelId, providerName });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch model info' });
    }
  });

  app.get('/api/config', (req, res) => {
    const totalDailyLimitStr = (db.prepare('SELECT value FROM settings WHERE key = ?').get('total_daily_limit') as any)?.value || '100';
    const ipDailyLimitStr = (db.prepare('SELECT value FROM settings WHERE key = ?').get('ip_daily_limit') as any)?.value || '3';
    
    const limitTotal = parseInt(totalDailyLimitStr);
    const limitIp = parseInt(ipDailyLimitStr);
    const ip = getClientIp(req);
    
    const countTotal = getTodaysCount();
    const countIp = getIpTodaysCount(ip);

    res.json({
      totalLeft: Math.max(0, limitTotal - countTotal),
      ipLeft: Math.max(0, limitIp - countIp)
    });
  });

  app.post('/api/fortune/check', (req, res) => {
    const totalDailyLimitStr = (db.prepare('SELECT value FROM settings WHERE key = ?').get('total_daily_limit') as any)?.value || '100';
    const ipDailyLimitStr = (db.prepare('SELECT value FROM settings WHERE key = ?').get('ip_daily_limit') as any)?.value || '3';
    
    const limitTotal = parseInt(totalDailyLimitStr);
    const limitIp = parseInt(ipDailyLimitStr);
    const ip = getClientIp(req);
    
    if (getTodaysCount() >= limitTotal) return res.status(429).json({ error: '今日全站算力额度已耗尽，请明早重试' });
    if (getIpTodaysCount(ip) >= limitIp) return res.status(429).json({ error: '您今日的测算额度已用完，请明早重试' });
    
    res.json({ success: true });
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

      const modelProviderRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('model_provider') as { value: string } | undefined;
      const modelProvider = modelProviderRow?.value || 'gemini';

      if (modelProvider === 'aliyun') {
        const aliyunRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('aliyun_api_key') as { value: string } | undefined;
        const apiKey = aliyunRow?.value || '';
        
        if (!apiKey) {
          res.write("\\n--STREAM-ERROR--\\n服务器未配置阿里云 API Key");
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
            messages: [{ role: "user", content: prompt }],
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
           res.write("\\n--STREAM-ERROR--\\n服务器未配置 Gemini API Key");
           return res.end();
        }

        const ai = new GoogleGenAI({ apiKey });
        const geminiModelRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_model_id') as { value: string } | undefined;
        const geminiModelId = geminiModelRow?.value || 'gemini-2.0-flash';
        
        let stream;
        try {
          stream = await ai.models.generateContentStream({
            model: geminiModelId,
            contents: prompt
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
