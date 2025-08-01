export interface RiskMetrics {
  VaR: number;
  CVaR: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export class AdvancedRiskModelService {
  async calculateRiskMetrics(returns: number[], portfolioValue: number, confidence: number): Promise<RiskMetrics> {
    // Simple VaR calculation
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    const VaR = sortedReturns[index] * portfolioValue;
    
    // Simple CVaR (average of returns below VaR)
    const tailReturns = sortedReturns.slice(0, index);
    const CVaR = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length * portfolioValue;
    
    // Simple Sharpe ratio
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = avgReturn / stdDev;
    
    // Simple max drawdown
    let maxDrawdown = 0;
    let peak = 1;
    let cumReturn = 1;
    
    for (const r of returns) {
      cumReturn *= (1 + r);
      if (cumReturn > peak) peak = cumReturn;
      const drawdown = (peak - cumReturn) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    return {
      VaR,
      CVaR,
      sharpeRatio,
      maxDrawdown
    };
  }
}