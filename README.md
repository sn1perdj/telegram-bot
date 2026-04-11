# Polymarket Telegram Bot

A Telegram bot for monitoring and controlling your Polymarket trading bot.

## Features

📊 **Real-time Monitoring**
- Dashboard with all key metrics
- Live market data (BTC prices, YES/NO tokens)
- Recent trades and activity
- Open positions tracking
- Closed orders with P&L statistics

🤖 **Bot Control**
- Start/stop the trading bot remotely
- Real-time notifications on new trades
- Alert when bot stops unexpectedly

📱 **Interactive Interface**
- Command-based interface
- Inline keyboard buttons for quick access
- Auto-refresh functionality

## Setup

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` command
3. Follow instructions and copy your bot token

### 2. Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your bot token:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   POLYMARKET_API_URL=http://localhost:3000
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Build

```bash
npm run build
```

### 5. Run

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Commands

- `/start` - Welcome message with buttons
- `/help` - Show available commands
- `/dashboard` - Full dashboard overview
- `/status` - Bot running status
- `/market` - Current market data
- `/trades` - Recent trades
- `/positions` - Open positions
- `/history` - Closed orders history
- `/logs` - Recent bot logs
- `/startbot` - Start the trading bot
- `/stopbot` - Stop the trading bot
- `/notify` - Enable/disable real-time notifications

## How It Works

The Telegram bot connects to your Polymarket trading bot via its REST API (default port 3000). It fetches data from endpoints like:

- `/api/dashboard` - Full dashboard data
- `/api/status` - Bot status
- `/api/market` - Market prices
- `/api/trades` - Recent trades
- `/api/positions` - Open positions
- `/api/closed_orders` - Order history
- `/api/bot/start` & `/api/bot/stop` - Control bot

## Requirements

- Node.js 16+
- Your Polymarket bot running on port 3000
- Telegram bot token

## Project Structure

```
telegram_bot/
├── src/
│   ├── api/
│   │   └── polymarket.ts    # API client for Polymarket bot
│   ├── utils/
│   │   └── formatters.ts    # Message formatting utilities
│   ├── bot.ts              # Main bot logic
│   └── index.ts            # Entry point
├── dist/                    # Compiled JavaScript
├── package.json
├── tsconfig.json
└── .env
```

## License

MIT
