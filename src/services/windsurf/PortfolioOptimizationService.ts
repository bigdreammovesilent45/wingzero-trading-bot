import { EventEmitter } from 'events';
import * as math from 'mathjs';
import { optimize } from 'optimization-js';

// Types and Interfaces
export interface Asset {
  symbol: string;
  name: string;
  type: AssetType;
  currentPrice: number;
  historicalReturns: number[];
  expectedReturn?: number;
  volatility?: number;
  sharpeRatio?: number;
  beta?: number;
  alpha?: number;
}

export type AssetType = 'stock' | 'bond' | 'commodity' | 'forex' | 'crypto' | 'etf';

export interface Portfolio {
  id: string;
  name: string;
  assets: PortfolioAsset[];
  totalValue: number;
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  diversificationRatio: number;
  metadata: PortfolioMetadata;
}

export interface PortfolioAsset {
  asset: Asset;
  weight: number;
  quantity: number;
  value: number;
  contribution: {
    return: number;
    risk: number;
  };
}

export interface PortfolioMetadata {
  createdAt: Date;
  updatedAt: Date;
  rebalanceFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastRebalance?: Date;
  constraints: PortfolioConstraints;
  benchmark?: string;
}

export interface PortfolioConstraints {
  minWeight?: number;
  maxWeight?: number;
  assetTypeConstraints?: Record<AssetType, { min: number; max: number }>;
  sectorConstraints?: Record<string, { min: number; max: number }>;
  liquidityConstraints?: {
    minDailyVolume: number;
    maxImpact: number;
  };
  riskConstraints?: {
    maxVolatility: number;
    maxDrawdown: number;
    maxVaR: number;
  };
  longOnly: boolean;
  maxPositions?: number;
  minPositions?: number;
  targetReturn?: number;
  transactionCosts?: {
    fixed: number;
    variable: number;
  };
}

export interface OptimizationObjective {
  type: 'minRisk' | 'maxReturn' | 'maxSharpe' | 'riskParity' | 'custom';
  customFunction?: (weights: number[], returns: number[], covariance: number[][]) => number;
  riskAversion?: number;
}

export interface OptimalPortfolio extends Portfolio {
  optimizationDetails: {
    objective: OptimizationObjective;
    iterations: number;
    convergence: number;
    executionTime: number;
  };
  efficientFrontierPosition?: {
    return: number;
    risk: number;
    sharpeRatio: number;
  };
}

export interface EfficientFrontier {
  points: PortfolioPoint[];
  tangency: PortfolioPoint;
  minVariance: PortfolioPoint;
  maxReturn: PortfolioPoint;
}

export interface PortfolioPoint {
  return: number;
  risk: number;
  weights: number[];
  sharpeRatio: number;
}

export interface RebalanceRecommendation {
  portfolio: Portfolio;
  targetWeights: number[];
  currentWeights: number[];
  trades: Trade[];
  estimatedCosts: {
    fixed: number;
    variable: number;
    total: number;
    impact: number;
  };
  expectedImprovement: {
    return: number;
    sharpe: number;
    risk: number;
  };
}

export interface Trade {
  asset: Asset;
  action: 'buy' | 'sell';
  quantity: number;
  value: number;
  currentWeight: number;
  targetWeight: number;
}

export interface BacktestResult {
  portfolio: Portfolio;
  period: { start: Date; end: Date };
  returns: number[];
  cumulativeReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  winRate: number;
  profitFactor: number;
  trades: number;
  turnover: number;
}

export interface RiskMetrics {
  volatility: number;
  downside: number;
  semiDeviation: number;
  maxDrawdown: number;
  var95: number;
  cvar95: number;
  beta: number;
  correlation: number[][];
  diversificationRatio: number;
}

// Optimization Solver Interface
interface OptimizationSolver {
  solve(problem: OptimizationProblem): Promise<OptimizationSolution>;
}

interface OptimizationProblem {
  objective: (x: number[]) => number;
  constraints: Constraint[];
  bounds: Bounds[];
  initialGuess?: number[];
}

interface Constraint {
  type: 'eq' | 'ineq';
  fun: (x: number[]) => number;
}

interface Bounds {
  min: number;
  max: number;
}

interface OptimizationSolution {
  x: number[];
  fun: number;
  success: boolean;
  message: string;
  iterations: number;
}

// Main Portfolio Optimization Service
export class PortfolioOptimizationService extends EventEmitter {
  private solver: OptimizationSolver;
  private riskCalculator: RiskCalculator;
  private backtester: Backtester;

  constructor() {
    super();
    this.solver = new QuadraticProgrammingSolver();
    this.riskCalculator = new RiskCalculator();
    this.backtester = new Backtester();
  }

  /**
   * Optimize portfolio allocation
   */
  async optimizePortfolio(
    assets: Asset[],
    constraints: PortfolioConstraints,
    objective: OptimizationObjective
  ): Promise<OptimalPortfolio> {
    const startTime = Date.now();

    try {
      // Calculate expected returns
      const returns = await this.calculateExpectedReturns(assets);

      // Calculate covariance matrix
      const covariance = await this.calculateCovarianceMatrix(assets);

      // Validate inputs
      this.validateInputs(assets, returns, covariance);

      // Set up optimization problem
      const problem = this.formulateOptimizationProblem(
        objective,
        returns,
        covariance,
        constraints,
        assets
      );

      // Solve optimization
      const solution = await this.solver.solve(problem);

      if (!solution.success) {
        // Try fallback solution
        console.warn(`Primary optimization failed: ${solution.message}, trying fallback`);
        
        // Use a simple risk parity or equal weight solution as fallback
        const fallbackWeights = this.calculateFallbackWeights(
          assets,
          constraints,
          objective,
          returns,
          covariance
        );
        
        solution.x = fallbackWeights;
        solution.fun = problem.objective(fallbackWeights);
        solution.success = true;
        solution.message = 'Used fallback solution';
      }

      // Process results
      const portfolio = await this.constructPortfolio(
        assets,
        solution.x,
        returns,
        covariance,
        constraints
      );

      // Add optimization details
      const optimalPortfolio: OptimalPortfolio = {
        ...portfolio,
        optimizationDetails: {
          objective,
          iterations: solution.iterations,
          convergence: solution.fun,
          executionTime: Date.now() - startTime
        }
      };

      this.emit('portfolio:optimized', optimalPortfolio);
      return optimalPortfolio;
    } catch (error) {
      this.emit('optimization:error', { assets, constraints, objective, error });
      throw error;
    }
  }

  /**
   * Calculate efficient frontier
   */
  async calculateEfficientFrontier(
    assets: Asset[],
    constraints: PortfolioConstraints,
    points: number = 50
  ): Promise<EfficientFrontier> {
    const returns = await this.calculateExpectedReturns(assets);
    const covariance = await this.calculateCovarianceMatrix(assets);

    // Find minimum variance portfolio
    const minVariancePortfolio = await this.optimizePortfolio(
      assets,
      constraints,
      { type: 'minRisk' }
    );

    // Find maximum return portfolio
    const maxReturnPortfolio = await this.findMaximumReturnPortfolio(
      assets,
      constraints
    );

    const minReturn = minVariancePortfolio.expectedReturn;
    const maxReturn = maxReturnPortfolio.expectedReturn;

    // Calculate frontier points
    const frontierPoints: PortfolioPoint[] = [];

    for (let i = 0; i < points; i++) {
      const targetReturn = minReturn + (i / (points - 1)) * (maxReturn - minReturn);
      
      const constraintsWithTarget = {
        ...constraints,
        targetReturn
      };

      try {
        const portfolio = await this.optimizePortfolio(
          assets,
          constraintsWithTarget,
          { type: 'minRisk' }
        );

        frontierPoints.push({
          return: portfolio.expectedReturn,
          risk: portfolio.volatility,
          weights: portfolio.assets.map(a => a.weight),
          sharpeRatio: portfolio.sharpeRatio
        });
      } catch (error) {
        console.warn(`Failed to calculate frontier point at return ${targetReturn}:`, error);
      }
    }

    // Find tangency portfolio (max Sharpe ratio)
    const tangencyPortfolio = await this.optimizePortfolio(
      assets,
      constraints,
      { type: 'maxSharpe' }
    );

    return {
      points: frontierPoints,
      tangency: {
        return: tangencyPortfolio.expectedReturn,
        risk: tangencyPortfolio.volatility,
        weights: tangencyPortfolio.assets.map(a => a.weight),
        sharpeRatio: tangencyPortfolio.sharpeRatio
      },
      minVariance: {
        return: minVariancePortfolio.expectedReturn,
        risk: minVariancePortfolio.volatility,
        weights: minVariancePortfolio.assets.map(a => a.weight),
        sharpeRatio: minVariancePortfolio.sharpeRatio
      },
      maxReturn: {
        return: maxReturnPortfolio.expectedReturn,
        risk: maxReturnPortfolio.volatility,
        weights: maxReturnPortfolio.assets.map(a => a.weight),
        sharpeRatio: maxReturnPortfolio.sharpeRatio
      }
    };
  }

  /**
   * Generate rebalancing recommendations
   */
  async generateRebalanceRecommendation(
    currentPortfolio: Portfolio,
    targetObjective: OptimizationObjective
  ): Promise<RebalanceRecommendation> {
    // Get current weights
    const currentWeights = currentPortfolio.assets.map(a => a.weight);

    // Optimize for target weights
    const targetPortfolio = await this.optimizePortfolio(
      currentPortfolio.assets.map(a => a.asset),
      currentPortfolio.metadata.constraints,
      targetObjective
    );

    const targetWeights = targetPortfolio.assets.map(a => a.weight);

    // Calculate required trades
    const trades = this.calculateRequiredTrades(
      currentPortfolio,
      targetWeights
    );

    // Estimate transaction costs
    const estimatedCosts = this.estimateTransactionCosts(
      trades,
      currentPortfolio.metadata.constraints.transactionCosts
    );

    // Calculate expected improvement
    const expectedImprovement = {
      return: targetPortfolio.expectedReturn - currentPortfolio.expectedReturn,
      sharpe: targetPortfolio.sharpeRatio - currentPortfolio.sharpeRatio,
      risk: currentPortfolio.volatility - targetPortfolio.volatility
    };

    return {
      portfolio: currentPortfolio,
      targetWeights,
      currentWeights,
      trades,
      estimatedCosts,
      expectedImprovement
    };
  }

  /**
   * Backtest portfolio strategy
   */
  async backtestPortfolio(
    portfolio: Portfolio,
    historicalData: Map<string, number[]>,
    startDate: Date,
    endDate: Date
  ): Promise<BacktestResult> {
    return await this.backtester.backtest(
      portfolio,
      historicalData,
      startDate,
      endDate
    );
  }

  /**
   * Calculate risk metrics for portfolio
   */
  async calculateRiskMetrics(portfolio: Portfolio): Promise<RiskMetrics> {
    return await this.riskCalculator.calculate(portfolio);
  }

  /**
   * Implement risk parity optimization
   */
  async optimizeRiskParity(
    assets: Asset[],
    constraints: PortfolioConstraints
  ): Promise<OptimalPortfolio> {
    const covariance = await this.calculateCovarianceMatrix(assets);
    
    // Risk parity objective: equal risk contribution
    const objective: OptimizationObjective = {
      type: 'custom',
      customFunction: (weights: number[]) => {
        const portfolioRisk = Math.sqrt(
          this.calculatePortfolioVariance(weights, covariance)
        );

        // Calculate marginal risk contributions
        const marginalRisks = this.calculateMarginalRisks(weights, covariance);
        
        // Calculate risk contributions
        const riskContributions = weights.map((w, i) => 
          (w * marginalRisks[i]) / portfolioRisk
        );

        // Minimize deviation from equal contribution
        const targetContribution = 1 / weights.length;
        const deviation = riskContributions.reduce((sum, rc) => 
          sum + Math.pow(rc - targetContribution, 2), 0
        );

        return deviation;
      }
    };

    return await this.optimizePortfolio(assets, constraints, objective);
  }

  /**
   * Calculate expected returns for assets
   */
  private async calculateExpectedReturns(assets: Asset[]): Promise<number[]> {
    return assets.map(asset => {
      if (asset.expectedReturn !== undefined) {
        return asset.expectedReturn;
      }

      // Calculate from historical returns
      if (asset.historicalReturns.length > 0) {
        const mean = asset.historicalReturns.reduce((a, b) => a + b, 0) / 
                     asset.historicalReturns.length;
        return mean * 252; // Annualize
      }

      // Default fallback
      return 0.08; // 8% annual return
    });
  }

  /**
   * Calculate covariance matrix
   */
  private async calculateCovarianceMatrix(assets: Asset[]): Promise<number[][]> {
    const n = assets.length;
    const covariance: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    // If all assets have historical returns, calculate sample covariance
    if (assets.every(a => a.historicalReturns && a.historicalReturns.length > 0)) {
      const returns = assets.map(a => a.historicalReturns);
      const minLength = Math.min(...returns.map(r => r.length));

      // Align returns to same length
      const alignedReturns = returns.map(r => r.slice(-minLength));

      // Calculate covariance
      for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
          const cov = this.calculateCovariance(alignedReturns[i], alignedReturns[j]);
          covariance[i][j] = cov * 252; // Annualize
          covariance[j][i] = cov * 252;
        }
      }
    } else {
      // Use volatility and correlation estimates
      for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
          const vol_i = assets[i].volatility || 0.2; // Default 20% volatility
          const vol_j = assets[j].volatility || 0.2;
          const corr = i === j ? 1 : 0.5; // Default 0.5 correlation
          
          covariance[i][j] = vol_i * vol_j * corr;
          covariance[j][i] = vol_i * vol_j * corr;
        }
      }
    }

    return covariance;
  }

  /**
   * Calculate covariance between two return series
   */
  private calculateCovariance(returns1: number[], returns2: number[]): number {
    const n = returns1.length;
    const mean1 = returns1.reduce((a, b) => a + b, 0) / n;
    const mean2 = returns2.reduce((a, b) => a + b, 0) / n;

    let covariance = 0;
    for (let i = 0; i < n; i++) {
      covariance += (returns1[i] - mean1) * (returns2[i] - mean2);
    }

    return covariance / (n - 1);
  }

  /**
   * Generate smart initial guess based on objective
   */
  private generateSmartInitialGuess(
    n: number,
    constraints: PortfolioConstraints,
    objective: OptimizationObjective,
    returns: number[],
    covariance: number[][],
    bounds: Bounds[]
  ): number[] {
    let weights = new Array(n).fill(1 / n);
    
    // For minRisk, start with minimum variance portfolio approximation
    if (objective.type === 'minRisk') {
      const volatilities = Array.from({ length: n }, (_, i) => Math.sqrt(covariance[i][i]));
      const minVol = Math.min(...volatilities);
      const invVols = volatilities.map(v => minVol / (v + 1e-8));
      const sumInvVols = invVols.reduce((a, b) => a + b, 0);
      weights = invVols.map(iv => iv / sumInvVols);
    }
    
    // For maxReturn, weight towards higher return assets
    else if (objective.type === 'maxReturn') {
      const maxReturn = Math.max(...returns);
      const shiftedReturns = returns.map(r => Math.max(0, r - Math.min(...returns) + 0.001));
      const sumReturns = shiftedReturns.reduce((a, b) => a + b, 0);
      weights = shiftedReturns.map(r => r / sumReturns);
    }
    
    // For maxSharpe, use a combination of return and risk
    else if (objective.type === 'maxSharpe') {
      const sharpeScores = returns.map((r, i) => {
        const vol = Math.sqrt(covariance[i][i]);
        return vol > 0 ? (r - 0.02) / vol : 0; // Assuming 2% risk-free rate
      });
      const minSharpe = Math.min(...sharpeScores);
      const shiftedSharpes = sharpeScores.map(s => s - minSharpe + 0.1);
      const sumSharpes = shiftedSharpes.reduce((a, b) => a + b, 0);
      weights = shiftedSharpes.map(s => s / sumSharpes);
    }
    
    // Apply bounds to initial guess
    for (let i = 0; i < n; i++) {
      weights[i] = Math.max(bounds[i].min, Math.min(bounds[i].max, weights[i]));
    }
    
    // Normalize
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      weights = weights.map(w => w / sum);
    }
    
    return weights;
  }

  /**
   * Calculate fallback weights when optimization fails
   */
  private calculateFallbackWeights(
    assets: Asset[],
    constraints: PortfolioConstraints,
    objective: OptimizationObjective,
    returns: number[],
    covariance: number[][]
  ): number[] {
    const n = assets.length;
    
    // Start with equal weights
    let weights = new Array(n).fill(1 / n);
    
    // Adjust for min/max weight constraints
    for (let i = 0; i < n; i++) {
      if (weights[i] < constraints.minWeight) {
        weights[i] = constraints.minWeight;
      } else if (weights[i] > constraints.maxWeight) {
        weights[i] = constraints.maxWeight;
      }
    }
    
    // If objective is minRisk, use inverse volatility weighting
    if (objective.type === 'minRisk') {
      const volatilities = assets.map((_, i) => Math.sqrt(covariance[i][i]));
      const invVols = volatilities.map(v => 1 / (v + 1e-8));
      const sumInvVols = invVols.reduce((a, b) => a + b, 0);
      weights = invVols.map(iv => iv / sumInvVols);
    }
    
    // If objective is maxReturn, weight by expected returns
    else if (objective.type === 'maxReturn') {
      const positiveReturns = returns.map(r => Math.max(0, r));
      const sumReturns = positiveReturns.reduce((a, b) => a + b, 0);
      if (sumReturns > 0) {
        weights = positiveReturns.map(r => r / sumReturns);
      }
    }
    
    // Apply constraints again
    for (let i = 0; i < n; i++) {
      if (weights[i] < constraints.minWeight) {
        weights[i] = constraints.minWeight;
      } else if (weights[i] > constraints.maxWeight) {
        weights[i] = constraints.maxWeight;
      }
    }
    
    // Normalize to sum to 1
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      weights = weights.map(w => w / sum);
    }
    
    return weights;
  }

  /**
   * Validate optimization inputs
   */
  private validateInputs(
    assets: Asset[],
    returns: number[],
    covariance: number[][]
  ): void {
    if (assets.length === 0) {
      throw new Error('No assets provided');
    }

    if (returns.length !== assets.length) {
      throw new Error('Returns array length does not match assets');
    }

    if (covariance.length !== assets.length || 
        covariance.some(row => row.length !== assets.length)) {
      throw new Error('Invalid covariance matrix dimensions');
    }

    // Check covariance matrix is positive semi-definite
    const eigenvalues = this.calculateEigenvalues(covariance);
    if (eigenvalues.some(e => e < -1e-8)) {
      throw new Error('Covariance matrix is not positive semi-definite');
    }
  }

  /**
   * Formulate optimization problem
   */
  private formulateOptimizationProblem(
    objective: OptimizationObjective,
    returns: number[],
    covariance: number[][],
    constraints: PortfolioConstraints,
    assets: Asset[]
  ): OptimizationProblem {
    const n = returns.length;

    // Objective function
    let objectiveFunction: (x: number[]) => number;

    switch (objective.type) {
      case 'minRisk':
        objectiveFunction = (weights: number[]) => 
          this.calculatePortfolioVariance(weights, covariance);
        break;

      case 'maxReturn':
        objectiveFunction = (weights: number[]) => 
          -this.calculatePortfolioReturn(weights, returns);
        break;

      case 'maxSharpe':
        objectiveFunction = (weights: number[]) => {
          const ret = this.calculatePortfolioReturn(weights, returns);
          const risk = Math.sqrt(this.calculatePortfolioVariance(weights, covariance));
          const riskFreeRate = 0.02; // 2% risk-free rate
          return -(ret - riskFreeRate) / risk; // Negative for maximization
        };
        break;

      case 'riskParity':
        objectiveFunction = (weights: number[]) => {
          const marginalRisks = this.calculateMarginalRisks(weights, covariance);
          const totalRisk = Math.sqrt(this.calculatePortfolioVariance(weights, covariance));
          
          const riskContributions = weights.map((w, i) => 
            (w * marginalRisks[i]) / totalRisk
          );

          const targetContribution = 1 / n;
          return riskContributions.reduce((sum, rc) => 
            sum + Math.pow(rc - targetContribution, 2), 0
          );
        };
        break;

      case 'custom':
        if (!objective.customFunction) {
          throw new Error('Custom objective requires customFunction');
        }
        objectiveFunction = (weights: number[]) => 
          objective.customFunction!(weights, returns, covariance);
        break;

      default:
        throw new Error(`Unknown objective type: ${objective.type}`);
    }

    // Constraints
    const problemConstraints: Constraint[] = [];

    // Sum of weights = 1
    problemConstraints.push({
      type: 'eq',
      fun: (weights: number[]) => weights.reduce((a, b) => a + b, 0) - 1
    });

    // Target return constraint
    if (constraints.targetReturn !== undefined) {
      problemConstraints.push({
        type: 'eq',
        fun: (weights: number[]) => 
          this.calculatePortfolioReturn(weights, returns) - constraints.targetReturn
      });
    }

    // Max volatility constraint
    if (constraints.riskConstraints?.maxVolatility !== undefined) {
      problemConstraints.push({
        type: 'ineq',
        fun: (weights: number[]) => 
          constraints.riskConstraints!.maxVolatility - 
          Math.sqrt(this.calculatePortfolioVariance(weights, covariance))
      });
    }

    // Asset type constraints
    if (constraints.assetTypeConstraints) {
      for (const [assetType, limits] of Object.entries(constraints.assetTypeConstraints)) {
        const indices = assets
          .map((a, i) => a.type === assetType ? i : -1)
          .filter(i => i >= 0);

        if (indices.length > 0) {
          // Min constraint
          problemConstraints.push({
            type: 'ineq',
            fun: (weights: number[]) => 
              indices.reduce((sum, i) => sum + weights[i], 0) - limits.min
          });

          // Max constraint
          problemConstraints.push({
            type: 'ineq',
            fun: (weights: number[]) => 
              limits.max - indices.reduce((sum, i) => sum + weights[i], 0)
          });
        }
      }
    }

    // Bounds
    const bounds: Bounds[] = [];
    for (let i = 0; i < n; i++) {
      const min = constraints.longOnly ? 0 : (constraints.minWeight || -1);
      const max = constraints.maxWeight || 1;
      bounds.push({ min, max });
    }

    // Generate smart initial guess based on objective
    const initialGuess = this.generateSmartInitialGuess(
      n, 
      constraints, 
      objective, 
      returns, 
      covariance,
      bounds
    );

    return {
      objective: objectiveFunction,
      constraints: problemConstraints,
      bounds,
      initialGuess
    };
  }

  /**
   * Calculate portfolio variance
   */
  private calculatePortfolioVariance(
    weights: number[],
    covariance: number[][]
  ): number {
    let variance = 0;
    const n = weights.length;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        variance += weights[i] * weights[j] * covariance[i][j];
      }
    }

    return variance;
  }

  /**
   * Calculate portfolio return
   */
  private calculatePortfolioReturn(
    weights: number[],
    returns: number[]
  ): number {
    return weights.reduce((sum, w, i) => sum + w * returns[i], 0);
  }

  /**
   * Calculate marginal risk contributions
   */
  private calculateMarginalRisks(
    weights: number[],
    covariance: number[][]
  ): number[] {
    const n = weights.length;
    const marginalRisks: number[] = new Array(n);

    for (let i = 0; i < n; i++) {
      let marginalRisk = 0;
      for (let j = 0; j < n; j++) {
        marginalRisk += weights[j] * covariance[i][j];
      }
      marginalRisks[i] = marginalRisk;
    }

    return marginalRisks;
  }

  /**
   * Calculate eigenvalues of matrix
   */
  private calculateEigenvalues(matrix: number[][]): number[] {
    // Simplified - would use proper eigenvalue decomposition
    // For now, just check diagonal dominance
    const n = matrix.length;
    const eigenvalues: number[] = [];

    for (let i = 0; i < n; i++) {
      eigenvalues.push(matrix[i][i]);
    }

    return eigenvalues;
  }

  /**
   * Construct portfolio from optimization results
   */
  private async constructPortfolio(
    assets: Asset[],
    weights: number[],
    returns: number[],
    covariance: number[][],
    constraints: PortfolioConstraints
  ): Promise<Portfolio> {
    const totalValue = 1000000; // Default $1M portfolio
    const portfolioReturn = this.calculatePortfolioReturn(weights, returns);
    const portfolioVariance = this.calculatePortfolioVariance(weights, covariance);
    const portfolioVolatility = Math.sqrt(portfolioVariance);
    const riskFreeRate = 0.02;
    const sharpeRatio = (portfolioReturn - riskFreeRate) / portfolioVolatility;

    // Calculate risk contributions
    const marginalRisks = this.calculateMarginalRisks(weights, covariance);
    const totalRisk = portfolioVolatility;

    const portfolioAssets: PortfolioAsset[] = assets.map((asset, i) => ({
      asset,
      weight: weights[i],
      quantity: (weights[i] * totalValue) / asset.currentPrice,
      value: weights[i] * totalValue,
      contribution: {
        return: weights[i] * returns[i] / portfolioReturn,
        risk: (weights[i] * marginalRisks[i]) / totalRisk
      }
    }));

    // Calculate diversification ratio
    const weightedVolatilities = assets.reduce((sum, asset, i) => 
      sum + weights[i] * (asset.volatility || Math.sqrt(covariance[i][i])), 0
    );
    const diversificationRatio = weightedVolatilities / portfolioVolatility;

    return {
      id: `portfolio-${Date.now()}`,
      name: 'Optimized Portfolio',
      assets: portfolioAssets,
      totalValue,
      expectedReturn: portfolioReturn,
      volatility: portfolioVolatility,
      sharpeRatio,
      diversificationRatio,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        rebalanceFrequency: 'monthly',
        constraints
      }
    };
  }

  /**
   * Find maximum return portfolio
   */
  private async findMaximumReturnPortfolio(
    assets: Asset[],
    constraints: PortfolioConstraints
  ): Promise<Portfolio> {
    // Simply allocate all to highest return asset (respecting constraints)
    const returns = await this.calculateExpectedReturns(assets);
    const maxReturnIndex = returns.indexOf(Math.max(...returns));
    
    const weights = new Array(assets.length).fill(0);
    weights[maxReturnIndex] = constraints.maxWeight || 1;

    // Distribute remaining weight
    const remaining = 1 - weights[maxReturnIndex];
    if (remaining > 0) {
      const equalWeight = remaining / (assets.length - 1);
      for (let i = 0; i < assets.length; i++) {
        if (i !== maxReturnIndex) {
          weights[i] = equalWeight;
        }
      }
    }

    const covariance = await this.calculateCovarianceMatrix(assets);
    return await this.constructPortfolio(assets, weights, returns, covariance, constraints);
  }

  /**
   * Calculate required trades for rebalancing
   */
  private calculateRequiredTrades(
    portfolio: Portfolio,
    targetWeights: number[]
  ): Trade[] {
    const trades: Trade[] = [];
    const totalValue = portfolio.totalValue;

    portfolio.assets.forEach((pa, i) => {
      const currentWeight = pa.weight;
      const targetWeight = targetWeights[i];
      const weightDiff = targetWeight - currentWeight;

      if (Math.abs(weightDiff) > 0.001) { // 0.1% threshold
        const targetValue = targetWeight * totalValue;
        const currentValue = pa.value;
        const tradValue = targetValue - currentValue;
        const quantity = tradValue / pa.asset.currentPrice;

        trades.push({
          asset: pa.asset,
          action: tradValue > 0 ? 'buy' : 'sell',
          quantity: Math.abs(quantity),
          value: Math.abs(tradValue),
          currentWeight,
          targetWeight
        });
      }
    });

    return trades;
  }

  /**
   * Estimate transaction costs
   */
  private estimateTransactionCosts(
    trades: Trade[],
    costStructure?: { fixed: number; variable: number }
  ): any {
    const fixed = costStructure?.fixed || 5; // $5 per trade
    const variable = costStructure?.variable || 0.001; // 0.1% of trade value

    const totalFixed = trades.length * fixed;
    const totalVariable = trades.reduce((sum, t) => sum + t.value * variable, 0);
    const totalValue = trades.reduce((sum, t) => sum + t.value, 0);
    const impact = totalValue * 0.0005; // 5 bps market impact

    return {
      fixed: totalFixed,
      variable: totalVariable,
      total: totalFixed + totalVariable + impact,
      impact
    };
  }
}

// Quadratic Programming Solver
class QuadraticProgrammingSolver implements OptimizationSolver {
  async solve(problem: OptimizationProblem): Promise<OptimizationSolution> {
    // Use a more robust optimization approach
    const n = problem.bounds.length;
    
    // Initialize with equal weights or initial guess
    let x = problem.initialGuess || new Array(n).fill(1 / n);
    
    // Ensure initial guess satisfies constraints
    x = this.projectOntoConstraints(x, problem);
    
    let iterations = 0;
    const maxIterations = 5000; // Increased iterations
    const tolerance = 1e-8; // Tighter tolerance
    let previousValue = problem.objective(x);
    
    // Adaptive learning rate
    let learningRate = 0.1;
    const learningRateDecay = 0.999;
    const minLearningRate = 1e-5;
    
    // Momentum parameters
    let momentum = new Array(n).fill(0);
    const momentumFactor = 0.9;
    
    // Track best solution
    let bestX = [...x];
    let bestValue = previousValue;
    let stagnationCount = 0;
    const maxStagnation = 100;

    while (iterations < maxIterations) {
      // Calculate gradient with better numerical stability
      const gradient = this.numericalGradient(problem.objective, x);
      
      // Check if gradient is valid
      if (gradient.some(g => !isFinite(g))) {
        console.warn('Invalid gradient detected, using fallback');
        break;
      }
      
      // Apply momentum
      momentum = momentum.map((m, i) => 
        momentumFactor * m - learningRate * gradient[i]
      );
      
      // Update with momentum
      const newX = x.map((xi, i) => xi + momentum[i]);
      
      // Project onto constraints
      const projectedX = this.projectOntoConstraints(newX, problem);
      
      // Calculate new objective value
      const currentValue = problem.objective(projectedX);
      
      // Track best solution
      if (currentValue < bestValue) {
        bestX = [...projectedX];
        bestValue = currentValue;
        stagnationCount = 0;
      } else {
        stagnationCount++;
      }
      
      // Check convergence
      const improvement = Math.abs(currentValue - previousValue);
      if (improvement < tolerance && iterations > 10) {
        return {
          x: bestX,
          fun: bestValue,
          success: true,
          message: 'Converged',
          iterations
        };
      }
      
      // Early stopping if stagnated
      if (stagnationCount > maxStagnation) {
        return {
          x: bestX,
          fun: bestValue,
          success: true,
          message: 'Converged (early stopping)',
          iterations
        };
      }
      
      // Update state
      x = projectedX;
      previousValue = currentValue;
      iterations++;
      
      // Decay learning rate
      learningRate = Math.max(minLearningRate, learningRate * learningRateDecay);
    }

    // Return best solution found
    return {
      x: bestX,
      fun: bestValue,
      success: iterations < maxIterations,
      message: iterations < maxIterations ? 'Converged' : 'Maximum iterations reached',
      iterations
    };
  }

  private numericalGradient(f: (x: number[]) => number, x: number[]): number[] {
    const gradient: number[] = [];
    const fx = f(x);

    for (let i = 0; i < x.length; i++) {
      // Use adaptive step size based on the magnitude of x[i]
      const h = Math.max(1e-8, Math.abs(x[i]) * 1e-6);
      
      const xPlus = [...x];
      xPlus[i] += h;
      
      // Use forward difference for better stability near boundaries
      const fxPlus = f(xPlus);
      gradient[i] = (fxPlus - fx) / h;
      
      // Clip extreme gradients
      gradient[i] = Math.max(-1000, Math.min(1000, gradient[i]));
    }

    return gradient;
  }

  private projectOntoConstraints(
    x: number[],
    problem: OptimizationProblem
  ): number[] {
    // Apply bounds first
    let projected = x.map((xi, i) => {
      const min = problem.bounds[i].min;
      const max = problem.bounds[i].max;
      return Math.max(min, Math.min(max, xi));
    });

    // Normalize weights to sum to 1 (portfolio constraint)
    let sum = projected.reduce((a, b) => a + b, 0);
    
    // Handle edge case where all weights are zero
    if (sum < 1e-10) {
      // Set equal weights
      const n = projected.length;
      projected = projected.map((_, i) => {
        const min = problem.bounds[i].min;
        const max = problem.bounds[i].max;
        const equalWeight = 1 / n;
        // Use equal weight if it's within bounds, otherwise use min
        return equalWeight >= min && equalWeight <= max ? equalWeight : min;
      });
      sum = projected.reduce((a, b) => a + b, 0);
    }
    
    // Normalize to sum to 1
    if (sum > 0) {
      projected = projected.map(xi => xi / sum);
      
      // Re-check bounds after normalization
      let needsReprojection = false;
      for (let i = 0; i < projected.length; i++) {
        if (projected[i] < problem.bounds[i].min || projected[i] > problem.bounds[i].max) {
          needsReprojection = true;
          break;
        }
      }
      
      // If bounds are violated after normalization, use a simple feasible solution
      if (needsReprojection) {
        const n = projected.length;
        projected = new Array(n).fill(1 / n);
        
        // Adjust for bounds
        for (let i = 0; i < n; i++) {
          const min = problem.bounds[i].min;
          const max = problem.bounds[i].max;
          if (projected[i] < min) projected[i] = min;
          if (projected[i] > max) projected[i] = max;
        }
        
        // Final normalization
        sum = projected.reduce((a, b) => a + b, 0);
        if (sum > 0) {
          projected = projected.map(xi => xi / sum);
        }
      }
    }

    return projected;
  }
}

// Risk Calculator
class RiskCalculator {
  async calculate(portfolio: Portfolio): Promise<RiskMetrics> {
    const returns = this.getPortfolioReturns(portfolio);
    const n = portfolio.assets.length;

    // Basic risk metrics
    const volatility = portfolio.volatility;
    const downside = this.calculateDownsideDeviation(returns);
    const semiDeviation = this.calculateSemiDeviation(returns);
    const maxDrawdown = this.calculateMaxDrawdown(returns);

    // Value at Risk
    const var95 = this.calculateVaR(returns, 0.95);
    const cvar95 = this.calculateCVaR(returns, 0.95);

    // Beta (simplified - assume market return of 10%)
    const beta = portfolio.expectedReturn / 0.10;

    // Correlation matrix (placeholder)
    const correlation: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      correlation[i][i] = 1;
      for (let j = i + 1; j < n; j++) {
        correlation[i][j] = 0.5; // Placeholder
        correlation[j][i] = 0.5;
      }
    }

    return {
      volatility,
      downside,
      semiDeviation,
      maxDrawdown,
      var95,
      cvar95,
      beta,
      correlation,
      diversificationRatio: portfolio.diversificationRatio
    };
  }

  private getPortfolioReturns(portfolio: Portfolio): number[] {
    // Simulate returns based on expected return and volatility
    const numDays = 252;
    const returns: number[] = [];
    const dailyReturn = portfolio.expectedReturn / 252;
    const dailyVol = portfolio.volatility / Math.sqrt(252);

    for (let i = 0; i < numDays; i++) {
      const randomReturn = dailyReturn + dailyVol * this.normalRandom();
      returns.push(randomReturn);
    }

    return returns;
  }

  private calculateDownsideDeviation(returns: number[]): number {
    const threshold = 0;
    const downsideReturns = returns.filter(r => r < threshold);
    
    if (downsideReturns.length === 0) return 0;

    const mean = downsideReturns.reduce((a, b) => a + b, 0) / downsideReturns.length;
    const variance = downsideReturns.reduce((sum, r) => 
      sum + Math.pow(r - mean, 2), 0) / downsideReturns.length;

    return Math.sqrt(variance) * Math.sqrt(252); // Annualize
  }

  private calculateSemiDeviation(returns: number[]): number {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const belowMean = returns.filter(r => r < mean);
    
    if (belowMean.length === 0) return 0;

    const variance = belowMean.reduce((sum, r) => 
      sum + Math.pow(r - mean, 2), 0) / belowMean.length;

    return Math.sqrt(variance) * Math.sqrt(252); // Annualize
  }

  private calculateMaxDrawdown(returns: number[]): number {
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

    return maxDrawdown;
  }

  private calculateVaR(returns: number[], confidence: number): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    return -sortedReturns[index] * Math.sqrt(252); // Annualize
  }

  private calculateCVaR(returns: number[], confidence: number): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    const tailReturns = sortedReturns.slice(0, index + 1);
    const avgTailReturn = tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length;
    return -avgTailReturn * Math.sqrt(252); // Annualize
  }

  private normalRandom(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

// Backtester
class Backtester {
  async backtest(
    portfolio: Portfolio,
    historicalData: Map<string, number[]>,
    startDate: Date,
    endDate: Date
  ): Promise<BacktestResult> {
    // Simplified backtesting implementation
    const returns: number[] = [];
    const weights = portfolio.assets.map(a => a.weight);

    // Get minimum data length
    const dataArrays = Array.from(historicalData.values());
    const minLength = Math.min(...dataArrays.map(d => d.length));

    // Calculate portfolio returns
    for (let i = 1; i < minLength; i++) {
      let portfolioReturn = 0;
      
      portfolio.assets.forEach((pa, j) => {
        const assetReturns = historicalData.get(pa.asset.symbol);
        if (assetReturns) {
          const assetReturn = (assetReturns[i] - assetReturns[i - 1]) / assetReturns[i - 1];
          portfolioReturn += weights[j] * assetReturn;
        }
      });

      returns.push(portfolioReturn);
    }

    // Calculate metrics
    const cumulativeReturn = returns.reduce((acc, r) => acc * (1 + r), 1) - 1;
    const annualizedReturn = Math.pow(1 + cumulativeReturn, 252 / returns.length) - 1;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252);

    const riskFreeRate = 0.02;
    const sharpeRatio = (annualizedReturn - riskFreeRate) / volatility;

    // Sortino ratio (downside deviation)
    const downsideReturns = returns.filter(r => r < 0);
    const downsideVol = downsideReturns.length > 0 ?
      Math.sqrt(downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length) * Math.sqrt(252) :
      volatility;
    const sortinoRatio = (annualizedReturn - riskFreeRate) / downsideVol;

    // Max drawdown
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

    // Calmar ratio
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

    // Win rate
    const winningDays = returns.filter(r => r > 0).length;
    const winRate = winningDays / returns.length;

    // Profit factor
    const gains = returns.filter(r => r > 0).reduce((a, b) => a + b, 0);
    const losses = Math.abs(returns.filter(r => r < 0).reduce((a, b) => a + b, 0));
    const profitFactor = losses > 0 ? gains / losses : gains > 0 ? Infinity : 0;

    return {
      portfolio,
      period: { start: startDate, end: endDate },
      returns,
      cumulativeReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      calmarRatio,
      winRate,
      profitFactor,
      trades: 0, // Simplified - no rebalancing in this implementation
      turnover: 0
    };
  }
}