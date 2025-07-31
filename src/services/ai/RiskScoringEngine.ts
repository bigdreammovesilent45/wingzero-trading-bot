interface Portfolio {
  symbol: string;
  position: number;
  entryPrice: number;
  currentPrice: number;
  notionalValue: number;
  marginRequired: number;
}

interface RiskMetrics {
  symbol: string;
  timeframe: string;
  value_at_risk: {
    confidence_95: number;
    confidence_99: number;
    confidence_999: number;
  };
  expected_shortfall: {
    confidence_95: number;
    confidence_99: number;
  };
  maximum_drawdown: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  volatility: number;
  beta: number;
  correlation_to_market: number;
  risk_score: number;
  risk_category: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
}

interface MonteCarloResult {
  symbol: string;
  simulations: number;
  time_horizon_days: number;
  price_paths: number[][];
  returns_distribution: number[];
  percentiles: {
    p1: number;
    p5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  var_estimates: {
    confidence_95: number;
    confidence_99: number;
  };
  probability_of_loss: number;
  expected_return: number;
}

interface StressTestScenario {
  name: string;
  description: string;
  market_shock: number;
  volatility_multiplier: number;
  correlation_adjustment: number;
  duration_days: number;
}

interface StressTestResult {
  scenario: string;
  portfolio_impact: number;
  worst_case_loss: number;
  recovery_time_days: number;
  margin_impact: number;
  liquidation_risk: number;
}

export class RiskScoringEngine {
  private portfolios: Map<string, Portfolio[]> = new Map();
  private riskMetrics: Map<string, RiskMetrics> = new Map();
  private historicalReturns: Map<string, number[]> = new Map();
  private correlationMatrix: Map<string, Map<string, number>> = new Map();
  
  private isRunning = false;
  private readonly UPDATE_INTERVAL = 300000;
  private readonly MONTE_CARLO_SIMULATIONS = 10000;
  private readonly LOOKBACK_DAYS = 252;

  private readonly STRESS_SCENARIOS: StressTestScenario[] = [
    {
      name: 'Financial Crisis',
      description: 'Market crash similar to 2008',
      market_shock: -0.30,
      volatility_multiplier: 3.0,
      correlation_adjustment: 0.8,
      duration_days: 60
    },
    {
      name: 'Currency Crisis',
      description: 'Major currency devaluation',
      market_shock: -0.15,
      volatility_multiplier: 2.0,
      correlation_adjustment: 0.6,
      duration_days: 30
    },
    {
      name: 'Interest Rate Shock',
      description: 'Sudden central bank rate change',
      market_shock: -0.10,
      volatility_multiplier: 1.5,
      correlation_adjustment: 0.4,
      duration_days: 21
    },
    {
      name: 'Geopolitical Crisis',
      description: 'Major geopolitical event',
      market_shock: -0.20,
      volatility_multiplier: 2.5,
      correlation_adjustment: 0.7,
      duration_days: 45
    }
  ];

  constructor() {}

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Risk Scoring Engine already running');
      return;
    }

    console.log('📊 Starting Risk Scoring Engine...');
    this.isRunning = true;

    await this.initializeHistoricalData();

    setInterval(() => {
      this.calculateAllRiskMetrics();
    }, this.UPDATE_INTERVAL);

    console.log('✅ Risk Scoring Engine started');
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('🛑 Risk Scoring Engine stopped');
  }

  private async initializeHistoricalData(): Promise<void> {
    const symbols = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD', 'BTC_USD', 'SPX500'];

    for (const symbol of symbols) {
      const returns = this.generateHistoricalReturns(symbol, this.LOOKBACK_DAYS);
      this.historicalReturns.set(symbol, returns);
      console.log(`📈 Initialized ${returns.length} return observations for ${symbol}`);
    }

    this.calculateCorrelationMatrix();
  }

  private generateHistoricalReturns(symbol: string, days: number): number[] {
    const returns: number[] = [];
    const baseVolatility = this.getSymbolVolatility(symbol);

    for (let i = 0; i < days; i++) {
      const standardReturn = this.generateNormalRandom() * baseVolatility;
      
      const fatTailFactor = Math.random() < 0.05 ? 2.5 : 1.0;
      const volatilityCluster = Math.sin(i / 20) * 0.3 + 1.0;
      
      const dailyReturn = standardReturn * fatTailFactor * volatilityCluster;
      returns.push(dailyReturn);
    }

    return returns;
  }

  private getSymbolVolatility(symbol: string): number {
    const volatilities: { [key: string]: number } = {
      'EUR_USD': 0.0085,
      'GBP_USD': 0.0120,
      'USD_JPY': 0.0095,
      'XAU_USD': 0.0180,
      'BTC_USD': 0.0450,
      'SPX500': 0.0160
    };

    return volatilities[symbol] || 0.0100;
  }

  private generateNormalRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private calculateCorrelationMatrix(): void {
    const symbols = Array.from(this.historicalReturns.keys());
    
    for (const symbol1 of symbols) {
      if (!this.correlationMatrix.has(symbol1)) {
        this.correlationMatrix.set(symbol1, new Map());
      }
      
      for (const symbol2 of symbols) {
        const correlation = this.calculateCorrelation(
          this.historicalReturns.get(symbol1)!,
          this.historicalReturns.get(symbol2)!
        );
        
        this.correlationMatrix.get(symbol1)!.set(symbol2, correlation);
      }
    }
  }

  private calculateCorrelation(returns1: number[], returns2: number[]): number {
    const n = Math.min(returns1.length, returns2.length);
    const mean1 = returns1.slice(0, n).reduce((sum, r) => sum + r, 0) / n;
    const mean2 = returns2.slice(0, n).reduce((sum, r) => sum + r, 0) / n;

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = returns1[i] - mean1;
      const diff2 = returns2[i] - mean2;
      
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }

    return numerator / Math.sqrt(denominator1 * denominator2);
  }

  async runMonteCarloSimulation(
    symbol: string, 
    timeHorizonDays: number = 1,
    simulations: number = this.MONTE_CARLO_SIMULATIONS
  ): Promise<MonteCarloResult> {
    console.log(`🎲 Running Monte Carlo simulation for ${symbol}...`);

    const historicalReturns = this.historicalReturns.get(symbol);
    if (!historicalReturns) {
      throw new Error(`No historical data for ${symbol}`);
    }

    const mean = historicalReturns.reduce((sum, r) => sum + r, 0) / historicalReturns.length;
    const variance = historicalReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / historicalReturns.length;
    const volatility = Math.sqrt(variance);

    const pricePaths: number[][] = [];
    const finalReturns: number[] = [];

    for (let sim = 0; sim < simulations; sim++) {
      const path: number[] = [100];
      let cumulativeReturn = 0;

      for (let day = 0; day < timeHorizonDays; day++) {
        const randomReturn = this.generateNormalRandom() * volatility + mean;
        cumulativeReturn += randomReturn;
        
        const newPrice = path[path.length - 1] * Math.exp(randomReturn);
        path.push(newPrice);
      }

      pricePaths.push(path);
      finalReturns.push(cumulativeReturn);
    }

    const sortedReturns = [...finalReturns].sort((a, b) => a - b);
    const percentiles = {
      p1: sortedReturns[Math.floor(0.01 * simulations)],
      p5: sortedReturns[Math.floor(0.05 * simulations)],
      p10: sortedReturns[Math.floor(0.10 * simulations)],
      p25: sortedReturns[Math.floor(0.25 * simulations)],
      p50: sortedReturns[Math.floor(0.50 * simulations)],
      p75: sortedReturns[Math.floor(0.75 * simulations)],
      p90: sortedReturns[Math.floor(0.90 * simulations)],
      p95: sortedReturns[Math.floor(0.95 * simulations)],
      p99: sortedReturns[Math.floor(0.99 * simulations)]
    };

    const var95 = -percentiles.p5;
    const var99 = -percentiles.p1;

    const lossCount = finalReturns.filter(r => r < 0).length;
    const probabilityOfLoss = lossCount / simulations;

    const expectedReturn = finalReturns.reduce((sum, r) => sum + r, 0) / simulations;

    return {
      symbol,
      simulations,
      time_horizon_days: timeHorizonDays,
      price_paths: pricePaths.slice(0, 100),
      returns_distribution: finalReturns,
      percentiles,
      var_estimates: {
        confidence_95: var95,
        confidence_99: var99
      },
      probability_of_loss: probabilityOfLoss,
      expected_return: expectedReturn
    };
  }

  private async calculateAllRiskMetrics(): Promise<void> {
    if (!this.isRunning) return;

    console.log('📊 Calculating risk metrics for all symbols...');

    for (const [symbol, returns] of this.historicalReturns.entries()) {
      try {
        const metrics = await this.calculateRiskMetrics(symbol, returns);
        this.riskMetrics.set(symbol, metrics);
      } catch (error) {
        console.error(`❌ Failed to calculate risk metrics for ${symbol}:`, error);
      }
    }
  }

  private async calculateRiskMetrics(symbol: string, returns: number[]): Promise<RiskMetrics> {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance * 252);

    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95 = -sortedReturns[Math.floor(0.05 * returns.length)];
    const var99 = -sortedReturns[Math.floor(0.01 * returns.length)];
    const var999 = -sortedReturns[Math.floor(0.001 * returns.length)];

    const tailReturns95 = sortedReturns.slice(0, Math.floor(0.05 * returns.length));
    const es95 = -tailReturns95.reduce((sum, r) => sum + r, 0) / tailReturns95.length;
    
    const tailReturns99 = sortedReturns.slice(0, Math.floor(0.01 * returns.length));
    const es99 = -tailReturns99.reduce((sum, r) => sum + r, 0) / tailReturns99.length;

    const maxDrawdown = this.calculateMaxDrawdown(returns);

    const riskFreeRate = 0.02 / 252;
    const excessReturns = returns.map(r => r - riskFreeRate);
    const meanExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / returns.length;
    const sharpeRatio = meanExcessReturn / Math.sqrt(variance);

    const downsideReturns = returns.filter(r => r < mean);
    const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / downsideReturns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);
    const sortinoRatio = meanExcessReturn / downsideDeviation;

    const marketReturns = this.historicalReturns.get('SPX500');
    let beta = 1.0;
    let correlationToMarket = 0.0;
    
    if (marketReturns && symbol !== 'SPX500') {
      const correlation = this.calculateCorrelation(returns, marketReturns);
      const marketVariance = marketReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / marketReturns.length;
      beta = correlation * Math.sqrt(variance / marketVariance);
      correlationToMarket = correlation;
    }

    const riskScore = this.calculateRiskScore({
      volatility,
      var99,
      maxDrawdown,
      sharpeRatio,
      beta
    });

    const riskCategory = this.categorizeRisk(riskScore);

    return {
      symbol,
      timeframe: '1d',
      value_at_risk: {
        confidence_95: var95,
        confidence_99: var99,
        confidence_999: var999
      },
      expected_shortfall: {
        confidence_95: es95,
        confidence_99: es99
      },
      maximum_drawdown: maxDrawdown,
      sharpe_ratio: sharpeRatio,
      sortino_ratio: sortinoRatio,
      volatility,
      beta,
      correlation_to_market: correlationToMarket,
      risk_score: riskScore,
      risk_category: riskCategory
    };
  }

  private calculateMaxDrawdown(returns: number[]): number {
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;

    for (const dailyReturn of returns) {
      cumulative += dailyReturn;
      
      if (cumulative > peak) {
        peak = cumulative;
      }
      
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private calculateRiskScore(metrics: {
    volatility: number;
    var99: number;
    maxDrawdown: number;
    sharpeRatio: number;
    beta: number;
  }): number {
    const volScore = Math.min(100, metrics.volatility * 500);
    const varScore = Math.min(100, metrics.var99 * 1000);
    const ddScore = Math.min(100, metrics.maxDrawdown * 500);
    const sharpeScore = Math.max(0, 50 - metrics.sharpeRatio * 20);
    const betaScore = Math.abs(metrics.beta - 1) * 30;

    const riskScore = (
      volScore * 0.25 +
      varScore * 0.25 +
      ddScore * 0.20 +
      sharpeScore * 0.20 +
      betaScore * 0.10
    );

    return Math.min(100, Math.max(0, riskScore));
  }

  private categorizeRisk(riskScore: number): 'very_low' | 'low' | 'medium' | 'high' | 'very_high' {
    if (riskScore < 20) return 'very_low';
    if (riskScore < 40) return 'low';
    if (riskScore < 60) return 'medium';
    if (riskScore < 80) return 'high';
    return 'very_high';
  }

  async runStressTest(portfolioId: string, scenario: StressTestScenario): Promise<StressTestResult> {
    console.log(`🧪 Running stress test: ${scenario.name}`);

    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    let totalImpact = 0;
    let worstCaseLoss = 0;
    let marginImpact = 0;
    let liquidationRisk = 0;

    for (const position of portfolio) {
      const historicalReturns = this.historicalReturns.get(position.symbol);
      if (!historicalReturns) continue;

      const baseVolatility = Math.sqrt(
        historicalReturns.reduce((sum, r) => sum + r * r, 0) / historicalReturns.length
      );
      
      const stressedVolatility = baseVolatility * scenario.volatility_multiplier;
      const positionShock = scenario.market_shock * (1 + stressedVolatility);
      
      const positionValue = position.notionalValue;
      const positionImpact = positionValue * positionShock * Math.sign(position.position);
      
      totalImpact += positionImpact;
      worstCaseLoss = Math.min(worstCaseLoss, positionImpact);
      
      const additionalMargin = Math.abs(positionImpact) * 0.1;
      marginImpact += additionalMargin;
      
      const lossRatio = Math.abs(positionImpact) / positionValue;
      if (lossRatio > 0.5) {
        liquidationRisk += 0.3;
      } else if (lossRatio > 0.3) {
        liquidationRisk += 0.1;
      }
    }

    liquidationRisk = Math.min(1.0, liquidationRisk);

    const recoveryTimeDays = Math.max(
      scenario.duration_days,
      Math.abs(totalImpact) / 10000 * 30
    );

    return {
      scenario: scenario.name,
      portfolio_impact: totalImpact,
      worst_case_loss: worstCaseLoss,
      recovery_time_days: recoveryTimeDays,
      margin_impact: marginImpact,
      liquidation_risk: liquidationRisk
    };
  }

  addPortfolio(portfolioId: string, positions: Portfolio[]): void {
    this.portfolios.set(portfolioId, positions);
    console.log(`📁 Added portfolio ${portfolioId} with ${positions.length} positions`);
  }

  updatePosition(portfolioId: string, symbol: string, updates: Partial<Portfolio>): void {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return;

    const position = portfolio.find(p => p.symbol === symbol);
    if (position) {
      Object.assign(position, updates);
    }
  }

  getRiskMetrics(symbol: string): RiskMetrics | null {
    return this.riskMetrics.get(symbol) || null;
  }

  getAllRiskMetrics(): Map<string, RiskMetrics> {
    return new Map(this.riskMetrics);
  }

  async getMonteCarloVaR(symbol: string, confidenceLevel: number = 0.95, timeHorizon: number = 1): Promise<number> {
    const simulation = await this.runMonteCarloSimulation(symbol, timeHorizon);
    
    if (confidenceLevel === 0.95) {
      return simulation.var_estimates.confidence_95;
    } else if (confidenceLevel === 0.99) {
      return simulation.var_estimates.confidence_99;
    } else {
      return simulation.var_estimates.confidence_95;
    }
  }

  async runAllStressTests(portfolioId: string): Promise<StressTestResult[]> {
    const results: StressTestResult[] = [];
    
    for (const scenario of this.STRESS_SCENARIOS) {
      try {
        const result = await this.runStressTest(portfolioId, scenario);
        results.push(result);
      } catch (error) {
        console.error(`❌ Stress test failed for ${scenario.name}:`, error);
      }
    }
    
    return results;
  }

  getPortfolioRiskSummary(portfolioId: string): {
    total_var_95: number;
    total_var_99: number;
    portfolio_beta: number;
    concentration_risk: number;
    correlation_risk: number;
    overall_risk_score: number;
  } | null {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return null;

    let totalVar95 = 0;
    let totalVar99 = 0;
    let weightedBeta = 0;
    let totalValue = 0;
    const symbols = portfolio.map(p => p.symbol);

    for (const position of portfolio) {
      const metrics = this.riskMetrics.get(position.symbol);
      if (!metrics) continue;

      const weight = Math.abs(position.notionalValue);
      totalValue += weight;
      
      totalVar95 += metrics.value_at_risk.confidence_95 * weight;
      totalVar99 += metrics.value_at_risk.confidence_99 * weight;
      weightedBeta += metrics.beta * weight;
    }

    totalVar95 /= totalValue;
    totalVar99 /= totalValue;
    weightedBeta /= totalValue;

    const concentrationRisk = portfolio.reduce((sum, p) => {
      const weight = Math.abs(p.notionalValue) / totalValue;
      return sum + weight * weight;
    }, 0);

    let correlationSum = 0;
    let correlationCount = 0;
    
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const corr = this.correlationMatrix.get(symbols[i])?.get(symbols[j]);
        if (corr !== undefined) {
          correlationSum += Math.abs(corr);
          correlationCount++;
        }
      }
    }
    
    const correlationRisk = correlationCount > 0 ? correlationSum / correlationCount : 0;

    const overallRiskScore = (
      totalVar99 * 40 +
      concentrationRisk * 30 +
      correlationRisk * 20 +
      Math.abs(weightedBeta - 1) * 10
    );

    return {
      total_var_95: totalVar95,
      total_var_99: totalVar99,
      portfolio_beta: weightedBeta,
      concentration_risk: concentrationRisk,
      correlation_risk: correlationRisk,
      overall_risk_score: Math.min(100, overallRiskScore * 100)
    };
  }

  getRiskAlerts(): {
    symbol: string;
    alert_type: 'high_var' | 'high_volatility' | 'correlation_spike' | 'drawdown_limit';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: number;
  }[] {
    const alerts: any[] = [];
    
    for (const [symbol, metrics] of this.riskMetrics.entries()) {
      if (metrics.value_at_risk.confidence_99 > 0.05) {
        alerts.push({
          symbol,
          alert_type: 'high_var',
          severity: metrics.value_at_risk.confidence_99 > 0.10 ? 'critical' : 'high',
          message: `High VaR detected: ${(metrics.value_at_risk.confidence_99 * 100).toFixed(2)}%`,
          timestamp: Date.now()
        });
      }

      if (metrics.volatility > 0.3) {
        alerts.push({
          symbol,
          alert_type: 'high_volatility',
          severity: metrics.volatility > 0.5 ? 'critical' : 'medium',
          message: `Elevated volatility: ${(metrics.volatility * 100).toFixed(1)}%`,
          timestamp: Date.now()
        });
      }

      if (metrics.maximum_drawdown > 0.15) {
        alerts.push({
          symbol,
          alert_type: 'drawdown_limit',
          severity: metrics.maximum_drawdown > 0.25 ? 'critical' : 'high',
          message: `High drawdown: ${(metrics.maximum_drawdown * 100).toFixed(1)}%`,
          timestamp: Date.now()
        });
      }
    }
    
    return alerts;
  }

  async forceUpdate(): Promise<void> {
    await this.calculateAllRiskMetrics();
  }
}