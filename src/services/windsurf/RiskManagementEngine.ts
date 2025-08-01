import { EventEmitter } from 'events';
import * as math from 'mathjs';
import { jStat } from 'jstat';

// Types and Interfaces
export interface RiskPosition {
  assetId: string;
  symbol: string;
  quantity: number;
  currentPrice: number;
  marketValue: number;
  weight: number;
  historicalPrices?: number[];
  volatility?: number;
  beta?: number;
  correlations?: Map<string, number>;
}

export interface Portfolio {
  id: string;
  positions: RiskPosition[];
  totalValue: number;
  baseCurrency: string;
  lastUpdated: Date;
}

export interface RiskMetrics {
  portfolioValue: number;
  volatility: number;
  beta: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  currentDrawdown: number;
  valueAtRisk: VaRResult;
  expectedShortfall: ESResult;
  stressTestResults?: StressTestResult[];
  correlationMatrix?: number[][];
  componentVaR?: ComponentVaR[];
  marginalVaR?: MarginalVaR[];
}

export interface VaRResult {
  confidence: number;
  horizon: number; // days
  method: VaRMethod;
  value: number;
  percentageOfPortfolio: number;
  backtestResults?: BacktestResult;
}

export type VaRMethod = 'parametric' | 'historical' | 'montecarlo';

export interface ESResult {
  confidence: number;
  horizon: number;
  value: number;
  percentageOfPortfolio: number;
  tailScenarios: Scenario[];
}

export interface Scenario {
  probability: number;
  portfolioValue: number;
  loss: number;
  description?: string;
  affectedPositions?: Array<{
    assetId: string;
    priceChange: number;
    valueChange: number;
  }>;
}

export interface StressTestResult {
  scenario: StressScenario;
  portfolioValue: number;
  loss: number;
  lossPercentage: number;
  positionImpacts: PositionImpact[];
  riskMetrics: Partial<RiskMetrics>;
}

export interface StressScenario {
  name: string;
  description: string;
  marketShocks: MarketShock[];
  correlationOverride?: number[][];
  volatilityMultiplier?: number;
}

export interface MarketShock {
  assetClass?: string;
  assetId?: string;
  priceChangePercent?: number;
  volatilityChangePercent?: number;
  customFunction?: (position: RiskPosition) => number;
}

export interface PositionImpact {
  assetId: string;
  symbol: string;
  originalValue: number;
  stressedValue: number;
  valueChange: number;
  changePercent: number;
}

export interface ComponentVaR {
  assetId: string;
  symbol: string;
  componentVaR: number;
  percentageOfTotal: number;
}

export interface MarginalVaR {
  assetId: string;
  symbol: string;
  marginalVaR: number;
  deltaVaR: number; // Change in portfolio VaR from 1 unit change
}

export interface MonteCarloConfig {
  simulations: number;
  horizon: number;
  timeSteps: number;
  randomSeed?: number;
  antitheticVariates?: boolean;
  importanceSampling?: boolean;
}

export interface BacktestResult {
  violations: number;
  expectedViolations: number;
  violationRate: number;
  kupiecTest: { statistic: number; pValue: number; reject: boolean };
  christoffersenTest: { statistic: number; pValue: number; reject: boolean };
}

export interface RiskLimits {
  maxVaR?: { value: number; confidence: number; horizon: number };
  maxLeverage?: number;
  maxConcentration?: { singleAsset: number; assetClass: number };
  maxDrawdown?: number;
  minLiquidity?: number;
  stressTestLimits?: Array<{ scenario: string; maxLoss: number }>;
}

export interface RiskAlert {
  id: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  type: RiskAlertType;
  message: string;
  details: any;
  acknowledged: boolean;
}

export type RiskAlertType = 
  | 'var_breach'
  | 'concentration_limit'
  | 'drawdown_alert'
  | 'correlation_spike'
  | 'volatility_surge'
  | 'stress_test_failure'
  | 'liquidity_warning';

// Main Risk Management Engine
export class RiskManagementEngine extends EventEmitter {
  private monteCarloSimulator: MonteCarloSimulator;
  private stressTester: StressTester;
  private riskCalculator: RiskCalculator;
  private alertManager: RiskAlertManager;
  private limits: RiskLimits;

  constructor(limits?: RiskLimits) {
    super();
    this.monteCarloSimulator = new MonteCarloSimulator();
    this.stressTester = new StressTester();
    this.riskCalculator = new RiskCalculator();
    this.alertManager = new RiskAlertManager(this);
    this.limits = limits || this.getDefaultLimits();
  }

  /**
   * Calculate comprehensive risk metrics for portfolio
   */
  async calculateRiskMetrics(portfolio: Portfolio): Promise<RiskMetrics> {
    try {
      // Basic portfolio metrics
      const volatility = await this.riskCalculator.calculatePortfolioVolatility(portfolio);
      const beta = await this.riskCalculator.calculatePortfolioBeta(portfolio);
      const sharpeRatio = await this.riskCalculator.calculateSharpeRatio(portfolio);
      const sortinoRatio = await this.riskCalculator.calculateSortinoRatio(portfolio);
      
      // Drawdown analysis
      const { maxDrawdown, currentDrawdown } = await this.riskCalculator.calculateDrawdowns(portfolio);

      // Value at Risk
      const valueAtRisk = await this.calculateVaR(portfolio, 0.95, 1, 'montecarlo');

      // Expected Shortfall
      const expectedShortfall = await this.calculateExpectedShortfall(portfolio, 0.95, 1);

      // Correlation matrix
      const correlationMatrix = await this.riskCalculator.calculateCorrelationMatrix(portfolio);

      // Component and Marginal VaR
      const componentVaR = await this.calculateComponentVaR(portfolio, valueAtRisk);
      const marginalVaR = await this.calculateMarginalVaR(portfolio);

      const metrics: RiskMetrics = {
        portfolioValue: portfolio.totalValue,
        volatility,
        beta,
        sharpeRatio,
        sortinoRatio,
        maxDrawdown,
        currentDrawdown,
        valueAtRisk,
        expectedShortfall,
        correlationMatrix,
        componentVaR,
        marginalVaR
      };

      // Check risk limits
      await this.checkRiskLimits(portfolio, metrics);

      this.emit('risk:calculated', { portfolio, metrics });
      return metrics;
    } catch (error) {
      this.emit('risk:error', { portfolio, error });
      throw error;
    }
  }

  /**
   * Calculate Value at Risk
   */
  async calculateVaR(
    portfolio: Portfolio,
    confidence: number,
    horizon: number,
    method: VaRMethod = 'montecarlo'
  ): Promise<VaRResult> {
    let value: number;
    let backtestResults: BacktestResult | undefined;

    switch (method) {
      case 'parametric':
        value = await this.calculateParametricVaR(portfolio, confidence, horizon);
        break;
      
      case 'historical':
        value = await this.calculateHistoricalVaR(portfolio, confidence, horizon);
        break;
      
      case 'montecarlo':
        value = await this.calculateMonteCarloVaR(portfolio, confidence, horizon);
        break;
      
      default:
        throw new Error(`Unknown VaR method: ${method}`);
    }

    // Backtest if historical data available
    if (portfolio.positions.every(p => p.historicalPrices && p.historicalPrices.length > 250)) {
        backtestResults = await this.backtestVaR(portfolio, value, confidence, horizon);
    }

    return {
      confidence,
      horizon,
      method,
      value,
      percentageOfPortfolio: value / portfolio.totalValue,
      backtestResults
    };
  }

  /**
   * Calculate Expected Shortfall (Conditional VaR)
   */
  async calculateExpectedShortfall(
    portfolio: Portfolio,
    confidence: number,
    horizon: number
  ): Promise<ESResult> {
    // Run Monte Carlo simulation
    const config: MonteCarloConfig = {
      simulations: 10000,
      horizon,
      timeSteps: horizon,
      antitheticVariates: true
    };

    const scenarios = await this.monteCarloSimulator.simulate(portfolio, config);
    
    // Sort scenarios by portfolio value
    scenarios.sort((a, b) => a.portfolioValue - b.portfolioValue);

    // Find VaR threshold
    const varIndex = Math.floor((1 - confidence) * scenarios.length);
    const varThreshold = scenarios[varIndex].portfolioValue;

    // Calculate average of tail scenarios
    const tailScenarios = scenarios.slice(0, varIndex);
    const averageTailValue = tailScenarios.reduce((sum, s) => sum + s.portfolioValue, 0) / tailScenarios.length;
    const expectedShortfall = portfolio.totalValue - averageTailValue;

    return {
      confidence,
      horizon,
      value: expectedShortfall,
      percentageOfPortfolio: expectedShortfall / portfolio.totalValue,
      tailScenarios: tailScenarios.slice(0, 100) // Return worst 100 scenarios
    };
  }

  /**
   * Run stress tests on portfolio
   */
  async runStressTests(
    portfolio: Portfolio,
    scenarios?: StressScenario[]
  ): Promise<StressTestResult[]> {
    const defaultScenarios = scenarios || this.getDefaultStressScenarios();
    const results: StressTestResult[] = [];

    for (const scenario of defaultScenarios) {
      const result = await this.stressTester.runScenario(portfolio, scenario);
      results.push(result);

      // Check if stress test breaches limits
      if (this.limits.stressTestLimits) {
        const limit = this.limits.stressTestLimits.find(l => l.scenario === scenario.name);
        if (limit && result.lossPercentage > limit.maxLoss) {
          this.alertManager.createAlert({
            severity: 'critical',
            type: 'stress_test_failure',
            message: `Stress test '${scenario.name}' exceeds loss limit: ${result.lossPercentage.toFixed(2)}% > ${limit.maxLoss}%`,
            details: { scenario, result }
          });
        }
      }
    }

    this.emit('stress:tested', { portfolio, results });
    return results;
  }

  /**
   * Calculate component VaR
   */
  private async calculateComponentVaR(
    portfolio: Portfolio,
    portfolioVaR: VaRResult
  ): Promise<ComponentVaR[]> {
    const components: ComponentVaR[] = [];
    const marginalVaRs = await this.calculateMarginalVaR(portfolio);

    // Component VaR = position weight × marginal VaR
    for (const position of portfolio.positions) {
      const marginal = marginalVaRs.find(m => m.assetId === position.assetId);
      if (marginal) {
        const componentVaR = position.weight * marginal.marginalVaR;
        components.push({
          assetId: position.assetId,
          symbol: position.symbol,
          componentVaR,
          percentageOfTotal: componentVaR / portfolioVaR.value
        });
      }
    }

    return components;
  }

  /**
   * Calculate marginal VaR
   */
  private async calculateMarginalVaR(portfolio: Portfolio): Promise<MarginalVaR[]> {
    const marginalVaRs: MarginalVaR[] = [];
    const baseVaR = await this.calculateVaR(portfolio, 0.95, 1, 'parametric');

    for (const position of portfolio.positions) {
      // Calculate VaR with small position change
      const deltaQuantity = position.quantity * 0.01; // 1% change
      const modifiedPortfolio = this.clonePortfolio(portfolio);
      const modifiedPosition = modifiedPortfolio.positions.find(p => p.assetId === position.assetId)!;
      modifiedPosition.quantity += deltaQuantity;
      modifiedPosition.marketValue = modifiedPosition.quantity * modifiedPosition.currentPrice;

      // Recalculate weights
      const newTotalValue = modifiedPortfolio.positions.reduce((sum, p) => sum + p.marketValue, 0);
      modifiedPortfolio.totalValue = newTotalValue;
      modifiedPortfolio.positions.forEach(p => {
        p.weight = p.marketValue / newTotalValue;
      });

      const newVaR = await this.calculateVaR(modifiedPortfolio, 0.95, 1, 'parametric');
      const deltaVaR = newVaR.value - baseVaR.value;
      const marginalVaR = deltaVaR / (deltaQuantity * position.currentPrice);

      marginalVaRs.push({
        assetId: position.assetId,
        symbol: position.symbol,
        marginalVaR,
        deltaVaR
      });
    }

    return marginalVaRs;
  }

  /**
   * Calculate parametric VaR
   */
  private async calculateParametricVaR(
    portfolio: Portfolio,
    confidence: number,
    horizon: number
  ): Promise<number> {
    const portfolioVolatility = await this.riskCalculator.calculatePortfolioVolatility(portfolio);
    const zScore = jStat.normal.inv(confidence, 0, 1);
    
    // Scale volatility to horizon
    const scaledVolatility = portfolioVolatility * Math.sqrt(horizon / 252);
    
    return portfolio.totalValue * zScore * scaledVolatility;
  }

  /**
   * Calculate historical VaR
   */
  private async calculateHistoricalVaR(
    portfolio: Portfolio,
    confidence: number,
    horizon: number
  ): Promise<number> {
    // Get historical returns for all positions
    const portfolioReturns = await this.riskCalculator.calculateHistoricalPortfolioReturns(portfolio, horizon);
    
    if (portfolioReturns.length < 250) {
      throw new Error('Insufficient historical data for historical VaR calculation');
    }

    // Sort returns
    const sortedReturns = [...portfolioReturns].sort((a, b) => a - b);
    
    // Find percentile
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    const varReturn = sortedReturns[index];
    
    return -varReturn * portfolio.totalValue;
  }

  /**
   * Calculate Monte Carlo VaR
   */
  private async calculateMonteCarloVaR(
    portfolio: Portfolio,
    confidence: number,
    horizon: number
  ): Promise<number> {
    const config: MonteCarloConfig = {
      simulations: 10000,
      horizon,
      timeSteps: Math.min(horizon, 10),
      antitheticVariates: true
    };

    const scenarios = await this.monteCarloSimulator.simulate(portfolio, config);
    
    // Sort scenarios by portfolio value
    scenarios.sort((a, b) => a.portfolioValue - b.portfolioValue);
    
    // Find VaR at confidence level
    const index = Math.floor((1 - confidence) * scenarios.length);
    const varValue = portfolio.totalValue - scenarios[index].portfolioValue;
    
    return varValue;
  }

  /**
   * Backtest VaR model
   */
  private async backtestVaR(
    portfolio: Portfolio,
    varValue: number,
    confidence: number,
    horizon: number
  ): Promise<BacktestResult> {
    const historicalReturns = await this.riskCalculator.calculateHistoricalPortfolioReturns(portfolio, horizon);
    const lookback = 250; // One year of daily data

    if (historicalReturns.length < lookback) {
      throw new Error('Insufficient data for backtesting');
    }

    // Count violations
    let violations = 0;
    const losses = historicalReturns.slice(-lookback).map(r => -r * portfolio.totalValue);
    
    for (const loss of losses) {
      if (loss > varValue) {
        violations++;
      }
    }

    const expectedViolations = lookback * (1 - confidence);
    const violationRate = violations / lookback;

    // Kupiec test (unconditional coverage)
    const kupiecTest = this.kupiecTest(violations, lookback, confidence);

    // Christoffersen test (conditional coverage)
    const christoffersenTest = this.christoffersenTest(losses, varValue, confidence);

    return {
      violations,
      expectedViolations,
      violationRate,
      kupiecTest,
      christoffersenTest
    };
  }

  /**
   * Kupiec test for VaR backtesting
   */
  private kupiecTest(
    violations: number,
    observations: number,
    confidence: number
  ): { statistic: number; pValue: number; reject: boolean } {
    const p = 1 - confidence;
    const likelihood = -2 * Math.log(
      Math.pow(p, violations) * Math.pow(1 - p, observations - violations) /
      Math.pow(violations / observations, violations) * 
      Math.pow(1 - violations / observations, observations - violations)
    );

    // Chi-square distribution with 1 degree of freedom
    const pValue = 1 - jStat.chisquare.cdf(likelihood, 1);
    const reject = pValue < 0.05;

    return { statistic: likelihood, pValue, reject };
  }

  /**
   * Christoffersen test for VaR backtesting
   */
  private christoffersenTest(
    losses: number[],
    varValue: number,
    confidence: number
  ): { statistic: number; pValue: number; reject: boolean } {
    // Simplified implementation
    // In practice, would test for independence of violations
    const violations = losses.map(l => l > varValue ? 1 : 0);
    
    // Count transitions
    let n00 = 0, n01 = 0, n10 = 0, n11 = 0;
    for (let i = 1; i < violations.length; i++) {
      if (violations[i - 1] === 0 && violations[i] === 0) n00++;
      else if (violations[i - 1] === 0 && violations[i] === 1) n01++;
      else if (violations[i - 1] === 1 && violations[i] === 0) n10++;
      else n11++;
    }

    // Calculate likelihood ratio
    const p01 = n01 / (n00 + n01);
    const p11 = n11 / (n10 + n11);
    const p = (n01 + n11) / (n00 + n01 + n10 + n11);

    const likelihood = -2 * Math.log(
      Math.pow(1 - p, n00 + n10) * Math.pow(p, n01 + n11) /
      (Math.pow(1 - p01, n00) * Math.pow(p01, n01) * 
       Math.pow(1 - p11, n10) * Math.pow(p11, n11))
    );

    // Chi-square distribution with 1 degree of freedom
    const pValue = 1 - jStat.chisquare.cdf(likelihood, 1);
    const reject = pValue < 0.05;

    return { statistic: likelihood, pValue, reject };
  }

  /**
   * Check risk limits and generate alerts
   */
  private async checkRiskLimits(portfolio: Portfolio, metrics: RiskMetrics): Promise<void> {
    // VaR limit check
    if (this.limits.maxVaR && metrics.valueAtRisk.value > this.limits.maxVaR.value) {
      this.alertManager.createAlert({
        severity: 'critical',
        type: 'var_breach',
        message: `VaR exceeds limit: ${metrics.valueAtRisk.value.toFixed(0)} > ${this.limits.maxVaR.value}`,
        details: { current: metrics.valueAtRisk, limit: this.limits.maxVaR }
      });
    }

    // Concentration limit check
    if (this.limits.maxConcentration) {
      for (const position of portfolio.positions) {
        if (position.weight > this.limits.maxConcentration.singleAsset) {
          this.alertManager.createAlert({
            severity: 'warning',
            type: 'concentration_limit',
            message: `Position ${position.symbol} exceeds concentration limit: ${(position.weight * 100).toFixed(1)}%`,
            details: { position, limit: this.limits.maxConcentration.singleAsset }
          });
        }
      }
    }

    // Drawdown alert
    if (this.limits.maxDrawdown && metrics.currentDrawdown > this.limits.maxDrawdown) {
      this.alertManager.createAlert({
        severity: 'critical',
        type: 'drawdown_alert',
        message: `Current drawdown exceeds limit: ${(metrics.currentDrawdown * 100).toFixed(1)}%`,
        details: { current: metrics.currentDrawdown, limit: this.limits.maxDrawdown }
      });
    }
  }

  /**
   * Get default risk limits
   */
  private getDefaultLimits(): RiskLimits {
    return {
      maxVaR: { value: 50000, confidence: 0.95, horizon: 1 },
      maxLeverage: 2,
      maxConcentration: { singleAsset: 0.2, assetClass: 0.4 },
      maxDrawdown: 0.15,
      minLiquidity: 0.1,
      stressTestLimits: [
        { scenario: 'Market Crash', maxLoss: 0.25 },
        { scenario: 'Interest Rate Shock', maxLoss: 0.15 },
        { scenario: 'Currency Crisis', maxLoss: 0.20 }
      ]
    };
  }

  /**
   * Get default stress scenarios
   */
  private getDefaultStressScenarios(): StressScenario[] {
    return [
      {
        name: 'Market Crash',
        description: '2008-style financial crisis',
        marketShocks: [
          { assetClass: 'equity', priceChangePercent: -40 },
          { assetClass: 'bond', priceChangePercent: -10 },
          { assetClass: 'commodity', priceChangePercent: -30 }
        ],
        volatilityMultiplier: 2.5
      },
      {
        name: 'Interest Rate Shock',
        description: '200bps rate increase',
        marketShocks: [
          { assetClass: 'bond', priceChangePercent: -15 },
          { assetClass: 'equity', priceChangePercent: -10 }
        ],
        volatilityMultiplier: 1.5
      },
      {
        name: 'Currency Crisis',
        description: 'Major currency devaluation',
        marketShocks: [
          { assetClass: 'forex', priceChangePercent: -25 },
          { assetClass: 'equity', priceChangePercent: -15 }
        ],
        volatilityMultiplier: 2.0
      },
      {
        name: 'Black Swan',
        description: 'Extreme tail event',
        marketShocks: [
          { assetClass: 'equity', priceChangePercent: -50 },
          { assetClass: 'bond', priceChangePercent: -20 },
          { assetClass: 'commodity', priceChangePercent: -40 }
        ],
        volatilityMultiplier: 3.0
      }
    ];
  }

  /**
   * Clone portfolio for calculations
   */
  private clonePortfolio(portfolio: Portfolio): Portfolio {
    return {
      ...portfolio,
      positions: portfolio.positions.map(p => ({ ...p }))
    };
  }

  /**
   * Update risk limits
   */
  updateRiskLimits(limits: Partial<RiskLimits>): void {
    this.limits = { ...this.limits, ...limits };
    this.emit('limits:updated', this.limits);
  }

  /**
   * Get active risk alerts
   */
  getActiveAlerts(): RiskAlert[] {
    return this.alertManager.getActiveAlerts();
  }
}

// Monte Carlo Simulator
class MonteCarloSimulator {
  private randomGenerator: RandomGenerator;

  constructor() {
    this.randomGenerator = new RandomGenerator();
  }

  async simulate(
    portfolio: Portfolio,
    config: MonteCarloConfig
  ): Promise<Scenario[]> {
    const scenarios: Scenario[] = [];
    
    // Get return and volatility parameters
    const params = await this.getSimulationParameters(portfolio);
    
    // Set random seed if provided
    if (config.randomSeed) {
      this.randomGenerator.seed(config.randomSeed);
    }

    // Run simulations
    for (let sim = 0; sim < config.simulations; sim++) {
      const scenario = this.runSingleSimulation(portfolio, params, config);
      scenarios.push(scenario);

      // Antithetic variates
      if (config.antitheticVariates && sim < config.simulations / 2) {
        const antitheticScenario = this.runAntitheticSimulation(portfolio, params, config, scenario);
        scenarios.push(antitheticScenario);
        sim++; // Count antithetic as additional simulation
      }
    }

    return scenarios;
  }

  private async getSimulationParameters(portfolio: Portfolio): Promise<SimulationParams> {
    const returns: number[] = [];
    const volatilities: number[] = [];
    const correlationMatrix: number[][] = [];

    // Calculate parameters for each position
    for (const position of portfolio.positions) {
      const historicalReturns = this.calculateReturns(position.historicalPrices || []);
      const meanReturn = historicalReturns.length > 0 
        ? historicalReturns.reduce((a, b) => a + b, 0) / historicalReturns.length
        : 0.08 / 252; // Default 8% annual

      const volatility = position.volatility || this.calculateVolatility(historicalReturns) || 0.20 / Math.sqrt(252);

      returns.push(meanReturn);
      volatilities.push(volatility);
    }

    // Build correlation matrix
    for (let i = 0; i < portfolio.positions.length; i++) {
      correlationMatrix[i] = [];
      for (let j = 0; j < portfolio.positions.length; j++) {
        if (i === j) {
          correlationMatrix[i][j] = 1;
        } else {
          // Use provided correlations or default
          const correlation = portfolio.positions[i].correlations?.get(portfolio.positions[j].assetId) || 0.5;
          correlationMatrix[i][j] = correlation;
        }
      }
    }

    return { returns, volatilities, correlationMatrix };
  }

  private runSingleSimulation(
    portfolio: Portfolio,
    params: SimulationParams,
    config: MonteCarloConfig
  ): Scenario {
    const positions = portfolio.positions;
    const finalValues: number[] = new Array(positions.length);
    
    // Generate correlated random returns
    const correlatedReturns = this.generateCorrelatedReturns(
      params,
      config.horizon,
      config.timeSteps
    );

    // Calculate final position values
    for (let i = 0; i < positions.length; i++) {
      let value = positions[i].marketValue;
      
      for (let t = 0; t < config.timeSteps; t++) {
        const dayReturn = correlatedReturns[t][i];
        value *= (1 + dayReturn);
      }
      
      finalValues[i] = value;
    }

    const finalPortfolioValue = finalValues.reduce((sum, v) => sum + v, 0);
    const loss = portfolio.totalValue - finalPortfolioValue;

    return {
      probability: 1 / config.simulations,
      portfolioValue: finalPortfolioValue,
      loss,
      affectedPositions: positions.map((p, i) => ({
        assetId: p.assetId,
        priceChange: (finalValues[i] / p.marketValue - 1),
        valueChange: finalValues[i] - p.marketValue
      }))
    };
  }

  private runAntitheticSimulation(
    portfolio: Portfolio,
    params: SimulationParams,
    config: MonteCarloConfig,
    originalScenario: Scenario
  ): Scenario {
    // Create antithetic scenario by reversing returns
    const antitheticValue = 2 * portfolio.totalValue - originalScenario.portfolioValue;
    
    return {
      probability: 1 / config.simulations,
      portfolioValue: antitheticValue,
      loss: portfolio.totalValue - antitheticValue,
      affectedPositions: originalScenario.affectedPositions?.map(ap => ({
        assetId: ap.assetId,
        priceChange: -ap.priceChange,
        valueChange: -ap.valueChange
      }))
    };
  }

  private generateCorrelatedReturns(
    params: SimulationParams,
    horizon: number,
    timeSteps: number
  ): number[][] {
    const n = params.returns.length;
    const dt = horizon / timeSteps;
    const returns: number[][] = [];

    // Cholesky decomposition of correlation matrix
    const L = this.choleskyDecomposition(params.correlationMatrix);

    for (let t = 0; t < timeSteps; t++) {
      // Generate independent normal random variables
      const Z = new Array(n).fill(0).map(() => this.randomGenerator.normal());
      
      // Transform to correlated variables
      const correlatedZ = this.matrixMultiply(L, Z);
      
      // Calculate returns
      const dayReturns = correlatedZ.map((z, i) => 
        params.returns[i] * dt + params.volatilities[i] * Math.sqrt(dt) * z
      );
      
      returns.push(dayReturns);
    }

    return returns;
  }

  private choleskyDecomposition(matrix: number[][]): number[][] {
    const n = matrix.length;
    const L: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = 0;
        
        for (let k = 0; k < j; k++) {
          sum += L[i][k] * L[j][k];
        }
        
        if (i === j) {
          L[i][j] = Math.sqrt(matrix[i][i] - sum);
        } else {
          L[i][j] = (matrix[i][j] - sum) / L[j][j];
        }
      }
    }

    return L;
  }

  private matrixMultiply(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => 
      row.reduce((sum, val, i) => sum + val * vector[i], 0)
    );
  }

  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    
    return Math.sqrt(variance);
  }
}

// Stress Tester
class StressTester {
  async runScenario(
    portfolio: Portfolio,
    scenario: StressScenario
  ): Promise<StressTestResult> {
    const stressedPortfolio = this.applyStressScenario(portfolio, scenario);
    const positionImpacts = this.calculatePositionImpacts(portfolio, stressedPortfolio);
    
    // Calculate stressed risk metrics
    const riskCalculator = new RiskCalculator();
    const stressedMetrics: Partial<RiskMetrics> = {
      portfolioValue: stressedPortfolio.totalValue,
      volatility: await riskCalculator.calculatePortfolioVolatility(stressedPortfolio) * (scenario.volatilityMultiplier || 1)
    };

    const loss = portfolio.totalValue - stressedPortfolio.totalValue;
    const lossPercentage = loss / portfolio.totalValue;

    return {
      scenario,
      portfolioValue: stressedPortfolio.totalValue,
      loss,
      lossPercentage,
      positionImpacts,
      riskMetrics: stressedMetrics
    };
  }

  private applyStressScenario(
    portfolio: Portfolio,
    scenario: StressScenario
  ): Portfolio {
    const stressedPortfolio = {
      ...portfolio,
      positions: portfolio.positions.map(p => ({ ...p }))
    };

    // Apply market shocks
    for (const shock of scenario.marketShocks) {
      for (const position of stressedPortfolio.positions) {
        if (this.matchesShock(position, shock)) {
          const priceChange = shock.customFunction 
            ? shock.customFunction(position)
            : (shock.priceChangePercent || 0) / 100;
          
          position.currentPrice *= (1 + priceChange);
          position.marketValue = position.quantity * position.currentPrice;
          
          if (shock.volatilityChangePercent) {
            position.volatility = (position.volatility || 0.2) * (1 + shock.volatilityChangePercent / 100);
          }
        }
      }
    }

    // Recalculate portfolio value and weights
    stressedPortfolio.totalValue = stressedPortfolio.positions.reduce((sum, p) => sum + p.marketValue, 0);
    stressedPortfolio.positions.forEach(p => {
      p.weight = p.marketValue / stressedPortfolio.totalValue;
    });

    return stressedPortfolio;
  }

  private matchesShock(position: RiskPosition, shock: MarketShock): boolean {
    if (shock.assetId) {
      return position.assetId === shock.assetId;
    }
    
    // Match by asset class (simplified - would need asset class mapping)
    if (shock.assetClass) {
      // This would require asset class information in position
      return true; // Placeholder
    }
    
    return false;
  }

  private calculatePositionImpacts(
    original: Portfolio,
    stressed: Portfolio
  ): PositionImpact[] {
    return original.positions.map((originalPos, i) => {
      const stressedPos = stressed.positions[i];
      const valueChange = stressedPos.marketValue - originalPos.marketValue;
      
      return {
        assetId: originalPos.assetId,
        symbol: originalPos.symbol,
        originalValue: originalPos.marketValue,
        stressedValue: stressedPos.marketValue,
        valueChange,
        changePercent: valueChange / originalPos.marketValue
      };
    });
  }
}

// Risk Calculator
class RiskCalculator {
  async calculatePortfolioVolatility(portfolio: Portfolio): Promise<number> {
    const weights = portfolio.positions.map(p => p.weight);
    const volatilities = portfolio.positions.map(p => p.volatility || 0.2);
    const correlationMatrix = await this.calculateCorrelationMatrix(portfolio);

    let variance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        variance += weights[i] * weights[j] * volatilities[i] * volatilities[j] * correlationMatrix[i][j];
      }
    }

    return Math.sqrt(variance);
  }

  async calculatePortfolioBeta(portfolio: Portfolio): Promise<number> {
    // Simplified - assumes market beta
    const weightedBeta = portfolio.positions.reduce((sum, p) => 
      sum + p.weight * (p.beta || 1), 0
    );
    return weightedBeta;
  }

  async calculateSharpeRatio(portfolio: Portfolio): Promise<number> {
    const returns = await this.calculateHistoricalPortfolioReturns(portfolio, 1);
    if (returns.length < 30) return 0;

    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const volatility = this.calculateVolatilityFromReturns(returns);
    const annualizedReturn = meanReturn * 252;
    const annualizedVolatility = volatility * Math.sqrt(252);
    const riskFreeRate = 0.02;

    return (annualizedReturn - riskFreeRate) / annualizedVolatility;
  }

  async calculateSortinoRatio(portfolio: Portfolio): Promise<number> {
    const returns = await this.calculateHistoricalPortfolioReturns(portfolio, 1);
    if (returns.length < 30) return 0;

    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const downsideReturns = returns.filter(r => r < 0);
    
    if (downsideReturns.length === 0) return Infinity;

    const downsideVolatility = this.calculateVolatilityFromReturns(downsideReturns);
    const annualizedReturn = meanReturn * 252;
    const annualizedDownsideVolatility = downsideVolatility * Math.sqrt(252);
    const riskFreeRate = 0.02;

    return (annualizedReturn - riskFreeRate) / annualizedDownsideVolatility;
  }

  async calculateDrawdowns(portfolio: Portfolio): Promise<{ maxDrawdown: number; currentDrawdown: number }> {
    const returns = await this.calculateHistoricalPortfolioReturns(portfolio, 1);
    if (returns.length === 0) return { maxDrawdown: 0, currentDrawdown: 0 };

    let peak = 1;
    let maxDrawdown = 0;
    let value = 1;

    for (const ret of returns) {
      value *= (1 + ret);
      if (value > peak) {
        peak = value;
      }
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const currentDrawdown = (peak - value) / peak;

    return { maxDrawdown, currentDrawdown };
  }

  async calculateCorrelationMatrix(portfolio: Portfolio): Promise<number[][]> {
    const n = portfolio.positions.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          // Use provided correlations or calculate from historical data
          const correlation = portfolio.positions[i].correlations?.get(portfolio.positions[j].assetId);
          if (correlation !== undefined) {
            matrix[i][j] = correlation;
          } else {
            // Calculate from historical prices if available
            matrix[i][j] = await this.calculateHistoricalCorrelation(
              portfolio.positions[i],
              portfolio.positions[j]
            );
          }
        }
      }
    }

    return matrix;
  }

  async calculateHistoricalPortfolioReturns(
    portfolio: Portfolio,
    horizon: number
  ): Promise<number[]> {
    // Get minimum history length
    const minLength = Math.min(...portfolio.positions.map(p => 
      p.historicalPrices?.length || 0
    ));

    if (minLength < 2) return [];

    const returns: number[] = [];
    const weights = portfolio.positions.map(p => p.weight);

    for (let i = horizon; i < minLength; i++) {
      let portfolioReturn = 0;
      
      for (let j = 0; j < portfolio.positions.length; j++) {
        const prices = portfolio.positions[j].historicalPrices!;
        const assetReturn = (prices[i] - prices[i - horizon]) / prices[i - horizon];
        portfolioReturn += weights[j] * assetReturn;
      }
      
      returns.push(portfolioReturn);
    }

    return returns;
  }

  private calculateVolatilityFromReturns(returns: number[]): number {
    if (returns.length < 2) return 0;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    
    return Math.sqrt(variance);
  }

  private async calculateHistoricalCorrelation(
    position1: RiskPosition,
    position2: RiskPosition
  ): Promise<number> {
    if (!position1.historicalPrices || !position2.historicalPrices) {
      return 0.5; // Default correlation
    }

    const returns1 = this.calculateReturnsFromPrices(position1.historicalPrices);
    const returns2 = this.calculateReturnsFromPrices(position2.historicalPrices);

    const minLength = Math.min(returns1.length, returns2.length);
    if (minLength < 30) return 0.5; // Not enough data

    // Align returns
    const aligned1 = returns1.slice(-minLength);
    const aligned2 = returns2.slice(-minLength);

    // Calculate correlation
    const mean1 = aligned1.reduce((a, b) => a + b, 0) / minLength;
    const mean2 = aligned2.reduce((a, b) => a + b, 0) / minLength;

    let covariance = 0;
    let variance1 = 0;
    let variance2 = 0;

    for (let i = 0; i < minLength; i++) {
      const dev1 = aligned1[i] - mean1;
      const dev2 = aligned2[i] - mean2;
      covariance += dev1 * dev2;
      variance1 += dev1 * dev1;
      variance2 += dev2 * dev2;
    }

    const correlation = covariance / Math.sqrt(variance1 * variance2);
    return Math.max(-1, Math.min(1, correlation)); // Ensure valid range
  }

  private calculateReturnsFromPrices(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }
}

// Risk Alert Manager
class RiskAlertManager {
  private alerts: RiskAlert[] = [];
  private idCounter = 0;

  constructor(private engine: RiskManagementEngine) {}

  createAlert(alert: Omit<RiskAlert, 'id' | 'timestamp' | 'acknowledged'>): RiskAlert {
    const fullAlert: RiskAlert = {
      ...alert,
      id: `risk-alert-${++this.idCounter}`,
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.push(fullAlert);
    this.engine.emit('alert:created', fullAlert);

    return fullAlert;
  }

  getActiveAlerts(): RiskAlert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.engine.emit('alert:acknowledged', alert);
    }
  }

  clearOldAlerts(daysToKeep: number = 30): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);
    
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
  }
}

// Random Number Generator
class RandomGenerator {
  private seedValue?: number;

  seed(value: number): void {
    this.seedValue = value;
  }

  normal(): number {
    // Box-Muller transform
    const u1 = this.random();
    const u2 = this.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private random(): number {
    if (this.seedValue !== undefined) {
      // Simple LCG for seeded random
      this.seedValue = (this.seedValue * 1103515245 + 12345) % 2147483648;
      return this.seedValue / 2147483648;
    }
    return Math.random();
  }
}

// Helper Types
interface SimulationParams {
  returns: number[];
  volatilities: number[];
  correlationMatrix: number[][];
}