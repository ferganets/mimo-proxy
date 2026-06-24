import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/index.js';
import { config } from '../config.js';

const SALT_ROUNDS = 10;

export interface UserPayload {
  id: number;
  username: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: UserPayload): string {
  return jwt.sign(user, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as UserPayload;
  } catch {
    return null;
  }
}

export function getAdminCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  return row.count;
}

export function createUser(username: string, passwordHash: string): number {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)'
  ).run(username, passwordHash);
  return Number(result.lastInsertRowid);
}

export function getUserByUsername(username: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
}

export function getUserById(id: number) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
}
