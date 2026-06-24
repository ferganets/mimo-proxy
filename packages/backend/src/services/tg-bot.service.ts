import { Telegraf } from 'telegraf';
import { config } from '../config.js';

let bot: Telegraf | null = null;

export function initBot() {
  if (!config.tgBotToken) {
    console.log('[TG Bot] No token provided, bot disabled');
    return;
  }

  bot = new Telegraf(config.tgBotToken);

  bot.command('start', (ctx) => {
    ctx.reply('Mimo Proxy Panel Bot');
  });

  bot.command('stats', async (ctx) => {
    const { getSystemStats } = await import('./stats-collector.js');
    const stats = getSystemStats();
    ctx.reply(
      `Users: ${stats.users}\nOnline: ${stats.online}\nTraffic: ${formatBytes(stats.totalTraffic)}\nUptime: ${formatUptime(stats.uptime)}`
    );
  });

  bot.launch();
  console.log('[TG Bot] Started');
}

export async function notifyAdmin(message: string) {
  if (!bot) return;

  const { getDb } = await import('../db/index.js');
  const db = getDb();
  const setting = db.prepare("SELECT value FROM settings WHERE key = 'tg_admin_id'").get() as any;

  if (setting?.value) {
    await bot.telegram.sendMessage(parseInt(setting.value), message);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export function stopBot() {
  if (bot) {
    bot.stop();
  }
}
