import { Env, authenticateAdmin } from '../utils';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  if (!await authenticateAdmin(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM settings').all<{ key: string, value: string }>();
    const obj: Record<string, string> = {};
    results.forEach(r => obj[r.key] = r.value);
    return new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'POST') {
    const { total_daily_limit, ip_daily_limit, custom_api_key } = await request.json() as any;
    await env.DB.prepare('UPDATE settings SET value = ? WHERE key = ?').bind(String(total_daily_limit), 'total_daily_limit').run();
    await env.DB.prepare('UPDATE settings SET value = ? WHERE key = ?').bind(String(ip_daily_limit), 'ip_daily_limit').run();
    if (custom_api_key !== undefined) {
      await env.DB.prepare('UPDATE settings SET value = ? WHERE key = ?').bind(String(custom_api_key), 'custom_api_key').run();
    }
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response('Method not allowed', { status: 405 });
};
