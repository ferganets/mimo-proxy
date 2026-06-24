import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from './auth.js';
import { getDb } from '../db/index.js';
import { notifyAdmin } from '../services/tg-bot.service.js';

const PROTOCOL_DEFAULTS: Record<string, any> = {
  xray: {
    port: 443,
    protocol: 'vless',
    transport: 'ws',
    security: 'tls',
    sniffing: true,
  },
  hysteria2: {
    port: 8443,
    bandwidth: '100 Mbps',
    quic: { initStreamReceiveWindow: 8388608, maxStreamReceiveWindow: 8388608 },
  },
  mieru: {
    port: 7701,
    mode: 'tcp',
    mtu: 1400,
  },
  trusttunnel: {
    port: 443,
  },
  mihomo: {
    port: 7890,
    apiPort: 9090,
    mixedPort: 7893,
  },
  certbot: {
    email: '',
    domains: [] as string[],
  },
};

function getConfig(name: string): any {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(`protocol_${name}`) as any;
  if (row) {
    try { return JSON.parse(row.value); } catch { return PROTOCOL_DEFAULTS[name] || {}; }
  }
  return PROTOCOL_DEFAULTS[name] || {};
}

function saveConfig(name: string, config: any) {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
    .run(`protocol_${name}`, JSON.stringify(config));
}

export async function protocolConfigRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/api/protocols/:name/config', async (req: FastifyRequest, reply: FastifyReply) => {
    const { name } = req.params as { name: string };
    if (!PROTOCOL_DEFAULTS[name]) {
      return reply.code(404).send({ error: 'Unknown protocol' });
    }
    return getConfig(name);
  });

  app.put('/api/protocols/:name/config', async (req: FastifyRequest, reply: FastifyReply) => {
    const { name } = req.params as { name: string };
    if (!PROTOCOL_DEFAULTS[name]) {
      return reply.code(404).send({ error: 'Unknown protocol' });
    }
    const config = req.body as any;
    saveConfig(name, config);
    notifyAdmin(`[${name}] конфиг обновлён`);
    return { ok: true };
  });

  app.get('/api/protocols/:name/config/defaults', async (req: FastifyRequest, reply: FastifyReply) => {
    const { name } = req.params as { name: string };
    if (!PROTOCOL_DEFAULTS[name]) {
      return reply.code(404).send({ error: 'Unknown protocol' });
    }
    return PROTOCOL_DEFAULTS[name];
  });
}
