# Polymarket Telegram Bot

A Telegram bot for monitoring and controlling your Polymarket trading bot.

## Features

- **Dashboard** — status, market data, positions, trades, and P&L at a glance
- **Bot Control** — start/stop the trading bot remotely
- **Notifications** — automatic alerts on new trades and bot status changes
- **Interactive UI** — inline keyboard buttons with auto-refresh

## Commands

| Command | Description |
|---------|-------------|
| `/dashboard` | Full overview with status, market, positions, trades, P&L |
| `/positions` | View all open positions |
| `/history` | View closed orders with win rate & P&L stats |
| `/market` | View BTC price and YES/NO token prices |
| `/trades` | View recent trades with edge & probability |
| `/status` | Check bot running status |
| `/bot` | Start/Stop the trading bot |
| `/notify` | Enable/Disable trade notifications |

## Setup

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather) and copy the token
2. Copy `.env.example` to `.env` and add your bot token
3. Install, build, and run:

```bash
npm install
npm run build
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | *required* | Telegram bot token from @BotFather |
| `POLYMARKET_API_URL` | `http://localhost:3000` | Polymarket bot API base URL |
| `UPDATE_INTERVAL_MS` | `30000` | Auto-update poll interval (ms) |
| `ALERT_COOLDOWN_MS` | `300000` | Cooldown between bot-down alerts (ms) |
| `LOG_DIR` | `logs` | Directory for log files |
| `LOG_LEVEL` | `info` | Winston log level |

## Architecture

```
src/
├── api/
│   └── polymarket.ts       # API client
├── handlers/
│   ├── commands.ts         # Slash command handlers
│   └── callbacks.ts        # Inline button callback handlers
├── services/
│   ├── keyboard.ts         # Inline keyboard builders
│   └── logger.ts           # Winston logger & chat interaction logging
├── utils/
│   └── formatters.ts       # Message formatting
├── bot.ts                  # Bot orchestrator (start/stop/auto-updates)
├── config.ts               # Environment config with validation
├── index.ts                # Entry point
└── types.ts                # Shared TypeScript types
```

## API Endpoints

The bot connects to your Polymarket trading bot via these REST endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /api/dashboard` | Full dashboard data |
| `GET /api/status` | Bot status |
| `GET /api/market` | Market prices |
| `GET /api/trades` | Recent trades |
| `GET /api/positions` | Open positions |
| `GET /api/closed_orders` | Order history |
| `POST /api/bot/start` | Start the bot |
| `POST /api/bot/stop` | Stop the bot |

## Logging

Chat interactions are logged to `logs/bot.log` using Winston with automatic rotation (5 MB max, 5 files). Console output is limited to warnings and errors only.

## Requirements

- Node.js 16+
- Polymarket trading bot running on port 3000
- Telegram bot token

## License

MIT