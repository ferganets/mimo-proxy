<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/client';
import { toast } from '@/composables/useToast';

const t = toast();
const users = ref<any[]>([]);
const showModal = ref(false);
const showQRModal = ref(false);
const qrImage = ref('');
const editing = ref<any>(null);
const form = ref({ username: '', password: '', quota_bytes: 0, expires_at: '', protocols: [] as string[] });

const protocolOptions = [
  { label: 'Xray', value: 'xray' },
  { label: 'Hysteria2', value: 'hysteria2' },
  { label: 'Mieru', value: 'mieru' },
  { label: 'TrustTunnel', value: 'trusttunnel' },
  { label: 'Mihomo', value: 'mihomo' },
];

async function load() {
  users.value = await api.users.list();
}

function openCreate() {
  editing.value = null;
  form.value = { username: '', password: '', quota_bytes: 0, expires_at: '', protocols: [] };
  showModal.value = true;
}

function openEdit(user: any) {
  editing.value = user;
  form.value = {
    username: user.username,
    password: '',
    quota_bytes: user.quota_bytes,
    expires_at: user.expires_at || '',
    protocols: JSON.parse(user.protocols || '[]'),
  };
  showModal.value = true;
}

async function save() {
  try {
    if (editing.value) {
      const data: any = { ...form.value };
      if (!data.password) delete data.password;
      await api.users.update(editing.value.id, data);
      t.success('Пользователь обновлён');
    } else {
      await api.users.create(form.value);
      t.success('Пользователь создан');
    }
    showModal.value = false;
    load();
  } catch (e: any) {
    t.error('Ошибка', e.message);
  }
}

async function remove(id: number) {
  if (confirm('Удалить пользователя?')) {
    try {
      await api.users.delete(id);
      t.success('Пользователь удалён');
      load();
    } catch (e: any) {
      t.error('Ошибка', e.message);
    }
  }
}

async function openQR(id: number) {
  const res = await api.users.qr(id);
  qrImage.value = res.qr;
  showQRModal.value = true;
}

function formatBytes(b: number): string {
  if (!b) return '0 B';
  const k = 1024;
  const s = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + s[i];
}

onMounted(load);
</script>

<template>
  <div>
    <div class="page-header">
      <h2>Пользователи</h2>
      <p>Управление учётными записями</p>
    </div>
    <div class="card">
      <div class="card-header">
        <h3>Список пользователей</h3>
        <button class="btn btn-primary btn-sm" @click="openCreate">
          <i class="pi pi-plus"></i> Добавить
        </button>
      </div>
      <div v-if="users.length === 0" class="empty-state">
        <i class="pi pi-users"></i>
        <p>Нет пользователей</p>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Трафик</th>
              <th>Лимит</th>
              <th>Истекает</th>
              <th>Протоколы</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td style="font-weight:600;">{{ u.username }}</td>
              <td>{{ formatBytes(u.used_bytes) }}</td>
              <td>{{ u.quota_bytes ? formatBytes(u.quota_bytes) : '∞' }}</td>
              <td>{{ u.expires_at || '∞' }}</td>
              <td>
                <span v-for="p in JSON.parse(u.protocols || '[]')" :key="p" class="badge badge-blue" style="margin-right:4px;">{{ p }}</span>
              </td>
              <td>
                <span :class="u.enabled ? 'badge badge-green' : 'badge badge-red'">
                  {{ u.enabled ? 'Активен' : 'Заблокирован' }}
                </span>
              </td>
              <td>
                <div class="toolbar">
                  <button class="btn btn-outline btn-sm" @click="openQR(u.id)" title="QR"><i class="pi pi-qrcode"></i></button>
                  <button class="btn btn-outline btn-sm" @click="openEdit(u)" title="Редактировать"><i class="pi pi-pencil"></i></button>
                  <button class="btn btn-outline btn-sm" @click="remove(u.id)" title="Удалить"><i class="pi pi-trash" style="color:#ef4444;"></i></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ editing ? 'Редактировать' : 'Новый пользователь' }}</h3>
        <div class="field">
          <label>Имя пользователя</label>
          <input v-model="form.username" :disabled="!!editing" />
        </div>
        <div class="field">
          <label>{{ editing ? 'Новый пароль (оставьте пустым)' : 'Пароль' }}</label>
          <input v-model="form.password" type="password" />
        </div>
        <div class="field">
          <label>Лимит трафика (байт, 0 = без лимита)</label>
          <input v-model.number="form.quota_bytes" type="number" />
        </div>
        <div class="field">
          <label>Истекает (YYYY-MM-DD, пусто = бессрочно)</label>
          <input v-model="form.expires_at" type="date" />
        </div>
        <div class="field">
          <label>Протоколы</label>
          <div v-for="opt in protocolOptions" :key="opt.value" style="display:flex;align-items:center;gap:0.5rem;margin-top:0.375rem;">
            <input type="checkbox" :value="opt.value" v-model="form.protocols" :id="'proto-'+opt.value" />
            <label :for="'proto-'+opt.value" style="font-size:0.85rem;">{{ opt.label }}</label>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline btn-sm" @click="showModal = false">Отмена</button>
          <button class="btn btn-primary btn-sm" @click="save">Сохранить</button>
        </div>
      </div>
    </div>

    <div v-if="showQRModal" class="modal-overlay" @click.self="showQRModal = false">
      <div class="modal qr-modal">
        <h3>QR-код для подключения</h3>
        <img :src="qrImage" alt="QR Code" />
        <div class="modal-actions" style="justify-content:center;">
          <button class="btn btn-outline btn-sm" @click="showQRModal = false">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>
