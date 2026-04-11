import { Bot, session } from 'grammy';
import { BotContext, SessionData } from './types';
import { PolymarketAPI, Trade } from './api/polymarket';
import { logger } from './services/logger';
import { registerCommandHandlers } from './handlers/commands';
import { registerCallbackHandlers } from './handlers/callbacks';
import { config } from './config';

const BOT_COMMANDS = [
  { command: 'dashboard', description: 'Full overview' },
  { command: 'positions', description: 'Open positions' },
  { command: 'history', description: 'Closed orders' },
  { command: 'market', description: 'Market data' },
  { command: 'trades', description: 'Recent trades' },
  { command: 'status', description: 'Bot status' },
  { command: 'bot', description: 'Start/Stop bot' },
  { command: 'notify', description: 'Enable/Disable notifications' },
] as const;

interface AlertState {
  botStopped: boolean;
  lastAlertTime: number;
}

export class TelegramBot {
  private bot: Bot<BotContext>;
  private api: PolymarketAPI;
  private updateInterval: NodeJS.Timeout | null = null;
  private alertState: AlertState = { botStopped: false, lastAlertTime: 0 };

  constructor(token: string, apiBaseUrl: string) {
    this.bot = new Bot<BotContext>(token);
    this.api = new PolymarketAPI(apiBaseUrl);

    this.bot.use(session({ initial: (): SessionData => ({}) }));
    this.bot.catch((err) => logger.error('Bot error:', err));

    registerCommandHandlers(this.bot, this.api);
    registerCallbackHandlers(this.bot, this.api);
  }

  async start(): Promise<void> {
    logger.info('Starting Telegram bot...');
    await this.bot.api.setMyCommands([...BOT_COMMANDS]);
    logger.info('Command menu registered with Telegram');
    logger.info('Bot is live');
    await this.bot.start();
  }

  async stop(): Promise<void> {
    this.stopAutoUpdates();
    await this.bot.stop();
    logger.info('Telegram bot stopped.');
  }

  startAutoUpdates(chatId: number): void {
    this.stopAutoUpdates();
    this.alertState = { botStopped: false, lastAlertTime: 0 };
    let lastTradeCount = 0;

    this.updateInterval = setInterval(async () => {
      try {
        const data = await this.api.getDashboard();
        await this.notifyNewTrades(chatId, data.trades, lastTradeCount);
        lastTradeCount = data.trades.length;
        await this.checkBotStatus(chatId, data.status.bot_running);
      } catch (error) {
        logger.error('Auto-update error:', error);
      }
    }, config.updateIntervalMs);
  }

  stopAutoUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private async notifyNewTrades(chatId: number, trades: Trade[], lastCount: number): Promise<void> {
    if (trades.length <= lastCount || lastCount === 0) return;

    const newTrades = trades.slice(0, trades.length - lastCount).reverse();
    for (const trade of newTrades) {
      const message = `🚀 *New Trade Executed!*\n\n${trade.side.toUpperCase()} ${trade.market_title}\n@ ${(trade.price * 100).toFixed(1)}% | Edge: ${trade.edge?.toFixed(3) ?? 'N/A'}`;
      await this.bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
  }

  private async checkBotStatus(chatId: number, isRunning: boolean): Promise<void> {
    const now = Date.now();
    const canAlert = now - this.alertState.lastAlertTime > config.alertCooldownMs;

    if (!isRunning && !this.alertState.botStopped && canAlert) {
      await this.bot.api.sendMessage(chatId, '⚠️ *Alert:* Trading bot has stopped!', { parse_mode: 'Markdown' });
      this.alertState = { botStopped: true, lastAlertTime: now };
    } else if (isRunning && this.alertState.botStopped) {
      await this.bot.api.sendMessage(chatId, '✅ *Update:* Trading bot is running again!', { parse_mode: 'Markdown' });
      this.alertState = { ...this.alertState, botStopped: false };
    }
  }
}