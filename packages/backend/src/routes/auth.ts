import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  getAdminCount,
  createUser,
  getUserByUsername,
} from '../services/auth.service.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/register', async (req: FastifyRequest, reply: FastifyReply) => {
    const adminCount = getAdminCount();
    if (adminCount > 0) {
      return reply.code(403).send({ error: 'Admin already exists' });
    }

    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) {
      return reply.code(400).send({ error: 'Username and password required' });
    }

    const hash = await hashPassword(password);
    const id = createUser(username, hash);
    const token = generateToken({ id, username });

    return { token, user: { id, username } };
  });

  app.post('/api/auth/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) {
      return reply.code(400).send({ error: 'Username and password required' });
    }

    const user = getUserByUsername(username);
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, username: user.username });
    return { token, user: { id: user.id, username: user.username } };
  });

  app.get('/api/auth/me', {
    preHandler: [authMiddleware],
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    return { user };
  });
}

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return reply.code(401).send({ error: 'Invalid token' });
  }

  (req as any).user = payload;
}
