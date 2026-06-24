import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '');
  const user = ref<{ id: number; username: string } | null>(null);

  async function login(username: string, password: string) {
    const res = await api.auth.login(username, password);
    token.value = res.token;
    user.value = res.user;
    localStorage.setItem('token', res.token);
  }

  async function register(username: string, password: string) {
    const res = await api.auth.register(username, password);
    token.value = res.token;
    user.value = res.user;
    localStorage.setItem('token', res.token);
  }

  async function fetchUser() {
    if (!token.value) return;
    try {
      const res = await api.auth.me();
      user.value = res.user;
    } catch {
      logout();
    }
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
  }

  return { token, user, login, register, fetchUser, logout };
});
