import type { FastifyInstance } from 'fastify';
import { authMiddleware } from './auth.js';
import { getSystemStats, getTrafficStats, getOnlineUsers } from '../services/stats-collector.js';

export async function statsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/api/stats/system', async () => {
    return getSystemStats();
  });

  app.get('/api/stats/traffic', async () => {
    return getTrafficStats();
  });

  app.get('/api/stats/online', async () => {
    return { online: getOnlineUsers() };
  });
}
