import type { ProtocolAdapter } from './xray.adapter.js';

export class MihomoAdapter implements ProtocolAdapter {
  async generateConfig(username: string) {
    return {
      protocol: 'mihomo',
      username,
      apiPort: 9090,
    };
  }

  getStatus() {
    return 'stub';
  }

  async reload() {
    console.log('[Mihomo] Reload stub');
  }
}
