import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from './auth.js';
import { createBackup, listBackups, deleteBackup } from '../services/backup.service.js';

export async function backupRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/api/backups', async () => {
    return listBackups();
  });

  app.post('/api/backups', async () => {
    const result = createBackup();
    return result;
  });

  app.delete('/api/backups/:file', async (req: FastifyRequest, reply: FastifyReply) => {
    const { file } = req.params as { file: string };
    if (!file.endsWith('.db') || file.includes('..')) {
      return reply.code(400).send({ error: 'Invalid filename' });
    }
    const deleted = deleteBackup(file);
    if (!deleted) return reply.code(404).send({ error: 'Not found' });
    return { ok: true };
  });
}
