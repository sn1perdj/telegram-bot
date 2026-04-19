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
  const timeStr = market.time_remaining !== undefined
    ? `${Math.floor(market.time_remaining / 60)}m ${Math.floor(market.time_remaining % 60)}s`
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
    return '💼 *No open positions.*';
  }

  let text = `📊 *ACTIVE POSITION*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  positions.forEach((pos) => {
    const dir = pos.direction.toUpperCase();
    const sideEmoji = dir === 'UP' ? '🟢' : '🔴';
    const sideStr = dir === 'UP' ? 'UP' : 'DOWN';

    const entryPrice = (pos.price * 100).toFixed(1) + 'c';
    const netQty = pos.filled_qty ?? pos.sell_qty ?? (pos.size / pos.price);
    const qty = (pos.qty ?? netQty).toFixed(2);
    const amount = `$${pos.size?.toFixed(2) ?? '0.00'}`;
    const sl = pos.sl ? `${(pos.sl * 100).toFixed(1)}c` : (pos.stop_loss ? `${(pos.stop_loss * 100).toFixed(1)}c` : 'N/A');
    const now = pos.current_price ? `${(pos.current_price * 100).toFixed(1)}c` : 'N/A';

    let pnlStr: string;
    let pnlEmoji = '';
    if (pos.pnl !== undefined) {
      pnlEmoji = pos.pnl >= 0 ? '🟢' : '🔴';
      pnlStr = `${pos.pnl >= 0 ? '+' : ''}$${pos.pnl.toFixed(2)}`;
    } else {
      pnlStr = 'N/A';
    }

    text += `*${pos.market_title}*\n`;
    text += `├ 🎯 *Side:* ${sideEmoji} ${sideStr}\n`;
    text += `├ 💰 *Amount:* ${amount} (${qty} shares)\n`;
    text += `├ 📊 *Entry:* ${entryPrice} | *Now:* ${now}\n`;
    text += `├ 🛑 *Stop Loss:* ${sl}\n`;
    text += `└ 💵 *Unrealized P&L:* ${pnlStr} ${pnlEmoji}\n\n`;
  });

  return text;
}

export function formatClosedOrders(orders: ClosedOrder[]): string {
  if (!orders || orders.length === 0) return '📝 *No closed orders found.*';

  // Calculate totals incorporating fees since backend final_pnl excludes them
  const totalPnL = orders.reduce((sum, o) => sum + (o.final_pnl - (o.feeUsdc ?? 0) / 100), 0);
  const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0);
  const totalQty = orders.reduce((sum, o) => sum + (o.filledQty || o.sellQty || 0), 0);
  const profitable = orders.filter((o) => (o.final_pnl - (o.feeUsdc ?? 0) / 100) > 0).length;
  const winRate = orders.length > 0 
    ? (profitable / orders.length * 100).toFixed(1) 
    : '0.0';

  let text = `📊 *Closed Orders Summary*\n\n`;
  text += `├ Win Rate: ${winRate}%\n`;
  text += `├ Total Volume: $${totalAmount.toFixed(2)}\n`;
  text += `├ Total Qty: ${totalQty.toFixed(0)}\n`;
  text += `└ Realized P&L: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)} ${totalPnL >= 0 ? '🟢' : '🔴'}\n\n`;

  text += `*Recent 5:*\n\n`;

  orders.slice(-5).forEach((order) => {
    const direction = order.side.toUpperCase() === 'UP' ? 'Up' : 'Down';
    const date = new Date(order.timestamp * 1000).toLocaleString();
    const res = order.resolution || 'Pending';
    const resEmoji = res === 'YES' ? '✅' : res === 'NO' ? '❌' : '⏳';
    
    text += `*${order.market_title}*\n`;
    text += `*Dir:* ${direction === 'Up' ? '⬆️' : '⬇️'} ${direction}\n`;
    text += `*Entry:* ${(order.buy_price * 100).toFixed(1)}c | *Exit:* ${(order.sell_price * 100).toFixed(1)}c\n`;
    const orderQty = order.filledQty || order.sellQty || 0;
    const feeInDollars = (order.feeUsdc ?? 0) / 100;
    const netPnl = order.final_pnl - feeInDollars;
    text += `*Qty:* ${orderQty.toFixed(2)} | *Amount:* $${order.amount.toFixed(2)}\n`;
    text += `*P&L:* $${netPnl.toFixed(2)} | *Fees:* $${feeInDollars.toFixed(2)}\n`;
    text += `*Res:* ${resEmoji} ${res}\n`;
    text += `*Timestamp:* ${date}\n\n`;
  });

  return text;
}

export function formatDashboard(data: DashboardData): string {
  // Incorporate fees into realized PNL since the backend's final_pnl does not include them
  const totalPnL = data.closed_orders.reduce((sum, o) => sum + (o.final_pnl - (o.feeUsdc ?? 0) / 100), 0);
  const profitable = data.closed_orders.filter((o) => (o.final_pnl - (o.feeUsdc ?? 0) / 100) > 0).length;
  const winRate = data.closed_orders.length > 0
    ? (profitable / data.closed_orders.length * 100).toFixed(1)
    : '0.0';

  let openPnL = 0;
  data.positions.forEach(pos => {
    if (pos.pnl !== undefined) {
      openPnL += pos.pnl;
    } else {
      const currentPrice = pos.direction.toUpperCase() === 'UP' ? data.market.yes_price : data.market.no_price;
      const netQty = pos.filled_qty ?? pos.sell_qty ?? (pos.size / pos.price);
      const qty = pos.qty ?? netQty;
      openPnL += (currentPrice - pos.price) * qty;
    }
  });



  let text = `🚀 *Polymarket Bot Dashboard*\n\n`;

  text += `${data.status.bot_running ? '✅' : '❌'} *Status:* ${data.status.bot_running ? 'Running' : 'Stopped'}\n`;
  text += `*Mode:* ${data.status.mode}\n\n`;

  text += `*Market:* ${data.market.market_title ?? 'N/A'}\n`;
  text += `*BTC*: $${data.market.btc_price?.toFixed(2) ?? 'N/A'}\n`;
  text += `*YES*: ${(data.market.yes_price * 100).toFixed(1)}c | *NO*: ${(data.market.no_price * 100).toFixed(1)}c\n\n`;

  text += `*Positions:* ${data.positions.length} open\n`;
  text += `*Trades:* ${data.trades.length} recent\n`;
  text += `*Closed:* ${data.closed_orders.length} total\n`;
  text += `*Win Rate:* ${winRate}%\n`;
  text += `*Realized P&L:* ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}\n`;
  if (data.positions.length > 0) {
    text += `*Unrealized P&L:* ${openPnL >= 0 ? '+' : ''}$${openPnL.toFixed(2)}\n`;
  }
  text += `\n`;

  if (data.trades.length > 0) {
    const latest = data.trades[0]!;
    text += `*Latest Trade:*\n`;
    text += `${latest.side.toUpperCase()} ${latest.market_title}\n`;
    text += `@ ${(latest.price * 100).toFixed(1)}c | Edge: ${latest.edge?.toFixed(3) ?? 'N/A'}\n`;
  }

  return text;
}