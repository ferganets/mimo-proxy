import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from './auth.js';
import { getLogs, clearLogs } from '../services/log.service.js';

export async function logRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/api/logs', async (req: FastifyRequest) => {
    const { level, limit, offset } = req.query as { level?: string; limit?: string; offset?: string };
    return getLogs({
      level,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    });
  });

  app.delete('/api/logs', async () => {
    clearLogs();
    return { ok: true };
  });
}
