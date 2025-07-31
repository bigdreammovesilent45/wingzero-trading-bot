interface AlgorithmicOrder {
  orderId: string;
  parentOrderId?: string;
  clientOrderId: string;
  accountId: string;
  
  // Order details
  symbol: string;
  side: 'buy' | 'sell';
  totalQuantity: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
  timeInForce: 'DAY' | 'GTC' | 'IOC' | 'FOK';
  
  // Algorithm details
  algorithm: {
    type: 'TWAP' | 'VWAP' | 'Implementation_Shortfall' | 'POV' | 'Iceberg' | 'Sniper' | 'Liquidity_Seeking' | 'Momentum' | 'Mean_Reversion';
    parameters: any; // Algorithm-specific parameters
  };
  
  // Execution schedule
  schedule: {
    startTime: number;
    endTime: number;
    totalDuration: number; // milliseconds
    intervals: number; // number of execution intervals
    intervalDuration: number; // milliseconds per interval
  };
  
  // Child orders
  childOrders: Array<{
    childOrderId: string;
    quantity: number;
    price?: number;
    scheduledTime: number;
    status: 'pending' | 'submitted' | 'filled' | 'cancelled' | 'rejected';
    fillQuantity: number;
    averagePrice: number;
    commission: number;
  }>;
  
  // Execution status
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'failed';
  executedQuantity: number;
  remainingQuantity: number;
  averagePrice: number;
  
  // Performance metrics
  performance: {
    totalExecutionTime: number;
    totalCommission: number;
    totalSlippage: number;
    marketImpact: number;
    implementationShortfall: number;
    volumeParticipation: number;
    priceImprovement: number;
    trackingError: number; // vs benchmark
  };
  
  // Risk controls
  riskControls: {
    maxSlippage: number; // percentage
    maxMarketImpact: number; // percentage
    maxParticipationRate: number; // percentage of volume
    priceDeviation: number; // percentage from reference price
    emergencyStop: boolean;
  };
}

interface MarketData {
  symbol: string;
  timestamp: number;
  
  // Price data
  price: {
    bid: number;
    ask: number;
    last: number;
    open: number;
    high: number;
    low: number;
    close: number;
    vwap: number;
    twap: number;
  };
  
  // Volume data
  volume: {
    total: number;
    bidVolume: number;
    askVolume: number;
    averageVolume: number; // historical average
    volumeProfile: Array<{
      price: number;
      volume: number;
    }>;
  };
  
  // Market microstructure
  microstructure: {
    spreadBps: number; // spread in basis points
    marketDepth: number;
    orderBookImbalance: number; // ratio of bid/ask volumes
    volatility: number;
    momentum: number;
    meanReversion: number;
  };
  
  // Technical indicators
  indicators: {
    rsi: number;
    macd: number;
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
    };
    movingAverages: {
      sma20: number;
      sma50: number;
      ema20: number;
      ema50: number;
    };
  };
}

interface AlgorithmStrategy {
  strategyId: string;
  name: string;
  description: string;
  algorithmType: 'TWAP' | 'VWAP' | 'Implementation_Shortfall' | 'POV' | 'Iceberg' | 'Sniper' | 'Liquidity_Seeking' | 'Momentum' | 'Mean_Reversion';
  
  // Default parameters
  defaultParameters: any;
  
  // Parameter validation
  parameterValidation: {
    required: string[];
    optional: string[];
    ranges: { [key: string]: { min: number; max: number } };
  };
  
  // Risk limits
  riskLimits: {
    maxOrderSize: number;
    maxParticipationRate: number;
    maxSlippage: number;
    maxDuration: number; // milliseconds
  };
  
  // Performance expectations
  expectedPerformance: {
    typicalSlippage: number;
    typicalMarketImpact: number;
    typicalDuration: number;
    successRate: number;
  };
}

interface ExecutionContext {
  orderId: string;
  symbol: string;
  currentMarketData: MarketData;
  
  // Execution state
  state: {
    executedQuantity: number;
    remainingQuantity: number;
    averagePrice: number;
    elapsedTime: number;
    currentInterval: number;
    totalIntervals: number;
  };
  
  // Market conditions
  marketConditions: {
    volatility: 'low' | 'medium' | 'high';
    liquidity: 'poor' | 'adequate' | 'excellent';
    momentum: 'strong_up' | 'weak_up' | 'neutral' | 'weak_down' | 'strong_down';
    spread: 'tight' | 'normal' | 'wide';
    participation: number; // our participation rate so far
  };
  
  // Performance tracking
  performance: {
    priceAtStart: number;
    benchmarkPrice: number; // TWAP, VWAP, etc.
    currentSlippage: number;
    currentMarketImpact: number;
    priceImprovement: number;
  };
  
  // Risk monitoring
  riskMetrics: {
    deviationFromBenchmark: number;
    participationRateViolations: number;
    slippageViolations: number;
    timeViolations: number;
  };
}

export class AlgorithmicTradingEngine {
  private algorithmicOrders: Map<string, AlgorithmicOrder> = new Map();
  private algorithmStrategies: Map<string, AlgorithmStrategy> = new Map();
  private marketData: Map<string, MarketData> = new Map();
  private executionContexts: Map<string, ExecutionContext> = new Map();
  
  // Real-time market data
  private priceHistory: Map<string, Array<{ timestamp: number; price: number; volume: number }>> = new Map();
  private volumeProfiles: Map<string, Array<{ price: number; volume: number }>> = new Map();
  
  // Execution queues
  private pendingOrders: AlgorithmicOrder[] = [];
  private activeExecutions: Map<string, NodeJS.Timeout> = new Map();
  
  // Performance monitoring
  private metrics = {
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    averageSlippage: 0,
    averageMarketImpact: 0,
    averageImplementationShortfall: 0,
    totalVolumeExecuted: 0,
    successRate: 0,
    lastExecution: 0
  };
  
  // Processing timers
  private marketDataTimer?: NodeJS.Timeout;
  private executionTimer?: NodeJS.Timeout;
  private performanceTimer?: NodeJS.Timeout;

  constructor() {
    this.initializeAlgorithmStrategies();
    this.initializeMarketData();
  }

  async initialize(): Promise<void> {
    console.log('🤖 Initializing Algorithmic Trading Engine...');
    
    // Start market data updates
    this.startMarketDataUpdates();
    
    // Start execution engine
    this.startExecutionEngine();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    console.log('✅ Algorithmic Trading Engine initialized');
  }

  // Order Management
  async submitAlgorithmicOrder(orderRequest: Omit<AlgorithmicOrder, 'orderId' | 'childOrders' | 'status' | 'executedQuantity' | 'remainingQuantity' | 'averagePrice' | 'performance'>): Promise<string> {
    const orderId = this.generateOrderId();
    
    // Validate algorithm parameters
    await this.validateAlgorithmParameters(orderRequest.algorithm);
    
    // Calculate execution schedule
    const schedule = await this.calculateExecutionSchedule(orderRequest);
    
    const algorithmicOrder: AlgorithmicOrder = {
      ...orderRequest,
      orderId,
      schedule,
      childOrders: [],
      status: 'pending',
      executedQuantity: 0,
      remainingQuantity: orderRequest.totalQuantity,
      averagePrice: 0,
      performance: {
        totalExecutionTime: 0,
        totalCommission: 0,
        totalSlippage: 0,
        marketImpact: 0,
        implementationShortfall: 0,
        volumeParticipation: 0,
        priceImprovement: 0,
        trackingError: 0
      }
    };

    this.algorithmicOrders.set(orderId, algorithmicOrder);
    this.pendingOrders.push(algorithmicOrder);
    
    // Create execution context
    await this.createExecutionContext(algorithmicOrder);
    
    this.metrics.totalOrders++;
    console.log(`✅ Algorithmic order submitted: ${orderId} (${algorithmicOrder.algorithm.type})`);
    
    return orderId;
  }

  async cancelAlgorithmicOrder(orderId: string): Promise<void> {
    const order = this.algorithmicOrders.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Cancel active execution
    const activeExecution = this.activeExecutions.get(orderId);
    if (activeExecution) {
      clearTimeout(activeExecution);
      this.activeExecutions.delete(orderId);
    }

    // Cancel pending child orders
    for (const childOrder of order.childOrders) {
      if (childOrder.status === 'pending' || childOrder.status === 'submitted') {
        childOrder.status = 'cancelled';
      }
    }

    order.status = 'cancelled';
    this.metrics.cancelledOrders++;
    
    console.log(`✅ Algorithmic order cancelled: ${orderId}`);
  }

  // Algorithm Implementations
  async executeTWAP(order: AlgorithmicOrder): Promise<void> {
    const context = this.executionContexts.get(order.orderId);
    if (!context) return;

    const parameters = order.algorithm.parameters;
    const { intervals, intervalDuration } = order.schedule;
    
    // Calculate quantity per interval
    const quantityPerInterval = Math.floor(order.totalQuantity / intervals);
    let currentInterval = 0;

    console.log(`🕒 Starting TWAP execution for ${order.symbol}: ${order.totalQuantity} shares over ${intervals} intervals`);

    const executeInterval = async () => {
      if (currentInterval >= intervals || order.status !== 'active') {
        await this.completeAlgorithmicOrder(order.orderId);
        return;
      }

      const marketData = this.marketData.get(order.symbol);
      if (!marketData) {
        console.error(`❌ No market data for ${order.symbol}`);
        return;
      }

      // Determine execution quantity for this interval
      let executionQuantity = quantityPerInterval;
      if (currentInterval === intervals - 1) {
        // Last interval: execute remaining quantity
        executionQuantity = order.remainingQuantity;
      }

      // Apply market condition adjustments
      executionQuantity = this.adjustQuantityForMarketConditions(executionQuantity, marketData, parameters);

      // Calculate limit price for execution
      const limitPrice = this.calculateTWAPPrice(marketData, parameters);

      // Submit child order
      await this.submitChildOrder(order, executionQuantity, limitPrice, currentInterval);

      currentInterval++;
      
      // Schedule next interval
      if (currentInterval < intervals && order.status === 'active') {
        const nextExecutionTime = intervalDuration + (Math.random() - 0.5) * parameters.timeRandomization || 0;
        
        const timeout = setTimeout(executeInterval, nextExecutionTime);
        this.activeExecutions.set(order.orderId, timeout);
      }
    };

    // Start execution
    order.status = 'active';
    this.metrics.activeOrders++;
    await executeInterval();
  }

  async executeVWAP(order: AlgorithmicOrder): Promise<void> {
    const context = this.executionContexts.get(order.orderId);
    if (!context) return;

    const parameters = order.algorithm.parameters;
    const { intervals, intervalDuration } = order.schedule;

    console.log(`📊 Starting VWAP execution for ${order.symbol}: ${order.totalQuantity} shares`);

    // Get historical volume profile
    const volumeProfile = await this.getVolumeProfile(order.symbol, parameters.lookbackPeriod || 20);
    
    let currentInterval = 0;

    const executeInterval = async () => {
      if (currentInterval >= intervals || order.status !== 'active') {
        await this.completeAlgorithmicOrder(order.orderId);
        return;
      }

      const marketData = this.marketData.get(order.symbol);
      if (!marketData) return;

      // Calculate expected volume for this interval based on historical profile
      const expectedVolume = this.calculateExpectedVolumeForInterval(volumeProfile, currentInterval, intervals);
      
      // Calculate our participation rate
      const participationRate = Math.min(parameters.maxParticipationRate || 0.2, 0.3);
      
      // Calculate execution quantity based on expected volume and participation rate
      let executionQuantity = Math.floor(expectedVolume * participationRate);
      executionQuantity = Math.min(executionQuantity, order.remainingQuantity);

      // Apply market condition adjustments
      executionQuantity = this.adjustQuantityForMarketConditions(executionQuantity, marketData, parameters);

      // Calculate VWAP-based limit price
      const limitPrice = this.calculateVWAPPrice(marketData, parameters);

      // Submit child order
      await this.submitChildOrder(order, executionQuantity, limitPrice, currentInterval);

      currentInterval++;
      
      // Schedule next interval
      if (currentInterval < intervals && order.status === 'active') {
        const timeout = setTimeout(executeInterval, intervalDuration);
        this.activeExecutions.set(order.orderId, timeout);
      }
    };

    order.status = 'active';
    this.metrics.activeOrders++;
    await executeInterval();
  }

  async executeIcebergOrder(order: AlgorithmicOrder): Promise<void> {
    const parameters = order.algorithm.parameters;
    const clipSize = parameters.clipSize || Math.floor(order.totalQuantity / 10);
    
    console.log(`🧊 Starting Iceberg execution for ${order.symbol}: ${order.totalQuantity} shares (clip size: ${clipSize})`);

    let remainingQuantity = order.totalQuantity;
    let clipNumber = 0;

    const executeClip = async () => {
      if (remainingQuantity <= 0 || order.status !== 'active') {
        await this.completeAlgorithmicOrder(order.orderId);
        return;
      }

      const marketData = this.marketData.get(order.symbol);
      if (!marketData) return;

      // Determine clip quantity
      let currentClipSize = Math.min(clipSize, remainingQuantity);
      
      // Add randomization to clip size to avoid detection
      if (parameters.sizeRandomization) {
        const randomization = 1 + (Math.random() - 0.5) * parameters.sizeRandomization;
        currentClipSize = Math.floor(currentClipSize * randomization);
        currentClipSize = Math.min(currentClipSize, remainingQuantity);
      }

      // Calculate limit price based on market conditions
      const limitPrice = this.calculateIcebergPrice(marketData, parameters);

      // Submit child order for this clip
      await this.submitChildOrder(order, currentClipSize, limitPrice, clipNumber);

      remainingQuantity -= currentClipSize;
      clipNumber++;

      // Wait for some randomized time before next clip
      const waitTime = (parameters.waitTime || 30000) + 
                     (Math.random() - 0.5) * (parameters.timeRandomization || 10000);

      if (remainingQuantity > 0 && order.status === 'active') {
        const timeout = setTimeout(executeClip, waitTime);
        this.activeExecutions.set(order.orderId, timeout);
      }
    };

    order.status = 'active';
    this.metrics.activeOrders++;
    await executeClip();
  }

  async executeImplementationShortfall(order: AlgorithmicOrder): Promise<void> {
    const parameters = order.algorithm.parameters;
    const riskAversion = parameters.riskAversion || 0.5; // 0 = aggressive, 1 = conservative
    
    console.log(`⚡ Starting Implementation Shortfall execution for ${order.symbol}`);

    // Calculate optimal execution rate based on market impact vs timing risk trade-off
    const marketData = this.marketData.get(order.symbol);
    if (!marketData) return;

    const optimalExecutionRate = this.calculateOptimalExecutionRate(order, marketData, riskAversion);
    const totalExecutionTime = order.totalQuantity / optimalExecutionRate;
    
    // Dynamic execution based on market conditions
    let executedQuantity = 0;
    let startTime = Date.now();

    const executeAdaptively = async () => {
      if (executedQuantity >= order.totalQuantity || order.status !== 'active') {
        await this.completeAlgorithmicOrder(order.orderId);
        return;
      }

      const currentMarketData = this.marketData.get(order.symbol);
      if (!currentMarketData) return;

      // Recalculate optimal rate based on current conditions
      const remainingQuantity = order.totalQuantity - executedQuantity;
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(totalExecutionTime - elapsedTime, 60000); // At least 1 minute

      // Adjust execution rate based on price movement and volatility
      let adjustedRate = this.adjustExecutionRateForConditions(
        optimalExecutionRate, 
        currentMarketData, 
        parameters,
        elapsedTime / totalExecutionTime
      );

      const executionQuantity = Math.min(
        Math.floor(adjustedRate * 60000), // Rate per minute
        remainingQuantity
      );

      if (executionQuantity > 0) {
        const limitPrice = this.calculateImplementationShortfallPrice(currentMarketData, parameters);
        await this.submitChildOrder(order, executionQuantity, limitPrice, Math.floor(elapsedTime / 60000));
        executedQuantity += executionQuantity;
      }

      // Schedule next execution
      if (executedQuantity < order.totalQuantity && order.status === 'active') {
        const timeout = setTimeout(executeAdaptively, 60000); // Execute every minute
        this.activeExecutions.set(order.orderId, timeout);
      }
    };

    order.status = 'active';
    this.metrics.activeOrders++;
    await executeAdaptively();
  }

  async executePOV(order: AlgorithmicOrder): Promise<void> {
    const parameters = order.algorithm.parameters;
    const targetParticipationRate = parameters.participationRate || 0.2; // 20% of volume
    
    console.log(`📈 Starting POV execution for ${order.symbol}: ${targetParticipationRate * 100}% participation`);

    let totalVolumeTraded = 0;
    let executedQuantity = 0;

    const executeBasedOnVolume = async () => {
      if (executedQuantity >= order.totalQuantity || order.status !== 'active') {
        await this.completeAlgorithmicOrder(order.orderId);
        return;
      }

      const marketData = this.marketData.get(order.symbol);
      if (!marketData) return;

      // Get recent volume data
      const recentVolume = await this.getRecentVolume(order.symbol, 60000); // Last minute
      totalVolumeTraded += recentVolume;

      // Calculate how much we should have executed based on participation rate
      const targetExecutedQuantity = Math.floor(totalVolumeTraded * targetParticipationRate);
      
      // Calculate quantity to execute now
      let executionQuantity = Math.min(
        targetExecutedQuantity - executedQuantity,
        order.totalQuantity - executedQuantity
      );

      // Apply market condition adjustments
      executionQuantity = this.adjustQuantityForMarketConditions(executionQuantity, marketData, parameters);

      if (executionQuantity > 0) {
        const limitPrice = this.calculatePOVPrice(marketData, parameters);
        await this.submitChildOrder(order, executionQuantity, limitPrice, Math.floor(Date.now() / 60000));
        executedQuantity += executionQuantity;
      }

      // Continue monitoring volume
      if (executedQuantity < order.totalQuantity && order.status === 'active') {
        const timeout = setTimeout(executeBasedOnVolume, 30000); // Check every 30 seconds
        this.activeExecutions.set(order.orderId, timeout);
      }
    };

    order.status = 'active';
    this.metrics.activeOrders++;
    await executeBasedOnVolume();
  }

  // Child Order Management
  private async submitChildOrder(parentOrder: AlgorithmicOrder, quantity: number, limitPrice: number, interval: number): Promise<void> {
    const childOrderId = this.generateChildOrderId();
    
    const childOrder = {
      childOrderId,
      quantity,
      price: limitPrice,
      scheduledTime: Date.now(),
      status: 'pending' as const,
      fillQuantity: 0,
      averagePrice: 0,
      commission: 0
    };

    parentOrder.childOrders.push(childOrder);

    try {
      // Submit to market (mock implementation)
      const execution = await this.executeChildOrder(parentOrder, childOrder);
      
      // Update child order
      childOrder.status = 'filled';
      childOrder.fillQuantity = execution.quantity;
      childOrder.averagePrice = execution.price;
      childOrder.commission = execution.commission;

      // Update parent order
      parentOrder.executedQuantity += execution.quantity;
      parentOrder.remainingQuantity -= execution.quantity;
      
      // Update weighted average price
      const totalValue = parentOrder.averagePrice * (parentOrder.executedQuantity - execution.quantity) + 
                        execution.price * execution.quantity;
      parentOrder.averagePrice = totalValue / parentOrder.executedQuantity;

      // Update performance metrics
      await this.updateOrderPerformance(parentOrder, execution);

      console.log(`✅ Child order executed: ${childOrderId} (${execution.quantity} @ ${execution.price.toFixed(2)})`);

    } catch (error) {
      childOrder.status = 'rejected';
      console.error(`❌ Child order failed: ${childOrderId}`, error);
    }
  }

  private async executeChildOrder(parentOrder: AlgorithmicOrder, childOrder: any): Promise<{ quantity: number; price: number; commission: number }> {
    const marketData = this.marketData.get(parentOrder.symbol);
    if (!marketData) {
      throw new Error('No market data available');
    }

    // Mock execution with realistic slippage and market impact
    const referencePrice = childOrder.price || marketData.price.last;
    const marketImpact = this.calculateMarketImpact(childOrder.quantity, marketData);
    const slippage = (Math.random() - 0.5) * 0.001; // ±0.1% random slippage
    
    const executionPrice = referencePrice * (1 + marketImpact + slippage);
    const commission = childOrder.quantity * 0.005; // $0.005 per share

    // Update market data to reflect our impact
    this.updateMarketDataAfterExecution(parentOrder.symbol, childOrder.quantity, executionPrice);

    return {
      quantity: childOrder.quantity,
      price: executionPrice,
      commission
    };
  }

  // Price Calculation Methods
  private calculateTWAPPrice(marketData: MarketData, parameters: any): number {
    const aggression = parameters.aggression || 0.5; // 0 = passive, 1 = aggressive
    const spread = marketData.price.ask - marketData.price.bid;
    
    // Calculate price between bid and ask based on aggression
    if (parameters.side === 'buy') {
      return marketData.price.bid + spread * aggression;
    } else {
      return marketData.price.ask - spread * aggression;
    }
  }

  private calculateVWAPPrice(marketData: MarketData, parameters: any): number {
    const currentVWAP = marketData.price.vwap;
    const aggression = parameters.aggression || 0.3;
    const spread = marketData.price.ask - marketData.price.bid;
    
    // Price relative to VWAP
    if (parameters.side === 'buy') {
      return Math.min(currentVWAP + spread * aggression, marketData.price.ask);
    } else {
      return Math.max(currentVWAP - spread * aggression, marketData.price.bid);
    }
  }

  private calculateIcebergPrice(marketData: MarketData, parameters: any): number {
    const aggression = parameters.aggression || 0.2; // Icebergs are typically passive
    const spread = marketData.price.ask - marketData.price.bid;
    
    if (parameters.side === 'buy') {
      return marketData.price.bid + spread * aggression;
    } else {
      return marketData.price.ask - spread * aggression;
    }
  }

  private calculateImplementationShortfallPrice(marketData: MarketData, parameters: any): number {
    // More aggressive pricing to minimize timing risk
    const aggression = parameters.currentAggression || 0.6;
    const spread = marketData.price.ask - marketData.price.bid;
    
    if (parameters.side === 'buy') {
      return marketData.price.bid + spread * aggression;
    } else {
      return marketData.price.ask - spread * aggression;
    }
  }

  private calculatePOVPrice(marketData: MarketData, parameters: any): number {
    // Adaptive pricing based on market momentum
    const momentum = marketData.microstructure.momentum;
    let aggression = parameters.aggression || 0.4;
    
    // Adjust aggression based on momentum
    if (momentum > 0.5) aggression *= 1.2; // More aggressive in strong momentum
    if (momentum < -0.5) aggression *= 0.8; // Less aggressive in adverse momentum
    
    const spread = marketData.price.ask - marketData.price.bid;
    
    if (parameters.side === 'buy') {
      return marketData.price.bid + spread * aggression;
    } else {
      return marketData.price.ask - spread * aggression;
    }
  }

  // Market Analysis Methods
  private adjustQuantityForMarketConditions(quantity: number, marketData: MarketData, parameters: any): number {
    let adjustedQuantity = quantity;
    
    // Reduce quantity in high volatility
    if (marketData.microstructure.volatility > 0.02) { // 2% volatility threshold
      adjustedQuantity *= 0.8;
    }
    
    // Reduce quantity in poor liquidity
    if (marketData.microstructure.marketDepth < 10000) {
      adjustedQuantity *= 0.7;
    }
    
    // Increase quantity in very good conditions
    if (marketData.microstructure.volatility < 0.005 && marketData.microstructure.marketDepth > 50000) {
      adjustedQuantity *= 1.2;
    }
    
    return Math.max(1, Math.floor(adjustedQuantity));
  }

  private calculateOptimalExecutionRate(order: AlgorithmicOrder, marketData: MarketData, riskAversion: number): number {
    // Simplified optimal execution rate calculation
    const volatility = marketData.microstructure.volatility;
    const marketImpactCoeff = 0.5; // Market impact coefficient
    const timingRiskCoeff = volatility * riskAversion;
    
    // Optimal rate balances market impact vs timing risk
    const optimalRate = Math.sqrt(timingRiskCoeff / marketImpactCoeff) * order.totalQuantity;
    
    return Math.max(10, Math.min(optimalRate, order.totalQuantity)); // Rate per minute
  }

  private adjustExecutionRateForConditions(baseRate: number, marketData: MarketData, parameters: any, progressRatio: number): number {
    let adjustedRate = baseRate;
    
    // Speed up if we're behind schedule
    if (progressRatio < 0.8) {
      adjustedRate *= 1.3;
    }
    
    // Slow down in high volatility
    if (marketData.microstructure.volatility > 0.02) {
      adjustedRate *= 0.7;
    }
    
    // Adjust for momentum
    const momentum = marketData.microstructure.momentum;
    if (parameters.side === 'buy' && momentum > 0.3) {
      adjustedRate *= 1.2; // Speed up buying in upward momentum
    } else if (parameters.side === 'sell' && momentum < -0.3) {
      adjustedRate *= 1.2; // Speed up selling in downward momentum
    }
    
    return adjustedRate;
  }

  private calculateMarketImpact(quantity: number, marketData: MarketData): number {
    // Square root market impact model
    const averageVolume = marketData.volume.averageVolume;
    const participationRate = quantity / averageVolume;
    
    // Market impact as percentage of spread
    const impactFactor = 0.5 * Math.sqrt(participationRate);
    const spreadImpact = impactFactor * marketData.microstructure.spreadBps / 10000;
    
    return Math.min(spreadImpact, 0.005); // Cap at 0.5%
  }

  // Utility Methods
  private async calculateExecutionSchedule(orderRequest: any): Promise<AlgorithmicOrder['schedule']> {
    const now = Date.now();
    const defaultDuration = 3600000; // 1 hour default
    
    let startTime = orderRequest.startTime || now;
    let endTime = orderRequest.endTime || (startTime + defaultDuration);
    let totalDuration = endTime - startTime;
    
    // Default to 60 intervals (1 per minute for 1 hour)
    let intervals = orderRequest.intervals || Math.min(60, Math.max(10, totalDuration / 60000));
    let intervalDuration = totalDuration / intervals;
    
    return {
      startTime,
      endTime,
      totalDuration,
      intervals,
      intervalDuration
    };
  }

  private async validateAlgorithmParameters(algorithm: AlgorithmicOrder['algorithm']): Promise<void> {
    const strategy = this.algorithmStrategies.get(algorithm.type);
    if (!strategy) {
      throw new Error(`Unknown algorithm type: ${algorithm.type}`);
    }

    // Validate required parameters
    for (const required of strategy.parameterValidation.required) {
      if (!(required in algorithm.parameters)) {
        throw new Error(`Missing required parameter: ${required}`);
      }
    }

    // Validate parameter ranges
    for (const [param, range] of Object.entries(strategy.parameterValidation.ranges)) {
      const value = algorithm.parameters[param];
      if (value !== undefined && (value < range.min || value > range.max)) {
        throw new Error(`Parameter ${param} must be between ${range.min} and ${range.max}`);
      }
    }
  }

  private async createExecutionContext(order: AlgorithmicOrder): Promise<void> {
    const marketData = this.marketData.get(order.symbol);
    if (!marketData) {
      throw new Error(`No market data for symbol: ${order.symbol}`);
    }

    const context: ExecutionContext = {
      orderId: order.orderId,
      symbol: order.symbol,
      currentMarketData: marketData,
      state: {
        executedQuantity: 0,
        remainingQuantity: order.totalQuantity,
        averagePrice: 0,
        elapsedTime: 0,
        currentInterval: 0,
        totalIntervals: order.schedule.intervals
      },
      marketConditions: {
        volatility: this.categorizeVolatility(marketData.microstructure.volatility),
        liquidity: this.categorizeLiquidity(marketData.microstructure.marketDepth),
        momentum: this.categorizeMomentum(marketData.microstructure.momentum),
        spread: this.categorizeSpread(marketData.microstructure.spreadBps),
        participation: 0
      },
      performance: {
        priceAtStart: marketData.price.last,
        benchmarkPrice: marketData.price.vwap,
        currentSlippage: 0,
        currentMarketImpact: 0,
        priceImprovement: 0
      },
      riskMetrics: {
        deviationFromBenchmark: 0,
        participationRateViolations: 0,
        slippageViolations: 0,
        timeViolations: 0
      }
    };

    this.executionContexts.set(order.orderId, context);
  }

  private async updateOrderPerformance(order: AlgorithmicOrder, execution: any): Promise<void> {
    const context = this.executionContexts.get(order.orderId);
    if (!context) return;

    const marketData = this.marketData.get(order.symbol);
    if (!marketData) return;

    // Update slippage
    const referencePrice = marketData.price.vwap;
    const slippage = Math.abs(execution.price - referencePrice) / referencePrice;
    order.performance.totalSlippage += slippage * execution.quantity;

    // Update market impact
    const marketImpact = this.calculateMarketImpact(execution.quantity, marketData);
    order.performance.marketImpact += marketImpact * execution.quantity;

    // Update implementation shortfall
    const implementationShortfall = Math.abs(execution.price - context.performance.priceAtStart) / context.performance.priceAtStart;
    order.performance.implementationShortfall += implementationShortfall * execution.quantity;

    // Update commission
    order.performance.totalCommission += execution.commission;

    // Calculate weighted averages
    if (order.executedQuantity > 0) {
      order.performance.totalSlippage = order.performance.totalSlippage / order.executedQuantity;
      order.performance.marketImpact = order.performance.marketImpact / order.executedQuantity;
      order.performance.implementationShortfall = order.performance.implementationShortfall / order.executedQuantity;
    }
  }

  private async completeAlgorithmicOrder(orderId: string): Promise<void> {
    const order = this.algorithmicOrders.get(orderId);
    if (!order) return;

    order.status = 'completed';
    order.performance.totalExecutionTime = Date.now() - order.schedule.startTime;

    // Clean up
    this.activeExecutions.delete(orderId);
    this.executionContexts.delete(orderId);

    this.metrics.completedOrders++;
    this.metrics.activeOrders--;
    this.metrics.totalVolumeExecuted += order.executedQuantity;

    // Update success rate
    this.metrics.successRate = this.metrics.completedOrders / this.metrics.totalOrders;

    console.log(`✅ Algorithmic order completed: ${orderId} (${order.executedQuantity}/${order.totalQuantity} filled)`);
  }

  // Market Data Methods
  private updateMarketDataAfterExecution(symbol: string, quantity: number, price: number): void {
    const marketData = this.marketData.get(symbol);
    if (!marketData) return;

    // Update last price
    marketData.price.last = price;

    // Update volume
    marketData.volume.total += quantity;

    // Add to price history
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    const history = this.priceHistory.get(symbol)!;
    history.push({ timestamp: Date.now(), price, volume: quantity });

    // Keep only last 1000 entries
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    // Recalculate VWAP
    const recentHistory = history.slice(-100); // Last 100 trades
    let totalValue = 0;
    let totalVolume = 0;
    
    for (const trade of recentHistory) {
      totalValue += trade.price * trade.volume;
      totalVolume += trade.volume;
    }
    
    if (totalVolume > 0) {
      marketData.price.vwap = totalValue / totalVolume;
    }
  }

  private async getVolumeProfile(symbol: string, lookbackDays: number): Promise<Array<{ price: number; volume: number }>> {
    // Mock implementation - would fetch from historical data
    const profile = [];
    const basePrice = this.marketData.get(symbol)?.price.last || 100;
    
    for (let i = 0; i < 20; i++) {
      const price = basePrice * (0.95 + i * 0.005); // Price levels around current price
      const volume = Math.random() * 10000 + 1000; // Random volume
      profile.push({ price, volume });
    }
    
    return profile;
  }

  private calculateExpectedVolumeForInterval(volumeProfile: Array<{ price: number; volume: number }>, currentInterval: number, totalIntervals: number): number {
    // Simplified - assume uniform distribution over time
    const totalVolume = volumeProfile.reduce((sum, entry) => sum + entry.volume, 0);
    return totalVolume / totalIntervals;
  }

  private async getRecentVolume(symbol: string, timeWindow: number): Promise<number> {
    const history = this.priceHistory.get(symbol);
    if (!history) return 0;

    const cutoff = Date.now() - timeWindow;
    return history
      .filter(entry => entry.timestamp > cutoff)
      .reduce((sum, entry) => sum + entry.volume, 0);
  }

  // Categorization Methods
  private categorizeVolatility(volatility: number): 'low' | 'medium' | 'high' {
    if (volatility < 0.01) return 'low';
    if (volatility < 0.03) return 'medium';
    return 'high';
  }

  private categorizeLiquidity(marketDepth: number): 'poor' | 'adequate' | 'excellent' {
    if (marketDepth < 5000) return 'poor';
    if (marketDepth < 20000) return 'adequate';
    return 'excellent';
  }

  private categorizeMomentum(momentum: number): 'strong_up' | 'weak_up' | 'neutral' | 'weak_down' | 'strong_down' {
    if (momentum > 0.5) return 'strong_up';
    if (momentum > 0.1) return 'weak_up';
    if (momentum < -0.5) return 'strong_down';
    if (momentum < -0.1) return 'weak_down';
    return 'neutral';
  }

  private categorizeSpread(spreadBps: number): 'tight' | 'normal' | 'wide' {
    if (spreadBps < 5) return 'tight';
    if (spreadBps < 20) return 'normal';
    return 'wide';
  }

  // Initialization Methods
  private initializeAlgorithmStrategies(): void {
    const strategies: AlgorithmStrategy[] = [
      {
        strategyId: 'TWAP',
        name: 'Time Weighted Average Price',
        description: 'Executes orders evenly over time',
        algorithmType: 'TWAP',
        defaultParameters: {
          intervals: 60,
          aggression: 0.5,
          timeRandomization: 0.1
        },
        parameterValidation: {
          required: ['side'],
          optional: ['intervals', 'aggression', 'timeRandomization'],
          ranges: {
            intervals: { min: 1, max: 1000 },
            aggression: { min: 0, max: 1 },
            timeRandomization: { min: 0, max: 0.5 }
          }
        },
        riskLimits: {
          maxOrderSize: 1000000,
          maxParticipationRate: 1.0,
          maxSlippage: 0.01,
          maxDuration: 86400000 // 24 hours
        },
        expectedPerformance: {
          typicalSlippage: 0.001,
          typicalMarketImpact: 0.0005,
          typicalDuration: 3600000,
          successRate: 0.95
        }
      },
      {
        strategyId: 'VWAP',
        name: 'Volume Weighted Average Price',
        description: 'Executes orders based on historical volume patterns',
        algorithmType: 'VWAP',
        defaultParameters: {
          lookbackPeriod: 20,
          maxParticipationRate: 0.2,
          aggression: 0.3
        },
        parameterValidation: {
          required: ['side'],
          optional: ['lookbackPeriod', 'maxParticipationRate', 'aggression'],
          ranges: {
            lookbackPeriod: { min: 1, max: 100 },
            maxParticipationRate: { min: 0.01, max: 0.5 },
            aggression: { min: 0, max: 1 }
          }
        },
        riskLimits: {
          maxOrderSize: 1000000,
          maxParticipationRate: 0.5,
          maxSlippage: 0.015,
          maxDuration: 86400000
        },
        expectedPerformance: {
          typicalSlippage: 0.0008,
          typicalMarketImpact: 0.0003,
          typicalDuration: 3600000,
          successRate: 0.97
        }
      }
    ];

    for (const strategy of strategies) {
      this.algorithmStrategies.set(strategy.algorithmType, strategy);
    }
  }

  private initializeMarketData(): void {
    // Initialize market data for common symbols
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
    
    for (const symbol of symbols) {
      const basePrice = 100 + Math.random() * 200;
      const spread = basePrice * 0.001; // 0.1% spread
      
      this.marketData.set(symbol, {
        symbol,
        timestamp: Date.now(),
        price: {
          bid: basePrice - spread / 2,
          ask: basePrice + spread / 2,
          last: basePrice,
          open: basePrice * 0.99,
          high: basePrice * 1.02,
          low: basePrice * 0.98,
          close: basePrice,
          vwap: basePrice,
          twap: basePrice
        },
        volume: {
          total: Math.random() * 1000000,
          bidVolume: Math.random() * 500000,
          askVolume: Math.random() * 500000,
          averageVolume: 500000,
          volumeProfile: []
        },
        microstructure: {
          spreadBps: 10,
          marketDepth: 50000,
          orderBookImbalance: 0.5,
          volatility: 0.015,
          momentum: (Math.random() - 0.5) * 0.5,
          meanReversion: Math.random() * 0.3
        },
        indicators: {
          rsi: 45 + Math.random() * 10,
          macd: (Math.random() - 0.5) * 2,
          bollingerBands: {
            upper: basePrice * 1.02,
            middle: basePrice,
            lower: basePrice * 0.98
          },
          movingAverages: {
            sma20: basePrice * 0.995,
            sma50: basePrice * 0.99,
            ema20: basePrice * 0.998,
            ema50: basePrice * 0.992
          }
        }
      });
    }
  }

  private startMarketDataUpdates(): void {
    this.marketDataTimer = setInterval(() => {
      this.updateMarketData();
    }, 1000); // Update every second
  }

  private startExecutionEngine(): void {
    this.executionTimer = setInterval(() => {
      this.processAlgorithmicOrders();
    }, 5000); // Process every 5 seconds
  }

  private startPerformanceMonitoring(): void {
    this.performanceTimer = setInterval(() => {
      this.updatePerformanceMetrics();
    }, 60000); // Update every minute
  }

  private updateMarketData(): void {
    for (const [symbol, data] of this.marketData.entries()) {
      // Simulate price movement
      const change = (Math.random() - 0.5) * 0.002; // ±0.2% change
      data.price.last *= (1 + change);
      data.price.bid = data.price.last - (data.price.ask - data.price.bid) / 2;
      data.price.ask = data.price.last + (data.price.ask - data.price.bid) / 2;
      
      // Update volume
      data.volume.total += Math.random() * 1000;
      
      // Update microstructure
      data.microstructure.volatility = 0.01 + Math.random() * 0.02;
      data.microstructure.momentum = (data.microstructure.momentum * 0.9) + (change * 10);
      
      data.timestamp = Date.now();
    }
  }

  private async processAlgorithmicOrders(): Promise<void> {
    // Start pending orders that are due
    for (const order of this.pendingOrders) {
      if (Date.now() >= order.schedule.startTime) {
        this.pendingOrders.splice(this.pendingOrders.indexOf(order), 1);
        
        try {
          switch (order.algorithm.type) {
            case 'TWAP':
              await this.executeTWAP(order);
              break;
            case 'VWAP':
              await this.executeVWAP(order);
              break;
            case 'Iceberg':
              await this.executeIcebergOrder(order);
              break;
            case 'Implementation_Shortfall':
              await this.executeImplementationShortfall(order);
              break;
            case 'POV':
              await this.executePOV(order);
              break;
            default:
              console.error(`❌ Unknown algorithm type: ${order.algorithm.type}`);
          }
        } catch (error) {
          console.error(`❌ Error executing algorithmic order ${order.orderId}:`, error);
          order.status = 'failed';
        }
      }
    }
  }

  private updatePerformanceMetrics(): void {
    const completedOrders = Array.from(this.algorithmicOrders.values()).filter(o => o.status === 'completed');
    
    if (completedOrders.length > 0) {
      this.metrics.averageSlippage = completedOrders.reduce((sum, o) => sum + o.performance.totalSlippage, 0) / completedOrders.length;
      this.metrics.averageMarketImpact = completedOrders.reduce((sum, o) => sum + o.performance.marketImpact, 0) / completedOrders.length;
      this.metrics.averageImplementationShortfall = completedOrders.reduce((sum, o) => sum + o.performance.implementationShortfall, 0) / completedOrders.length;
    }
    
    this.metrics.lastExecution = Date.now();
  }

  private generateOrderId(): string {
    return `ALGO_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateChildOrderId(): string {
    return `CHILD_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  // Public API
  getAlgorithmicOrder(orderId: string): AlgorithmicOrder | undefined {
    return this.algorithmicOrders.get(orderId);
  }

  getAllOrders(): AlgorithmicOrder[] {
    return Array.from(this.algorithmicOrders.values());
  }

  getActiveOrders(): AlgorithmicOrder[] {
    return Array.from(this.algorithmicOrders.values()).filter(o => o.status === 'active');
  }

  getAlgorithmStrategies(): AlgorithmStrategy[] {
    return Array.from(this.algorithmStrategies.values());
  }

  getMarketData(symbol: string): MarketData | undefined {
    return this.marketData.get(symbol);
  }

  getExecutionContext(orderId: string): ExecutionContext | undefined {
    return this.executionContexts.get(orderId);
  }

  getMetrics() {
    return { ...this.metrics };
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Algorithmic Trading Engine...');
    
    // Cancel all active orders
    for (const [orderId, timeout] of this.activeExecutions.entries()) {
      clearTimeout(timeout);
      await this.cancelAlgorithmicOrder(orderId);
    }
    
    // Clear timers
    if (this.marketDataTimer) clearInterval(this.marketDataTimer);
    if (this.executionTimer) clearInterval(this.executionTimer);
    if (this.performanceTimer) clearInterval(this.performanceTimer);
    
    // Clear data
    this.algorithmicOrders.clear();
    this.algorithmStrategies.clear();
    this.marketData.clear();
    this.executionContexts.clear();
    this.priceHistory.clear();
    this.volumeProfiles.clear();
    this.pendingOrders.length = 0;
    this.activeExecutions.clear();
    
    console.log('✅ Algorithmic Trading Engine shutdown complete');
  }
}