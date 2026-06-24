import { useToast } from 'primevue/usetoast';

export function toast() {
  const t = useToast();

  return {
    success(summary: string, detail?: string) {
      t.add({ severity: 'success', summary, detail, life: 3000 });
    },
    error(summary: string, detail?: string) {
      t.add({ severity: 'error', summary, detail, life: 5000 });
    },
    info(summary: string, detail?: string) {
      t.add({ severity: 'info', summary, detail, life: 3000 });
    },
    warn(summary: string, detail?: string) {
      t.add({ severity: 'warn', summary, detail, life: 4000 });
    },
  };
}
