import { TelegramBot } from './bot';
import { config } from './config';
import { logger } from './services/logger';

const bot = new TelegramBot(config.telegramBotToken, config.polymarketApiUrl);

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down...`);
  await bot.stop();
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

bot.start().catch((error) => {
  logger.error('Failed to start bot:', error);
  process.exit(1);
});