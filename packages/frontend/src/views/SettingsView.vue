<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/client';
import { toast } from '@/composables/useToast';

const t = toast();
const settings = ref<Record<string, any>>({});
const tgBotToken = ref('');
const tgAdminId = ref('');
const certbotEmail = ref('');
const saving = ref(false);
const backups = ref<{ file: string; size: number; created: string }[]>([]);
const creatingBackup = ref(false);

function formatBytes(b: number): string {
  if (!b) return '0 B';
  const k = 1024;
  const s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + s[i];
}

async function load() {
  settings.value = await api.settings.get();
  tgBotToken.value = settings.value.tg_bot_token || '';
  tgAdminId.value = settings.value.tg_admin_id || '';
  certbotEmail.value = settings.value.certbot_email || '';
  backups.value = await api.backups.list();
}

async function save() {
  saving.value = true;
  try {
    await api.settings.update({
      tg_bot_token: tgBotToken.value,
      tg_admin_id: tgAdminId.value,
      certbot_email: certbotEmail.value,
    });
    t.success('Настройки сохранены');
  } catch (e: any) {
    t.error('Ошибка', e.message);
  } finally {
    saving.value = false;
  }
}

async function createBackup() {
  creatingBackup.value = true;
  try {
    await api.backups.create();
    t.success('Бэкап создан');
    backups.value = await api.backups.list();
  } catch (e: any) {
    t.error('Ошибка', e.message);
  } finally {
    creatingBackup.value = false;
  }
}

async function deleteBackup(file: string) {
  if (!confirm(`Удалить ${file}?`)) return;
  try {
    await api.backups.delete(file);
    t.success('Бэкап удалён');
    backups.value = await api.backups.list();
  } catch (e: any) {
    t.error('Ошибка', e.message);
  }
}

onMounted(load);
</script>

<template>
  <div>
    <div class="page-header">
      <h2>Настройки</h2>
      <p>Telegram бот, SSL и бэкапы</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;max-width:900px;">
      <div class="card">
        <h3 style="margin-bottom:1.25rem;">Telegram Bot</h3>
        <div class="field">
          <label>Bot Token</label>
          <input v-model="tgBotToken" placeholder="123456:ABC-..." />
        </div>
        <div class="field">
          <label>Admin Chat ID</label>
          <input v-model="tgAdminId" placeholder="123456789" />
        </div>
        <hr style="border:none;border-top:1px solid var(--border-color);margin:1.25rem 0;" />
        <h3 style="margin-bottom:1.25rem;">SSL / Certbot</h3>
        <div class="field">
          <label>Email для сертификатов</label>
          <input v-model="certbotEmail" type="email" placeholder="admin@example.com" />
        </div>
        <div style="margin-top:1.5rem;">
          <button class="btn btn-primary btn-sm" @click="save" :disabled="saving">
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Бэкапы базы данных</h3>
          <button class="btn btn-primary btn-sm" @click="createBackup" :disabled="creatingBackup">
            <i class="pi pi-download"></i>
            {{ creatingBackup ? 'Создание...' : 'Создать бэкап' }}
          </button>
        </div>
        <div v-if="backups.length === 0" class="empty-state" style="padding:2rem;">
          <i class="pi pi-database"></i>
          <p>Нет бэкапов</p>
        </div>
        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Файл</th>
                <th>Размер</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in backups" :key="b.file">
                <td style="font-family:monospace;font-size:12px;">{{ b.file }}</td>
                <td>{{ formatBytes(b.size) }}</td>
                <td>
                  <button class="btn btn-outline btn-sm" @click="deleteBackup(b.file)" style="color:#ef4444;">
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
