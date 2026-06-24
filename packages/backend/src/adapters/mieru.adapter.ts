import type { ProtocolAdapter } from './xray.adapter.js';

export class MieruAdapter implements ProtocolAdapter {
  async generateConfig(username: string) {
    return {
      protocol: 'mieru',
      username,
      cli: 'mita',
    };
  }

  getStatus() {
    return 'stub';
  }

  async reload() {
    console.log('[Mieru] Reload stub');
  }
}
