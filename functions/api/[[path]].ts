import { SignJWT, jwtVerify } from "jose";
import { GoogleGenAI } from "@google/genai";

interface Env {
  DB: any; // D1Database
  GEMINI_API_KEY: string;
  JWT_SECRET?: string;
  ADMIN_PASSWORD?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function authenticateAdmin(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.split(" ")[1];
  try {
    const secret = new TextEncoder().encode(
      env.JWT_SECRET || "fallback_secret",
    );
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function errorResponse(msg: string, status = 400) {
  return jsonResponse({ error: msg }, status);
}

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\//, "");

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const getClientIp = () =>
    request.headers.get("cf-connecting-ip") || "127.0.0.1";

  const getTodayBeijing = () => {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date()).replace(/\//g, '-');
  };

  async function initDatabase() {
    await env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS readings (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, ip_location TEXT, lat REAL, lon REAL, name TEXT, gender TEXT DEFAULT '未知', calendar_type TEXT, birth_date TEXT, birth_time TEXT, province TEXT, result_json TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, user_identifier TEXT, location TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, is_deleted INTEGER DEFAULT 0);`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS banned_ips (ip TEXT PRIMARY KEY, reason TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS quotas (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, user_identifier TEXT, usage_count INTEGER DEFAULT 0, comment_count INTEGER DEFAULT 0, quota_date DATE DEFAULT (date('now')), UNIQUE(ip, user_identifier, quota_date));`)
    ]);
  }

  try {
    await initDatabase();
    const getSetting = async (key: string) => {
      const res = await env.DB.prepare(
        "SELECT value FROM settings WHERE key = ?",
      )
        .bind(key)
        .first();
      return res ? res.value : null;
    };

    if (request.method === "GET" && path === "config") {
      const limitTotal = parseInt(
        ((await getSetting("total_daily_limit")) as string) || "100",
      );
      const limitIp = parseInt(
        ((await getSetting("ip_daily_limit")) as string) || "3",
      );
      const ip = getClientIp();
      const cookies = request.headers.get("cookie") || '';
      const match = cookies.match(/user_uid=([^;]+)/);
      const userIdentifier = match ? match[1] : 'unknown';
      const todayDate = getTodayBeijing();

      await env.DB.prepare(`
        INSERT INTO quotas (ip, user_identifier, quota_date, usage_count, comment_count)
        VALUES (?, ?, ?, 0, 0)
        ON CONFLICT(ip, user_identifier, quota_date) DO NOTHING
      `).bind(ip, userIdentifier, todayDate).run();

      const userQuota = await env.DB.prepare(`
        SELECT usage_count FROM quotas 
        WHERE ip = ? AND user_identifier = ? AND quota_date = ?
      `).bind(ip, userIdentifier, todayDate).first();

      const totalQuotaRes = await env.DB.prepare(`
        SELECT SUM(usage_count) as total FROM quotas WHERE quota_date = ?
      `).bind(todayDate).first();

      const countTotal = (totalQuotaRes?.total as number) || 0;
      const countIp = (userQuota?.usage_count as number) || 0;

      return jsonResponse({
        totalLeft: Math.max(0, limitTotal - countTotal),
        ipLeft: Math.max(0, limitIp - countIp),
      });
    }

    if (request.method === "POST" && path === "fortune/check") {
      const limitTotal = parseInt(
        ((await getSetting("total_daily_limit")) as string) || "100",
      );
      const limitIp = parseInt(
        ((await getSetting("ip_daily_limit")) as string) || "3",
      );
      const ip = getClientIp();
      const cookies = request.headers.get("cookie") || '';
      const match = cookies.match(/user_uid=([^;]+)/);
      const userIdentifier = match ? match[1] : 'unknown';
      const todayDate = getTodayBeijing();

      await env.DB.prepare(`
        INSERT INTO quotas (ip, user_identifier, quota_date, usage_count, comment_count)
        VALUES (?, ?, ?, 0, 0)
        ON CONFLICT(ip, user_identifier, quota_date) DO NOTHING
      `).bind(ip, userIdentifier, todayDate).run();

      const userQuota = await env.DB.prepare(`
        SELECT usage_count FROM quotas 
        WHERE ip = ? AND user_identifier = ? AND quota_date = ?
      `).bind(ip, userIdentifier, todayDate).first();

      const totalQuotaRes = await env.DB.prepare(`
        SELECT SUM(usage_count) as total FROM quotas WHERE quota_date = ?
      `).bind(todayDate).first();

      const countTotal = (totalQuotaRes?.total as number) || 0;
      const countIp = (userQuota?.usage_count as number) || 0;

      if (countTotal >= limitTotal)
        return errorResponse("今日全站算力额度已耗尽，请明早重试", 429);
      if (countIp >= limitIp)
        return errorResponse("您今日的测算额度已用完，请明早重试", 429);
      return jsonResponse({ success: true });
    }

    if (request.method === "POST" && path === "fortune/generate") {
      const ip = getClientIp();
      const cookies = request.headers.get("cookie") || '';
      const match = cookies.match(/user_uid=([^;]+)/);
      const userIdentifier = match ? match[1] : 'unknown';
      const todayDate = getTodayBeijing();

      // 1. Server-side Quota Check
      const limitTotal = parseInt(((await getSetting("total_daily_limit")) as string) || "100");
      const limitIp = parseInt(((await getSetting("ip_daily_limit")) as string) || "3");

      const userQuota = await env.DB.prepare(`
        SELECT usage_count FROM quotas WHERE ip = ? AND user_identifier = ? AND quota_date = ?
      `).bind(ip, userIdentifier, todayDate).first();

      const totalQuotaRes = await env.DB.prepare(`
        SELECT SUM(usage_count) as total FROM quotas WHERE quota_date = ?
      `).bind(todayDate).first();

      const countTotal = (totalQuotaRes?.total as number) || 0;
      const countIp = (userQuota?.usage_count as number) || 0;

      if (countTotal >= limitTotal) return errorResponse("今日全站算力额度已耗尽，请明早重试", 429);
      if (countIp >= limitIp) return errorResponse("您今日的测算额度已用完，请明早重试", 429);

      // 2. Real-time Deduction
      await env.DB.prepare(`
        INSERT INTO quotas (ip, user_identifier, quota_date, usage_count, comment_count)
        VALUES (?, ?, ?, 1, 0)
        ON CONFLICT(ip, user_identifier, quota_date) 
        DO UPDATE SET usage_count = usage_count + 1
      `).bind(ip, userIdentifier, todayDate).run();

      const body: any = await request.json();
      const modelProvider =
        ((await getSetting("model_provider")) as string) || "gemini";

      let apiKey = "";
      if (modelProvider === "aliyun") {
        apiKey = (await getSetting("aliyun_api_key")) as string;
      } else {
        const customKey = (await getSetting("gemini_api_key")) as string;
        apiKey = customKey || env.GEMINI_API_KEY;
      }

      if (!apiKey) {
        return errorResponse(
          modelProvider === "aliyun"
            ? "服务器未配置阿里云 API Key"
            : "服务器未配置 Gemini API Key",
          500,
        );
      }

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      if (modelProvider === "aliyun") {
        const aliyunModelId =
          ((await getSetting("aliyun_model_id")) as string) || "qwen-plus";
        (async () => {
          try {
            const res = await fetch(
              "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                  model: aliyunModelId,
                  messages: [{ role: "user", content: `Today is ${getTodayBeijing()}. ${body.prompt}` }],
                  stream: true,
                }),
              },
            );

            if (!res.ok) {
              const errText = await res.text();
              throw new Error(`AliYun API Error: ${res.status} ${errText}`);
            }

            if (!res.body) throw new Error("No response body");
            const reader = res.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
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
                      await writer.write(encoder.encode(content));
                    }
                  } catch (e) {}
                }
              }
            }
            
            // Write any remaining buffer if it looks like data
            const finalLine = buffer.trim();
            if (finalLine.startsWith("data:")) {
              const data = finalLine.slice(5).trim();
              if (data !== "[DONE]") {
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    await writer.write(encoder.encode(content));
                  }
                } catch (e) {}
              }
            }

            await writer.close();
          } catch (err: any) {
            console.error("AliYun stream error:", err);
            await writer.write(
              encoder.encode("\n--STREAM-ERROR--\n" + err.message),
            );
            await writer.close();
          }
        })();

        return new Response(readable, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      } else {
        const ai = new GoogleGenAI({ apiKey });
        let stream;
        try {
          const geminiModelId = ((await getSetting("gemini_model_id")) as string) || "gemini-2.0-flash";
          const today = getTodayBeijing();
          stream = await ai.models.generateContentStream({
            model: geminiModelId,
            contents: `Today is ${today}. ${body.prompt}`,
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
          return new Response(`\n--STREAM-ERROR--\n${errMsg}`, {
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
        }

        (async () => {
          try {
            for await (const chunk of stream) {
              if (chunk.text) {
                await writer.write(encoder.encode(chunk.text));
              }
            }
            await writer.close();
          } catch (err: any) {
            console.error("Stream error:", err);
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
            await writer.write(
              encoder.encode(`\n--STREAM-ERROR--\n${errMsg}`),
            );
            await writer.close();
          }
        })();

        return new Response(readable, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      }
    }

    if (request.method === "GET" && path === "model-info") {
      const providerName = ((await getSetting("model_provider")) as string) || "gemini";
      let modelId = "";
      if (providerName === "aliyun") {
         modelId = ((await getSetting("aliyun_model_id")) as string) || "qwen-plus";
      } else {
         modelId = ((await getSetting("gemini_model_id")) as string) || "gemini-2.0-flash";
      }
      return jsonResponse({ providerName, modelId });
    }

    if (request.method === "GET" && path === "comments") {
      const { results: comments } = await env.DB.prepare(`
        SELECT id, location, content, created_at, ip
        FROM comments 
        ORDER BY created_at DESC 
        LIMIT 10
      `).all();
      
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
        return { ...c, ip: maskedIp };
      });
      return jsonResponse(maskedComments);
    }

    if (request.method === "POST" && path === "comments") {
      const body: any = await request.json();
      const content = body.content;
      if (!content || typeof content !== 'string') return errorResponse('评论内容不能为空');
      if (content.length > 500) return errorResponse('评论内容过长');

      const ip = getClientIp();
      const cookies = request.headers.get("cookie") || '';
      const match = cookies.match(/user_uid=([^;]+)/);
      const userIdentifier = match ? match[1] : 'unknown';

      const isBanned = await env.DB.prepare('SELECT 1 FROM banned_ips WHERE ip = ?').bind(ip).first();
      if (isBanned) return errorResponse('您的 IP 已被禁止评论', 403);

      // Simple rate limit in memory just for now, or check quotas table
      const today = getTodayBeijing();
      const quota = await env.DB.prepare(`
        SELECT comment_count FROM quotas 
        WHERE ip = ? AND user_identifier = ? AND quota_date = ?
      `).bind(ip, userIdentifier, today).first() as any;

      if (quota && quota.comment_count >= 2) return errorResponse('每个用户每天限发2条评论', 429);

      let location = "未知";
      try {
        const cf = (request as any).cf;
        location = cf?.region || cf?.city || cf?.country || "未知";
      } catch (e) {}

      await env.DB.prepare(`
        INSERT INTO comments (ip, user_identifier, location, content)
        VALUES (?, ?, ?, ?)
      `).bind(ip, userIdentifier, location, content).run();

      await env.DB.prepare(`
        INSERT INTO quotas (ip, user_identifier, quota_date, comment_count)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(ip, user_identifier, quota_date) 
        DO UPDATE SET comment_count = comment_count + 1
      `).bind(ip, userIdentifier, today).run();

      return jsonResponse({ success: true });
    }

    if (request.method === "POST" && path === "fortune/save") {
      const body: any = await request.json();
      const ip = getClientIp();
      const cookies = request.headers.get("cookie") || '';
      const match = cookies.match(/user_uid=([^;]+)/);
      const userIdentifier = match ? match[1] : 'unknown';
      const todayDate = getTodayBeijing();

      let ip_location = body.province;
      let lat = 0;
      let lon = 0;
      
      try {
        const cf = (request as any).cf;
        if (cf) {
          ip_location = cf.region || cf.city || body.province || "未知";
          lat = cf.latitude ? parseFloat(cf.latitude) : 0;
          lon = cf.longitude ? parseFloat(cf.longitude) : 0;
        }
      } catch (e) {}

      await env.DB.prepare(`
        INSERT INTO readings (ip, ip_location, lat, lon, name, gender, calendar_type, birth_date, birth_time, province, result_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(ip, ip_location, lat, lon, body.name, body.gender, body.calendar_type, body.date, body.time, body.province, JSON.stringify(body.resultJson)).run();

      return jsonResponse({ success: true });
    }

    if (request.method === "POST" && path === "admin/login") {
      const body: any = await request.json();
      const adminPassword = env.ADMIN_PASSWORD || "admin";
      if (body.password === adminPassword) {
        const secret = new TextEncoder().encode(
          env.JWT_SECRET || "fallback_secret",
        );
        const token = await new SignJWT({ role: "admin" })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("24h")
          .sign(secret);
        return jsonResponse({ token });
      } else {
        return errorResponse("密码错误", 401);
      }
    }

    // Auth protected routes
    if (path.startsWith("admin/")) {
      if (!(await authenticateAdmin(request, env))) {
        return errorResponse("Unauthorized", 401);
      }

      if (request.method === "GET" && path === "admin/comments") {
        const { results: comments } = await env.DB.prepare('SELECT * FROM comments ORDER BY created_at DESC').all();
        return jsonResponse(comments || []);
      }

      if (request.method === "POST" && path === "admin/comments/batch-delete") {
        const { ids } = await request.json() as any;
        if (!Array.isArray(ids) || ids.length === 0) return errorResponse("无效的ID列表");
        const stmts = ids.map(id => env.DB.prepare("DELETE FROM comments WHERE id = ?").bind(id));
        await env.DB.batch(stmts);
        return jsonResponse({ success: true, count: ids.length });
      }

      if (request.method === "DELETE" && path.startsWith("admin/comments/")) {
        const id = path.split("/")[2];
        await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true });
      }

      if (request.method === "GET" && path === "admin/banned-ips") {
        const { results: ips } = await env.DB.prepare('SELECT * FROM banned_ips').all();
        return jsonResponse(ips || []);
      }

      if (request.method === "POST" && path === "admin/ban-ip") {
        const { ip, reason } = await request.json();
        await env.DB.prepare('INSERT OR REPLACE INTO banned_ips (ip, reason) VALUES (?, ?)').bind(ip, reason || '违规评论').run();
        return jsonResponse({ success: true });
      }

      if (request.method === "DELETE" && path.startsWith("admin/ban-ip/")) {
        const ip = path.split("/")[2];
        await env.DB.prepare('DELETE FROM banned_ips WHERE ip = ?').bind(ip).run();
        return jsonResponse({ success: true });
      }

      if (request.method === "GET" && path === "admin/readings") {
        const urlParams = new URL(request.url).searchParams;
        const page = parseInt(urlParams.get("page") || "1");
        const limit = parseInt(urlParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        const countRes = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM readings",
        ).first();
        const { results } = await env.DB.prepare(
          "SELECT id, ip, ip_location, lat, lon, name, gender, calendar_type, birth_date, birth_time, province, created_at FROM readings ORDER BY id DESC LIMIT ? OFFSET ?",
        )
          .bind(limit, offset)
          .all();

        return jsonResponse({ data: results, total: countRes?.count || 0 });
      }

      if (request.method === "GET" && path.startsWith("admin/readings/")) {
        const id = path.split("/")[2];
        const data = await env.DB.prepare('SELECT * FROM readings WHERE id = ?').bind(id).first();
        if (!data) return errorResponse('记录不存在', 404);
        return jsonResponse(data);
      }

      if (request.method === "GET" && path === "admin/map-data") {
        const { results: points } = await env.DB.prepare(
          "SELECT ip_location, COUNT(*) as count, lat, lon FROM readings WHERE ip_location != '未知' AND lat != 0 AND lon != 0 GROUP BY ip_location",
        ).all();
        const { results: provinces } = await env.DB.prepare(
          "SELECT province as ip_location, COUNT(*) as count, 0 as lat, 0 as lon FROM readings GROUP BY province",
        ).all();
        return jsonResponse({ points, provinces });
      }

      if (request.method === "GET" && path === "admin/settings") {
        const { results } = await env.DB.prepare(
          "SELECT key, value FROM settings",
        ).all();
        const settings = results?.reduce(
          (acc: any, row: any) => ({ ...acc, [row.key]: row.value }),
          {},
        );
        return jsonResponse(settings || {});
      }

      if (request.method === "POST" && path === "admin/settings") {
        const settings = (await request.json()) as any;
        const stmts = Object.entries(settings).map(([key, value]) => {
          return env.DB.prepare(
            "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
          ).bind(key, String(value));
        });
        await env.DB.batch(stmts);
        return jsonResponse({ success: true });
      }

      if (request.method === "POST" && path === "admin/readings/batch-delete") {
        const { ids } = await request.json() as any;
        if (!Array.isArray(ids) || ids.length === 0) return errorResponse("无效的ID列表");
        const stmts = ids.map(id => env.DB.prepare("DELETE FROM readings WHERE id = ?").bind(id));
        await env.DB.batch(stmts);
        return jsonResponse({ success: true, count: ids.length });
      }

      if (request.method === "DELETE" && path.startsWith("admin/readings/")) {
        const id = path.split("/")[2];
        await env.DB.prepare("DELETE FROM readings WHERE id = ?")
          .bind(id)
          .run();
        return jsonResponse({ success: true });
      }
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (error: any) {
    console.error("Pages API Error:", error);
    return errorResponse(error.message, 500);
  }
};
