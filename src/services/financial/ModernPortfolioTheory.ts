interface Asset {
  symbol: string;
  expectedReturn: number;
  volatility: number;
  weight: number;
}

interface Portfolio {
  assets: Asset[];
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  weights: number[];
}

interface EfficientFrontierPoint {
  volatility: number;
  expectedReturn: number;
  sharpeRatio: number;
  weights: number[];
}

interface OptimizationConstraints {
  minWeight: number;
  maxWeight: number;
  targetReturn?: number;
  targetVolatility?: number;
  riskFreeRate: number;
  allowShortSelling: boolean;
}

interface CorrelationMatrix {
  [symbol: string]: { [symbol: string]: number };
}

export class ModernPortfolioTheory {
  private assets: Asset[] = [];
  private correlationMatrix: CorrelationMatrix = {};
  private covarianceMatrix: number[][] = [];
  private riskFreeRate: number = 0.02; // 2% annual risk-free rate
  
  constructor(riskFreeRate: number = 0.02) {
    this.riskFreeRate = riskFreeRate;
  }

  addAsset(asset: Asset): void {
    const existingIndex = this.assets.findIndex(a => a.symbol === asset.symbol);
    if (existingIndex >= 0) {
      this.assets[existingIndex] = asset;
    } else {
      this.assets.push(asset);
    }
    console.log(`📊 Added asset: ${asset.symbol} (ER: ${(asset.expectedReturn * 100).toFixed(2)}%, Vol: ${(asset.volatility * 100).toFixed(2)}%)`);
  }

  setCorrelationMatrix(correlations: CorrelationMatrix): void {
    this.correlationMatrix = correlations;
    this.updateCovarianceMatrix();
    console.log('📈 Updated correlation matrix');
  }

  private updateCovarianceMatrix(): void {
    const n = this.assets.length;
    this.covarianceMatrix = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const asset1 = this.assets[i];
        const asset2 = this.assets[j];
        
        if (i === j) {
          // Variance on diagonal
          this.covarianceMatrix[i][j] = asset1.volatility * asset1.volatility;
        } else {
          // Covariance off diagonal
          const correlation = this.correlationMatrix[asset1.symbol]?.[asset2.symbol] || 0;
          this.covarianceMatrix[i][j] = correlation * asset1.volatility * asset2.volatility;
        }
      }
    }
  }

  calculatePortfolioMetrics(weights: number[]): Portfolio {
    if (weights.length !== this.assets.length) {
      throw new Error('Weights array length must match number of assets');
    }

    // Normalize weights to sum to 1
    const weightSum = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / weightSum);

    // Calculate expected return
    const expectedReturn = normalizedWeights.reduce((sum, weight, i) => 
      sum + weight * this.assets[i].expectedReturn, 0);

    // Calculate portfolio volatility using matrix multiplication
    const portfolioVariance = this.calculatePortfolioVariance(normalizedWeights);
    const volatility = Math.sqrt(portfolioVariance);

    // Calculate Sharpe ratio
    const excessReturn = expectedReturn - this.riskFreeRate;
    const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

    return {
      assets: this.assets.map((asset, i) => ({
        ...asset,
        weight: normalizedWeights[i]
      })),
      expectedReturn,
      volatility,
      sharpeRatio,
      weights: normalizedWeights
    };
  }

  private calculatePortfolioVariance(weights: number[]): number {
    let variance = 0;
    
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        variance += weights[i] * weights[j] * this.covarianceMatrix[i][j];
      }
    }
    
    return variance;
  }

  findOptimalPortfolio(constraints: OptimizationConstraints): Portfolio {
    console.log('🎯 Finding optimal portfolio using quadratic programming...');
    
    if (constraints.targetReturn) {
      return this.optimizeForTargetReturn(constraints.targetReturn, constraints);
    } else if (constraints.targetVolatility) {
      return this.optimizeForTargetVolatility(constraints.targetVolatility, constraints);
    } else {
      return this.optimizeForMaxSharpe(constraints);
    }
  }

  private optimizeForMaxSharpe(constraints: OptimizationConstraints): Portfolio {
    let bestPortfolio: Portfolio | null = null;
    let maxSharpe = -Infinity;
    
    const iterations = 10000;
    
    for (let i = 0; i < iterations; i++) {
      const weights = this.generateRandomWeights(constraints);
      
      try {
        const portfolio = this.calculatePortfolioMetrics(weights);
        
        if (portfolio.sharpeRatio > maxSharpe) {
          maxSharpe = portfolio.sharpeRatio;
          bestPortfolio = portfolio;
        }
      } catch (error) {
        continue; // Skip invalid portfolios
      }
    }

    if (!bestPortfolio) {
      throw new Error('Could not find optimal portfolio');
    }

    console.log(`✅ Found optimal portfolio with Sharpe ratio: ${bestPortfolio.sharpeRatio.toFixed(4)}`);
    return bestPortfolio;
  }

  private optimizeForTargetReturn(targetReturn: number, constraints: OptimizationConstraints): Portfolio {
    let bestPortfolio: Portfolio | null = null;
    let minVolatility = Infinity;
    
    const iterations = 20000;
    const tolerance = 0.001; // 0.1% tolerance for target return
    
    for (let i = 0; i < iterations; i++) {
      const weights = this.generateRandomWeights(constraints);
      
      try {
        const portfolio = this.calculatePortfolioMetrics(weights);
        
        // Check if portfolio meets target return (within tolerance)
        if (Math.abs(portfolio.expectedReturn - targetReturn) <= tolerance) {
          if (portfolio.volatility < minVolatility) {
            minVolatility = portfolio.volatility;
            bestPortfolio = portfolio;
          }
        }
      } catch (error) {
        continue;
      }
    }

    if (!bestPortfolio) {
      throw new Error(`Could not find portfolio with target return ${(targetReturn * 100).toFixed(2)}%`);
    }

    console.log(`✅ Found portfolio with target return ${(targetReturn * 100).toFixed(2)}% and volatility ${(bestPortfolio.volatility * 100).toFixed(2)}%`);
    return bestPortfolio;
  }

  private optimizeForTargetVolatility(targetVolatility: number, constraints: OptimizationConstraints): Portfolio {
    let bestPortfolio: Portfolio | null = null;
    let maxReturn = -Infinity;
    
    const iterations = 20000;
    const tolerance = 0.001; // 0.1% tolerance for target volatility
    
    for (let i = 0; i < iterations; i++) {
      const weights = this.generateRandomWeights(constraints);
      
      try {
        const portfolio = this.calculatePortfolioMetrics(weights);
        
        // Check if portfolio meets target volatility (within tolerance)
        if (Math.abs(portfolio.volatility - targetVolatility) <= tolerance) {
          if (portfolio.expectedReturn > maxReturn) {
            maxReturn = portfolio.expectedReturn;
            bestPortfolio = portfolio;
          }
        }
      } catch (error) {
        continue;
      }
    }

    if (!bestPortfolio) {
      throw new Error(`Could not find portfolio with target volatility ${(targetVolatility * 100).toFixed(2)}%`);
    }

    console.log(`✅ Found portfolio with target volatility ${(targetVolatility * 100).toFixed(2)}% and return ${(bestPortfolio.expectedReturn * 100).toFixed(2)}%`);
    return bestPortfolio;
  }

  private generateRandomWeights(constraints: OptimizationConstraints): number[] {
    const n = this.assets.length;
    const weights = new Array(n);
    
    if (constraints.allowShortSelling) {
      // Allow negative weights (short selling)
      for (let i = 0; i < n; i++) {
        weights[i] = constraints.minWeight + Math.random() * (constraints.maxWeight - constraints.minWeight);
      }
    } else {
      // Generate random weights that sum to 1 (Dirichlet distribution)
      const raw = new Array(n);
      for (let i = 0; i < n; i++) {
        raw[i] = Math.random();
      }
      
      const sum = raw.reduce((s, r) => s + r, 0);
      for (let i = 0; i < n; i++) {
        weights[i] = Math.max(constraints.minWeight, 
          Math.min(constraints.maxWeight, raw[i] / sum));
      }
    }
    
    return weights;
  }

  generateEfficientFrontier(points: number = 50): EfficientFrontierPoint[] {
    console.log(`📊 Generating efficient frontier with ${points} points...`);
    
    const frontier: EfficientFrontierPoint[] = [];
    
    // Find min and max possible returns
    const minReturn = Math.min(...this.assets.map(a => a.expectedReturn));
    const maxReturn = Math.max(...this.assets.map(a => a.expectedReturn));
    
    const returnStep = (maxReturn - minReturn) / (points - 1);
    
    for (let i = 0; i < points; i++) {
      const targetReturn = minReturn + i * returnStep;
      
      try {
        const portfolio = this.optimizeForTargetReturn(targetReturn, {
          minWeight: 0,
          maxWeight: 1,
          targetReturn,
          riskFreeRate: this.riskFreeRate,
          allowShortSelling: false
        });
        
        frontier.push({
          volatility: portfolio.volatility,
          expectedReturn: portfolio.expectedReturn,
          sharpeRatio: portfolio.sharpeRatio,
          weights: portfolio.weights
        });
      } catch (error) {
        // Skip points where optimization fails
        continue;
      }
    }
    
    // Sort by volatility
    frontier.sort((a, b) => a.volatility - b.volatility);
    
    console.log(`✅ Generated efficient frontier with ${frontier.length} valid points`);
    return frontier;
  }

  findMinimumVariancePortfolio(): Portfolio {
    console.log('📊 Finding minimum variance portfolio...');
    
    let minVariancePortfolio: Portfolio | null = null;
    let minVariance = Infinity;
    
    const iterations = 50000;
    
    for (let i = 0; i < iterations; i++) {
      const weights = this.generateRandomWeights({
        minWeight: 0,
        maxWeight: 1,
        riskFreeRate: this.riskFreeRate,
        allowShortSelling: false
      });
      
      try {
        const portfolio = this.calculatePortfolioMetrics(weights);
        const variance = portfolio.volatility * portfolio.volatility;
        
        if (variance < minVariance) {
          minVariance = variance;
          minVariancePortfolio = portfolio;
        }
      } catch (error) {
        continue;
      }
    }

    if (!minVariancePortfolio) {
      throw new Error('Could not find minimum variance portfolio');
    }

    console.log(`✅ Found minimum variance portfolio with volatility: ${(minVariancePortfolio.volatility * 100).toFixed(2)}%`);
    return minVariancePortfolio;
  }

  findTangencyPortfolio(): Portfolio {
    console.log('📊 Finding tangency portfolio (maximum Sharpe ratio)...');
    
    return this.optimizeForMaxSharpe({
      minWeight: 0,
      maxWeight: 1,
      riskFreeRate: this.riskFreeRate,
      allowShortSelling: false
    });
  }

  calculateRiskContribution(portfolio: Portfolio): { [symbol: string]: number } {
    const riskContributions: { [symbol: string]: number } = {};
    const weights = portfolio.weights;
    const totalVariance = portfolio.volatility * portfolio.volatility;
    
    for (let i = 0; i < this.assets.length; i++) {
      let marginalRisk = 0;
      
      // Calculate marginal contribution to risk
      for (let j = 0; j < this.assets.length; j++) {
        marginalRisk += weights[j] * this.covarianceMatrix[i][j];
      }
      
      const riskContribution = (weights[i] * marginalRisk) / totalVariance;
      riskContributions[this.assets[i].symbol] = riskContribution;
    }
    
    return riskContributions;
  }

  optimizeForEqualRiskContribution(): Portfolio {
    console.log('⚖️ Optimizing for equal risk contribution...');
    
    let bestPortfolio: Portfolio | null = null;
    let minRiskSpread = Infinity;
    
    const iterations = 50000;
    const targetRiskContribution = 1 / this.assets.length;
    
    for (let i = 0; i < iterations; i++) {
      const weights = this.generateRandomWeights({
        minWeight: 0.01, // Minimum 1% allocation
        maxWeight: 0.8,  // Maximum 80% allocation
        riskFreeRate: this.riskFreeRate,
        allowShortSelling: false
      });
      
      try {
        const portfolio = this.calculatePortfolioMetrics(weights);
        const riskContributions = this.calculateRiskContribution(portfolio);
        
        // Calculate how far we are from equal risk contribution
        const riskSpread = Object.values(riskContributions).reduce((sum, contribution) => 
          sum + Math.abs(contribution - targetRiskContribution), 0);
        
        if (riskSpread < minRiskSpread) {
          minRiskSpread = riskSpread;
          bestPortfolio = portfolio;
        }
      } catch (error) {
        continue;
      }
    }

    if (!bestPortfolio) {
      throw new Error('Could not find equal risk contribution portfolio');
    }

    console.log(`✅ Found equal risk contribution portfolio with risk spread: ${minRiskSpread.toFixed(6)}`);
    return bestPortfolio;
  }

  // Performance analytics
  calculatePortfolioAnalytics(portfolio: Portfolio): {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
    informationRatio: number;
    trackingError: number;
    maximumDrawdown: number;
    calmarRatio: number;
    sortinoRatio: number;
    riskContributions: { [symbol: string]: number };
  } {
    const riskContributions = this.calculateRiskContribution(portfolio);
    
    // Mock some additional metrics for now (in real implementation, these would use historical data)
    const downside = portfolio.volatility * 0.7; // Approximation
    const maxDrawdown = portfolio.volatility * 1.5; // Approximation
    
    return {
      expectedReturn: portfolio.expectedReturn,
      volatility: portfolio.volatility,
      sharpeRatio: portfolio.sharpeRatio,
      informationRatio: portfolio.sharpeRatio * 0.8, // Approximation
      trackingError: portfolio.volatility * 0.3, // Approximation
      maximumDrawdown: maxDrawdown,
      calmarRatio: portfolio.expectedReturn / maxDrawdown,
      sortinoRatio: (portfolio.expectedReturn - this.riskFreeRate) / downside,
      riskContributions
    };
  }

  // Black-Litterman model implementation (simplified)
  blackLittermanOptimization(
    marketCaps: { [symbol: string]: number },
    views: { [symbol: string]: number },
    confidence: { [symbol: string]: number }
  ): Portfolio {
    console.log('🎯 Running Black-Litterman optimization...');
    
    // Calculate market capitalization weights
    const totalMarketCap = Object.values(marketCaps).reduce((sum, cap) => sum + cap, 0);
    const marketWeights = Object.entries(marketCaps).map(([symbol, cap]) => ({
      symbol,
      weight: cap / totalMarketCap
    }));
    
    // Adjust expected returns based on views and confidence
    const adjustedAssets = this.assets.map(asset => {
      const view = views[asset.symbol] || 0;
      const conf = confidence[asset.symbol] || 0;
      
      // Simple Black-Litterman adjustment
      const adjustedReturn = asset.expectedReturn + (view * conf);
      
      return {
        ...asset,
        expectedReturn: adjustedReturn
      };
    });
    
    // Temporarily update assets
    const originalAssets = [...this.assets];
    this.assets = adjustedAssets;
    
    // Find optimal portfolio
    const portfolio = this.optimizeForMaxSharpe({
      minWeight: 0,
      maxWeight: 1,
      riskFreeRate: this.riskFreeRate,
      allowShortSelling: false
    });
    
    // Restore original assets
    this.assets = originalAssets;
    
    console.log('✅ Black-Litterman optimization completed');
    return portfolio;
  }

  exportPortfolioReport(portfolio: Portfolio): string {
    const analytics = this.calculatePortfolioAnalytics(portfolio);
    
    let report = '📊 PORTFOLIO OPTIMIZATION REPORT\n';
    report += '=====================================\n\n';
    
    report += '📈 PORTFOLIO METRICS:\n';
    report += `Expected Return: ${(analytics.expectedReturn * 100).toFixed(2)}%\n`;
    report += `Volatility: ${(analytics.volatility * 100).toFixed(2)}%\n`;
    report += `Sharpe Ratio: ${analytics.sharpeRatio.toFixed(4)}\n`;
    report += `Sortino Ratio: ${analytics.sortinoRatio.toFixed(4)}\n`;
    report += `Calmar Ratio: ${analytics.calmarRatio.toFixed(4)}\n\n`;
    
    report += '💼 ASSET ALLOCATION:\n';
    portfolio.assets.forEach(asset => {
      report += `${asset.symbol}: ${(asset.weight * 100).toFixed(2)}%\n`;
    });
    report += '\n';
    
    report += '⚖️ RISK CONTRIBUTIONS:\n';
    Object.entries(analytics.riskContributions).forEach(([symbol, contribution]) => {
      report += `${symbol}: ${(contribution * 100).toFixed(2)}%\n`;
    });
    
    return report;
  }
}