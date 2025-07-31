interface DataProviderConfig {
  providerId: string;
  name: string;
  type: 'tier1' | 'tier2' | 'alternative' | 'crypto' | 'retail';
  priority: number; // Higher number = higher priority
  credentials: {
    apiKey?: string;
    username?: string;
    password?: string;
    token?: string;
    endpoint: string;
    backup_endpoint?: string;
  };
  capabilities: {
    realTimeData: boolean;
    historicalData: boolean;
    level1: boolean; // Best bid/ask
    level2: boolean; // Order book depth
    timeAndSales: boolean;
    fundamentals: boolean;
    news: boolean;
    analytics: boolean;
    alternativeData: boolean;
  };
  limits: {
    requestsPerSecond: number;
    requestsPerDay: number;
    symbolsPerRequest: number;
    historicalDays: number;
  };
  latency: {
    expected: number; // milliseconds
    sla: number; // SLA threshold
  };
  costs: {
    monthlyFee: number;
    perRequestCost: number;
    perSymbolCost: number;
    dataDelayCost: number; // cost reduction for delayed data
  };
}

interface UniversalMarketData {
  symbol: string;
  timestamp: number;
  source: string;
  quality: 'real-time' | 'near-real-time' | 'delayed' | 'stale';
  latency: number; // milliseconds from event to processing
  
  // Price data
  last: number;
  bid: number;
  ask: number;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  
  // Volume and size data
  volume: number;
  bidSize: number;
  askSize: number;
  dailyVolume: number;
  averageVolume: number;
  
  // Calculated fields
  change: number;
  changePercent: number;
  spread: number;
  spreadBps: number;
  midPrice: number;
  vwap: number;
  
  // Market microstructure
  tradeCount: number;
  uptickVolume: number;
  downtickVolume: number;
  
  // Quality metrics
  confidenceScore: number; // 0-100
  staleness: number; // seconds since last update
  
  // Provider metadata
  providerId: string;
  tier: number;
  originalData?: any; // Raw provider data
}

interface Level2OrderBook {
  symbol: string;
  timestamp: number;
  source: string;
  bids: Array<{
    price: number;
    size: number;
    orders: number;
    mpid?: string; // Market participant ID
  }>;
  asks: Array<{
    price: number;
    size: number;
    orders: number;
    mpid?: string;
  }>;
  depth: number;
  spread: number;
  imbalance: number; // (bid_volume - ask_volume) / (bid_volume + ask_volume)
  quality: number; // Book quality score
}

interface TimeAndSalesData {
  symbol: string;
  timestamp: number;
  source: string;
  trades: Array<{
    price: number;
    size: number;
    timestamp: number;
    side: 'buy' | 'sell' | 'unknown';
    conditions: string[];
    exchange?: string;
    tradeId?: string;
  }>;
}

interface FundamentalData {
  symbol: string;
  timestamp: number;
  source: string;
  company: {
    name: string;
    sector: string;
    industry: string;
    country: string;
    currency: string;
    marketCap: number;
    employees?: number;
  };
  financials: {
    revenue: number;
    netIncome: number;
    eps: number;
    peRatio: number;
    pbRatio: number;
    dividendYield: number;
    debtToEquity: number;
    roe: number;
    roa: number;
  };
  estimates: {
    epsEstimate: number;
    revenueEstimate: number;
    targetPrice: number;
    recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    analystCount: number;
  };
  lastUpdated: number;
}

interface AlternativeData {
  symbol: string;
  timestamp: number;
  source: string;
  dataType: 'satellite' | 'credit_card' | 'social_media' | 'web_scraping' | 'iot' | 'weather' | 'shipping' | 'patent';
  data: {
    value: number;
    unit: string;
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    significance: 'low' | 'medium' | 'high';
    description: string;
  };
  processingTime: number;
  validityPeriod: number; // How long this data is considered valid
}

interface DataQualityMetrics {
  providerId: string;
  symbol: string;
  period: { start: number; end: number };
  metrics: {
    uptime: number; // percentage
    latency: {
      average: number;
      p95: number;
      p99: number;
    };
    accuracy: number; // compared to reference
    completeness: number; // percentage of expected updates received
    timeliness: number; // percentage of updates within SLA
    consistency: number; // data consistency across providers
  };
  issues: Array<{
    type: 'outage' | 'delay' | 'accuracy' | 'missing_data';
    timestamp: number;
    duration: number;
    impact: 'low' | 'medium' | 'high';
    description: string;
  }>;
  score: number; // Overall quality score 0-100
}

interface DataSubscription {
  subscriptionId: string;
  symbols: string[];
  dataTypes: ('level1' | 'level2' | 'trades' | 'fundamentals' | 'news' | 'alternative')[];
  providers: string[];
  filters: {
    minVolume?: number;
    minPrice?: number;
    maxPrice?: number;
    exchanges?: string[];
    currencies?: string[];
  };
  callback: (data: UniversalMarketData | Level2OrderBook | TimeAndSalesData) => void;
  errorCallback: (error: any) => void;
  isActive: boolean;
  createdAt: number;
  lastUpdate: number;
}

export class EnterpriseMarketDataAggregator {
  private providers: Map<string, DataProviderConfig> = new Map();
  private connections: Map<string, any> = new Map(); // Provider connections
  private subscriptions: Map<string, DataSubscription> = new Map();
  private marketData: Map<string, UniversalMarketData> = new Map(); // Latest data cache
  private orderBooks: Map<string, Level2OrderBook> = new Map();
  private fundamentalData: Map<string, FundamentalData> = new Map();
  private alternativeData: Map<string, AlternativeData[]> = new Map();
  
  // Quality and monitoring
  private qualityMetrics: Map<string, DataQualityMetrics> = new Map();
  private providerHealth: Map<string, {
    status: 'online' | 'offline' | 'degraded';
    lastSeen: number;
    errorCount: number;
    latency: number;
  }> = new Map();

  // Data processing
  private dataProcessingQueue: Array<{
    data: any;
    provider: string;
    symbol: string;
    timestamp: number;
    priority: number;
  }> = [];
  private processingTimer?: NodeJS.Timeout;
  private conflationRules: Map<string, {
    interval: number; // milliseconds
    method: 'latest' | 'vwap' | 'average';
  }> = new Map();

  // Failover and redundancy
  private primaryProviders: Map<string, string> = new Map(); // symbol -> providerId
  private backupProviders: Map<string, string[]> = new Map(); // symbol -> providerId[]
  private failoverInProgress: Set<string> = new Set(); // symbols currently failing over

  // Performance monitoring
  private performanceMetrics = {
    totalUpdates: 0,
    updatesPerSecond: 0,
    averageLatency: 0,
    dataQualityScore: 0,
    providerFailures: 0,
    failoverCount: 0,
    lastUpdateTime: 0
  };

  constructor() {
    this.initializeDefaultProviders();
    this.startDataProcessing();
    this.startQualityMonitoring();
  }

  async initialize(): Promise<void> {
    console.log('📡 Initializing Enterprise Market Data Aggregator...');

    // Initialize all configured providers
    for (const [providerId, config] of this.providers.entries()) {
      try {
        await this.initializeProvider(providerId);
        console.log(`✅ Provider ${config.name} initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize provider ${config.name}:`, error);
      }
    }

    // Start health monitoring
    this.startHealthMonitoring();

    console.log('✅ Enterprise Market Data Aggregator initialized');
  }

  // Provider Management
  async addProvider(config: DataProviderConfig): Promise<void> {
    console.log(`📡 Adding data provider: ${config.name}`);

    this.providers.set(config.providerId, config);
    
    try {
      await this.initializeProvider(config.providerId);
      console.log(`✅ Provider ${config.name} added and initialized`);
    } catch (error) {
      console.error(`❌ Failed to initialize provider ${config.name}:`, error);
      throw error;
    }
  }

  private async initializeProvider(providerId: string): Promise<void> {
    const config = this.providers.get(providerId);
    if (!config) {
      throw new Error(`Provider ${providerId} not found`);
    }

    let connection;

    switch (providerId) {
      case 'reuters_eikon':
        connection = await this.initializeReutersEikon(config);
        break;
      case 'bloomberg_api':
        connection = await this.initializeBloombergAPI(config);
        break;
      case 'refinitiv_real_time':
        connection = await this.initializeRefinitiv(config);
        break;
      case 'quandl':
        connection = await this.initializeQuandl(config);
        break;
      case 'alpha_vantage':
        connection = await this.initializeAlphaVantage(config);
        break;
      case 'polygon_io':
        connection = await this.initializePolygonIO(config);
        break;
      case 'iex_cloud':
        connection = await this.initializeIEXCloud(config);
        break;
      case 'satellite_imaging':
        connection = await this.initializeSatelliteData(config);
        break;
      case 'social_sentiment':
        connection = await this.initializeSocialSentiment(config);
        break;
      default:
        connection = await this.initializeGenericProvider(config);
    }

    this.connections.set(providerId, connection);
    this.providerHealth.set(providerId, {
      status: 'online',
      lastSeen: Date.now(),
      errorCount: 0,
      latency: 0
    });
  }

  // Provider Implementations (Simplified for demonstration)
  private async initializeReutersEikon(config: DataProviderConfig): Promise<any> {
    console.log('🔗 Connecting to Reuters Eikon...');
    
    // Mock Reuters Eikon connection
    const connection = {
      provider: 'reuters_eikon',
      isConnected: true,
      subscribe: async (symbols: string[], callback: Function) => {
        // Simulate Reuters real-time data
        setInterval(() => {
          for (const symbol of symbols) {
            const data = this.generateMockData(symbol, 'reuters_eikon', 'real-time');
            callback(data);
          }
        }, 100); // 100ms updates - very high frequency
      },
      getFundamentals: async (symbol: string) => {
        return this.generateMockFundamentals(symbol, 'reuters_eikon');
      },
      getNews: async (symbol: string) => {
        return this.generateMockNews(symbol, 'reuters_eikon');
      }
    };

    return connection;
  }

  private async initializeBloombergAPI(config: DataProviderConfig): Promise<any> {
    console.log('🔗 Connecting to Bloomberg API...');
    
    // Mock Bloomberg Terminal API connection
    const connection = {
      provider: 'bloomberg_api',
      isConnected: true,
      subscribe: async (symbols: string[], callback: Function) => {
        // Simulate Bloomberg real-time data
        setInterval(() => {
          for (const symbol of symbols) {
            const data = this.generateMockData(symbol, 'bloomberg_api', 'real-time');
            callback(data);
          }
        }, 50); // 50ms updates - ultra high frequency
      },
      getLevel2: async (symbol: string) => {
        return this.generateMockLevel2(symbol, 'bloomberg_api');
      },
      getAnalytics: async (symbol: string) => {
        return this.generateMockAnalytics(symbol, 'bloomberg_api');
      }
    };

    return connection;
  }

  private async initializeRefinitiv(config: DataProviderConfig): Promise<any> {
    console.log('🔗 Connecting to Refinitiv Real-Time...');
    
    const connection = {
      provider: 'refinitiv_real_time',
      isConnected: true,
      subscribe: async (symbols: string[], callback: Function) => {
        setInterval(() => {
          for (const symbol of symbols) {
            const data = this.generateMockData(symbol, 'refinitiv_real_time', 'real-time');
            callback(data);
          }
        }, 200); // 200ms updates
      }
    };

    return connection;
  }

  private async initializePolygonIO(config: DataProviderConfig): Promise<any> {
    console.log('🔗 Connecting to Polygon.io...');
    
    const connection = {
      provider: 'polygon_io',
      isConnected: true,
      subscribe: async (symbols: string[], callback: Function) => {
        setInterval(() => {
          for (const symbol of symbols) {
            const data = this.generateMockData(symbol, 'polygon_io', 'near-real-time');
            callback(data);
          }
        }, 1000); // 1 second updates
      }
    };

    return connection;
  }

  private async initializeSatelliteData(config: DataProviderConfig): Promise<any> {
    console.log('🛰️ Connecting to Satellite Data Provider...');
    
    const connection = {
      provider: 'satellite_imaging',
      isConnected: true,
      getData: async (symbol: string) => {
        return this.generateMockAlternativeData(symbol, 'satellite');
      }
    };

    return connection;
  }

  private async initializeSocialSentiment(config: DataProviderConfig): Promise<any> {
    console.log('📱 Connecting to Social Sentiment Provider...');
    
    const connection = {
      provider: 'social_sentiment',
      isConnected: true,
      getSentiment: async (symbol: string) => {
        return this.generateMockAlternativeData(symbol, 'social_media');
      }
    };

    return connection;
  }

  private async initializeGenericProvider(config: DataProviderConfig): Promise<any> {
    console.log(`🔗 Connecting to ${config.name}...`);
    
    // Generic provider implementation
    const connection = {
      provider: config.providerId,
      isConnected: true,
      subscribe: async (symbols: string[], callback: Function) => {
        const updateInterval = config.type === 'tier1' ? 100 : 
                             config.type === 'tier2' ? 500 : 2000;
        
        setInterval(() => {
          for (const symbol of symbols) {
            const quality = config.type === 'tier1' ? 'real-time' : 
                          config.type === 'tier2' ? 'near-real-time' : 'delayed';
            const data = this.generateMockData(symbol, config.providerId, quality);
            callback(data);
          }
        }, updateInterval);
      }
    };

    return connection;
  }

  // Data Subscription Management
  async subscribe(
    symbols: string[],
    dataTypes: DataSubscription['dataTypes'],
    callback: DataSubscription['callback'],
    options?: {
      providers?: string[];
      filters?: DataSubscription['filters'];
      errorCallback?: DataSubscription['errorCallback'];
    }
  ): Promise<string> {
    const subscriptionId = this.generateSubscriptionId();
    
    console.log(`📊 Creating subscription ${subscriptionId} for ${symbols.length} symbols`);

    const subscription: DataSubscription = {
      subscriptionId,
      symbols,
      dataTypes,
      providers: options?.providers || this.selectOptimalProviders(symbols, dataTypes),
      filters: options?.filters || {},
      callback,
      errorCallback: options?.errorCallback || ((error) => console.error('Subscription error:', error)),
      isActive: true,
      createdAt: Date.now(),
      lastUpdate: Date.now()
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Set up primary and backup providers for each symbol
    for (const symbol of symbols) {
      this.setupProviderHierarchy(symbol, subscription.providers);
    }

    // Start data flow for this subscription
    await this.activateSubscription(subscription);

    console.log(`✅ Subscription ${subscriptionId} activated with ${subscription.providers.length} providers`);
    return subscriptionId;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    console.log(`🔌 Unsubscribing ${subscriptionId}`);

    subscription.isActive = false;
    this.subscriptions.delete(subscriptionId);

    // Clean up provider subscriptions if no longer needed
    await this.cleanupUnusedProviderSubscriptions();

    console.log(`✅ Subscription ${subscriptionId} removed`);
  }

  private async activateSubscription(subscription: DataSubscription): Promise<void> {
    for (const providerId of subscription.providers) {
      const connection = this.connections.get(providerId);
      if (!connection) continue;

      try {
        await connection.subscribe(subscription.symbols, (data: any) => {
          this.handleProviderData(data, providerId, subscription);
        });
      } catch (error) {
        console.error(`❌ Failed to activate subscription for provider ${providerId}:`, error);
        subscription.errorCallback(error);
      }
    }
  }

  private handleProviderData(rawData: any, providerId: string, subscription: DataSubscription): void {
    const startTime = Date.now();

    try {
      // Normalize data based on provider
      const normalizedData = this.normalizeProviderData(rawData, providerId);
      
      // Apply filters
      if (!this.passesFilters(normalizedData, subscription.filters)) {
        return;
      }

      // Quality scoring
      const qualityScore = this.calculateDataQuality(normalizedData, providerId);
      normalizedData.confidenceScore = qualityScore;

      // Add to processing queue
      this.dataProcessingQueue.push({
        data: normalizedData,
        provider: providerId,
        symbol: normalizedData.symbol,
        timestamp: normalizedData.timestamp,
        priority: this.getProviderPriority(providerId)
      });

      // Update performance metrics
      this.updatePerformanceMetrics(providerId, Date.now() - startTime);

    } catch (error) {
      console.error(`❌ Error processing data from ${providerId}:`, error);
      subscription.errorCallback(error);
    }
  }

  private normalizeProviderData(rawData: any, providerId: string): UniversalMarketData {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // Provider-specific normalization
    switch (providerId) {
      case 'reuters_eikon':
        return this.normalizeReutersData(rawData);
      case 'bloomberg_api':
        return this.normalizeBloombergData(rawData);
      case 'refinitiv_real_time':
        return this.normalizeRefinitivData(rawData);
      default:
        return this.normalizeGenericData(rawData, providerId);
    }
  }

  private normalizeReutersData(data: any): UniversalMarketData {
    return {
      symbol: data.symbol || data.ric,
      timestamp: Date.now(),
      source: 'reuters_eikon',
      quality: 'real-time',
      latency: 50, // Typical Reuters latency
      
      last: data.TRDPRC_1 || data.last,
      bid: data.BID || data.bid,
      ask: data.ASK || data.ask,
      open: data.OPEN_PRC || data.open,
      high: data.HIGH_1 || data.high,
      low: data.LOW_1 || data.low,
      close: data.CLOSE || data.close,
      previousClose: data.PREVCLOSEN || data.prevClose,
      
      volume: data.ACVOL_1 || data.volume || 0,
      bidSize: data.BIDSIZE || data.bidSize || 0,
      askSize: data.ASKSIZE || data.askSize || 0,
      dailyVolume: data.ACVOL_1 || 0,
      averageVolume: data.AVGVOL || 0,
      
      change: data.NETCHANGE || 0,
      changePercent: data.PCTCHANGE || 0,
      spread: (data.ASK || 0) - (data.BID || 0),
      spreadBps: 0, // Will be calculated
      midPrice: ((data.ASK || 0) + (data.BID || 0)) / 2,
      vwap: data.VWAP || 0,
      
      tradeCount: data.COUNT || 0,
      uptickVolume: 0,
      downtickVolume: 0,
      
      confidenceScore: 95, // High confidence for Reuters
      staleness: 0,
      
      providerId: 'reuters_eikon',
      tier: 1,
      originalData: data
    };
  }

  private normalizeBloombergData(data: any): UniversalMarketData {
    return {
      symbol: data.security || data.symbol,
      timestamp: Date.now(),
      source: 'bloomberg_api',
      quality: 'real-time',
      latency: 30, // Bloomberg typically has very low latency
      
      last: data.PX_LAST || data.last,
      bid: data.PX_BID || data.bid,
      ask: data.PX_ASK || data.ask,
      open: data.PX_OPEN || data.open,
      high: data.PX_HIGH || data.high,
      low: data.PX_LOW || data.low,
      close: data.PX_CLOSE || data.close,
      previousClose: data.PX_PREVIOUS_CLOSE || data.prevClose,
      
      volume: data.PX_VOLUME || data.volume || 0,
      bidSize: data.BID_SIZE || data.bidSize || 0,
      askSize: data.ASK_SIZE || data.askSize || 0,
      dailyVolume: data.PX_VOLUME || 0,
      averageVolume: data.VOLUME_AVG_30D || 0,
      
      change: data.CHG_NET_1D || 0,
      changePercent: data.CHG_PCT_1D || 0,
      spread: (data.PX_ASK || 0) - (data.PX_BID || 0),
      spreadBps: 0,
      midPrice: ((data.PX_ASK || 0) + (data.PX_BID || 0)) / 2,
      vwap: data.VWAP || 0,
      
      tradeCount: data.TRADE_COUNT || 0,
      uptickVolume: data.UPTICK_VOLUME || 0,
      downtickVolume: data.DOWNTICK_VOLUME || 0,
      
      confidenceScore: 98, // Very high confidence for Bloomberg
      staleness: 0,
      
      providerId: 'bloomberg_api',
      tier: 1,
      originalData: data
    };
  }

  private normalizeGenericData(data: any, providerId: string): UniversalMarketData {
    const provider = this.providers.get(providerId);
    const confidence = provider?.type === 'tier1' ? 90 : 
                      provider?.type === 'tier2' ? 75 : 60;

    return {
      symbol: data.symbol,
      timestamp: data.timestamp || Date.now(),
      source: providerId,
      quality: data.quality || 'delayed',
      latency: data.latency || 1000,
      
      last: data.last || data.price,
      bid: data.bid || data.last,
      ask: data.ask || data.last,
      open: data.open || data.last,
      high: data.high || data.last,
      low: data.low || data.last,
      close: data.close || data.last,
      previousClose: data.previousClose || data.last,
      
      volume: data.volume || 0,
      bidSize: data.bidSize || 0,
      askSize: data.askSize || 0,
      dailyVolume: data.dailyVolume || data.volume || 0,
      averageVolume: data.averageVolume || 0,
      
      change: data.change || 0,
      changePercent: data.changePercent || 0,
      spread: data.spread || 0,
      spreadBps: 0,
      midPrice: data.midPrice || data.last,
      vwap: data.vwap || data.last,
      
      tradeCount: data.tradeCount || 0,
      uptickVolume: 0,
      downtickVolume: 0,
      
      confidenceScore: confidence,
      staleness: 0,
      
      providerId,
      tier: provider?.type === 'tier1' ? 1 : provider?.type === 'tier2' ? 2 : 3,
      originalData: data
    };
  }

  // Data Processing and Conflation
  private startDataProcessing(): void {
    this.processingTimer = setInterval(() => {
      this.processDataQueue();
    }, 10); // Process every 10ms for low latency

    console.log('⚙️ Data processing started');
  }

  private processDataQueue(): void {
    if (this.dataProcessingQueue.length === 0) return;

    // Sort by priority and timestamp
    this.dataProcessingQueue.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.timestamp - b.timestamp;
    });

    const batchSize = Math.min(100, this.dataProcessingQueue.length);
    const batch = this.dataProcessingQueue.splice(0, batchSize);

    for (const item of batch) {
      try {
        this.processDataItem(item);
      } catch (error) {
        console.error('❌ Error processing data item:', error);
      }
    }
  }

  private processDataItem(item: any): void {
    const { data, provider, symbol } = item;

    // Apply conflation rules
    const conflationRule = this.conflationRules.get(symbol);
    if (conflationRule && this.shouldConflate(symbol, data, conflationRule)) {
      return; // Skip this update due to conflation
    }

    // Check if this is the best available data
    const currentBest = this.marketData.get(symbol);
    if (currentBest && !this.isBetterData(data, currentBest)) {
      return; // Current data is better
    }

    // Update cache
    this.marketData.set(symbol, data);

    // Distribute to subscribers
    this.distributeToSubscribers(data);

    // Update quality metrics
    this.updateDataQuality(provider, symbol, data);
  }

  private shouldConflate(symbol: string, data: UniversalMarketData, rule: any): boolean {
    const lastUpdate = this.marketData.get(symbol);
    if (!lastUpdate) return false;

    const timeSinceLastUpdate = data.timestamp - lastUpdate.timestamp;
    return timeSinceLastUpdate < rule.interval;
  }

  private isBetterData(newData: UniversalMarketData, currentData: UniversalMarketData): boolean {
    // Higher tier providers are generally better
    if (newData.tier !== currentData.tier) {
      return newData.tier < currentData.tier; // Lower tier number = higher tier
    }

    // More recent data is better
    if (Math.abs(newData.timestamp - currentData.timestamp) > 1000) {
      return newData.timestamp > currentData.timestamp;
    }

    // Higher confidence is better
    return newData.confidenceScore > currentData.confidenceScore;
  }

  private distributeToSubscribers(data: UniversalMarketData): void {
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.isActive) continue;
      if (!subscription.symbols.includes(data.symbol)) continue;
      if (!subscription.dataTypes.includes('level1')) continue;

      try {
        subscription.callback(data);
        subscription.lastUpdate = Date.now();
      } catch (error) {
        console.error(`❌ Error in subscription callback for ${subscription.subscriptionId}:`, error);
        subscription.errorCallback(error);
      }
    }
  }

  // Provider Selection and Failover
  private selectOptimalProviders(symbols: string[], dataTypes: string[]): string[] {
    const selectedProviders: string[] = [];
    
    // Get all available providers sorted by priority
    const availableProviders = Array.from(this.providers.values())
      .filter(p => this.isProviderHealthy(p.providerId))
      .sort((a, b) => b.priority - a.priority);

    // For each data type, select the best providers
    for (const dataType of dataTypes) {
      const suitableProviders = availableProviders.filter(p => {
        switch (dataType) {
          case 'level1': return p.capabilities.level1;
          case 'level2': return p.capabilities.level2;
          case 'trades': return p.capabilities.timeAndSales;
          case 'fundamentals': return p.capabilities.fundamentals;
          case 'news': return p.capabilities.news;
          case 'alternative': return p.capabilities.alternativeData;
          default: return true;
        }
      });

      // Add top providers for this data type
      const topProviders = suitableProviders.slice(0, 3).map(p => p.providerId);
      for (const providerId of topProviders) {
        if (!selectedProviders.includes(providerId)) {
          selectedProviders.push(providerId);
        }
      }
    }

    return selectedProviders;
  }

  private setupProviderHierarchy(symbol: string, providers: string[]): void {
    if (providers.length === 0) return;

    // Set primary provider (highest priority)
    const sortedProviders = providers
      .map(id => ({ id, priority: this.providers.get(id)?.priority || 0 }))
      .sort((a, b) => b.priority - a.priority);

    this.primaryProviders.set(symbol, sortedProviders[0].id);
    
    // Set backup providers
    const backups = sortedProviders.slice(1).map(p => p.id);
    this.backupProviders.set(symbol, backups);
  }

  async triggerFailover(symbol: string, failedProvider: string): Promise<void> {
    if (this.failoverInProgress.has(symbol)) {
      return; // Failover already in progress
    }

    console.log(`🔄 Triggering failover for ${symbol} from ${failedProvider}`);
    this.failoverInProgress.add(symbol);

    try {
      const backups = this.backupProviders.get(symbol) || [];
      
      for (const backupProvider of backups) {
        if (this.isProviderHealthy(backupProvider)) {
          console.log(`✅ Failing over ${symbol} to ${backupProvider}`);
          
          // Update primary provider
          this.primaryProviders.set(symbol, backupProvider);
          
          // Remove the failed provider from hierarchy
          const updatedBackups = backups.filter(id => id !== backupProvider);
          this.backupProviders.set(symbol, updatedBackups);
          
          this.performanceMetrics.failoverCount++;
          break;
        }
      }
    } finally {
      this.failoverInProgress.delete(symbol);
    }
  }

  private isProviderHealthy(providerId: string): boolean {
    const health = this.providerHealth.get(providerId);
    if (!health) return false;
    
    const isRecent = Date.now() - health.lastSeen < 60000; // 1 minute
    return health.status === 'online' && isRecent && health.errorCount < 5;
  }

  // Quality Monitoring
  private calculateDataQuality(data: UniversalMarketData, providerId: string): number {
    let score = 100;

    // Latency penalty
    if (data.latency > 1000) score -= 20;
    else if (data.latency > 500) score -= 10;
    else if (data.latency > 100) score -= 5;

    // Staleness penalty
    if (data.staleness > 5) score -= 30;
    else if (data.staleness > 2) score -= 15;
    else if (data.staleness > 1) score -= 5;

    // Provider tier bonus
    const provider = this.providers.get(providerId);
    if (provider?.type === 'tier1') score += 0;
    else if (provider?.type === 'tier2') score -= 5;
    else score -= 15;

    // Data completeness check
    const requiredFields = ['last', 'bid', 'ask', 'volume'];
    const missingFields = requiredFields.filter(field => !data[field as keyof UniversalMarketData]);
    score -= missingFields.length * 10;

    return Math.max(0, Math.min(100, score));
  }

  private startQualityMonitoring(): void {
    setInterval(() => {
      this.updateQualityMetrics();
    }, 60000); // Update every minute

    console.log('📊 Quality monitoring started');
  }

  private updateQualityMetrics(): void {
    for (const [providerId, provider] of this.providers.entries()) {
      const health = this.providerHealth.get(providerId);
      if (!health) continue;

      // Calculate quality metrics for this provider
      const metrics = this.calculateProviderQualityMetrics(providerId);
      this.qualityMetrics.set(providerId, metrics);
    }

    // Update overall system quality score
    const allScores = Array.from(this.qualityMetrics.values()).map(m => m.score);
    this.performanceMetrics.dataQualityScore = allScores.length > 0 
      ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length 
      : 0;
  }

  private calculateProviderQualityMetrics(providerId: string): DataQualityMetrics {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    
    return {
      providerId,
      symbol: 'AGGREGATE',
      period: { start: now - hour, end: now },
      metrics: {
        uptime: this.calculateUptime(providerId, hour),
        latency: this.calculateLatencyMetrics(providerId, hour),
        accuracy: this.calculateAccuracy(providerId, hour),
        completeness: this.calculateCompleteness(providerId, hour),
        timeliness: this.calculateTimeliness(providerId, hour),
        consistency: this.calculateConsistency(providerId, hour)
      },
      issues: this.getRecentIssues(providerId, hour),
      score: this.calculateOverallQualityScore(providerId)
    };
  }

  private calculateUptime(providerId: string, period: number): number {
    const health = this.providerHealth.get(providerId);
    if (!health) return 0;
    
    // Simplified uptime calculation
    return health.status === 'online' ? 99.9 : 85.0;
  }

  private calculateLatencyMetrics(providerId: string, period: number): { average: number; p95: number; p99: number } {
    const health = this.providerHealth.get(providerId);
    const baseLatency = health?.latency || 1000;
    
    return {
      average: baseLatency,
      p95: baseLatency * 1.5,
      p99: baseLatency * 2.0
    };
  }

  private calculateAccuracy(providerId: string, period: number): number {
    // Compare against tier1 providers if this is not tier1
    const provider = this.providers.get(providerId);
    return provider?.type === 'tier1' ? 99.5 : 
           provider?.type === 'tier2' ? 98.0 : 95.0;
  }

  private calculateCompleteness(providerId: string, period: number): number {
    // Percentage of expected data points received
    const provider = this.providers.get(providerId);
    return provider?.type === 'tier1' ? 99.8 : 
           provider?.type === 'tier2' ? 99.0 : 97.0;
  }

  private calculateTimeliness(providerId: string, period: number): number {
    // Percentage of updates received within SLA
    const provider = this.providers.get(providerId);
    const health = this.providerHealth.get(providerId);
    
    if (!provider || !health) return 0;
    
    return health.latency <= provider.latency.sla ? 99.0 : 85.0;
  }

  private calculateConsistency(providerId: string, period: number): number {
    // Data consistency with other providers
    return 98.5; // Simplified metric
  }

  private getRecentIssues(providerId: string, period: number): DataQualityMetrics['issues'] {
    // Mock issues for demonstration
    const health = this.providerHealth.get(providerId);
    if (!health || health.errorCount === 0) return [];
    
    return [{
      type: 'delay',
      timestamp: Date.now() - 300000, // 5 minutes ago
      duration: 120000, // 2 minutes
      impact: 'medium',
      description: 'Temporary latency spike detected'
    }];
  }

  private calculateOverallQualityScore(providerId: string): number {
    const metrics = this.qualityMetrics.get(providerId);
    if (!metrics) return 0;
    
    const weights = {
      uptime: 0.3,
      accuracy: 0.25,
      timeliness: 0.2,
      completeness: 0.15,
      consistency: 0.1
    };
    
    return (
      metrics.metrics.uptime * weights.uptime +
      metrics.metrics.accuracy * weights.accuracy +
      metrics.metrics.timeliness * weights.timeliness +
      metrics.metrics.completeness * weights.completeness +
      metrics.metrics.consistency * weights.consistency
    );
  }

  // Health Monitoring
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds

    console.log('💓 Provider health monitoring started');
  }

  private async performHealthChecks(): Promise<void> {
    for (const [providerId, connection] of this.connections.entries()) {
      try {
        const startTime = Date.now();
        
        // Simple connectivity check
        const isConnected = connection.isConnected || false;
        const latency = Date.now() - startTime;
        
        const health = this.providerHealth.get(providerId);
        if (health) {
          health.status = isConnected ? 'online' : 'offline';
          health.lastSeen = Date.now();
          health.latency = latency;
          
          if (!isConnected) {
            health.errorCount++;
          } else {
            health.errorCount = Math.max(0, health.errorCount - 1);
          }
        }
      } catch (error) {
        console.error(`❌ Health check failed for ${providerId}:`, error);
        const health = this.providerHealth.get(providerId);
        if (health) {
          health.status = 'offline';
          health.errorCount++;
        }
      }
    }
  }

  // Mock Data Generation (for demonstration)
  private generateMockData(symbol: string, providerId: string, quality: string): UniversalMarketData {
    const basePrice = 100 + (symbol.charCodeAt(0) % 50);
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility * basePrice;
    
    const last = basePrice + change;
    const spread = basePrice * 0.0001; // 1 basis point
    
    return {
      symbol,
      timestamp: Date.now(),
      source: providerId,
      quality: quality as any,
      latency: Math.random() * 100,
      
      last,
      bid: last - spread / 2,
      ask: last + spread / 2,
      open: basePrice,
      high: last + Math.random() * 2,
      low: last - Math.random() * 2,
      close: last,
      previousClose: basePrice,
      
      volume: Math.floor(Math.random() * 1000000),
      bidSize: Math.floor(Math.random() * 10000),
      askSize: Math.floor(Math.random() * 10000),
      dailyVolume: Math.floor(Math.random() * 10000000),
      averageVolume: Math.floor(Math.random() * 5000000),
      
      change: change,
      changePercent: (change / basePrice) * 100,
      spread: spread,
      spreadBps: (spread / last) * 10000,
      midPrice: last,
      vwap: last + (Math.random() - 0.5) * 0.5,
      
      tradeCount: Math.floor(Math.random() * 1000),
      uptickVolume: Math.floor(Math.random() * 500000),
      downtickVolume: Math.floor(Math.random() * 500000),
      
      confidenceScore: 85 + Math.random() * 15,
      staleness: Math.random() * 2,
      
      providerId,
      tier: providerId.includes('bloomberg') || providerId.includes('reuters') ? 1 : 2,
      originalData: { mockData: true }
    };
  }

  private generateMockLevel2(symbol: string, providerId: string): Level2OrderBook {
    const basePrice = 100 + (symbol.charCodeAt(0) % 50);
    const levels = 10;
    
    const bids = [];
    const asks = [];
    
    for (let i = 0; i < levels; i++) {
      bids.push({
        price: basePrice - (i + 1) * 0.01,
        size: Math.floor(Math.random() * 10000),
        orders: Math.floor(Math.random() * 50) + 1
      });
      
      asks.push({
        price: basePrice + (i + 1) * 0.01,
        size: Math.floor(Math.random() * 10000),
        orders: Math.floor(Math.random() * 50) + 1
      });
    }
    
    return {
      symbol,
      timestamp: Date.now(),
      source: providerId,
      bids,
      asks,
      depth: levels,
      spread: asks[0].price - bids[0].price,
      imbalance: (bids[0].size - asks[0].size) / (bids[0].size + asks[0].size),
      quality: 95
    };
  }

  private generateMockFundamentals(symbol: string, providerId: string): FundamentalData {
    return {
      symbol,
      timestamp: Date.now(),
      source: providerId,
      company: {
        name: `${symbol} Corporation`,
        sector: 'Technology',
        industry: 'Software',
        country: 'US',
        currency: 'USD',
        marketCap: Math.random() * 1000000000000, // Random market cap
        employees: Math.floor(Math.random() * 100000)
      },
      financials: {
        revenue: Math.random() * 100000000000,
        netIncome: Math.random() * 10000000000,
        eps: Math.random() * 10,
        peRatio: 15 + Math.random() * 20,
        pbRatio: 1 + Math.random() * 5,
        dividendYield: Math.random() * 5,
        debtToEquity: Math.random() * 2,
        roe: Math.random() * 25,
        roa: Math.random() * 15
      },
      estimates: {
        epsEstimate: Math.random() * 12,
        revenueEstimate: Math.random() * 120000000000,
        targetPrice: 100 + Math.random() * 50,
        recommendation: ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell'][Math.floor(Math.random() * 5)] as any,
        analystCount: Math.floor(Math.random() * 30) + 5
      },
      lastUpdated: Date.now()
    };
  }

  private generateMockAlternativeData(symbol: string, dataType: string): AlternativeData {
    return {
      symbol,
      timestamp: Date.now(),
      source: `${dataType}_provider`,
      dataType: dataType as any,
      data: {
        value: Math.random() * 100,
        unit: dataType === 'satellite' ? 'parking_spots' : 'sentiment_score',
        confidence: 70 + Math.random() * 30,
        trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as any,
        significance: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        description: `${dataType} data analysis for ${symbol}`
      },
      processingTime: Math.random() * 5000,
      validityPeriod: 24 * 60 * 60 * 1000 // 24 hours
    };
  }

  // Utility Methods
  private passesFilters(data: UniversalMarketData, filters: DataSubscription['filters']): boolean {
    if (filters.minVolume && data.volume < filters.minVolume) return false;
    if (filters.minPrice && data.last < filters.minPrice) return false;
    if (filters.maxPrice && data.last > filters.maxPrice) return false;
    return true;
  }

  private getProviderPriority(providerId: string): number {
    return this.providers.get(providerId)?.priority || 0;
  }

  private updatePerformanceMetrics(providerId: string, processingTime: number): void {
    this.performanceMetrics.totalUpdates++;
    this.performanceMetrics.averageLatency = 
      (this.performanceMetrics.averageLatency * 0.99) + (processingTime * 0.01);
    this.performanceMetrics.lastUpdateTime = Date.now();
    
    // Calculate updates per second
    const now = Date.now();
    if (now - this.performanceMetrics.lastUpdateTime > 1000) {
      this.performanceMetrics.updatesPerSecond = this.performanceMetrics.totalUpdates;
      this.performanceMetrics.totalUpdates = 0;
    }
  }

  private updateDataQuality(providerId: string, symbol: string, data: UniversalMarketData): void {
    // Update provider-specific quality metrics
    const health = this.providerHealth.get(providerId);
    if (health) {
      health.lastSeen = Date.now();
      if (data.confidenceScore > 80) {
        health.errorCount = Math.max(0, health.errorCount - 1);
      }
    }
  }

  private async cleanupUnusedProviderSubscriptions(): Promise<void> {
    // Clean up provider subscriptions that are no longer needed
    // This would involve checking which symbols are still subscribed
    // and removing subscriptions for symbols with no active subscribers
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private initializeDefaultProviders(): void {
    // Reuters Eikon
    this.providers.set('reuters_eikon', {
      providerId: 'reuters_eikon',
      name: 'Reuters Eikon',
      type: 'tier1',
      priority: 100,
      credentials: {
        endpoint: 'https://api.refinitiv.com/eikon',
        apiKey: process.env.REUTERS_API_KEY || 'demo_key'
      },
      capabilities: {
        realTimeData: true,
        historicalData: true,
        level1: true,
        level2: true,
        timeAndSales: true,
        fundamentals: true,
        news: true,
        analytics: true,
        alternativeData: false
      },
      limits: {
        requestsPerSecond: 1000,
        requestsPerDay: 1000000,
        symbolsPerRequest: 100,
        historicalDays: 3650
      },
      latency: { expected: 50, sla: 100 },
      costs: { monthlyFee: 25000, perRequestCost: 0.001, perSymbolCost: 1.0, dataDelayCost: 0.5 }
    });

    // Bloomberg API
    this.providers.set('bloomberg_api', {
      providerId: 'bloomberg_api',
      name: 'Bloomberg Terminal API',
      type: 'tier1',
      priority: 95,
      credentials: {
        endpoint: 'https://api.bloomberg.com/blpapi',
        username: process.env.BLOOMBERG_USER || 'demo_user'
      },
      capabilities: {
        realTimeData: true,
        historicalData: true,
        level1: true,
        level2: true,
        timeAndSales: true,
        fundamentals: true,
        news: true,
        analytics: true,
        alternativeData: true
      },
      limits: {
        requestsPerSecond: 2000,
        requestsPerDay: 2000000,
        symbolsPerRequest: 200,
        historicalDays: 10000
      },
      latency: { expected: 30, sla: 75 },
      costs: { monthlyFee: 35000, perRequestCost: 0.0008, perSymbolCost: 1.5, dataDelayCost: 0.3 }
    });

    // Polygon.io
    this.providers.set('polygon_io', {
      providerId: 'polygon_io',
      name: 'Polygon.io',
      type: 'tier2',
      priority: 70,
      credentials: {
        endpoint: 'https://api.polygon.io',
        apiKey: process.env.POLYGON_API_KEY || 'demo_key'
      },
      capabilities: {
        realTimeData: true,
        historicalData: true,
        level1: true,
        level2: false,
        timeAndSales: true,
        fundamentals: true,
        news: true,
        analytics: false,
        alternativeData: false
      },
      limits: {
        requestsPerSecond: 5,
        requestsPerDay: 50000,
        symbolsPerRequest: 1,
        historicalDays: 730
      },
      latency: { expected: 500, sla: 1000 },
      costs: { monthlyFee: 200, perRequestCost: 0.01, perSymbolCost: 0.1, dataDelayCost: 0.05 }
    });

    console.log(`📡 Initialized ${this.providers.size} default data providers`);
  }

  // Public API
  getProviders(): DataProviderConfig[] {
    return Array.from(this.providers.values());
  }

  getProviderHealth(): Map<string, any> {
    return new Map(this.providerHealth);
  }

  getQualityMetrics(): Map<string, DataQualityMetrics> {
    return new Map(this.qualityMetrics);
  }

  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  getLatestData(symbol: string): UniversalMarketData | undefined {
    return this.marketData.get(symbol);
  }

  getAllLatestData(): Map<string, UniversalMarketData> {
    return new Map(this.marketData);
  }

  getSubscriptions(): DataSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Enterprise Market Data Aggregator...');

    // Stop processing
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }

    // Disconnect all providers
    for (const [providerId, connection] of this.connections.entries()) {
      try {
        if (connection.disconnect) {
          await connection.disconnect();
        }
      } catch (error) {
        console.error(`❌ Error disconnecting ${providerId}:`, error);
      }
    }

    // Clear all data
    this.providers.clear();
    this.connections.clear();
    this.subscriptions.clear();
    this.marketData.clear();
    this.orderBooks.clear();
    this.fundamentalData.clear();
    this.alternativeData.clear();
    this.qualityMetrics.clear();
    this.providerHealth.clear();
    this.dataProcessingQueue = [];

    console.log('✅ Enterprise Market Data Aggregator shutdown complete');
  }
}