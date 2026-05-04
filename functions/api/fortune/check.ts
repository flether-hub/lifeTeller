import { Env, getBeijingDateString, getSetting } from '../utils';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
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

    if (totalUsed >= totalLimit) {
      return new Response(JSON.stringify({ error: '今日全站算命次数已用完，请明日再来。' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (ipUsed >= ipLimit) {
      return new Response(JSON.stringify({ error: '您今日的算命次数已用完，请明日再来。' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const customKey = await getSetting(env.DB, 'custom_api_key', '');
    return new Response(JSON.stringify({ ok: true, customKey }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
