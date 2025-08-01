import { EventEmitter } from 'events';
import * as tf from '@tensorflow/tfjs';
import { MarketData, TechnicalIndicators } from '@/types/trading';

export interface MarketSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  strength: number;
  reasoning: string[];
  indicators: Record<string, number>;
  timestamp: Date;
}

export interface MarketRegime {
  type: 'TRENDING' | 'RANGING' | 'VOLATILE' | 'CALM';
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;
  volatility: number;
  confidence: number;
}

export interface AIModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  profitFactor: number;
  sharpeRatio: number;
  lastUpdated: Date;
}

export interface PredictionResult {
  symbol: string;
  predictedPrice: number;
  currentPrice: number;
  predictedChange: number;
  confidence: number;
  timeHorizon: string;
  supportLevels: number[];
  resistanceLevels: number[];
}

export class WindsurfAIBrainService extends EventEmitter {
  private static instance: WindsurfAIBrainService;
  private model: tf.LayersModel | null = null;
  private isModelLoaded: boolean = false;
  private marketRegime: MarketRegime | null = null;
  private modelMetrics: AIModelMetrics | null = null;
  
  private readonly INDICATORS_WINDOW = 20;
  private readonly PREDICTION_THRESHOLD = 0.65;
  private readonly MIN_CONFIDENCE = 0.7;
  
  private constructor() {
    super();
    this.initializeModel();
  }

  static getInstance(): WindsurfAIBrainService {
    if (!WindsurfAIBrainService.instance) {
      WindsurfAIBrainService.instance = new WindsurfAIBrainService();
    }
    return WindsurfAIBrainService.instance;
  }

  private async initializeModel(): Promise<void> {
    try {
      // Create a simple neural network for market prediction
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [15], // Technical indicators as input
            units: 64,
            activation: 'relu',
            kernelInitializer: 'glorotNormal'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 16,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 3, // BUY, SELL, HOLD probabilities
            activation: 'softmax'
          })
        ]
      });

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.isModelLoaded = true;
      
      // Initialize with mock metrics
      this.modelMetrics = {
        accuracy: 0.72,
        precision: 0.68,
        recall: 0.75,
        f1Score: 0.71,
        profitFactor: 2.3,
        sharpeRatio: 1.85,
        lastUpdated: new Date()
      };
      
      this.emit('modelLoaded');
      console.log('🧠 WindsurfAI Brain initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI model:', error);
      this.emit('modelError', error);
    }
  }

  async analyzeMarket(marketData: MarketData[]): Promise<MarketSignal[]> {
    if (!this.isModelLoaded || !this.model) {
      throw new Error('AI model not loaded');
    }

    const signals: MarketSignal[] = [];

    for (const data of marketData) {
      try {
        const signal = await this.generateSignal(data);
        if (signal.confidence >= this.MIN_CONFIDENCE) {
          signals.push(signal);
        }
      } catch (error) {
        console.error(`Error analyzing ${data.symbol}:`, error);
      }
    }

    // Update market regime based on all signals
    this.updateMarketRegime(signals);

    this.emit('analysisComplete', signals);
    return signals;
  }

  private async generateSignal(data: MarketData): Promise<MarketSignal> {
    const features = this.extractFeatures(data);
    const prediction = await this.predict(features);
    
    const action = this.determineAction(prediction);
    const confidence = Math.max(...prediction);
    const strength = this.calculateSignalStrength(data, prediction);
    const reasoning = this.generateReasoning(data, features, prediction);

    return {
      symbol: data.symbol,
      action,
      confidence,
      strength,
      reasoning,
      indicators: this.extractIndicatorValues(data),
      timestamp: new Date()
    };
  }

  private extractFeatures(data: MarketData): number[] {
    const { indicators } = data;
    
    // Normalize features to 0-1 range
    const features = [
      this.normalize(indicators.rsi || 50, 0, 100),
      this.normalize(indicators.macd?.value || 0, -1, 1),
      this.normalize(indicators.macd?.signal || 0, -1, 1),
      this.normalize(indicators.bb?.upper || 0, data.price * 0.9, data.price * 1.1),
      this.normalize(indicators.bb?.lower || 0, data.price * 0.9, data.price * 1.1),
      this.normalize(data.price, data.price * 0.8, data.price * 1.2),
      this.normalize(data.volume || 0, 0, data.avgVolume || 1),
      this.normalize(indicators.ema20 || data.price, data.price * 0.9, data.price * 1.1),
      this.normalize(indicators.ema50 || data.price, data.price * 0.8, data.price * 1.2),
      this.normalize(indicators.atr || 0, 0, data.price * 0.1),
      this.normalize(indicators.adx || 25, 0, 100),
      this.normalize(indicators.stochK || 50, 0, 100),
      this.normalize(indicators.stochD || 50, 0, 100),
      this.normalize(indicators.obv || 0, -1000000, 1000000),
      this.normalize(indicators.vwap || data.price, data.price * 0.9, data.price * 1.1)
    ];

    return features;
  }

  private normalize(value: number, min: number, max: number): number {
    if (max === min) return 0.5;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  private async predict(features: number[]): Promise<number[]> {
    if (!this.model) throw new Error('Model not loaded');

    const input = tf.tensor2d([features]);
    const prediction = this.model.predict(input) as tf.Tensor;
    const result = await prediction.array() as number[][];
    
    input.dispose();
    prediction.dispose();
    
    return result[0];
  }

  private determineAction(prediction: number[]): 'BUY' | 'SELL' | 'HOLD' {
    const [buyProb, sellProb, holdProb] = prediction;
    
    if (buyProb > sellProb && buyProb > holdProb && buyProb > this.PREDICTION_THRESHOLD) {
      return 'BUY';
    } else if (sellProb > buyProb && sellProb > holdProb && sellProb > this.PREDICTION_THRESHOLD) {
      return 'SELL';
    }
    
    return 'HOLD';
  }

  private calculateSignalStrength(data: MarketData, prediction: number[]): number {
    const maxProb = Math.max(...prediction);
    const indicators = data.indicators;
    
    let strength = maxProb;
    
    // Adjust strength based on technical indicators
    if (indicators.rsi) {
      if (indicators.rsi < 30 || indicators.rsi > 70) {
        strength *= 1.2; // Stronger signal at extremes
      }
    }
    
    if (indicators.macd?.histogram) {
      const histogram = Math.abs(indicators.macd.histogram);
      strength *= (1 + histogram / 100); // Stronger with larger MACD histogram
    }
    
    if (indicators.adx && indicators.adx > 25) {
      strength *= 1.1; // Stronger in trending markets
    }
    
    return Math.min(1, strength);
  }

  private generateReasoning(data: MarketData, features: number[], prediction: number[]): string[] {
    const reasoning: string[] = [];
    const [buyProb, sellProb, holdProb] = prediction;
    const indicators = data.indicators;
    
    // AI confidence reasoning
    reasoning.push(`AI confidence: BUY ${(buyProb * 100).toFixed(1)}%, SELL ${(sellProb * 100).toFixed(1)}%, HOLD ${(holdProb * 100).toFixed(1)}%`);
    
    // RSI reasoning
    if (indicators.rsi) {
      if (indicators.rsi < 30) {
        reasoning.push(`RSI oversold at ${indicators.rsi.toFixed(1)}`);
      } else if (indicators.rsi > 70) {
        reasoning.push(`RSI overbought at ${indicators.rsi.toFixed(1)}`);
      }
    }
    
    // MACD reasoning
    if (indicators.macd) {
      if (indicators.macd.value > indicators.macd.signal) {
        reasoning.push('MACD bullish crossover');
      } else if (indicators.macd.value < indicators.macd.signal) {
        reasoning.push('MACD bearish crossover');
      }
    }
    
    // Bollinger Bands reasoning
    if (indicators.bb) {
      if (data.price > indicators.bb.upper) {
        reasoning.push('Price above upper Bollinger Band');
      } else if (data.price < indicators.bb.lower) {
        reasoning.push('Price below lower Bollinger Band');
      }
    }
    
    // Trend reasoning
    if (indicators.ema20 && indicators.ema50) {
      if (indicators.ema20 > indicators.ema50) {
        reasoning.push('Short-term trend bullish (EMA20 > EMA50)');
      } else {
        reasoning.push('Short-term trend bearish (EMA20 < EMA50)');
      }
    }
    
    // Volume reasoning
    if (data.volume && data.avgVolume) {
      const volumeRatio = data.volume / data.avgVolume;
      if (volumeRatio > 1.5) {
        reasoning.push(`High volume (${(volumeRatio * 100).toFixed(0)}% of average)`);
      }
    }
    
    return reasoning;
  }

  private extractIndicatorValues(data: MarketData): Record<string, number> {
    const indicators: Record<string, number> = {
      price: data.price,
      volume: data.volume || 0,
      rsi: data.indicators.rsi || 0,
      macd: data.indicators.macd?.value || 0,
      macdSignal: data.indicators.macd?.signal || 0,
      macdHistogram: data.indicators.macd?.histogram || 0,
      bbUpper: data.indicators.bb?.upper || 0,
      bbLower: data.indicators.bb?.lower || 0,
      bbMiddle: data.indicators.bb?.middle || 0,
      ema20: data.indicators.ema20 || 0,
      ema50: data.indicators.ema50 || 0,
      atr: data.indicators.atr || 0,
      adx: data.indicators.adx || 0,
      stochK: data.indicators.stochK || 0,
      stochD: data.indicators.stochD || 0
    };
    
    return indicators;
  }

  private updateMarketRegime(signals: MarketSignal[]): void {
    if (signals.length === 0) return;
    
    const buySignals = signals.filter(s => s.action === 'BUY').length;
    const sellSignals = signals.filter(s => s.action === 'SELL').length;
    const totalSignals = signals.length;
    
    const bullishRatio = buySignals / totalSignals;
    const bearishRatio = sellSignals / totalSignals;
    
    let type: MarketRegime['type'] = 'RANGING';
    let direction: MarketRegime['direction'] = 'NEUTRAL';
    
    if (bullishRatio > 0.6) {
      direction = 'BULLISH';
      type = 'TRENDING';
    } else if (bearishRatio > 0.6) {
      direction = 'BEARISH';
      type = 'TRENDING';
    }
    
    const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
    const avgStrength = signals.reduce((sum, s) => sum + s.strength, 0) / signals.length;
    
    // Calculate volatility from signal variance
    const signalVariance = this.calculateSignalVariance(signals);
    const volatility = signalVariance > 0.3 ? 0.8 : signalVariance > 0.1 ? 0.5 : 0.2;
    
    if (volatility > 0.6) {
      type = 'VOLATILE';
    } else if (volatility < 0.3 && type === 'RANGING') {
      type = 'CALM';
    }
    
    this.marketRegime = {
      type,
      direction,
      strength: avgStrength,
      volatility,
      confidence: avgConfidence
    };
    
    this.emit('regimeUpdate', this.marketRegime);
  }

  private calculateSignalVariance(signals: MarketSignal[]): number {
    if (signals.length < 2) return 0;
    
    const strengths = signals.map(s => s.strength);
    const mean = strengths.reduce((a, b) => a + b) / strengths.length;
    const variance = strengths.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / strengths.length;
    
    return Math.sqrt(variance);
  }

  async predictPrice(symbol: string, marketData: MarketData, timeHorizon: string = '1H'): Promise<PredictionResult> {
    if (!this.isModelLoaded) {
      throw new Error('AI model not loaded');
    }

    const features = this.extractFeatures(marketData);
    const prediction = await this.predict(features);
    
    // Calculate predicted price change based on signal strength
    const [buyProb, sellProb] = prediction;
    const netSignal = buyProb - sellProb;
    
    // Estimate price change based on ATR and signal strength
    const atr = marketData.indicators.atr || marketData.price * 0.01;
    const timeMultiplier = this.getTimeHorizonMultiplier(timeHorizon);
    const predictedChange = netSignal * atr * timeMultiplier;
    
    const predictedPrice = marketData.price + predictedChange;
    
    // Calculate support and resistance levels
    const { supportLevels, resistanceLevels } = this.calculateSupportResistance(marketData);
    
    return {
      symbol,
      predictedPrice,
      currentPrice: marketData.price,
      predictedChange,
      confidence: Math.max(...prediction),
      timeHorizon,
      supportLevels,
      resistanceLevels
    };
  }

  private getTimeHorizonMultiplier(timeHorizon: string): number {
    const multipliers: Record<string, number> = {
      '5M': 0.1,
      '15M': 0.3,
      '30M': 0.5,
      '1H': 1.0,
      '4H': 2.5,
      '1D': 5.0,
      '1W': 10.0
    };
    
    return multipliers[timeHorizon] || 1.0;
  }

  private calculateSupportResistance(data: MarketData): { supportLevels: number[], resistanceLevels: number[] } {
    const price = data.price;
    const atr = data.indicators.atr || price * 0.01;
    
    // Calculate Fibonacci levels
    const levels = [0.236, 0.382, 0.5, 0.618, 0.786];
    const range = atr * 5; // Use 5 ATR as range
    
    const supportLevels = levels.map(level => price - range * level).sort((a, b) => b - a);
    const resistanceLevels = levels.map(level => price + range * level).sort((a, b) => a - b);
    
    // Add Bollinger Bands as additional levels
    if (data.indicators.bb) {
      supportLevels.push(data.indicators.bb.lower);
      resistanceLevels.push(data.indicators.bb.upper);
    }
    
    // Add moving averages as levels
    if (data.indicators.ema20) supportLevels.push(data.indicators.ema20);
    if (data.indicators.ema50) supportLevels.push(data.indicators.ema50);
    
    return {
      supportLevels: [...new Set(supportLevels)].sort((a, b) => b - a).slice(0, 3),
      resistanceLevels: [...new Set(resistanceLevels)].sort((a, b) => a - b).slice(0, 3)
    };
  }

  async trainModel(trainingData: { features: number[][], labels: number[][] }): Promise<void> {
    if (!this.model) throw new Error('Model not initialized');
    
    const { features, labels } = trainingData;
    
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);
    
    try {
      const history = await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            this.emit('trainingProgress', { epoch, logs });
          }
        }
      });
      
      // Update model metrics
      const finalLogs = history.history;
      this.modelMetrics = {
        accuracy: finalLogs.acc?.[finalLogs.acc.length - 1] || 0,
        precision: 0.7, // Mock for now
        recall: 0.75, // Mock for now
        f1Score: 0.72, // Mock for now
        profitFactor: 2.1, // Mock for now
        sharpeRatio: 1.75, // Mock for now
        lastUpdated: new Date()
      };
      
      this.emit('modelTrained', this.modelMetrics);
    } finally {
      xs.dispose();
      ys.dispose();
    }
  }

  getMarketRegime(): MarketRegime | null {
    return this.marketRegime;
  }

  getModelMetrics(): AIModelMetrics | null {
    return this.modelMetrics;
  }

  isReady(): boolean {
    return this.isModelLoaded;
  }

  async dispose(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isModelLoaded = false;
    }
  }
}

export default WindsurfAIBrainService;