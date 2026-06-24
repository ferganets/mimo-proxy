import { getDb } from '../db/index.js';

interface LogEntry {
  id: number;
  level: string;
  message: string;
  meta: string | null;
  created_at: string;
}

export function initLogTable(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL DEFAULT 'info',
      message TEXT NOT NULL,
      meta TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
    CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
  `);
}

export function log(level: string, message: string, meta?: any) {
  const db = getDb();
  db.prepare('INSERT INTO logs (level, message, meta) VALUES (?, ?, ?)')
    .run(level, message, meta ? JSON.stringify(meta) : null);
}

export function getLogs(options: { level?: string; limit?: number; offset?: number } = {}) {
  const db = getDb();
  const { level, limit = 100, offset = 0 } = options;

  let query = 'SELECT * FROM logs';
  const params: any[] = [];

  if (level) {
    query += ' WHERE level = ?';
    params.push(level);
  }

  query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params) as LogEntry[];
  const total = db.prepare(`SELECT COUNT(*) as count FROM logs ${level ? 'WHERE level = ?' : ''}`)
    .get(...(level ? [level] : [])) as { count: number };

  return { logs: rows, total: total.count };
}

export function clearLogs() {
  const db = getDb();
  db.prepare('DELETE FROM logs').run();
}
