interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalPattern {
  name: string;
  type: 'reversal' | 'continuation' | 'neutral';
  timeframe: string;
  symbol: string;
  confidence: number;
  significance: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: number;
  expectedDuration: number;
  targetPrice?: number;
  stopLoss?: number;
  description: string;
  additionalInfo: {
    volume: 'low' | 'normal' | 'high';
    momentum: 'weak' | 'moderate' | 'strong';
    confirmation: boolean;
  };
}

interface SupportResistanceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: number;
  touchCount: number;
  firstTouch: number;
  lastTouch: number;
  isActive: boolean;
}

interface TrendAnalysis {
  symbol: string;
  timeframe: string;
  direction: 'uptrend' | 'downtrend' | 'sideways';
  strength: number;
  duration: number;
  angle: number;
  confidence: number;
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  trendLines: {
    upper: { slope: number; intercept: number };
    lower: { slope: number; intercept: number };
  };
}

interface ChartPattern {
  name: string;
  type: 'triangle' | 'wedge' | 'channel' | 'head_shoulders' | 'cup_handle' | 'flag' | 'pennant';
  bullish: boolean;
  startTime: number;
  endTime: number;
  breakoutPrice: number;
  confidence: number;
  targetPrice: number;
  stopLoss: number;
  volume: 'confirming' | 'neutral' | 'diverging';
}

export class PatternRecognitionEngine {
  private historicalData: Map<string, CandlestickData[]> = new Map();
  private detectedPatterns: Map<string, TechnicalPattern[]> = new Map();
  private supportResistanceLevels: Map<string, SupportResistanceLevel[]> = new Map();
  private trendAnalyses: Map<string, TrendAnalysis> = new Map();
  private chartPatterns: Map<string, ChartPattern[]> = new Map();
  
  private isRunning = false;
  private readonly UPDATE_INTERVAL = 60000;
  private readonly DATA_RETENTION = 500;
  private readonly MIN_PATTERN_CONFIDENCE = 0.6;

  constructor() {}

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Pattern Recognition Engine already running');
      return;
    }

    console.log('🔍 Starting Pattern Recognition Engine...');
    this.isRunning = true;

    await this.initializeHistoricalData();

    setInterval(() => {
      this.detectAllPatterns();
    }, this.UPDATE_INTERVAL);

    console.log('✅ Pattern Recognition Engine started');
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('🛑 Pattern Recognition Engine stopped');
  }

  private async initializeHistoricalData(): Promise<void> {
    const symbols = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD', 'BTC_USD'];

    for (const symbol of symbols) {
      const data = this.generateMockData(symbol, this.DATA_RETENTION);
      this.historicalData.set(symbol, data);
      console.log(`📊 Initialized ${data.length} candles for ${symbol}`);
    }
  }

  private generateMockData(symbol: string, count: number): CandlestickData[] {
    const data: CandlestickData[] = [];
    const basePrice = this.getBasePrice(symbol);
    let currentPrice = basePrice;
    
    const now = Date.now();
    const interval = 60000;

    for (let i = count; i >= 0; i--) {
      const timestamp = now - (i * interval);
      
      const volatility = this.getSymbolVolatility(symbol);
      const trend = Math.sin(i / 50) * 0.002;
      const noise = (Math.random() - 0.5) * volatility;
      
      const priceChange = (trend + noise) * currentPrice;
      const open = currentPrice;
      currentPrice += priceChange;
      
      const wickSize = volatility * 0.3;
      const high = Math.max(open, currentPrice) + (Math.random() * wickSize * currentPrice);
      const low = Math.min(open, currentPrice) - (Math.random() * wickSize * currentPrice);
      
      const volume = 1000 + Math.random() * 5000;

      data.push({
        timestamp,
        open,
        high,
        low,
        close: currentPrice,
        volume
      });
    }

    return data;
  }

  private getBasePrice(symbol: string): number {
    const basePrices: { [key: string]: number } = {
      'EUR_USD': 1.0850,
      'GBP_USD': 1.2650,
      'USD_JPY': 149.50,
      'XAU_USD': 2045.50,
      'BTC_USD': 43250.00
    };

    return basePrices[symbol] || 1.0000;
  }

  private getSymbolVolatility(symbol: string): number {
    const volatilities: { [key: string]: number } = {
      'EUR_USD': 0.008,
      'GBP_USD': 0.012,
      'USD_JPY': 0.010,
      'XAU_USD': 0.015,
      'BTC_USD': 0.035
    };

    return volatilities[symbol] || 0.01;
  }

  private detectAllPatterns(): void {
    if (!this.isRunning) return;

    console.log('🔍 Detecting patterns across all symbols...');

    for (const [symbol, data] of this.historicalData.entries()) {
      try {
        this.detectCandlestickPatterns(symbol, data);
        this.detectChartPatterns(symbol, data);
        this.analyzeTrends(symbol, data);
        this.identifySupportResistance(symbol, data);
      } catch (error) {
        console.error(`❌ Pattern detection failed for ${symbol}:`, error);
      }
    }
  }

  private detectCandlestickPatterns(symbol: string, data: CandlestickData[]): void {
    if (data.length < 5) return;

    const patterns: TechnicalPattern[] = [];
    const recentCandles = data.slice(-20);

    for (let i = 3; i < recentCandles.length; i++) {
      const current = recentCandles[i];
      const prev1 = recentCandles[i - 1];
      const prev2 = recentCandles[i - 2];
      const prev3 = recentCandles[i - 3];

      const dojiPattern = this.detectDoji(current);
      if (dojiPattern) {
        patterns.push({
          name: 'Doji',
          type: 'neutral',
          timeframe: '1m',
          symbol,
          confidence: dojiPattern.confidence,
          significance: 'medium',
          detectedAt: current.timestamp,
          expectedDuration: 60,
          description: 'Doji candlestick indicates market indecision',
          additionalInfo: {
            volume: this.classifyVolume(current.volume, recentCandles),
            momentum: 'weak',
            confirmation: false
          }
        });
      }

      const hammerPattern = this.detectHammer(current, prev1);
      if (hammerPattern) {
        patterns.push({
          name: hammerPattern.name,
          type: 'reversal',
          timeframe: '1m',
          symbol,
          confidence: hammerPattern.confidence,
          significance: 'high',
          detectedAt: current.timestamp,
          expectedDuration: 180,
          description: `${hammerPattern.name} pattern suggests potential reversal`,
          additionalInfo: {
            volume: this.classifyVolume(current.volume, recentCandles),
            momentum: 'moderate',
            confirmation: hammerPattern.confirmation
          }
        });
      }

      const engulfingPattern = this.detectEngulfing(current, prev1);
      if (engulfingPattern) {
        patterns.push({
          name: engulfingPattern.name,
          type: 'reversal',
          timeframe: '1m',
          symbol,
          confidence: engulfingPattern.confidence,
          significance: 'high',
          detectedAt: current.timestamp,
          expectedDuration: 240,
          targetPrice: engulfingPattern.target,
          stopLoss: engulfingPattern.stopLoss,
          description: `${engulfingPattern.name} pattern indicates strong reversal signal`,
          additionalInfo: {
            volume: this.classifyVolume(current.volume, recentCandles),
            momentum: 'strong',
            confirmation: engulfingPattern.confirmation
          }
        });
      }

      const threePattern = this.detectThreeCandlePatterns(current, prev1, prev2);
      if (threePattern) {
        patterns.push({
          name: threePattern.name,
          type: threePattern.type,
          timeframe: '1m',
          symbol,
          confidence: threePattern.confidence,
          significance: 'high',
          detectedAt: current.timestamp,
          expectedDuration: 300,
          description: `${threePattern.name} pattern detected`,
          additionalInfo: {
            volume: this.classifyVolume(current.volume, recentCandles),
            momentum: threePattern.momentum,
            confirmation: threePattern.confirmation
          }
        });
      }
    }

    const validPatterns = patterns.filter(p => p.confidence >= this.MIN_PATTERN_CONFIDENCE);
    this.detectedPatterns.set(symbol, validPatterns);
  }

  private detectDoji(candle: CandlestickData): { confidence: number } | null {
    const bodySize = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;
    
    if (totalRange === 0) return null;
    
    const bodyToRangeRatio = bodySize / totalRange;
    
    if (bodyToRangeRatio < 0.1) {
      return {
        confidence: Math.min(0.9, (0.1 - bodyToRangeRatio) * 10)
      };
    }
    
    return null;
  }

  private detectHammer(current: CandlestickData, previous: CandlestickData): {
    name: string;
    confidence: number;
    confirmation: boolean;
  } | null {
    const bodySize = Math.abs(current.close - current.open);
    const totalRange = current.high - current.low;
    const lowerWick = Math.min(current.open, current.close) - current.low;
    const upperWick = current.high - Math.max(current.open, current.close);
    
    if (totalRange === 0) return null;
    
    if (lowerWick >= bodySize * 2 && upperWick <= bodySize * 0.5 && bodySize > 0) {
      const isInDowntrend = previous.close < previous.open;
      const confidence = Math.min(0.85, (lowerWick / totalRange) * 1.2);
      
      return {
        name: isInDowntrend ? 'Hammer' : 'Hanging Man',
        confidence,
        confirmation: isInDowntrend && current.close > current.open
      };
    }
    
    return null;
  }

  private detectEngulfing(current: CandlestickData, previous: CandlestickData): {
    name: string;
    confidence: number;
    confirmation: boolean;
    target: number;
    stopLoss: number;
  } | null {
    const currentBullish = current.close > current.open;
    const previousBullish = previous.close > previous.open;
    
    if (currentBullish && !previousBullish) {
      if (current.open < previous.close && current.close > previous.open) {
        const engulfmentRatio = (current.close - current.open) / (previous.open - previous.close);
        const confidence = Math.min(0.9, engulfmentRatio * 0.7);
        
        return {
          name: 'Bullish Engulfing',
          confidence,
          confirmation: current.volume > previous.volume,
          target: current.close + (current.close - current.open) * 1.5,
          stopLoss: Math.min(current.open, previous.close) * 0.995
        };
      }
    }
    
    if (!currentBullish && previousBullish) {
      if (current.open > previous.close && current.close < previous.open) {
        const engulfmentRatio = (current.open - current.close) / (previous.close - previous.open);
        const confidence = Math.min(0.9, engulfmentRatio * 0.7);
        
        return {
          name: 'Bearish Engulfing',
          confidence,
          confirmation: current.volume > previous.volume,
          target: current.close - (current.open - current.close) * 1.5,
          stopLoss: Math.max(current.open, previous.close) * 1.005
        };
      }
    }
    
    return null;
  }

  private detectThreeCandlePatterns(c1: CandlestickData, c2: CandlestickData, c3: CandlestickData): {
    name: string;
    type: 'reversal' | 'continuation';
    confidence: number;
    momentum: 'weak' | 'moderate' | 'strong';
    confirmation: boolean;
  } | null {
    if (this.isBearish(c3) && this.isDoji(c2) && this.isBullish(c1)) {
      if (c2.close < c3.close && c1.close > (c3.open + c3.close) / 2) {
        return {
          name: 'Morning Star',
          type: 'reversal',
          confidence: 0.8,
          momentum: 'strong',
          confirmation: c1.volume > c2.volume
        };
      }
    }
    
    if (this.isBullish(c3) && this.isDoji(c2) && this.isBearish(c1)) {
      if (c2.close > c3.close && c1.close < (c3.open + c3.close) / 2) {
        return {
          name: 'Evening Star',
          type: 'reversal',
          confidence: 0.8,
          momentum: 'strong',
          confirmation: c1.volume > c2.volume
        };
      }
    }
    
    if (this.isBullish(c3) && this.isBullish(c2) && this.isBullish(c1)) {
      if (c2.close > c3.close && c1.close > c2.close) {
        return {
          name: 'Three White Soldiers',
          type: 'continuation',
          confidence: 0.75,
          momentum: 'strong',
          confirmation: c1.volume >= c3.volume
        };
      }
    }
    
    return null;
  }

  private isBullish(candle: CandlestickData): boolean {
    return candle.close > candle.open;
  }

  private isBearish(candle: CandlestickData): boolean {
    return candle.close < candle.open;
  }

  private isDoji(candle: CandlestickData): boolean {
    const bodySize = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;
    return bodySize / totalRange < 0.1;
  }

  private classifyVolume(volume: number, recentCandles: CandlestickData[]): 'low' | 'normal' | 'high' {
    const avgVolume = recentCandles.reduce((sum, c) => sum + c.volume, 0) / recentCandles.length;
    
    if (volume > avgVolume * 1.5) return 'high';
    if (volume < avgVolume * 0.7) return 'low';
    return 'normal';
  }

  private detectChartPatterns(symbol: string, data: CandlestickData[]): void {
    if (data.length < 50) return;

    const patterns: ChartPattern[] = [];
    const recentData = data.slice(-100);

    const trianglePattern = this.detectTrianglePattern(recentData);
    if (trianglePattern) {
      patterns.push(trianglePattern);
    }

    const headShouldersPattern = this.detectHeadAndShoulders(recentData);
    if (headShouldersPattern) {
      patterns.push(headShouldersPattern);
    }

    const flagPattern = this.detectFlagPattern(recentData);
    if (flagPattern) {
      patterns.push(flagPattern);
    }

    this.chartPatterns.set(symbol, patterns);
  }

  private detectTrianglePattern(data: CandlestickData[]): ChartPattern | null {
    if (data.length < 20) return null;

    const highs = data.map(c => c.high);
    const lows = data.map(c => c.low);
    
    const recentHighs = highs.slice(-20);
    const recentLows = lows.slice(-20);
    
    const highTrend = this.calculateTrend(recentHighs);
    const lowTrend = this.calculateTrend(recentLows);
    
    if (Math.abs(highTrend.slope + lowTrend.slope) < 0.001 && 
        highTrend.slope < 0 && lowTrend.slope > 0) {
      
      const startTime = data[data.length - 20].timestamp;
      const endTime = data[data.length - 1].timestamp;
      const currentPrice = data[data.length - 1].close;
      
      return {
        name: 'Ascending Triangle',
        type: 'triangle',
        bullish: true,
        startTime,
        endTime,
        breakoutPrice: Math.max(...recentHighs),
        confidence: 0.7,
        targetPrice: currentPrice * 1.02,
        stopLoss: currentPrice * 0.98,
        volume: 'neutral'
      };
    }
    
    return null;
  }

  private detectHeadAndShoulders(data: CandlestickData[]): ChartPattern | null {
    if (data.length < 30) return null;

    const highs = data.slice(-30).map(c => c.high);
    const maxIndex = highs.indexOf(Math.max(...highs));
    
    if (maxIndex < 10 || maxIndex > 20) return null;
    
    const leftShoulder = Math.max(...highs.slice(0, maxIndex - 5));
    const head = highs[maxIndex];
    const rightShoulder = Math.max(...highs.slice(maxIndex + 5));
    
    if (head > leftShoulder * 1.02 && head > rightShoulder * 1.02 &&
        Math.abs(leftShoulder - rightShoulder) / leftShoulder < 0.03) {
      
      return {
        name: 'Head and Shoulders',
        type: 'head_shoulders',
        bullish: false,
        startTime: data[data.length - 30].timestamp,
        endTime: data[data.length - 1].timestamp,
        breakoutPrice: Math.min(leftShoulder, rightShoulder),
        confidence: 0.75,
        targetPrice: Math.min(leftShoulder, rightShoulder) * 0.95,
        stopLoss: head * 1.01,
        volume: 'neutral'
      };
    }
    
    return null;
  }

  private detectFlagPattern(data: CandlestickData[]): ChartPattern | null {
    if (data.length < 15) return null;

    const prices = data.slice(-15).map(c => c.close);
    const trend = this.calculateTrend(prices);
    
    const recentRange = Math.max(...prices) - Math.min(...prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    
    if (recentRange / avgPrice < 0.02 && Math.abs(trend.slope) < 0.001) {
      return {
        name: 'Bull Flag',
        type: 'flag',
        bullish: true,
        startTime: data[data.length - 15].timestamp,
        endTime: data[data.length - 1].timestamp,
        breakoutPrice: Math.max(...prices),
        confidence: 0.65,
        targetPrice: avgPrice * 1.015,
        stopLoss: avgPrice * 0.985,
        volume: 'neutral'
      };
    }
    
    return null;
  }

  private calculateTrend(values: number[]): { slope: number; intercept: number } {
    const n = values.length;
    const xSum = n * (n - 1) / 2;
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, index) => sum + val * index, 0);
    const xxSum = n * (n - 1) * (2 * n - 1) / 6;
    
    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;
    
    return { slope, intercept };
  }

  private analyzeTrends(symbol: string, data: CandlestickData[]): void {
    if (data.length < 20) return;

    const recentData = data.slice(-50);
    const closes = recentData.map(c => c.close);
    const trend = this.calculateTrend(closes);
    
    let direction: 'uptrend' | 'downtrend' | 'sideways';
    if (trend.slope > 0.001) {
      direction = 'uptrend';
    } else if (trend.slope < -0.001) {
      direction = 'downtrend';
    } else {
      direction = 'sideways';
    }
    
    const strength = Math.min(1, Math.abs(trend.slope) * 1000);
    const angle = Math.atan(trend.slope) * (180 / Math.PI);
    
    const support = this.findSupportLevels(recentData);
    const resistance = this.findResistanceLevels(recentData);
    
    const analysis: TrendAnalysis = {
      symbol,
      timeframe: '1m',
      direction,
      strength,
      duration: recentData.length,
      angle,
      confidence: 0.7,
      keyLevels: {
        support,
        resistance
      },
      trendLines: {
        upper: { slope: trend.slope, intercept: trend.intercept + 0.01 },
        lower: { slope: trend.slope, intercept: trend.intercept - 0.01 }
      }
    };
    
    this.trendAnalyses.set(symbol, analysis);
  }

  private findSupportLevels(data: CandlestickData[]): number[] {
    const lows = data.map(c => c.low);
    const levels: number[] = [];
    
    for (let i = 2; i < lows.length - 2; i++) {
      if (lows[i] < lows[i-1] && lows[i] < lows[i-2] &&
          lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
        levels.push(lows[i]);
      }
    }
    
    return [...new Set(levels)].sort((a, b) => a - b);
  }

  private findResistanceLevels(data: CandlestickData[]): number[] {
    const highs = data.map(c => c.high);
    const levels: number[] = [];
    
    for (let i = 2; i < highs.length - 2; i++) {
      if (highs[i] > highs[i-1] && highs[i] > highs[i-2] &&
          highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
        levels.push(highs[i]);
      }
    }
    
    return [...new Set(levels)].sort((a, b) => b - a);
  }

  private identifySupportResistance(symbol: string, data: CandlestickData[]): void {
    if (data.length < 50) return;

    const levels: SupportResistanceLevel[] = [];
    const recentData = data.slice(-100);
    
    const pivots = this.findPivotPoints(recentData);
    
    pivots.forEach(pivot => {
      const touchCount = this.countTouches(recentData, pivot.price, pivot.type);
      
      if (touchCount >= 2) {
        levels.push({
          price: pivot.price,
          type: pivot.type,
          strength: Math.min(1, touchCount / 5),
          touchCount,
          firstTouch: pivot.timestamp,
          lastTouch: recentData[recentData.length - 1].timestamp,
          isActive: this.isLevelActive(pivot.price, recentData[recentData.length - 1])
        });
      }
    });
    
    this.supportResistanceLevels.set(symbol, levels);
  }

  private findPivotPoints(data: CandlestickData[]): { price: number; type: 'support' | 'resistance'; timestamp: number }[] {
    const pivots: { price: number; type: 'support' | 'resistance'; timestamp: number }[] = [];
    
    for (let i = 2; i < data.length - 2; i++) {
      const candle = data[i];
      
      if (candle.high > data[i-1].high && candle.high > data[i-2].high &&
          candle.high > data[i+1].high && candle.high > data[i+2].high) {
        pivots.push({
          price: candle.high,
          type: 'resistance',
          timestamp: candle.timestamp
        });
      }
      
      if (candle.low < data[i-1].low && candle.low < data[i-2].low &&
          candle.low < data[i+1].low && candle.low < data[i+2].low) {
        pivots.push({
          price: candle.low,
          type: 'support',
          timestamp: candle.timestamp
        });
      }
    }
    
    return pivots;
  }

  private countTouches(data: CandlestickData[], level: number, type: 'support' | 'resistance'): number {
    const tolerance = level * 0.002;
    let touches = 0;
    
    data.forEach(candle => {
      if (type === 'support' && Math.abs(candle.low - level) <= tolerance) {
        touches++;
      } else if (type === 'resistance' && Math.abs(candle.high - level) <= tolerance) {
        touches++;
      }
    });
    
    return touches;
  }

  private isLevelActive(level: number, currentCandle: CandlestickData): boolean {
    const currentPrice = currentCandle.close;
    const distance = Math.abs(currentPrice - level) / currentPrice;
    
    return distance < 0.05;
  }

  // Public API methods
  getDetectedPatterns(symbol: string): TechnicalPattern[] {
    return this.detectedPatterns.get(symbol) || [];
  }

  getChartPatterns(symbol: string): ChartPattern[] {
    return this.chartPatterns.get(symbol) || [];
  }

  getTrendAnalysis(symbol: string): TrendAnalysis | null {
    return this.trendAnalyses.get(symbol) || null;
  }

  getSupportResistanceLevels(symbol: string): SupportResistanceLevel[] {
    return this.supportResistanceLevels.get(symbol) || [];
  }

  getAllPatterns(): {
    [symbol: string]: {
      candlestick: TechnicalPattern[];
      chart: ChartPattern[];
      trend: TrendAnalysis | null;
      levels: SupportResistanceLevel[];
    };
  } {
    const result: any = {};
    
    for (const symbol of this.historicalData.keys()) {
      result[symbol] = {
        candlestick: this.getDetectedPatterns(symbol),
        chart: this.getChartPatterns(symbol),
        trend: this.getTrendAnalysis(symbol),
        levels: this.getSupportResistanceLevels(symbol)
      };
    }
    
    return result;
  }

  async addMarketData(symbol: string, data: CandlestickData): Promise<void> {
    if (!this.historicalData.has(symbol)) {
      this.historicalData.set(symbol, []);
    }

    const history = this.historicalData.get(symbol)!;
    history.push(data);

    if (history.length > this.DATA_RETENTION) {
      this.historicalData.set(symbol, history.slice(-this.DATA_RETENTION));
    }

    this.detectCandlestickPatterns(symbol, history);
    this.detectChartPatterns(symbol, history);
    this.analyzeTrends(symbol, history);
    this.identifySupportResistance(symbol, history);
  }

  getPatternStatistics(): {
    totalPatterns: number;
    patternsByType: { [type: string]: number };
    patternsBySymbol: { [symbol: string]: number };
    averageConfidence: number;
  } {
    let totalPatterns = 0;
    const patternsByType: { [type: string]: number } = {};
    const patternsBySymbol: { [symbol: string]: number } = {};
    let totalConfidence = 0;

    for (const [symbol, patterns] of this.detectedPatterns.entries()) {
      totalPatterns += patterns.length;
      patternsBySymbol[symbol] = patterns.length;

      patterns.forEach(pattern => {
        patternsByType[pattern.name] = (patternsByType[pattern.name] || 0) + 1;
        totalConfidence += pattern.confidence;
      });
    }

    return {
      totalPatterns,
      patternsByType,
      patternsBySymbol,
      averageConfidence: totalPatterns > 0 ? totalConfidence / totalPatterns : 0
    };
  }

  async forceUpdate(): Promise<void> {
    this.detectAllPatterns();
  }
}