<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import Toast from 'primevue/toast';

const auth = useAuthStore();
const router = useRouter();
const darkMode = ref(localStorage.getItem('darkMode') === 'true');

function toggleDark() {
  darkMode.value = !darkMode.value;
  localStorage.setItem('darkMode', String(darkMode.value));
  document.documentElement.classList.toggle('dark', darkMode.value);
}

onMounted(() => {
  if (darkMode.value) document.documentElement.classList.add('dark');
});

const nav = [
  { to: '/', icon: 'pi pi-home', label: 'Dashboard' },
  { to: '/users', icon: 'pi pi-users', label: 'Пользователи' },
  { to: '/protocols', icon: 'pi pi-server', label: 'Протоколы' },
  { to: '/monitoring', icon: 'pi pi-chart-line', label: 'Мониторинг' },
  { to: '/settings', icon: 'pi pi-cog', label: 'Настройки' },
  { to: '/logs', icon: 'pi pi-list', label: 'Логи' },
];

function logout() {
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <Toast position="top-right" />
  <div v-if="auth.user" class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>Mimo Proxy</h1>
        <p>Панель управления</p>
      </div>
      <nav class="sidebar-nav">
        <router-link v-for="item in nav" :key="item.to" :to="item.to">
          <i :class="item.icon"></i>
          {{ item.label }}
        </router-link>
      </nav>
      <div style="padding: 0 0.75rem;">
        <div style="padding: 0.75rem 1rem; font-size: 0.8rem; color: #64748b; border-top: 1px solid var(--border-color);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
            <span style="font-weight:600;color:var(--text-color);">{{ auth.user.username }}</span>
            <button @click="toggleDark" style="background:none;border:none;cursor:pointer;font-size:1.1rem;padding:4px;" :title="darkMode ? 'Светлая тема' : 'Тёмная тема'">
              <i :class="darkMode ? 'pi pi-sun' : 'pi pi-moon'"></i>
            </button>
          </div>
          <a href="#" @click.prevent="logout" style="color: #ef4444; font-size: 0.75rem; text-decoration: none; display: block;">Выйти</a>
        </div>
      </div>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
  <router-view v-else />
</template>
