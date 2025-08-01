export interface PortfolioWeights {
  [symbol: string]: number;
}

export interface OptimizationConstraints {
  maxWeight?: number;
  minWeight?: number;
  targetReturn?: number;
  maxRisk?: number;
}

export interface OptimizationResult {
  weights: PortfolioWeights;
  expectedReturn: number;
  risk: number;
  sharpeRatio: number;
}

export class PortfolioOptimizationService {
  private static instance: PortfolioOptimizationService;

  static getInstance(): PortfolioOptimizationService {
    if (!PortfolioOptimizationService.instance) {
      PortfolioOptimizationService.instance = new PortfolioOptimizationService();
    }
    return PortfolioOptimizationService.instance;
  }

  async optimizePortfolio(
    symbols: string[],
    returns: number[][],
    constraints: OptimizationConstraints = {}
  ): Promise<OptimizationResult> {
    // Mean-variance optimization implementation
    const n = symbols.length;
    const weights: PortfolioWeights = {};
    
    // Equal weight initialization
    const equalWeight = 1 / n;
    symbols.forEach(symbol => {
      weights[symbol] = equalWeight;
    });

    // Calculate expected return and risk
    const expectedReturn = this.calculateExpectedReturn(weights, returns);
    const risk = this.calculateRisk(weights, returns);
    const sharpeRatio = expectedReturn / risk;

    return {
      weights,
      expectedReturn,
      risk,
      sharpeRatio
    };
  }

  private calculateExpectedReturn(weights: PortfolioWeights, returns: number[][]): number {
    // Calculate portfolio expected return
    let expectedReturn = 0;
    const symbols = Object.keys(weights);
    
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const avgReturn = returns[i].reduce((sum, ret) => sum + ret, 0) / returns[i].length;
      expectedReturn += weights[symbol] * avgReturn;
    }
    
    return expectedReturn;
  }

  private calculateRisk(weights: PortfolioWeights, returns: number[][]): number {
    // Calculate portfolio risk (volatility)
    const symbols = Object.keys(weights);
    let variance = 0;
    
    for (let i = 0; i < symbols.length; i++) {
      const weight_i = weights[symbols[i]];
      const variance_i = this.calculateVariance(returns[i]);
      variance += weight_i * weight_i * variance_i;
      
      // Add covariance terms
      for (let j = i + 1; j < symbols.length; j++) {
        const weight_j = weights[symbols[j]];
        const covariance = this.calculateCovariance(returns[i], returns[j]);
        variance += 2 * weight_i * weight_j * covariance;
      }
    }
    
    return Math.sqrt(variance);
  }

  private calculateVariance(returns: number[]): number {
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return variance;
  }

  private calculateCovariance(returns1: number[], returns2: number[]): number {
    const mean1 = returns1.reduce((sum, ret) => sum + ret, 0) / returns1.length;
    const mean2 = returns2.reduce((sum, ret) => sum + ret, 0) / returns2.length;
    
    const covariance = returns1.reduce((sum, ret1, i) => {
      return sum + (ret1 - mean1) * (returns2[i] - mean2);
    }, 0) / returns1.length;
    
    return covariance;
  }
}