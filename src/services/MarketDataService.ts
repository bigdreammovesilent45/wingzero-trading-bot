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

  async getAdvancedIndicators(symbol: string, timeframe: string = '1h'): Promise<any> {
    // Mock implementation for now - returns sample indicator data
    return {
      rsi: { signal: 'neutral', strength: 50, confidence: 75 },
      macd: { signal: 'buy', strength: 65, confidence: 80 },
      bollinger: { signal: 'neutral', strength: 45, confidence: 70 },
      stochastic: { signal: 'sell', strength: 60, confidence: 75 },
      williamsR: { signal: 'neutral', strength: 50, confidence: 70 },
      cci: { signal: 'buy', strength: 55, confidence: 72 },
      mfi: { signal: 'neutral', strength: 48, confidence: 68 }
    };
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
    const symbols = [
      'EUR_USD', 'GBP_USD', 'USD_JPY', 'USD_CHF', 'AUD_USD', 'USD_CAD', 'NZD_USD',
      'EUR_GBP', 'EUR_JPY', 'GBP_JPY', 'XAU_USD', 'XAG_USD', 'BTC_USD', 'ETH_USD'
    ];
    
    // Initialize with base prices for expanded markets
    const basePrices: { [key: string]: number } = {
      // Major Forex
      'EUR_USD': 1.0850, 'GBP_USD': 1.2650, 'USD_JPY': 149.50,
      'USD_CHF': 0.9125, 'AUD_USD': 0.6580, 'USD_CAD': 1.3720, 'NZD_USD': 0.6120,
      // Cross Pairs
      'EUR_GBP': 0.8580, 'EUR_JPY': 162.45, 'GBP_JPY': 189.32,
      // Precious Metals
      'XAU_USD': 2045.50, 'XAG_USD': 24.85,
      // Crypto
      'BTC_USD': 43250.00, 'ETH_USD': 2580.00
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