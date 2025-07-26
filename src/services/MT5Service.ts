import { BrokerConnection, Order, OrderRequest } from '@/types/broker';

export interface MT5Config {
  serverUrl: string;
  login: string;
  password: string;
  server: string;
}

export interface MT5Position {
  ticket: number;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  profit: number;
  swap: number;
  commission: number;
  comment: string;
  openTime: string;
}

export interface MT5AccountInfo {
  login: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  currency: string;
  server: string;
  company: string;
}

export class MT5Service {
  private config: MT5Config;
  private isConnected = false;

  constructor(config: MT5Config) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/connect', {
        method: 'POST',
        body: JSON.stringify({
          login: parseInt(this.config.login),
          password: this.config.password,
          server: this.config.server
        })
      });
      
      this.isConnected = response.success;
      return this.isConnected;
    } catch (error) {
      console.error('MT5 connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.makeRequest('/disconnect', { method: 'POST' });
      this.isConnected = false;
    } catch (error) {
      console.error('MT5 disconnect failed:', error);
    }
  }

  async getAccountInfo(): Promise<MT5AccountInfo> {
    const response = await this.makeRequest('/account');
    return response.data;
  }

  async getPositions(): Promise<MT5Position[]> {
    const response = await this.makeRequest('/positions');
    return response.data || [];
  }

  async placeOrder(orderRequest: OrderRequest): Promise<{ ticket: number; success: boolean }> {
    const mt5Order = {
      symbol: orderRequest.symbol,
      type: orderRequest.side === 'buy' ? 0 : 1, // MT5 order types
      volume: orderRequest.volume,
      price: orderRequest.type === 'market' ? 0 : orderRequest.price,
      stopLoss: orderRequest.stopLoss || 0,
      takeProfit: orderRequest.takeProfit || 0,
      comment: orderRequest.comment || 'WingZero'
    };

    const response = await this.makeRequest('/order/place', {
      method: 'POST',
      body: JSON.stringify(mt5Order)
    });

    return {
      ticket: response.data.ticket,
      success: response.success
    };
  }

  async closePosition(ticket: number): Promise<{ success: boolean }> {
    const response = await this.makeRequest('/position/close', {
      method: 'POST',
      body: JSON.stringify({ ticket })
    });

    return { success: response.success };
  }

  async getMarketData(symbols: string[]): Promise<any[]> {
    const response = await this.makeRequest('/quotes', {
      method: 'POST',
      body: JSON.stringify({ symbols })
    });

    return response.data || [];
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.serverUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`MT5 API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      server: this.config.server,
      login: this.config.login
    };
  }
}