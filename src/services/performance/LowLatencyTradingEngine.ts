interface Order {
  orderId: string;
  userId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  orderType: 'market' | 'limit' | 'stop' | 'stop_limit';
  price?: number;
  stopPrice?: number;
  timeInForce: 'GTC' | 'IOC' | 'FOK' | 'DAY';
  timestamp: number;
  priority: number;
  metadata?: { [key: string]: any };
}

interface OrderExecution {
  orderId: string;
  executionId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
  latency: number;
  venue: string;
  executionType: 'full' | 'partial';
  remainingQuantity: number;
  commission: number;
  slippage: number;
}

interface MarketData {
  symbol: string;
  timestamp: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  lastPrice: number;
  lastSize: number;
  volume: number;
  vwap: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
}

interface OrderBook {
  symbol: string;
  timestamp: number;
  bids: Array<{ price: number; size: number; orders: number }>;
  asks: Array<{ price: number; size: number; orders: number }>;
  sequence: number;
}

interface LatencyMetrics {
  orderSubmissionLatency: number;
  marketDataLatency: number;
  executionLatency: number;
  totalRoundTripLatency: number;
  networkLatency: number;
  processingLatency: number;
  lastUpdated: number;
}

interface TradingVenue {
  venueId: string;
  name: string;
  type: 'primary' | 'dark_pool' | 'ecn' | 'alternative';
  latency: number;
  isActive: boolean;
  supportedSymbols: string[];
  fees: { [orderType: string]: number };
  minOrderSize: number;
  maxOrderSize: number;
  connectionStatus: 'connected' | 'disconnected' | 'degraded';
}

interface SmartOrderRoutingConfig {
  enableSmartRouting: boolean;
  venuePreferences: { [venueId: string]: number }; // 0-1 score
  latencyThresholds: { [venueId: string]: number };
  costOptimization: boolean;
  darkPoolPreference: number; // 0-1, higher = prefer dark pools
  minimizeMarketImpact: boolean;
  maxVenuesPerOrder: number;
}

interface NetworkOptimizationConfig {
  enableMulticast: boolean;
  enableKernel_bypass: boolean;
  tcpBufferSize: number;
  tcpNoDelay: boolean;
  enableBatching: boolean;
  batchSize: number;
  batchTimeout: number;
  enableCompression: boolean;
  heartbeatInterval: number;
}

export class LowLatencyTradingEngine {
  private activeOrders: Map<string, Order> = new Map();
  private executionHistory: Map<string, OrderExecution[]> = new Map();
  private marketData: Map<string, MarketData> = new Map();
  private orderBooks: Map<string, OrderBook> = new Map();
  private tradingVenues: Map<string, TradingVenue> = new Map();
  private latencyMetrics: LatencyMetrics;
  private smartRoutingConfig: SmartOrderRoutingConfig;
  private networkConfig: NetworkOptimizationConfig;
  private isRunning = false;
  private messageQueue: any[] = [];
  private highFrequencyTimer?: NodeJS.Timeout;
  private latencyMonitorTimer?: NodeJS.Timeout;

  // High-performance arrays for fast access
  private priceBuffer: Float64Array = new Float64Array(10000);
  private timestampBuffer: Uint32Array = new Uint32Array(10000);
  private bufferIndex = 0;

  // Connection pooling
  private connectionPool: Map<string, WebSocket> = new Map();
  private connectionStats: Map<string, { sent: number; received: number; errors: number }> = new Map();

  constructor(
    smartRoutingConfig?: Partial<SmartOrderRoutingConfig>,
    networkConfig?: Partial<NetworkOptimizationConfig>
  ) {
    this.smartRoutingConfig = {
      enableSmartRouting: true,
      venuePreferences: {},
      latencyThresholds: {},
      costOptimization: true,
      darkPoolPreference: 0.3,
      minimizeMarketImpact: true,
      maxVenuesPerOrder: 3,
      ...smartRoutingConfig
    };

    this.networkConfig = {
      enableMulticast: true,
      enableKernel_bypass: false,
      tcpBufferSize: 65536,
      tcpNoDelay: true,
      enableBatching: true,
      batchSize: 100,
      batchTimeout: 1, // 1ms
      enableCompression: false,
      heartbeatInterval: 1000,
      ...networkConfig
    };

    this.latencyMetrics = this.initializeLatencyMetrics();
  }

  async initialize(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Low-latency Trading Engine already running');
      return;
    }

    console.log('⚡ Initializing Low-latency Trading Engine...');

    try {
      // Initialize trading venues
      await this.initializeTradingVenues();

      // Establish connections to venues
      await this.establishVenueConnections();

      // Start market data feeds
      this.startMarketDataFeeds();

      // Start high-frequency processing
      this.startHighFrequencyProcessing();

      // Start latency monitoring
      this.startLatencyMonitoring();

      // Initialize network optimizations
      this.initializeNetworkOptimizations();

      this.isRunning = true;
      console.log('✅ Low-latency Trading Engine initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Low-latency Trading Engine:', error);
      throw error;
    }
  }

  async submitOrder(order: Omit<Order, 'orderId' | 'timestamp' | 'priority'>): Promise<string> {
    const startTime = performance.now();
    
    const orderId = this.generateOrderId();
    const fullOrder: Order = {
      ...order,
      orderId,
      timestamp: Date.now(),
      priority: this.calculateOrderPriority(order)
    };

    console.log(`📤 Submitting order: ${orderId} (${order.side} ${order.quantity} ${order.symbol})`);

    try {
      // Validate order
      this.validateOrder(fullOrder);

      // Store order
      this.activeOrders.set(orderId, fullOrder);

      // Smart order routing
      const routingDecision = await this.routeOrder(fullOrder);

      // Execute order
      const execution = await this.executeOrder(fullOrder, routingDecision);

      // Update latency metrics
      const submissionLatency = performance.now() - startTime;
      this.updateLatencyMetrics('orderSubmission', submissionLatency);

      console.log(`✅ Order submitted successfully: ${orderId} (latency: ${submissionLatency.toFixed(2)}ms)`);

      return orderId;

    } catch (error) {
      console.error(`❌ Order submission failed: ${orderId}`, error);
      this.activeOrders.delete(orderId);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const startTime = performance.now();

    console.log(`🚫 Cancelling order: ${orderId}`);

    const order = this.activeOrders.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    try {
      // Send cancel request to venues
      const venues = this.getOrderVenues(orderId);
      const cancelPromises = venues.map(venue => this.sendCancelRequest(venue, orderId));
      
      await Promise.all(cancelPromises);

      // Remove from active orders
      this.activeOrders.delete(orderId);

      const cancellationLatency = performance.now() - startTime;
      console.log(`✅ Order cancelled successfully: ${orderId} (latency: ${cancellationLatency.toFixed(2)}ms)`);

      return true;

    } catch (error) {
      console.error(`❌ Order cancellation failed: ${orderId}`, error);
      return false;
    }
  }

  async modifyOrder(orderId: string, modifications: Partial<Order>): Promise<boolean> {
    const startTime = performance.now();

    console.log(`✏️ Modifying order: ${orderId}`);

    const order = this.activeOrders.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    try {
      // Create modified order
      const modifiedOrder: Order = { ...order, ...modifications, timestamp: Date.now() };

      // Validate modified order
      this.validateOrder(modifiedOrder);

      // Send modification to venues
      const venues = this.getOrderVenues(orderId);
      const modifyPromises = venues.map(venue => this.sendModifyRequest(venue, modifiedOrder));
      
      await Promise.all(modifyPromises);

      // Update stored order
      this.activeOrders.set(orderId, modifiedOrder);

      const modificationLatency = performance.now() - startTime;
      console.log(`✅ Order modified successfully: ${orderId} (latency: ${modificationLatency.toFixed(2)}ms)`);

      return true;

    } catch (error) {
      console.error(`❌ Order modification failed: ${orderId}`, error);
      return false;
    }
  }

  // Smart Order Routing
  private async routeOrder(order: Order): Promise<{ venue: TradingVenue; allocation: number }[]> {
    if (!this.smartRoutingConfig.enableSmartRouting) {
      // Use primary venue
      const primaryVenue = Array.from(this.tradingVenues.values()).find(v => v.type === 'primary');
      return primaryVenue ? [{ venue: primaryVenue, allocation: 1.0 }] : [];
    }

    console.log(`🧠 Smart routing order: ${order.orderId}`);

    // Get market data for routing decision
    const marketData = this.marketData.get(order.symbol);
    if (!marketData) {
      throw new Error(`No market data available for ${order.symbol}`);
    }

    // Filter available venues
    const availableVenues = Array.from(this.tradingVenues.values())
      .filter(venue => 
        venue.isActive && 
        venue.connectionStatus === 'connected' &&
        venue.supportedSymbols.includes(order.symbol) &&
        order.quantity >= venue.minOrderSize &&
        order.quantity <= venue.maxOrderSize
      );

    if (availableVenues.length === 0) {
      throw new Error(`No available venues for ${order.symbol}`);
    }

    // Score venues based on multiple factors
    const venueScores = availableVenues.map(venue => ({
      venue,
      score: this.calculateVenueScore(venue, order, marketData)
    }));

    // Sort by score (highest first)
    venueScores.sort((a, b) => b.score - a.score);

    // Allocate order across top venues
    const allocations: { venue: TradingVenue; allocation: number }[] = [];
    const maxVenues = Math.min(this.smartRoutingConfig.maxVenuesPerOrder, venueScores.length);

    if (order.quantity <= 1000 || !this.smartRoutingConfig.minimizeMarketImpact) {
      // Small order - send to best venue
      allocations.push({ venue: venueScores[0].venue, allocation: 1.0 });
    } else {
      // Large order - split across multiple venues
      const totalScore = venueScores.slice(0, maxVenues).reduce((sum, vs) => sum + vs.score, 0);
      
      for (let i = 0; i < maxVenues; i++) {
        const allocation = venueScores[i].score / totalScore;
        if (allocation > 0.05) { // Minimum 5% allocation
          allocations.push({ venue: venueScores[i].venue, allocation });
        }
      }
    }

    console.log(`📍 Routing decision: ${allocations.length} venues, primary: ${allocations[0].venue.name}`);

    return allocations;
  }

  private calculateVenueScore(venue: TradingVenue, order: Order, marketData: MarketData): number {
    let score = 0;

    // Base preference score
    score += this.smartRoutingConfig.venuePreferences[venue.venueId] || 0.5;

    // Latency factor (lower latency = higher score)
    const latencyScore = Math.max(0, 1 - (venue.latency / 100)); // Normalize to 100ms
    score += latencyScore * 0.3;

    // Cost optimization
    if (this.smartRoutingConfig.costOptimization) {
      const fee = venue.fees[order.orderType] || 0.001;
      const costScore = Math.max(0, 1 - (fee * 1000)); // Normalize fees
      score += costScore * 0.2;
    }

    // Dark pool preference for large orders
    if (venue.type === 'dark_pool' && order.quantity > 5000) {
      score += this.smartRoutingConfig.darkPoolPreference * 0.3;
    }

    // Market impact consideration
    if (this.smartRoutingConfig.minimizeMarketImpact) {
      const spread = marketData.ask - marketData.bid;
      const impactScore = order.quantity < (marketData.bidSize + marketData.askSize) * 0.1 ? 1 : 0.5;
      score += impactScore * 0.2;
    }

    return Math.max(0, Math.min(1, score)); // Clamp to [0, 1]
  }

  // Order execution
  private async executeOrder(
    order: Order, 
    routingDecision: { venue: TradingVenue; allocation: number }[]
  ): Promise<OrderExecution[]> {
    const executions: OrderExecution[] = [];

    console.log(`⚡ Executing order: ${order.orderId} across ${routingDecision.length} venues`);

    // Execute in parallel across venues
    const executionPromises = routingDecision.map(async ({ venue, allocation }) => {
      const quantity = Math.floor(order.quantity * allocation);
      if (quantity === 0) return null;

      const partialOrder: Order = { ...order, quantity };
      return this.executeOrderAtVenue(partialOrder, venue);
    });

    const results = await Promise.all(executionPromises);

    // Collect successful executions
    for (const execution of results) {
      if (execution) {
        executions.push(execution);
      }
    }

    // Store execution history
    this.executionHistory.set(order.orderId, executions);

    return executions;
  }

  private async executeOrderAtVenue(order: Order, venue: TradingVenue): Promise<OrderExecution | null> {
    const startTime = performance.now();

    try {
      // Get current market data
      const marketData = this.marketData.get(order.symbol);
      if (!marketData) {
        throw new Error(`No market data for ${order.symbol}`);
      }

      // Calculate execution price based on order type
      let executionPrice: number;
      let slippage = 0;

      switch (order.orderType) {
        case 'market':
          executionPrice = order.side === 'buy' ? marketData.ask : marketData.bid;
          // Simulate market impact slippage
          const impactFactor = Math.min(order.quantity / (marketData.bidSize + marketData.askSize), 0.1);
          slippage = (marketData.ask - marketData.bid) * impactFactor;
          if (order.side === 'buy') executionPrice += slippage;
          else executionPrice -= slippage;
          break;

        case 'limit':
          if (!order.price) throw new Error('Limit order requires price');
          executionPrice = order.price;
          // Check if limit order can be filled
          if (order.side === 'buy' && order.price < marketData.ask) {
            throw new Error('Limit buy price below market ask');
          }
          if (order.side === 'sell' && order.price > marketData.bid) {
            throw new Error('Limit sell price above market bid');
          }
          break;

        default:
          throw new Error(`Unsupported order type: ${order.orderType}`);
      }

      // Calculate commission
      const commission = (venue.fees[order.orderType] || 0.001) * order.quantity * executionPrice;

      // Create execution
      const execution: OrderExecution = {
        orderId: order.orderId,
        executionId: this.generateExecutionId(),
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        price: executionPrice,
        timestamp: Date.now(),
        latency: performance.now() - startTime,
        venue: venue.venueId,
        executionType: 'full',
        remainingQuantity: 0,
        commission,
        slippage
      };

      // Send execution to venue (simulated)
      await this.sendExecutionToVenue(execution, venue);

      console.log(`⚡ Executed at ${venue.name}: ${order.quantity} ${order.symbol} @ ${executionPrice.toFixed(4)} (${execution.latency.toFixed(2)}ms)`);

      return execution;

    } catch (error) {
      console.error(`❌ Execution failed at ${venue.name}:`, error);
      return null;
    }
  }

  // Market data processing
  private startMarketDataFeeds(): void {
    console.log('📊 Starting market data feeds...');

    // Simulate high-frequency market data updates
    setInterval(() => {
      this.processMarketDataUpdates();
    }, 1); // 1ms intervals for ultra-high frequency

    console.log('✅ Market data feeds started');
  }

  private processMarketDataUpdates(): void {
    // Simulate market data updates
    const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'];
    
    for (const symbol of symbols) {
      const currentData = this.marketData.get(symbol);
      const basePrice = currentData?.lastPrice || 1.0;
      
      // Generate realistic price movement
      const change = (Math.random() - 0.5) * 0.0001; // Small price changes
      const newPrice = basePrice + change;
      const spread = 0.00002; // 0.2 pips spread
      
      const marketData: MarketData = {
        symbol,
        timestamp: Date.now(),
        bid: newPrice - spread / 2,
        ask: newPrice + spread / 2,
        bidSize: Math.floor(Math.random() * 1000000) + 100000,
        askSize: Math.floor(Math.random() * 1000000) + 100000,
        lastPrice: newPrice,
        lastSize: Math.floor(Math.random() * 10000) + 1000,
        volume: (currentData?.volume || 0) + Math.floor(Math.random() * 10000),
        vwap: currentData?.vwap || newPrice,
        high: Math.max(currentData?.high || newPrice, newPrice),
        low: Math.min(currentData?.low || newPrice, newPrice),
        change: change,
        changePercent: (change / basePrice) * 100
      };

      this.marketData.set(symbol, marketData);

      // Update high-performance buffers
      this.updatePriceBuffer(newPrice);
    }
  }

  private updatePriceBuffer(price: number): void {
    this.priceBuffer[this.bufferIndex] = price;
    this.timestampBuffer[this.bufferIndex] = Date.now();
    this.bufferIndex = (this.bufferIndex + 1) % this.priceBuffer.length;
  }

  // High-frequency processing
  private startHighFrequencyProcessing(): void {
    // Ultra-high frequency timer (sub-millisecond if possible)
    this.highFrequencyTimer = setInterval(() => {
      this.processMessageQueue();
      this.updateLatencyMetrics();
    }, 0.1); // 100 microseconds

    console.log('⚡ High-frequency processing started');
  }

  private processMessageQueue(): void {
    // Process batched messages for efficiency
    if (this.messageQueue.length === 0) return;

    const batchSize = Math.min(this.networkConfig.batchSize, this.messageQueue.length);
    const batch = this.messageQueue.splice(0, batchSize);

    for (const message of batch) {
      this.processMessage(message);
    }
  }

  private processMessage(message: any): void {
    // High-speed message processing
    switch (message.type) {
      case 'market_data':
        this.processMarketDataMessage(message);
        break;
      case 'execution_report':
        this.processExecutionReport(message);
        break;
      case 'order_ack':
        this.processOrderAck(message);
        break;
    }
  }

  // Network optimizations
  private initializeNetworkOptimizations(): void {
    console.log('🌐 Initializing network optimizations...');

    // Configure TCP settings (simulated)
    if (this.networkConfig.tcpNoDelay) {
      console.log('✅ TCP_NODELAY enabled');
    }

    if (this.networkConfig.enableBatching) {
      console.log(`✅ Message batching enabled (size: ${this.networkConfig.batchSize})`);
    }

    if (this.networkConfig.enableMulticast) {
      console.log('✅ Multicast enabled for market data');
    }

    console.log('✅ Network optimizations configured');
  }

  // Venue management
  private async initializeTradingVenues(): Promise<void> {
    console.log('🏢 Initializing trading venues...');

    // Primary venues
    this.tradingVenues.set('oanda', {
      venueId: 'oanda',
      name: 'OANDA',
      type: 'primary',
      latency: 2,
      isActive: true,
      supportedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'],
      fees: { market: 0.0001, limit: 0.00008 },
      minOrderSize: 1000,
      maxOrderSize: 10000000,
      connectionStatus: 'connected'
    });

    this.tradingVenues.set('ic_markets', {
      venueId: 'ic_markets',
      name: 'IC Markets',
      type: 'ecn',
      latency: 1.5,
      isActive: true,
      supportedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'],
      fees: { market: 0.00012, limit: 0.0001 },
      minOrderSize: 500,
      maxOrderSize: 5000000,
      connectionStatus: 'connected'
    });

    this.tradingVenues.set('dark_pool_1', {
      venueId: 'dark_pool_1',
      name: 'Institutional Dark Pool',
      type: 'dark_pool',
      latency: 3,
      isActive: true,
      supportedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY'],
      fees: { market: 0.00005, limit: 0.00003 },
      minOrderSize: 100000,
      maxOrderSize: 50000000,
      connectionStatus: 'connected'
    });

    console.log(`✅ Initialized ${this.tradingVenues.size} trading venues`);
  }

  private async establishVenueConnections(): Promise<void> {
    console.log('🔗 Establishing venue connections...');

    const connectionPromises = Array.from(this.tradingVenues.values()).map(async venue => {
      try {
        // Simulate WebSocket connection
        const ws = new WebSocket(`wss://${venue.venueId}.example.com/trading`);
        
        ws.onopen = () => {
          console.log(`✅ Connected to ${venue.name}`);
          venue.connectionStatus = 'connected';
        };

        ws.onclose = () => {
          console.log(`❌ Disconnected from ${venue.name}`);
          venue.connectionStatus = 'disconnected';
        };

        ws.onerror = (error) => {
          console.error(`❌ Connection error to ${venue.name}:`, error);
          venue.connectionStatus = 'degraded';
        };

        this.connectionPool.set(venue.venueId, ws);
        this.connectionStats.set(venue.venueId, { sent: 0, received: 0, errors: 0 });

      } catch (error) {
        console.error(`❌ Failed to connect to ${venue.name}:`, error);
        venue.connectionStatus = 'disconnected';
      }
    });

    await Promise.all(connectionPromises);
    console.log('✅ Venue connections established');
  }

  // Latency monitoring
  private startLatencyMonitoring(): void {
    this.latencyMonitorTimer = setInterval(() => {
      this.measureNetworkLatency();
      this.analyzeLatencyTrends();
    }, 1000); // Every second

    console.log('📊 Latency monitoring started');
  }

  private measureNetworkLatency(): void {
    const startTime = performance.now();
    
    // Simulate ping to venues
    for (const venue of this.tradingVenues.values()) {
      if (venue.connectionStatus === 'connected') {
        // Simulate round-trip time
        setTimeout(() => {
          const latency = performance.now() - startTime;
          venue.latency = latency;
        }, Math.random() * 5);
      }
    }
  }

  private analyzeLatencyTrends(): void {
    const currentMetrics = { ...this.latencyMetrics };
    
    // Calculate moving averages
    const alpha = 0.1; // Exponential smoothing factor
    
    this.latencyMetrics.networkLatency = 
      alpha * currentMetrics.networkLatency + (1 - alpha) * this.latencyMetrics.networkLatency;
    
    this.latencyMetrics.lastUpdated = Date.now();
  }

  private updateLatencyMetrics(type?: string, value?: number): void {
    if (type && value !== undefined) {
      switch (type) {
        case 'orderSubmission':
          this.latencyMetrics.orderSubmissionLatency = value;
          break;
        case 'execution':
          this.latencyMetrics.executionLatency = value;
          break;
        case 'marketData':
          this.latencyMetrics.marketDataLatency = value;
          break;
      }
    }

    // Update total round trip latency
    this.latencyMetrics.totalRoundTripLatency = 
      this.latencyMetrics.orderSubmissionLatency + 
      this.latencyMetrics.executionLatency + 
      this.latencyMetrics.networkLatency;

    this.latencyMetrics.lastUpdated = Date.now();
  }

  // Utility methods
  private validateOrder(order: Order): void {
    if (order.quantity <= 0) {
      throw new Error('Order quantity must be positive');
    }

    if (order.orderType === 'limit' && !order.price) {
      throw new Error('Limit order requires price');
    }

    if (order.orderType === 'stop' && !order.stopPrice) {
      throw new Error('Stop order requires stop price');
    }

    // Additional validations...
  }

  private calculateOrderPriority(order: Omit<Order, 'orderId' | 'timestamp' | 'priority'>): number {
    let priority = 50; // Base priority

    // Time-sensitive orders get higher priority
    if (order.timeInForce === 'IOC' || order.timeInForce === 'FOK') {
      priority += 30;
    }

    // Market orders get higher priority than limit orders
    if (order.orderType === 'market') {
      priority += 20;
    }

    // Large orders get higher priority
    if (order.quantity > 100000) {
      priority += 10;
    }

    return Math.min(100, priority);
  }

  private getOrderVenues(orderId: string): TradingVenue[] {
    // In a real implementation, this would track which venues an order was sent to
    return Array.from(this.tradingVenues.values()).filter(v => v.isActive);
  }

  private async sendCancelRequest(venue: TradingVenue, orderId: string): Promise<void> {
    // Simulate cancel request
    return new Promise(resolve => setTimeout(resolve, venue.latency));
  }

  private async sendModifyRequest(venue: TradingVenue, order: Order): Promise<void> {
    // Simulate modify request
    return new Promise(resolve => setTimeout(resolve, venue.latency));
  }

  private async sendExecutionToVenue(execution: OrderExecution, venue: TradingVenue): Promise<void> {
    // Simulate sending execution to venue
    return new Promise(resolve => setTimeout(resolve, venue.latency));
  }

  private processMarketDataMessage(message: any): void {
    // Process market data update
    const latency = Date.now() - message.timestamp;
    this.updateLatencyMetrics('marketData', latency);
  }

  private processExecutionReport(message: any): void {
    // Process execution report
    console.log(`📈 Execution report: ${message.orderId}`);
  }

  private processOrderAck(message: any): void {
    // Process order acknowledgment
    console.log(`✅ Order acknowledged: ${message.orderId}`);
  }

  private generateOrderId(): string {
    return `ord_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private initializeLatencyMetrics(): LatencyMetrics {
    return {
      orderSubmissionLatency: 0,
      marketDataLatency: 0,
      executionLatency: 0,
      totalRoundTripLatency: 0,
      networkLatency: 0,
      processingLatency: 0,
      lastUpdated: Date.now()
    };
  }

  // Public API
  getLatencyMetrics(): LatencyMetrics {
    return { ...this.latencyMetrics };
  }

  getMarketData(symbol: string): MarketData | undefined {
    return this.marketData.get(symbol);
  }

  getAllMarketData(): { [symbol: string]: MarketData } {
    const result: { [symbol: string]: MarketData } = {};
    for (const [symbol, data] of this.marketData.entries()) {
      result[symbol] = data;
    }
    return result;
  }

  getActiveOrders(): Order[] {
    return Array.from(this.activeOrders.values());
  }

  getExecutionHistory(orderId: string): OrderExecution[] | undefined {
    return this.executionHistory.get(orderId);
  }

  getTradingVenues(): TradingVenue[] {
    return Array.from(this.tradingVenues.values());
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Low-latency Trading Engine...');

    this.isRunning = false;

    // Clear timers
    if (this.highFrequencyTimer) clearInterval(this.highFrequencyTimer);
    if (this.latencyMonitorTimer) clearInterval(this.latencyMonitorTimer);

    // Close venue connections
    for (const ws of this.connectionPool.values()) {
      ws.close();
    }

    // Clear data structures
    this.activeOrders.clear();
    this.executionHistory.clear();
    this.connectionPool.clear();

    console.log('✅ Low-latency Trading Engine shutdown complete');
  }
}