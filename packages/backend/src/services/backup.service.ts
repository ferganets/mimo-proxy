import { getDb } from '../db/index.js';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const BACKUP_DIR = './data/backups';

function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export function createBackup(): { file: string; size: number } {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.db`;
  const filepath = join(BACKUP_DIR, filename);

  const db = getDb();
  db.backup(filepath);

  const size = statSync(filepath).size;
  return { file: filename, size };
}

export function listBackups(): { file: string; size: number; created: string }[] {
  ensureBackupDir();
  const files = readdirSync(BACKUP_DIR).filter(f => f.endsWith('.db'));
  return files.map(f => {
    const stat = statSync(join(BACKUP_DIR, f));
    return {
      file: f,
      size: stat.size,
      created: stat.birthtime.toISOString(),
    };
  }).sort((a, b) => b.created.localeCompare(a.created));
}

export function deleteBackup(filename: string): boolean {
  const filepath = join(BACKUP_DIR, filename);
  if (existsSync(filepath)) {
    unlinkSync(filepath);
    return true;
  }
  return false;
}
