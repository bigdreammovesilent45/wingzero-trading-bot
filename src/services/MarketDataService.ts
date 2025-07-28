import { MarketData, BrokerConnection } from '@/types/broker';

export class MarketDataService {
  private connection: BrokerConnection | null = null;
  private marketData: Map<string, MarketData> = new Map();
  private subscribers: Map<string, ((data: MarketData) => void)[]> = new Map();
  private websocket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async start(): Promise<void> {
    if (!this.connection) {
      throw new Error('No broker connection set');
    }

    await this.connectToDataFeed();
    console.log('Market data service started');
  }

  async stop(): Promise<void> {
    if (this.websocket) {
      this.websocket.close();
    }
    this.isConnected = false;
    console.log('Market data service stopped');
  }

  async setBrokerConnection(connection: BrokerConnection): Promise<void> {
    this.connection = connection;
  }

  private async connectToDataFeed(): Promise<void> {
    try {
      // In a real implementation, this would connect to actual broker data feeds
      // For now, we'll simulate with a mock data source
      
      if (this.connection?.type === 'oanda') {
        await this.connectToOanda();
      } else if (this.connection?.type === 'ctrader') {
        await this.connectToCTrader();
      } else {
        await this.connectToMockFeed();
      }
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
    } catch (error) {
      console.error('Failed to connect to data feed:', error);
      await this.handleReconnection();
    }
  }

  private async connectToOanda(): Promise<void> {
    // OANDA v20 REST API integration
    const endpoint = this.connection?.server || 'https://api-fxpractice.oanda.com';
    
    // This would use real OANDA API
    console.log('Connecting to OANDA data feed...');
    
    // For demo purposes, we'll start mock data
    this.startMockDataFeed();
  }


  private async connectToCTrader(): Promise<void> {
    // cTrader integration would use cTrader Open API
    console.log('Connecting to cTrader data feed...');
    
    // For demo purposes, we'll start mock data
    this.startMockDataFeed();
  }

  private async connectToMockFeed(): Promise<void> {
    console.log('Starting mock data feed for development...');
    this.startMockDataFeed();
  }

  private startMockDataFeed(): void {
    const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'];
    
    // Initialize with base prices
    const basePrices: { [key: string]: number } = {
      'EURUSD': 1.0850,
      'GBPUSD': 1.2650,
      'USDJPY': 149.50,
      'USDCHF': 0.9125,
      'AUDUSD': 0.6580,
      'USDCAD': 1.3720,
      'NZDUSD': 0.6120
    };

    // Update prices every second with realistic movements
    setInterval(() => {
      symbols.forEach(symbol => {
        const basePrice = basePrices[symbol];
        const volatility = symbol === 'USDJPY' ? 0.02 : 0.0002;
        
        // Generate realistic price movement
        const change = (Math.random() - 0.5) * volatility;
        const bid = basePrice + change;
        const spread = symbol === 'USDJPY' ? 0.02 : 0.00015;
        const ask = bid + spread;

        const marketData: MarketData = {
          symbol,
          bid: Number(bid.toFixed(symbol === 'USDJPY' ? 2 : 5)),
          ask: Number(ask.toFixed(symbol === 'USDJPY' ? 2 : 5)),
          spread: Number(spread.toFixed(5)),
          timestamp: Date.now(),
          volume: Math.floor(Math.random() * 1000) + 100
        };

        this.updateMarketData(marketData);
      });
    }, 1000);
  }

  private updateMarketData(data: MarketData): void {
    this.marketData.set(data.symbol, data);
    
    // Notify subscribers
    const symbolSubscribers = this.subscribers.get(data.symbol) || [];
    symbolSubscribers.forEach(callback => callback(data));
  }

  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connectToDataFeed();
    }, delay);
  }

  // Public methods
  getLatestPrice(symbol: string): MarketData | null {
    return this.marketData.get(symbol) || null;
  }

  async getCurrentData(): Promise<MarketData[]> {
    return Array.from(this.marketData.values());
  }

  subscribe(symbol: string, callback: (data: MarketData) => void): void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
    }
    this.subscribers.get(symbol)!.push(callback);
  }

  unsubscribe(symbol: string, callback: (data: MarketData) => void): void {
    const symbolSubscribers = this.subscribers.get(symbol);
    if (symbolSubscribers) {
      const index = symbolSubscribers.indexOf(callback);
      if (index > -1) {
        symbolSubscribers.splice(index, 1);
      }
    }
  }

  isDataConnected(): boolean {
    return this.isConnected;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      broker: this.connection?.name || 'Unknown',
      symbols: Array.from(this.marketData.keys()),
      lastUpdate: Math.max(...Array.from(this.marketData.values()).map(d => d.timestamp))
    };
  }
}