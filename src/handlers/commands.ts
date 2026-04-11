import { Bot } from 'grammy';
import { BotContext } from '../types';
import { PolymarketAPI } from '../api/polymarket';
import { logChatInteraction } from '../services/logger';
import {
  dashboardKeyboard,
  detailKeyboard,
  botControlKeyboard,
  notifyKeyboard,
} from '../services/keyboard';
import {
  formatStatus,
  formatMarket,
  formatTrades,
  formatPositions,
  formatClosedOrders,
  formatDashboard,
} from '../utils/formatters';
import { InlineKeyboard } from 'grammy';

interface CommandConfig {
  fetch: (api: PolymarketAPI) => Promise<unknown>;
  format: (data: unknown) => string;
  keyboard: (data?: unknown) => InlineKeyboard;
  errorMessage: string;
}

const COMMANDS: Record<string, CommandConfig> = {
  dashboard: {
    fetch: (api) => api.getDashboard(),
    format: (data) => formatDashboard(data as Parameters<typeof formatDashboard>[0]),
    keyboard: () => dashboardKeyboard(),
    errorMessage: '❌ Error fetching dashboard. Is the Polymarket bot running on port 3000?',
  },
  positions: {
    fetch: (api) => api.getPositions(),
    format: (data) => formatPositions((data as { positions: typeof formatPositions extends (p: infer P) => string ? P : never }).positions),
    keyboard: () => detailKeyboard('positions'),
    errorMessage: '❌ Error fetching positions.',
  },
  history: {
    fetch: (api) => api.getClosedOrders(),
    format: (data) => formatClosedOrders((data as { closed_orders: Parameters<typeof formatClosedOrders>[0] }).closed_orders),
    keyboard: () => detailKeyboard('history'),
    errorMessage: '❌ Error fetching closed orders.',
  },
  market: {
    fetch: (api) => api.getMarket(),
    format: (data) => formatMarket(data as Parameters<typeof formatMarket>[0]),
    keyboard: () => detailKeyboard('market'),
    errorMessage: '❌ Error fetching market data.',
  },
  trades: {
    fetch: (api) => api.getTrades(),
    format: (data) => formatTrades((data as { trades: Parameters<typeof formatTrades>[0] }).trades),
    keyboard: () => detailKeyboard('trades'),
    errorMessage: '❌ Error fetching trades.',
  },
  status: {
    fetch: (api) => api.getStatus(),
    format: (data) => formatStatus(data as Parameters<typeof formatStatus>[0]),
    keyboard: () => detailKeyboard('status'),
    errorMessage: '❌ Error fetching status. Is the Polymarket bot running?',
  },
};

async function executeCommand(
  ctx: BotContext,
  api: PolymarketAPI,
  command: string,
): Promise<void> {
  const config = COMMANDS[command];
  if (!config) return;

  try {
    const data = await config.fetch(api);
    const text = config.format(data);
    const keyboard = config.keyboard(data);

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

    logChatInteraction(
      ctx.from?.id ?? 0,
      ctx.chat?.id ?? 0,
      ctx.message?.text ?? command,
      'command',
      ctx.from?.username,
      ctx.from?.first_name,
    );
  } catch {
    await ctx.reply(config.errorMessage);
  }
}

export function registerCommandHandlers(bot: Bot<BotContext>, api: PolymarketAPI): void {
  bot.command('start', async (ctx) => {
    const welcomeMessage = `🚀 *Polymarket Trading Bot Monitor*

Welcome! I can help you monitor your Polymarket trading bot.

*Available Commands:*
/dashboard - Full overview
/positions - Open positions
/history - Closed orders
/market - Market data
/trades - Recent trades
/status - Bot status
/bot - Start/Stop bot
/notify - Enable/Disable notifications

Use the buttons below for quick access:`;

    await ctx.reply(welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: dashboardKeyboard(),
    });

    logChatInteraction(
      ctx.from?.id ?? 0,
      ctx.chat?.id ?? 0,
      '/start',
      'command',
      ctx.from?.username,
      ctx.from?.first_name,
    );
  });

  for (const command of Object.keys(COMMANDS)) {
    bot.command(command, async (ctx) => {
      await executeCommand(ctx, api, command);
    });
  }

  bot.command('bot', async (ctx) => {
    try {
      const status = await api.getStatus();
      const isRunning = status.bot_running;
      const text = `Bot Status: ${isRunning ? '✅ Running' : '⛔ Stopped'}\n\nClick below to ${isRunning ? 'stop' : 'start'} the bot:`;

      await ctx.reply(text, { reply_markup: botControlKeyboard(isRunning) });
      logChatInteraction(ctx.from?.id ?? 0, ctx.chat?.id ?? 0, '/bot', 'command', ctx.from?.username, ctx.from?.first_name);
    } catch {
      await ctx.reply('❌ Error fetching bot status.');
    }
  });

  bot.command('notify', async (ctx) => {
    const isEnabled = ctx.session.notificationsEnabled ?? false;
    const text = `Notifications: ${isEnabled ? '🔔 Enabled' : '🔕 Disabled'}\n\nClick below to ${isEnabled ? 'disable' : 'enable'} notifications:`;

    await ctx.reply(text, { reply_markup: notifyKeyboard(isEnabled) });
    logChatInteraction(ctx.from?.id ?? 0, ctx.chat?.id ?? 0, '/notify', 'command', ctx.from?.username, ctx.from?.first_name);
  });
}