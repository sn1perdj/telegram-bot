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


interface CallbackConfig {
  fetch: (api: PolymarketAPI) => Promise<unknown>;
  format: (data: unknown) => string;
  keyboard: () => ReturnType<typeof detailKeyboard>;
  successMessage: string;
  errorMessage: string;
}

const CALLBACKS: Record<string, CallbackConfig> = {
  dashboard: {
    fetch: (api) => api.getDashboard(),
    format: (data) => formatDashboard(data as Parameters<typeof formatDashboard>[0]),
    keyboard: () => dashboardKeyboard(),
    successMessage: 'Dashboard updated!',
    errorMessage: 'Error fetching dashboard',
  },
  market: {
    fetch: (api) => api.getMarket(),
    format: (data) => formatMarket(data as Parameters<typeof formatMarket>[0]),
    keyboard: () => detailKeyboard('market'),
    successMessage: 'Market data updated!',
    errorMessage: 'Error fetching market data',
  },
  trades: {
    fetch: (api) => api.getTrades(),
    format: (data) => formatTrades((data as { trades: Parameters<typeof formatTrades>[0] }).trades),
    keyboard: () => detailKeyboard('trades'),
    successMessage: 'Trades updated!',
    errorMessage: 'Error fetching trades',
  },
  positions: {
    fetch: (api) => api.getPositions(),
    format: (data) => formatPositions((data as { positions: Parameters<typeof formatPositions>[0] }).positions),
    keyboard: () => detailKeyboard('positions'),
    successMessage: 'Positions updated!',
    errorMessage: 'Error fetching positions',
  },
  history: {
    fetch: (api) => api.getClosedOrders(),
    format: (data) => formatClosedOrders((data as { closed_orders: Parameters<typeof formatClosedOrders>[0] }).closed_orders),
    keyboard: () => detailKeyboard('history'),
    successMessage: 'History updated!',
    errorMessage: 'Error fetching history',
  },
  status: {
    fetch: (api) => api.getStatus(),
    format: (data) => formatStatus(data as Parameters<typeof formatStatus>[0]),
    keyboard: () => detailKeyboard('status'),
    successMessage: 'Status updated!',
    errorMessage: 'Error fetching status',
  },
};

async function executeCallback(
  ctx: BotContext,
  api: PolymarketAPI,
  action: string,
): Promise<void> {
  const config = CALLBACKS[action];
  if (!config) return;

  try {
    const data = await config.fetch(api);
    const text = config.format(data);

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: config.keyboard(),
    });
    await ctx.answerCallbackQuery(config.successMessage);

    logChatInteraction(
      ctx.from?.id ?? 0,
      ctx.chat?.id ?? 0,
      ctx.callbackQuery?.data ?? action,
      'callback',
      ctx.from?.username,
      ctx.from?.first_name,
    );
  } catch {
    await ctx.answerCallbackQuery(config.errorMessage);
  }
}

export function registerCallbackHandlers(bot: Bot<BotContext>, api: PolymarketAPI): void {
  for (const action of Object.keys(CALLBACKS)) {
    bot.callbackQuery(action, async (ctx) => {
      await executeCallback(ctx, api, action);
    });
  }

  bot.callbackQuery('bot', async (ctx) => {
    try {
      const status = await api.getStatus();
      const isRunning = status.bot_running;
      const text = `Bot Status: ${isRunning ? '✅ Running' : '⛔ Stopped'}\n\nClick below to ${isRunning ? 'stop' : 'start'} the bot:`;

      await ctx.editMessageText(text, { reply_markup: botControlKeyboard(isRunning) });
      await ctx.answerCallbackQuery('Bot status loaded');

      logChatInteraction(ctx.from?.id ?? 0, ctx.chat?.id ?? 0, 'bot', 'callback', ctx.from?.username, ctx.from?.first_name);
    } catch {
      await ctx.answerCallbackQuery('Error fetching bot status');
    }
  });

  bot.callbackQuery('start_bot', async (ctx) => {
    try {
      const result = await api.startBot();
      if (result.running) {
        await ctx.answerCallbackQuery('✅ Bot started!');
        await ctx.reply('✅ Trading bot has been started successfully!');
        logChatInteraction(ctx.from?.id ?? 0, ctx.chat?.id ?? 0, 'start_bot', 'callback', ctx.from?.username, ctx.from?.first_name);
      } else {
        await ctx.answerCallbackQuery('⚠️ Failed to start');
      }
    } catch {
      await ctx.answerCallbackQuery('❌ Error starting bot');
    }
  });

  bot.callbackQuery('stop_bot', async (ctx) => {
    try {
      const result = await api.stopBot();
      if (!result.running) {
        await ctx.answerCallbackQuery('✅ Bot stopped!');
        await ctx.reply('✅ Trading bot has been stopped successfully!');
        logChatInteraction(ctx.from?.id ?? 0, ctx.chat?.id ?? 0, 'stop_bot', 'callback', ctx.from?.username, ctx.from?.first_name);
      } else {
        await ctx.answerCallbackQuery('⚠️ Failed to stop');
      }
    } catch {
      await ctx.answerCallbackQuery('❌ Error stopping bot');
    }
  });

  bot.callbackQuery('notify', async (ctx) => {
    const isEnabled = ctx.session.notificationsEnabled ?? false;
    const text = `Notifications: ${isEnabled ? '🔔 Enabled' : '🔕 Disabled'}\n\nClick below to ${isEnabled ? 'disable' : 'enable'} notifications:`;

    await ctx.editMessageText(text, { reply_markup: notifyKeyboard(isEnabled) });
    await ctx.answerCallbackQuery('Notification settings loaded');

    logChatInteraction(ctx.from?.id ?? 0, ctx.chat?.id ?? 0, 'notify', 'callback', ctx.from?.username, ctx.from?.first_name);
  });

  bot.callbackQuery('enable_updates', async (ctx) => {
    ctx.session.chatId = ctx.chat?.id;
    ctx.session.notificationsEnabled = true;
    await ctx.answerCallbackQuery('🔔 Auto-updates enabled!');
    await ctx.reply('🔔 You will now receive periodic updates about trades and important events.');

    logChatInteraction(ctx.from?.id ?? 0, ctx.chat?.id ?? 0, 'enable_updates', 'callback', ctx.from?.username, ctx.from?.first_name);
  });

  bot.callbackQuery('disable_updates', async (ctx) => {
    ctx.session.notificationsEnabled = false;
    await ctx.answerCallbackQuery('🔕 Auto-updates disabled!');
    await ctx.reply('🔕 Auto-updates have been disabled.');

    logChatInteraction(ctx.from?.id ?? 0, ctx.chat?.id ?? 0, 'disable_updates', 'callback', ctx.from?.username, ctx.from?.first_name);
  });
}