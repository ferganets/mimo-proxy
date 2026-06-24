import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '8443', 10),
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  dbPath: process.env.DB_PATH || './data/panel.db',
  tgBotToken: process.env.TG_BOT_TOKEN || '',
  certbotEmail: process.env.CERTBOT_EMAIL || '',
} as const;
