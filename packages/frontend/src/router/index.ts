import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UsersView.vue'),
    },
    {
      path: '/protocols',
      name: 'protocols',
      component: () => import('@/views/ProtocolsView.vue'),
    },
    {
      path: '/monitoring',
      name: 'monitoring',
      component: () => import('@/views/MonitoringView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
    {
      path: '/logs',
      name: 'logs',
      component: () => import('@/views/LogsView.vue'),
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!auth.user && auth.token) {
    await auth.fetchUser();
  }

  if (to.meta.guest) {
    if (auth.user) return { name: 'dashboard' };
    return;
  }

  if (!auth.user) {
    return { name: 'login' };
  }
});

export default router;
