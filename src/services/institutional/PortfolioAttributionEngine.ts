interface Portfolio {
  portfolioId: string;
  name: string;
  description: string;
  managerId: string;
  inception: number;
  
  // Portfolio details
  details: {
    baseCurrency: string;
    totalValue: number;
    totalCash: number;
    totalSecurities: number;
    leverage: number;
    beta: number;
    trackingError: number;
  };
  
  // Holdings
  holdings: Array<{
    symbol: string;
    assetClass: 'equity' | 'fixed_income' | 'commodity' | 'fx' | 'alternative' | 'cash';
    sector?: string;
    region?: string;
    quantity: number;
    marketValue: number;
    weight: number; // percentage of portfolio
    averageCost: number;
    unrealizedPnL: number;
    
    // Attribution fields
    attribution: {
      selectionReturn: number;
      allocationReturn: number;
      interactionReturn: number;
      totalActiveReturn: number;
    };
  }>;
  
  // Performance history
  performance: {
    inception: number;
    daily: Array<{
      date: string;
      value: number;
      return: number;
      benchmark: number;
      excess: number;
    }>;
    monthly: Array<{
      month: string;
      return: number;
      benchmark: number;
      excess: number;
      volatility: number;
    }>;
    yearly: Array<{
      year: number;
      return: number;
      benchmark: number;
      excess: number;
      sharpe: number;
      maxDrawdown: number;
    }>;
  };
  
  // Risk metrics
  risk: {
    var95: number;
    var99: number;
    expectedShortfall: number;
    maxDrawdown: number;
    volatility: number;
    beta: number;
    alpha: number;
    sharpeRatio: number;
    informationRatio: number;
    trackingError: number;
  };
}

interface Benchmark {
  benchmarkId: string;
  name: string;
  description: string;
  type: 'index' | 'peer_group' | 'custom' | 'multi_factor';
  
  // Benchmark composition
  composition: Array<{
    symbol: string;
    assetClass: string;
    sector?: string;
    region?: string;
    weight: number;
    expectedReturn: number;
    volatility: number;
  }>;
  
  // Performance data
  performance: {
    inception: number;
    daily: Array<{
      date: string;
      value: number;
      return: number;
    }>;
    monthly: Array<{
      month: string;
      return: number;
      volatility: number;
    }>;
    yearly: Array<{
      year: number;
      return: number;
      volatility: number;
      sharpe: number;
      maxDrawdown: number;
    }>;
  };
  
  // Risk characteristics
  riskCharacteristics: {
    volatility: number;
    var95: number;
    maxDrawdown: number;
    correlations: { [symbol: string]: number };
  };
}

interface AttributionAnalysis {
  analysisId: string;
  portfolioId: string;
  benchmarkId: string;
  period: {
    start: number;
    end: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  };
  
  // Overall attribution
  summary: {
    portfolioReturn: number;
    benchmarkReturn: number;
    totalActiveReturn: number;
    totalAttributionReturn: number; // Should equal totalActiveReturn
    
    // Main attribution components
    allocationEffect: number;
    selectionEffect: number;
    interactionEffect: number;
    currencyEffect?: number;
  };
  
  // Sector/Asset Class Attribution
  sectorAttribution: Array<{
    sector: string;
    portfolioWeight: number;
    benchmarkWeight: number;
    portfolioReturn: number;
    benchmarkReturn: number;
    
    // Attribution effects
    allocationEffect: number;
    selectionEffect: number;
    interactionEffect: number;
    totalEffect: number;
  }>;
  
  // Security Level Attribution
  securityAttribution: Array<{
    symbol: string;
    portfolioWeight: number;
    benchmarkWeight: number;
    portfolioReturn: number;
    benchmarkReturn: number;
    
    // Attribution effects
    selectionEffect: number;
    allocationEffect: number;
    totalContribution: number;
  }>;
  
  // Factor Attribution (if using factor model)
  factorAttribution?: Array<{
    factor: string;
    portfolioExposure: number;
    benchmarkExposure: number;
    factorReturn: number;
    
    // Attribution
    allocationEffect: number;
    timingEffect: number;
    totalEffect: number;
  }>;
  
  // Time Series Attribution
  timeSeriesAttribution: Array<{
    date: string;
    portfolioReturn: number;
    benchmarkReturn: number;
    activeReturn: number;
    allocationEffect: number;
    selectionEffect: number;
    interactionEffect: number;
  }>;
  
  // Risk Attribution
  riskAttribution: {
    totalRisk: number;
    activeRisk: number;
    
    // Risk decomposition
    riskDecomposition: Array<{
      source: string; // sector, security, factor
      contribution: number;
      percentage: number;
    }>;
    
    // Tracking error decomposition
    trackingErrorDecomposition: Array<{
      component: string;
      contribution: number;
      percentage: number;
    }>;
  };
}

interface PerformanceComparison {
  comparisonId: string;
  portfolioId: string;
  benchmarkIds: string[];
  period: {
    start: number;
    end: number;
  };
  
  // Return comparison
  returns: {
    portfolio: {
      total: number;
      annualized: number;
      monthly: number[];
      yearly: number[];
    };
    benchmarks: Array<{
      benchmarkId: string;
      name: string;
      total: number;
      annualized: number;
      monthly: number[];
      yearly: number[];
      correlation: number;
    }>;
  };
  
  // Risk comparison
  risk: {
    portfolio: {
      volatility: number;
      var95: number;
      maxDrawdown: number;
      sharpeRatio: number;
      calmarRatio: number;
    };
    benchmarks: Array<{
      benchmarkId: string;
      name: string;
      volatility: number;
      var95: number;
      maxDrawdown: number;
      sharpeRatio: number;
      calmarRatio: number;
      beta: number;
      alpha: number;
      informationRatio: number;
      trackingError: number;
    }>;
  };
  
  // Relative performance
  relativePerformance: Array<{
    benchmarkId: string;
    name: string;
    excessReturn: number;
    winRate: number; // Percentage of periods with positive excess return
    upCapture: number;
    downCapture: number;
    captureRatio: number;
    
    // Outperformance analysis
    outperformancePeriods: number;
    underperformancePeriods: number;
    longestOutperformanceStreak: number;
    longestUnderperformanceStreak: number;
  }>;
  
  // Style analysis
  styleAnalysis: {
    rSquared: number;
    activeShare: number;
    styleFactors: Array<{
      factor: string;
      exposure: number;
      tStat: number;
      significance: number;
    }>;
  };
}

interface RiskDecomposition {
  portfolioId: string;
  analysisDate: number;
  
  // Total portfolio risk
  totalRisk: {
    portfolioVolatility: number;
    var95: number;
    var99: number;
    expectedShortfall: number;
  };
  
  // Risk factor decomposition
  factorRisk: Array<{
    factor: string;
    exposure: number;
    volatility: number;
    contribution: number;
    percentage: number;
    marginalContribution: number;
    componentContribution: number;
  }>;
  
  // Asset class risk decomposition
  assetClassRisk: Array<{
    assetClass: string;
    weight: number;
    volatility: number;
    contribution: number;
    percentage: number;
  }>;
  
  // Sector risk decomposition
  sectorRisk: Array<{
    sector: string;
    weight: number;
    volatility: number;
    contribution: number;
    percentage: number;
    activeWeight: number;
    activeRisk: number;
  }>;
  
  // Individual security contributions
  securityRisk: Array<{
    symbol: string;
    weight: number;
    volatility: number;
    contribution: number;
    percentage: number;
    marginalContribution: number;
    diversificationRatio: number;
  }>;
  
  // Correlation analysis
  correlationAnalysis: {
    averageCorrelation: number;
    maxCorrelation: number;
    minCorrelation: number;
    correlationMatrix: { [symbol: string]: { [symbol: string]: number } };
  };
  
  // Concentration metrics
  concentrationMetrics: {
    herfindahlIndex: number;
    effectiveNumberOfPositions: number;
    top5Concentration: number;
    top10Concentration: number;
    maxSinglePosition: number;
  };
}

export class PortfolioAttributionEngine {
  private portfolios: Map<string, Portfolio> = new Map();
  private benchmarks: Map<string, Benchmark> = new Map();
  private attributionAnalyses: Map<string, AttributionAnalysis> = new Map();
  private performanceComparisons: Map<string, PerformanceComparison> = new Map();
  private riskDecompositions: Map<string, RiskDecomposition> = new Map();
  
  // Market data and factor returns
  private marketData: Map<string, Array<{ date: string; price: number; return: number }>> = new Map();
  private factorReturns: Map<string, Array<{ date: string; return: number }>> = new Map();
  
  // Performance monitoring
  private metrics = {
    totalPortfolios: 0,
    totalBenchmarks: 0,
    totalAttributions: 0,
    averageTrackingError: 0,
    averageInformationRatio: 0,
    lastCalculation: 0,
    calculationTime: 0
  };
  
  // Processing timers
  private calculationTimer?: NodeJS.Timeout;

  constructor() {
    this.initializeDefaultBenchmarks();
    this.initializeFactorReturns();
  }

  async initialize(): Promise<void> {
    console.log('📊 Initializing Portfolio Attribution Engine...');
    
    // Start attribution calculations
    this.startAttributionCalculations();
    
    console.log('✅ Portfolio Attribution Engine initialized');
  }

  // Portfolio Management
  async addPortfolio(portfolio: Portfolio): Promise<void> {
    this.portfolios.set(portfolio.portfolioId, portfolio);
    this.metrics.totalPortfolios++;
    
    console.log(`✅ Portfolio added: ${portfolio.name}`);
  }

  async updatePortfolio(portfolioId: string, updates: Partial<Portfolio>): Promise<void> {
    const existing = this.portfolios.get(portfolioId);
    if (!existing) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }

    const updated = { ...existing, ...updates };
    this.portfolios.set(portfolioId, updated);
    
    console.log(`✅ Portfolio updated: ${portfolioId}`);
  }

  // Benchmark Management
  async addBenchmark(benchmark: Benchmark): Promise<void> {
    this.benchmarks.set(benchmark.benchmarkId, benchmark);
    this.metrics.totalBenchmarks++;
    
    console.log(`✅ Benchmark added: ${benchmark.name}`);
  }

  // Attribution Analysis
  async performAttributionAnalysis(
    portfolioId: string, 
    benchmarkId: string, 
    period: { start: number; end: number; frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' }
  ): Promise<string> {
    const startTime = Date.now();
    
    const portfolio = this.portfolios.get(portfolioId);
    const benchmark = this.benchmarks.get(benchmarkId);
    
    if (!portfolio || !benchmark) {
      throw new Error('Portfolio or benchmark not found');
    }

    const analysisId = this.generateAnalysisId();
    
    console.log(`📈 Performing attribution analysis for ${portfolio.name} vs ${benchmark.name}`);

    // Calculate overall attribution
    const summary = await this.calculateOverallAttribution(portfolio, benchmark, period);
    
    // Calculate sector attribution
    const sectorAttribution = await this.calculateSectorAttribution(portfolio, benchmark, period);
    
    // Calculate security attribution
    const securityAttribution = await this.calculateSecurityAttribution(portfolio, benchmark, period);
    
    // Calculate time series attribution
    const timeSeriesAttribution = await this.calculateTimeSeriesAttribution(portfolio, benchmark, period);
    
    // Calculate risk attribution
    const riskAttribution = await this.calculateRiskAttribution(portfolio, benchmark, period);
    
    // Calculate factor attribution if applicable
    const factorAttribution = await this.calculateFactorAttribution(portfolio, benchmark, period);

    const attribution: AttributionAnalysis = {
      analysisId,
      portfolioId,
      benchmarkId,
      period,
      summary,
      sectorAttribution,
      securityAttribution,
      factorAttribution,
      timeSeriesAttribution,
      riskAttribution
    };

    this.attributionAnalyses.set(analysisId, attribution);
    this.metrics.totalAttributions++;
    this.metrics.calculationTime = Date.now() - startTime;
    this.metrics.lastCalculation = Date.now();
    
    console.log(`✅ Attribution analysis completed: ${analysisId} (${this.metrics.calculationTime}ms)`);
    
    return analysisId;
  }

  private async calculateOverallAttribution(
    portfolio: Portfolio, 
    benchmark: Benchmark, 
    period: { start: number; end: number; frequency: string }
  ): Promise<AttributionAnalysis['summary']> {
    // Get portfolio and benchmark returns for the period
    const portfolioReturns = this.getReturnsForPeriod(portfolio.performance.daily, period);
    const benchmarkReturns = this.getReturnsForPeriod(benchmark.performance.daily, period);
    
    const portfolioReturn = this.calculateCumulativeReturn(portfolioReturns);
    const benchmarkReturn = this.calculateCumulativeReturn(benchmarkReturns);
    const totalActiveReturn = portfolioReturn - benchmarkReturn;
    
    // Calculate attribution effects using Brinson-Hood-Beebower method
    let allocationEffect = 0;
    let selectionEffect = 0;
    let interactionEffect = 0;
    
    // Group holdings by sector for attribution
    const portfolioSectors = this.groupHoldingsBySector(portfolio.holdings);
    const benchmarkSectors = this.groupHoldingsBySector(benchmark.composition.map(c => ({
      ...c,
      marketValue: c.weight,
      weight: c.weight,
      averageCost: 0,
      unrealizedPnL: 0,
      quantity: 0,
      attribution: { selectionReturn: 0, allocationReturn: 0, interactionReturn: 0, totalActiveReturn: 0 }
    })));

    for (const [sector, portfolioHoldings] of portfolioSectors.entries()) {
      const benchmarkHoldings = benchmarkSectors.get(sector) || [];
      
      const portfolioWeight = portfolioHoldings.reduce((sum, h) => sum + h.weight, 0) / 100;
      const benchmarkWeight = benchmarkHoldings.reduce((sum, h) => sum + h.weight, 0) / 100;
      
      // Mock sector returns (would use actual historical data)
      const portfolioSectorReturn = this.getMockSectorReturn(sector, 'portfolio');
      const benchmarkSectorReturn = this.getMockSectorReturn(sector, 'benchmark');
      
      // BHB Attribution formulas
      const allocationContrib = (portfolioWeight - benchmarkWeight) * benchmarkSectorReturn;
      const selectionContrib = benchmarkWeight * (portfolioSectorReturn - benchmarkSectorReturn);
      const interactionContrib = (portfolioWeight - benchmarkWeight) * (portfolioSectorReturn - benchmarkSectorReturn);
      
      allocationEffect += allocationContrib;
      selectionEffect += selectionContrib;
      interactionEffect += interactionContrib;
    }

    return {
      portfolioReturn,
      benchmarkReturn,
      totalActiveReturn,
      totalAttributionReturn: allocationEffect + selectionEffect + interactionEffect,
      allocationEffect,
      selectionEffect,
      interactionEffect,
      currencyEffect: 0 // Simplified
    };
  }

  private async calculateSectorAttribution(
    portfolio: Portfolio, 
    benchmark: Benchmark, 
    period: { start: number; end: number; frequency: string }
  ): Promise<AttributionAnalysis['sectorAttribution']> {
    const portfolioSectors = this.groupHoldingsBySector(portfolio.holdings);
    const benchmarkSectors = this.groupHoldingsBySector(benchmark.composition.map(c => ({
      ...c,
      marketValue: c.weight,
      weight: c.weight,
      averageCost: 0,
      unrealizedPnL: 0,
      quantity: 0,
      attribution: { selectionReturn: 0, allocationReturn: 0, interactionReturn: 0, totalActiveReturn: 0 }
    })));

    const sectorAttribution = [];

    // Get all unique sectors
    const allSectors = new Set([...portfolioSectors.keys(), ...benchmarkSectors.keys()]);

    for (const sector of allSectors) {
      const portfolioHoldings = portfolioSectors.get(sector) || [];
      const benchmarkHoldings = benchmarkSectors.get(sector) || [];
      
      const portfolioWeight = portfolioHoldings.reduce((sum, h) => sum + h.weight, 0);
      const benchmarkWeight = benchmarkHoldings.reduce((sum, h) => sum + h.weight, 0);
      
      const portfolioReturn = this.getMockSectorReturn(sector, 'portfolio');
      const benchmarkReturn = this.getMockSectorReturn(sector, 'benchmark');
      
      // Calculate attribution effects
      const allocationEffect = (portfolioWeight - benchmarkWeight) * benchmarkReturn / 100;
      const selectionEffect = benchmarkWeight * (portfolioReturn - benchmarkReturn) / 100;
      const interactionEffect = (portfolioWeight - benchmarkWeight) * (portfolioReturn - benchmarkReturn) / 100;
      
      sectorAttribution.push({
        sector,
        portfolioWeight,
        benchmarkWeight,
        portfolioReturn,
        benchmarkReturn,
        allocationEffect,
        selectionEffect,
        interactionEffect,
        totalEffect: allocationEffect + selectionEffect + interactionEffect
      });
    }

    return sectorAttribution;
  }

  private async calculateSecurityAttribution(
    portfolio: Portfolio, 
    benchmark: Benchmark, 
    period: { start: number; end: number; frequency: string }
  ): Promise<AttributionAnalysis['securityAttribution']> {
    const securityAttribution = [];
    
    // Create map of benchmark weights
    const benchmarkWeights = new Map<string, number>();
    for (const comp of benchmark.composition) {
      benchmarkWeights.set(comp.symbol, comp.weight);
    }

    // Get all unique securities
    const allSecurities = new Set([
      ...portfolio.holdings.map(h => h.symbol),
      ...benchmark.composition.map(c => c.symbol)
    ]);

    for (const symbol of allSecurities) {
      const portfolioHolding = portfolio.holdings.find(h => h.symbol === symbol);
      const benchmarkComp = benchmark.composition.find(c => c.symbol === symbol);
      
      const portfolioWeight = portfolioHolding?.weight || 0;
      const benchmarkWeight = benchmarkComp?.weight || 0;
      
      // Mock security returns (would use actual historical data)
      const portfolioReturn = this.getMockSecurityReturn(symbol, 'portfolio');
      const benchmarkReturn = this.getMockSecurityReturn(symbol, 'benchmark');
      
      const selectionEffect = benchmarkWeight * (portfolioReturn - benchmarkReturn) / 100;
      const allocationEffect = (portfolioWeight - benchmarkWeight) * benchmarkReturn / 100;
      
      securityAttribution.push({
        symbol,
        portfolioWeight,
        benchmarkWeight,
        portfolioReturn,
        benchmarkReturn,
        selectionEffect,
        allocationEffect,
        totalContribution: selectionEffect + allocationEffect
      });
    }

    return securityAttribution;
  }

  private async calculateTimeSeriesAttribution(
    portfolio: Portfolio, 
    benchmark: Benchmark, 
    period: { start: number; end: number; frequency: string }
  ): Promise<AttributionAnalysis['timeSeriesAttribution']> {
    const timeSeriesAttribution = [];
    
    // Get daily attribution for the period
    const startDate = new Date(period.start);
    const endDate = new Date(period.end);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      // Mock daily returns and attribution
      const portfolioReturn = (Math.random() - 0.5) * 0.02; // ±1% daily return
      const benchmarkReturn = (Math.random() - 0.5) * 0.015; // ±0.75% daily return
      const activeReturn = portfolioReturn - benchmarkReturn;
      
      // Mock daily attribution effects
      const allocationEffect = (Math.random() - 0.5) * 0.005;
      const selectionEffect = activeReturn - allocationEffect;
      const interactionEffect = (Math.random() - 0.5) * 0.001;
      
      timeSeriesAttribution.push({
        date: dateStr,
        portfolioReturn,
        benchmarkReturn,
        activeReturn,
        allocationEffect,
        selectionEffect,
        interactionEffect
      });
    }

    return timeSeriesAttribution;
  }

  private async calculateRiskAttribution(
    portfolio: Portfolio, 
    benchmark: Benchmark, 
    period: { start: number; end: number; frequency: string }
  ): Promise<AttributionAnalysis['riskAttribution']> {
    const totalRisk = portfolio.risk.volatility;
    const activeRisk = portfolio.risk.trackingError;
    
    // Risk decomposition by sector
    const riskDecomposition = [];
    const portfolioSectors = this.groupHoldingsBySector(portfolio.holdings);
    
    for (const [sector, holdings] of portfolioSectors.entries()) {
      const sectorWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
      const sectorVolatility = this.getMockSectorVolatility(sector);
      const contribution = (sectorWeight / 100) * sectorVolatility;
      const percentage = (contribution / totalRisk) * 100;
      
      riskDecomposition.push({
        source: sector,
        contribution,
        percentage
      });
    }

    // Tracking error decomposition
    const trackingErrorDecomposition = [
      { component: 'Sector Allocation', contribution: 0.6 * activeRisk, percentage: 60 },
      { component: 'Security Selection', contribution: 0.3 * activeRisk, percentage: 30 },
      { component: 'Interaction', contribution: 0.1 * activeRisk, percentage: 10 }
    ];

    return {
      totalRisk,
      activeRisk,
      riskDecomposition,
      trackingErrorDecomposition
    };
  }

  private async calculateFactorAttribution(
    portfolio: Portfolio, 
    benchmark: Benchmark, 
    period: { start: number; end: number; frequency: string }
  ): Promise<AttributionAnalysis['factorAttribution']> {
    // Simplified factor attribution using common risk factors
    const factors = ['Market', 'Size', 'Value', 'Momentum', 'Quality', 'Low Volatility'];
    const factorAttribution = [];

    for (const factor of factors) {
      // Mock factor exposures and returns
      const portfolioExposure = (Math.random() - 0.5) * 2; // -1 to 1
      const benchmarkExposure = (Math.random() - 0.5) * 1.5; // -0.75 to 0.75
      const factorReturn = (Math.random() - 0.5) * 0.1; // ±5% factor return
      
      const allocationEffect = (portfolioExposure - benchmarkExposure) * factorReturn;
      const timingEffect = benchmarkExposure * factorReturn * (Math.random() - 0.5) * 0.2; // Timing effect
      
      factorAttribution.push({
        factor,
        portfolioExposure,
        benchmarkExposure,
        factorReturn,
        allocationEffect,
        timingEffect,
        totalEffect: allocationEffect + timingEffect
      });
    }

    return factorAttribution;
  }

  // Performance Comparison
  async performPerformanceComparison(
    portfolioId: string, 
    benchmarkIds: string[], 
    period: { start: number; end: number }
  ): Promise<string> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const comparisonId = this.generateComparisonId();
    
    console.log(`📊 Performing performance comparison for ${portfolio.name}`);

    // Calculate portfolio returns and risk
    const portfolioReturns = this.getReturnsForPeriod(portfolio.performance.daily, period);
    const portfolioRisk = this.calculateRiskMetrics(portfolioReturns);

    // Calculate benchmark comparisons
    const benchmarkComparisons = [];
    const relativePerformance = [];

    for (const benchmarkId of benchmarkIds) {
      const benchmark = this.benchmarks.get(benchmarkId);
      if (!benchmark) continue;

      const benchmarkReturns = this.getReturnsForPeriod(benchmark.performance.daily, period);
      const benchmarkRisk = this.calculateRiskMetrics(benchmarkReturns);
      
      // Calculate relative metrics
      const correlation = this.calculateCorrelation(portfolioReturns, benchmarkReturns);
      const beta = this.calculateBeta(portfolioReturns, benchmarkReturns);
      const alpha = portfolioRisk.annualizedReturn - (0.02 + beta * (benchmarkRisk.annualizedReturn - 0.02)); // Using 2% risk-free rate
      const trackingError = this.calculateTrackingError(portfolioReturns, benchmarkReturns);
      const informationRatio = trackingError > 0 ? (portfolioRisk.annualizedReturn - benchmarkRisk.annualizedReturn) / trackingError : 0;
      
      benchmarkComparisons.push({
        benchmarkId,
        name: benchmark.name,
        total: this.calculateCumulativeReturn(benchmarkReturns),
        annualized: benchmarkRisk.annualizedReturn,
        monthly: this.calculateMonthlyReturns(benchmarkReturns),
        yearly: this.calculateYearlyReturns(benchmarkReturns),
        correlation,
        volatility: benchmarkRisk.volatility,
        var95: benchmarkRisk.var95,
        maxDrawdown: benchmarkRisk.maxDrawdown,
        sharpeRatio: benchmarkRisk.sharpeRatio,
        calmarRatio: benchmarkRisk.calmarRatio,
        beta,
        alpha,
        informationRatio,
        trackingError
      });

      // Calculate relative performance metrics
      const excessReturns = portfolioReturns.map((pr, i) => pr - benchmarkReturns[i]);
      const excessReturn = portfolioRisk.annualizedReturn - benchmarkRisk.annualizedReturn;
      const winRate = excessReturns.filter(er => er > 0).length / excessReturns.length * 100;
      
      const upCapture = this.calculateUpCapture(portfolioReturns, benchmarkReturns);
      const downCapture = this.calculateDownCapture(portfolioReturns, benchmarkReturns);
      const captureRatio = downCapture > 0 ? upCapture / downCapture : 0;

      relativePerformance.push({
        benchmarkId,
        name: benchmark.name,
        excessReturn,
        winRate,
        upCapture,
        downCapture,
        captureRatio,
        outperformancePeriods: excessReturns.filter(er => er > 0).length,
        underperformancePeriods: excessReturns.filter(er => er <= 0).length,
        longestOutperformanceStreak: this.calculateLongestStreak(excessReturns, true),
        longestUnderperformanceStreak: this.calculateLongestStreak(excessReturns, false)
      });
    }

    // Calculate style analysis
    const styleAnalysis = await this.calculateStyleAnalysis(portfolio, benchmarkIds);

    const comparison: PerformanceComparison = {
      comparisonId,
      portfolioId,
      benchmarkIds,
      period,
      returns: {
        portfolio: {
          total: this.calculateCumulativeReturn(portfolioReturns),
          annualized: portfolioRisk.annualizedReturn,
          monthly: this.calculateMonthlyReturns(portfolioReturns),
          yearly: this.calculateYearlyReturns(portfolioReturns)
        },
        benchmarks: benchmarkComparisons.map(bc => ({
          benchmarkId: bc.benchmarkId,
          name: bc.name,
          total: bc.total,
          annualized: bc.annualized,
          monthly: bc.monthly,
          yearly: bc.yearly,
          correlation: bc.correlation
        }))
      },
      risk: {
        portfolio: {
          volatility: portfolioRisk.volatility,
          var95: portfolioRisk.var95,
          maxDrawdown: portfolioRisk.maxDrawdown,
          sharpeRatio: portfolioRisk.sharpeRatio,
          calmarRatio: portfolioRisk.calmarRatio
        },
        benchmarks: benchmarkComparisons
      },
      relativePerformance,
      styleAnalysis
    };

    this.performanceComparisons.set(comparisonId, comparison);
    
    console.log(`✅ Performance comparison completed: ${comparisonId}`);
    
    return comparisonId;
  }

  // Risk Decomposition
  async performRiskDecomposition(portfolioId: string): Promise<string> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    console.log(`🎯 Performing risk decomposition for ${portfolio.name}`);

    const decompositionId = this.generateDecompositionId();
    
    // Calculate factor risk decomposition
    const factorRisk = await this.calculateFactorRiskDecomposition(portfolio);
    
    // Calculate asset class risk decomposition
    const assetClassRisk = this.calculateAssetClassRisk(portfolio);
    
    // Calculate sector risk decomposition
    const sectorRisk = this.calculateSectorRisk(portfolio);
    
    // Calculate security risk decomposition
    const securityRisk = this.calculateSecurityRisk(portfolio);
    
    // Calculate correlation analysis
    const correlationAnalysis = this.calculateCorrelationAnalysis(portfolio);
    
    // Calculate concentration metrics
    const concentrationMetrics = this.calculateConcentrationMetrics(portfolio);

    const riskDecomposition: RiskDecomposition = {
      portfolioId,
      analysisDate: Date.now(),
      totalRisk: {
        portfolioVolatility: portfolio.risk.volatility,
        var95: portfolio.risk.var95,
        var99: portfolio.risk.var99,
        expectedShortfall: portfolio.risk.expectedShortfall
      },
      factorRisk,
      assetClassRisk,
      sectorRisk,
      securityRisk,
      correlationAnalysis,
      concentrationMetrics
    };

    this.riskDecompositions.set(decompositionId, riskDecomposition);
    
    console.log(`✅ Risk decomposition completed: ${decompositionId}`);
    
    return decompositionId;
  }

  // Utility Methods
  private groupHoldingsBySector(holdings: any[]): Map<string, any[]> {
    const sectors = new Map<string, any[]>();
    
    for (const holding of holdings) {
      const sector = holding.sector || 'Other';
      if (!sectors.has(sector)) {
        sectors.set(sector, []);
      }
      sectors.get(sector)!.push(holding);
    }
    
    return sectors;
  }

  private getReturnsForPeriod(dailyData: any[], period: { start: number; end: number }): number[] {
    const startDate = new Date(period.start).toISOString().split('T')[0];
    const endDate = new Date(period.end).toISOString().split('T')[0];
    
    return dailyData
      .filter(d => d.date >= startDate && d.date <= endDate)
      .map(d => d.return);
  }

  private calculateCumulativeReturn(returns: number[]): number {
    return returns.reduce((cum, ret) => cum * (1 + ret), 1) - 1;
  }

  private calculateRiskMetrics(returns: number[]) {
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    const annualizedReturn = Math.pow(1 + mean, 252) - 1; // Assuming 252 trading days
    const annualizedVolatility = volatility * Math.sqrt(252);
    
    // VaR calculation
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95 = sortedReturns[Math.floor(returns.length * 0.05)] || 0;
    
    // Max drawdown
    let peak = 1;
    let maxDrawdown = 0;
    let cumulative = 1;
    
    for (const ret of returns) {
      cumulative *= (1 + ret);
      if (cumulative > peak) peak = cumulative;
      const drawdown = (peak - cumulative) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    const sharpeRatio = annualizedVolatility > 0 ? (annualizedReturn - 0.02) / annualizedVolatility : 0;
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;
    
    return {
      mean,
      volatility,
      annualizedReturn,
      annualizedVolatility,
      var95: Math.abs(var95),
      maxDrawdown,
      sharpeRatio,
      calmarRatio
    };
  }

  private calculateCorrelation(returns1: number[], returns2: number[]): number {
    const n = Math.min(returns1.length, returns2.length);
    const mean1 = returns1.slice(0, n).reduce((sum, r) => sum + r, 0) / n;
    const mean2 = returns2.slice(0, n).reduce((sum, r) => sum + r, 0) / n;
    
    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;
    
    for (let i = 0; i < n; i++) {
      const diff1 = returns1[i] - mean1;
      const diff2 = returns2[i] - mean2;
      numerator += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sum1Sq * sum2Sq);
    return denominator > 0 ? numerator / denominator : 0;
  }

  private calculateBeta(portfolioReturns: number[], marketReturns: number[]): number {
    const correlation = this.calculateCorrelation(portfolioReturns, marketReturns);
    const portfolioVol = this.calculateRiskMetrics(portfolioReturns).volatility;
    const marketVol = this.calculateRiskMetrics(marketReturns).volatility;
    
    return marketVol > 0 ? correlation * (portfolioVol / marketVol) : 1;
  }

  private calculateTrackingError(portfolioReturns: number[], benchmarkReturns: number[]): number {
    const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
    const excessReturns = [];
    
    for (let i = 0; i < n; i++) {
      excessReturns.push(portfolioReturns[i] - benchmarkReturns[i]);
    }
    
    return this.calculateRiskMetrics(excessReturns).annualizedVolatility;
  }

  private calculateUpCapture(portfolioReturns: number[], benchmarkReturns: number[]): number {
    const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
    let upPortfolio = 0;
    let upBenchmark = 0;
    let upPeriods = 0;
    
    for (let i = 0; i < n; i++) {
      if (benchmarkReturns[i] > 0) {
        upPortfolio += portfolioReturns[i];
        upBenchmark += benchmarkReturns[i];
        upPeriods++;
      }
    }
    
    return upPeriods > 0 && upBenchmark > 0 ? (upPortfolio / upPeriods) / (upBenchmark / upPeriods) * 100 : 0;
  }

  private calculateDownCapture(portfolioReturns: number[], benchmarkReturns: number[]): number {
    const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
    let downPortfolio = 0;
    let downBenchmark = 0;
    let downPeriods = 0;
    
    for (let i = 0; i < n; i++) {
      if (benchmarkReturns[i] < 0) {
        downPortfolio += portfolioReturns[i];
        downBenchmark += benchmarkReturns[i];
        downPeriods++;
      }
    }
    
    return downPeriods > 0 && downBenchmark < 0 ? (downPortfolio / downPeriods) / (downBenchmark / downPeriods) * 100 : 0;
  }

  private calculateLongestStreak(returns: number[], positive: boolean): number {
    let longestStreak = 0;
    let currentStreak = 0;
    
    for (const ret of returns) {
      if ((positive && ret > 0) || (!positive && ret <= 0)) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return longestStreak;
  }

  private calculateMonthlyReturns(dailyReturns: number[]): number[] {
    // Simplified monthly return calculation
    const monthlyReturns = [];
    const monthSize = Math.ceil(dailyReturns.length / 12);
    
    for (let i = 0; i < dailyReturns.length; i += monthSize) {
      const monthReturns = dailyReturns.slice(i, i + monthSize);
      const monthlyReturn = this.calculateCumulativeReturn(monthReturns);
      monthlyReturns.push(monthlyReturn);
    }
    
    return monthlyReturns;
  }

  private calculateYearlyReturns(dailyReturns: number[]): number[] {
    // Simplified yearly return calculation
    const yearlyReturns = [];
    const yearSize = Math.ceil(dailyReturns.length / 3); // Assuming 3 years of data
    
    for (let i = 0; i < dailyReturns.length; i += yearSize) {
      const yearReturns = dailyReturns.slice(i, i + yearSize);
      const yearlyReturn = this.calculateCumulativeReturn(yearReturns);
      yearlyReturns.push(yearlyReturn);
    }
    
    return yearlyReturns;
  }

  private async calculateStyleAnalysis(portfolio: Portfolio, benchmarkIds: string[]): Promise<PerformanceComparison['styleAnalysis']> {
    // Simplified style analysis
    const rSquared = 0.85 + Math.random() * 0.1; // 85-95%
    const activeShare = 0.3 + Math.random() * 0.4; // 30-70%
    
    const styleFactors = [
      { factor: 'Large Cap', exposure: Math.random() * 0.8, tStat: 2.5, significance: 0.95 },
      { factor: 'Growth', exposure: Math.random() * 0.6, tStat: 1.8, significance: 0.85 },
      { factor: 'Quality', exposure: Math.random() * 0.4, tStat: 1.2, significance: 0.75 }
    ];
    
    return {
      rSquared,
      activeShare,
      styleFactors
    };
  }

  private async calculateFactorRiskDecomposition(portfolio: Portfolio): Promise<RiskDecomposition['factorRisk']> {
    const factors = ['Market', 'Size', 'Value', 'Momentum', 'Quality', 'Low Volatility'];
    const factorRisk = [];
    
    for (const factor of factors) {
      const exposure = (Math.random() - 0.5) * 2; // -1 to 1
      const volatility = 0.15 + Math.random() * 0.1; // 15-25%
      const contribution = Math.abs(exposure) * volatility;
      const percentage = (contribution / portfolio.risk.volatility) * 100;
      const marginalContribution = contribution * 1.1; // Simplified
      const componentContribution = contribution * 0.9; // Simplified
      
      factorRisk.push({
        factor,
        exposure,
        volatility,
        contribution,
        percentage,
        marginalContribution,
        componentContribution
      });
    }
    
    return factorRisk;
  }

  private calculateAssetClassRisk(portfolio: Portfolio): RiskDecomposition['assetClassRisk'] {
    const assetClasses = new Map<string, { weight: number; volatility: number }>();
    
    // Group by asset class
    for (const holding of portfolio.holdings) {
      const assetClass = holding.assetClass;
      if (!assetClasses.has(assetClass)) {
        assetClasses.set(assetClass, { weight: 0, volatility: this.getMockAssetClassVolatility(assetClass) });
      }
      const ac = assetClasses.get(assetClass)!;
      ac.weight += holding.weight;
    }
    
    const assetClassRisk = [];
    for (const [assetClass, data] of assetClasses.entries()) {
      const contribution = (data.weight / 100) * data.volatility;
      const percentage = (contribution / portfolio.risk.volatility) * 100;
      
      assetClassRisk.push({
        assetClass,
        weight: data.weight,
        volatility: data.volatility,
        contribution,
        percentage
      });
    }
    
    return assetClassRisk;
  }

  private calculateSectorRisk(portfolio: Portfolio): RiskDecomposition['sectorRisk'] {
    const sectors = this.groupHoldingsBySector(portfolio.holdings);
    const sectorRisk = [];
    
    for (const [sector, holdings] of sectors.entries()) {
      const weight = holdings.reduce((sum, h) => sum + h.weight, 0);
      const volatility = this.getMockSectorVolatility(sector);
      const contribution = (weight / 100) * volatility;
      const percentage = (contribution / portfolio.risk.volatility) * 100;
      const activeWeight = weight - 15; // Assuming 15% benchmark weight
      const activeRisk = Math.abs(activeWeight / 100) * volatility;
      
      sectorRisk.push({
        sector,
        weight,
        volatility,
        contribution,
        percentage,
        activeWeight,
        activeRisk
      });
    }
    
    return sectorRisk;
  }

  private calculateSecurityRisk(portfolio: Portfolio): RiskDecomposition['securityRisk'] {
    const securityRisk = [];
    
    for (const holding of portfolio.holdings) {
      const weight = holding.weight;
      const volatility = this.getMockSecurityVolatility(holding.symbol);
      const contribution = (weight / 100) * volatility;
      const percentage = (contribution / portfolio.risk.volatility) * 100;
      const marginalContribution = contribution * 1.05; // Simplified
      const diversificationRatio = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      
      securityRisk.push({
        symbol: holding.symbol,
        weight,
        volatility,
        contribution,
        percentage,
        marginalContribution,
        diversificationRatio
      });
    }
    
    return securityRisk;
  }

  private calculateCorrelationAnalysis(portfolio: Portfolio): RiskDecomposition['correlationAnalysis'] {
    const correlations: { [symbol: string]: { [symbol: string]: number } } = {};
    let totalCorrelation = 0;
    let pairCount = 0;
    let maxCorrelation = -1;
    let minCorrelation = 1;
    
    // Generate mock correlation matrix
    for (const holding1 of portfolio.holdings) {
      correlations[holding1.symbol] = {};
      for (const holding2 of portfolio.holdings) {
        if (holding1.symbol === holding2.symbol) {
          correlations[holding1.symbol][holding2.symbol] = 1;
        } else {
          const correlation = 0.3 + Math.random() * 0.4; // 0.3 to 0.7
          correlations[holding1.symbol][holding2.symbol] = correlation;
          
          if (holding1.symbol < holding2.symbol) { // Avoid double counting
            totalCorrelation += correlation;
            pairCount++;
            maxCorrelation = Math.max(maxCorrelation, correlation);
            minCorrelation = Math.min(minCorrelation, correlation);
          }
        }
      }
    }
    
    const averageCorrelation = pairCount > 0 ? totalCorrelation / pairCount : 0;
    
    return {
      averageCorrelation,
      maxCorrelation,
      minCorrelation,
      correlationMatrix: correlations
    };
  }

  private calculateConcentrationMetrics(portfolio: Portfolio): RiskDecomposition['concentrationMetrics'] {
    const weights = portfolio.holdings.map(h => h.weight / 100);
    
    // Herfindahl Index
    const herfindahlIndex = weights.reduce((sum, w) => sum + w * w, 0);
    
    // Effective number of positions
    const effectiveNumberOfPositions = herfindahlIndex > 0 ? 1 / herfindahlIndex : 0;
    
    // Sort weights for concentration calculations
    const sortedWeights = [...weights].sort((a, b) => b - a);
    
    const top5Concentration = sortedWeights.slice(0, 5).reduce((sum, w) => sum + w, 0) * 100;
    const top10Concentration = sortedWeights.slice(0, 10).reduce((sum, w) => sum + w, 0) * 100;
    const maxSinglePosition = sortedWeights[0] * 100;
    
    return {
      herfindahlIndex,
      effectiveNumberOfPositions,
      top5Concentration,
      top10Concentration,
      maxSinglePosition
    };
  }

  // Mock data methods (would use real market data in production)
  private getMockSectorReturn(sector: string, type: 'portfolio' | 'benchmark'): number {
    const base = type === 'portfolio' ? 0.08 : 0.07; // 8% vs 7% base return
    const sectorMultiplier = this.getSectorMultiplier(sector);
    return base * sectorMultiplier + (Math.random() - 0.5) * 0.02;
  }

  private getMockSecurityReturn(symbol: string, type: 'portfolio' | 'benchmark'): number {
    const base = type === 'portfolio' ? 0.1 : 0.08;
    return base + (Math.random() - 0.5) * 0.1;
  }

  private getMockSectorVolatility(sector: string): number {
    const sectorVols: { [key: string]: number } = {
      'Technology': 0.25,
      'Healthcare': 0.18,
      'Financials': 0.22,
      'Consumer': 0.16,
      'Energy': 0.30,
      'Materials': 0.24,
      'Utilities': 0.12,
      'Other': 0.20
    };
    return sectorVols[sector] || 0.20;
  }

  private getMockAssetClassVolatility(assetClass: string): number {
    const assetClassVols: { [key: string]: number } = {
      'equity': 0.18,
      'fixed_income': 0.08,
      'commodity': 0.25,
      'fx': 0.12,
      'alternative': 0.15,
      'cash': 0.01
    };
    return assetClassVols[assetClass] || 0.15;
  }

  private getMockSecurityVolatility(symbol: string): number {
    return 0.15 + Math.random() * 0.2; // 15-35% volatility
  }

  private getSectorMultiplier(sector: string): number {
    const multipliers: { [key: string]: number } = {
      'Technology': 1.2,
      'Healthcare': 1.1,
      'Financials': 0.9,
      'Consumer': 1.0,
      'Energy': 0.8,
      'Materials': 0.9,
      'Utilities': 0.7,
      'Other': 1.0
    };
    return multipliers[sector] || 1.0;
  }

  private initializeDefaultBenchmarks(): void {
    // Create default benchmarks
    const sp500: Benchmark = {
      benchmarkId: 'SP500',
      name: 'S&P 500',
      description: 'Large cap US equity index',
      type: 'index',
      composition: [
        { symbol: 'AAPL', assetClass: 'equity', sector: 'Technology', weight: 6.5, expectedReturn: 0.12, volatility: 0.25 },
        { symbol: 'MSFT', assetClass: 'equity', sector: 'Technology', weight: 6.0, expectedReturn: 0.11, volatility: 0.23 },
        { symbol: 'GOOGL', assetClass: 'equity', sector: 'Technology', weight: 4.5, expectedReturn: 0.13, volatility: 0.26 },
        { symbol: 'AMZN', assetClass: 'equity', sector: 'Consumer', weight: 3.8, expectedReturn: 0.14, volatility: 0.28 },
        { symbol: 'TSLA', assetClass: 'equity', sector: 'Technology', weight: 2.1, expectedReturn: 0.18, volatility: 0.45 }
      ],
      performance: {
        inception: Date.now() - 365 * 24 * 60 * 60 * 1000,
        daily: this.generateMockPerformanceData(365, 0.08, 0.16),
        monthly: this.generateMockMonthlyData(12, 0.08, 0.16),
        yearly: this.generateMockYearlyData(3, 0.08, 0.16)
      },
      riskCharacteristics: {
        volatility: 0.16,
        var95: 0.025,
        maxDrawdown: 0.12,
        correlations: {}
      }
    };

    this.benchmarks.set('SP500', sp500);
    this.metrics.totalBenchmarks++;
  }

  private initializeFactorReturns(): void {
    const factors = ['Market', 'Size', 'Value', 'Momentum', 'Quality', 'Low Volatility'];
    
    for (const factor of factors) {
      const returns = [];
      for (let i = 0; i < 365; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        returns.push({
          date: date.toISOString().split('T')[0],
          return: (Math.random() - 0.5) * 0.02 // ±1% daily factor return
        });
      }
      this.factorReturns.set(factor, returns.reverse());
    }
  }

  private generateMockPerformanceData(days: number, annualReturn: number, volatility: number) {
    const data = [];
    let value = 100;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      const dailyReturn = (annualReturn / 252) + (Math.random() - 0.5) * (volatility / Math.sqrt(252));
      value *= (1 + dailyReturn);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value,
        return: dailyReturn
      });
    }
    
    return data;
  }

  private generateMockMonthlyData(months: number, annualReturn: number, volatility: number) {
    const data = [];
    
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - i));
      
      const monthlyReturn = (annualReturn / 12) + (Math.random() - 0.5) * (volatility / Math.sqrt(12));
      const monthlyVolatility = volatility / Math.sqrt(12);
      
      data.push({
        month: date.toISOString().substring(0, 7),
        return: monthlyReturn,
        volatility: monthlyVolatility
      });
    }
    
    return data;
  }

  private generateMockYearlyData(years: number, annualReturn: number, volatility: number) {
    const data = [];
    
    for (let i = 0; i < years; i++) {
      const year = new Date().getFullYear() - (years - i - 1);
      const yearlyReturn = annualReturn + (Math.random() - 0.5) * volatility;
      const sharpe = (yearlyReturn - 0.02) / volatility;
      const maxDrawdown = 0.05 + Math.random() * 0.15;
      
      data.push({
        year,
        return: yearlyReturn,
        volatility,
        sharpe,
        maxDrawdown
      });
    }
    
    return data;
  }

  private startAttributionCalculations(): void {
    this.calculationTimer = setInterval(() => {
      this.updatePerformanceMetrics();
    }, 3600000); // Every hour
  }

  private updatePerformanceMetrics(): void {
    // Update average metrics across all portfolios
    const portfolios = Array.from(this.portfolios.values());
    
    if (portfolios.length > 0) {
      this.metrics.averageTrackingError = portfolios.reduce((sum, p) => sum + p.risk.trackingError, 0) / portfolios.length;
      this.metrics.averageInformationRatio = portfolios.reduce((sum, p) => sum + p.risk.informationRatio, 0) / portfolios.length;
    }
  }

  private generateAnalysisId(): string {
    return `ATTR_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateComparisonId(): string {
    return `COMP_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateDecompositionId(): string {
    return `RISK_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  // Public API
  getPortfolio(portfolioId: string): Portfolio | undefined {
    return this.portfolios.get(portfolioId);
  }

  getBenchmark(benchmarkId: string): Benchmark | undefined {
    return this.benchmarks.get(benchmarkId);
  }

  getAttributionAnalysis(analysisId: string): AttributionAnalysis | undefined {
    return this.attributionAnalyses.get(analysisId);
  }

  getPerformanceComparison(comparisonId: string): PerformanceComparison | undefined {
    return this.performanceComparisons.get(comparisonId);
  }

  getRiskDecomposition(decompositionId: string): RiskDecomposition | undefined {
    return this.riskDecompositions.get(decompositionId);
  }

  getAllPortfolios(): Portfolio[] {
    return Array.from(this.portfolios.values());
  }

  getAllBenchmarks(): Benchmark[] {
    return Array.from(this.benchmarks.values());
  }

  getMetrics() {
    return { ...this.metrics };
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Portfolio Attribution Engine...');
    
    if (this.calculationTimer) clearInterval(this.calculationTimer);
    
    this.portfolios.clear();
    this.benchmarks.clear();
    this.attributionAnalyses.clear();
    this.performanceComparisons.clear();
    this.riskDecompositions.clear();
    this.marketData.clear();
    this.factorReturns.clear();
    
    console.log('✅ Portfolio Attribution Engine shutdown complete');
  }
}