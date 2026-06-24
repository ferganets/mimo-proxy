import type { ProtocolAdapter } from '../adapters/xray.adapter.js';

const adapters = new Map<string, ProtocolAdapter>();

export function registerAdapter(name: string, adapter: ProtocolAdapter) {
  adapters.set(name, adapter);
}

export function getAdapter(name: string): ProtocolAdapter | undefined {
  return adapters.get(name);
}

export function listAdapters() {
  return Array.from(adapters.entries()).map(([name, adapter]) => ({
    name,
    status: adapter.getStatus(),
  }));
}

export async function generateUserConfigs(userId: number, username: string, protocols: string[]) {
  const configs: Record<string, any> = {};

  for (const protocol of protocols) {
    const adapter = adapters.get(protocol);
    if (adapter) {
      configs[protocol] = await adapter.generateConfig(username);
    }
  }

  return configs;
}

export async function reloadAll() {
  const results: Record<string, boolean> = {};
  for (const [name, adapter] of adapters) {
    try {
      await adapter.reload();
      results[name] = true;
    } catch {
      results[name] = false;
    }
  }
  return results;
}
