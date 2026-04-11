import { Bot, Context, InlineKeyboard, session, SessionFlavor } from 'grammy';
import { PolymarketAPI } from './api/polymarket';
import {
  formatStatus,
  formatMarket,
  formatTrades,
  formatPositions,
  formatClosedOrders,
  formatDashboard,
} from './utils/formatters';
import { ChatLogger } from './utils/chat_logger';

// Session interface
interface SessionData {
  lastMessageId?: number;
  chatId?: number;
  notificationsEnabled?: boolean;
}

type BotContext = Context & SessionFlavor<SessionData>;

export class TelegramBot {
  private bot: Bot<BotContext>;
  private api: PolymarketAPI;
  private updateInterval: NodeJS.Timeout | null = null;
  private chatLogger: ChatLogger;
  private alertState = {
    botStopped: false,
    lastAlertTime: 0
  };

  constructor(token: string, apiBaseUrl: string = 'http://localhost:3000') {
    this.bot = new Bot<BotContext>(token);
    this.api = new PolymarketAPI(apiBaseUrl);
    this.chatLogger = new ChatLogger();
    this.setupMiddleware();
    this.setupCommands();
    this.setupCallbacks();
  }

  private setupMiddleware() {
    this.bot.use(session({ initial: () => ({}) }));

    // Error handler
    this.bot.catch((err) => {
      console.error('Bot error:', err);
    });
  }

  // Helper to log command with response
  private async logAndReply(
    ctx: BotContext,
    responseText: string,
    options?: { parse_mode?: 'Markdown' | 'HTML'; reply_markup?: InlineKeyboard }
  ): Promise<void> {
    const received = ctx.message?.text || ctx.callbackQuery?.data || 'unknown';
    const type = ctx.callbackQuery ? 'callback' : 'command';
    
    await ctx.reply(responseText, options);
    
    this.chatLogger.logConversation(
      ctx.from?.id || 0,
      ctx.chat?.id || 0,
      received,
      responseText,
      type,
      ctx.from?.username,
      ctx.from?.first_name
    );
  }

  private setupCommands() {
    // Start command
    this.bot.command('start', async (ctx) => {
      const welcomeMessage = `\ud83d\ude80 *Polymarket Trading Bot Monitor*

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

      const keyboard = new InlineKeyboard()
        .text('📊 Dashboard', 'dashboard')
        .text('💰 Positions', 'positions')
        .row()
        .text('📉 History', 'history')
        .text('📈 Market', 'market')
        .row()
        .text('💸 Trades', 'trades')
        .text('📋 Status', 'status')
        .row()
        .text('🤖 Bot Control', 'bot')
        .text('🔔 Notify', 'notify');

      await this.logAndReply(ctx, welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    });

    // Dashboard command
    this.bot.command('dashboard', async (ctx) => {
      try {
        const data = await this.api.getDashboard();
        const keyboard = new InlineKeyboard()
          .text('🔄 Refresh', 'dashboard')
          .text('💰 Positions', 'positions')
          .row()
          .text('📉 History', 'history')
          .text('📈 Market', 'market');
        
        await this.logAndReply(ctx, formatDashboard(data), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (error) {
        await this.logAndReply(ctx, '\u274C Error fetching dashboard. Is the Polymarket bot running on port 3000?');
      }
    });

    // Positions command
    this.bot.command('positions', async (ctx) => {
      try {
        const positionsData = await this.api.getPositions();
        const keyboard = new InlineKeyboard()
          .text('🔄 Refresh', 'positions')
          .text('📊 Dashboard', 'dashboard');
        
        await this.logAndReply(ctx, formatPositions(positionsData.positions), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (error) {
        await this.logAndReply(ctx, '\u274C Error fetching positions.');
      }
    });

    // History command
    this.bot.command('history', async (ctx) => {
      try {
        const ordersData = await this.api.getClosedOrders();
        const keyboard = new InlineKeyboard()
          .text('🔄 Refresh', 'history')
          .text('📊 Dashboard', 'dashboard');
        
        await this.logAndReply(ctx, formatClosedOrders(ordersData.closed_orders), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (error) {
        await this.logAndReply(ctx, '\u274C Error fetching closed orders.');
      }
    });

    // Market command
    this.bot.command('market', async (ctx) => {
      try {
        const market = await this.api.getMarket();
        const keyboard = new InlineKeyboard()
          .text('🔄 Refresh', 'market')
          .text('📊 Dashboard', 'dashboard');
        
        await this.logAndReply(ctx, formatMarket(market), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (error) {
        await this.logAndReply(ctx, '\u274C Error fetching market data.');
      }
    });

    // Trades command
    this.bot.command('trades', async (ctx) => {
      try {
        const tradesData = await this.api.getTrades();
        const keyboard = new InlineKeyboard()
          .text('🔄 Refresh', 'trades')
          .text('📊 Dashboard', 'dashboard');
        
        await this.logAndReply(ctx, formatTrades(tradesData.trades), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (error) {
        await this.logAndReply(ctx, '\u274C Error fetching trades.');
      }
    });

    // Status command
    this.bot.command('status', async (ctx) => {
      try {
        const status = await this.api.getStatus();
        const keyboard = new InlineKeyboard()
          .text('🔄 Refresh', 'status')
          .text('📊 Dashboard', 'dashboard');
        
        await this.logAndReply(ctx, formatStatus(status), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (error) {
        await this.logAndReply(ctx, '\u274C Error fetching status. Is the Polymarket bot running?');
      }
    });

    // Bot command - Start/Stop combined
    this.bot.command('bot', async (ctx) => {
      try {
        const status = await this.api.getStatus();
        const keyboard = new InlineKeyboard()
          .text(status.bot_running ? '⛔ Stop Bot' : '▶️ Start Bot', status.bot_running ? 'stop_bot' : 'start_bot')
          .row()
          .text('📊 Dashboard', 'dashboard');
        
        await this.logAndReply(
          ctx,
          `Bot Status: ${status.bot_running ? '✅ Running' : '⛔ Stopped'}\n\nClick below to ${status.bot_running ? 'stop' : 'start'} the bot:`,
          { reply_markup: keyboard }
        );
      } catch (error) {
        await this.logAndReply(ctx, '\u274C Error fetching bot status.');
      }
    });

    // Notify command - Enable/Disable combined
    this.bot.command('notify', async (ctx) => {
      const isEnabled = ctx.session.notificationsEnabled;
      const keyboard = new InlineKeyboard()
        .text(isEnabled ? '🔕 Disable' : '🔔 Enable', isEnabled ? 'disable_updates' : 'enable_updates')
        .row()
        .text('📊 Dashboard', 'dashboard');
      
      await this.logAndReply(
        ctx,
        `Notifications: ${isEnabled ? '🔔 Enabled' : '🔕 Disabled'}\n\nClick below to ${isEnabled ? 'disable' : 'enable'} notifications:`,
        { reply_markup: keyboard }
      );
    });
  }

  private setupCallbacks() {
    // Dashboard callback
    this.bot.callbackQuery('dashboard', async (ctx) => {
      try {
        const data = await this.api.getDashboard();
        const keyboard = new InlineKeyboard()
          .text('🔄 Refresh', 'dashboard')
          .text('💰 Positions', 'positions')
          .row()
          .text('📉 History', 'history')
          .text('📈 Market', 'market');
        
        await ctx.editMessageText(formatDashboard(data), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        await ctx.answerCallbackQuery('Dashboard updated!');
        
        this.chatLogger.logConversation(
          ctx.from?.id || 0,
          ctx.chat?.id || 0,
          ctx.callbackQuery.data,
          formatDashboard(data),
          'callback',
          ctx.from?.username,
          ctx.from?.first_name
        );
      } catch (error) {
        await ctx.answerCallbackQuery('Error fetching dashboard');
      }
    });

    // Market callback
    this.bot.callbackQuery('market', async (ctx) => {
      try {
        const market = await this.api.getMarket();
        const keyboard = new InlineKeyboard()
          .text('🔄 Refresh', 'market')
          .text('📊 Dashboard', 'dashboard');
        
        await ctx.editMessageText(formatMarket(market), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        await ctx.answerCallbackQuery('Market data updated!');
        
        this.chatLogger.logConversation(
          ctx.from?.id || 0,
          ctx.chat?.id || 0,
          ctx.callbackQuery.data,
          formatMarket(market),
          'callback',
          ctx.from?.username,
          ctx.from?.first_name
        );
      } catch (error) {
        await ctx.answerCallbackQuery('Error fetching market data');
      }
    });

    // Trades callback
    this.bot.callbackQuery('trades', async (ctx) => {
      try {
        const tradesData = await this.api.getTrades();
        const keyboard = new InlineKeyboard()
          .text('🔄 Refresh', 'trades')
          .text('📊 Dashboard', 'dashboard');
        
        await ctx.editMessageText(formatTrades(tradesData.trades), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        await ctx.answerCallbackQuery('Trades updated!');
        
        this.chatLogger.logConversation(
          ctx.from?.id || 0,
          ctx.chat?.id || 0,
          ctx.callbackQuery.data,
          formatTrades(tradesData.trades),
          'callback',
          ctx.from?.username,
          ctx.from?.first_name
        );
      } catch (error) {
        await ctx.answerCallbackQuery('Error fetching trades');
      }
    });

    // Positions callback
    this.bot.callbackQuery('positions', async (ctx) => {
      try {
        const positionsData = await this.api.getPositions();
        const keyboard = new InlineKeyboard()
          .text('🔄 Refresh', 'positions')
          .text('📊 Dashboard', 'dashboard');
        
        await ctx.editMessageText(formatPositions(positionsData.positions), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        await ctx.answerCallbackQuery('Positions updated!');
        
        this.chatLogger.logConversation(
          ctx.from?.id || 0,
          ctx.chat?.id || 0,
          ctx.callbackQuery.data,
          formatPositions(positionsData.positions),
          'callback',
          ctx.from?.username,
          ctx.from?.first_name
        );
      } catch (error) {
        await ctx.answerCallbackQuery('Error fetching positions');
      }
    });

    // History callback
    this.bot.callbackQuery('history', async (ctx) => {
      try {
        const ordersData = await this.api.getClosedOrders();
        const keyboard = new InlineKeyboard()
          .text('🔄 Refresh', 'history')
          .text('📊 Dashboard', 'dashboard');
        
        await ctx.editMessageText(formatClosedOrders(ordersData.closed_orders), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        await ctx.answerCallbackQuery('History updated!');
        
        this.chatLogger.logConversation(
          ctx.from?.id || 0,
          ctx.chat?.id || 0,
          ctx.callbackQuery.data,
          formatClosedOrders(ordersData.closed_orders),
          'callback',
          ctx.from?.username,
          ctx.from?.first_name
        );
      } catch (error) {
        await ctx.answerCallbackQuery('Error fetching history');
      }
    });

    // Status callback
    this.bot.callbackQuery('status', async (ctx) => {
      try {
        const status = await this.api.getStatus();
        const keyboard = new InlineKeyboard()
          .text('🔄 Refresh', 'status')
          .text('📊 Dashboard', 'dashboard');
        
        await ctx.editMessageText(formatStatus(status), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        await ctx.answerCallbackQuery('Status updated!');
        
        this.chatLogger.logConversation(
          ctx.from?.id || 0,
          ctx.chat?.id || 0,
          ctx.callbackQuery.data,
          formatStatus(status),
          'callback',
          ctx.from?.username,
          ctx.from?.first_name
        );
      } catch (error) {
        await ctx.answerCallbackQuery('Error fetching status');
      }
    });

    // Bot control callback
    this.bot.callbackQuery('bot', async (ctx) => {
      try {
        const status = await this.api.getStatus();
        const keyboard = new InlineKeyboard()
          .text(status.bot_running ? '⛔ Stop Bot' : '▶️ Start Bot', status.bot_running ? 'stop_bot' : 'start_bot')
          .row()
          .text('📊 Dashboard', 'dashboard');
        
        await ctx.editMessageText(
          `Bot Status: ${status.bot_running ? '✅ Running' : '⛔ Stopped'}\n\nClick below to ${status.bot_running ? 'stop' : 'start'} the bot:`,
          { reply_markup: keyboard }
        );
        await ctx.answerCallbackQuery('Bot status loaded');
        
        this.chatLogger.logConversation(
          ctx.from?.id || 0,
          ctx.chat?.id || 0,
          ctx.callbackQuery.data,
          `Bot Status: ${status.bot_running ? 'Running' : 'Stopped'}`,
          'callback',
          ctx.from?.username,
          ctx.from?.first_name
        );
      } catch (error) {
        await ctx.answerCallbackQuery('Error fetching bot status');
      }
    });

    // Start bot callback
    this.bot.callbackQuery('start_bot', async (ctx) => {
      try {
        const result = await this.api.startBot();
        if (result.running) {
          await ctx.answerCallbackQuery('✅ Bot started!');
          await ctx.reply('✅ Trading bot has been started successfully!');
          
          this.chatLogger.logConversation(
            ctx.from?.id || 0,
            ctx.chat?.id || 0,
            ctx.callbackQuery.data,
            '✅ Trading bot has been started successfully!',
            'callback',
            ctx.from?.username,
            ctx.from?.first_name
          );
        } else {
          await ctx.answerCallbackQuery('⚠️ Failed to start');
        }
      } catch (error) {
        await ctx.answerCallbackQuery('\u274C Error starting bot');
      }
    });

    // Stop bot callback
    this.bot.callbackQuery('stop_bot', async (ctx) => {
      try {
        const result = await this.api.stopBot();
        if (!result.running) {
          await ctx.answerCallbackQuery('✅ Bot stopped!');
          await ctx.reply('✅ Trading bot has been stopped successfully!');
          
          this.chatLogger.logConversation(
            ctx.from?.id || 0,
            ctx.chat?.id || 0,
            ctx.callbackQuery.data,
            '✅ Trading bot has been stopped successfully!',
            'callback',
            ctx.from?.username,
            ctx.from?.first_name
          );
        } else {
          await ctx.answerCallbackQuery('⚠️ Failed to stop');
        }
      } catch (error) {
        await ctx.answerCallbackQuery('\u274C Error stopping bot');
      }
    });

    // Notify callback
    this.bot.callbackQuery('notify', async (ctx) => {
      const isEnabled = ctx.session.notificationsEnabled;
      const keyboard = new InlineKeyboard()
        .text(isEnabled ? '🔕 Disable' : '🔔 Enable', isEnabled ? 'disable_updates' : 'enable_updates')
        .row()
        .text('📊 Dashboard', 'dashboard');
      
      await ctx.editMessageText(
        `Notifications: ${isEnabled ? '🔔 Enabled' : '🔕 Disabled'}\n\nClick below to ${isEnabled ? 'disable' : 'enable'} notifications:`,
        { reply_markup: keyboard }
      );
      await ctx.answerCallbackQuery('Notification settings loaded');
      
      this.chatLogger.logConversation(
        ctx.from?.id || 0,
        ctx.chat?.id || 0,
        ctx.callbackQuery.data,
        `Notifications: ${isEnabled ? 'Enabled' : 'Disabled'}`,
        'callback',
        ctx.from?.username,
        ctx.from?.first_name
      );
    });

    // Enable/Disable auto-updates
    this.bot.callbackQuery('enable_updates', async (ctx) => {
      ctx.session.chatId = ctx.chat?.id;
      ctx.session.notificationsEnabled = true;
      await ctx.answerCallbackQuery('🔔 Auto-updates enabled!');
      await ctx.reply('🔔 You will now receive periodic updates about trades and important events.');
      this.startAutoUpdates(ctx.chat!.id);
      
      this.chatLogger.logConversation(
        ctx.from?.id || 0,
        ctx.chat?.id || 0,
        ctx.callbackQuery.data,
        '🔔 Auto-updates enabled',
        'callback',
        ctx.from?.username,
        ctx.from?.first_name
      );
    });

    this.bot.callbackQuery('disable_updates', async (ctx) => {
      this.stopAutoUpdates();
      ctx.session.notificationsEnabled = false;
      await ctx.answerCallbackQuery('🔕 Auto-updates disabled!');
      await ctx.reply('🔕 Auto-updates have been disabled.');
      
      this.chatLogger.logConversation(
        ctx.from?.id || 0,
        ctx.chat?.id || 0,
        ctx.callbackQuery.data,
        '🔕 Auto-updates disabled',
        'callback',
        ctx.from?.username,
        ctx.from?.first_name
      );
    });
  }

  private startAutoUpdates(chatId: number) {
    this.stopAutoUpdates();
    
    let lastTradeCount = 0;
    
    this.alertState = {
      botStopped: false,
      lastAlertTime: 0
    };
    
    this.updateInterval = setInterval(async () => {
      try {
        const data = await this.api.getDashboard();
        
        if (data.trades.length > lastTradeCount && lastTradeCount > 0) {
          const newTrades = data.trades.slice(0, data.trades.length - lastTradeCount);
          for (const trade of newTrades.reverse()) {
            const message = `\uD83D\ude80 *New Trade Executed!*\n\n${trade.side.toUpperCase()} ${trade.market_title}\n@ ${(trade.price * 100).toFixed(1)}% | Edge: ${trade.edge?.toFixed(3) || 'N/A'}`;
            
            await this.bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
          }
        }
        lastTradeCount = data.trades.length;
        
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        const canAlert = now - this.alertState.lastAlertTime > fiveMinutes;
        
        if (!data.status.bot_running && !this.alertState.botStopped && canAlert) {
          const message = '\u26A0\uFE0F *Alert:* Trading bot has stopped!';
          await this.bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
          
          this.alertState.botStopped = true;
          this.alertState.lastAlertTime = now;
          
        } else if (data.status.bot_running && this.alertState.botStopped) {
          const message = '\u2705 *Update:* Trading bot is running again!';
          await this.bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
          
          this.alertState.botStopped = false;
        }
      } catch (error) {
        console.error('Auto-update error:', error);
      }
    }, 30000);
  }

  private stopAutoUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async start() {
    console.log('Starting Telegram bot...');
    
    await this.bot.api.setMyCommands([
      { command: 'dashboard', description: 'Full overview' },
      { command: 'positions', description: 'Open positions' },
      { command: 'history', description: 'Closed orders' },
      { command: 'market', description: 'Market data' },
      { command: 'trades', description: 'Recent trades' },
      { command: 'status', description: 'Bot status' },
      { command: 'bot', description: 'Start/Stop bot' },
      { command: 'notify', description: 'Enable/Disable notifications' },
    ]);
    
    console.log('Command menu registered with Telegram');
    console.log('Bot is live');
    await this.bot.start();
  }

  async stop() {
    this.stopAutoUpdates();
    await this.bot.stop();
    console.log('Telegram bot stopped.');
  }
}
