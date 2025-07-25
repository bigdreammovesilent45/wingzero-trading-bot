import { TradingSignal } from '@/types/broker';

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
  timeframe: string;
}

export interface TechnicalOverview {
  trendScore: number; // -1 to 1
  volatility: number; // 0 to 1
  momentum: number; // -1 to 1
  support: number;
  resistance: number;
  indicators: TechnicalIndicator[];
}

export class AISignalGenerator {
  private indicatorWeights = {
    'RSI': 0.15,
    'MACD': 0.20,
    'MA_Cross': 0.18,
    'Bollinger': 0.12,
    'Stochastic': 0.10,
    'ADX': 0.15,
    'Support_Resistance': 0.10
  };

  async initialize(): Promise<void> {
    console.log('🤖 AI Signal Generator initialized');
  }

  async generateSignals(symbol: string, timeframe: string): Promise<TradingSignal[]> {
    try {
      console.log(`🔍 Generating AI signals for ${symbol} ${timeframe}...`);
      
      const indicators = await this.calculateAllIndicators(symbol, timeframe);
      const signals: TradingSignal[] = [];

      for (const indicator of indicators) {
        if (indicator.signal !== 'neutral' && indicator.strength >= 60) {
          signals.push({
            symbol,
            action: indicator.signal,
            strength: indicator.strength,
            confidence: this.calculateConfidence(indicator) * 100,
            indicators: {
              trend: indicator.signal === 'buy' ? 'bullish' : indicator.signal === 'sell' ? 'bearish' : 'neutral',
              momentum: indicator.strength > 75 ? 'strong' : indicator.strength < 50 ? 'weak' : 'neutral',
              volume: 'normal',
              support: 1.0850,
              resistance: 1.0920
            },
            timestamp: Date.now(),
          });
        }
      }

      console.log(`📊 Generated ${signals.length} high-quality signals for ${symbol} ${timeframe}`);
      return signals;

    } catch (error) {
      console.error(`Error generating signals for ${symbol} ${timeframe}:`, error);
      return [];
    }
  }

  async getTechnicalOverview(): Promise<TechnicalOverview> {
    const indicators = await this.calculateAllIndicators('EURUSD', '1h');
    
    return {
      trendScore: this.calculateTrendScore(indicators),
      volatility: this.calculateVolatility(indicators),
      momentum: this.calculateMomentum(indicators),
      support: 1.0850,
      resistance: 1.0920,
      indicators
    };
  }

  private async calculateAllIndicators(symbol: string, timeframe: string): Promise<TechnicalIndicator[]> {
    // Mock technical indicators - replace with real calculations
    return [
      {
        name: 'RSI',
        value: 65 + Math.random() * 20,
        signal: Math.random() > 0.5 ? 'buy' : 'sell',
        strength: 60 + Math.random() * 30,
        timeframe
      },
      {
        name: 'MACD',
        value: Math.random() * 0.01,
        signal: Math.random() > 0.5 ? 'buy' : 'sell',
        strength: 70 + Math.random() * 25,
        timeframe
      },
      {
        name: 'MA_Cross',
        value: Math.random(),
        signal: Math.random() > 0.6 ? 'buy' : 'neutral',
        strength: 55 + Math.random() * 35,
        timeframe
      },
      {
        name: 'Bollinger',
        value: Math.random(),
        signal: Math.random() > 0.7 ? 'sell' : 'neutral',
        strength: 50 + Math.random() * 40,
        timeframe
      }
    ];
  }

  private calculateConfidence(indicator: TechnicalIndicator): number {
    const baseConfidence = 0.6;
    const strengthBonus = (indicator.strength / 100) * 0.3;
    return Math.min(baseConfidence + strengthBonus, 1.0);
  }

  private calculateTrendScore(indicators: TechnicalIndicator[]): number {
    const trendIndicators = indicators.filter(i => ['MACD', 'MA_Cross', 'ADX'].includes(i.name));
    if (trendIndicators.length === 0) return 0;
    
    const score = trendIndicators.reduce((sum, indicator) => {
      const weight = this.indicatorWeights[indicator.name] || 0.1;
      const signalValue = indicator.signal === 'buy' ? 1 : indicator.signal === 'sell' ? -1 : 0;
      return sum + (signalValue * weight * (indicator.strength / 100));
    }, 0);
    
    return Math.max(-1, Math.min(1, score * 2));
  }

  private calculateVolatility(indicators: TechnicalIndicator[]): number {
    const volatilityIndicators = indicators.filter(i => ['Bollinger', 'ATR'].includes(i.name));
    if (volatilityIndicators.length === 0) return 0.5;
    
    const avgValue = volatilityIndicators.reduce((sum, i) => sum + i.value, 0) / volatilityIndicators.length;
    return Math.max(0, Math.min(1, avgValue));
  }

  private calculateMomentum(indicators: TechnicalIndicator[]): number {
    const momentumIndicators = indicators.filter(i => ['RSI', 'Stochastic', 'MACD'].includes(i.name));
    if (momentumIndicators.length === 0) return 0;
    
    const score = momentumIndicators.reduce((sum, indicator) => {
      const signalValue = indicator.signal === 'buy' ? 1 : indicator.signal === 'sell' ? -1 : 0;
      return sum + (signalValue * (indicator.strength / 100));
    }, 0);
    
    return Math.max(-1, Math.min(1, score / momentumIndicators.length));
  }
}