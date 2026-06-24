import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from './auth.js';
import { getDb } from '../db/index.js';

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/api/settings', async () => {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, any> = {};
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }
    return settings;
  });

  app.put('/api/settings', async (req: FastifyRequest) => {
    const body = req.body as Record<string, any>;
    const db = getDb();
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    for (const [key, value] of Object.entries(body)) {
      upsert.run(key, typeof value === 'string' ? value : JSON.stringify(value));
    }

    return { ok: true };
  });
}
