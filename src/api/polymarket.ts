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

export class PolymarketAPI {
  private client: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  async getStatus(): Promise<BotStatus> {
    const response = await this.client.get('/api/status');
    return response.data;
  }

  async getMarket(): Promise<MarketData> {
    const response = await this.client.get('/api/market');
    return response.data;
  }

  async getTrades(): Promise<{ trades: Trade[] }> {
    const response = await this.client.get('/api/trades');
    return response.data;
  }

  async getPositions(): Promise<{ positions: Position[] }> {
    const response = await this.client.get('/api/positions');
    return response.data;
  }

  async getClosedOrders(): Promise<{ closed_orders: ClosedOrder[] }> {
    const response = await this.client.get('/api/closed_orders');
    return response.data;
  }

  async getDashboard(): Promise<DashboardData> {
    const response = await this.client.get('/api/dashboard');
    return response.data;
  }

  async getLogs(): Promise<{ logs: string[] }> {
    const response = await this.client.get('/api/logs');
    return response.data;
  }

  async startBot(): Promise<{ status: string; running: boolean }> {
    const response = await this.client.post('/api/bot/start');
    return response.data;
  }

  async stopBot(): Promise<{ status: string; running: boolean }> {
    const response = await this.client.post('/api/bot/stop');
    return response.data;
  }
}
