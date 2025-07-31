import { MarketData, BrokerConnection } from '@/types/broker';

interface TickData {
  symbol: string;
  bid: number;
  ask: number;
  timestamp: number;
  volume?: number;
  spread?: number;
}

interface MarketDataMetrics {
  symbol: string;
  tickCount: number;
  lastUpdate: number;
  averageLatency: number;
  maxLatency: number;
  dataQuality: number;
}

interface DataBuffer {
  symbol: string;
  data: TickData[];
  maxSize: number;
  lastCleanup: number;
}

interface ConnectionPool {
  primary: WebSocket | null;
  backup: WebSocket | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastFailover: number;
}

export class EnhancedMarketDataService {
  private connection: BrokerConnection | null = null;
  private connectionPool: ConnectionPool;
  private dataBuffers: Map<string, DataBuffer> = new Map();
  private subscribers: Map<string, ((data: TickData) => void)[]> = new Map();
  private metrics: Map<string, MarketDataMetrics> = new Map();
  
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly BUFFER_CLEANUP_INTERVAL = 30000; // 30 seconds
  private readonly MAX_BUFFER_SIZE = 1000;
  private readonly LATENCY_WINDOW_SIZE = 100;
  
  private reconnectTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private performanceMonitor: NodeJS.Timeout | null = null;
  
  // Memory management
  private readonly MAX_MEMORY_MB = 50;
  private memoryUsage = 0;
  private gcCounter = 0;

  constructor() {
    this.connectionPool = {
      primary: null,
      backup: null,
      status: 'disconnected',
      lastFailover: 0
    };
    
    this.initializePerformanceMonitoring();
    this.initializeMemoryManagement();
  }

  private initializePerformanceMonitoring(): void {
    this.performanceMonitor = setInterval(() => {
      this.updateMetrics();
      this.optimizeBuffers();
      this.checkMemoryUsage();
    }, 5000);
  }

  private initializeMemoryManagement(): void {
    this.cleanupTimer = setInterval(() => {
      this.performMemoryCleanup();
    }, this.BUFFER_CLEANUP_INTERVAL);
  }

  async start(): Promise<void> {
    if (!this.connection) {
      throw new Error('No broker connection set');
    }

    console.log('🚀 Starting Enhanced Market Data Service...');
    await this.establishPrimaryConnection();
    await this.establishBackupConnection();
    
    console.log('✅ Enhanced Market Data Service started');
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping Enhanced Market Data Service...');
    
    // Clear timers
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.performanceMonitor) clearInterval(this.performanceMonitor);
    
    // Close connections
    if (this.connectionPool.primary) {
      this.connectionPool.primary.close();
    }
    if (this.connectionPool.backup) {
      this.connectionPool.backup.close();
    }
    
    // Clear data
    this.dataBuffers.clear();
    this.metrics.clear();
    
    this.isConnected = false;
    this.connectionPool.status = 'disconnected';
    
    console.log('✅ Enhanced Market Data Service stopped');
  }

  async setBrokerConnection(connection: BrokerConnection): Promise<void> {
    this.connection = connection;
  }

  // Enhanced connection establishment with pooling
  private async establishPrimaryConnection(): Promise<void> {
    try {
      if (this.connection?.type === 'oanda') {
        await this.connectToOandaStream(true);
      } else if (this.connection?.type === 'ctrader') {
        await this.connectToCTraderStream(true);
      } else {
        await this.connectToMockStream(true);
      }
      
      this.connectionPool.status = 'connected';
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('✅ Primary market data connection established');
      
    } catch (error) {
      console.error('❌ Primary connection failed:', error);
      await this.handleConnectionFailure(true);
    }
  }

  private async establishBackupConnection(): Promise<void> {
    try {
      // Delay backup connection to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (this.connection?.type === 'oanda') {
        await this.connectToOandaStream(false);
      } else if (this.connection?.type === 'ctrader') {
        await this.connectToCTraderStream(false);
      } else {
        await this.connectToMockStream(false);
      }
      
      console.log('✅ Backup market data connection established');
      
    } catch (error) {
      console.error('⚠️ Backup connection failed (non-critical):', error);
    }
  }

  private async connectToOandaStream(isPrimary: boolean): Promise<void> {
    const endpoint = this.connection?.server || 'https://stream-fxpractice.oanda.com';
    const wsUrl = endpoint.replace('https://', 'wss://') + '/v3/stream';
    
    console.log(`🔌 Connecting to OANDA ${isPrimary ? 'primary' : 'backup'} stream...`);
    
    const ws = new WebSocket(wsUrl);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 10000);

      ws.onopen = () => {
        clearTimeout(timeout);
        console.log(`✅ OANDA ${isPrimary ? 'primary' : 'backup'} WebSocket connected`);
        
        // Authenticate and subscribe
        ws.send(JSON.stringify({
          type: 'subscribe',
          symbols: ['EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD'],
          dataType: 'tick'
        }));
        
        if (isPrimary) {
          this.connectionPool.primary = ws;
        } else {
          this.connectionPool.backup = ws;
        }
        
        resolve();
      };

      ws.onmessage = (event) => {
        this.processIncomingData(event.data, isPrimary);
      };

      ws.onclose = (event) => {
        clearTimeout(timeout);
        console.log(`🔌 OANDA ${isPrimary ? 'primary' : 'backup'} WebSocket closed:`, event.code);
        
        if (isPrimary && this.isConnected) {
          this.handleConnectionFailure(true);
        }
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error(`❌ OANDA ${isPrimary ? 'primary' : 'backup'} WebSocket error:`, error);
        reject(error);
      };
    });
  }

  private async connectToCTraderStream(isPrimary: boolean): Promise<void> {
    // Implementation for cTrader streaming would go here
    console.log(`🔌 cTrader ${isPrimary ? 'primary' : 'backup'} stream not implemented yet`);
    await this.connectToMockStream(isPrimary);
  }

  private async connectToMockStream(isPrimary: boolean): Promise<void> {
    console.log(`🔌 Starting ${isPrimary ? 'primary' : 'backup'} mock data stream...`);
    
    // Simulate WebSocket connection
    const mockWs = {
      close: () => {},
      send: () => {}
    } as any;
    
    if (isPrimary) {
      this.connectionPool.primary = mockWs;
      this.startHighFrequencyMockData();
    } else {
      this.connectionPool.backup = mockWs;
    }
  }

  // High-frequency mock data generator with realistic patterns
  private startHighFrequencyMockData(): void {
    const symbols = [
      'EUR_USD', 'GBP_USD', 'USD_JPY', 'USD_CHF', 'AUD_USD', 'USD_CAD', 'NZD_USD',
      'EUR_GBP', 'EUR_JPY', 'GBP_JPY', 'XAU_USD', 'XAG_USD', 'BTC_USD', 'ETH_USD'
    ];
    
    const basePrices: { [key: string]: number } = {
      'EUR_USD': 1.0850, 'GBP_USD': 1.2650, 'USD_JPY': 149.50,
      'USD_CHF': 0.9125, 'AUD_USD': 0.6580, 'USD_CAD': 1.3720, 'NZD_USD': 0.6120,
      'EUR_GBP': 0.8580, 'EUR_JPY': 162.45, 'GBP_JPY': 189.32,
      'XAU_USD': 2045.50, 'XAG_USD': 24.85,
      'BTC_USD': 43250.00, 'ETH_USD': 2580.00
    };

    // High-frequency updates (multiple per second)
    const updateInterval = 100; // 100ms = 10 updates per second
    
    setInterval(() => {
      symbols.forEach(symbol => {
        const basePrice = basePrices[symbol];
        
        // Different volatility for different asset classes
        let volatility: number;
        if (symbol.includes('BTC') || symbol.includes('ETH')) {
          volatility = 0.01; // 1% for crypto
        } else if (symbol.includes('XAU') || symbol.includes('XAG')) {
          volatility = 0.005; // 0.5% for metals
        } else if (symbol.includes('JPY')) {
          volatility = 0.002; // 0.2% for JPY pairs
        } else {
          volatility = 0.0005; // 0.05% for major FX
        }
        
        // Simulate market microstructure
        const trend = Math.sin(Date.now() / 100000) * 0.0001;
        const noise = (Math.random() - 0.5) * volatility;
        const microMove = (Math.random() - 0.5) * volatility * 0.1;
        
        const bid = basePrice + trend + noise + microMove;
        const spread = this.calculateRealisticSpread(symbol, basePrice);
        const ask = bid + spread;

        const tickData: TickData = {
          symbol,
          bid: Number(bid.toFixed(this.getPricePrecision(symbol))),
          ask: Number(ask.toFixed(this.getPricePrecision(symbol))),
          timestamp: Date.now(),
          volume: Math.floor(Math.random() * 500) + 50,
          spread: Number(spread.toFixed(this.getPricePrecision(symbol)))
        };

        this.processTickData(tickData);
      });
    }, updateInterval);
  }

  private calculateRealisticSpread(symbol: string, price: number): number {
    // Realistic spreads based on market conditions
    if (symbol.includes('BTC') || symbol.includes('ETH')) {
      return price * 0.001; // 0.1% spread for crypto
    } else if (symbol.includes('XAU')) {
      return 0.5; // $0.50 spread for gold
    } else if (symbol.includes('XAG')) {
      return 0.05; // $0.05 spread for silver
    } else if (symbol === 'EUR_USD' || symbol === 'GBP_USD') {
      return 0.00002; // 0.2 pip spread for majors
    } else if (symbol.includes('JPY')) {
      return 0.002; // 0.2 pip spread for JPY
    } else {
      return 0.00003; // 0.3 pip spread for minors
    }
  }

  private getPricePrecision(symbol: string): number {
    if (symbol.includes('JPY')) return 3;
    if (symbol.includes('XAU') || symbol.includes('XAG')) return 2;
    if (symbol.includes('BTC') || symbol.includes('ETH')) return 2;
    return 5;
  }

  // Enhanced data processing with latency optimization
  private processIncomingData(data: string, isPrimary: boolean): void {
    const startTime = performance.now();
    
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.type === 'tick' || parsed.symbol) {
        const tickData: TickData = {
          symbol: parsed.symbol || parsed.instrument,
          bid: parsed.bid || parsed.bidPrice,
          ask: parsed.ask || parsed.askPrice,
          timestamp: parsed.timestamp || Date.now(),
          volume: parsed.volume,
          spread: parsed.spread
        };
        
        this.processTickData(tickData);
      }
      
    } catch (error) {
      console.error('❌ Failed to process market data:', error);
    }
    
    const processingTime = performance.now() - startTime;
    this.updateLatencyMetrics(processingTime, isPrimary);
  }

  private processTickData(tickData: TickData): void {
    // Update buffer
    this.updateDataBuffer(tickData);
    
    // Update metrics
    this.updateTickMetrics(tickData);
    
    // Notify subscribers with zero-copy optimization
    this.notifySubscribers(tickData);
  }

  private updateDataBuffer(tickData: TickData): void {
    let buffer = this.dataBuffers.get(tickData.symbol);
    
    if (!buffer) {
      buffer = {
        symbol: tickData.symbol,
        data: [],
        maxSize: this.MAX_BUFFER_SIZE,
        lastCleanup: Date.now()
      };
      this.dataBuffers.set(tickData.symbol, buffer);
    }
    
    // Add new data
    buffer.data.push(tickData);
    
    // Maintain buffer size
    if (buffer.data.length > buffer.maxSize) {
      buffer.data.shift(); // Remove oldest
    }
    
    // Update memory usage estimation
    this.estimateMemoryUsage();
  }

  private updateTickMetrics(tickData: TickData): void {
    let metrics = this.metrics.get(tickData.symbol);
    
    if (!metrics) {
      metrics = {
        symbol: tickData.symbol,
        tickCount: 0,
        lastUpdate: 0,
        averageLatency: 0,
        maxLatency: 0,
        dataQuality: 100
      };
      this.metrics.set(tickData.symbol, metrics);
    }
    
    metrics.tickCount++;
    metrics.lastUpdate = tickData.timestamp;
    
    // Calculate data quality based on freshness and frequency
    const now = Date.now();
    const staleness = now - tickData.timestamp;
    
    if (staleness < 1000) { // Fresh data
      metrics.dataQuality = Math.min(100, metrics.dataQuality + 0.1);
    } else {
      metrics.dataQuality = Math.max(0, metrics.dataQuality - staleness / 1000);
    }
  }

  private updateLatencyMetrics(processingTime: number, isPrimary: boolean): void {
    // Track processing latency for optimization
    if (isPrimary) {
      // Update global latency metrics
      // Implementation would track and optimize based on latency patterns
    }
  }

  private notifySubscribers(tickData: TickData): void {
    const symbolSubscribers = this.subscribers.get(tickData.symbol);
    if (symbolSubscribers) {
      // Use requestAnimationFrame for smooth UI updates
      requestAnimationFrame(() => {
        symbolSubscribers.forEach(callback => {
          try {
            callback(tickData);
          } catch (error) {
            console.error('❌ Subscriber callback error:', error);
          }
        });
      });
    }
  }

  // Memory management and optimization
  private estimateMemoryUsage(): void {
    let totalSize = 0;
    
    for (const buffer of this.dataBuffers.values()) {
      // Rough estimation: each tick data object ~100 bytes
      totalSize += buffer.data.length * 100;
    }
    
    this.memoryUsage = totalSize / (1024 * 1024); // Convert to MB
  }

  private checkMemoryUsage(): void {
    if (this.memoryUsage > this.MAX_MEMORY_MB) {
      console.log(`⚠️ Memory usage high: ${this.memoryUsage.toFixed(2)}MB, performing cleanup...`);
      this.performAggressiveCleanup();
    }
  }

  private performMemoryCleanup(): void {
    const now = Date.now();
    
    for (const [symbol, buffer] of this.dataBuffers.entries()) {
      // Remove old data beyond retention period
      const retentionMs = 5 * 60 * 1000; // 5 minutes
      buffer.data = buffer.data.filter(tick => 
        now - tick.timestamp < retentionMs
      );
      
      // Update cleanup timestamp
      buffer.lastCleanup = now;
    }
    
    this.gcCounter++;
    if (this.gcCounter % 10 === 0) {
      // Suggest garbage collection every 10 cleanups
      if (global.gc) {
        global.gc();
      }
    }
    
    this.estimateMemoryUsage();
    console.log(`🧹 Memory cleanup completed. Usage: ${this.memoryUsage.toFixed(2)}MB`);
  }

  private performAggressiveCleanup(): void {
    for (const [symbol, buffer] of this.dataBuffers.entries()) {
      // Keep only recent data
      const keepMs = 1 * 60 * 1000; // 1 minute
      const now = Date.now();
      
      buffer.data = buffer.data.filter(tick => 
        now - tick.timestamp < keepMs
      ).slice(-100); // Keep max 100 recent ticks
    }
    
    this.estimateMemoryUsage();
    console.log(`🚨 Aggressive cleanup completed. Usage: ${this.memoryUsage.toFixed(2)}MB`);
  }

  private optimizeBuffers(): void {
    // Dynamic buffer size optimization based on activity
    for (const [symbol, buffer] of this.dataBuffers.entries()) {
      const metrics = this.metrics.get(symbol);
      if (metrics) {
        const recentActivity = metrics.tickCount / ((Date.now() - metrics.lastUpdate) / 1000 || 1);
        
        // Adjust buffer size based on activity
        if (recentActivity > 10) {
          buffer.maxSize = Math.min(2000, buffer.maxSize * 1.1);
        } else if (recentActivity < 1) {
          buffer.maxSize = Math.max(100, buffer.maxSize * 0.9);
        }
      }
    }
  }

  private updateMetrics(): void {
    // Calculate and log performance metrics
    const totalTicks = Array.from(this.metrics.values())
      .reduce((sum, m) => sum + m.tickCount, 0);
    
    const avgQuality = Array.from(this.metrics.values())
      .reduce((sum, m) => sum + m.dataQuality, 0) / this.metrics.size || 0;
    
    console.log(`📊 Data metrics: ${totalTicks} ticks processed, ${avgQuality.toFixed(1)}% quality, ${this.memoryUsage.toFixed(2)}MB memory`);
  }

  // Connection failover handling
  private async handleConnectionFailure(isPrimary: boolean): Promise<void> {
    if (isPrimary) {
      console.log('🔄 Primary connection failed, attempting failover...');
      
      // Try to promote backup to primary
      if (this.connectionPool.backup) {
        console.log('📈 Promoting backup connection to primary');
        this.connectionPool.primary = this.connectionPool.backup;
        this.connectionPool.backup = null;
        this.connectionPool.lastFailover = Date.now();
      }
      
      // Schedule reconnection
      this.scheduleReconnection();
    }
  }

  private scheduleReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(5000 * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
    
    console.log(`🔄 Scheduling reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.establishPrimaryConnection();
        
        // Re-establish backup connection after a delay
        setTimeout(() => {
          this.establishBackupConnection();
        }, 5000);
        
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        this.scheduleReconnection();
      }
    }, delay);
  }

  // Public API methods
  subscribe(symbol: string, callback: (data: TickData) => void): void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
    }
    this.subscribers.get(symbol)!.push(callback);
  }

  unsubscribe(symbol: string, callback: (data: TickData) => void): void {
    const symbolSubscribers = this.subscribers.get(symbol);
    if (symbolSubscribers) {
      const index = symbolSubscribers.indexOf(callback);
      if (index > -1) {
        symbolSubscribers.splice(index, 1);
      }
    }
  }

  getLatestTick(symbol: string): TickData | null {
    const buffer = this.dataBuffers.get(symbol);
    return buffer && buffer.data.length > 0 ? buffer.data[buffer.data.length - 1] : null;
  }

  getTickHistory(symbol: string, count: number = 100): TickData[] {
    const buffer = this.dataBuffers.get(symbol);
    if (!buffer || buffer.data.length === 0) return [];
    
    return buffer.data.slice(-count);
  }

  getConnectionStatus(): {
    isConnected: boolean;
    primaryStatus: string;
    backupStatus: string;
    reconnectAttempts: number;
    lastFailover: number;
  } {
    return {
      isConnected: this.isConnected,
      primaryStatus: this.connectionPool.primary ? 'connected' : 'disconnected',
      backupStatus: this.connectionPool.backup ? 'connected' : 'disconnected',
      reconnectAttempts: this.reconnectAttempts,
      lastFailover: this.connectionPool.lastFailover
    };
  }

  getPerformanceMetrics(): {
    symbols: string[];
    totalTicks: number;
    memoryUsage: number;
    dataQuality: number;
    bufferSizes: { [symbol: string]: number };
  } {
    const symbols = Array.from(this.metrics.keys());
    const totalTicks = Array.from(this.metrics.values())
      .reduce((sum, m) => sum + m.tickCount, 0);
    const avgQuality = Array.from(this.metrics.values())
      .reduce((sum, m) => sum + m.dataQuality, 0) / this.metrics.size || 0;
    
    const bufferSizes: { [symbol: string]: number } = {};
    for (const [symbol, buffer] of this.dataBuffers.entries()) {
      bufferSizes[symbol] = buffer.data.length;
    }
    
    return {
      symbols,
      totalTicks,
      memoryUsage: this.memoryUsage,
      dataQuality: avgQuality,
      bufferSizes
    };
  }

  // Force cleanup for testing/debugging
  forceCleanup(): void {
    this.performAggressiveCleanup();
  }

  // Reset all metrics
  resetMetrics(): void {
    this.metrics.clear();
    console.log('📊 Performance metrics reset');
  }
}