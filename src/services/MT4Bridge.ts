/**
 * MT4 Bridge Service
 * Handles communication between the web app and MetaTrader 4 terminal
 */

export interface MT4Config {
  serverUrl: string; // MT4 bridge server URL (e.g., http://localhost:8080)
  account: string;   // MT4 account number
  server: string;    // MT4 server (e.g., MetaQuotes-Demo)
  password?: string; // Optional: for authentication
}

export interface MT4AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  currency: string;
  leverage: number;
  name: string;
  server: string;
  company: string;
}

export interface MT4Position {
  ticket: number;
  symbol: string;
  type: 'buy' | 'sell';
  lots: number;
  openPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  profit: number;
  swap: number;
  commission: number;
  comment: string;
  openTime: string;
}

export class MT4BridgeService {
  private config: MT4Config;
  private isConnected: boolean = false;

  constructor(config: MT4Config) {
    this.config = config;
  }

  /**
   * Test connection to MT4 terminal
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.serverUrl}/api/connection/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: this.config.account,
          server: this.config.server,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        this.isConnected = result.connected;
        return result.connected;
      }
      return false;
    } catch (error) {
      console.error('MT4 connection test failed:', error);
      return false;
    }
  }

  /**
   * Get account information from MT4
   */
  async getAccountInfo(): Promise<MT4AccountInfo> {
    const response = await fetch(`${this.config.serverUrl}/api/account/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: this.config.account,
        server: this.config.server,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get MT4 account info: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get open positions from MT4
   */
  async getOpenPositions(): Promise<MT4Position[]> {
    const response = await fetch(`${this.config.serverUrl}/api/positions/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: this.config.account,
        server: this.config.server,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get MT4 positions: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Place a new order in MT4
   */
  async placeOrder(orderRequest: {
    symbol: string;
    type: 'buy' | 'sell';
    lots: number;
    price?: number;
    stopLoss?: number;
    takeProfit?: number;
    comment?: string;
  }): Promise<{ ticket: number; success: boolean }> {
    const response = await fetch(`${this.config.serverUrl}/api/orders/place`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: this.config.account,
        server: this.config.server,
        ...orderRequest,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to place MT4 order: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Close an existing position
   */
  async closePosition(ticket: number): Promise<{ success: boolean }> {
    const response = await fetch(`${this.config.serverUrl}/api/positions/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: this.config.account,
        server: this.config.server,
        ticket,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to close MT4 position: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get market data for symbols
   */
  async getMarketData(symbols: string[]): Promise<any[]> {
    const response = await fetch(`${this.config.serverUrl}/api/market/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: this.config.account,
        server: this.config.server,
        symbols,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get MT4 market data: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      account: this.config.account,
      server: this.config.server,
      serverUrl: this.config.serverUrl,
    };
  }
}