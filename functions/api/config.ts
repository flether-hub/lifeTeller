import { Env, getBeijingDateString, getSetting, initDatabase } from './utils';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  await initDatabase(env.DB);
  const ip = request.headers.get('cf-connecting-ip') || '未知IP';
  const today = getBeijingDateString();

  try {
    const totalLimit = parseInt(await getSetting(env.DB, 'total_daily_limit', '100'));
    const ipLimit = parseInt(await getSetting(env.DB, 'ip_daily_limit', '3'));

    const totalUsedResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM readings WHERE date(datetime(created_at, '+8 hours')) = ?"
    ).bind(today).first<{ count: number }>();
    
    const ipUsedResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM readings WHERE date(datetime(created_at, '+8 hours')) = ? AND ip = ?"
    ).bind(today, ip).first<{ count: number }>();

    const totalUsed = totalUsedResult?.count || 0;
    const ipUsed = ipUsedResult?.count || 0;

    return new Response(JSON.stringify({
      totalLeft: Math.max(0, totalLimit - totalUsed),
      ipLeft: Math.max(0, ipLimit - ipUsed)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
