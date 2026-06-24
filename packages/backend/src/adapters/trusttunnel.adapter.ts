import { execSync } from 'node:child_process';
import { config } from '../config.js';
import type { ProtocolAdapter } from './xray.adapter.js';

export class TrustTunnelAdapter implements ProtocolAdapter {
  async generateConfig(username: string) {
    return {
      protocol: 'trusttunnel',
      username,
      port: config.trusttunnel.port,
    };
  }

  getStatus(): string {
    try {
      const result = execSync('systemctl is-active trusttunnel 2>/dev/null || echo inactive', { encoding: 'utf-8' }).trim();
      return result === 'active' ? 'running' : 'stopped';
    } catch {
      return 'not installed';
    }
  }

  async reload(): Promise<void> {
    try {
      execSync('systemctl restart trusttunnel 2>/dev/null || true', { timeout: 10000 });
    } catch (e: any) {
      throw new Error(`TrustTunnel restart failed: ${e.message}`);
    }
  }
}
