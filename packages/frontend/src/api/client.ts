const BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: { id: number; username: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    register: (username: string, password: string) =>
      request<{ token: string; user: { id: number; username: string } }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    me: () => request<{ user: { id: number; username: string } }>('/auth/me'),
  },
  users: {
    list: () => request<any[]>('/users'),
    get: (id: number) => request<any>(`/users/${id}`),
    create: (data: any) => request<{ id: number }>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<any>(`/users/${id}`, { method: 'DELETE' }),
    qr: (id: number) => request<{ qr: string }>(`/users/${id}/qr`),
  },
  stats: {
    system: () => request<{ users: number; online: number; totalTraffic: number; uptime: number }>('/stats/system'),
    traffic: () => request<Record<string, { upload: number; download: number; total: number }>>('/stats/traffic'),
    online: () => request<{ online: string[] }>('/stats/online'),
  },
  protocols: {
    list: () => request<{ name: string; status: string }[]>('/protocols'),
    reload: () => request<Record<string, boolean>>('/protocols/reload', { method: 'POST' }),
    getConfig: (name: string) => request<any>(`/protocols/${name}/config`),
    updateConfig: (name: string, config: any) => request<any>(`/protocols/${name}/config`, { method: 'PUT', body: JSON.stringify(config) }),
    getDefaults: (name: string) => request<any>(`/protocols/${name}/config/defaults`),
  },
  settings: {
    get: () => request<Record<string, any>>('/settings'),
    update: (data: Record<string, any>) => request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
  logs: {
    list: (params?: { level?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params?.level) q.set('level', params.level);
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.offset) q.set('offset', String(params.offset));
      const qs = q.toString();
      return request<{ logs: any[]; total: number }>(`/logs${qs ? '?' + qs : ''}`);
    },
    clear: () => request<any>('/logs', { method: 'DELETE' }),
  },
  backups: {
    list: () => request<{ file: string; size: number; created: string }[]>('/backups'),
    create: () => request<{ file: string; size: number }>('/backups', { method: 'POST' }),
    delete: (file: string) => request<any>(`/backups/${encodeURIComponent(file)}`, { method: 'DELETE' }),
  },
};
