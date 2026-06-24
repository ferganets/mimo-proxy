<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/client';
import { toast } from '@/composables/useToast';

const t = toast();
const logs = ref<any[]>([]);
const total = ref(0);
const page = ref(0);
const limit = 50;
const levelFilter = ref('');

async function load() {
  const res = await api.logs.list({
    level: levelFilter.value || undefined,
    limit,
    offset: page.value * limit,
  });
  logs.value = res.logs;
  total.value = res.total;
}

async function clearLogs() {
  if (!confirm('Очистить все логи?')) return;
  try {
    await api.logs.clear();
    t.success('Логи очищены');
    load();
  } catch (e: any) {
    t.error('Ошибка', e.message);
  }
}

function prevPage() {
  if (page.value > 0) { page.value--; load(); }
}

function nextPage() {
  if ((page.value + 1) * limit < total.value) { page.value++; load(); }
}

function levelBadge(level: string) {
  const map: Record<string, string> = { info: 'badge-blue', warn: 'badge-yellow', error: 'badge-red', debug: 'badge-green' };
  return map[level] || 'badge-blue';
}

function formatTime(t: string) {
  return new Date(t + 'Z').toLocaleString('ru-RU');
}

onMounted(load);
</script>

<template>
  <div>
    <div class="page-header">
      <h2>Логи системы</h2>
      <p>Записи событий backend</p>
    </div>
    <div class="card">
      <div class="card-header">
        <h3>Фильтр</h3>
        <div class="toolbar">
          <select v-model="levelFilter" @change="page=0; load()" style="padding:6px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:13px;">
            <option value="">Все уровни</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
          <button class="btn btn-outline btn-sm" @click="load"><i class="pi pi-refresh"></i></button>
          <button class="btn btn-outline btn-sm" @click="clearLogs" style="color:#ef4444;"><i class="pi pi-trash"></i> Очистить</button>
        </div>
      </div>
      <div v-if="logs.length === 0" class="empty-state" style="padding:2rem;">
        <i class="pi pi-list"></i>
        <p>Нет записей</p>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style="width:160px;">Время</th>
              <th style="width:80px;">Уровень</th>
              <th>Сообщение</th>
              <th style="width:200px;">Мета</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td style="font-family:monospace;font-size:12px;color:#64748b;">{{ formatTime(log.created_at) }}</td>
              <td><span :class="'badge ' + levelBadge(log.level)">{{ log.level }}</span></td>
              <td>{{ log.message }}</td>
              <td style="font-family:monospace;font-size:11px;color:#94a3b8;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ log.meta || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="total > limit" style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem;font-size:13px;color:#64748b;">
        <span>{{ page * limit + 1 }}–{{ Math.min((page + 1) * limit, total) }} из {{ total }}</span>
        <div class="toolbar">
          <button class="btn btn-outline btn-sm" @click="prevPage" :disabled="page===0">← Назад</button>
          <button class="btn btn-outline btn-sm" @click="nextPage" :disabled="(page+1)*limit>=total">Вперёд →</button>
        </div>
      </div>
    </div>
  </div>
</template>
