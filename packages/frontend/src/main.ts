import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import App from './App.vue';
import router from './router';
import 'primeicons/primeicons.css';
import './style.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(PrimeVue as any, { theme: { preset: Aura, options: { darkModeSelector: '.dark-mode' } } });
app.use(ToastService as any);
app.use(ConfirmationService as any);
app.mount('#app');
