import { getDb } from '../db/index.js';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '../config.js';

function getBackupDir() {
  const dir = join(config.dbPath, '..', 'backups');
  return dir;
}

function ensureBackupDir() {
  const dir = getBackupDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function createBackup(): { file: string; size: number } {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.db`;
  const filepath = join(getBackupDir(), filename);

  copyFileSync(config.dbPath, filepath);

  const size = statSync(filepath).size;
  return { file: filename, size };
}

export function listBackups(): { file: string; size: number; created: string }[] {
  ensureBackupDir();
  const dir = getBackupDir();
  const files = readdirSync(dir).filter(f => f.endsWith('.db'));
  return files.map(f => {
    const stat = statSync(join(dir, f));
    return {
      file: f,
      size: stat.size,
      created: stat.birthtime.toISOString(),
    };
  }).sort((a, b) => b.created.localeCompare(a.created));
}

export function deleteBackup(filename: string): boolean {
  const filepath = join(getBackupDir(), filename);
  if (existsSync(filepath)) {
    unlinkSync(filepath);
    return true;
  }
  return false;
}
