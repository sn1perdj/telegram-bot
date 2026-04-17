import {
  BotStatus,
  MarketData,
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

  return `📊 *MARKET OVERVIEW*
━━━━━━━━━━━━━━━━━━━━━

${market.market_title ?? 'Unknown Market'}

*Market Prices:*
├ BTC: $${market.btc_price?.toFixed(2) ?? 'N/A'}
└ Target: $${market.price_to_beat?.toFixed(2) ?? 'N/A'}

*Token Prices:*
├ YES: ${(market.yes_price * 100).toFixed(1)}c
└ NO:  ${(market.no_price * 100).toFixed(1)}c

⏱ Time Remaining: ${timeStr}`;
}



export function formatPositions(positions: Position[]): string {
  if (positions.length === 0) {
    return '💼 No open positions';
  }

  const totalSize = positions.reduce((sum, p) => sum + (p.size ?? 0), 0);
  const totalPnL = positions.reduce((sum, p) => sum + (p.pnl ?? 0), 0);
  const avgEntry = positions.length > 0
    ? positions.reduce((sum, p) => sum + p.price, 0) / positions.length
    : 0;

  let text = `📊 *POSITIONS SNAPSHOT*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  text += `*Portfolio Overview:*\n`;
  text += `├ Total Positions: ${positions.length}\n`;
  text += `├ Total Exposure: $${totalSize.toFixed(2)}\n`;
  text += `├ Average Entry: ${(avgEntry * 100).toFixed(1)}c\n`;
  text += `└ Total P&L: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)} ${totalPnL >= 0 ? '🟢' : '🔴'}\n\n`;

  text += `*Positions Table:*\n`;
  text += '`' + '━'.repeat(61) + '`\n';
  text += '` Market                 Side  Price   Qty    Amount    SL     Now    P&L  `\n';
  text += '`' + '━'.repeat(61) + '`\n';

  [...positions].reverse().forEach((pos) => {
    const dir = pos.direction.toUpperCase();
    const sideEmoji = dir === 'UP' ? '🟢' : '🔴';
    const sideStr = dir === 'UP' ? 'UP ' : 'DOWN';

    const marketTitle = pos.market_title.length > 18
      ? pos.market_title.substring(0, 17) + '…'
      : pos.market_title.padEnd(18);

    const entryPrice = (pos.price * 100).toFixed(1).padStart(5);
    const qty = (pos.qty ?? (pos.size / pos.price)).toFixed(0).padStart(4);
    const amount = `$${pos.size?.toFixed(0) ?? '0'}`.padStart(6);
    const sl = pos.sl ? `${(pos.sl * 100).toFixed(1)}c` : 'N/A'.padStart(5);
    const now = pos.current_price ? `${(pos.current_price * 100).toFixed(1)}c` : 'N/A'.padStart(5);

    let pnlStr: string;
    if (pos.pnl !== undefined) {
      const pnlEmoji = pos.pnl >= 0 ? '+' : '';
      pnlStr = `${pnlEmoji}$${pos.pnl.toFixed(1)}`;
    } else {
      pnlStr = 'N/A';
    }

    text += '`' +
      `${marketTitle} ${sideEmoji}${sideStr} ${entryPrice}c ${qty} ${amount} ${sl.padStart(5)} ${now.padStart(5)} ${pnlStr.padStart(6)}` +
      '`\n';
  });

  text += '`' + '━'.repeat(61) + '`\n\n';

  text += `*Summary by Direction:*\n`;
  const upPositions = positions.filter(p => p.direction.toUpperCase() === 'UP');
  const downPositions = positions.filter(p => p.direction.toUpperCase() === 'DOWN');

  if (upPositions.length > 0) {
    const upSize = upPositions.reduce((sum, p) => sum + (p.size ?? 0), 0);
    const upPnL = upPositions.reduce((sum, p) => sum + (p.pnl ?? 0), 0);
    text += `⬆️ UP: ${upPositions.length} pos | $${upSize.toFixed(2)} | P&L: ${upPnL >= 0 ? '+' : ''}$${upPnL.toFixed(2)}\n`;
  }

  if (downPositions.length > 0) {
    const downSize = downPositions.reduce((sum, p) => sum + (p.size ?? 0), 0);
    const downPnL = downPositions.reduce((sum, p) => sum + (p.pnl ?? 0), 0);
    text += `⬇️ DOWN: ${downPositions.length} pos | $${downSize.toFixed(2)} | P&L: ${downPnL >= 0 ? '+' : ''}$${downPnL.toFixed(2)}\n`;
  }

  return text;
}

export function formatClosedOrders(orders: ClosedOrder[]): string {
  if (orders.length === 0) {
    return '💼 No closed orders';
  }

  const totalPnL = orders.reduce((sum, o) => sum + o.final_pnl, 0);
  const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0);
  const totalQty = orders.reduce((sum, o) => sum + o.qty, 0);
  const profitable = orders.filter((o) => o.final_pnl > 0).length;
  const winRate = orders.length > 0 ? (profitable / orders.length * 100).toFixed(1) : '0.0';

  let text = `📊 *TRADE HISTORY*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  text += `*Portfolio Summary:*\n`;
  text += `├ Total Trades: ${orders.length}\n`;
  text += `├ Win Rate: ${winRate}%\n`;
  text += `├ Total Volume: $${totalAmount.toFixed(2)}\n`;
  text += `├ Total Qty: ${totalQty.toFixed(0)}\n`;
  text += `└ Total P&L: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)} ${totalPnL >= 0 ? '🟢' : '🔴'}\n\n`;

  text += `*Recent Trades Table:*\n`;
  text += '`' + '━'.repeat(58) + '`\n';
  text += '` Market                 Side  Entry  Exit   Qty    Amount   P&L   `\n';
  text += '`' + '━'.repeat(58) + '`\n';

  [...orders].reverse().slice(0, 10).forEach((order) => {
    const direction = order.side === 'buy' ? 'Up' : 'Down';
    const sideEmoji = direction === 'Up' ? '🟢' : '🔴';
    const sideStr = direction === 'Up' ? 'UP ' : 'DOWN';

    const marketTitle = order.market_title.length > 18
      ? order.market_title.substring(0, 17) + '…'
      : order.market_title.padEnd(18);

    const entryPrice = (order.buy_price * 100).toFixed(1).padStart(5);
    const exitPrice = (order.sell_price * 100).toFixed(1).padStart(5);
    const qty = order.qty.toFixed(0).padStart(4);
    const amount = `$${order.amount.toFixed(0)}`.padStart(6);
    const pnl = `${order.final_pnl >= 0 ? '+' : ''}$${order.final_pnl.toFixed(1)}`.padStart(6);

    text += '`' +
      `${marketTitle} ${sideEmoji}${sideStr} ${entryPrice}c ${exitPrice}c ${qty} ${amount} ${pnl}` +
      '`\n';
  });

  text += '`' + '━'.repeat(58) + '`\n\n';

  text += `*Resolution Status:*\n`;
  const resolved = orders.filter(o => o.resolution);
  const pending = orders.filter(o => !o.resolution);

  if (resolved.length > 0) {
    const resolvedPnL = resolved.reduce((sum, o) => sum + o.final_pnl, 0);
    text += `✅ Resolved: ${resolved.length} | P&L: ${resolvedPnL >= 0 ? '+' : ''}$${resolvedPnL.toFixed(2)}\n`;
  }
  if (pending.length > 0) {
    const pendingPnL = pending.reduce((sum, o) => sum + o.final_pnl, 0);
    text += `⏳ Pending: ${pending.length} | P&L: ${pendingPnL >= 0 ? '+' : ''}$${pendingPnL.toFixed(2)}\n`;
  }

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