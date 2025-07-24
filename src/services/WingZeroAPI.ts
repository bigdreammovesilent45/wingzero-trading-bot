import { 
  WingZeroConfig, 
  WingZeroAccount, 
  WingZeroPosition, 
  WingZeroOrder, 
  WingZeroSymbol, 
  WingZeroTrade, 
  WingZeroMarketData, 
  WingZeroApiResponse,
  WingZeroNotification 
} from '@/types/wingzero';

export class WingZeroAPI {
  private config: WingZeroConfig;
  private wsConnection?: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: WingZeroConfig) {
    this.config = config;
  }

  // Authentication
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const timestamp = Date.now().toString();
    const signature = await this.generateSignature(timestamp);
    
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-API-Secret': this.config.apiSecret,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
      'X-Client-ID': this.config.clientId,
    };
  }

  private async generateSignature(timestamp: string): Promise<string> {
    // In production, implement proper HMAC-SHA256 signature
    const message = `${timestamp}${this.config.apiKey}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Core API Methods
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<WingZeroApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API request failed: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`WingZero API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Account Management
  async getAccount(): Promise<WingZeroAccount> {
    const response = await this.makeRequest<WingZeroAccount>('/api/v1/account');
    return response.data!;
  }

  async getAccountHistory(days: number = 30): Promise<WingZeroTrade[]> {
    const response = await this.makeRequest<WingZeroTrade[]>(`/api/v1/account/history?days=${days}`);
    return response.data!;
  }

  // Position Management
  async getPositions(): Promise<WingZeroPosition[]> {
    const response = await this.makeRequest<WingZeroPosition[]>('/api/v1/positions');
    return response.data!;
  }

  async closePosition(positionId: string, volume?: number): Promise<WingZeroTrade> {
    const response = await this.makeRequest<WingZeroTrade>(`/api/v1/positions/${positionId}/close`, {
      method: 'POST',
      body: JSON.stringify({ volume }),
    });
    return response.data!;
  }

  async modifyPosition(
    positionId: string, 
    stopLoss?: number, 
    takeProfit?: number
  ): Promise<WingZeroPosition> {
    const response = await this.makeRequest<WingZeroPosition>(`/api/v1/positions/${positionId}`, {
      method: 'PUT',
      body: JSON.stringify({ stopLoss, takeProfit }),
    });
    return response.data!;
  }

  // Order Management
  async getOrders(): Promise<WingZeroOrder[]> {
    const response = await this.makeRequest<WingZeroOrder[]>('/api/v1/orders');
    return response.data!;
  }

  async placeOrder(order: Partial<WingZeroOrder>): Promise<WingZeroOrder> {
    const response = await this.makeRequest<WingZeroOrder>('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
    return response.data!;
  }

  async modifyOrder(orderId: string, updates: Partial<WingZeroOrder>): Promise<WingZeroOrder> {
    const response = await this.makeRequest<WingZeroOrder>(`/api/v1/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data!;
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const response = await this.makeRequest<boolean>(`/api/v1/orders/${orderId}`, {
      method: 'DELETE',
    });
    return response.data!;
  }

  // Market Data
  async getSymbols(): Promise<WingZeroSymbol[]> {
    const response = await this.makeRequest<WingZeroSymbol[]>('/api/v1/symbols');
    return response.data!;
  }

  async getMarketData(symbol: string): Promise<WingZeroMarketData> {
    const response = await this.makeRequest<WingZeroMarketData>(`/api/v1/market/${symbol}`);
    return response.data!;
  }

  async getQuote(symbol: string): Promise<{ bid: number; ask: number; time: string }> {
    const response = await this.makeRequest<{ bid: number; ask: number; time: string }>(`/api/v1/quote/${symbol}`);
    return response.data!;
  }

  // Notifications
  async getNotifications(unreadOnly: boolean = false): Promise<WingZeroNotification[]> {
    const response = await this.makeRequest<WingZeroNotification[]>(`/api/v1/notifications?unreadOnly=${unreadOnly}`);
    return response.data!;
  }

  async markNotificationRead(notificationId: string): Promise<boolean> {
    const response = await this.makeRequest<boolean>(`/api/v1/notifications/${notificationId}/read`, {
      method: 'POST',
    });
    return response.data!;
  }

  // WebSocket Connection
  async connectWebSocket(onMessage: (data: any) => void, onError?: (error: Event) => void): Promise<void> {
    if (this.wsConnection) {
      this.wsConnection.close();
    }

    const wsUrl = this.config.wsEndpoint || this.config.baseUrl.replace('http', 'ws') + '/ws';
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onopen = () => {
      console.log('WingZero WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Authenticate WebSocket connection
      this.wsConnection!.send(JSON.stringify({
        type: 'auth',
        data: {
          apiKey: this.config.apiKey,
          timestamp: Date.now(),
        }
      }));
    };

    this.wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    this.wsConnection.onclose = (event) => {
      console.log('WingZero WebSocket disconnected:', event.code, event.reason);
      
      if (this.reconnectAttempts < this.maxReconnectAttempts && !event.wasClean) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => {
          this.connectWebSocket(onMessage, onError);
        }, 5000 * this.reconnectAttempts);
      }
    };

    this.wsConnection.onerror = (error) => {
      console.error('WingZero WebSocket error:', error);
      if (onError) {
        onError(error);
      }
    };
  }

  async disconnectWebSocket(): Promise<void> {
    if (this.wsConnection) {
      this.wsConnection.close(1000, 'Client disconnect');
      this.wsConnection = undefined;
    }
  }

  // Utility Methods
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ status: string }>('/api/v1/ping');
      return response.success && response.data?.status === 'ok';
    } catch (error) {
      return false;
    }
  }

  async getServerTime(): Promise<string> {
    const response = await this.makeRequest<{ time: string }>('/api/v1/time');
    return response.data!.time;
  }

  // Risk Management
  async setRiskLimits(limits: {
    maxDailyLoss?: number;
    maxPositionSize?: number;
    maxDrawdown?: number;
  }): Promise<boolean> {
    const response = await this.makeRequest<boolean>('/api/v1/risk/limits', {
      method: 'POST',
      body: JSON.stringify(limits),
    });
    return response.data!;
  }

  async getRiskStatus(): Promise<{
    dailyPnL: number;
    drawdown: number;
    marginLevel: number;
    riskScore: number;
  }> {
    const response = await this.makeRequest<{
      dailyPnL: number;
      drawdown: number;
      marginLevel: number;
      riskScore: number;
    }>('/api/v1/risk/status');
    return response.data!;
  }
}

// Mock implementation for development
export class MockWingZeroAPI extends WingZeroAPI {
  private mockData = {
    account: {
      id: 'mock-account-1',
      balance: 10000,
      equity: 10050,
      margin: 500,
      freeMargin: 9550,
      marginLevel: 2010,
      profit: 50,
      currency: 'USD',
      brokerName: 'Wing Zero Demo',
      accountNumber: '123456789',
      server: 'WingZero-Demo',
      leverage: 100,
      stopoutLevel: 20,
      tradeAllowed: true,
      expertEnabled: true,
    } as WingZeroAccount,
    
    positions: [
      {
        id: 'pos-1',
        symbol: 'EURUSD',
        type: 'buy' as const,
        volume: 0.1,
        openPrice: 1.0850,
        currentPrice: 1.0875,
        profit: 25,
        swap: -0.50,
        commission: -1.50,
        openTime: new Date(Date.now() - 3600000).toISOString(),
        comment: 'Test position',
      }
    ] as WingZeroPosition[],
    
    orders: [] as WingZeroOrder[],
    
    symbols: [
      {
        name: 'EURUSD',
        description: 'Euro vs US Dollar',
        bid: 1.0875,
        ask: 1.0877,
        spread: 2,
        digits: 5,
        minVolume: 0.01,
        maxVolume: 100,
        volumeStep: 0.01,
        marginRequired: 1087.5,
        swapLong: -0.5,
        swapShort: 0.3,
        tradingAllowed: true,
      }
    ] as WingZeroSymbol[],
  };

  async getAccount(): Promise<WingZeroAccount> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    return this.mockData.account;
  }

  async getPositions(): Promise<WingZeroPosition[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockData.positions;
  }

  async getOrders(): Promise<WingZeroOrder[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockData.orders;
  }

  async getSymbols(): Promise<WingZeroSymbol[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.mockData.symbols;
  }

  async testConnection(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }
}