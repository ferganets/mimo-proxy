import { getDb } from '../db/index.js';

const stats = new Map<string, { upload: number; download: number }>();

export function recordTraffic(username: string, upload: number, download: number) {
  const current = stats.get(username) || { upload: 0, download: 0 };
  current.upload += upload;
  current.download += download;
  stats.set(username, current);

  const db = getDb();
  db.prepare('UPDATE users SET used_bytes = used_bytes + ? WHERE username = ?')
    .run(upload + download, username);
}

export function getTrafficStats() {
  const result: Record<string, { upload: number; download: number; total: number }> = {};
  for (const [username, data] of stats) {
    result[username] = { ...data, total: data.upload + data.download };
  }
  return result;
}

export function getOnlineUsers() {
  return Array.from(stats.keys());
}

export function getSystemStats() {
  const db = getDb();
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  const totalTraffic = Array.from(stats.values()).reduce(
    (acc, s) => acc + s.upload + s.download,
    0
  );
  return {
    users: userCount,
    online: stats.size,
    totalTraffic,
    uptime: process.uptime(),
  };
}
