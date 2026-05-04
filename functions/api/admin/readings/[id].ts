import { Env, authenticateAdmin } from '../../utils';

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  if (!await authenticateAdmin(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const id = params.id as string;
  if (!id) return new Response('Missing ID', { status: 400 });
  
  await env.DB.prepare('DELETE FROM readings WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
