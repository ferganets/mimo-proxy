<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { api } from '@/api/client';

const traffic = ref<Record<string, { upload: number; download: number; total: number }>>({});
const online = ref<string[]>([]);
let interval: ReturnType<typeof setInterval>;

function formatBytes(b: number): string {
  if (!b) return '0 B';
  const k = 1024;
  const s = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + s[i];
}

async function refresh() {
  try {
    const [t, o] = await Promise.all([api.stats.traffic(), api.stats.online()]);
    traffic.value = t;
    online.value = o.online;
  } catch {}
}

onMounted(() => {
  refresh();
  interval = setInterval(refresh, 5000);
});

onUnmounted(() => clearInterval(interval));
</script>

<template>
  <div>
    <div class="page-header">
      <h2>Мониторинг</h2>
      <p>Трафик и активные подключения (обновляется каждые 5 сек)</p>
    </div>
    <div class="card" style="margin-bottom:1rem;">
      <div class="card-header">
        <h3>Онлайн ({{ online.length }})</h3>
      </div>
      <div v-if="online.length === 0" class="empty-state" style="padding:1.5rem;">
        <p>Нет активных подключений</p>
      </div>
      <div v-else style="display:flex;flex-wrap:wrap;gap:0.5rem;">
        <span v-for="u in online" :key="u" class="badge badge-green">{{ u }}</span>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <h3>Трафик по пользователям</h3>
      </div>
      <div v-if="Object.keys(traffic).length === 0" class="empty-state" style="padding:1.5rem;">
        <p>Нет данных о трафике</p>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Загрузка</th>
              <th>Отдача</th>
              <th>Всего</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(data, user) in traffic" :key="user">
              <td style="font-weight:600;">{{ user }}</td>
              <td>{{ formatBytes(data.upload) }}</td>
              <td>{{ formatBytes(data.download) }}</td>
              <td>{{ formatBytes(data.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
