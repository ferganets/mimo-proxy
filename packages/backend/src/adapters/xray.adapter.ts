export interface ProtocolAdapter {
  generateConfig(username: string): Promise<any>;
  getStatus(): string;
  reload(): Promise<void>;
}

export class XrayAdapter implements ProtocolAdapter {
  async generateConfig(username: string) {
    return {
      protocol: 'xray',
      username,
      protocols: ['vless', 'trojan'],
    };
  }

  getStatus() {
    return 'stub';
  }

  async reload() {
    console.log('[Xray] Reload stub');
  }
}
