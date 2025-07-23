import { TradingSignal, MarketData } from '@/types/broker';

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
}

export class StrategyManager {
  private strategies: Map<string, any> = new Map();
  private config: any = {};

  async loadStrategies(config: any): Promise<void> {
    this.config = config;
    
    // Load and initialize trading strategies
    this.initializeStrategies();
    
    console.log('Strategy manager loaded with strategies:', Array.from(this.strategies.keys()));
  }

  private initializeStrategies(): void {
    // Wing Zero Multi-Timeframe Strategy
    this.strategies.set('wingzero_mtf', {
      name: 'Wing Zero Multi-Timeframe',
      enabled: true,
      symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'],
      timeframes: ['M5', 'M15', 'H1'],
      indicators: {
        ema_fast: 12,
        ema_slow: 26,
        rsi_period: 14,
        macd_fast: 12,
        macd_slow: 26,
        macd_signal: 9,
        bb_period: 20,
        bb_deviation: 2,
        atr_period: 14
      },
      parameters: {
        min_trend_strength: 70,
        min_momentum_strength: 60,
        confluence_required: 3, // Number of indicators that must agree
        trend_filter: true,
        volume_filter: true,
        news_filter: true
      }
    });

    // Scalping Strategy for high-frequency trading
    this.strategies.set('wingzero_scalp', {
      name: 'Wing Zero Scalping',
      enabled: true,
      symbols: ['EURUSD', 'GBPUSD', 'USDJPY'],
      timeframes: ['M1', 'M5'],
      indicators: {
        ema_fast: 8,
        ema_slow: 21,
        rsi_period: 7,
        stoch_k: 5,
        stoch_d: 3,
        bollinger_period: 20
      },
      parameters: {
        min_trend_strength: 60,
        scalp_profit_pips: 5,
        scalp_stop_pips: 3,
        max_spread: 2, // Max spread in pips
        session_filter: 'london_ny_overlap'
      }
    });

    // Trend Following Strategy
    this.strategies.set('wingzero_trend', {
      name: 'Wing Zero Trend Following',
      enabled: true,
      symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'],
      timeframes: ['H1', 'H4'],
      indicators: {
        ema_200: 200,
        ema_50: 50,
        ema_20: 20,
        adx_period: 14,
        atr_period: 14,
        donchian_period: 20
      },
      parameters: {
        min_trend_strength: 80,
        min_adx: 25,
        trend_confirmation_bars: 3,
        breakout_threshold: 1.5 // ATR multiplier
      }
    });
  }

  async generateSignals(marketData: MarketData[]): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];

    for (const data of marketData) {
      // Generate signals from each enabled strategy
      for (const [strategyName, strategy] of this.strategies) {
        if (!strategy.enabled || !strategy.symbols.includes(data.symbol)) {
          continue;
        }

        try {
          const signal = await this.generateStrategySignal(strategy, data);
          if (signal && this.validateSignal(signal)) {
            signals.push(signal);
          }
        } catch (error) {
          console.error(`Error generating signal for ${strategyName}:`, error);
        }
      }
    }

    // Consolidate multiple signals for the same symbol
    return this.consolidateSignals(signals);
  }

  private async generateStrategySignal(strategy: any, data: MarketData): Promise<TradingSignal | null> {
    // Calculate technical indicators
    const indicators = await this.calculateIndicators(strategy, data);
    
    // Apply strategy logic
    switch (strategy.name) {
      case 'Wing Zero Multi-Timeframe':
        return this.generateMTFSignal(strategy, data, indicators);
      case 'Wing Zero Scalping':
        return this.generateScalpingSignal(strategy, data, indicators);
      case 'Wing Zero Trend Following':
        return this.generateTrendSignal(strategy, data, indicators);
      default:
        return null;
    }
  }

  private async calculateIndicators(strategy: any, data: MarketData): Promise<TechnicalIndicator[]> {
    const indicators: TechnicalIndicator[] = [];
    const price = (data.bid + data.ask) / 2;

    // Simulate technical indicator calculations
    // In real implementation, these would use proper technical analysis libraries

    // EMA indicators
    if (strategy.indicators.ema_fast) {
      const emaFast = this.calculateEMA(price, strategy.indicators.ema_fast);
      const emaSlow = this.calculateEMA(price, strategy.indicators.ema_slow || 26);
      
      indicators.push({
        name: 'EMA_Cross',
        value: emaFast - emaSlow,
        signal: emaFast > emaSlow ? 'buy' : 'sell',
        strength: Math.min(Math.abs((emaFast - emaSlow) / emaSlow) * 1000, 100)
      });
    }

    // RSI indicator
    if (strategy.indicators.rsi_period) {
      const rsi = this.calculateRSI(price, strategy.indicators.rsi_period);
      
      indicators.push({
        name: 'RSI',
        value: rsi,
        signal: rsi < 30 ? 'buy' : rsi > 70 ? 'sell' : 'neutral',
        strength: rsi < 30 ? (30 - rsi) * 2 : rsi > 70 ? (rsi - 70) * 2 : 0
      });
    }

    // MACD indicator
    if (strategy.indicators.macd_fast) {
      const macd = this.calculateMACD(price, strategy.indicators);
      
      indicators.push({
        name: 'MACD',
        value: macd.value,
        signal: macd.value > macd.signal ? 'buy' : 'sell',
        strength: Math.min(Math.abs(macd.value - macd.signal) * 100, 100)
      });
    }

    // Bollinger Bands
    if (strategy.indicators.bb_period) {
      const bb = this.calculateBollingerBands(price, strategy.indicators.bb_period);
      
      indicators.push({
        name: 'BollingerBands',
        value: (price - bb.middle) / (bb.upper - bb.lower),
        signal: price < bb.lower ? 'buy' : price > bb.upper ? 'sell' : 'neutral',
        strength: price < bb.lower ? 80 : price > bb.upper ? 80 : 0
      });
    }

    // Support/Resistance levels
    const supportResistance = this.calculateSupportResistance(data);
    indicators.push({
      name: 'SupportResistance',
      value: price,
      signal: this.getSRSignal(price, supportResistance),
      strength: this.getSRStrength(price, supportResistance)
    });

    return indicators;
  }

  private generateMTFSignal(strategy: any, data: MarketData, indicators: TechnicalIndicator[]): TradingSignal | null {
    const buySignals = indicators.filter(ind => ind.signal === 'buy');
    const sellSignals = indicators.filter(ind => ind.signal === 'sell');
    
    // Require confluence of multiple indicators
    const minConfluence = strategy.parameters.confluence_required || 3;
    
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let strength = 0;
    let confidence = 0;

    if (buySignals.length >= minConfluence) {
      action = 'buy';
      strength = Math.min(buySignals.reduce((sum, sig) => sum + sig.strength, 0) / buySignals.length, 100);
      confidence = Math.min((buySignals.length / indicators.length) * 100, 100);
    } else if (sellSignals.length >= minConfluence) {
      action = 'sell';
      strength = Math.min(sellSignals.reduce((sum, sig) => sum + sig.strength, 0) / sellSignals.length, 100);
      confidence = Math.min((sellSignals.length / indicators.length) * 100, 100);
    }

    if (action === 'hold' || strength < strategy.parameters.min_trend_strength) {
      return null;
    }

    // Calculate support and resistance levels
    const supportResistance = this.calculateSupportResistance(data);

    return {
      symbol: data.symbol,
      action,
      strength,
      confidence,
      indicators: {
        trend: buySignals.length > sellSignals.length ? 'bullish' : 'bearish',
        momentum: strength > 70 ? 'strong' : 'weak',
        volume: data.volume && data.volume > 500 ? 'high' : 'normal',
        support: supportResistance.support,
        resistance: supportResistance.resistance
      },
      timestamp: data.timestamp
    };
  }

  private generateScalpingSignal(strategy: any, data: MarketData, indicators: TechnicalIndicator[]): TradingSignal | null {
    // Check spread constraint
    if (data.spread > (strategy.parameters.max_spread || 2) * this.getPipValue(data.symbol)) {
      return null;
    }

    // Fast scalping logic - focus on momentum and quick reversals
    const emaSignal = indicators.find(ind => ind.name === 'EMA_Cross');
    const rsiSignal = indicators.find(ind => ind.name === 'RSI');
    const bbSignal = indicators.find(ind => ind.name === 'BollingerBands');

    if (!emaSignal || !rsiSignal || !bbSignal) return null;

    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let strength = 0;

    // Scalping buy conditions
    if (emaSignal.signal === 'buy' && 
        (rsiSignal.value < 40 || bbSignal.signal === 'buy') &&
        this.isValidScalpingTime()) {
      action = 'buy';
      strength = (emaSignal.strength + rsiSignal.strength + bbSignal.strength) / 3;
    }
    // Scalping sell conditions
    else if (emaSignal.signal === 'sell' && 
             (rsiSignal.value > 60 || bbSignal.signal === 'sell') &&
             this.isValidScalpingTime()) {
      action = 'sell';
      strength = (emaSignal.strength + rsiSignal.strength + bbSignal.strength) / 3;
    }

    if (action === 'hold' || strength < 60) {
      return null;
    }

    const supportResistance = this.calculateSupportResistance(data);

    return {
      symbol: data.symbol,
      action,
      strength,
      confidence: Math.min(strength + 20, 100), // Higher confidence for scalping
      indicators: {
        trend: action === 'buy' ? 'bullish' : 'bearish',
        momentum: 'strong',
        volume: 'high',
        support: supportResistance.support,
        resistance: supportResistance.resistance
      },
      timestamp: data.timestamp
    };
  }

  private generateTrendSignal(strategy: any, data: MarketData, indicators: TechnicalIndicator[]): TradingSignal | null {
    // Long-term trend following logic
    const emaSignal = indicators.find(ind => ind.name === 'EMA_Cross');
    const srSignal = indicators.find(ind => ind.name === 'SupportResistance');

    if (!emaSignal || !srSignal) return null;

    // Only trade in direction of strong trends
    if (emaSignal.strength < strategy.parameters.min_trend_strength) {
      return null;
    }

    const action = emaSignal.signal === 'neutral' ? 'hold' : emaSignal.signal;
    
    if (action === 'hold') return null;

    const supportResistance = this.calculateSupportResistance(data);

    return {
      symbol: data.symbol,
      action,
      strength: emaSignal.strength,
      confidence: Math.min(emaSignal.strength + srSignal.strength, 100),
      indicators: {
        trend: action === 'buy' ? 'bullish' : 'bearish',
        momentum: emaSignal.strength > 80 ? 'strong' : 'weak',
        volume: 'normal',
        support: supportResistance.support,
        resistance: supportResistance.resistance
      },
      timestamp: data.timestamp
    };
  }

  private validateSignal(signal: TradingSignal): boolean {
    // Basic signal validation
    if (signal.strength < 50 || signal.confidence < 60) {
      return false;
    }

    // Check against global filters
    if (this.config.confluenceRequired && signal.confidence < 75) {
      return false;
    }

    if (this.config.trendFilterEnabled && signal.indicators.trend === 'neutral') {
      return false;
    }

    return true;
  }

  private consolidateSignals(signals: TradingSignal[]): TradingSignal[] {
    const consolidated = new Map<string, TradingSignal>();

    for (const signal of signals) {
      const existing = consolidated.get(signal.symbol);
      
      if (!existing) {
        consolidated.set(signal.symbol, signal);
        continue;
      }

      // Combine signals for the same symbol
      if (existing.action === signal.action) {
        // Strengthen signal if both agree
        existing.strength = Math.min((existing.strength + signal.strength) / 2 + 10, 100);
        existing.confidence = Math.min((existing.confidence + signal.confidence) / 2 + 10, 100);
      } else {
        // Conflicting signals - keep the stronger one or neutralize
        if (signal.strength > existing.strength + 20) {
          consolidated.set(signal.symbol, signal);
        } else if (existing.strength > signal.strength + 20) {
          // Keep existing
        } else {
          // Conflicting signals of similar strength - remove
          consolidated.delete(signal.symbol);
        }
      }
    }

    return Array.from(consolidated.values());
  }

  // Technical indicator calculations (simplified versions)
  private calculateEMA(price: number, period: number): number {
    // Simplified EMA calculation - in real implementation would maintain price history
    const multiplier = 2 / (period + 1);
    return price; // Simplified - would use actual EMA formula with price history
  }

  private calculateRSI(price: number, period: number): number {
    // Simplified RSI calculation
    const base = 50;
    const variation = (Math.random() - 0.5) * 40; // ±20 around base
    return Math.max(0, Math.min(100, base + variation));
  }

  private calculateMACD(price: number, indicators: any): { value: number, signal: number } {
    // Simplified MACD calculation
    const fast = this.calculateEMA(price, indicators.macd_fast);
    const slow = this.calculateEMA(price, indicators.macd_slow);
    return {
      value: fast - slow,
      signal: (fast - slow) * 0.9 // Simplified signal line
    };
  }

  private calculateBollingerBands(price: number, period: number): { upper: number, middle: number, lower: number } {
    // Simplified Bollinger Bands
    const stdDev = price * 0.02; // 2% standard deviation approximation
    return {
      middle: price,
      upper: price + (stdDev * 2),
      lower: price - (stdDev * 2)
    };
  }

  private calculateSupportResistance(data: MarketData): { support: number, resistance: number } {
    // Simplified support/resistance calculation
    const price = (data.bid + data.ask) / 2;
    const range = price * 0.005; // 0.5% range
    
    return {
      support: price - range,
      resistance: price + range
    };
  }

  private getSRSignal(price: number, sr: { support: number, resistance: number }): 'buy' | 'sell' | 'neutral' {
    if (price <= sr.support * 1.001) return 'buy';  // Near support
    if (price >= sr.resistance * 0.999) return 'sell'; // Near resistance
    return 'neutral';
  }

  private getSRStrength(price: number, sr: { support: number, resistance: number }): number {
    const distanceToSupport = Math.abs(price - sr.support) / sr.support;
    const distanceToResistance = Math.abs(price - sr.resistance) / sr.resistance;
    
    const minDistance = Math.min(distanceToSupport, distanceToResistance);
    return Math.max(0, 100 - (minDistance * 10000)); // Convert to strength score
  }

  private isValidScalpingTime(): boolean {
    const now = new Date();
    const hour = now.getUTCHours();
    
    // London-NY overlap period (12:00-16:00 GMT)
    return hour >= 12 && hour <= 16;
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

  // Public methods
  getStrategyStatus(): any {
    return Array.from(this.strategies.entries()).map(([name, strategy]) => ({
      name,
      enabled: strategy.enabled,
      symbols: strategy.symbols.length,
      performance: this.getStrategyPerformance(name)
    }));
  }

  private getStrategyPerformance(strategyName: string): any {
    // This would track individual strategy performance
    return {
      winRate: 0.75,
      profitFactor: 1.5,
      totalTrades: 0
    };
  }

  enableStrategy(name: string): void {
    const strategy = this.strategies.get(name);
    if (strategy) {
      strategy.enabled = true;
    }
  }

  disableStrategy(name: string): void {
    const strategy = this.strategies.get(name);
    if (strategy) {
      strategy.enabled = false;
    }
  }

  updateStrategyParameters(name: string, parameters: any): void {
    const strategy = this.strategies.get(name);
    if (strategy) {
      strategy.parameters = { ...strategy.parameters, ...parameters };
    }
  }
}
