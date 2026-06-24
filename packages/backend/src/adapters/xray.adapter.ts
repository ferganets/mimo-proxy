import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { config } from '../config.js';

export interface ProtocolAdapter {
  generateConfig(username: string): Promise<any>;
  getStatus(): string;
  reload(): Promise<void>;
}

export class XrayAdapter implements ProtocolAdapter {
  async generateConfig(username: string) {
    const userUuid = `${config.xray.uuid}`;
    return {
      protocol: 'xray',
      username,
      uuid: userUuid,
      port: config.xray.port,
      transport: 'ws',
      security: 'tls',
    };
  }

  getStatus(): string {
    try {
      const result = execSync('systemctl is-active xray', { encoding: 'utf-8' }).trim();
      return result === 'active' ? 'running' : 'stopped';
    } catch {
      return 'not installed';
    }
  }

  async reload(): Promise<void> {
    try {
      execSync('systemctl restart xray', { timeout: 10000 });
    } catch (e: any) {
      throw new Error(`Xray restart failed: ${e.message}`);
    }
  }
}
