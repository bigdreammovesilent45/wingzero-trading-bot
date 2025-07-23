import { TradingSignal, RiskMetrics } from '@/types/broker';

export interface RiskValidationResult {
  approved: boolean;
  reason?: string;
  maxPositionSize?: number;
}

export class RiskManager {
  private config: any = {};
  private dailyPnL = 0;
  private weeklyPnL = 0;
  private monthlyPnL = 0;
  private maxDrawdown = 0;
  private tradeHistory: any[] = [];
  private currentExposure = 0;

  async initialize(config: any): Promise<void> {
    this.config = config;
    console.log('Risk manager initialized with config:', config);
  }

  async validateTrade(signal: TradingSignal): Promise<RiskValidationResult> {
    // Check if trading is halted
    if (this.config.tradingHalted) {
      return { approved: false, reason: 'Trading is currently halted' };
    }

    // Check daily loss limit
    if (this.dailyPnL <= -Math.abs(this.config.maxDailyLoss || 5)) {
      return { approved: false, reason: 'Daily loss limit reached' };
    }

    // Check maximum risk per trade
    const riskAmount = this.calculateTradeRisk(signal);
    if (riskAmount > (this.config.maxRiskPerTrade || 2)) {
      return { approved: false, reason: 'Trade risk exceeds maximum per trade limit' };
    }

    // Check maximum exposure
    const totalExposure = this.currentExposure + riskAmount;
    if (totalExposure > (this.config.maxTotalExposure || 10)) {
      return { approved: false, reason: 'Total exposure limit would be exceeded' };
    }

    // Check drawdown limit
    if (this.maxDrawdown > (this.config.maxDrawdownLimit || 20)) {
      return { approved: false, reason: 'Maximum drawdown limit reached' };
    }

    // Check if signal meets minimum requirements
    if (signal.strength < (this.config.minSignalStrength || 70)) {
      return { approved: false, reason: 'Signal strength below minimum threshold' };
    }

    // Check correlation limits (prevent too many correlated trades)
    if (this.hasHighCorrelation(signal.symbol)) {
      return { approved: false, reason: 'High correlation with existing positions' };
    }

    // Check time-based restrictions
    if (!this.isValidTradingTime()) {
      return { approved: false, reason: 'Outside of allowed trading hours' };
    }

    // Check market conditions
    if (!this.isMarketSuitable(signal)) {
      return { approved: false, reason: 'Market conditions not suitable for trading' };
    }

    return { 
      approved: true, 
      maxPositionSize: this.calculateMaxPositionSize(signal)
    };
  }

  calculatePositionSize(signal: TradingSignal): number {
    const accountBalance = 10000; // This would come from account data
    const riskPerTrade = this.config.maxRiskPerTrade || 1.5;
    const stopLossPips = this.config.stopLossPips || 20;
    
    // Kelly Criterion calculation if enabled
    if (this.config.kellyCriterion) {
      return this.calculateKellyPositionSize(signal, accountBalance);
    }

    // Fixed fractional method
    const riskAmount = accountBalance * (riskPerTrade / 100);
    const pipValue = this.getPipValue(signal.symbol);
    const positionSize = riskAmount / (stopLossPips * pipValue * 100000); // Standard lot calculation
    
    // Apply dynamic sizing based on recent performance
    if (this.config.dynamicSizing) {
      return this.applyDynamicSizing(positionSize);
    }

    return Math.max(0.01, Math.min(positionSize, this.config.maxPositionSize || 1.0));
  }

  private calculateKellyPositionSize(signal: TradingSignal, accountBalance: number): number {
    const winRate = this.getRecentWinRate();
    const avgWin = this.getAverageWin();
    const avgLoss = this.getAverageLoss();
    
    if (avgLoss === 0) return 0.01; // Avoid division by zero
    
    // Kelly formula: f = (bp - q) / b
    // where b = odds received on the wager, p = probability of winning, q = probability of losing
    const kellyPercentage = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
    
    // Apply fractional Kelly to reduce risk
    const fractionalKelly = Math.max(0, Math.min(kellyPercentage * 0.25, 0.05)); // Max 5% of account
    
    const riskAmount = accountBalance * fractionalKelly;
    const stopLossPips = this.config.stopLossPips || 20;
    const pipValue = this.getPipValue(signal.symbol);
    
    return Math.max(0.01, riskAmount / (stopLossPips * pipValue * 100000));
  }

  private applyDynamicSizing(baseSize: number): number {
    const recentWinRate = this.getRecentWinRate();
    const profitFactor = this.getProfitFactor();
    
    let multiplier = 1.0;
    
    // Increase size during winning streaks
    if (recentWinRate > 0.75 && profitFactor > 1.5) {
      multiplier = 1.2;
    }
    // Decrease size during losing streaks
    else if (recentWinRate < 0.5 || profitFactor < 1.0) {
      multiplier = 0.8;
    }
    
    return baseSize * multiplier;
  }

  private calculateTradeRisk(signal: TradingSignal): number {
    const stopLossPips = this.config.stopLossPips || 20;
    const positionSize = this.calculatePositionSize(signal);
    
    // Risk as percentage of account
    return (stopLossPips * positionSize * 0.1); // Simplified calculation
  }

  private calculateMaxPositionSize(signal: TradingSignal): number {
    const maxRisk = this.config.maxRiskPerTrade || 2;
    const stopLossPips = this.config.stopLossPips || 20;
    const pipValue = this.getPipValue(signal.symbol);
    
    return maxRisk / (stopLossPips * pipValue);
  }

  private hasHighCorrelation(symbol: string): boolean {
    // Check correlation with existing positions
    const correlatedPairs: { [key: string]: string[] } = {
      'EURUSD': ['GBPUSD', 'AUDUSD', 'NZDUSD'],
      'GBPUSD': ['EURUSD', 'AUDUSD'],
      'USDJPY': ['USDCHF', 'USDCAD'],
      // Add more correlations as needed
    };
    
    const correlated = correlatedPairs[symbol] || [];
    const existingSymbols = this.getCurrentPositions().map(p => p.symbol);
    
    return correlated.some(sym => existingSymbols.includes(sym));
  }

  private isValidTradingTime(): boolean {
    if (!this.config.avoidLowVolatility) return true;
    
    const now = new Date();
    const hour = now.getUTCHours();
    
    // Avoid 22:00-06:00 GMT (low volatility period)
    if (hour >= 22 || hour < 6) {
      return false;
    }
    
    // Check for news events (would require external news feed)
    if (this.config.avoidNews && this.isNewsTime()) {
      return false;
    }
    
    return true;
  }

  private isNewsTime(): boolean {
    // Simplified news check - in real implementation, this would check a news calendar
    const now = new Date();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    
    // Avoid major news times (8:30, 13:30, 14:30 GMT typically)
    const newsTimes = [
      { hour: 8, minute: 30 },
      { hour: 13, minute: 30 },
      { hour: 14, minute: 30 }
    ];
    
    return newsTimes.some(newsTime => 
      hour === newsTime.hour && Math.abs(minute - newsTime.minute) < 30
    );
  }

  private isMarketSuitable(signal: TradingSignal): boolean {
    // Check market volatility
    if (signal.indicators.volume === 'low' && this.config.avoidLowVolatility) {
      return false;
    }
    
    // Check if trend and signal align
    if (this.config.trendFilterEnabled) {
      const trendAligned = 
        (signal.action === 'buy' && signal.indicators.trend === 'bullish') ||
        (signal.action === 'sell' && signal.indicators.trend === 'bearish');
      
      if (!trendAligned) return false;
    }
    
    return true;
  }

  async calculateCurrentMetrics(): Promise<RiskMetrics> {
    const openPositions = this.getCurrentPositions();
    const totalExposure = openPositions.reduce((sum, pos) => sum + Math.abs(pos.profit), 0);
    
    return {
      totalExposure,
      dailyPnL: this.dailyPnL,
      weeklyPnL: this.weeklyPnL,
      monthlyPnL: this.monthlyPnL,
      maxDrawdown: this.maxDrawdown,
      winRate: this.getRecentWinRate(),
      profitFactor: this.getProfitFactor(),
      sharpeRatio: this.calculateSharpeRatio(),
      maxRiskPerTrade: this.config.maxRiskPerTrade || 2,
      currentRisk: this.currentExposure
    };
  }

  getCurrentMetrics(): RiskMetrics {
    return {
      totalExposure: this.currentExposure,
      dailyPnL: this.dailyPnL,
      weeklyPnL: this.weeklyPnL,
      monthlyPnL: this.monthlyPnL,
      maxDrawdown: this.maxDrawdown,
      winRate: this.getRecentWinRate(),
      profitFactor: this.getProfitFactor(),
      sharpeRatio: this.calculateSharpeRatio(),
      maxRiskPerTrade: this.config.maxRiskPerTrade || 2,
      currentRisk: this.currentExposure
    };
  }

  private getRecentWinRate(): number {
    const recentTrades = this.tradeHistory.slice(-20); // Last 20 trades
    if (recentTrades.length === 0) return 0.685; // Default based on current performance
    
    const wins = recentTrades.filter(trade => trade.profit > 0).length;
    return wins / recentTrades.length;
  }

  private getAverageWin(): number {
    const winningTrades = this.tradeHistory.filter(trade => trade.profit > 0);
    if (winningTrades.length === 0) return 0;
    
    return winningTrades.reduce((sum, trade) => sum + trade.profit, 0) / winningTrades.length;
  }

  private getAverageLoss(): number {
    const losingTrades = this.tradeHistory.filter(trade => trade.profit < 0);
    if (losingTrades.length === 0) return 0;
    
    return Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profit, 0) / losingTrades.length);
  }

  private getProfitFactor(): number {
    const grossProfit = this.tradeHistory
      .filter(trade => trade.profit > 0)
      .reduce((sum, trade) => sum + trade.profit, 0);
      
    const grossLoss = Math.abs(this.tradeHistory
      .filter(trade => trade.profit < 0)
      .reduce((sum, trade) => sum + trade.profit, 0));
    
    return grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
  }

  private calculateSharpeRatio(): number {
    // Simplified Sharpe ratio calculation
    if (this.tradeHistory.length < 10) return 0;
    
    const returns = this.tradeHistory.map(trade => trade.profit);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev === 0 ? 0 : avgReturn / stdDev;
  }

  private getCurrentPositions(): any[] {
    // This would get current positions from OrderManager
    return [];
  }

  private getPipValue(symbol: string): number {
    const pipValues: { [key: string]: number } = {
      'EURUSD': 0.0001,
      'GBPUSD': 0.0001,
      'USDJPY': 0.01,
      'USDCHF': 0.0001,
      'AUDUSD': 0.0001,
      'USDCAD': 0.0001,
      'NZDUSD': 0.0001,
    };
    
    return pipValues[symbol] || 0.0001;
  }

  // Public methods for updating risk metrics
  updateDailyPnL(amount: number): void {
    this.dailyPnL += amount;
  }

  updateDrawdown(amount: number): void {
    this.maxDrawdown = Math.max(this.maxDrawdown, amount);
  }

  addTradeToHistory(trade: any): void {
    this.tradeHistory.push(trade);
    
    // Keep only last 100 trades for performance
    if (this.tradeHistory.length > 100) {
      this.tradeHistory = this.tradeHistory.slice(-100);
    }
  }

  getDailyPnL(): number {
    return this.dailyPnL;
  }

  resetDailyMetrics(): void {
    this.dailyPnL = 0;
  }
}
