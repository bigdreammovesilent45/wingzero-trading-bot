interface PrimeBroker {
  brokerId: string;
  name: string;
  type: 'prime' | 'executing' | 'clearing' | 'custody';
  region: 'US' | 'EU' | 'APAC' | 'GLOBAL';
  
  // Connection details
  connection: {
    apiEndpoint: string;
    fixEndpoint?: string;
    webSocketEndpoint?: string;
    isConnected: boolean;
    lastHeartbeat: number;
    latency: number; // milliseconds
    uptime: number; // percentage
  };
  
  // Capabilities
  capabilities: {
    instruments: string[]; // Supported instruments
    currencies: string[]; // Supported currencies
    orderTypes: string[]; // Supported order types
    maxOrderSize: number;
    maxPositionSize: number;
    supportsFIX: boolean;
    supportsAlgorithms: boolean;
    supportsDMA: boolean; // Direct Market Access
    supportsSTP: boolean; // Straight Through Processing
  };
  
  // Costs and fees
  pricing: {
    commissionRate: number; // per share/lot
    spreadMarkup: number; // basis points
    financingRate: number; // overnight rate
    clearingFee: number;
    regulatoryFees: number;
    volumeDiscounts: Array<{
      minVolume: number;
      discount: number;
    }>;
  };
  
  // Risk and limits
  limits: {
    maxDailyVolume: number;
    maxPositionValue: number;
    maxLeverage: number;
    riskLimits: {
      var95: number;
      concentrationLimit: number;
      sectorLimit: number;
    };
    creditLimit: number;
    marginRequirement: number;
  };
  
  // Performance metrics
  performance: {
    averageFillRate: number; // percentage
    averageLatency: number; // milliseconds
    rejectRate: number; // percentage
    uptimeToday: number; // percentage
    volumeToday: number;
    pnlToday: number;
  };
  
  // Settlement and custody
  settlement: {
    settlementCycle: number; // T+N days
    supportedCustodians: string[];
    clearingHouses: string[];
    defaultCustodian: string;
  };
}

interface ClientAccount {
  accountId: string;
  clientId: string;
  accountType: 'individual' | 'corporate' | 'institutional' | 'fund';
  
  // Account details
  details: {
    name: string;
    legalEntity: string;
    jurisdiction: string;
    baseCurrency: string;
    accountingMethod: 'FIFO' | 'LIFO' | 'WAC'; // Weighted Average Cost
    reportingCurrency: string;
  };
  
  // Prime broker assignments
  primeAssignments: Array<{
    brokerId: string;
    allocation: number; // percentage
    priority: number; // 1 = highest
    instruments: string[]; // specific instruments for this broker
    maxAllocation: number; // maximum percentage
  }>;
  
  // Account balances
  balances: {
    cash: { [currency: string]: number };
    securities: { [instrument: string]: number };
    margin: {
      initial: number;
      maintenance: number;
      available: number;
      used: number;
    };
  };
  
  // Risk profile
  riskProfile: {
    maxPositionSize: number;
    maxDailyVolume: number;
    maxDrawdown: number;
    allowedInstruments: string[];
    restrictedInstruments: string[];
    riskClass: 'conservative' | 'moderate' | 'aggressive';
  };
}

interface NetPosition {
  symbol: string;
  netQuantity: number;
  grossLong: number;
  grossShort: number;
  
  // Breakdown by broker
  brokerPositions: Array<{
    brokerId: string;
    quantity: number;
    averagePrice: number;
    unrealizedPnL: number;
    marketValue: number;
  }>;
  
  // Risk metrics
  risk: {
    deltaEquivalent: number;
    gamma: number;
    vega: number;
    theta: number;
    var95: number;
    notionalValue: number;
  };
  
  // P&L breakdown
  pnl: {
    realizedPnL: number;
    unrealizedPnL: number;
    totalPnL: number;
    pnlByBroker: { [brokerId: string]: number };
  };
  
  // Settlement details
  settlement: {
    settleDate: number;
    settlementValue: number;
    brokerBreakdown: Array<{
      brokerId: string;
      quantity: number;
      value: number;
    }>;
  };
}

interface NettingCalculation {
  calculationId: string;
  timestamp: number;
  accountId: string;
  
  // Input positions
  grossPositions: Array<{
    brokerId: string;
    symbol: string;
    quantity: number;
    price: number;
    side: 'long' | 'short';
  }>;
  
  // Netting results
  netPositions: NetPosition[];
  
  // Netting statistics
  statistics: {
    totalGrossPositions: number;
    totalNetPositions: number;
    nettingRatio: number; // net/gross
    offsetAmount: number;
    riskReduction: number; // percentage
  };
  
  // Cost savings
  costSavings: {
    marginSavings: number;
    financingSavings: number;
    capitalSavings: number;
    totalSavings: number;
  };
  
  // Settlement optimization
  settlementOptimization: {
    originalSettlements: number;
    optimizedSettlements: number;
    settlementReduction: number;
    cashFlowOptimization: number;
  };
}

interface MultiPrimeOrder {
  orderId: string;
  clientOrderId: string;
  accountId: string;
  
  // Order details
  symbol: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop' | 'stop_limit' | 'iceberg' | 'twap' | 'vwap';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce: 'DAY' | 'GTC' | 'IOC' | 'FOK';
  
  // Multi-prime routing
  routing: {
    strategy: 'best_execution' | 'cost_minimization' | 'latency_optimization' | 'allocation_based';
    allocations: Array<{
      brokerId: string;
      quantity: number;
      priority: number;
    }>;
  };
  
  // Execution tracking
  executions: Array<{
    executionId: string;
    brokerId: string;
    quantity: number;
    price: number;
    timestamp: number;
    commission: number;
    venue: string;
  }>;
  
  // Order status
  status: 'pending' | 'partial' | 'filled' | 'cancelled' | 'rejected';
  fillQuantity: number;
  remainingQuantity: number;
  averagePrice: number;
  
  // Performance metrics
  metrics: {
    totalExecutionTime: number;
    averageLatency: number;
    slippage: number;
    marketImpact: number;
    implementationShortfall: number;
  };
}

interface CustodyPosition {
  custodyId: string;
  accountId: string;
  custodian: string;
  
  // Position details
  symbol: string;
  quantity: number;
  marketValue: number;
  bookValue: number;
  unrealizedPnL: number;
  
  // Custody details
  custodyDetails: {
    safekeepingAccount: string;
    registrationDetails: string;
    certificateNumbers?: string[];
    cusipNumber?: string;
    isinNumber?: string;
  };
  
  // Corporate actions
  corporateActions: Array<{
    actionId: string;
    type: 'dividend' | 'split' | 'merger' | 'spinoff' | 'rights';
    announcementDate: number;
    recordDate: number;
    payableDate: number;
    details: any;
  }>;
  
  // Lending details
  lending: {
    isLendable: boolean;
    onLoan: number;
    lendingRate: number;
    lendingIncome: number;
  };
}

export class PrimeBrokerageEngine {
  private primeBrokers: Map<string, PrimeBroker> = new Map();
  private clientAccounts: Map<string, ClientAccount> = new Map();
  private netPositions: Map<string, NetPosition[]> = new Map(); // accountId -> positions
  private multiPrimeOrders: Map<string, MultiPrimeOrder> = new Map();
  private custodyPositions: Map<string, CustodyPosition[]> = new Map(); // accountId -> positions
  private nettingCalculations: Map<string, NettingCalculation> = new Map();
  
  // Real-time data
  private realTimePositions: Map<string, Map<string, number>> = new Map(); // accountId -> symbol -> quantity
  private realTimePrices: Map<string, number> = new Map(); // symbol -> price
  
  // Processing queues
  private orderQueue: MultiPrimeOrder[] = [];
  private nettingQueue: string[] = []; // accountIds pending netting
  
  // Performance monitoring
  private metrics = {
    totalAccounts: 0,
    totalBrokers: 0,
    totalNetPositions: 0,
    totalOrdersToday: 0,
    averageNettingRatio: 0,
    totalCostSavings: 0,
    averageLatency: 0,
    systemUptime: 100,
    lastNettingRun: 0
  };
  
  // Processing timers
  private nettingTimer?: NodeJS.Timeout;
  private positionTimer?: NodeJS.Timeout;
  private healthTimer?: NodeJS.Timeout;

  constructor() {
    this.initializeDefaultBrokers();
  }

  async initialize(): Promise<void> {
    console.log('🏛️ Initializing Prime Brokerage Engine...');
    
    // Load broker configurations
    await this.loadBrokerConfigurations();
    
    // Load client accounts
    await this.loadClientAccounts();
    
    // Connect to prime brokers
    await this.connectToPrimeBrokers();
    
    // Start netting calculations
    this.startNettingCalculations();
    
    // Start position monitoring
    this.startPositionMonitoring();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    console.log('✅ Prime Brokerage Engine initialized');
  }

  // Prime Broker Management
  async addPrimeBroker(broker: PrimeBroker): Promise<void> {
    this.primeBrokers.set(broker.brokerId, broker);
    
    // Test connection
    await this.testBrokerConnection(broker.brokerId);
    
    this.metrics.totalBrokers++;
    console.log(`✅ Prime broker added: ${broker.name}`);
  }

  async connectToPrimeBrokers(): Promise<void> {
    const connectionPromises = [];
    
    for (const [brokerId, broker] of this.primeBrokers.entries()) {
      connectionPromises.push(this.connectToBroker(brokerId));
    }
    
    await Promise.allSettled(connectionPromises);
    console.log('✅ Prime broker connections established');
  }

  private async connectToBroker(brokerId: string): Promise<void> {
    const broker = this.primeBrokers.get(brokerId);
    if (!broker) return;

    try {
      // Mock connection logic
      broker.connection.isConnected = true;
      broker.connection.lastHeartbeat = Date.now();
      broker.connection.latency = Math.random() * 50 + 10; // 10-60ms
      broker.connection.uptime = 99.9;
      
      console.log(`📡 Connected to ${broker.name} (${broker.connection.latency.toFixed(1)}ms latency)`);
    } catch (error) {
      console.error(`❌ Failed to connect to ${broker.name}:`, error);
      broker.connection.isConnected = false;
    }
  }

  private async testBrokerConnection(brokerId: string): Promise<boolean> {
    const broker = this.primeBrokers.get(brokerId);
    if (!broker) return false;

    // Mock connection test
    const testLatency = Math.random() * 100 + 20;
    broker.connection.latency = testLatency;
    broker.connection.lastHeartbeat = Date.now();
    
    return testLatency < 100; // Pass if under 100ms
  }

  // Client Account Management
  async createClientAccount(account: ClientAccount): Promise<string> {
    this.clientAccounts.set(account.accountId, account);
    this.netPositions.set(account.accountId, []);
    this.custodyPositions.set(account.accountId, []);
    this.realTimePositions.set(account.accountId, new Map());
    
    this.metrics.totalAccounts++;
    console.log(`✅ Client account created: ${account.details.name}`);
    
    return account.accountId;
  }

  async updateClientAccount(accountId: string, updates: Partial<ClientAccount>): Promise<void> {
    const existing = this.clientAccounts.get(accountId);
    if (!existing) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const updated = { ...existing, ...updates };
    this.clientAccounts.set(accountId, updated);
    
    console.log(`✅ Client account updated: ${accountId}`);
  }

  // Multi-Prime Order Execution
  async submitMultiPrimeOrder(order: Omit<MultiPrimeOrder, 'orderId' | 'executions' | 'status' | 'fillQuantity' | 'remainingQuantity' | 'averagePrice' | 'metrics'>): Promise<string> {
    const orderId = this.generateOrderId();
    
    const multiPrimeOrder: MultiPrimeOrder = {
      ...order,
      orderId,
      executions: [],
      status: 'pending',
      fillQuantity: 0,
      remainingQuantity: order.quantity,
      averagePrice: 0,
      metrics: {
        totalExecutionTime: 0,
        averageLatency: 0,
        slippage: 0,
        marketImpact: 0,
        implementationShortfall: 0
      }
    };

    this.multiPrimeOrders.set(orderId, multiPrimeOrder);
    this.orderQueue.push(multiPrimeOrder);
    
    // Process order immediately
    await this.processMultiPrimeOrder(orderId);
    
    this.metrics.totalOrdersToday++;
    console.log(`✅ Multi-prime order submitted: ${orderId}`);
    
    return orderId;
  }

  private async processMultiPrimeOrder(orderId: string): Promise<void> {
    const order = this.multiPrimeOrders.get(orderId);
    if (!order) return;

    const startTime = Date.now();

    try {
      // Calculate optimal routing based on strategy
      const optimalRouting = await this.calculateOptimalRouting(order);
      order.routing.allocations = optimalRouting;

      // Execute across multiple brokers
      const executionPromises = [];
      
      for (const allocation of order.routing.allocations) {
        if (allocation.quantity > 0) {
          executionPromises.push(
            this.executeOrderAtBroker(order, allocation.brokerId, allocation.quantity)
          );
        }
      }

      const executions = await Promise.allSettled(executionPromises);
      
      // Process execution results
      let totalFilled = 0;
      let totalValue = 0;
      let totalLatency = 0;
      let successfulExecutions = 0;

      for (const result of executions) {
        if (result.status === 'fulfilled' && result.value) {
          const execution = result.value;
          order.executions.push(execution);
          totalFilled += execution.quantity;
          totalValue += execution.quantity * execution.price;
          totalLatency += Date.now() - startTime;
          successfulExecutions++;
        }
      }

      // Update order status
      order.fillQuantity = totalFilled;
      order.remainingQuantity = order.quantity - totalFilled;
      order.averagePrice = totalFilled > 0 ? totalValue / totalFilled : 0;
      
      if (order.remainingQuantity === 0) {
        order.status = 'filled';
      } else if (totalFilled > 0) {
        order.status = 'partial';
      } else {
        order.status = 'rejected';
      }

      // Calculate performance metrics
      const executionTime = Date.now() - startTime;
      order.metrics = {
        totalExecutionTime: executionTime,
        averageLatency: successfulExecutions > 0 ? totalLatency / successfulExecutions : 0,
        slippage: this.calculateSlippage(order),
        marketImpact: this.calculateMarketImpact(order),
        implementationShortfall: this.calculateImplementationShortfall(order)
      };

      // Update positions
      if (totalFilled > 0) {
        await this.updateAccountPositions(order.accountId, order.symbol, 
          order.side === 'buy' ? totalFilled : -totalFilled);
        
        // Schedule netting calculation
        this.scheduleNettingCalculation(order.accountId);
      }

      console.log(`✅ Multi-prime order processed: ${orderId} (${(order.fillQuantity / order.quantity * 100).toFixed(1)}% filled)`);

    } catch (error) {
      console.error(`❌ Error processing multi-prime order ${orderId}:`, error);
      order.status = 'rejected';
    }
  }

  private async calculateOptimalRouting(order: MultiPrimeOrder): Promise<Array<{ brokerId: string; quantity: number; priority: number }>> {
    const account = this.clientAccounts.get(order.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const allocations: Array<{ brokerId: string; quantity: number; priority: number }> = [];
    
    switch (order.routing.strategy) {
      case 'best_execution':
        return this.calculateBestExecutionRouting(order, account);
      
      case 'cost_minimization':
        return this.calculateCostMinimizationRouting(order, account);
      
      case 'latency_optimization':
        return this.calculateLatencyOptimizationRouting(order, account);
      
      case 'allocation_based':
        return this.calculateAllocationBasedRouting(order, account);
      
      default:
        return this.calculateBestExecutionRouting(order, account);
    }
  }

  private async calculateBestExecutionRouting(order: MultiPrimeOrder, account: ClientAccount): Promise<Array<{ brokerId: string; quantity: number; priority: number }>> {
    const allocations = [];
    let remainingQuantity = order.quantity;
    
    // Sort brokers by execution quality score
    const eligibleBrokers = account.primeAssignments
      .filter(assignment => assignment.instruments.includes(order.symbol) || assignment.instruments.includes('*'))
      .sort((a, b) => {
        const brokerA = this.primeBrokers.get(a.brokerId);
        const brokerB = this.primeBrokers.get(b.brokerId);
        
        if (!brokerA || !brokerB) return 0;
        
        const scoreA = this.calculateExecutionScore(brokerA);
        const scoreB = this.calculateExecutionScore(brokerB);
        
        return scoreB - scoreA;
      });

    for (let i = 0; i < eligibleBrokers.length && remainingQuantity > 0; i++) {
      const assignment = eligibleBrokers[i];
      const broker = this.primeBrokers.get(assignment.brokerId);
      
      if (!broker || !broker.connection.isConnected) continue;
      
      const maxQuantityForBroker = Math.min(
        remainingQuantity,
        Math.floor(order.quantity * assignment.maxAllocation / 100),
        broker.capabilities.maxOrderSize
      );
      
      if (maxQuantityForBroker > 0) {
        allocations.push({
          brokerId: assignment.brokerId,
          quantity: maxQuantityForBroker,
          priority: i + 1
        });
        
        remainingQuantity -= maxQuantityForBroker;
      }
    }

    return allocations;
  }

  private async calculateCostMinimizationRouting(order: MultiPrimeOrder, account: ClientAccount): Promise<Array<{ brokerId: string; quantity: number; priority: number }>> {
    const eligibleBrokers = account.primeAssignments
      .filter(assignment => assignment.instruments.includes(order.symbol) || assignment.instruments.includes('*'))
      .sort((a, b) => {
        const brokerA = this.primeBrokers.get(a.brokerId);
        const brokerB = this.primeBrokers.get(b.brokerId);
        
        if (!brokerA || !brokerB) return 0;
        
        // Sort by total cost (commission + spread)
        const costA = brokerA.pricing.commissionRate + brokerA.pricing.spreadMarkup;
        const costB = brokerB.pricing.commissionRate + brokerB.pricing.spreadMarkup;
        
        return costA - costB;
      });

    return this.distributeQuantityAcrossBrokers(order, eligibleBrokers);
  }

  private async calculateLatencyOptimizationRouting(order: MultiPrimeOrder, account: ClientAccount): Promise<Array<{ brokerId: string; quantity: number; priority: number }>> {
    const eligibleBrokers = account.primeAssignments
      .filter(assignment => assignment.instruments.includes(order.symbol) || assignment.instruments.includes('*'))
      .sort((a, b) => {
        const brokerA = this.primeBrokers.get(a.brokerId);
        const brokerB = this.primeBrokers.get(b.brokerId);
        
        if (!brokerA || !brokerB) return 0;
        
        return brokerA.connection.latency - brokerB.connection.latency;
      });

    return this.distributeQuantityAcrossBrokers(order, eligibleBrokers);
  }

  private async calculateAllocationBasedRouting(order: MultiPrimeOrder, account: ClientAccount): Promise<Array<{ brokerId: string; quantity: number; priority: number }>> {
    const allocations = [];
    
    for (const assignment of account.primeAssignments) {
      if (!assignment.instruments.includes(order.symbol) && !assignment.instruments.includes('*')) continue;
      
      const broker = this.primeBrokers.get(assignment.brokerId);
      if (!broker || !broker.connection.isConnected) continue;
      
      const allocatedQuantity = Math.floor(order.quantity * assignment.allocation / 100);
      
      if (allocatedQuantity > 0) {
        allocations.push({
          brokerId: assignment.brokerId,
          quantity: allocatedQuantity,
          priority: assignment.priority
        });
      }
    }
    
    // Sort by priority
    allocations.sort((a, b) => a.priority - b.priority);
    
    return allocations;
  }

  private distributeQuantityAcrossBrokers(order: MultiPrimeOrder, brokerAssignments: any[]): Array<{ brokerId: string; quantity: number; priority: number }> {
    const allocations = [];
    let remainingQuantity = order.quantity;
    
    for (let i = 0; i < brokerAssignments.length && remainingQuantity > 0; i++) {
      const assignment = brokerAssignments[i];
      const broker = this.primeBrokers.get(assignment.brokerId);
      
      if (!broker || !broker.connection.isConnected) continue;
      
      const maxQuantityForBroker = Math.min(
        remainingQuantity,
        Math.floor(order.quantity * assignment.maxAllocation / 100),
        broker.capabilities.maxOrderSize
      );
      
      if (maxQuantityForBroker > 0) {
        allocations.push({
          brokerId: assignment.brokerId,
          quantity: maxQuantityForBroker,
          priority: i + 1
        });
        
        remainingQuantity -= maxQuantityForBroker;
      }
    }

    return allocations;
  }

  private async executeOrderAtBroker(order: MultiPrimeOrder, brokerId: string, quantity: number): Promise<any> {
    const broker = this.primeBrokers.get(brokerId);
    if (!broker) {
      throw new Error(`Broker not found: ${brokerId}`);
    }

    // Mock execution
    const executionPrice = this.realTimePrices.get(order.symbol) || 100;
    const slippage = (Math.random() - 0.5) * 0.002; // ±0.2% slippage
    const finalPrice = executionPrice * (1 + slippage);
    
    const execution = {
      executionId: this.generateExecutionId(),
      brokerId,
      quantity,
      price: finalPrice,
      timestamp: Date.now(),
      commission: quantity * broker.pricing.commissionRate,
      venue: `${broker.name}_VENUE`
    };

    // Update broker performance
    broker.performance.volumeToday += quantity * finalPrice;
    broker.performance.averageLatency = (broker.performance.averageLatency + broker.connection.latency) / 2;
    
    return execution;
  }

  // Netting Algorithms
  async calculateNetPositions(accountId: string): Promise<NettingCalculation> {
    const account = this.clientAccounts.get(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const calculationId = this.generateNettingCalculationId();
    const grossPositions = await this.getGrossPositions(accountId);
    
    // Group positions by symbol
    const positionGroups = new Map<string, Array<{
      brokerId: string;
      symbol: string;
      quantity: number;
      price: number;
      side: 'long' | 'short';
    }>>();

    for (const position of grossPositions) {
      if (!positionGroups.has(position.symbol)) {
        positionGroups.set(position.symbol, []);
      }
      positionGroups.get(position.symbol)!.push(position);
    }

    // Calculate net positions
    const netPositions: NetPosition[] = [];
    let totalNettingRatio = 0;
    let totalRiskReduction = 0;

    for (const [symbol, positions] of positionGroups.entries()) {
      const netPosition = this.calculateNetPositionForSymbol(symbol, positions);
      netPositions.push(netPosition);
      
      const grossQuantity = positions.reduce((sum, p) => sum + Math.abs(p.quantity), 0);
      const nettingRatio = grossQuantity > 0 ? Math.abs(netPosition.netQuantity) / grossQuantity : 0;
      totalNettingRatio += nettingRatio;
    }

    // Calculate statistics
    const avgNettingRatio = positionGroups.size > 0 ? totalNettingRatio / positionGroups.size : 0;
    const costSavings = this.calculateCostSavings(grossPositions, netPositions);
    const settlementOptimization = this.calculateSettlementOptimization(grossPositions, netPositions);

    const nettingCalculation: NettingCalculation = {
      calculationId,
      timestamp: Date.now(),
      accountId,
      grossPositions,
      netPositions,
      statistics: {
        totalGrossPositions: grossPositions.length,
        totalNetPositions: netPositions.length,
        nettingRatio: avgNettingRatio,
        offsetAmount: grossPositions.length - netPositions.length,
        riskReduction: this.calculateRiskReduction(grossPositions, netPositions)
      },
      costSavings,
      settlementOptimization
    };

    this.nettingCalculations.set(calculationId, nettingCalculation);
    this.netPositions.set(accountId, netPositions);
    
    this.metrics.averageNettingRatio = (this.metrics.averageNettingRatio + avgNettingRatio) / 2;
    this.metrics.totalCostSavings += costSavings.totalSavings;
    this.metrics.lastNettingRun = Date.now();
    
    console.log(`✅ Netting calculation completed for ${accountId}: ${(avgNettingRatio * 100).toFixed(1)}% netting ratio`);
    
    return nettingCalculation;
  }

  private calculateNetPositionForSymbol(symbol: string, positions: Array<{
    brokerId: string;
    symbol: string;
    quantity: number;
    price: number;
    side: 'long' | 'short';
  }>): NetPosition {
    let netQuantity = 0;
    let grossLong = 0;
    let grossShort = 0;
    let totalValue = 0;
    let totalRealizedPnL = 0;
    
    const brokerPositions = [];
    const pnlByBroker: { [brokerId: string]: number } = {};

    for (const position of positions) {
      const signedQuantity = position.side === 'long' ? position.quantity : -position.quantity;
      netQuantity += signedQuantity;
      
      if (signedQuantity > 0) {
        grossLong += signedQuantity;
      } else {
        grossShort += Math.abs(signedQuantity);
      }
      
      const marketPrice = this.realTimePrices.get(symbol) || position.price;
      const marketValue = position.quantity * marketPrice;
      const unrealizedPnL = position.quantity * (marketPrice - position.price);
      
      totalValue += marketValue;
      totalRealizedPnL += unrealizedPnL;
      
      brokerPositions.push({
        brokerId: position.brokerId,
        quantity: signedQuantity,
        averagePrice: position.price,
        unrealizedPnL,
        marketValue
      });
      
      pnlByBroker[position.brokerId] = (pnlByBroker[position.brokerId] || 0) + unrealizedPnL;
    }

    const currentPrice = this.realTimePrices.get(symbol) || 100;
    const notionalValue = Math.abs(netQuantity) * currentPrice;

    return {
      symbol,
      netQuantity,
      grossLong,
      grossShort,
      brokerPositions,
      risk: {
        deltaEquivalent: netQuantity * currentPrice,
        gamma: 0, // Would calculate options Greeks
        vega: 0,
        theta: 0,
        var95: notionalValue * 0.02, // 2% VaR assumption
        notionalValue
      },
      pnl: {
        realizedPnL: 0, // Would track from trade history
        unrealizedPnL: totalRealizedPnL,
        totalPnL: totalRealizedPnL,
        pnlByBroker
      },
      settlement: {
        settleDate: Date.now() + 2 * 24 * 60 * 60 * 1000, // T+2
        settlementValue: notionalValue,
        brokerBreakdown: brokerPositions.map(bp => ({
          brokerId: bp.brokerId,
          quantity: bp.quantity,
          value: bp.quantity * currentPrice
        }))
      }
    };
  }

  private calculateCostSavings(grossPositions: any[], netPositions: NetPosition[]): NettingCalculation['costSavings'] {
    // Calculate margin savings
    const grossMargin = grossPositions.reduce((sum, pos) => {
      const notional = Math.abs(pos.quantity) * pos.price;
      return sum + notional * 0.05; // 5% margin requirement
    }, 0);
    
    const netMargin = netPositions.reduce((sum, pos) => {
      return sum + pos.risk.notionalValue * 0.05;
    }, 0);
    
    const marginSavings = grossMargin - netMargin;
    
    // Calculate financing savings (simplified)
    const financingSavings = marginSavings * 0.03 / 365; // 3% annual financing cost
    
    // Calculate capital savings
    const capitalSavings = marginSavings * 0.15; // 15% capital efficiency gain
    
    return {
      marginSavings,
      financingSavings,
      capitalSavings,
      totalSavings: marginSavings + financingSavings + capitalSavings
    };
  }

  private calculateSettlementOptimization(grossPositions: any[], netPositions: NetPosition[]): NettingCalculation['settlementOptimization'] {
    const originalSettlements = grossPositions.length;
    const optimizedSettlements = netPositions.filter(pos => Math.abs(pos.netQuantity) > 0).length;
    const settlementReduction = originalSettlements - optimizedSettlements;
    
    // Calculate cash flow optimization
    const grossCashFlow = grossPositions.reduce((sum, pos) => sum + Math.abs(pos.quantity * pos.price), 0);
    const netCashFlow = netPositions.reduce((sum, pos) => sum + Math.abs(pos.netQuantity * (this.realTimePrices.get(pos.symbol) || 100)), 0);
    const cashFlowOptimization = grossCashFlow - netCashFlow;
    
    return {
      originalSettlements,
      optimizedSettlements,
      settlementReduction,
      cashFlowOptimization
    };
  }

  private calculateRiskReduction(grossPositions: any[], netPositions: NetPosition[]): number {
    const grossRisk = grossPositions.reduce((sum, pos) => {
      const notional = Math.abs(pos.quantity) * pos.price;
      return sum + notional * notional; // Sum of squares for portfolio risk
    }, 0);
    
    const netRisk = netPositions.reduce((sum, pos) => {
      return sum + pos.risk.notionalValue * pos.risk.notionalValue;
    }, 0);
    
    return grossRisk > 0 ? ((grossRisk - netRisk) / grossRisk) * 100 : 0;
  }

  // Position Management
  private async updateAccountPositions(accountId: string, symbol: string, quantityChange: number): Promise<void> {
    const positions = this.realTimePositions.get(accountId);
    if (!positions) return;

    const currentQuantity = positions.get(symbol) || 0;
    const newQuantity = currentQuantity + quantityChange;
    
    if (newQuantity === 0) {
      positions.delete(symbol);
    } else {
      positions.set(symbol, newQuantity);
    }
    
    this.realTimePositions.set(accountId, positions);
  }

  private async getGrossPositions(accountId: string): Promise<Array<{
    brokerId: string;
    symbol: string;
    quantity: number;
    price: number;
    side: 'long' | 'short';
  }>> {
    const account = this.clientAccounts.get(accountId);
    if (!account) return [];

    const grossPositions = [];
    
    // Mock gross positions across brokers
    for (const assignment of account.primeAssignments) {
      const broker = this.primeBrokers.get(assignment.brokerId);
      if (!broker) continue;
      
      // Generate mock positions
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
      
      for (const symbol of symbols) {
        if (Math.random() > 0.7) { // 30% chance of having position
          const quantity = Math.floor(Math.random() * 1000) + 100;
          const price = this.realTimePrices.get(symbol) || (Math.random() * 200 + 50);
          const side = Math.random() > 0.5 ? 'long' : 'short';
          
          grossPositions.push({
            brokerId: assignment.brokerId,
            symbol,
            quantity,
            price,
            side
          });
        }
      }
    }
    
    return grossPositions;
  }

  private scheduleNettingCalculation(accountId: string): void {
    if (!this.nettingQueue.includes(accountId)) {
      this.nettingQueue.push(accountId);
    }
  }

  // Utility Methods
  private calculateExecutionScore(broker: PrimeBroker): number {
    let score = 0;
    
    // Latency component (30%)
    score += Math.max(0, 100 - broker.connection.latency) * 0.3;
    
    // Fill rate component (25%)
    score += broker.performance.averageFillRate * 0.25;
    
    // Uptime component (20%)
    score += broker.connection.uptime * 0.2;
    
    // Cost component (15%)
    const costScore = Math.max(0, 100 - broker.pricing.commissionRate * 1000);
    score += costScore * 0.15;
    
    // Reject rate component (10%)
    score += Math.max(0, 100 - broker.performance.rejectRate) * 0.1;
    
    return score;
  }

  private calculateSlippage(order: MultiPrimeOrder): number {
    if (order.executions.length === 0 || !order.price) return 0;
    
    const avgExecutionPrice = order.averagePrice;
    return Math.abs(avgExecutionPrice - order.price) / order.price * 100;
  }

  private calculateMarketImpact(order: MultiPrimeOrder): number {
    // Simplified market impact calculation
    const notionalValue = order.quantity * (order.price || 100);
    return Math.sqrt(notionalValue / 1000000) * 0.1; // Square root law
  }

  private calculateImplementationShortfall(order: MultiPrimeOrder): number {
    if (!order.price) return 0;
    
    const decisionPrice = order.price;
    const executionPrice = order.averagePrice;
    const shortfall = Math.abs(executionPrice - decisionPrice) / decisionPrice * 100;
    
    return shortfall;
  }

  private startNettingCalculations(): void {
    this.nettingTimer = setInterval(() => {
      this.processNettingQueue();
    }, 300000); // Every 5 minutes
  }

  private startPositionMonitoring(): void {
    this.positionTimer = setInterval(() => {
      this.updatePositionMetrics();
    }, 60000); // Every minute
  }

  private startHealthMonitoring(): void {
    this.healthTimer = setInterval(() => {
      this.monitorBrokerHealth();
    }, 30000); // Every 30 seconds
  }

  private async processNettingQueue(): Promise<void> {
    while (this.nettingQueue.length > 0) {
      const accountId = this.nettingQueue.shift()!;
      
      try {
        await this.calculateNetPositions(accountId);
      } catch (error) {
        console.error(`❌ Error calculating net positions for ${accountId}:`, error);
      }
    }
  }

  private updatePositionMetrics(): void {
    let totalNetPositions = 0;
    
    for (const positions of this.netPositions.values()) {
      totalNetPositions += positions.length;
    }
    
    this.metrics.totalNetPositions = totalNetPositions;
  }

  private async monitorBrokerHealth(): Promise<void> {
    for (const [brokerId, broker] of this.primeBrokers.entries()) {
      // Update broker performance metrics
      broker.performance.uptimeToday = broker.connection.isConnected ? 100 : 0;
      
      // Test connection if disconnected
      if (!broker.connection.isConnected) {
        await this.connectToBroker(brokerId);
      }
      
      // Update heartbeat
      if (broker.connection.isConnected) {
        broker.connection.lastHeartbeat = Date.now();
      }
    }
  }

  private initializeDefaultBrokers(): void {
    // Initialize some mock real-time prices
    this.realTimePrices.set('AAPL', 150.25);
    this.realTimePrices.set('GOOGL', 2750.80);
    this.realTimePrices.set('MSFT', 335.50);
    this.realTimePrices.set('TSLA', 245.75);
    this.realTimePrices.set('AMZN', 3380.25);
  }

  private async loadBrokerConfigurations(): Promise<void> {
    // Mock implementation - would load from database
    console.log('📂 Loading prime broker configurations...');
  }

  private async loadClientAccounts(): Promise<void> {
    // Mock implementation - would load from database
    console.log('📂 Loading client accounts...');
  }

  private generateOrderId(): string {
    return `MPO_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateExecutionId(): string {
    return `EXE_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateNettingCalculationId(): string {
    return `NET_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  // Public API
  getPrimeBroker(brokerId: string): PrimeBroker | undefined {
    return this.primeBrokers.get(brokerId);
  }

  getAllPrimeBrokers(): PrimeBroker[] {
    return Array.from(this.primeBrokers.values());
  }

  getClientAccount(accountId: string): ClientAccount | undefined {
    return this.clientAccounts.get(accountId);
  }

  getNetPositions(accountId: string): NetPosition[] {
    return this.netPositions.get(accountId) || [];
  }

  getMultiPrimeOrder(orderId: string): MultiPrimeOrder | undefined {
    return this.multiPrimeOrders.get(orderId);
  }

  getNettingCalculation(calculationId: string): NettingCalculation | undefined {
    return this.nettingCalculations.get(calculationId);
  }

  getMetrics() {
    return { ...this.metrics };
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Prime Brokerage Engine...');
    
    if (this.nettingTimer) clearInterval(this.nettingTimer);
    if (this.positionTimer) clearInterval(this.positionTimer);
    if (this.healthTimer) clearInterval(this.healthTimer);
    
    // Disconnect from brokers
    for (const broker of this.primeBrokers.values()) {
      broker.connection.isConnected = false;
    }
    
    this.primeBrokers.clear();
    this.clientAccounts.clear();
    this.netPositions.clear();
    this.multiPrimeOrders.clear();
    this.custodyPositions.clear();
    this.nettingCalculations.clear();
    this.realTimePositions.clear();
    this.realTimePrices.clear();
    this.orderQueue.length = 0;
    this.nettingQueue.length = 0;
    
    console.log('✅ Prime Brokerage Engine shutdown complete');
  }
}