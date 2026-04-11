import * as dotenv from 'dotenv';

dotenv.config();

interface Config {
  telegramBotToken: string;
  polymarketApiUrl: string;
  updateIntervalMs: number;
  alertCooldownMs: number;
  logDir: string;
}

function loadConfig(): Config {
  const telegramBotToken = process.env['TELEGRAM_BOT_TOKEN'];
  if (!telegramBotToken) {
    console.error('Missing required environment variable: TELEGRAM_BOT_TOKEN');
    process.exit(1);
  }

  return {
    telegramBotToken,
    polymarketApiUrl: process.env['POLYMARKET_API_URL'] || 'http://localhost:3000',
    updateIntervalMs: parseInt(process.env['UPDATE_INTERVAL_MS'] || '30000', 10),
    alertCooldownMs: parseInt(process.env['ALERT_COOLDOWN_MS'] || '300000', 10),
    logDir: process.env['LOG_DIR'] || 'logs',
  };
}

export const config = loadConfig();