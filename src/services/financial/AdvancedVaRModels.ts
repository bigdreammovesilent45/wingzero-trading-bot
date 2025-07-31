interface VaRResult {
  confidence_level: number;
  time_horizon: number;
  var_amount: number;
  var_percentage: number;
  expected_shortfall: number;
  method: 'historical' | 'monte_carlo' | 'parametric' | 'filtered_historical';
  portfolio_value: number;
  currency: string;
  calculation_date: number;
}

interface HistoricalData {
  date: number;
  price: number;
  return: number;
}

interface MonteCarloParameters {
  simulations: number;
  time_horizon_days: number;
  confidence_levels: number[];
  drift_adjustment: boolean;
  fat_tails: boolean;
  volatility_clustering: boolean;
}

interface ParametricParameters {
  distribution: 'normal' | 'student_t' | 'skewed_t';
  degrees_of_freedom?: number;
  skewness?: number;
  kurtosis?: number;
}

interface StressTestResult {
  scenario: string;
  shock_magnitude: number;
  portfolio_impact: number;
  var_breach: boolean;
  recovery_time_estimate: number;
}

interface BacktestResult {
  test_period_start: number;
  test_period_end: number;
  total_observations: number;
  var_breaches: number;
  breach_rate: number;
  expected_breach_rate: number;
  traffic_light: 'green' | 'yellow' | 'red';
  kupiec_test_pvalue: number;
  independence_test_pvalue: number;
}

export class AdvancedVaRModels {
  private portfolioValue: number = 100000;
  private currency: string = 'USD';
  private historicalData: Map<string, HistoricalData[]> = new Map();
  private correlationMatrix: Map<string, Map<string, number>> = new Map();
  
  constructor(portfolioValue: number = 100000, currency: string = 'USD') {
    this.portfolioValue = portfolioValue;
    this.currency = currency;
  }

  addHistoricalData(symbol: string, data: HistoricalData[]): void {
    // Calculate returns if not provided
    const processedData = data.map((point, index) => {
      if (index === 0) {
        return { ...point, return: 0 };
      } else {
        const prevPrice = data[index - 1].price;
        const logReturn = Math.log(point.price / prevPrice);
        return { ...point, return: logReturn };
      }
    });

    this.historicalData.set(symbol, processedData);
    console.log(`📊 Added ${processedData.length} historical data points for ${symbol}`);
  }

  setCorrelationMatrix(correlations: Map<string, Map<string, number>>): void {
    this.correlationMatrix = correlations;
    console.log('📈 Updated correlation matrix for VaR calculations');
  }

  // Historical Simulation VaR
  calculateHistoricalVaR(
    symbol: string,
    confidenceLevel: number = 0.95,
    timeHorizon: number = 1
  ): VaRResult {
    console.log(`📊 Calculating Historical VaR for ${symbol} at ${confidenceLevel * 100}% confidence`);

    const data = this.historicalData.get(symbol);
    if (!data || data.length < 100) {
      throw new Error(`Insufficient historical data for ${symbol}`);
    }

    const returns = data.slice(1).map(d => d.return);
    
    // Scale returns to time horizon if different from 1 day
    const scaledReturns = returns.map(r => r * Math.sqrt(timeHorizon));
    
    // Sort returns ascending
    const sortedReturns = [...scaledReturns].sort((a, b) => a - b);
    
    // Find VaR percentile
    const varIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const varReturn = sortedReturns[varIndex];
    
    // Calculate Expected Shortfall (average of returns worse than VaR)
    const tailReturns = sortedReturns.slice(0, varIndex + 1);
    const expectedShortfall = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
    
    // Convert to dollar amounts
    const varAmount = Math.abs(varReturn * this.portfolioValue);
    const esAmount = Math.abs(expectedShortfall * this.portfolioValue);

    return {
      confidence_level: confidenceLevel,
      time_horizon: timeHorizon,
      var_amount: varAmount,
      var_percentage: Math.abs(varReturn),
      expected_shortfall: esAmount,
      method: 'historical',
      portfolio_value: this.portfolioValue,
      currency: this.currency,
      calculation_date: Date.now()
    };
  }

  // Monte Carlo VaR
  calculateMonteCarloVaR(
    symbol: string,
    parameters: MonteCarloParameters,
    confidenceLevel: number = 0.95
  ): VaRResult {
    console.log(`🎲 Calculating Monte Carlo VaR for ${symbol} with ${parameters.simulations} simulations`);

    const data = this.historicalData.get(symbol);
    if (!data || data.length < 50) {
      throw new Error(`Insufficient historical data for ${symbol}`);
    }

    const returns = data.slice(1).map(d => d.return);
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    const volatility = Math.sqrt(variance);

    // Generate simulated price paths
    const finalReturns: number[] = [];
    
    for (let sim = 0; sim < parameters.simulations; sim++) {
      let cumulativeReturn = 0;
      let currentVol = volatility;
      
      for (let day = 0; day < parameters.time_horizon_days; day++) {
        let randomReturn: number;
        
        if (parameters.fat_tails) {
          // Use Student-t distribution for fat tails
          randomReturn = this.generateStudentT(3) * currentVol;
        } else {
          // Standard normal distribution
          randomReturn = this.generateNormal() * currentVol;
        }
        
        // Add drift if specified
        if (parameters.drift_adjustment) {
          randomReturn += mean;
        }
        
        // Volatility clustering (GARCH-like effect)
        if (parameters.volatility_clustering) {
          const alpha = 0.1;
          const beta = 0.85;
          currentVol = Math.sqrt(alpha * randomReturn * randomReturn + beta * currentVol * currentVol);
        }
        
        cumulativeReturn += randomReturn;
      }
      
      finalReturns.push(cumulativeReturn);
    }

    // Sort and calculate VaR
    const sortedReturns = finalReturns.sort((a, b) => a - b);
    const varIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const varReturn = sortedReturns[varIndex];
    
    // Expected Shortfall
    const tailReturns = sortedReturns.slice(0, varIndex + 1);
    const expectedShortfall = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
    
    const varAmount = Math.abs(varReturn * this.portfolioValue);
    const esAmount = Math.abs(expectedShortfall * this.portfolioValue);

    return {
      confidence_level: confidenceLevel,
      time_horizon: parameters.time_horizon_days,
      var_amount: varAmount,
      var_percentage: Math.abs(varReturn),
      expected_shortfall: esAmount,
      method: 'monte_carlo',
      portfolio_value: this.portfolioValue,
      currency: this.currency,
      calculation_date: Date.now()
    };
  }

  // Parametric VaR
  calculateParametricVaR(
    symbol: string,
    confidenceLevel: number = 0.95,
    timeHorizon: number = 1,
    parameters: ParametricParameters = { distribution: 'normal' }
  ): VaRResult {
    console.log(`📊 Calculating Parametric VaR for ${symbol} using ${parameters.distribution} distribution`);

    const data = this.historicalData.get(symbol);
    if (!data || data.length < 30) {
      throw new Error(`Insufficient historical data for ${symbol}`);
    }

    const returns = data.slice(1).map(d => d.return);
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    const volatility = Math.sqrt(variance);

    // Scale to time horizon
    const scaledMean = mean * timeHorizon;
    const scaledVolatility = volatility * Math.sqrt(timeHorizon);

    let varQuantile: number;

    switch (parameters.distribution) {
      case 'normal':
        varQuantile = this.normalInverseCDF(1 - confidenceLevel);
        break;
      
      case 'student_t':
        const df = parameters.degrees_of_freedom || this.estimateDegreesOfFreedom(returns);
        varQuantile = this.studentTInverseCDF(1 - confidenceLevel, df);
        break;
      
      case 'skewed_t':
        // Simplified skewed-t implementation
        const baseDf = parameters.degrees_of_freedom || this.estimateDegreesOfFreedom(returns);
        const skew = parameters.skewness || this.calculateSkewness(returns);
        varQuantile = this.studentTInverseCDF(1 - confidenceLevel, baseDf) * (1 + skew * 0.1);
        break;
      
      default:
        varQuantile = this.normalInverseCDF(1 - confidenceLevel);
    }

    const varReturn = scaledMean + varQuantile * scaledVolatility;
    
    // For Expected Shortfall with parametric approach
    let expectedShortfall: number;
    if (parameters.distribution === 'normal') {
      const phi = this.normalPDF(varQuantile);
      expectedShortfall = scaledMean + scaledVolatility * phi / (1 - confidenceLevel);
    } else {
      // Approximation for non-normal distributions
      expectedShortfall = varReturn * 1.2;
    }

    const varAmount = Math.abs(varReturn * this.portfolioValue);
    const esAmount = Math.abs(expectedShortfall * this.portfolioValue);

    return {
      confidence_level: confidenceLevel,
      time_horizon: timeHorizon,
      var_amount: varAmount,
      var_percentage: Math.abs(varReturn),
      expected_shortfall: esAmount,
      method: 'parametric',
      portfolio_value: this.portfolioValue,
      currency: this.currency,
      calculation_date: Date.now()
    };
  }

  // Filtered Historical Simulation (for volatility clustering)
  calculateFilteredHistoricalVaR(
    symbol: string,
    confidenceLevel: number = 0.95,
    timeHorizon: number = 1
  ): VaRResult {
    console.log(`📊 Calculating Filtered Historical VaR for ${symbol}`);

    const data = this.historicalData.get(symbol);
    if (!data || data.length < 100) {
      throw new Error(`Insufficient historical data for ${symbol}`);
    }

    const returns = data.slice(1).map(d => d.return);
    
    // Estimate GARCH(1,1) parameters
    const garchParams = this.estimateGARCH(returns);
    
    // Calculate conditional volatility series
    const conditionalVols = this.calculateConditionalVolatility(returns, garchParams);
    
    // Standardize returns by conditional volatility
    const standardizedReturns = returns.map((ret, i) => 
      conditionalVols[i] > 0 ? ret / conditionalVols[i] : 0
    );
    
    // Current conditional volatility
    const currentVol = conditionalVols[conditionalVols.length - 1];
    
    // Apply current volatility to standardized returns
    const scaledReturns = standardizedReturns.map(r => r * currentVol * Math.sqrt(timeHorizon));
    
    // Calculate VaR from scaled returns
    const sortedReturns = [...scaledReturns].sort((a, b) => a - b);
    const varIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const varReturn = sortedReturns[varIndex];
    
    // Expected Shortfall
    const tailReturns = sortedReturns.slice(0, varIndex + 1);
    const expectedShortfall = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
    
    const varAmount = Math.abs(varReturn * this.portfolioValue);
    const esAmount = Math.abs(expectedShortfall * this.portfolioValue);

    return {
      confidence_level: confidenceLevel,
      time_horizon: timeHorizon,
      var_amount: varAmount,
      var_percentage: Math.abs(varReturn),
      expected_shortfall: esAmount,
      method: 'filtered_historical',
      portfolio_value: this.portfolioValue,
      currency: this.currency,
      calculation_date: Date.now()
    };
  }

  // Portfolio VaR with correlations
  calculatePortfolioVaR(
    positions: { symbol: string; weight: number }[],
    confidenceLevel: number = 0.95,
    timeHorizon: number = 1,
    method: 'historical' | 'monte_carlo' | 'parametric' = 'parametric'
  ): VaRResult {
    console.log(`🗂️ Calculating Portfolio VaR using ${method} method`);

    if (method === 'parametric') {
      return this.calculateParametricPortfolioVaR(positions, confidenceLevel, timeHorizon);
    } else if (method === 'monte_carlo') {
      return this.calculateMonteCarloPortfolioVaR(positions, confidenceLevel, timeHorizon);
    } else {
      return this.calculateHistoricalPortfolioVaR(positions, confidenceLevel, timeHorizon);
    }
  }

  private calculateParametricPortfolioVaR(
    positions: { symbol: string; weight: number }[],
    confidenceLevel: number,
    timeHorizon: number
  ): VaRResult {
    // Calculate portfolio mean and variance
    let portfolioMean = 0;
    let portfolioVariance = 0;

    // Portfolio mean return
    for (const position of positions) {
      const data = this.historicalData.get(position.symbol);
      if (!data) continue;

      const returns = data.slice(1).map(d => d.return);
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      portfolioMean += position.weight * mean;
    }

    // Portfolio variance (including correlations)
    for (let i = 0; i < positions.length; i++) {
      for (let j = 0; j < positions.length; j++) {
        const pos1 = positions[i];
        const pos2 = positions[j];
        
        const data1 = this.historicalData.get(pos1.symbol);
        const data2 = this.historicalData.get(pos2.symbol);
        
        if (!data1 || !data2) continue;

        const returns1 = data1.slice(1).map(d => d.return);
        const returns2 = data2.slice(1).map(d => d.return);
        
        const vol1 = this.calculateVolatility(returns1);
        const vol2 = this.calculateVolatility(returns2);
        
        let correlation = 1;
        if (i !== j) {
          correlation = this.correlationMatrix.get(pos1.symbol)?.get(pos2.symbol) || 0;
        }
        
        portfolioVariance += pos1.weight * pos2.weight * vol1 * vol2 * correlation;
      }
    }

    const portfolioVolatility = Math.sqrt(portfolioVariance);
    
    // Scale to time horizon
    const scaledMean = portfolioMean * timeHorizon;
    const scaledVolatility = portfolioVolatility * Math.sqrt(timeHorizon);
    
    // Calculate VaR
    const varQuantile = this.normalInverseCDF(1 - confidenceLevel);
    const varReturn = scaledMean + varQuantile * scaledVolatility;
    
    // Expected Shortfall
    const phi = this.normalPDF(varQuantile);
    const expectedShortfall = scaledMean + scaledVolatility * phi / (1 - confidenceLevel);
    
    const varAmount = Math.abs(varReturn * this.portfolioValue);
    const esAmount = Math.abs(expectedShortfall * this.portfolioValue);

    return {
      confidence_level: confidenceLevel,
      time_horizon: timeHorizon,
      var_amount: varAmount,
      var_percentage: Math.abs(varReturn),
      expected_shortfall: esAmount,
      method: 'parametric',
      portfolio_value: this.portfolioValue,
      currency: this.currency,
      calculation_date: Date.now()
    };
  }

  private calculateMonteCarloPortfolioVaR(
    positions: { symbol: string; weight: number }[],
    confidenceLevel: number,
    timeHorizon: number
  ): VaRResult {
    const simulations = 10000;
    const portfolioReturns: number[] = [];

    for (let sim = 0; sim < simulations; sim++) {
      let portfolioReturn = 0;

      for (const position of positions) {
        const data = this.historicalData.get(position.symbol);
        if (!data) continue;

        const returns = data.slice(1).map(d => d.return);
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const volatility = this.calculateVolatility(returns);

        // Generate correlated random returns (simplified - should use Cholesky decomposition)
        const randomReturn = this.generateNormal() * volatility * Math.sqrt(timeHorizon) + mean * timeHorizon;
        portfolioReturn += position.weight * randomReturn;
      }

      portfolioReturns.push(portfolioReturn);
    }

    // Calculate VaR and ES
    const sortedReturns = portfolioReturns.sort((a, b) => a - b);
    const varIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const varReturn = sortedReturns[varIndex];
    
    const tailReturns = sortedReturns.slice(0, varIndex + 1);
    const expectedShortfall = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
    
    const varAmount = Math.abs(varReturn * this.portfolioValue);
    const esAmount = Math.abs(expectedShortfall * this.portfolioValue);

    return {
      confidence_level: confidenceLevel,
      time_horizon: timeHorizon,
      var_amount: varAmount,
      var_percentage: Math.abs(varReturn),
      expected_shortfall: esAmount,
      method: 'monte_carlo',
      portfolio_value: this.portfolioValue,
      currency: this.currency,
      calculation_date: Date.now()
    };
  }

  private calculateHistoricalPortfolioVaR(
    positions: { symbol: string; weight: number }[],
    confidenceLevel: number,
    timeHorizon: number
  ): VaRResult {
    // Find minimum data length across all positions
    let minLength = Infinity;
    const allData: HistoricalData[][] = [];

    for (const position of positions) {
      const data = this.historicalData.get(position.symbol);
      if (!data) continue;
      
      allData.push(data);
      minLength = Math.min(minLength, data.length);
    }

    if (minLength < 100) {
      throw new Error('Insufficient historical data for portfolio VaR');
    }

    // Calculate portfolio returns for each historical period
    const portfolioReturns: number[] = [];

    for (let i = 1; i < minLength; i++) {
      let portfolioReturn = 0;

      for (let j = 0; j < positions.length; j++) {
        const position = positions[j];
        const data = allData[j];
        
        if (data && data[i]) {
          portfolioReturn += position.weight * data[i].return;
        }
      }

      portfolioReturns.push(portfolioReturn * Math.sqrt(timeHorizon));
    }

    // Calculate VaR and ES
    const sortedReturns = portfolioReturns.sort((a, b) => a - b);
    const varIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const varReturn = sortedReturns[varIndex];
    
    const tailReturns = sortedReturns.slice(0, varIndex + 1);
    const expectedShortfall = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
    
    const varAmount = Math.abs(varReturn * this.portfolioValue);
    const esAmount = Math.abs(expectedShortfall * this.portfolioValue);

    return {
      confidence_level: confidenceLevel,
      time_horizon: timeHorizon,
      var_amount: varAmount,
      var_percentage: Math.abs(varReturn),
      expected_shortfall: esAmount,
      method: 'historical',
      portfolio_value: this.portfolioValue,
      currency: this.currency,
      calculation_date: Date.now()
    };
  }

  // Stress Testing
  performStressTest(
    symbol: string,
    scenarios: { name: string; shock: number }[]
  ): StressTestResult[] {
    console.log(`🧪 Performing stress test on ${symbol} with ${scenarios.length} scenarios`);

    const results: StressTestResult[] = [];
    const baseVaR = this.calculateHistoricalVaR(symbol, 0.95, 1);

    for (const scenario of scenarios) {
      const portfolioImpact = scenario.shock * this.portfolioValue;
      const varBreach = Math.abs(portfolioImpact) > baseVaR.var_amount;
      
      // Estimate recovery time based on historical volatility
      const data = this.historicalData.get(symbol);
      const volatility = data ? this.calculateVolatility(data.slice(1).map(d => d.return)) : 0.02;
      const recoveryTime = Math.abs(scenario.shock) / volatility; // Days to recover

      results.push({
        scenario: scenario.name,
        shock_magnitude: scenario.shock,
        portfolio_impact: portfolioImpact,
        var_breach: varBreach,
        recovery_time_estimate: recoveryTime
      });
    }

    return results;
  }

  // VaR Backtesting
  backtestVaR(
    symbol: string,
    confidenceLevel: number = 0.95,
    method: 'historical' | 'monte_carlo' | 'parametric' = 'historical',
    testPeriodDays: number = 250
  ): BacktestResult {
    console.log(`🔍 Backtesting ${method} VaR for ${symbol} over ${testPeriodDays} days`);

    const data = this.historicalData.get(symbol);
    if (!data || data.length < testPeriodDays + 250) {
      throw new Error('Insufficient data for backtesting');
    }

    const returns = data.slice(1).map(d => d.return);
    let breaches = 0;
    const breachDates: number[] = [];

    // Rolling VaR calculation and comparison
    for (let i = 250; i < 250 + testPeriodDays; i++) {
      const historicalWindow = returns.slice(i - 250, i);
      const actualReturn = returns[i];
      
      // Calculate VaR for this period
      const sortedWindow = [...historicalWindow].sort((a, b) => a - b);
      const varIndex = Math.floor((1 - confidenceLevel) * sortedWindow.length);
      const varReturn = sortedWindow[varIndex];
      
      // Check if actual return breached VaR
      if (actualReturn < varReturn) {
        breaches++;
        breachDates.push(data[i + 1].date);
      }
    }

    const breachRate = breaches / testPeriodDays;
    const expectedBreachRate = 1 - confidenceLevel;
    
    // Traffic light classification
    let trafficLight: 'green' | 'yellow' | 'red';
    if (breachRate <= expectedBreachRate * 1.2) {
      trafficLight = 'green';
    } else if (breachRate <= expectedBreachRate * 1.5) {
      trafficLight = 'yellow';
    } else {
      trafficLight = 'red';
    }

    // Kupiec Test (simplified)
    const kupiecStat = 2 * Math.log(
      Math.pow(breachRate, breaches) * Math.pow(1 - breachRate, testPeriodDays - breaches) /
      (Math.pow(expectedBreachRate, breaches) * Math.pow(1 - expectedBreachRate, testPeriodDays - breaches))
    );
    const kupiecPValue = 1 - this.chiSquareCDF(kupiecStat, 1);

    return {
      test_period_start: data[251].date,
      test_period_end: data[250 + testPeriodDays].date,
      total_observations: testPeriodDays,
      var_breaches: breaches,
      breach_rate: breachRate,
      expected_breach_rate: expectedBreachRate,
      traffic_light: trafficLight,
      kupiec_test_pvalue: kupiecPValue,
      independence_test_pvalue: 0.5 // Simplified
    };
  }

  // Utility functions
  private generateNormal(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private generateStudentT(degreesOfFreedom: number): number {
    // Simplified Student-t generator
    const normal = this.generateNormal();
    const chi2 = this.generateChiSquared(degreesOfFreedom);
    return normal / Math.sqrt(chi2 / degreesOfFreedom);
  }

  private generateChiSquared(degreesOfFreedom: number): number {
    // Simplified chi-squared generator
    let sum = 0;
    for (let i = 0; i < degreesOfFreedom; i++) {
      const normal = this.generateNormal();
      sum += normal * normal;
    }
    return sum;
  }

  private normalInverseCDF(p: number): number {
    // Approximation of normal inverse CDF
    const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    
    if (p <= 0 || p >= 1) return p <= 0 ? -Infinity : Infinity;
    
    const q = p < 0.5 ? p : 1 - p;
    const t = Math.sqrt(-2 * Math.log(q));
    
    let x = t - (a[1] + a[2]*t + a[3]*t*t + a[4]*t*t*t + a[5]*t*t*t*t + a[6]*t*t*t*t*t) /
                (1 + b[1]*t + b[2]*t*t + b[3]*t*t*t + b[4]*t*t*t*t + b[5]*t*t*t*t*t);
    
    return p < 0.5 ? -x : x;
  }

  private studentTInverseCDF(p: number, df: number): number {
    // Simplified Student-t inverse CDF approximation
    if (df > 30) return this.normalInverseCDF(p);
    
    const normalQuantile = this.normalInverseCDF(p);
    const correction = normalQuantile * normalQuantile * normalQuantile / (4 * df);
    return normalQuantile + correction;
  }

  private normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance);
  }

  private calculateSkewness(returns: number[]): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const skewness = returns.reduce((sum, r) => sum + Math.pow((r - mean) / Math.sqrt(variance), 3), 0) / returns.length;
    return skewness;
  }

  private estimateDegreesOfFreedom(returns: number[]): number {
    const kurtosis = this.calculateKurtosis(returns);
    // Rough approximation: df = 6/(kurtosis - 3) + 4
    return Math.max(3, Math.min(30, 6 / Math.max(0.1, kurtosis - 3) + 4));
  }

  private calculateKurtosis(returns: number[]): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const kurtosis = returns.reduce((sum, r) => sum + Math.pow((r - mean) / Math.sqrt(variance), 4), 0) / returns.length;
    return kurtosis;
  }

  private estimateGARCH(returns: number[]): { alpha: number; beta: number; omega: number } {
    // Simplified GARCH(1,1) parameter estimation
    return {
      alpha: 0.1,
      beta: 0.85,
      omega: 0.00001
    };
  }

  private calculateConditionalVolatility(returns: number[], garchParams: { alpha: number; beta: number; omega: number }): number[] {
    const vols: number[] = [];
    let prevVol = this.calculateVolatility(returns.slice(0, 20));
    
    for (let i = 0; i < returns.length; i++) {
      if (i === 0) {
        vols.push(prevVol);
      } else {
        const newVol = Math.sqrt(
          garchParams.omega + 
          garchParams.alpha * returns[i - 1] * returns[i - 1] + 
          garchParams.beta * prevVol * prevVol
        );
        vols.push(newVol);
        prevVol = newVol;
      }
    }
    
    return vols;
  }

  private chiSquareCDF(x: number, df: number): number {
    // Simplified chi-square CDF approximation
    if (x <= 0) return 0;
    if (df === 1) return 2 * (1 - Math.exp(-x / 2));
    
    // Normal approximation for large df
    if (df > 30) {
      const z = (Math.sqrt(2 * x) - Math.sqrt(2 * df - 1)) / Math.sqrt(2);
      return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
    }
    
    return 0.5; // Simplified return
  }

  private erf(x: number): number {
    // Error function approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}