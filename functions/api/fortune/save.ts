import { Env, initDatabase } from '../utils';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  await initDatabase(env.DB);
  const ip = request.headers.get('cf-connecting-ip') || '未知IP';
  
  try {
    const body = await request.json() as any;
    const { name, gender, date, time, calendar_type, province, resultJson } = body;

    if (!name || !date || !time || !province || !resultJson) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let ip_location = '未知';
    let lat: number | null = null;
    let lon: number | null = null;

    // Cloudflare native geo info
    const cf = (request as any).cf;
    if (cf) {
      ip_location = cf.region || cf.city || cf.country || '未知';
      lat = cf.latitude ? parseFloat(cf.latitude) : null;
      lon = cf.longitude ? parseFloat(cf.longitude) : null;
    }

    // Fallback to IP API if location is still unknown and we have a valid IP
    if (ip_location === '未知' && ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== '未知IP') {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
        if (geoRes.ok) {
          const geoData: any = await geoRes.json();
          if (geoData.status === 'success') {
            ip_location = geoData.regionName || geoData.city || geoData.country || '未知';
            lat = geoData.lat;
            lon = geoData.lon;
          }
        }
      } catch (e) {
        console.error('Geo API error:', e);
      }
    }

    const result = await env.DB.prepare(
      'SELECT id FROM readings WHERE ip = ? AND name = ? AND calendar_type = ? AND birth_date = ? AND birth_time = ? AND province = ?'
    ).bind(ip, name, calendar_type, date, time, province).first<{ id: number }>();

    if (result) {
      await env.DB.prepare(
        'UPDATE readings SET result_json = ?, ip_location = ?, lat = ?, lon = ?, gender = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(JSON.stringify(resultJson), ip_location, lat, lon, gender || '未知', result.id).run();
    } else {
      await env.DB.prepare(
        'INSERT INTO readings (ip, ip_location, lat, lon, name, gender, calendar_type, birth_date, birth_time, province, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(ip, ip_location, lat, lon, name, gender || '未知', calendar_type, date, time, province, JSON.stringify(resultJson)).run();
    }

    return new Response(JSON.stringify({ success: true, ip_location, lat, lon }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
