import { execSync } from 'node:child_process';
import { config } from '../config.js';
import type { ProtocolAdapter } from './xray.adapter.js';

export class Hysteria2Adapter implements ProtocolAdapter {
  async generateConfig(username: string) {
    return {
      protocol: 'hysteria2',
      username,
      port: config.hysteria2.port,
      password: config.hysteria2.password,
    };
  }

  getStatus(): string {
    try {
      const result = execSync('systemctl is-active hysteria-server', { encoding: 'utf-8' }).trim();
      return result === 'active' ? 'running' : 'stopped';
    } catch {
      return 'not installed';
    }
  }

  async reload(): Promise<void> {
    try {
      execSync('systemctl restart hysteria-server', { timeout: 10000 });
    } catch (e: any) {
      throw new Error(`Hysteria2 restart failed: ${e.message}`);
    }
  }
}
