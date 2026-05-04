import jwt from 'jsonwebtoken';
import { Env, initDatabase } from '../utils';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  await initDatabase(env.DB);
  const { password } = await request.json() as { password?: string };

  if (password === env.ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true }, env.JWT_SECRET, { expiresIn: '1d' });
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
