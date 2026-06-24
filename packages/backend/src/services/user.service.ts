import { getDb } from '../db/index.js';
import { hashPassword } from './auth.service.js';
import { randomBytes } from 'node:crypto';

export interface CreateUserInput {
  username: string;
  password: string;
  quota_bytes?: number;
  expires_at?: string;
  protocols?: string[];
}

export interface UpdateUserInput {
  password?: string;
  quota_bytes?: number;
  expires_at?: string;
  protocols?: string[];
  enabled?: boolean;
}

export function listUsers() {
  const db = getDb();
  return db.prepare('SELECT id, username, quota_bytes, used_bytes, expires_at, protocols, enabled, created_at, updated_at FROM users').all();
}

export async function createUser(input: CreateUserInput) {
  const db = getDb();
  const passwordHash = await hashPassword(input.password);
  const subToken = randomBytes(16).toString('hex');
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, sub_token, quota_bytes, expires_at, protocols) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    input.username,
    passwordHash,
    subToken,
    input.quota_bytes || 0,
    input.expires_at || null,
    JSON.stringify(input.protocols || [])
  );
  return { id: Number(result.lastInsertRowid), subToken };
}

export function updateUser(id: number, input: UpdateUserInput) {
  const db = getDb();
  const sets: string[] = [];
  const values: any[] = [];

  if (input.password !== undefined) {
    // password hashing handled before call
    sets.push('password_hash = ?');
    values.push(input.password);
  }
  if (input.quota_bytes !== undefined) {
    sets.push('quota_bytes = ?');
    values.push(input.quota_bytes);
  }
  if (input.expires_at !== undefined) {
    sets.push('expires_at = ?');
    values.push(input.expires_at);
  }
  if (input.protocols !== undefined) {
    sets.push('protocols = ?');
    values.push(JSON.stringify(input.protocols));
  }
  if (input.enabled !== undefined) {
    sets.push('enabled = ?');
    values.push(input.enabled ? 1 : 0);
  }

  sets.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteUser(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

export function getUserById(id: number) {
  const db = getDb();
  return db.prepare('SELECT id, username, quota_bytes, used_bytes, expires_at, protocols, enabled, created_at, updated_at FROM users WHERE id = ?').get(id);
}
