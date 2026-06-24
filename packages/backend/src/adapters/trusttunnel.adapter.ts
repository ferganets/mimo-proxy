import type { ProtocolAdapter } from './xray.adapter.js';

export class TrustTunnelAdapter implements ProtocolAdapter {
  async generateConfig(username: string) {
    return {
      protocol: 'trusttunnel',
      username,
    };
  }

  getStatus() {
    return 'stub';
  }

  async reload() {
    console.log('[TrustTunnel] Reload stub');
  }
}
