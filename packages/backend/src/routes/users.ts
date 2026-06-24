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
    const { id, subToken } = await userService.createUser(body);
    return { id, subToken };
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
    const protocols = JSON.parse(user.protocols || '[]');
    const links: Record<string, string> = {};

    for (const proto of protocols) {
      const host = req.headers.host || 'localhost';
      const domain = host.split(':')[0];
      switch (proto) {
        case 'xray':
          links[proto] = `vless://${user.id}-${user.username}@${domain}:443?encryption=none&security=tls&type=ws#MimoProxy-${user.username}`;
          break;
        case 'hysteria2':
          links[proto] = `hysteria2://${user.id}-${user.username}@${domain}:8444?sni=${domain}#MimoProxy-${user.username}`;
          break;
        case 'mieru':
          links[proto] = `mieru://${user.id}-${user.username}@${domain}:7701#MimoProxy-${user.username}`;
          break;
        default:
          links[proto] = `${proto}://${user.id}-${user.username}@${domain}#MimoProxy-${user.username}`;
      }
    }

    const primary = Object.values(links)[0] || `${user.username}@localhost`;
    const qr = await QRCode.default.toDataURL(primary);
    return { qr, links, primary };
  });

  app.get('/api/users/:id/sub', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const db = (await import('../db/index.js')).getDb();
    const user = db.prepare('SELECT id, username, sub_token FROM users WHERE id = ?').get(parseInt(id)) as any;
    if (!user) return reply.code(404).send({ error: 'User not found' });

    const host = req.headers.host || 'localhost';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const subUrl = `${protocol}://${host}/api/sub/${user.sub_token}`;
    return { subUrl, subToken: user.sub_token };
  });
}
