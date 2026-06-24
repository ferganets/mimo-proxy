import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { getDb, closeDb } from './db/index.js';
import { migrate } from './db/schema.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { statsRoutes } from './routes/stats.js';
import { settingsRoutes } from './routes/settings.js';
import { protocolRoutes } from './routes/protocols.js';
import { protocolConfigRoutes } from './routes/protocol-config.js';
import { logRoutes } from './routes/logs.js';
import { backupRoutes } from './routes/backups.js';
import { subscriptionRoutes } from './routes/subscription.js';
import { initLogTable, log } from './services/log.service.js';
import { registerAdapter } from './services/config-engine.js';
import { XrayAdapter } from './adapters/xray.adapter.js';
import { Hysteria2Adapter } from './adapters/hysteria2.adapter.js';
import { MieruAdapter } from './adapters/mieru.adapter.js';
import { TrustTunnelAdapter } from './adapters/trusttunnel.adapter.js';
import { MihomoAdapter } from './adapters/mihomo.adapter.js';
import { CertbotAdapter } from './adapters/certbot.adapter.js';
import { initBot } from './services/tg-bot.service.js';

const app = Fastify({ logger: true });

await app.register(cors);

app.addContentTypeParser('*', { parseAs: 'buffer' }, (_req, body, done) => {
  done(null, body);
});

const db = getDb();
migrate(db);
initLogTable(db);

registerAdapter('xray', new XrayAdapter());
registerAdapter('hysteria2', new Hysteria2Adapter());
registerAdapter('mieru', new MieruAdapter());
registerAdapter('trusttunnel', new TrustTunnelAdapter());
registerAdapter('mihomo', new MihomoAdapter());
registerAdapter('certbot', new CertbotAdapter());

await app.register(authRoutes);
await app.register(userRoutes);
await app.register(statsRoutes);
await app.register(settingsRoutes);
await app.register(protocolRoutes);
await app.register(protocolConfigRoutes);
await app.register(logRoutes);
await app.register(backupRoutes);
await app.register(subscriptionRoutes);

app.get('/api/health', async () => ({ status: 'ok' }));

initBot();

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  log('info', `Server started on port ${config.port}`);
  console.log(`Server running on port ${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});
