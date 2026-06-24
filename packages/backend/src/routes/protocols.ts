import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from './auth.js';
import { listAdapters, reloadAll } from '../services/config-engine.js';

export async function protocolRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/api/protocols', async () => {
    return listAdapters();
  });

  app.post('/api/protocols/reload', async () => {
    const results = await reloadAll();
    return results;
  });
}
