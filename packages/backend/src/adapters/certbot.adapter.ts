import type { ProtocolAdapter } from './xray.adapter.js';

export class CertbotAdapter implements ProtocolAdapter {
  async generateConfig(username: string) {
    return {
      protocol: 'certbot',
      username,
    };
  }

  getStatus() {
    return 'stub';
  }

  async reload() {
    console.log('[Certbot] Reload stub');
  }
}
