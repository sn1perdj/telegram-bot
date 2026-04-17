import axios, { AxiosInstance } from 'axios';

export interface BotStatus {
  bot_running: boolean;
  mode: string;
  active_session: string;
}

export interface MarketData {
  btc_price: number;
  price_to_beat: number;
  yes_price: number;
  yes_bid: number;
  yes_ask: number;
  no_price: number;
  no_bid: number;
  no_ask: number;
  market_id: string;
  market_slug: string;
  market_title: string;
  time_remaining: number;
}

export interface Trade {
  session: string;
  market_title: string;
  market_url: string;
  side: string;
  price: number;
  probability: number;
  edge: number;
  size_usdc?: number;
  timestamp: number;
}

export interface Position {
  market_id: string;
  market_title: string;
  market_url: string;
  price: number;
  size: number;
  direction: string;
  entry_time: string;
  qty?: number;
  sl?: number;
  current_price?: number;
  pnl?: number;
  pnl_percent?: number;
}

export interface ClosedOrder {
  trade_id: string;
  market_title: string;
  market_url: string;
  side: string;
  buy_price: number;
  qty: number;
  amount: number;
  sell_price: number;
  fees: number;
  final_pnl: number;
  timestamp: number;
  resolution?: string;
}

export interface DashboardData {
  status: BotStatus;
  market: MarketData;
  trades: Trade[];
  positions: Position[];
  closed_orders: ClosedOrder[];
  logs: string[];
}

interface BotControlResult {
  status: string;
  running: boolean;
}

const DEFAULT_TIMEOUT_MS = 10_000;

export class PolymarketAPI {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: DEFAULT_TIMEOUT_MS,
    });
  }

  async getStatus(): Promise<BotStatus> {
    const { data } = await this.client.get('/api/status');
    return data;
  }

  async getMarket(): Promise<MarketData> {
    const { data } = await this.client.get('/api/market');
    return data;
  }

  async getTrades(): Promise<{ trades: Trade[] }> {
    const { data } = await this.client.get('/api/trades');
    return data;
  }

  async getPositions(): Promise<{ positions: Position[] }> {
    const { data } = await this.client.get('/api/positions');
    return data;
  }

  async getClosedOrders(): Promise<{ closed_orders: ClosedOrder[] }> {
    const { data } = await this.client.get('/api/closed_orders');
    return data;
  }

  async getDashboard(): Promise<DashboardData> {
    const { data } = await this.client.get('/api/dashboard');
    return data;
  }

  async getLogs(): Promise<{ logs: string[] }> {
    const { data } = await this.client.get('/api/logs');
    return data;
  }

  async startBot(): Promise<BotControlResult> {
    const { data } = await this.client.post('/api/bot/start');
    return data;
  }

  async stopBot(): Promise<BotControlResult> {
    const { data } = await this.client.post('/api/bot/stop');
    return data;
  }
}