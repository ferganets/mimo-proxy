<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/client';
import { toast } from '@/composables/useToast';

const t = toast();
const protocols = ref<{ name: string; status: string }[]>([]);
const reloading = ref(false);
const showConfig = ref(false);
const configName = ref('');
const configData = ref<any>({});
const configRaw = ref('');
const configError = ref('');

const colors: Record<string, string> = {
  xray: '#7c3aed',
  hysteria2: '#f59e0b',
  mieru: '#ef4444',
  trusttunnel: '#64748b',
  mihomo: '#3b82f6',
  certbot: '#10b981',
};

const icons: Record<string, string> = {
  xray: 'X',
  hysteria2: 'H2',
  mieru: 'M',
  trusttunnel: 'TT',
  mihomo: 'MH',
  certbot: 'CB',
};

async function load() {
  protocols.value = await api.protocols.list();
}

async function reload() {
  reloading.value = true;
  try {
    await api.protocols.reload();
    await load();
    t.success('Протоколы перезагружены');
  } catch (e: any) {
    t.error('Ошибка перезагрузки', e.message);
  } finally {
    reloading.value = false;
  }
}

async function openConfig(name: string) {
  configName.value = name;
  configError.value = '';
  try {
    const config = await api.protocols.getConfig(name);
    configData.value = config;
    configRaw.value = JSON.stringify(config, null, 2);
    showConfig.value = true;
  } catch (e: any) {
    t.error('Ошибка загрузки конфига', e.message);
  }
}

async function saveConfig() {
  try {
    configData.value = JSON.parse(configRaw.value);
    configError.value = '';
  } catch {
    configError.value = 'Невалидный JSON';
    return;
  }
  try {
    await api.protocols.updateConfig(configName.value, configData.value);
    t.success('Конфиг сохранён');
    showConfig.value = false;
  } catch (e: any) {
    t.error('Ошибка сохранения', e.message);
  }
}

async function resetConfig() {
  try {
    const defaults = await api.protocols.getDefaults(configName.value);
    configData.value = defaults;
    configRaw.value = JSON.stringify(defaults, null, 2);
    configError.value = '';
    t.info('Значения сброшены к дефолтным');
  } catch {}
}

onMounted(load);
</script>

<template>
  <div>
    <div class="page-header">
      <h2>Протоколы</h2>
      <p>Статус и конфигурация протоколов</p>
    </div>
    <div class="card" style="margin-bottom: 1rem;">
      <div class="card-header">
        <h3>Управление</h3>
        <button class="btn btn-outline btn-sm" @click="reload" :disabled="reloading">
          <i class="pi pi-refresh" :class="{ 'pi-spin': reloading }"></i>
          {{ reloading ? 'Перезагрузка...' : 'Перезагрузить все' }}
        </button>
      </div>
    </div>
    <div class="protocol-grid">
      <div v-for="p in protocols" :key="p.name" class="protocol-card" style="cursor:pointer;" @click="openConfig(p.name)">
        <div class="icon" :style="{ background: colors[p.name] || '#64748b' }">
          {{ icons[p.name] || '?' }}
        </div>
        <div class="info">
          <h4>{{ p.name }}</h4>
          <p>{{ p.status }}</p>
        </div>
        <span :class="p.status === 'stub' ? 'badge badge-yellow' : 'badge badge-green'" style="margin-left:auto;">
          {{ p.status === 'stub' ? 'Заглушка' : 'Активен' }}
        </span>
      </div>
    </div>

    <div v-if="showConfig" class="modal-overlay" @click.self="showConfig = false">
      <div class="modal" style="max-width:640px;">
        <h3>Конфигурация: {{ configName }}</h3>
        <div class="field">
          <label>JSON конфигурация</label>
          <textarea v-model="configRaw" rows="16" style="width:100%;font-family:monospace;font-size:13px;padding:12px;border:1px solid var(--border-color);border-radius:0.5rem;resize:vertical;background:#f8fafc;"></textarea>
        </div>
        <div v-if="configError" style="color:#ef4444;font-size:0.8rem;margin-bottom:0.75rem;">{{ configError }}</div>
        <div class="modal-actions">
          <button class="btn btn-outline btn-sm" @click="resetConfig">Сбросить к дефолту</button>
          <button class="btn btn-outline btn-sm" @click="showConfig = false">Отмена</button>
          <button class="btn btn-primary btn-sm" @click="saveConfig">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>
