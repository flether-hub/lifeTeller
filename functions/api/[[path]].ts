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

  try {
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
      const todayDate = new Date().toISOString().split("T")[0];

      const countTotalRes = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM readings WHERE date(created_at) = ?",
      )
        .bind(todayDate)
        .first();
      const countIpRes = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM readings WHERE ip = ? AND date(created_at) = ?",
      )
        .bind(ip, todayDate)
        .first();

      const countTotal = (countTotalRes?.count as number) || 0;
      const countIp = (countIpRes?.count as number) || 0;

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
      const todayDate = new Date().toISOString().split("T")[0];

      const countTotalRes = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM readings WHERE date(created_at) = ?",
      )
        .bind(todayDate)
        .first();
      const countIpRes = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM readings WHERE ip = ? AND date(created_at) = ?",
      )
        .bind(ip, todayDate)
        .first();

      const countTotal = (countTotalRes?.count as number) || 0;
      const countIp = (countIpRes?.count as number) || 0;

      if (countTotal >= limitTotal)
        return errorResponse("今日全站算力额度已耗尽，请明早重试", 429);
      if (countIp >= limitIp)
        return errorResponse("您今日的测算额度已用完，请明早重试", 429);
      return jsonResponse({ success: true });
    }

    if (request.method === "POST" && path === "fortune/generate") {
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
                  messages: [{ role: "user", content: body.prompt }],
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
              encoder.encode("\\n--STREAM-ERROR--\\n" + err.message),
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
          stream = await ai.models.generateContentStream({
            model: "gemini-1.5-flash",
            contents: body.prompt,
          });
        } catch (err: any) {
          console.error("AI API Error:", err.message);
          return errorResponse(err.message, 503);
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
            await writer.write(
              encoder.encode("\\n--STREAM-ERROR--\\n" + err.message),
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

    if (request.method === "POST" && path === "fortune/save") {
      const body: any = await request.json();
      const ip = getClientIp();

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

      await env.DB.prepare(
        `
        INSERT INTO readings (ip, ip_location, lat, lon, name, gender, calendar_type, birth_date, birth_time, province, result_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
        .bind(
          ip,
          ip_location,
          lat,
          lon,
          body.name,
          body.gender,
          body.calendar_type,
          body.date,
          body.time,
          body.province,
          JSON.stringify(body.resultJson),
        )
        .run();

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

      if (request.method === "GET" && path === "admin/readings") {
        const urlParams = new URL(request.url).searchParams;
        const page = parseInt(urlParams.get("page") || "1");
        const limit = parseInt(urlParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        const countRes = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM readings",
        ).first();
        const { results } = await env.DB.prepare(
          "SELECT * FROM readings ORDER BY id DESC LIMIT ? OFFSET ?",
        )
          .bind(limit, offset)
          .all();

        return jsonResponse({ data: results, total: countRes?.count || 0 });
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
