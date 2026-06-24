import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '8443', 10),
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  dbPath: process.env.DB_PATH || './data/panel.db',
  tgBotToken: process.env.TG_BOT_TOKEN || '',
  certbotEmail: process.env.CERTBOT_EMAIL || '',
  domain: process.env.DOMAIN || 'localhost',
  xray: {
    port: parseInt(process.env.XRAY_PORT || '443', 10),
    uuid: process.env.XRAY_UUID || '',
    configPath: '/usr/local/etc/xray/config.json',
  },
  hysteria2: {
    port: parseInt(process.env.HY2_PORT || '8443', 10),
    password: process.env.HY2_PASSWORD || '',
    configPath: '/etc/hysteria/config.yaml',
  },
  mieru: {
    port: parseInt(process.env.MIERU_PORT || '7701', 10),
    password: process.env.MIERU_PASSWORD || '',
    configPath: '/etc/mita/config.json',
  },
  trusttunnel: {
    port: parseInt(process.env.TRUST_PORT || '443', 10),
  },
} as const;
