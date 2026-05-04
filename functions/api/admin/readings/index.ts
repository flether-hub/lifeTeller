import { Env, authenticateAdmin, initDatabase } from '../../utils';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  await initDatabase(env.DB);
  if (!await authenticateAdmin(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);

  if (request.method === 'GET') {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const totalRes = await env.DB.prepare('SELECT COUNT(*) as count FROM readings').first<{ count: number }>();
    const { results } = await env.DB.prepare(
      'SELECT * FROM readings ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all();

    return new Response(JSON.stringify({
      data: results,
      total: totalRes?.count || 0,
      page,
      limit
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'DELETE') {
    // Expected path: /api/admin/readings?id=xxx
    const id = url.searchParams.get('id') || url.pathname.split('/').pop();
    if (!id) return new Response('Missing ID', { status: 400 });
    
    await env.DB.prepare('DELETE FROM readings WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response('Method not allowed', { status: 405 });
};
