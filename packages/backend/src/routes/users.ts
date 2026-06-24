import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from './auth.js';
import * as userService from '../services/user.service.js';
import { hashPassword } from '../services/auth.service.js';

export async function userRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/api/users', async () => {
    return userService.listUsers();
  });

  app.get('/api/users/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const user = userService.getUserById(parseInt(id));
    if (!user) return reply.code(404).send({ error: 'User not found' });
    return user;
  });

  app.post('/api/users', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as { username: string; password: string; quota_bytes?: number; expires_at?: string; protocols?: string[] };
    if (!body.username || !body.password) {
      return reply.code(400).send({ error: 'Username and password required' });
    }
    const id = await userService.createUser(body);
    return { id };
  });

  app.put('/api/users/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { password?: string; quota_bytes?: number; expires_at?: string; protocols?: string[]; enabled?: boolean };

    if (body.password) {
      body.password = await hashPassword(body.password);
    }

    userService.updateUser(parseInt(id), body);
    return { ok: true };
  });

  app.delete('/api/users/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    userService.deleteUser(parseInt(id));
    return { ok: true };
  });

  app.get('/api/users/:id/qr', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const user = userService.getUserById(parseInt(id)) as any;
    if (!user) return reply.code(404).send({ error: 'User not found' });

    const QRCode = await import('qrcode');
    const config = JSON.parse(user.protocols || '[]');
    const qrData = JSON.stringify({ username: user.username, protocols: config });
    const qr = await QRCode.default.toDataURL(qrData);
    return { qr };
  });
}
