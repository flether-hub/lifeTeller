import { Env, authenticateAdmin } from '../utils';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  if (!await authenticateAdmin(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const pointsResult = await env.DB.prepare(
      'SELECT ip_location, AVG(lat) as lat, AVG(lon) as lon, COUNT(*) as count FROM readings WHERE lat IS NOT NULL AND lon IS NOT NULL GROUP BY ip_location'
    ).all();
    
    const provinceResult = await env.DB.prepare(
      'SELECT province, COUNT(*) as count FROM readings GROUP BY province'
    ).all();

    return new Response(JSON.stringify({ 
      points: pointsResult.results, 
      provinces: provinceResult.results 
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
