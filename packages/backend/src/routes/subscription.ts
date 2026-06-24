import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDb } from '../db/index.js';

export async function subscriptionRoutes(app: FastifyInstance) {
  app.get('/api/sub/:token', async (req: FastifyRequest, reply: FastifyReply) => {
    const { token } = req.params as { token: string };
    const db = getDb();
    const user = db.prepare('SELECT id, username, protocols, enabled FROM users WHERE sub_token = ?').get(token) as any;

    if (!user || !user.enabled) {
      return reply.code(404).send({ error: 'Subscription not found' });
    }

    const protocols = JSON.parse(user.protocols || '[]');
    const host = req.headers.host || 'localhost';
    const domain = host.split(':')[0];
    const links: string[] = [];

    for (const proto of protocols) {
      switch (proto) {
        case 'xray':
          links.push(`vless://${user.id}-${user.username}@${domain}:443?encryption=none&security=tls&type=ws#MimoProxy-${user.username}-${proto}`);
          break;
        case 'hysteria2':
          links.push(`hysteria2://${user.id}-${user.username}@${domain}:8444?sni=${domain}#MimoProxy-${user.username}-${proto}`);
          break;
        case 'mieru':
          links.push(`mieru://${user.id}-${user.username}@${domain}:7701#MimoProxy-${user.username}-${proto}`);
          break;
        case 'mihomo':
          links.push(`clash://${user.id}-${user.username}@${domain}:7893#MimoProxy-${user.username}-${proto}`);
          break;
        default:
          links.push(`${proto}://${user.id}-${user.username}@${domain}#MimoProxy-${user.username}-${proto}`);
      }
    }

    const body = links.join('\n');
    const encoded = Buffer.from(body).toString('base64');

    reply.header('Content-Type', 'text/plain; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${user.username}.txt"`);
    reply.header('Profile-Update-Interval', '12');
    reply.header('Subscription-Userinfo', `upload=0; download=0; total=0; expire=0`);
    return encoded;
  });

  app.get('/api/sub/:token/info', async (req: FastifyRequest, reply: FastifyReply) => {
    const { token } = req.params as { token: string };
    const db = getDb();
    const user = db.prepare('SELECT id, username, sub_token, protocols, enabled, quota_bytes, used_bytes, expires_at FROM users WHERE sub_token = ?').get(token) as any;

    if (!user) {
      return reply.code(404).send({ error: 'Subscription not found' });
    }

    return {
      username: user.username,
      protocols: JSON.parse(user.protocols || '[]'),
      enabled: user.enabled,
      quota_bytes: user.quota_bytes,
      used_bytes: user.used_bytes,
      expires_at: user.expires_at,
    };
  });
}
