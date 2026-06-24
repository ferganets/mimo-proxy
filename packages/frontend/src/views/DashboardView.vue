<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/client';

const stats = ref({ users: 0, online: 0, totalTraffic: 0, uptime: 0 });

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

onMounted(async () => {
  try {
    stats.value = await api.stats.system();
  } catch {}
});
</script>

<template>
  <div>
    <div class="page-header">
      <h2>Dashboard</h2>
      <p>Обзор системы</p>
    </div>
    <div class="stat-cards">
      <div class="stat-card">
        <div class="label">Пользователи</div>
        <div class="value">{{ stats.users }}</div>
        <div class="sub">всего зарегистрировано</div>
      </div>
      <div class="stat-card">
        <div class="label">Онлайн</div>
        <div class="value" style="color: #22c55e;">{{ stats.online }}</div>
        <div class="sub">активных подключений</div>
      </div>
      <div class="stat-card">
        <div class="label">Трафик</div>
        <div class="value">{{ formatBytes(stats.totalTraffic) }}</div>
        <div class="sub">общий объём</div>
      </div>
      <div class="stat-card">
        <div class="label">Аптайм</div>
        <div class="value">{{ formatUptime(stats.uptime) }}</div>
        <div class="sub">время работы</div>
      </div>
    </div>
  </div>
</template>
