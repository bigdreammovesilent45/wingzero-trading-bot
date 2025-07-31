interface TradeRecord {
  tradeId: string;
  traderId: string;
  instrument: string;
  side: 'buy' | 'sell';
  entryTime: number;
  exitTime?: number;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  
  // Calculated fields
  pnl?: number;
  pnlPercent?: number;
  duration?: number; // milliseconds
  maxRunup?: number;
  maxDrawdown?: number;
  
  // Trade metadata
  strategy?: string;
  confidence?: number;
  tags?: string[];
  comment?: string;
  
  // Risk metrics
  riskAmount: number;
  leverage: number;
  marginUsed: number;
  
  // Execution details
  commission: number;
  slippage: number;
  swap?: number;
}

interface PerformanceMetrics {
  traderId: string;
  calculationTime: number;
  accountSize: number;
  currency: string;
  
  // Return metrics
  returns: {
    totalReturn: number; // absolute
    totalReturnPercent: number;
    annualizedReturn: number;
    monthlyReturn: number;
    weeklyReturn: number;
    dailyReturn: number;
    
    // Cumulative returns
    cumulativeReturns: Array<{
      date: string;
      value: number;
      drawdown: number;
    }>;
    
    // Period returns
    monthlyReturns: number[];
    yearlyReturns: number[];
    bestMonth: number;
    worstMonth: number;
    bestYear: number;
    worstYear: number;
  };
  
  // Risk metrics
  risk: {
    volatility: number;
    annualizedVolatility: number;
    beta: number;
    alpha: number;
    correlation: number;
    trackingError: number;
    
    // Drawdown analysis
    maxDrawdown: number;
    maxDrawdownDuration: number; // days
    currentDrawdown: number;
    drawdownSeries: Array<{
      date: string;
      drawdown: number;
      duration: number;
    }>;
    
    // Value at Risk
    var95: number;
    var99: number;
    expectedShortfall95: number;
    expectedShortfall99: number;
  };
  
  // Risk-adjusted ratios
  ratios: {
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    sterlingRatio: number;
    burkeRatio: number;
    informationRatio: number;
    treynorRatio: number;
    jensenAlpha: number;
    modigliani: number;
    
    // Custom ratios
    profitFactor: number;
    recoveryFactor: number;
    payoffRatio: number;
    expectancy: number;
    ulcerIndex: number;
    martinRatio: number;
  };
  
  // Trading statistics
  trading: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    lossRate: number;
    
    // Win/Loss analysis
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
    avgWinPercent: number;
    avgLossPercent: number;
    
    // Streaks
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
    currentStreak: number;
    currentStreakType: 'win' | 'loss' | 'none';
    
    // Trading frequency
    avgTradesPerDay: number;
    avgTradesPerWeek: number;
    avgTradesPerMonth: number;
    
    // Position sizing
    avgPositionSize: number;
    maxPositionSize: number;
    avgHoldingPeriod: number; // hours
    avgLeverage: number;
    maxLeverage: number;
  };
  
  // Advanced metrics
  advanced: {
    // Skill-based metrics
    hitRatio: number;
    informationCoefficient: number;
    battingAverage: number;
    upCaptureRatio: number;
    downCaptureRatio: number;
    
    // Timing analysis
    marketTiming: number;
    stockPicking: number;
    allocationEffect: number;
    interactionEffect: number;
    
    // Risk-adjusted performance
    riskAdjustedReturn: number;
    returnPerUnitRisk: number;
    maxReturnOverMaxDrawdown: number;
    
    // Consistency metrics
    consistencyRatio: number;
    stabilityRatio: number;
    reliabilityIndex: number;
  };
}

interface RankingCriteria {
  criteriaId: string;
  name: string;
  description: string;
  category: 'return' | 'risk' | 'ratio' | 'trading' | 'consistency';
  
  // Ranking parameters
  weight: number; // 0-100
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all_time';
  minTrades: number;
  minAccountAge: number; // days
  
  // Calculation method
  metric: keyof PerformanceMetrics['returns'] | 
          keyof PerformanceMetrics['risk'] | 
          keyof PerformanceMetrics['ratios'] | 
          keyof PerformanceMetrics['trading'] | 
          keyof PerformanceMetrics['advanced'];
  
  // Ranking direction
  direction: 'asc' | 'desc'; // higher is better or lower is better
  
  // Filters
  filters: {
    minAccountSize?: number;
    maxDrawdown?: number;
    minWinRate?: number;
    minTrades?: number;
    excludeNewTraders?: boolean;
    verifiedOnly?: boolean;
  };
}

interface TraderRanking {
  traderId: string;
  rank: number;
  previousRank?: number;
  score: number;
  percentile: number;
  
  // Ranking breakdown
  criteria: Array<{
    criteriaId: string;
    value: number;
    rank: number;
    weight: number;
    contribution: number;
  }>;
  
  // Performance summary
  performance: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    accountAge: number; // days
  };
  
  // Risk assessment
  risk: {
    riskScore: number; // 0-100
    volatility: number;
    consistency: number;
    stability: number;
  };
  
  // Social metrics
  social: {
    followers: number;
    copiers: number;
    reputation: number;
    trustScore: number;
  };
  
  // Metadata
  calculationTime: number;
  dataQuality: number; // 0-100
  confidence: number; // 0-100
}

interface BenchmarkComparison {
  traderId: string;
  benchmarkId: string;
  benchmarkName: string;
  timeframe: string;
  
  // Performance comparison
  comparison: {
    traderReturn: number;
    benchmarkReturn: number;
    excess: number;
    excessAnnualized: number;
    
    // Risk comparison
    traderVolatility: number;
    benchmarkVolatility: number;
    traderSharpe: number;
    benchmarkSharpe: number;
    
    // Relative metrics
    beta: number;
    alpha: number;
    correlation: number;
    trackingError: number;
    informationRatio: number;
    
    // Capture ratios
    upCapture: number;
    downCapture: number;
    captureRatio: number;
  };
  
  // Attribution analysis
  attribution: {
    selectionEffect: number;
    timingEffect: number;
    interactionEffect: number;
    totalActiveReturn: number;
  };
  
  // Periods of outperformance
  outperformance: {
    periodsAhead: number;
    periodsBehind: number;
    totalPeriods: number;
    percentAhead: number;
    
    // Streak analysis
    longestOutperformanceStreak: number;
    longestUnderperformanceStreak: number;
    currentStreak: number;
    currentStreakType: 'outperform' | 'underperform';
  };
}

export class PerformanceAnalyticsEngine {
  private tradeRecords: Map<string, TradeRecord[]> = new Map(); // traderId -> trades
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private rankings: Map<string, TraderRanking[]> = new Map(); // criteriaId -> rankings
  private benchmarkComparisons: Map<string, BenchmarkComparison[]> = new Map();
  
  // Ranking criteria
  private rankingCriteria: Map<string, RankingCriteria> = new Map();
  
  // Benchmarks
  private benchmarks: Map<string, Array<{
    date: string;
    value: number;
    return: number;
  }>> = new Map();
  
  // Processing timers
  private calculationTimer?: NodeJS.Timeout;
  private rankingTimer?: NodeJS.Timeout;
  
  // Performance monitoring
  private metrics = {
    tradersTracked: 0,
    tradesProcessed: 0,
    calculationsPerformed: 0,
    rankingsGenerated: 0,
    avgCalculationTime: 0,
    lastCalculation: 0
  };

  constructor() {
    this.initializeDefaultCriteria();
    this.initializeBenchmarks();
  }

  async initialize(): Promise<void> {
    console.log('📊 Initializing Performance Analytics Engine...');
    
    // Load historical trade data
    await this.loadTradeData();
    
    // Start performance calculations
    this.startPerformanceCalculations();
    
    // Start ranking calculations
    this.startRankingCalculations();
    
    console.log('✅ Performance Analytics Engine initialized');
  }

  // Trade Processing
  async addTradeRecord(trade: TradeRecord): Promise<void> {
    if (!this.tradeRecords.has(trade.traderId)) {
      this.tradeRecords.set(trade.traderId, []);
    }
    
    const trades = this.tradeRecords.get(trade.traderId)!;
    trades.push(trade);
    
    // Sort by entry time
    trades.sort((a, b) => a.entryTime - b.entryTime);
    
    // Trigger performance recalculation
    await this.schedulePerformanceCalculation(trade.traderId);
    
    this.metrics.tradesProcessed++;
  }

  async updateTradeRecord(tradeId: string, updates: Partial<TradeRecord>): Promise<void> {
    for (const [traderId, trades] of this.tradeRecords.entries()) {
      const tradeIndex = trades.findIndex(t => t.tradeId === tradeId);
      if (tradeIndex !== -1) {
        trades[tradeIndex] = { ...trades[tradeIndex], ...updates };
        
        // Recalculate derived fields
        if (updates.exitPrice && updates.exitTime) {
          await this.calculateTradeMetrics(trades[tradeIndex]);
        }
        
        // Trigger performance recalculation
        await this.schedulePerformanceCalculation(traderId);
        break;
      }
    }
  }

  // Performance Calculation
  async calculatePerformanceMetrics(traderId: string): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    
    const trades = this.tradeRecords.get(traderId) || [];
    if (trades.length === 0) {
      throw new Error(`No trades found for trader: ${traderId}`);
    }

    // Get account info (mock)
    const accountSize = 100000; // $100k
    const currency = 'USD';

    const metrics: PerformanceMetrics = {
      traderId,
      calculationTime: Date.now(),
      accountSize,
      currency,
      returns: await this.calculateReturns(trades, accountSize),
      risk: await this.calculateRiskMetrics(trades, accountSize),
      ratios: {} as any,
      trading: await this.calculateTradingStatistics(trades),
      advanced: {} as any
    };

    // Calculate risk-adjusted ratios
    metrics.ratios = await this.calculateRiskAdjustedRatios(metrics);
    
    // Calculate advanced metrics
    metrics.advanced = await this.calculateAdvancedMetrics(metrics, trades);

    this.performanceMetrics.set(traderId, metrics);
    
    const calculationTime = Date.now() - startTime;
    this.metrics.avgCalculationTime = (this.metrics.avgCalculationTime + calculationTime) / 2;
    this.metrics.calculationsPerformed++;
    
    console.log(`📊 Performance metrics calculated for ${traderId} in ${calculationTime}ms`);
    
    return metrics;
  }

  private async calculateReturns(trades: TradeRecord[], accountSize: number): Promise<PerformanceMetrics['returns']> {
    const closedTrades = trades.filter(t => t.exitTime && t.pnl !== undefined);
    
    if (closedTrades.length === 0) {
      return {
        totalReturn: 0,
        totalReturnPercent: 0,
        annualizedReturn: 0,
        monthlyReturn: 0,
        weeklyReturn: 0,
        dailyReturn: 0,
        cumulativeReturns: [],
        monthlyReturns: [],
        yearlyReturns: [],
        bestMonth: 0,
        worstMonth: 0,
        bestYear: 0,
        worstYear: 0
      };
    }

    // Calculate cumulative returns
    let cumulativeReturn = 0;
    let cumulativeBalance = accountSize;
    const cumulativeReturns = [];
    const monthlyReturns: number[] = [];
    const yearlyReturns: number[] = [];

    // Group trades by month and year
    const monthlyGroups = new Map<string, TradeRecord[]>();
    const yearlyGroups = new Map<string, TradeRecord[]>();

    for (const trade of closedTrades) {
      const date = new Date(trade.exitTime!);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const yearKey = date.getFullYear().toString();

      if (!monthlyGroups.has(monthKey)) monthlyGroups.set(monthKey, []);
      if (!yearlyGroups.has(yearKey)) yearlyGroups.set(yearKey, []);

      monthlyGroups.get(monthKey)!.push(trade);
      yearlyGroups.get(yearKey)!.push(trade);

      // Update cumulative
      cumulativeReturn += trade.pnl || 0;
      cumulativeBalance += trade.pnl || 0;

      cumulativeReturns.push({
        date: date.toISOString().split('T')[0],
        value: cumulativeBalance,
        drawdown: this.calculateDrawdownAtPoint(closedTrades, trade.exitTime!)
      });
    }

    // Calculate period returns
    for (const [month, monthTrades] of monthlyGroups.entries()) {
      const monthPnL = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const monthReturn = (monthPnL / accountSize) * 100;
      monthlyReturns.push(monthReturn);
    }

    for (const [year, yearTrades] of yearlyGroups.entries()) {
      const yearPnL = yearTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const yearReturn = (yearPnL / accountSize) * 100;
      yearlyReturns.push(yearReturn);
    }

    const totalReturnPercent = (cumulativeReturn / accountSize) * 100;
    const firstTradeTime = closedTrades[0].entryTime;
    const lastTradeTime = closedTrades[closedTrades.length - 1].exitTime!;
    const daysElapsed = (lastTradeTime - firstTradeTime) / (1000 * 60 * 60 * 24);
    const yearsElapsed = daysElapsed / 365.25;

    return {
      totalReturn: cumulativeReturn,
      totalReturnPercent,
      annualizedReturn: yearsElapsed > 0 ? Math.pow(1 + totalReturnPercent / 100, 1 / yearsElapsed) - 1 : 0,
      monthlyReturn: monthlyReturns.length > 0 ? monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length : 0,
      weeklyReturn: totalReturnPercent / (daysElapsed / 7),
      dailyReturn: totalReturnPercent / daysElapsed,
      cumulativeReturns,
      monthlyReturns,
      yearlyReturns,
      bestMonth: monthlyReturns.length > 0 ? Math.max(...monthlyReturns) : 0,
      worstMonth: monthlyReturns.length > 0 ? Math.min(...monthlyReturns) : 0,
      bestYear: yearlyReturns.length > 0 ? Math.max(...yearlyReturns) : 0,
      worstYear: yearlyReturns.length > 0 ? Math.min(...yearlyReturns) : 0
    };
  }

  private async calculateRiskMetrics(trades: TradeRecord[], accountSize: number): Promise<PerformanceMetrics['risk']> {
    const closedTrades = trades.filter(t => t.exitTime && t.pnl !== undefined);
    
    if (closedTrades.length === 0) {
      return {
        volatility: 0,
        annualizedVolatility: 0,
        beta: 0,
        alpha: 0,
        correlation: 0,
        trackingError: 0,
        maxDrawdown: 0,
        maxDrawdownDuration: 0,
        currentDrawdown: 0,
        drawdownSeries: [],
        var95: 0,
        var99: 0,
        expectedShortfall95: 0,
        expectedShortfall99: 0
      };
    }

    // Calculate daily returns
    const dailyReturns = this.calculateDailyReturns(closedTrades, accountSize);
    
    // Volatility calculation
    const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / dailyReturns.length;
    const volatility = Math.sqrt(variance);
    const annualizedVolatility = volatility * Math.sqrt(252); // Assuming 252 trading days

    // Drawdown analysis
    const drawdownAnalysis = this.calculateDrawdownAnalysis(closedTrades, accountSize);
    
    // VaR calculation
    const sortedReturns = [...dailyReturns].sort((a, b) => a - b);
    const var95Index = Math.floor(sortedReturns.length * 0.05);
    const var99Index = Math.floor(sortedReturns.length * 0.01);
    
    const var95 = sortedReturns[var95Index] || 0;
    const var99 = sortedReturns[var99Index] || 0;
    
    // Expected Shortfall (Conditional VaR)
    const expectedShortfall95 = var95Index > 0 ? 
      sortedReturns.slice(0, var95Index).reduce((a, b) => a + b, 0) / var95Index : 0;
    const expectedShortfall99 = var99Index > 0 ? 
      sortedReturns.slice(0, var99Index).reduce((a, b) => a + b, 0) / var99Index : 0;

    return {
      volatility,
      annualizedVolatility,
      beta: 1.0, // Would calculate against market benchmark
      alpha: 0, // Would calculate against market benchmark
      correlation: 0, // Would calculate against market benchmark
      trackingError: 0, // Would calculate against benchmark
      ...drawdownAnalysis,
      var95: Math.abs(var95),
      var99: Math.abs(var99),
      expectedShortfall95: Math.abs(expectedShortfall95),
      expectedShortfall99: Math.abs(expectedShortfall99)
    };
  }

  private async calculateRiskAdjustedRatios(metrics: PerformanceMetrics): Promise<PerformanceMetrics['ratios']> {
    const riskFreeRate = 0.02; // 2% annual risk-free rate
    const { returns, risk, trading } = metrics;
    
    // Sharpe Ratio
    const excessReturn = returns.annualizedReturn - riskFreeRate;
    const sharpeRatio = risk.annualizedVolatility > 0 ? excessReturn / risk.annualizedVolatility : 0;
    
    // Sortino Ratio (using downside deviation)
    const sortinoRatio = this.calculateSortinoRatio(returns, risk, riskFreeRate);
    
    // Calmar Ratio
    const calmarRatio = risk.maxDrawdown > 0 ? returns.annualizedReturn / (risk.maxDrawdown / 100) : 0;
    
    // Profit Factor
    const profitFactor = trading.avgLoss > 0 ? 
      (trading.winningTrades * trading.avgWin) / (trading.losingTrades * Math.abs(trading.avgLoss)) : 0;

    return {
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      sterlingRatio: calmarRatio, // Simplified
      burkeRatio: calmarRatio, // Simplified
      informationRatio: sharpeRatio, // Would use tracking error
      treynorRatio: risk.beta > 0 ? excessReturn / risk.beta : 0,
      jensenAlpha: risk.alpha,
      modigliani: sharpeRatio * 0.15, // Simplified
      profitFactor,
      recoveryFactor: risk.maxDrawdown > 0 ? returns.totalReturnPercent / (risk.maxDrawdown / 100) : 0,
      payoffRatio: trading.avgLoss > 0 ? trading.avgWin / Math.abs(trading.avgLoss) : 0,
      expectancy: (trading.winRate / 100 * trading.avgWin) + ((100 - trading.winRate) / 100 * trading.avgLoss),
      ulcerIndex: 0, // Would calculate from drawdown series
      martinRatio: 0 // Would calculate from Ulcer Index
    };
  }

  private async calculateTradingStatistics(trades: TradeRecord[]): Promise<PerformanceMetrics['trading']> {
    const closedTrades = trades.filter(t => t.exitTime && t.pnl !== undefined);
    
    if (closedTrades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        lossRate: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        avgWinPercent: 0,
        avgLossPercent: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        currentStreak: 0,
        currentStreakType: 'none',
        avgTradesPerDay: 0,
        avgTradesPerWeek: 0,
        avgTradesPerMonth: 0,
        avgPositionSize: 0,
        maxPositionSize: 0,
        avgHoldingPeriod: 0,
        avgLeverage: 0,
        maxLeverage: 0
      };
    }

    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);
    
    const avgWin = winningTrades.length > 0 ? 
      winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? 
      losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length : 0;

    const largestWin = winningTrades.length > 0 ? 
      Math.max(...winningTrades.map(t => t.pnl || 0)) : 0;
    const largestLoss = losingTrades.length > 0 ? 
      Math.min(...losingTrades.map(t => t.pnl || 0)) : 0;

    // Calculate streaks
    const streaks = this.calculateStreaks(closedTrades);
    
    // Calculate time-based metrics
    const firstTradeTime = closedTrades[0].entryTime;
    const lastTradeTime = closedTrades[closedTrades.length - 1].exitTime!;
    const daysElapsed = (lastTradeTime - firstTradeTime) / (1000 * 60 * 60 * 24);
    
    // Calculate holding periods
    const holdingPeriods = closedTrades.map(t => 
      t.exitTime && t.entryTime ? (t.exitTime - t.entryTime) / (1000 * 60 * 60) : 0
    );
    const avgHoldingPeriod = holdingPeriods.reduce((a, b) => a + b, 0) / holdingPeriods.length;

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / closedTrades.length) * 100,
      lossRate: (losingTrades.length / closedTrades.length) * 100,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      avgWinPercent: (avgWin / 1000) * 100, // Simplified
      avgLossPercent: (avgLoss / 1000) * 100, // Simplified
      maxConsecutiveWins: streaks.maxConsecutiveWins,
      maxConsecutiveLosses: streaks.maxConsecutiveLosses,
      currentStreak: streaks.currentStreak,
      currentStreakType: streaks.currentStreakType,
      avgTradesPerDay: daysElapsed > 0 ? closedTrades.length / daysElapsed : 0,
      avgTradesPerWeek: daysElapsed > 0 ? (closedTrades.length / daysElapsed) * 7 : 0,
      avgTradesPerMonth: daysElapsed > 0 ? (closedTrades.length / daysElapsed) * 30 : 0,
      avgPositionSize: closedTrades.reduce((sum, t) => sum + t.quantity, 0) / closedTrades.length,
      maxPositionSize: Math.max(...closedTrades.map(t => t.quantity)),
      avgHoldingPeriod,
      avgLeverage: closedTrades.reduce((sum, t) => sum + t.leverage, 0) / closedTrades.length,
      maxLeverage: Math.max(...closedTrades.map(t => t.leverage))
    };
  }

  private async calculateAdvancedMetrics(
    metrics: PerformanceMetrics, 
    trades: TradeRecord[]
  ): Promise<PerformanceMetrics['advanced']> {
    const { returns, risk, trading, ratios } = metrics;
    
    return {
      hitRatio: trading.winRate / 100,
      informationCoefficient: ratios.informationRatio,
      battingAverage: trading.winRate / 100,
      upCaptureRatio: 1.0, // Would calculate against benchmark
      downCaptureRatio: 1.0, // Would calculate against benchmark
      marketTiming: 0, // Would calculate timing component
      stockPicking: returns.totalReturnPercent, // Simplified
      allocationEffect: 0, // Would calculate allocation effect
      interactionEffect: 0, // Would calculate interaction effect
      riskAdjustedReturn: ratios.sharpeRatio,
      returnPerUnitRisk: risk.volatility > 0 ? returns.annualizedReturn / risk.volatility : 0,
      maxReturnOverMaxDrawdown: risk.maxDrawdown > 0 ? returns.totalReturnPercent / risk.maxDrawdown : 0,
      consistencyRatio: this.calculateConsistencyRatio(returns.monthlyReturns),
      stabilityRatio: this.calculateStabilityRatio(trades),
      reliabilityIndex: this.calculateReliabilityIndex(metrics)
    };
  }

  // Ranking System
  async calculateTraderRankings(criteriaId: string): Promise<TraderRanking[]> {
    const criteria = this.rankingCriteria.get(criteriaId);
    if (!criteria) {
      throw new Error(`Ranking criteria not found: ${criteriaId}`);
    }

    const eligibleTraders = this.getEligibleTraders(criteria);
    const rankings: TraderRanking[] = [];

    for (const traderId of eligibleTraders) {
      const metrics = this.performanceMetrics.get(traderId);
      if (!metrics) continue;

      const score = this.calculateRankingScore(metrics, criteria);
      const ranking: TraderRanking = {
        traderId,
        rank: 0, // Will be set after sorting
        score,
        percentile: 0, // Will be calculated after sorting
        criteria: [{
          criteriaId,
          value: score,
          rank: 0,
          weight: criteria.weight,
          contribution: score * criteria.weight / 100
        }],
        performance: {
          totalReturn: metrics.returns.totalReturnPercent,
          sharpeRatio: metrics.ratios.sharpeRatio,
          maxDrawdown: metrics.risk.maxDrawdown,
          winRate: metrics.trading.winRate,
          totalTrades: metrics.trading.totalTrades,
          accountAge: this.calculateAccountAge(traderId)
        },
        risk: {
          riskScore: this.calculateRiskScore(metrics),
          volatility: metrics.risk.volatility,
          consistency: metrics.advanced.consistencyRatio,
          stability: metrics.advanced.stabilityRatio
        },
        social: {
          followers: 0, // Would get from social data
          copiers: 0,
          reputation: 0,
          trustScore: 0
        },
        calculationTime: Date.now(),
        dataQuality: this.calculateDataQuality(metrics),
        confidence: this.calculateConfidence(metrics)
      };

      rankings.push(ranking);
    }

    // Sort and assign ranks
    rankings.sort((a, b) => 
      criteria.direction === 'desc' ? b.score - a.score : a.score - b.score
    );

    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
      ranking.percentile = ((rankings.length - index) / rankings.length) * 100;
    });

    this.rankings.set(criteriaId, rankings);
    this.metrics.rankingsGenerated++;

    return rankings;
  }

  // Utility Methods
  private calculateTradeMetrics(trade: TradeRecord): void {
    if (trade.exitTime && trade.exitPrice) {
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity;
      trade.pnl = trade.side === 'buy' ? pnl : -pnl;
      trade.pnlPercent = (trade.pnl / (trade.entryPrice * trade.quantity)) * 100;
      trade.duration = trade.exitTime - trade.entryTime;
    }
  }

  private calculateDailyReturns(trades: TradeRecord[], accountSize: number): number[] {
    // Group trades by day and calculate daily returns
    const dailyGroups = new Map<string, TradeRecord[]>();
    
    for (const trade of trades) {
      if (!trade.exitTime) continue;
      const date = new Date(trade.exitTime).toISOString().split('T')[0];
      if (!dailyGroups.has(date)) dailyGroups.set(date, []);
      dailyGroups.get(date)!.push(trade);
    }

    const dailyReturns: number[] = [];
    for (const [date, dayTrades] of dailyGroups.entries()) {
      const dayPnL = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const dayReturn = (dayPnL / accountSize) * 100;
      dailyReturns.push(dayReturn);
    }

    return dailyReturns;
  }

  private calculateDrawdownAnalysis(trades: TradeRecord[], accountSize: number) {
    let peak = accountSize;
    let currentBalance = accountSize;
    let maxDrawdown = 0;
    let maxDrawdownDuration = 0;
    let drawdownStart = 0;
    let currentDrawdown = 0;
    
    const drawdownSeries = [];

    for (const trade of trades) {
      if (!trade.exitTime || !trade.pnl) continue;
      
      currentBalance += trade.pnl;
      
      if (currentBalance > peak) {
        peak = currentBalance;
        drawdownStart = 0;
      } else {
        const drawdown = ((peak - currentBalance) / peak) * 100;
        if (drawdownStart === 0) drawdownStart = trade.exitTime;
        
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
          maxDrawdownDuration = Math.max(maxDrawdownDuration, trade.exitTime - drawdownStart);
        }
        
        currentDrawdown = drawdown;
      }

      drawdownSeries.push({
        date: new Date(trade.exitTime).toISOString().split('T')[0],
        drawdown: currentDrawdown,
        duration: drawdownStart > 0 ? trade.exitTime - drawdownStart : 0
      });
    }

    return {
      maxDrawdown,
      maxDrawdownDuration: maxDrawdownDuration / (1000 * 60 * 60 * 24), // Convert to days
      currentDrawdown,
      drawdownSeries
    };
  }

  private calculateDrawdownAtPoint(trades: TradeRecord[], timestamp: number): number {
    // Calculate drawdown at a specific point in time
    let peak = 100000; // Starting balance
    let currentBalance = 100000;
    
    for (const trade of trades) {
      if (!trade.exitTime || trade.exitTime > timestamp || !trade.pnl) continue;
      
      currentBalance += trade.pnl;
      if (currentBalance > peak) peak = currentBalance;
    }
    
    return peak > currentBalance ? ((peak - currentBalance) / peak) * 100 : 0;
  }

  private calculateStreaks(trades: TradeRecord[]) {
    let currentStreak = 0;
    let currentStreakType: 'win' | 'loss' | 'none' = 'none';
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;

    for (const trade of trades) {
      if (!trade.pnl) continue;
      
      if (trade.pnl > 0) {
        tempWinStreak++;
        tempLossStreak = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, tempWinStreak);
        
        if (currentStreakType === 'win' || currentStreakType === 'none') {
          currentStreak = tempWinStreak;
          currentStreakType = 'win';
        }
      } else {
        tempLossStreak++;
        tempWinStreak = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, tempLossStreak);
        
        if (currentStreakType === 'loss' || currentStreakType === 'none') {
          currentStreak = tempLossStreak;
          currentStreakType = 'loss';
        }
      }
    }

    return {
      maxConsecutiveWins,
      maxConsecutiveLosses,
      currentStreak,
      currentStreakType
    };
  }

  private calculateSortinoRatio(returns: any, risk: any, riskFreeRate: number): number {
    // Simplified Sortino calculation
    return risk.volatility > 0 ? (returns.annualizedReturn - riskFreeRate) / (risk.volatility * 0.7) : 0;
  }

  private calculateConsistencyRatio(monthlyReturns: number[]): number {
    if (monthlyReturns.length === 0) return 0;
    const positiveMonths = monthlyReturns.filter(r => r > 0).length;
    return positiveMonths / monthlyReturns.length;
  }

  private calculateStabilityRatio(trades: TradeRecord[]): number {
    // Measure of return stability over time
    if (trades.length < 2) return 0;
    
    const returns = trades.map(t => t.pnlPercent || 0);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return mean !== 0 ? Math.abs(mean) / Math.sqrt(variance) : 0;
  }

  private calculateReliabilityIndex(metrics: PerformanceMetrics): number {
    // Composite reliability score
    const factors = [
      metrics.trading.winRate / 100,
      Math.min(metrics.ratios.sharpeRatio / 2, 1),
      Math.max(0, 1 - metrics.risk.maxDrawdown / 50),
      Math.min(metrics.trading.totalTrades / 100, 1)
    ];
    
    return factors.reduce((a, b) => a + b, 0) / factors.length;
  }

  private getEligibleTraders(criteria: RankingCriteria): string[] {
    const eligible: string[] = [];
    
    for (const [traderId, metrics] of this.performanceMetrics.entries()) {
      // Apply filters
      if (criteria.filters.minAccountSize && metrics.accountSize < criteria.filters.minAccountSize) continue;
      if (criteria.filters.maxDrawdown && metrics.risk.maxDrawdown > criteria.filters.maxDrawdown) continue;
      if (criteria.filters.minWinRate && metrics.trading.winRate < criteria.filters.minWinRate) continue;
      if (criteria.filters.minTrades && metrics.trading.totalTrades < criteria.filters.minTrades) continue;
      
      eligible.push(traderId);
    }
    
    return eligible;
  }

  private calculateRankingScore(metrics: PerformanceMetrics, criteria: RankingCriteria): number {
    // Extract the metric value based on criteria
    const parts = criteria.metric.split('.');
    let value: any = metrics;
    
    for (const part of parts) {
      value = value[part];
      if (value === undefined) return 0;
    }
    
    return typeof value === 'number' ? value : 0;
  }

  private calculateAccountAge(traderId: string): number {
    const trades = this.tradeRecords.get(traderId) || [];
    if (trades.length === 0) return 0;
    
    const firstTrade = Math.min(...trades.map(t => t.entryTime));
    return (Date.now() - firstTrade) / (1000 * 60 * 60 * 24);
  }

  private calculateRiskScore(metrics: PerformanceMetrics): number {
    // Risk score from 0-100 (lower is better)
    const factors = [
      metrics.risk.maxDrawdown / 2, // 0-50
      metrics.risk.volatility * 100, // Scaled volatility
      (100 - metrics.trading.winRate) / 2, // Loss rate contribution
      Math.max(0, 50 - metrics.ratios.sharpeRatio * 25) // Sharpe contribution
    ];
    
    return Math.min(100, factors.reduce((a, b) => a + b, 0) / factors.length);
  }

  private calculateDataQuality(metrics: PerformanceMetrics): number {
    // Data quality score 0-100
    let score = 100;
    
    if (metrics.trading.totalTrades < 10) score -= 20;
    if (metrics.trading.totalTrades < 50) score -= 10;
    
    const accountAgeDays = this.calculateAccountAge(metrics.traderId);
    if (accountAgeDays < 30) score -= 30;
    if (accountAgeDays < 90) score -= 15;
    
    return Math.max(0, score);
  }

  private calculateConfidence(metrics: PerformanceMetrics): number {
    // Confidence in metrics 0-100
    const factors = [
      Math.min(metrics.trading.totalTrades / 100, 1),
      Math.min(this.calculateAccountAge(metrics.traderId) / 365, 1),
      metrics.advanced.consistencyRatio,
      Math.max(0, 1 - metrics.risk.maxDrawdown / 100)
    ];
    
    return (factors.reduce((a, b) => a + b, 0) / factors.length) * 100;
  }

  private initializeDefaultCriteria(): void {
    const defaultCriteria: RankingCriteria[] = [
      {
        criteriaId: 'total_return',
        name: 'Total Return',
        description: 'Total percentage return',
        category: 'return',
        weight: 100,
        timeframe: 'all_time',
        minTrades: 10,
        minAccountAge: 30,
        metric: 'totalReturnPercent',
        direction: 'desc',
        filters: {
          minAccountSize: 1000,
          maxDrawdown: 50,
          minTrades: 10
        }
      },
      {
        criteriaId: 'sharpe_ratio',
        name: 'Sharpe Ratio',
        description: 'Risk-adjusted returns',
        category: 'ratio',
        weight: 100,
        timeframe: 'all_time',
        minTrades: 20,
        minAccountAge: 60,
        metric: 'sharpeRatio',
        direction: 'desc',
        filters: {
          minAccountSize: 5000,
          maxDrawdown: 30,
          minTrades: 20
        }
      }
    ];

    for (const criteria of defaultCriteria) {
      this.rankingCriteria.set(criteria.criteriaId, criteria);
    }
  }

  private initializeBenchmarks(): void {
    // Initialize market benchmarks (mock data)
    const spx500 = [];
    const startDate = new Date('2020-01-01');
    
    for (let i = 0; i < 1000; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      spx500.push({
        date: date.toISOString().split('T')[0],
        value: 3000 + Math.random() * 1000,
        return: (Math.random() - 0.5) * 0.04 // ±2% daily return
      });
    }
    
    this.benchmarks.set('SPX500', spx500);
  }

  private async loadTradeData(): Promise<void> {
    // Mock implementation - would load from database
    console.log('📂 Loading historical trade data...');
  }

  private async schedulePerformanceCalculation(traderId: string): Promise<void> {
    // Debounce calculation requests
    setTimeout(() => {
      this.calculatePerformanceMetrics(traderId);
    }, 1000);
  }

  private startPerformanceCalculations(): void {
    this.calculationTimer = setInterval(() => {
      // Recalculate all trader metrics periodically
      for (const traderId of this.tradeRecords.keys()) {
        this.calculatePerformanceMetrics(traderId);
      }
    }, 300000); // Every 5 minutes
  }

  private startRankingCalculations(): void {
    this.rankingTimer = setInterval(() => {
      // Recalculate rankings for all criteria
      for (const criteriaId of this.rankingCriteria.keys()) {
        this.calculateTraderRankings(criteriaId);
      }
    }, 600000); // Every 10 minutes
  }

  // Public API
  getPerformanceMetrics(traderId: string): PerformanceMetrics | undefined {
    return this.performanceMetrics.get(traderId);
  }

  getAllPerformanceMetrics(): PerformanceMetrics[] {
    return Array.from(this.performanceMetrics.values());
  }

  getRankings(criteriaId: string): TraderRanking[] {
    return this.rankings.get(criteriaId) || [];
  }

  getAllRankings(): Map<string, TraderRanking[]> {
    return this.rankings;
  }

  getTraderRanking(traderId: string, criteriaId: string): TraderRanking | undefined {
    const rankings = this.rankings.get(criteriaId);
    return rankings?.find(r => r.traderId === traderId);
  }

  getMetrics() {
    return { ...this.metrics };
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Performance Analytics Engine...');
    
    if (this.calculationTimer) clearInterval(this.calculationTimer);
    if (this.rankingTimer) clearInterval(this.rankingTimer);
    
    this.tradeRecords.clear();
    this.performanceMetrics.clear();
    this.rankings.clear();
    this.benchmarkComparisons.clear();
    this.rankingCriteria.clear();
    this.benchmarks.clear();
    
    console.log('✅ Performance Analytics Engine shutdown complete');
  }
}