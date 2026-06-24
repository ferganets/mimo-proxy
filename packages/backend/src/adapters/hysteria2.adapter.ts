import type { ProtocolAdapter } from './xray.adapter.js';

export class Hysteria2Adapter implements ProtocolAdapter {
  async generateConfig(username: string) {
    return {
      protocol: 'hysteria2',
      username,
      format: 'yaml',
    };
  }

  getStatus() {
    return 'stub';
  }

  async reload() {
    console.log('[Hysteria2] Reload stub');
  }
}
