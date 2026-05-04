import jwt from '@tsndr/cloudflare-worker-jwt';
import { Env, initDatabase } from '../utils';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  await initDatabase(env.DB);
  const { password } = await request.json() as { password?: string };

  if (password === env.ADMIN_PASSWORD) {
    const exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 1 day expiration
    const token = await jwt.sign({ admin: true, exp }, env.JWT_SECRET);
    return new Response(JSON.stringify({ token }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    return new Response(JSON.stringify({ error: 'Invalid password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
