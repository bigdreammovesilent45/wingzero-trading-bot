export interface RiskMetrics {
  var: number; // Value at Risk
  cvar: number; // Conditional Value at Risk
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  beta: number;
  alpha: number;
}

export interface RiskModelConfig {
  confidenceLevel: number;
  timeHorizon: number;
  benchmarkSymbol: string;
}

export class AdvancedRiskModelService {
  private static instance: AdvancedRiskModelService;
  private config: RiskModelConfig;

  private constructor() {
    this.config = {
      confidenceLevel: 0.95,
      timeHorizon: 1,
      benchmarkSymbol: 'SPY'
    };
  }

  static getInstance(): AdvancedRiskModelService {
    if (!AdvancedRiskModelService.instance) {
      AdvancedRiskModelService.instance = new AdvancedRiskModelService();
    }
    return AdvancedRiskModelService.instance;
  }

  async calculateRiskMetrics(
    portfolioReturns: number[],
    benchmarkReturns: number[]
  ): Promise<RiskMetrics> {
    const var95 = this.calculateVaR(portfolioReturns, this.config.confidenceLevel);
    const cvar95 = this.calculateCVaR(portfolioReturns, this.config.confidenceLevel);
    const maxDrawdown = this.calculateMaxDrawdown(portfolioReturns);
    const sharpeRatio = this.calculateSharpeRatio(portfolioReturns);
    const sortinoRatio = this.calculateSortinoRatio(portfolioReturns);
    const beta = this.calculateBeta(portfolioReturns, benchmarkReturns);
    const alpha = this.calculateAlpha(portfolioReturns, benchmarkReturns, beta);

    return {
      var: var95,
      cvar: cvar95,
      maxDrawdown,
      sharpeRatio,
      sortinoRatio,
      beta,
      alpha
    };
  }

  private calculateVaR(returns: number[], confidenceLevel: number): number {
    const sortedReturns = returns.slice().sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    return -sortedReturns[index];
  }

  private calculateCVaR(returns: number[], confidenceLevel: number): number {
    const sortedReturns = returns.slice().sort((a, b) => a - b);
    const cutoffIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const tailReturns = sortedReturns.slice(0, cutoffIndex);
    const avgTailReturn = tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
    return -avgTailReturn;
  }

  private calculateMaxDrawdown(returns: number[]): number {
    let peak = 0;
    let maxDrawdown = 0;
    let cumulativeReturn = 1;

    for (const ret of returns) {
      cumulativeReturn *= (1 + ret);
      if (cumulativeReturn > peak) {
        peak = cumulativeReturn;
      }
      const drawdown = (peak - cumulativeReturn) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  }

  private calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const annualizedReturn = avgReturn * 252; // Daily to annual
    const volatility = this.calculateVolatility(returns) * Math.sqrt(252);
    return (annualizedReturn - riskFreeRate) / volatility;
  }

  private calculateSortinoRatio(returns: number[], riskFreeRate: number = 0.02): number {
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const annualizedReturn = avgReturn * 252;
    const downside = returns.filter(ret => ret < 0);
    const downsideVolatility = Math.sqrt(
      downside.reduce((sum, ret) => sum + ret * ret, 0) / downside.length
    ) * Math.sqrt(252);
    return (annualizedReturn - riskFreeRate) / downsideVolatility;
  }

  private calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]): number {
    const portfolioMean = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
    const benchmarkMean = benchmarkReturns.reduce((sum, ret) => sum + ret, 0) / benchmarkReturns.length;

    let covariance = 0;
    let benchmarkVariance = 0;

    for (let i = 0; i < portfolioReturns.length; i++) {
      const portfolioDiff = portfolioReturns[i] - portfolioMean;
      const benchmarkDiff = benchmarkReturns[i] - benchmarkMean;
      covariance += portfolioDiff * benchmarkDiff;
      benchmarkVariance += benchmarkDiff * benchmarkDiff;
    }

    covariance /= portfolioReturns.length;
    benchmarkVariance /= benchmarkReturns.length;

    return covariance / benchmarkVariance;
  }

  private calculateAlpha(
    portfolioReturns: number[],
    benchmarkReturns: number[],
    beta: number,
    riskFreeRate: number = 0.02
  ): number {
    const portfolioReturn = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length * 252;
    const benchmarkReturn = benchmarkReturns.reduce((sum, ret) => sum + ret, 0) / benchmarkReturns.length * 252;
    return portfolioReturn - (riskFreeRate + beta * (benchmarkReturn - riskFreeRate));
  }

  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  updateConfig(newConfig: Partial<RiskModelConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): RiskModelConfig {
    return { ...this.config };
  }
}