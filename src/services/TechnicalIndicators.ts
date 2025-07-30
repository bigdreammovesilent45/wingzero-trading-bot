export interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp: number;
}

export interface IndicatorResult {
  value: number | number[];
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100
  confidence: number; // 0-100
}

export class TechnicalIndicators {
  // Simple Moving Average
  static SMA(data: number[], period: number): number[] {
    const result: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    
    return result;
  }

  // Exponential Moving Average
  static EMA(data: number[], period: number): number[] {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);
    
    result[0] = data[0];
    
    for (let i = 1; i < data.length; i++) {
      result[i] = (data[i] * multiplier) + (result[i - 1] * (1 - multiplier));
    }
    
    return result;
  }

  // Relative Strength Index
  static RSI(data: number[], period: number = 14): IndicatorResult {
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? Math.abs(diff) : 0);
    }
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let strength = 50;
    
    if (rsi < 30) {
      signal = 'buy';
      strength = Math.max(0, (30 - rsi) * 2.5);
    } else if (rsi > 70) {
      signal = 'sell';
      strength = Math.max(0, (rsi - 70) * 2.5);
    }
    
    return {
      value: rsi,
      signal,
      strength,
      confidence: Math.abs(rsi - 50) * 2
    };
  }

  // MACD (Moving Average Convergence Divergence)
  static MACD(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): IndicatorResult {
    const fastEMA = this.EMA(data, fastPeriod);
    const slowEMA = this.EMA(data, slowPeriod);
    
    const macdLine: number[] = [];
    const startIndex = slowPeriod - fastPeriod;
    
    for (let i = 0; i < fastEMA.length - startIndex; i++) {
      macdLine.push(fastEMA[i + startIndex] - slowEMA[i]);
    }
    
    const signalLine = this.EMA(macdLine, signalPeriod);
    const histogram: number[] = [];
    
    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[i + macdLine.length - signalLine.length] - signalLine[i]);
    }
    
    const currentMACD = macdLine[macdLine.length - 1];
    const currentSignal = signalLine[signalLine.length - 1];
    const currentHist = histogram[histogram.length - 1];
    const prevHist = histogram[histogram.length - 2] || 0;
    
    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let strength = 50;
    
    if (currentHist > 0 && prevHist <= 0) {
      signal = 'buy';
      strength = Math.min(100, Math.abs(currentHist) * 1000);
    } else if (currentHist < 0 && prevHist >= 0) {
      signal = 'sell';
      strength = Math.min(100, Math.abs(currentHist) * 1000);
    }
    
    return {
      value: [currentMACD, currentSignal, currentHist],
      signal,
      strength,
      confidence: Math.min(100, Math.abs(currentHist) * 500)
    };
  }

  // Bollinger Bands
  static BollingerBands(data: number[], period: number = 20, stdDev: number = 2): IndicatorResult {
    const sma = this.SMA(data, period);
    const currentSMA = sma[sma.length - 1];
    const currentPrice = data[data.length - 1];
    
    // Calculate standard deviation
    const recentData = data.slice(-period);
    const variance = recentData.reduce((sum, val) => sum + Math.pow(val - currentSMA, 2), 0) / period;
    const stdDeviation = Math.sqrt(variance);
    
    const upperBand = currentSMA + (stdDev * stdDeviation);
    const lowerBand = currentSMA - (stdDev * stdDeviation);
    
    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let strength = 50;
    
    const bandWidth = upperBand - lowerBand;
    const pricePosition = (currentPrice - lowerBand) / bandWidth;
    
    if (pricePosition <= 0.1) {
      signal = 'buy';
      strength = Math.min(100, (0.1 - pricePosition) * 1000);
    } else if (pricePosition >= 0.9) {
      signal = 'sell';
      strength = Math.min(100, (pricePosition - 0.9) * 1000);
    }
    
    return {
      value: [upperBand, currentSMA, lowerBand],
      signal,
      strength,
      confidence: Math.abs(pricePosition - 0.5) * 200
    };
  }

  // Stochastic Oscillator
  static Stochastic(highs: number[], lows: number[], closes: number[], kPeriod: number = 14, dPeriod: number = 3): IndicatorResult {
    const kValues: number[] = [];
    
    for (let i = kPeriod - 1; i < closes.length; i++) {
      const recentHighs = highs.slice(i - kPeriod + 1, i + 1);
      const recentLows = lows.slice(i - kPeriod + 1, i + 1);
      
      const highestHigh = Math.max(...recentHighs);
      const lowestLow = Math.min(...recentLows);
      
      const k = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(k);
    }
    
    const dValues = this.SMA(kValues, dPeriod);
    
    const currentK = kValues[kValues.length - 1];
    const currentD = dValues[dValues.length - 1];
    
    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let strength = 50;
    
    if (currentK < 20 && currentD < 20 && currentK > currentD) {
      signal = 'buy';
      strength = Math.min(100, (20 - Math.min(currentK, currentD)) * 5);
    } else if (currentK > 80 && currentD > 80 && currentK < currentD) {
      signal = 'sell';
      strength = Math.min(100, (Math.max(currentK, currentD) - 80) * 5);
    }
    
    return {
      value: [currentK, currentD],
      signal,
      strength,
      confidence: Math.abs(currentK - 50) * 2
    };
  }

  // Williams %R
  static WilliamsR(highs: number[], lows: number[], closes: number[], period: number = 14): IndicatorResult {
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];
    
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    
    const williamsR = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
    
    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let strength = 50;
    
    if (williamsR < -80) {
      signal = 'buy';
      strength = Math.min(100, (-80 - williamsR) * 5);
    } else if (williamsR > -20) {
      signal = 'sell';
      strength = Math.min(100, (williamsR + 20) * 5);
    }
    
    return {
      value: williamsR,
      signal,
      strength,
      confidence: Math.abs(williamsR + 50) * 2
    };
  }

  // Average True Range (ATR)
  static ATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    const trueRanges: number[] = [];
    
    for (let i = 1; i < closes.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
    return atr;
  }

  // Commodity Channel Index (CCI)
  static CCI(highs: number[], lows: number[], closes: number[], period: number = 20): IndicatorResult {
    const typicalPrices: number[] = [];
    
    for (let i = 0; i < closes.length; i++) {
      typicalPrices.push((highs[i] + lows[i] + closes[i]) / 3);
    }
    
    const sma = this.SMA(typicalPrices, period);
    const currentTP = typicalPrices[typicalPrices.length - 1];
    const currentSMA = sma[sma.length - 1];
    
    // Calculate mean deviation
    const recentTP = typicalPrices.slice(-period);
    const meanDeviation = recentTP.reduce((sum, tp) => sum + Math.abs(tp - currentSMA), 0) / period;
    
    const cci = (currentTP - currentSMA) / (0.015 * meanDeviation);
    
    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let strength = 50;
    
    if (cci < -100) {
      signal = 'buy';
      strength = Math.min(100, (-100 - cci) / 2);
    } else if (cci > 100) {
      signal = 'sell';
      strength = Math.min(100, (cci - 100) / 2);
    }
    
    return {
      value: cci,
      signal,
      strength,
      confidence: Math.min(100, Math.abs(cci) / 2)
    };
  }

  // Money Flow Index (MFI)
  static MFI(highs: number[], lows: number[], closes: number[], volumes: number[], period: number = 14): IndicatorResult {
    const typicalPrices: number[] = [];
    const moneyFlows: number[] = [];
    
    for (let i = 0; i < closes.length; i++) {
      const tp = (highs[i] + lows[i] + closes[i]) / 3;
      typicalPrices.push(tp);
      moneyFlows.push(tp * volumes[i]);
    }
    
    const positiveFlow: number[] = [];
    const negativeFlow: number[] = [];
    
    for (let i = 1; i < typicalPrices.length; i++) {
      if (typicalPrices[i] > typicalPrices[i - 1]) {
        positiveFlow.push(moneyFlows[i]);
        negativeFlow.push(0);
      } else if (typicalPrices[i] < typicalPrices[i - 1]) {
        positiveFlow.push(0);
        negativeFlow.push(moneyFlows[i]);
      } else {
        positiveFlow.push(0);
        negativeFlow.push(0);
      }
    }
    
    const sumPositive = positiveFlow.slice(-period).reduce((a, b) => a + b, 0);
    const sumNegative = negativeFlow.slice(-period).reduce((a, b) => a + b, 0);
    
    const mfi = 100 - (100 / (1 + (sumPositive / sumNegative)));
    
    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let strength = 50;
    
    if (mfi < 20) {
      signal = 'buy';
      strength = Math.min(100, (20 - mfi) * 5);
    } else if (mfi > 80) {
      signal = 'sell';
      strength = Math.min(100, (mfi - 80) * 5);
    }
    
    return {
      value: mfi,
      signal,
      strength,
      confidence: Math.abs(mfi - 50) * 2
    };
  }

  // Comprehensive analysis combining multiple indicators
  static comprehensiveAnalysis(ohlcData: OHLC[]): {
    signals: IndicatorResult[];
    overallSignal: 'buy' | 'sell' | 'neutral';
    confidence: number;
    strength: number;
  } {
    const closes = ohlcData.map(d => d.close);
    const highs = ohlcData.map(d => d.high);
    const lows = ohlcData.map(d => d.low);
    const volumes = ohlcData.map(d => d.volume || 1000);
    
    const signals: IndicatorResult[] = [
      this.RSI(closes),
      this.MACD(closes),
      this.BollingerBands(closes),
      this.Stochastic(highs, lows, closes),
      this.WilliamsR(highs, lows, closes),
      this.CCI(highs, lows, closes),
      this.MFI(highs, lows, closes, volumes)
    ];
    
    // Weight the signals
    const weights = [0.2, 0.25, 0.15, 0.15, 0.1, 0.1, 0.05];
    let buyScore = 0;
    let sellScore = 0;
    let totalConfidence = 0;
    let totalStrength = 0;
    
    signals.forEach((signal, index) => {
      const weight = weights[index];
      const adjustedStrength = (signal.strength / 100) * weight;
      
      if (signal.signal === 'buy') {
        buyScore += adjustedStrength;
      } else if (signal.signal === 'sell') {
        sellScore += adjustedStrength;
      }
      
      totalConfidence += signal.confidence * weight;
      totalStrength += signal.strength * weight;
    });
    
    let overallSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
    
    if (buyScore > sellScore && buyScore > 0.3) {
      overallSignal = 'buy';
    } else if (sellScore > buyScore && sellScore > 0.3) {
      overallSignal = 'sell';
    }
    
    return {
      signals,
      overallSignal,
      confidence: Math.min(100, totalConfidence),
      strength: Math.min(100, totalStrength)
    };
  }
}