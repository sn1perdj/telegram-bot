import {
  BotStatus,
  MarketData,
  Trade,
  Position,
  ClosedOrder,
  DashboardData,
} from '../api/polymarket';

export function formatStatus(status: BotStatus): string {
  const emoji = status.bot_running ? '✅' : '❌';
  return `${emoji} *Bot Status*

Running: ${status.bot_running ? 'Yes' : 'No'}
Mode: ${status.mode}
Session: ${new Date(status.active_session).toLocaleString()}`;
}

export function formatMarket(market: MarketData): string {
  const timeStr = market.time_remaining
    ? `${Math.floor(market.time_remaining / 3600)}h ${Math.floor((market.time_remaining % 3600) / 60)}m`
    : 'N/A';

  return `📊 *Market Data*

${market.market_title ?? 'Unknown Market'}

*BTC* Price: $${market.btc_price?.toFixed(2) ?? 'N/A'}
Price to Beat: $${market.price_to_beat?.toFixed(2) ?? 'N/A'}

*YES* Token:
Price: ${(market.yes_price * 100).toFixed(1)}c
Bid: ${(market.yes_bid * 100).toFixed(1)}c
Ask: ${(market.yes_ask * 100).toFixed(1)}c

*NO* Token:
Price: ${(market.no_price * 100).toFixed(1)}c
Bid: ${(market.no_bid * 100).toFixed(1)}c
Ask: ${(market.no_ask * 100).toFixed(1)}c

Time Remaining: ${timeStr}`;
}

export function formatTrades(trades: Trade[]): string {
  if (trades.length === 0) {
    return '💼 No recent trades';
  }

  let text = `💼 Recent Trades (${trades.length} total)\n\n`;

  trades.slice(0, 10).forEach((trade) => {
    const date = new Date(trade.timestamp * 1000).toLocaleString();
    const direction = trade.side === 'buy' ? 'Up' : 'Down';
    const boldPart = `*Bitcoin ${direction}*`;
    const restPart = trade.market_title.replace(/Bitcoin/i, '').trim();
    text += `${boldPart} ${restPart}\n`;
    text += `*Dir:* ${direction === 'Up' ? '⬆️' : '⬇️'} ${direction}\n`;
    text += `*Price:* ${(trade.price * 100).toFixed(1)}c\n`;
    text += `*Edge:* ${trade.edge?.toFixed(3) ?? 'N/A'}\n`;
    text += `*Prob:* ${(trade.probability * 100).toFixed(1)}c\n`;
    text += `*Timestamp:* ${date}\n`;
    if (trade.size_usdc) {
      text += `*Size:* $${trade.size_usdc.toFixed(2)}\n`;
    }
    text += '\n';
  });

  return text;
}

export function formatPositions(positions: Position[]): string {
  if (positions.length === 0) {
    return '💼 No open positions';
  }

  let text = `💼 Open Positions (${positions.length})\n\n`;

  positions.forEach((pos, idx) => {
    text += `${idx + 1}. *${pos.market_title}*\n`;
    text += `   Direction: ${pos.direction.toUpperCase()}\n`;
    text += `   Entry: ${(pos.price * 100).toFixed(1)}c\n`;
    text += `   Size: $${pos.size?.toFixed(2) ?? 'N/A'}\n`;
    text += `   Time: ${new Date(pos.entry_time).toLocaleString()}\n\n`;
  });

  return text;
}

export function formatClosedOrders(orders: ClosedOrder[]): string {
  if (orders.length === 0) {
    return '💼 No closed orders';
  }

  const totalPnL = orders.reduce((sum, o) => sum + o.final_pnl, 0);
  const profitable = orders.filter((o) => o.final_pnl > 0).length;
  const winRate = orders.length > 0 ? (profitable / orders.length * 100).toFixed(1) : '0.0';

  let text = `📉 Closed Orders\n\n`;
  text += `*Summary:*\n`;
  text += `*Total Trades:* ${orders.length}\n`;
  text += `*Win Rate:* ${winRate}%\n`;
  text += `*Total P&L:* $${totalPnL.toFixed(2)}\n\n`;

  text += `*Recent 10:*\n\n`;
  orders.slice(0, 10).forEach((order) => {
    const direction = order.side === 'buy' ? 'Up' : 'Down';
    const boldPart = `*Bitcoin ${direction}*`;
    const restPart = order.market_title.replace(/Bitcoin/i, '').trim();
    const date = new Date(order.timestamp * 1000).toLocaleString();

    const res = order.resolution ?? 'Pending';
    const resEmoji = res === 'YES' ? '✅' : res === 'NO' ? '❌' : '⏳';

    text += `${boldPart} ${restPart}\n`;
    text += `*Dir:* ${direction === 'Up' ? '⬆️' : '⬇️'} ${direction}\n`;
    text += `*Entry:* ${(order.buy_price * 100).toFixed(1)}c | *Exit:* ${(order.sell_price * 100).toFixed(1)}c\n`;
    text += `*P&L:* $${order.final_pnl.toFixed(2)} | *Fees:* $${order.fees.toFixed(2)}\n`;
    text += `*Res:* ${resEmoji} ${res}\n`;
    text += `*Timestamp:* ${date}\n\n`;
  });

  return text;
}

export function formatDashboard(data: DashboardData): string {
  const totalPnL = data.closed_orders.reduce((sum, o) => sum + o.final_pnl, 0);
  const profitable = data.closed_orders.filter((o) => o.final_pnl > 0).length;
  const winRate = data.closed_orders.length > 0
    ? (profitable / data.closed_orders.length * 100).toFixed(1)
    : '0.0';

  let text = `🚀 *Polymarket Bot Dashboard*\n\n`;

  text += `${data.status.bot_running ? '✅' : '❌'} *Status:* ${data.status.bot_running ? 'Running' : 'Stopped'}\n`;
  text += `*Mode:* ${data.status.mode}\n\n`;

  text += `*Market:* ${data.market.market_title ?? 'N/A'}\n`;
  text += `*BTC*: $${data.market.btc_price?.toFixed(2) ?? 'N/A'}\n`;
  text += `*YES*: ${(data.market.yes_price * 100).toFixed(1)}c | *NO*: ${(data.market.no_price * 100).toFixed(1)}c\n\n`;

  text += `*Positions:* ${data.positions.length} open\n`;
  text += `*Trades:* ${data.trades.length} recent\n`;
  text += `*Closed:* ${data.closed_orders.length} total\n`;
  text += `*Win Rate:* ${winRate}% | *Total P&L:* $${totalPnL.toFixed(2)}\n\n`;

  if (data.trades.length > 0) {
    const latest = data.trades[0]!;
    text += `*Latest Trade:*\n`;
    text += `${latest.side.toUpperCase()} ${latest.market_title}\n`;
    text += `@ ${(latest.price * 100).toFixed(1)}c | Edge: ${latest.edge?.toFixed(3) ?? 'N/A'}\n`;
  }

  return text;
}