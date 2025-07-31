import { UnifiedBrokerAPI, UnifiedOrder, UnifiedPosition, BrokerConfig } from '../brokers/UnifiedBrokerAPI';

interface OrderStrategy {
  strategyId: string;
  name: string;
  type: 'TWAP' | 'VWAP' | 'Iceberg' | 'Sniper' | 'Momentum' | 'Mean_Reversion' | 'Arbitrage' | 'Custom';
  parameters: {
    timeHorizon?: number; // milliseconds
    sliceSize?: number; // percentage of total order
    priceImprovement?: number; // basis points
    maxSpread?: number; // basis points
    aggressiveness?: 'passive' | 'neutral' | 'aggressive';
    adaptation?: boolean; // adapt to market conditions
    darkPool?: boolean; // prefer dark pools
    hiddenSize?: number; // percentage to hide
    [key: string]: any;
  };
  conditions?: {
    minVolume?: number;
    maxVolatility?: number;
    timeWindows?: Array<{ start: string; end: string }>;
    marketRegimes?: string[];
  };
}

interface ExecutionPlan {
  planId: string;
  parentOrderId: string;
  strategy: OrderStrategy;
  childOrders: Array<{
    orderId: string;
    brokerId: string;
    sequence: number;
    quantity: number;
    timing: number; // execution timestamp
    conditions?: string[];
    status: 'pending' | 'ready' | 'executed' | 'cancelled' | 'failed';
  }>;
  progress: {
    totalQuantity: number;
    executedQuantity: number;
    remainingQuantity: number;
    averagePrice: number;
    totalSlippage: number;
    executionTime: number;
  };
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

interface SmartRoutingRule {
  ruleId: string;
  name: string;
  priority: number;
  conditions: {
    symbol?: string[];
    orderSize?: { min?: number; max?: number };
    timeOfDay?: { start: string; end: string };
    marketVolatility?: { min?: number; max?: number };
    spread?: { max: number };
  };
  routing: {
    primaryBroker: string;
    fallbackBrokers: string[];
    allocation?: { [brokerId: string]: number }; // percentage
    maxBrokers?: number;
  };
  isActive: boolean;
}

interface OrderBook {
  symbol: string;
  timestamp: number;
  bids: Array<{ price: number; size: number; broker: string }>;
  asks: Array<{ price: number; size: number; broker: string }>;
  spread: number;
  depth: number;
  imbalance: number; // bid/ask imbalance
}

interface MarketImpactModel {
  symbol: string;
  temporaryImpact: {
    linear: number;
    squareRoot: number;
    logarithmic: number;
  };
  permanentImpact: {
    linear: number;
    squareRoot: number;
  };
  volatility: number;
  averageVolume: number;
  lastUpdated: number;
}

interface ExecutionQuality {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  // Execution metrics
  averagePrice: number;
  vwap: number;
  implementation_shortfall: number;
  market_impact: number;
  timing_risk: number;
  opportunity_cost: number;
  // Price benchmarks
  arrival_price: number;
  decision_price: number;
  benchmark_price: number;
  // Slippage analysis
  total_slippage: number;
  market_slippage: number;
  broker_slippage: number;
  // Timing analysis
  order_duration: number;
  fill_rate: number;
  participation_rate: number;
  // Quality scores
  overall_score: number;
  price_improvement: number;
  execution_efficiency: number;
  timestamp: number;
}

export class AdvancedOrderManagementSystem {
  private unifiedBroker: UnifiedBrokerAPI;
  private orderStrategies: Map<string, OrderStrategy> = new Map();
  private executionPlans: Map<string, ExecutionPlan> = new Map();
  private smartRoutingRules: SmartRoutingRule[] = [];
  private orderBooks: Map<string, OrderBook> = new Map();
  private marketImpactModels: Map<string, MarketImpactModel> = new Map();
  private executionQuality: Map<string, ExecutionQuality> = new Map();

  // Active order tracking
  private parentOrders: Map<string, UnifiedOrder> = new Map();
  private childOrders: Map<string, UnifiedOrder> = new Map();
  private orderHierarchy: Map<string, string[]> = new Map(); // parent -> children

  // Execution scheduling
  private executionQueue: Array<{ planId: string; childOrderId: string; scheduledTime: number }> = [];
  private executionTimer?: NodeJS.Timeout;

  // Risk controls
  private positionLimits: Map<string, { maxPosition: number; maxOrderSize: number }> = new Map();
  private riskChecks: Array<(order: UnifiedOrder) => Promise<boolean>> = [];

  // Performance monitoring
  private executionMetrics: {
    totalOrders: number;
    successfulOrders: number;
    averageSlippage: number;
    averageExecutionTime: number;
    qualityScore: number;
  } = {
    totalOrders: 0,
    successfulOrders: 0,
    averageSlippage: 0,
    averageExecutionTime: 0,
    qualityScore: 0
  };

  constructor(unifiedBroker: UnifiedBrokerAPI) {
    this.unifiedBroker = unifiedBroker;
    this.initializeDefaultStrategies();
    this.initializeDefaultRoutingRules();
  }

  async initialize(): Promise<void> {
    console.log('📋 Initializing Advanced Order Management System...');

    // Start execution scheduler
    this.startExecutionScheduler();

    // Initialize market impact models
    await this.initializeMarketImpactModels();

    // Start order book monitoring
    this.startOrderBookMonitoring();

    console.log('✅ Advanced Order Management System initialized');
  }

  // High-level order submission with strategy
  async submitOrderWithStrategy(
    order: Omit<UnifiedOrder, 'orderId' | 'status' | 'createdAt' | 'updatedAt'>,
    strategyId: string,
    customParams?: any
  ): Promise<{ parentOrderId: string; planId: string }> {
    console.log(`📤 Submitting order with strategy: ${strategyId}`);

    const strategy = this.orderStrategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    try {
      // Risk checks
      await this.performRiskChecks(order);

      // Create parent order
      const parentOrderId = this.generateOrderId();
      const parentOrder: UnifiedOrder = {
        ...order,
        orderId: parentOrderId,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      this.parentOrders.set(parentOrderId, parentOrder);

      // Create execution plan
      const executionPlan = await this.createExecutionPlan(parentOrder, strategy, customParams);
      this.executionPlans.set(executionPlan.planId, executionPlan);

      // Start execution
      await this.startExecution(executionPlan.planId);

      console.log(`✅ Order submitted: ${parentOrderId} with plan: ${executionPlan.planId}`);

      return {
        parentOrderId,
        planId: executionPlan.planId
      };

    } catch (error) {
      console.error('❌ Failed to submit order with strategy:', error);
      throw error;
    }
  }

  // Smart order routing for single orders
  async submitOrderWithSmartRouting(
    order: Omit<UnifiedOrder, 'orderId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<UnifiedOrder> {
    console.log(`📤 Submitting order with smart routing: ${order.side} ${order.quantity} ${order.symbol}`);

    try {
      // Find applicable routing rule
      const routingRule = this.findApplicableRoutingRule(order);

      if (routingRule) {
        console.log(`🧠 Applying routing rule: ${routingRule.name}`);
        
        if (routingRule.routing.allocation) {
          // Multi-broker allocation
          return this.executeMultiBrokerOrder(order, routingRule.routing.allocation);
        } else {
          // Single broker with fallback
          return this.executeSingleBrokerOrder(order, routingRule);
        }
      } else {
        // Default smart routing
        return this.executeDefaultSmartRouting(order);
      }

    } catch (error) {
      console.error('❌ Smart routing failed:', error);
      throw error;
    }
  }

  // Execution Strategies Implementation
  private async createExecutionPlan(
    parentOrder: UnifiedOrder,
    strategy: OrderStrategy,
    customParams?: any
  ): Promise<ExecutionPlan> {
    const planId = this.generatePlanId();
    
    console.log(`📋 Creating execution plan: ${planId} for strategy: ${strategy.type}`);

    let childOrders: ExecutionPlan['childOrders'] = [];

    switch (strategy.type) {
      case 'TWAP':
        childOrders = await this.createTWAPExecution(parentOrder, strategy, customParams);
        break;
      case 'VWAP':
        childOrders = await this.createVWAPExecution(parentOrder, strategy, customParams);
        break;
      case 'Iceberg':
        childOrders = await this.createIcebergExecution(parentOrder, strategy, customParams);
        break;
      case 'Sniper':
        childOrders = await this.createSniperExecution(parentOrder, strategy, customParams);
        break;
      case 'Momentum':
        childOrders = await this.createMomentumExecution(parentOrder, strategy, customParams);
        break;
      case 'Mean_Reversion':
        childOrders = await this.createMeanReversionExecution(parentOrder, strategy, customParams);
        break;
      case 'Arbitrage':
        childOrders = await this.createArbitrageExecution(parentOrder, strategy, customParams);
        break;
      default:
        childOrders = await this.createCustomExecution(parentOrder, strategy, customParams);
    }

    const executionPlan: ExecutionPlan = {
      planId,
      parentOrderId: parentOrder.orderId,
      strategy,
      childOrders,
      progress: {
        totalQuantity: parentOrder.quantity,
        executedQuantity: 0,
        remainingQuantity: parentOrder.quantity,
        averagePrice: 0,
        totalSlippage: 0,
        executionTime: 0
      },
      createdAt: Date.now()
    };

    return executionPlan;
  }

  // TWAP (Time-Weighted Average Price) Execution
  private async createTWAPExecution(
    parentOrder: UnifiedOrder,
    strategy: OrderStrategy,
    customParams?: any
  ): Promise<ExecutionPlan['childOrders']> {
    const timeHorizon = strategy.parameters.timeHorizon || 60000; // 1 minute default
    const sliceSize = strategy.parameters.sliceSize || 10; // 10% default
    const numSlices = Math.ceil(100 / sliceSize);
    const timeInterval = timeHorizon / numSlices;
    
    const childOrders: ExecutionPlan['childOrders'] = [];
    let remainingQuantity = parentOrder.quantity;

    for (let i = 0; i < numSlices; i++) {
      const isLastSlice = i === numSlices - 1;
      const quantity = isLastSlice ? remainingQuantity : Math.floor(parentOrder.quantity * (sliceSize / 100));
      
      if (quantity <= 0) break;

      const broker = await this.selectOptimalBroker(parentOrder.symbol);
      
      childOrders.push({
        orderId: this.generateOrderId(),
        brokerId: broker,
        sequence: i,
        quantity,
        timing: Date.now() + (i * timeInterval),
        status: 'pending'
      });

      remainingQuantity -= quantity;
    }

    console.log(`📊 TWAP execution plan: ${childOrders.length} slices over ${timeHorizon}ms`);
    return childOrders;
  }

  // VWAP (Volume-Weighted Average Price) Execution
  private async createVWAPExecution(
    parentOrder: UnifiedOrder,
    strategy: OrderStrategy,
    customParams?: any
  ): Promise<ExecutionPlan['childOrders']> {
    const timeHorizon = strategy.parameters.timeHorizon || 300000; // 5 minutes default
    const historicalVolume = await this.getHistoricalVolumeProfile(parentOrder.symbol, timeHorizon);
    
    const childOrders: ExecutionPlan['childOrders'] = [];
    let remainingQuantity = parentOrder.quantity;
    const totalVolume = historicalVolume.reduce((sum, vol) => sum + vol.volume, 0);

    for (let i = 0; i < historicalVolume.length; i++) {
      const volumePercentage = historicalVolume[i].volume / totalVolume;
      const quantity = Math.floor(parentOrder.quantity * volumePercentage);
      
      if (quantity <= 0) continue;

      const broker = await this.selectOptimalBroker(parentOrder.symbol);
      
      childOrders.push({
        orderId: this.generateOrderId(),
        brokerId: broker,
        sequence: i,
        quantity: Math.min(quantity, remainingQuantity),
        timing: Date.now() + historicalVolume[i].timeOffset,
        status: 'pending'
      });

      remainingQuantity -= Math.min(quantity, remainingQuantity);
      if (remainingQuantity <= 0) break;
    }

    console.log(`📊 VWAP execution plan: ${childOrders.length} volume-based slices`);
    return childOrders;
  }

  // Iceberg Execution (Hide large orders)
  private async createIcebergExecution(
    parentOrder: UnifiedOrder,
    strategy: OrderStrategy,
    customParams?: any
  ): Promise<ExecutionPlan['childOrders']> {
    const visibleSize = strategy.parameters.sliceSize || 5; // 5% visible
    const hiddenSize = strategy.parameters.hiddenSize || 95; // 95% hidden
    const maxSlices = Math.ceil(100 / visibleSize);
    
    const childOrders: ExecutionPlan['childOrders'] = [];
    let remainingQuantity = parentOrder.quantity;

    for (let i = 0; i < maxSlices && remainingQuantity > 0; i++) {
      const quantity = Math.min(
        Math.floor(parentOrder.quantity * (visibleSize / 100)),
        remainingQuantity
      );

      const broker = await this.selectOptimalBroker(parentOrder.symbol);
      
      childOrders.push({
        orderId: this.generateOrderId(),
        brokerId: broker,
        sequence: i,
        quantity,
        timing: Date.now(), // Execute immediately, but reveal gradually
        conditions: [`previous_filled:${i > 0 ? childOrders[i-1].orderId : 'none'}`],
        status: i === 0 ? 'ready' : 'pending'
      });

      remainingQuantity -= quantity;
    }

    console.log(`🧊 Iceberg execution plan: ${childOrders.length} slices, ${visibleSize}% visible`);
    return childOrders;
  }

  // Sniper Execution (Market timing)
  private async createSniperExecution(
    parentOrder: UnifiedOrder,
    strategy: OrderStrategy,
    customParams?: any
  ): Promise<ExecutionPlan['childOrders']> {
    const aggressiveness = strategy.parameters.aggressiveness || 'neutral';
    const priceImprovement = strategy.parameters.priceImprovement || 10; // basis points
    
    const broker = await this.selectOptimalBroker(parentOrder.symbol);
    
    const childOrders: ExecutionPlan['childOrders'] = [{
      orderId: this.generateOrderId(),
      brokerId: broker,
      sequence: 0,
      quantity: parentOrder.quantity,
      timing: Date.now(),
      conditions: [
        `spread_below:${strategy.parameters.maxSpread || 50}`,
        `price_improvement:${priceImprovement}`,
        `aggressiveness:${aggressiveness}`
      ],
      status: 'ready'
    }];

    console.log(`🎯 Sniper execution plan: Single precision execution`);
    return childOrders;
  }

  // Momentum Execution
  private async createMomentumExecution(
    parentOrder: UnifiedOrder,
    strategy: OrderStrategy,
    customParams?: any
  ): Promise<ExecutionPlan['childOrders']> {
    const momentumThreshold = strategy.parameters.momentumThreshold || 0.001; // 0.1%
    const accelerationFactor = strategy.parameters.accelerationFactor || 1.5;
    
    const broker = await this.selectOptimalBroker(parentOrder.symbol);
    
    const childOrders: ExecutionPlan['childOrders'] = [{
      orderId: this.generateOrderId(),
      brokerId: broker,
      sequence: 0,
      quantity: parentOrder.quantity,
      timing: Date.now(),
      conditions: [
        `momentum_above:${momentumThreshold}`,
        `acceleration:${accelerationFactor}`,
        `trend_confirmation:true`
      ],
      status: 'pending'
    }];

    console.log(`🚀 Momentum execution plan: Trend-following execution`);
    return childOrders;
  }

  // Mean Reversion Execution
  private async createMeanReversionExecution(
    parentOrder: UnifiedOrder,
    strategy: OrderStrategy,
    customParams?: any
  ): Promise<ExecutionPlan['childOrders']> {
    const deviationThreshold = strategy.parameters.deviationThreshold || 2; // 2 standard deviations
    const reversionTarget = strategy.parameters.reversionTarget || 0.5; // 50% reversion
    
    const broker = await this.selectOptimalBroker(parentOrder.symbol);
    
    const childOrders: ExecutionPlan['childOrders'] = [{
      orderId: this.generateOrderId(),
      brokerId: broker,
      sequence: 0,
      quantity: parentOrder.quantity,
      timing: Date.now(),
      conditions: [
        `deviation_above:${deviationThreshold}`,
        `reversion_target:${reversionTarget}`,
        `oversold_rsi:true`
      ],
      status: 'pending'
    }];

    console.log(`🔄 Mean reversion execution plan: Counter-trend execution`);
    return childOrders;
  }

  // Arbitrage Execution
  private async createArbitrageExecution(
    parentOrder: UnifiedOrder,
    strategy: OrderStrategy,
    customParams?: any
  ): Promise<ExecutionPlan['childOrders']> {
    const minArbitrageSpread = strategy.parameters.minSpread || 10; // basis points
    const brokers = await this.getBestArbitrageBrokers(parentOrder.symbol);
    
    if (brokers.length < 2) {
      throw new Error('Insufficient brokers for arbitrage execution');
    }

    const childOrders: ExecutionPlan['childOrders'] = [
      {
        orderId: this.generateOrderId(),
        brokerId: brokers[0].brokerId, // Buy side
        sequence: 0,
        quantity: parentOrder.quantity,
        timing: Date.now(),
        conditions: [`arbitrage_spread_above:${minArbitrageSpread}`],
        status: 'ready'
      },
      {
        orderId: this.generateOrderId(),
        brokerId: brokers[1].brokerId, // Sell side
        sequence: 1,
        quantity: parentOrder.quantity,
        timing: Date.now(),
        conditions: [`arbitrage_spread_above:${minArbitrageSpread}`],
        status: 'ready'
      }
    ];

    console.log(`⚖️ Arbitrage execution plan: Cross-broker arbitrage`);
    return childOrders;
  }

  // Custom Execution
  private async createCustomExecution(
    parentOrder: UnifiedOrder,
    strategy: OrderStrategy,
    customParams?: any
  ): Promise<ExecutionPlan['childOrders']> {
    // Implement custom execution logic based on strategy parameters
    const broker = await this.selectOptimalBroker(parentOrder.symbol);
    
    const childOrders: ExecutionPlan['childOrders'] = [{
      orderId: this.generateOrderId(),
      brokerId: broker,
      sequence: 0,
      quantity: parentOrder.quantity,
      timing: Date.now(),
      status: 'ready'
    }];

    console.log(`⚙️ Custom execution plan: User-defined strategy`);
    return childOrders;
  }

  // Execution Management
  private async startExecution(planId: string): Promise<void> {
    const plan = this.executionPlans.get(planId);
    if (!plan) {
      throw new Error(`Execution plan ${planId} not found`);
    }

    console.log(`▶️ Starting execution plan: ${planId}`);

    plan.startedAt = Date.now();

    // Schedule child orders
    for (const childOrder of plan.childOrders) {
      if (childOrder.status === 'ready') {
        this.scheduleChildOrder(planId, childOrder.orderId, childOrder.timing);
      }
    }

    this.executionPlans.set(planId, plan);
  }

  private scheduleChildOrder(planId: string, childOrderId: string, scheduledTime: number): void {
    this.executionQueue.push({ planId, childOrderId, scheduledTime });
    this.executionQueue.sort((a, b) => a.scheduledTime - b.scheduledTime);
  }

  private startExecutionScheduler(): void {
    this.executionTimer = setInterval(() => {
      this.processExecutionQueue();
    }, 100); // Check every 100ms for precise timing

    console.log('⏰ Execution scheduler started');
  }

  private async processExecutionQueue(): Promise<void> {
    const now = Date.now();
    
    while (this.executionQueue.length > 0 && this.executionQueue[0].scheduledTime <= now) {
      const { planId, childOrderId } = this.executionQueue.shift()!;
      
      try {
        await this.executeChildOrder(planId, childOrderId);
      } catch (error) {
        console.error(`❌ Failed to execute child order ${childOrderId}:`, error);
      }
    }
  }

  private async executeChildOrder(planId: string, childOrderId: string): Promise<void> {
    const plan = this.executionPlans.get(planId);
    if (!plan) return;

    const childOrderInfo = plan.childOrders.find(co => co.orderId === childOrderId);
    if (!childOrderInfo) return;

    const parentOrder = this.parentOrders.get(plan.parentOrderId);
    if (!parentOrder) return;

    console.log(`⚡ Executing child order: ${childOrderId}`);

    try {
      // Check conditions
      if (childOrderInfo.conditions) {
        const conditionsMet = await this.checkExecutionConditions(childOrderInfo.conditions, parentOrder.symbol);
        if (!conditionsMet) {
          console.log(`⏸️ Execution conditions not met for ${childOrderId}`);
          // Reschedule for later
          this.scheduleChildOrder(planId, childOrderId, Date.now() + 5000);
          return;
        }
      }

      // Create child order
      const childOrder: Omit<UnifiedOrder, 'orderId' | 'status' | 'createdAt' | 'updatedAt'> = {
        brokerId: childOrderInfo.brokerId,
        symbol: parentOrder.symbol,
        side: parentOrder.side,
        type: parentOrder.type,
        quantity: childOrderInfo.quantity,
        price: parentOrder.price,
        stopPrice: parentOrder.stopPrice,
        timeInForce: parentOrder.timeInForce,
        metadata: {
          ...parentOrder.metadata,
          parentOrderId: parentOrder.orderId,
          planId: planId,
          sequence: childOrderInfo.sequence.toString()
        }
      };

      // Execute via unified broker
      const executedOrder = await this.unifiedBroker.placeOrder(childOrder, childOrderInfo.brokerId);
      
      // Store child order
      this.childOrders.set(executedOrder.orderId, executedOrder);
      
      // Update order hierarchy
      const children = this.orderHierarchy.get(parentOrder.orderId) || [];
      children.push(executedOrder.orderId);
      this.orderHierarchy.set(parentOrder.orderId, children);

      // Update execution plan
      childOrderInfo.status = 'executed';
      plan.progress.executedQuantity += childOrderInfo.quantity;
      plan.progress.remainingQuantity -= childOrderInfo.quantity;

      // Check if execution is complete
      if (plan.progress.remainingQuantity <= 0) {
        plan.completedAt = Date.now();
        await this.completeExecution(planId);
      }

      this.executionPlans.set(planId, plan);

      console.log(`✅ Child order executed: ${executedOrder.orderId}`);

    } catch (error) {
      console.error(`❌ Failed to execute child order ${childOrderId}:`, error);
      childOrderInfo.status = 'failed';
      this.executionPlans.set(planId, plan);
    }
  }

  private async completeExecution(planId: string): Promise<void> {
    const plan = this.executionPlans.get(planId);
    if (!plan) return;

    console.log(`🏁 Execution plan completed: ${planId}`);

    // Calculate execution quality
    const quality = await this.calculateExecutionQuality(planId);
    this.executionQuality.set(planId, quality);

    // Update parent order status
    const parentOrder = this.parentOrders.get(plan.parentOrderId);
    if (parentOrder) {
      parentOrder.status = 'filled';
      parentOrder.updatedAt = Date.now();
      this.parentOrders.set(plan.parentOrderId, parentOrder);
    }

    // Update metrics
    this.updateExecutionMetrics(quality);
  }

  // Smart Routing Implementation
  private findApplicableRoutingRule(order: any): SmartRoutingRule | null {
    const applicableRules = this.smartRoutingRules
      .filter(rule => rule.isActive && this.isRuleApplicable(rule, order))
      .sort((a, b) => b.priority - a.priority);

    return applicableRules[0] || null;
  }

  private isRuleApplicable(rule: SmartRoutingRule, order: any): boolean {
    const conditions = rule.conditions;

    // Symbol check
    if (conditions.symbol && !conditions.symbol.includes(order.symbol)) {
      return false;
    }

    // Order size check
    if (conditions.orderSize) {
      if (conditions.orderSize.min && order.quantity < conditions.orderSize.min) return false;
      if (conditions.orderSize.max && order.quantity > conditions.orderSize.max) return false;
    }

    // Time of day check
    if (conditions.timeOfDay) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = conditions.timeOfDay.start.split(':').map(Number);
      const [endHour, endMin] = conditions.timeOfDay.end.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      
      if (currentTime < startTime || currentTime > endTime) return false;
    }

    return true;
  }

  private async executeMultiBrokerOrder(
    order: any,
    allocation: { [brokerId: string]: number }
  ): Promise<UnifiedOrder> {
    console.log(`🌐 Executing multi-broker order with ${Object.keys(allocation).length} brokers`);

    const orders = await this.unifiedBroker.placeOrderAcrossMultipleBrokers(order, allocation);
    
    // Return the first order as primary (could be enhanced to return a composite order)
    return orders[0];
  }

  private async executeSingleBrokerOrder(
    order: any,
    routingRule: SmartRoutingRule
  ): Promise<UnifiedOrder> {
    console.log(`🎯 Executing single broker order on ${routingRule.routing.primaryBroker}`);

    try {
      return await this.unifiedBroker.placeOrder(order, routingRule.routing.primaryBroker);
    } catch (error) {
      console.log(`⚠️ Primary broker failed, trying fallback brokers`);
      
      for (const fallbackBroker of routingRule.routing.fallbackBrokers) {
        try {
          return await this.unifiedBroker.placeOrder(order, fallbackBroker);
        } catch (fallbackError) {
          console.log(`❌ Fallback broker ${fallbackBroker} failed`);
          continue;
        }
      }
      
      throw error; // All brokers failed
    }
  }

  private async executeDefaultSmartRouting(order: any): Promise<UnifiedOrder> {
    console.log(`🤖 Executing default smart routing`);
    
    // Use unified broker's built-in smart routing
    return this.unifiedBroker.placeOrder(order);
  }

  // Market Analysis and Support Functions
  private async selectOptimalBroker(symbol: string): Promise<string> {
    // Get market data from all brokers
    const marketData = await this.unifiedBroker.getMarketData(symbol);
    
    if (marketData.length === 0) {
      throw new Error(`No market data available for ${symbol}`);
    }

    // Find broker with best spread
    let bestBroker = marketData[0].brokerId;
    let bestSpread = marketData[0].spread;

    for (const data of marketData) {
      if (data.spread < bestSpread) {
        bestSpread = data.spread;
        bestBroker = data.brokerId;
      }
    }

    return bestBroker;
  }

  private async getHistoricalVolumeProfile(symbol: string, timeHorizon: number): Promise<Array<{ timeOffset: number; volume: number }>> {
    // Mock implementation - in production, this would fetch real volume data
    const numIntervals = 20;
    const intervalDuration = timeHorizon / numIntervals;
    
    const volumeProfile = [];
    for (let i = 0; i < numIntervals; i++) {
      volumeProfile.push({
        timeOffset: i * intervalDuration,
        volume: Math.random() * 1000000 + 100000 // Random volume
      });
    }

    return volumeProfile;
  }

  private async getBestArbitrageBrokers(symbol: string): Promise<Array<{ brokerId: string; price: number; side: 'buy' | 'sell' }>> {
    const marketData = await this.unifiedBroker.getMarketData(symbol);
    
    if (marketData.length < 2) {
      return [];
    }

    // Find best bid and ask across brokers
    let bestBid = { brokerId: '', price: 0 };
    let bestAsk = { brokerId: '', price: Infinity };

    for (const data of marketData) {
      if (data.bid > bestBid.price) {
        bestBid = { brokerId: data.brokerId, price: data.bid };
      }
      if (data.ask < bestAsk.price) {
        bestAsk = { brokerId: data.brokerId, price: data.ask };
      }
    }

    return [
      { brokerId: bestAsk.brokerId, price: bestAsk.price, side: 'buy' },
      { brokerId: bestBid.brokerId, price: bestBid.price, side: 'sell' }
    ];
  }

  private async checkExecutionConditions(conditions: string[], symbol: string): Promise<boolean> {
    for (const condition of conditions) {
      const [type, value] = condition.split(':');
      
      switch (type) {
        case 'spread_below':
          const marketData = await this.unifiedBroker.getMarketData(symbol);
          const avgSpread = marketData.reduce((sum, data) => sum + data.spread, 0) / marketData.length;
          if (avgSpread >= parseFloat(value)) return false;
          break;
          
        case 'momentum_above':
          // Check momentum indicator
          const momentum = await this.calculateMomentum(symbol);
          if (momentum < parseFloat(value)) return false;
          break;
          
        case 'previous_filled':
          if (value !== 'none') {
            const prevOrder = this.childOrders.get(value);
            if (!prevOrder || prevOrder.status !== 'filled') return false;
          }
          break;
          
        // Add more condition types as needed
      }
    }

    return true;
  }

  private async calculateMomentum(symbol: string): Promise<number> {
    // Mock momentum calculation
    return Math.random() * 0.002; // Random momentum between 0-0.2%
  }

  // Risk Management
  private async performRiskChecks(order: any): Promise<void> {
    // Position limit check
    const positionLimit = this.positionLimits.get(order.symbol);
    if (positionLimit) {
      const currentPositions = await this.unifiedBroker.getPositions({ symbol: order.symbol });
      const currentSize = currentPositions.reduce((sum, pos) => sum + pos.quantity, 0);
      
      if (currentSize + order.quantity > positionLimit.maxPosition) {
        throw new Error(`Order exceeds position limit for ${order.symbol}`);
      }
      
      if (order.quantity > positionLimit.maxOrderSize) {
        throw new Error(`Order size exceeds limit for ${order.symbol}`);
      }
    }

    // Custom risk checks
    for (const riskCheck of this.riskChecks) {
      const passed = await riskCheck(order);
      if (!passed) {
        throw new Error('Custom risk check failed');
      }
    }
  }

  // Execution Quality Analysis
  private async calculateExecutionQuality(planId: string): Promise<ExecutionQuality> {
    const plan = this.executionPlans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const parentOrder = this.parentOrders.get(plan.parentOrderId);
    if (!parentOrder) {
      throw new Error(`Parent order ${plan.parentOrderId} not found`);
    }

    // Get all executed child orders
    const executedChildren = plan.childOrders
      .filter(co => co.status === 'executed')
      .map(co => this.childOrders.get(co.orderId))
      .filter(Boolean) as UnifiedOrder[];

    if (executedChildren.length === 0) {
      throw new Error('No executed child orders found');
    }

    // Calculate weighted average price
    let totalValue = 0;
    let totalQuantity = 0;
    
    for (const childOrder of executedChildren) {
      const fillPrice = childOrder.metadata?.fillPrice || childOrder.price || 0;
      totalValue += fillPrice * childOrder.quantity;
      totalQuantity += childOrder.quantity;
    }

    const averagePrice = totalValue / totalQuantity;
    
    // Get benchmark prices (mock implementation)
    const arrivalPrice = parentOrder.price || averagePrice;
    const vwap = await this.getVWAP(parentOrder.symbol, plan.createdAt, plan.completedAt || Date.now());
    
    // Calculate slippage
    const side = parentOrder.side;
    const totalSlippage = side === 'buy' 
      ? (averagePrice - arrivalPrice) / arrivalPrice
      : (arrivalPrice - averagePrice) / arrivalPrice;

    // Calculate implementation shortfall
    const implementation_shortfall = totalSlippage * totalQuantity * arrivalPrice;

    // Calculate quality scores
    const overall_score = Math.max(0, 100 - Math.abs(totalSlippage * 10000)); // Convert to basis points
    
    const executionQuality: ExecutionQuality = {
      orderId: parentOrder.orderId,
      symbol: parentOrder.symbol,
      side: parentOrder.side,
      quantity: totalQuantity,
      averagePrice,
      vwap,
      implementation_shortfall,
      market_impact: Math.abs(totalSlippage) * 0.6, // Estimate 60% of slippage is market impact
      timing_risk: Math.abs(totalSlippage) * 0.3, // Estimate 30% is timing risk
      opportunity_cost: Math.abs(totalSlippage) * 0.1, // Estimate 10% is opportunity cost
      arrival_price: arrivalPrice,
      decision_price: arrivalPrice,
      benchmark_price: vwap,
      total_slippage: totalSlippage,
      market_slippage: totalSlippage * 0.7,
      broker_slippage: totalSlippage * 0.3,
      order_duration: (plan.completedAt || Date.now()) - plan.createdAt,
      fill_rate: (totalQuantity / parentOrder.quantity) * 100,
      participation_rate: 10, // Mock participation rate
      overall_score,
      price_improvement: Math.max(0, -totalSlippage * 10000), // Positive slippage is improvement
      execution_efficiency: overall_score,
      timestamp: Date.now()
    };

    return executionQuality;
  }

  private async getVWAP(symbol: string, startTime: number, endTime: number): Promise<number> {
    // Mock VWAP calculation
    const marketData = await this.unifiedBroker.getMarketData(symbol);
    return marketData.length > 0 ? marketData[0].midPrice : 1.0;
  }

  private updateExecutionMetrics(quality: ExecutionQuality): void {
    this.executionMetrics.totalOrders++;
    if (quality.overall_score > 80) {
      this.executionMetrics.successfulOrders++;
    }

    // Update running averages
    const total = this.executionMetrics.totalOrders;
    this.executionMetrics.averageSlippage = 
      (this.executionMetrics.averageSlippage * (total - 1) + Math.abs(quality.total_slippage)) / total;
    this.executionMetrics.averageExecutionTime = 
      (this.executionMetrics.averageExecutionTime * (total - 1) + quality.order_duration) / total;
    this.executionMetrics.qualityScore = 
      (this.executionMetrics.qualityScore * (total - 1) + quality.overall_score) / total;
  }

  // Order Book Management
  private startOrderBookMonitoring(): void {
    // Monitor order books for all symbols
    setInterval(async () => {
      await this.updateOrderBooks();
    }, 1000); // Update every second

    console.log('📚 Order book monitoring started');
  }

  private async updateOrderBooks(): Promise<void> {
    const symbols = ['EURUSD', 'GBPUSD', 'USDJPY']; // Example symbols
    
    for (const symbol of symbols) {
      try {
        const marketData = await this.unifiedBroker.getMarketData(symbol);
        
        const bids: Array<{ price: number; size: number; broker: string }> = [];
        const asks: Array<{ price: number; size: number; broker: string }> = [];
        
        for (const data of marketData) {
          bids.push({ price: data.bid, size: data.bidSize, broker: data.brokerId });
          asks.push({ price: data.ask, size: data.askSize, broker: data.brokerId });
        }
        
        // Sort bids (highest first) and asks (lowest first)
        bids.sort((a, b) => b.price - a.price);
        asks.sort((a, b) => a.price - b.price);
        
        const orderBook: OrderBook = {
          symbol,
          timestamp: Date.now(),
          bids: bids.slice(0, 10), // Top 10 levels
          asks: asks.slice(0, 10),
          spread: asks[0]?.price - bids[0]?.price || 0,
          depth: bids.reduce((sum, bid) => sum + bid.size, 0) + asks.reduce((sum, ask) => sum + ask.size, 0),
          imbalance: bids.reduce((sum, bid) => sum + bid.size, 0) / asks.reduce((sum, ask) => sum + ask.size, 0)
        };
        
        this.orderBooks.set(symbol, orderBook);
        
      } catch (error) {
        console.error(`❌ Failed to update order book for ${symbol}:`, error);
      }
    }
  }

  // Initialization Methods
  private initializeDefaultStrategies(): void {
    // TWAP Strategy
    this.orderStrategies.set('twap_default', {
      strategyId: 'twap_default',
      name: 'Time-Weighted Average Price',
      type: 'TWAP',
      parameters: {
        timeHorizon: 300000, // 5 minutes
        sliceSize: 10, // 10% per slice
        aggressiveness: 'neutral'
      }
    });

    // VWAP Strategy
    this.orderStrategies.set('vwap_default', {
      strategyId: 'vwap_default',
      name: 'Volume-Weighted Average Price',
      type: 'VWAP',
      parameters: {
        timeHorizon: 600000, // 10 minutes
        adaptation: true
      }
    });

    // Iceberg Strategy
    this.orderStrategies.set('iceberg_default', {
      strategyId: 'iceberg_default',
      name: 'Iceberg Order',
      type: 'Iceberg',
      parameters: {
        sliceSize: 5, // 5% visible
        hiddenSize: 95 // 95% hidden
      }
    });

    // Sniper Strategy
    this.orderStrategies.set('sniper_default', {
      strategyId: 'sniper_default',
      name: 'Market Sniper',
      type: 'Sniper',
      parameters: {
        aggressiveness: 'aggressive',
        priceImprovement: 5, // 5 basis points
        maxSpread: 20 // 20 basis points
      }
    });

    console.log(`📋 Initialized ${this.orderStrategies.size} default strategies`);
  }

  private initializeDefaultRoutingRules(): void {
    // Large order routing
    this.smartRoutingRules.push({
      ruleId: 'large_order_routing',
      name: 'Large Order Smart Routing',
      priority: 100,
      conditions: {
        orderSize: { min: 100000 }
      },
      routing: {
        primaryBroker: 'oanda',
        fallbackBrokers: ['ic_markets'],
        allocation: {
          'oanda': 60,
          'ic_markets': 40
        },
        maxBrokers: 2
      },
      isActive: true
    });

    // Small order routing
    this.smartRoutingRules.push({
      ruleId: 'small_order_routing',
      name: 'Small Order Fast Execution',
      priority: 50,
      conditions: {
        orderSize: { max: 10000 }
      },
      routing: {
        primaryBroker: 'ic_markets',
        fallbackBrokers: ['oanda'],
        maxBrokers: 1
      },
      isActive: true
    });

    console.log(`🧠 Initialized ${this.smartRoutingRules.length} smart routing rules`);
  }

  private async initializeMarketImpactModels(): Promise<void> {
    const symbols = ['EURUSD', 'GBPUSD', 'USDJPY'];
    
    for (const symbol of symbols) {
      const model: MarketImpactModel = {
        symbol,
        temporaryImpact: {
          linear: 0.001,
          squareRoot: 0.0005,
          logarithmic: 0.0002
        },
        permanentImpact: {
          linear: 0.0005,
          squareRoot: 0.0002
        },
        volatility: 0.01,
        averageVolume: 1000000,
        lastUpdated: Date.now()
      };
      
      this.marketImpactModels.set(symbol, model);
    }

    console.log(`📊 Initialized market impact models for ${symbols.length} symbols`);
  }

  // Utility Methods
  private generateOrderId(): string {
    return `ord_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  // Public API
  getOrderStrategies(): OrderStrategy[] {
    return Array.from(this.orderStrategies.values());
  }

  getExecutionPlan(planId: string): ExecutionPlan | undefined {
    return this.executionPlans.get(planId);
  }

  getExecutionQuality(orderId: string): ExecutionQuality | undefined {
    return this.executionQuality.get(orderId);
  }

  getExecutionMetrics() {
    return { ...this.executionMetrics };
  }

  getOrderBook(symbol: string): OrderBook | undefined {
    return this.orderBooks.get(symbol);
  }

  addOrderStrategy(strategy: OrderStrategy): void {
    this.orderStrategies.set(strategy.strategyId, strategy);
  }

  addSmartRoutingRule(rule: SmartRoutingRule): void {
    this.smartRoutingRules.push(rule);
    this.smartRoutingRules.sort((a, b) => b.priority - a.priority);
  }

  addRiskCheck(riskCheck: (order: UnifiedOrder) => Promise<boolean>): void {
    this.riskChecks.push(riskCheck);
  }

  setPositionLimit(symbol: string, maxPosition: number, maxOrderSize: number): void {
    this.positionLimits.set(symbol, { maxPosition, maxOrderSize });
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Advanced Order Management System...');

    if (this.executionTimer) {
      clearInterval(this.executionTimer);
    }

    this.orderStrategies.clear();
    this.executionPlans.clear();
    this.parentOrders.clear();
    this.childOrders.clear();
    this.orderHierarchy.clear();
    this.executionQueue = [];

    console.log('✅ Advanced Order Management System shutdown complete');
  }
}