import { execSync } from 'node:child_process';
import { config } from '../config.js';
import type { ProtocolAdapter } from './xray.adapter.js';

export class MieruAdapter implements ProtocolAdapter {
  async generateConfig(username: string) {
    return {
      protocol: 'mieru',
      username,
      port: config.mieru.port,
      password: config.mieru.password,
      cli: 'mita',
    };
  }

  getStatus(): string {
    try {
      const result = execSync('systemctl is-active mita', { encoding: 'utf-8' }).trim();
      return result === 'active' ? 'running' : 'stopped';
    } catch {
      return 'not installed';
    }
  }

  async reload(): Promise<void> {
    try {
      execSync('systemctl restart mita', { timeout: 10000 });
    } catch (e: any) {
      throw new Error(`Mieru restart failed: ${e.message}`);
    }
  }
}
