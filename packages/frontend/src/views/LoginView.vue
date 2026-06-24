<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(username.value, password.value);
    router.push('/');
  } catch (e: any) {
    error.value = e.message || 'Ошибка авторизации';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Mimo Proxy</h1>
      <p class="subtitle">Панель управления</p>
      <div v-if="error" class="error">{{ error }}</div>
      <form @submit.prevent="handleLogin">
        <div class="field">
          <label>Логин</label>
          <input v-model="username" type="text" placeholder="admin" autofocus />
        </div>
        <div class="field">
          <label>Пароль</label>
          <input v-model="password" type="password" placeholder="••••••••" />
        </div>
        <button class="btn btn-primary" style="width:100%; margin-top:0.5rem;" :disabled="loading">
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>
      </form>
    </div>
  </div>
</template>
