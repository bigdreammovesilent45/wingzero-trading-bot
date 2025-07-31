interface TraderProfile {
  traderId: string;
  username: string;
  displayName: string;
  verified: boolean;
  createdAt: number;
  
  // Performance metrics
  performance: {
    totalReturn: number; // percentage
    totalReturnUSD: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    calmarRatio: number;
    sortinoRatio: number;
  };
  
  // Risk metrics
  risk: {
    riskScore: number; // 0-100
    volatility: number;
    beta: number;
    var95: number; // 95% VaR
    expectedShortfall: number;
    maximumLeverage: number;
    currentDrawdown: number;
  };
  
  // Trading statistics
  stats: {
    totalTrades: number;
    avgHoldingPeriod: number; // hours
    activeDays: number;
    tradingFrequency: number; // trades per week
    avgTradeSize: number;
    largestWin: number;
    largestLoss: number;
    consecutiveWins: number;
    consecutiveLosses: number;
  };
  
  // Account information
  account: {
    accountSize: number;
    currency: string;
    leverage: number;
    marginUsed: number;
    availableMargin: number;
    equity: number;
    balance: number;
  };
  
  // Social metrics
  social: {
    followers: number;
    following: number;
    copiers: number;
    totalCopiedVolume: number;
    reputation: number; // 0-100
    trustScore: number; // 0-100
    responseRate: number;
    avgResponseTime: number; // hours
  };
  
  // Subscription settings
  subscription: {
    isPublic: boolean;
    copyFee: number; // percentage
    performanceFee: number; // percentage
    minCopyAmount: number;
    maxCopiers: number;
    allowedInstruments: string[];
    restrictedCountries: string[];
  };
}

interface CopySettings {
  copyId: string;
  followerId: string;
  traderId: string;
  isActive: boolean;
  createdAt: number;
  
  // Copy parameters
  allocation: {
    fixedAmount: number; // Fixed USD amount to copy
    proportionalPercentage: number; // Percentage of follower's balance
    maxRiskPerTrade: number; // Maximum risk per trade (percentage)
    maxTotalRisk: number; // Maximum total risk (percentage)
    stopLoss: number; // Copy stop loss (percentage)
    takeProfit: number; // Copy take profit (percentage)
  };
  
  // Copy rules
  rules: {
    copyMode: 'proportional' | 'fixed' | 'risk_based';
    scaleMethod: 'balance_ratio' | 'fixed_ratio' | 'risk_parity';
    maxSlippage: number; // percentage
    copyDelay: number; // milliseconds
    minTradeSize: number;
    maxTradeSize: number;
    enableStopLoss: boolean;
    enableTakeProfit: boolean;
    copyCloseTrades: boolean;
    copyPartialClose: boolean;
  };
  
  // Filters
  filters: {
    instruments: string[]; // Only copy these instruments
    excludeInstruments: string[]; // Exclude these instruments
    maxDrawdownLimit: number; // Stop copying if trader exceeds this drawdown
    profitTarget: number; // Stop copying when this profit is reached
    timeLimits: {
      startTime: string; // HH:MM
      endTime: string; // HH:MM
      timezone: string;
      excludeWeekends: boolean;
      excludeHolidays: boolean;
    };
  };
  
  // Performance tracking
  performance: {
    totalCopied: number;
    totalProfit: number;
    totalLoss: number;
    totalTrades: number;
    successfulTrades: number;
    failedTrades: number;
    avgCopyDelay: number;
    avgSlippage: number;
    totalFeesPaid: number;
  };
}

interface CopyTransaction {
  transactionId: string;
  copyId: string;
  
  // Source trade
  sourceTrader: string;
  sourceOrderId: string;
  sourceInstrument: string;
  sourceAction: 'open' | 'close' | 'modify';
  sourcePrice: number;
  sourceQuantity: number;
  sourceTimestamp: number;
  
  // Copy execution
  followerOrderId?: string;
  followerPrice?: number;
  followerQuantity?: number;
  followerTimestamp?: number;
  executionDelay: number;
  slippage: number;
  
  // Status and results
  status: 'pending' | 'executed' | 'failed' | 'cancelled' | 'partial';
  errorMessage?: string;
  fees: {
    copyFee: number;
    performanceFee: number;
    tradingFee: number;
    slippageCost: number;
  };
  
  // Risk management
  riskCheck: {
    passed: boolean;
    riskAmount: number;
    riskPercentage: number;
    rejectionReason?: string;
  };
}

interface CopySignal {
  signalId: string;
  traderId: string;
  timestamp: number;
  
  // Trade details
  instrument: string;
  action: 'buy' | 'sell' | 'close' | 'modify';
  quantity: number;
  price: number;
  orderType: 'market' | 'limit' | 'stop' | 'stop_limit';
  timeInForce: 'GTC' | 'IOC' | 'FOK' | 'DAY';
  
  // Order parameters
  stopLoss?: number;
  takeProfit?: number;
  trailingStop?: number;
  comment?: string;
  
  // Position information
  positionId?: string;
  isClosing: boolean;
  partialClose?: {
    percentage: number;
    quantity: number;
  };
  
  // Risk information
  risk: {
    riskAmount: number;
    riskPercentage: number;
    leverage: number;
    marginRequired: number;
  };
  
  // Metadata
  metadata: {
    strategy?: string;
    confidence?: number;
    timeframe?: string;
    technicalIndicators?: string[];
    fundamentalReason?: string;
  };
}

export class CopyTradingEngine {
  private copySettings: Map<string, CopySettings> = new Map();
  private activeSignals: Map<string, CopySignal> = new Map();
  private copyTransactions: Map<string, CopyTransaction> = new Map();
  private traderProfiles: Map<string, TraderProfile> = new Map();
  
  // Real-time subscriptions
  private traderSubscriptions: Map<string, Set<string>> = new Map(); // traderId -> followerIds
  private followerSubscriptions: Map<string, Set<string>> = new Map(); // followerId -> traderIds
  
  // Processing queues
  private signalQueue: Array<{
    signal: CopySignal;
    priority: number;
    timestamp: number;
  }> = [];
  private processingTimer?: NodeJS.Timeout;
  
  // Performance monitoring
  private metrics = {
    totalCopySettings: 0,
    activeCopies: 0,
    totalSignalsProcessed: 0,
    successfulCopies: 0,
    failedCopies: 0,
    avgExecutionTime: 0,
    avgSlippage: 0,
    totalVolumesCopied: 0,
    totalFeesGenerated: 0,
    lastProcessingTime: 0
  };
  
  constructor() {
    this.startSignalProcessing();
  }

  async initialize(): Promise<void> {
    console.log('👥 Initializing Copy Trading Engine...');
    
    // Load existing copy settings
    await this.loadCopySettings();
    
    // Start real-time signal processing
    this.startSignalProcessing();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    console.log('✅ Copy Trading Engine initialized');
  }

  // Copy Management
  async createCopySettings(settings: Omit<CopySettings, 'copyId' | 'createdAt' | 'performance'>): Promise<string> {
    const copyId = this.generateCopyId();
    
    const copySettings: CopySettings = {
      ...settings,
      copyId,
      createdAt: Date.now(),
      performance: {
        totalCopied: 0,
        totalProfit: 0,
        totalLoss: 0,
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        avgCopyDelay: 0,
        avgSlippage: 0,
        totalFeesPaid: 0
      }
    };

    // Validate copy settings
    await this.validateCopySettings(copySettings);
    
    this.copySettings.set(copyId, copySettings);
    
    // Subscribe to trader signals
    await this.subscribeToTrader(settings.traderId, settings.followerId);
    
    console.log(`✅ Copy settings created: ${copyId}`);
    this.metrics.totalCopySettings++;
    
    return copyId;
  }

  async updateCopySettings(copyId: string, updates: Partial<CopySettings>): Promise<void> {
    const existing = this.copySettings.get(copyId);
    if (!existing) {
      throw new Error(`Copy settings not found: ${copyId}`);
    }

    const updated = { ...existing, ...updates };
    await this.validateCopySettings(updated);
    
    this.copySettings.set(copyId, updated);
    
    console.log(`✅ Copy settings updated: ${copyId}`);
  }

  async deleteCopySettings(copyId: string): Promise<void> {
    const settings = this.copySettings.get(copyId);
    if (!settings) {
      throw new Error(`Copy settings not found: ${copyId}`);
    }

    // Unsubscribe from trader
    await this.unsubscribeFromTrader(settings.traderId, settings.followerId);
    
    this.copySettings.delete(copyId);
    
    console.log(`✅ Copy settings deleted: ${copyId}`);
  }

  async pauseCopySettings(copyId: string): Promise<void> {
    const settings = this.copySettings.get(copyId);
    if (!settings) {
      throw new Error(`Copy settings not found: ${copyId}`);
    }

    settings.isActive = false;
    console.log(`⏸️ Copy settings paused: ${copyId}`);
  }

  async resumeCopySettings(copyId: string): Promise<void> {
    const settings = this.copySettings.get(copyId);
    if (!settings) {
      throw new Error(`Copy settings not found: ${copyId}`);
    }

    settings.isActive = true;
    console.log(`▶️ Copy settings resumed: ${copyId}`);
  }

  // Signal Processing
  async processTraderSignal(signal: CopySignal): Promise<void> {
    console.log(`📡 Processing trader signal: ${signal.signalId} from ${signal.traderId}`);

    // Add to processing queue with priority
    const priority = this.calculateSignalPriority(signal);
    this.signalQueue.push({
      signal,
      priority,
      timestamp: Date.now()
    });

    // Sort queue by priority (higher first)
    this.signalQueue.sort((a, b) => b.priority - a.priority);

    this.metrics.totalSignalsProcessed++;
  }

  private async processSignalQueue(): Promise<void> {
    while (this.signalQueue.length > 0) {
      const { signal } = this.signalQueue.shift()!;
      
      try {
        await this.executeSignalCopies(signal);
      } catch (error) {
        console.error(`❌ Error processing signal ${signal.signalId}:`, error);
      }
    }
  }

  private async executeSignalCopies(signal: CopySignal): Promise<void> {
    const followers = this.traderSubscriptions.get(signal.traderId);
    if (!followers || followers.size === 0) {
      return;
    }

    const copyPromises = [];

    for (const followerId of followers) {
      // Find copy settings for this follower
      const copySettings = this.findCopySettingsForFollower(followerId, signal.traderId);
      
      if (copySettings && copySettings.isActive) {
        // Check if signal passes filters
        if (await this.passesFilters(signal, copySettings)) {
          copyPromises.push(this.executeCopyTrade(signal, copySettings));
        }
      }
    }

    // Execute all copies in parallel
    await Promise.allSettled(copyPromises);
  }

  private async executeCopyTrade(signal: CopySignal, copySettings: CopySettings): Promise<void> {
    const startTime = Date.now();
    
    const transaction: CopyTransaction = {
      transactionId: this.generateTransactionId(),
      copyId: copySettings.copyId,
      sourceTrader: signal.traderId,
      sourceOrderId: signal.signalId,
      sourceInstrument: signal.instrument,
      sourceAction: signal.action as any,
      sourcePrice: signal.price,
      sourceQuantity: signal.quantity,
      sourceTimestamp: signal.timestamp,
      executionDelay: 0,
      slippage: 0,
      status: 'pending',
      fees: {
        copyFee: 0,
        performanceFee: 0,
        tradingFee: 0,
        slippageCost: 0
      },
      riskCheck: {
        passed: false,
        riskAmount: 0,
        riskPercentage: 0
      }
    };

    try {
      // Risk management check
      const riskCheck = await this.performRiskCheck(signal, copySettings);
      transaction.riskCheck = riskCheck;

      if (!riskCheck.passed) {
        transaction.status = 'failed';
        transaction.errorMessage = riskCheck.rejectionReason;
        this.copyTransactions.set(transaction.transactionId, transaction);
        this.metrics.failedCopies++;
        return;
      }

      // Calculate copy quantity based on scaling method
      const copyQuantity = await this.calculateCopyQuantity(signal, copySettings);
      
      // Execute the copy trade
      const executionResult = await this.executeTradeOrder(
        copySettings.followerId,
        signal.instrument,
        signal.action,
        copyQuantity,
        signal.price,
        signal.orderType
      );

      // Update transaction with execution results
      transaction.followerOrderId = executionResult.orderId;
      transaction.followerPrice = executionResult.executedPrice;
      transaction.followerQuantity = copyQuantity;
      transaction.followerTimestamp = Date.now();
      transaction.executionDelay = transaction.followerTimestamp - signal.timestamp;
      transaction.slippage = Math.abs(executionResult.executedPrice - signal.price) / signal.price;
      transaction.status = 'executed';

      // Calculate fees
      transaction.fees = await this.calculateFees(signal, copySettings, executionResult);

      // Update performance metrics
      await this.updateCopyPerformance(copySettings, transaction);

      this.metrics.successfulCopies++;
      this.metrics.avgExecutionTime = (this.metrics.avgExecutionTime + transaction.executionDelay) / 2;
      this.metrics.avgSlippage = (this.metrics.avgSlippage + transaction.slippage) / 2;

      console.log(`✅ Copy trade executed: ${transaction.transactionId} (${transaction.executionDelay}ms delay, ${(transaction.slippage * 100).toFixed(2)}% slippage)`);

    } catch (error) {
      transaction.status = 'failed';
      transaction.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.metrics.failedCopies++;
      
      console.error(`❌ Copy trade failed: ${transaction.transactionId}`, error);
    }

    this.copyTransactions.set(transaction.transactionId, transaction);
  }

  // Risk Management
  private async performRiskCheck(signal: CopySignal, copySettings: CopySettings): Promise<CopyTransaction['riskCheck']> {
    const riskAmount = signal.risk.riskAmount * this.calculateScaleFactor(copySettings);
    const riskPercentage = signal.risk.riskPercentage;

    // Check individual trade risk limits
    if (riskPercentage > copySettings.allocation.maxRiskPerTrade) {
      return {
        passed: false,
        riskAmount,
        riskPercentage,
        rejectionReason: `Trade risk ${riskPercentage.toFixed(2)}% exceeds limit ${copySettings.allocation.maxRiskPerTrade}%`
      };
    }

    // Check total portfolio risk
    const currentTotalRisk = await this.calculateTotalPortfolioRisk(copySettings.followerId);
    if (currentTotalRisk + riskPercentage > copySettings.allocation.maxTotalRisk) {
      return {
        passed: false,
        riskAmount,
        riskPercentage,
        rejectionReason: `Total risk would exceed limit: ${(currentTotalRisk + riskPercentage).toFixed(2)}% > ${copySettings.allocation.maxTotalRisk}%`
      };
    }

    return {
      passed: true,
      riskAmount,
      riskPercentage
    };
  }

  private async passesFilters(signal: CopySignal, copySettings: CopySettings): Promise<boolean> {
    const { filters } = copySettings;

    // Instrument filters
    if (filters.instruments.length > 0 && !filters.instruments.includes(signal.instrument)) {
      return false;
    }

    if (filters.excludeInstruments.includes(signal.instrument)) {
      return false;
    }

    // Time filters
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (filters.timeLimits.startTime && filters.timeLimits.endTime) {
      if (currentTime < filters.timeLimits.startTime || currentTime > filters.timeLimits.endTime) {
        return false;
      }
    }

    if (filters.timeLimits.excludeWeekends) {
      const dayOfWeek = now.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        return false;
      }
    }

    // Trader performance filters
    const trader = this.traderProfiles.get(signal.traderId);
    if (trader) {
      if (trader.risk.currentDrawdown > filters.maxDrawdownLimit) {
        return false;
      }
    }

    return true;
  }

  // Quantity Calculation
  private async calculateCopyQuantity(signal: CopySignal, copySettings: CopySettings): Promise<number> {
    const { allocation, rules } = copySettings;
    
    switch (rules.copyMode) {
      case 'fixed':
        return this.calculateFixedQuantity(signal, allocation);
      
      case 'proportional':
        return this.calculateProportionalQuantity(signal, copySettings);
      
      case 'risk_based':
        return this.calculateRiskBasedQuantity(signal, copySettings);
      
      default:
        return this.calculateProportionalQuantity(signal, copySettings);
    }
  }

  private calculateFixedQuantity(signal: CopySignal, allocation: CopySettings['allocation']): number {
    const tradeValue = allocation.fixedAmount;
    const quantity = tradeValue / signal.price;
    
    return Math.max(allocation.minTradeSize || 0, Math.min(quantity, allocation.maxTradeSize || Infinity));
  }

  private async calculateProportionalQuantity(signal: CopySignal, copySettings: CopySettings): Promise<number> {
    const scaleFactor = this.calculateScaleFactor(copySettings);
    const quantity = signal.quantity * scaleFactor;
    
    const { allocation } = copySettings;
    return Math.max(allocation.minTradeSize || 0, Math.min(quantity, allocation.maxTradeSize || Infinity));
  }

  private async calculateRiskBasedQuantity(signal: CopySignal, copySettings: CopySettings): Promise<number> {
    const followerBalance = await this.getFollowerBalance(copySettings.followerId);
    const maxRiskAmount = followerBalance * (copySettings.allocation.maxRiskPerTrade / 100);
    
    const quantity = maxRiskAmount / signal.risk.riskAmount;
    
    const { allocation } = copySettings;
    return Math.max(allocation.minTradeSize || 0, Math.min(quantity, allocation.maxTradeSize || Infinity));
  }

  private calculateScaleFactor(copySettings: CopySettings): number {
    // This would be calculated based on the ratio of follower to trader account sizes
    // For now, using a simple percentage-based scaling
    return copySettings.allocation.proportionalPercentage / 100;
  }

  // Utility Methods
  private calculateSignalPriority(signal: CopySignal): number {
    let priority = 50; // Base priority
    
    // Higher priority for close orders
    if (signal.isClosing) priority += 30;
    
    // Higher priority for market orders
    if (signal.orderType === 'market') priority += 20;
    
    // Higher priority for high-volume traders
    const trader = this.traderProfiles.get(signal.traderId);
    if (trader) {
      priority += Math.min(trader.social.followers / 100, 20);
    }
    
    return priority;
  }

  private findCopySettingsForFollower(followerId: string, traderId: string): CopySettings | undefined {
    for (const settings of this.copySettings.values()) {
      if (settings.followerId === followerId && settings.traderId === traderId) {
        return settings;
      }
    }
    return undefined;
  }

  private async subscribeToTrader(traderId: string, followerId: string): Promise<void> {
    if (!this.traderSubscriptions.has(traderId)) {
      this.traderSubscriptions.set(traderId, new Set());
    }
    this.traderSubscriptions.get(traderId)!.add(followerId);

    if (!this.followerSubscriptions.has(followerId)) {
      this.followerSubscriptions.set(followerId, new Set());
    }
    this.followerSubscriptions.get(followerId)!.add(traderId);

    console.log(`📡 Subscribed ${followerId} to ${traderId}`);
  }

  private async unsubscribeFromTrader(traderId: string, followerId: string): Promise<void> {
    this.traderSubscriptions.get(traderId)?.delete(followerId);
    this.followerSubscriptions.get(followerId)?.delete(traderId);

    console.log(`📡 Unsubscribed ${followerId} from ${traderId}`);
  }

  // Mock implementations for external dependencies
  private async validateCopySettings(settings: CopySettings): Promise<void> {
    // Validate trader exists and is copyable
    if (!this.traderProfiles.has(settings.traderId)) {
      throw new Error(`Trader not found: ${settings.traderId}`);
    }

    // Validate allocation parameters
    if (settings.allocation.maxRiskPerTrade <= 0 || settings.allocation.maxRiskPerTrade > 100) {
      throw new Error('Invalid max risk per trade');
    }

    // Additional validation logic...
  }

  private async executeTradeOrder(
    followerId: string,
    instrument: string,
    action: string,
    quantity: number,
    price: number,
    orderType: string
  ): Promise<{ orderId: string; executedPrice: number }> {
    // Mock implementation - would integrate with actual trading API
    const executedPrice = price * (1 + (Math.random() - 0.5) * 0.001); // Add some slippage
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    return { orderId, executedPrice };
  }

  private async calculateFees(
    signal: CopySignal,
    copySettings: CopySettings,
    executionResult: any
  ): Promise<CopyTransaction['fees']> {
    const trader = this.traderProfiles.get(signal.traderId);
    const tradeValue = executionResult.executedPrice * signal.quantity;
    
    return {
      copyFee: tradeValue * (trader?.subscription.copyFee || 0) / 100,
      performanceFee: 0, // Calculated on profit
      tradingFee: tradeValue * 0.001, // 0.1% trading fee
      slippageCost: Math.abs(executionResult.executedPrice - signal.price) * signal.quantity
    };
  }

  private async updateCopyPerformance(copySettings: CopySettings, transaction: CopyTransaction): Promise<void> {
    copySettings.performance.totalTrades++;
    copySettings.performance.avgCopyDelay = 
      (copySettings.performance.avgCopyDelay + transaction.executionDelay) / copySettings.performance.totalTrades;
    copySettings.performance.avgSlippage = 
      (copySettings.performance.avgSlippage + transaction.slippage) / copySettings.performance.totalTrades;
    
    if (transaction.status === 'executed') {
      copySettings.performance.successfulTrades++;
    } else {
      copySettings.performance.failedTrades++;
    }
  }

  private async calculateTotalPortfolioRisk(followerId: string): Promise<number> {
    // Mock implementation
    return Math.random() * 10; // Return 0-10% risk
  }

  private async getFollowerBalance(followerId: string): Promise<number> {
    // Mock implementation
    return 10000; // $10,000 balance
  }

  private async loadCopySettings(): Promise<void> {
    // Mock implementation - would load from database
    console.log('📂 Loading existing copy settings...');
  }

  private startSignalProcessing(): void {
    this.processingTimer = setInterval(() => {
      this.processSignalQueue();
    }, 100); // Process queue every 100ms
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 60000); // Update metrics every minute
  }

  private updateMetrics(): void {
    this.metrics.activeCopies = Array.from(this.copySettings.values()).filter(s => s.isActive).length;
    this.metrics.lastProcessingTime = Date.now();
  }

  private generateCopyId(): string {
    return `copy_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  // Public API
  getCopySettings(copyId: string): CopySettings | undefined {
    return this.copySettings.get(copyId);
  }

  getAllCopySettings(): CopySettings[] {
    return Array.from(this.copySettings.values());
  }

  getCopySettingsForFollower(followerId: string): CopySettings[] {
    return Array.from(this.copySettings.values()).filter(s => s.followerId === followerId);
  }

  getCopyTransaction(transactionId: string): CopyTransaction | undefined {
    return this.copyTransactions.get(transactionId);
  }

  getTransactionsForCopy(copyId: string): CopyTransaction[] {
    return Array.from(this.copyTransactions.values()).filter(t => t.copyId === copyId);
  }

  getMetrics() {
    return { ...this.metrics };
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Copy Trading Engine...');
    
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }
    
    // Clear all data
    this.copySettings.clear();
    this.activeSignals.clear();
    this.copyTransactions.clear();
    this.traderSubscriptions.clear();
    this.followerSubscriptions.clear();
    this.signalQueue.length = 0;
    
    console.log('✅ Copy Trading Engine shutdown complete');
  }
}