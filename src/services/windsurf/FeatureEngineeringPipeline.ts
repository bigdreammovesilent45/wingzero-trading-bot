import { EventEmitter } from 'events';
import * as tf from '@tensorflow/tfjs';
import { SMA, EMA, RSI, ATR, BollingerBands, VWAP, OBV, MACD, StochasticRSI } from 'technicalindicators';

// Types and Interfaces
export interface MarketData {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bid?: number;
  ask?: number;
  bidVolume?: number;
  askVolume?: number;
}

export interface Candle extends MarketData {
  trades?: number;
  vwap?: number;
}

export interface FeatureVector {
  [key: string]: number | number[] | tf.Tensor;
}

export interface FeatureDataset {
  features: FeatureVector[];
  labels?: number[];
  metadata: DatasetMetadata;
}

export interface DatasetMetadata {
  symbols: string[];
  startDate: Date;
  endDate: Date;
  featureNames: string[];
  shape: number[];
  size: number;
}

export interface TransformConfig {
  normalization?: NormalizationConfig;
  encoding?: EncodingConfig;
  aggregation?: AggregationConfig;
  dimensionReduction?: DimensionReductionConfig;
}

export interface NormalizationConfig {
  method: 'minmax' | 'zscore' | 'robust' | 'quantile';
  featureRange?: [number, number];
  clipOutliers?: boolean;
}

export interface EncodingConfig {
  categoricalFeatures: string[];
  method: 'onehot' | 'ordinal' | 'target' | 'embedding';
}

export interface AggregationConfig {
  windows: number[];
  functions: ('mean' | 'std' | 'min' | 'max' | 'sum')[];
}

export interface DimensionReductionConfig {
  method: 'pca' | 'autoencoder' | 'umap';
  components: number;
}

export interface FeatureImportance {
  [featureName: string]: number;
}

export interface RawFeatures {
  numerical: Record<string, number>;
  categorical: Record<string, string>;
  temporal: Record<string, Date>;
  text?: Record<string, string>;
}

export interface TransformedFeatures {
  vector: number[];
  tensor?: tf.Tensor;
  metadata: FeatureMetadata;
}

export interface FeatureMetadata {
  originalShape: number[];
  transformedShape: number[];
  featureNames: string[];
  transformations: string[];
}

export interface SelectedFeatures {
  features: string[];
  importance: FeatureImportance;
  vector: number[];
}

// Technical Indicator Calculator
class TechnicalIndicatorCalculator {
  private cache: Map<string, any> = new Map();

  calculate(indicator: string, candles: Candle[], ...params: any[]): number | number[] {
    const cacheKey = `${indicator}_${params.join('_')}_${candles.length}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let result: any;
    const values = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    switch (indicator) {
      case 'sma':
        result = SMA.calculate({ period: params[0], values });
        break;
      case 'ema':
        result = EMA.calculate({ period: params[0], values });
        break;
      case 'rsi':
        result = RSI.calculate({ period: params[0], values });
        break;
      case 'atr':
        result = ATR.calculate({ 
          period: params[0], 
          high: highs, 
          low: lows, 
          close: values 
        });
        break;
      case 'bb':
        result = BollingerBands.calculate({ 
          period: params[0], 
          values, 
          stdDev: params[1] 
        });
        break;
      case 'vwap':
        result = this.calculateVWAP(candles);
        break;
      case 'obv':
        result = OBV.calculate({ close: values, volume: volumes });
        break;
      case 'macd':
        result = MACD.calculate({
          values,
          fastPeriod: params[0] || 12,
          slowPeriod: params[1] || 26,
          signalPeriod: params[2] || 9,
          SimpleMAOscillator: false,
          SimpleMASignal: false
        });
        break;
      case 'stochrsi':
        result = StochasticRSI.calculate({
          values,
          rsiPeriod: params[0] || 14,
          stochasticPeriod: params[1] || 14,
          kPeriod: params[2] || 3,
          dPeriod: params[3] || 3
        });
        break;
      default:
        throw new Error(`Unknown indicator: ${indicator}`);
    }

    this.cache.set(cacheKey, result);
    return result;
  }

  private calculateVWAP(candles: Candle[]): number[] {
    const vwaps: number[] = [];
    let cumulativeVolume = 0;
    let cumulativeVolumePrice = 0;

    for (const candle of candles) {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      cumulativeVolumePrice += typicalPrice * candle.volume;
      cumulativeVolume += candle.volume;
      vwaps.push(cumulativeVolume > 0 ? cumulativeVolumePrice / cumulativeVolume : typicalPrice);
    }

    return vwaps;
  }
}

// Main Feature Engineering Pipeline
export class FeatureEngineeringPipeline extends EventEmitter {
  private indicatorCalculator: TechnicalIndicatorCalculator;
  private featureCache: Map<string, FeatureVector> = new Map();
  private normalizationParams: Map<string, any> = new Map();

  constructor() {
    super();
    this.indicatorCalculator = new TechnicalIndicatorCalculator();
  }

  /**
   * Compute real-time features from market data
   */
  computeRealTimeFeatures(data: MarketData): FeatureVector {
    const features: FeatureVector = {};

    // Price features
    features.price_change = (data.close - data.open) / data.open;
    features.high_low_ratio = data.high / data.low;
    features.close_to_high = (data.high - data.close) / data.high;
    features.close_to_low = (data.close - data.low) / data.low;

    // Volume features
    features.volume_normalized = this.normalizeVolume(data.volume);
    
    // Spread features
    if (data.bid && data.ask) {
      features.spread = data.ask - data.bid;
      features.spread_percentage = features.spread / data.bid;
      features.mid_price = (data.bid + data.ask) / 2;
    }

    // Microstructure features
    if (data.bidVolume && data.askVolume) {
      features.volume_imbalance = (data.bidVolume - data.askVolume) / (data.bidVolume + data.askVolume);
      features.volume_ratio = data.bidVolume / data.askVolume;
    }

    // Time-based features
    features.hour_of_day = data.timestamp.getHours();
    features.day_of_week = data.timestamp.getDay();
    features.is_market_open = this.isMarketOpen(data.timestamp) ? 1 : 0;

    this.emit('features:computed', { data, features });
    return features;
  }

  /**
   * Generate batch features for historical data
   */
  async generateBatchFeatures(
    candles: Candle[],
    startDate: Date,
    endDate: Date
  ): Promise<FeatureDataset> {
    const filteredCandles = candles.filter(
      c => c.timestamp >= startDate && c.timestamp <= endDate
    );

    const features: FeatureVector[] = [];
    const batchSize = 100;

    // Process in batches for memory efficiency
    for (let i = 0; i < filteredCandles.length; i += batchSize) {
      const batch = filteredCandles.slice(i, Math.min(i + batchSize, filteredCandles.length));
      const batchFeatures = await this.processBatch(batch, filteredCandles.slice(0, i + batchSize));
      features.push(...batchFeatures);

      this.emit('batch:processed', {
        processed: i + batch.length,
        total: filteredCandles.length,
        progress: ((i + batch.length) / filteredCandles.length) * 100
      });
    }

    const featureNames = Object.keys(features[0] || {});
    
    return {
      features,
      metadata: {
        symbols: [...new Set(filteredCandles.map(c => c.symbol))],
        startDate,
        endDate,
        featureNames,
        shape: [features.length, featureNames.length],
        size: features.length
      }
    };
  }

  /**
   * Process a batch of candles to generate features
   */
  private async processBatch(
    batch: Candle[],
    historicalData: Candle[]
  ): Promise<FeatureVector[]> {
    const features: FeatureVector[] = [];

    for (let i = 0; i < batch.length; i++) {
      const candle = batch[i];
      const lookback = Math.min(i + historicalData.length - batch.length, 200);
      const history = historicalData.slice(
        Math.max(0, i + historicalData.length - batch.length - lookback),
        i + historicalData.length - batch.length + 1
      );

      if (history.length >= 20) { // Minimum history required
        const feature = await this.computeFullFeatures(candle, history);
        features.push(feature);
      }
    }

    return features;
  }

  /**
   * Compute full feature set including technical indicators
   */
  private async computeFullFeatures(
    currentCandle: Candle,
    history: Candle[]
  ): Promise<FeatureVector> {
    const features: FeatureVector = this.computeRealTimeFeatures(currentCandle);

    // Technical indicators
    const indicators = this.computeTechnicalIndicators(history);
    Object.assign(features, indicators);

    // Price patterns
    const patterns = this.detectPricePatterns(history);
    Object.assign(features, patterns);

    // Market regime
    const regime = this.detectMarketRegime(history);
    Object.assign(features, regime);

    // Volatility features
    const volatility = this.computeVolatilityFeatures(history);
    Object.assign(features, volatility);

    // Momentum features
    const momentum = this.computeMomentumFeatures(history);
    Object.assign(features, momentum);

    return features;
  }

  /**
   * Compute technical indicators
   */
  private computeTechnicalIndicators(candles: Candle[]): FeatureVector {
    const features: FeatureVector = {};

    try {
      // Moving averages
      const sma20 = this.indicatorCalculator.calculate('sma', candles, 20) as number[];
      const ema50 = this.indicatorCalculator.calculate('ema', candles, 50) as number[];
      
      features.sma_20 = sma20[sma20.length - 1] || 0;
      features.ema_50 = ema50[ema50.length - 1] || 0;
      features.price_to_sma20 = candles[candles.length - 1].close / features.sma_20;
      features.price_to_ema50 = candles[candles.length - 1].close / features.ema_50;

      // RSI
      const rsi = this.indicatorCalculator.calculate('rsi', candles, 14) as number[];
      features.rsi_14 = rsi[rsi.length - 1] || 50;
      features.rsi_oversold = features.rsi_14 < 30 ? 1 : 0;
      features.rsi_overbought = features.rsi_14 > 70 ? 1 : 0;

      // ATR
      const atr = this.indicatorCalculator.calculate('atr', candles, 14) as number[];
      features.atr_14 = atr[atr.length - 1] || 0;
      features.atr_normalized = features.atr_14 / candles[candles.length - 1].close;

      // Bollinger Bands
      const bb = this.indicatorCalculator.calculate('bb', candles, 20, 2) as any[];
      if (bb.length > 0) {
        const lastBB = bb[bb.length - 1];
        features.bb_upper = lastBB.upper || 0;
        features.bb_lower = lastBB.lower || 0;
        features.bb_middle = lastBB.middle || 0;
        features.bb_width = ((features.bb_upper as number) - (features.bb_lower as number)) / (features.bb_middle as number);
        features.bb_position = (candles[candles.length - 1].close - (features.bb_lower as number)) / 
                              ((features.bb_upper as number) - (features.bb_lower as number));
      }

      // MACD
      const macd = this.indicatorCalculator.calculate('macd', candles, 12, 26, 9) as any[];
      if (macd.length > 0) {
        const lastMACD = macd[macd.length - 1];
        features.macd_line = lastMACD.MACD || 0;
        features.macd_signal = lastMACD.signal || 0;
        features.macd_histogram = lastMACD.histogram || 0;
        features.macd_cross = Math.sign((features.macd_line as number) - (features.macd_signal as number));
      }

      // Volume indicators
      const obv = this.indicatorCalculator.calculate('obv', candles) as number[];
      features.obv = obv[obv.length - 1] || 0;
      features.obv_change = obv.length > 1 ? 
        (obv[obv.length - 1] - obv[obv.length - 2]) / Math.abs(obv[obv.length - 2]) : 0;

    } catch (error) {
      console.error('Error computing technical indicators:', error);
    }

    return features;
  }

  /**
   * Detect price patterns
   */
  private detectPricePatterns(candles: Candle[]): FeatureVector {
    const features: FeatureVector = {};

    if (candles.length < 5) return features;

    // Recent price action
    const recent = candles.slice(-5);
    
    // Trend detection
    features.trend_up = recent.every((c, i) => i === 0 || c.close > recent[i - 1].close) ? 1 : 0;
    features.trend_down = recent.every((c, i) => i === 0 || c.close < recent[i - 1].close) ? 1 : 0;
    
    // Support/Resistance levels
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    features.near_resistance = this.isNearLevel(candles[candles.length - 1].close, highs, 0.01);
    features.near_support = this.isNearLevel(candles[candles.length - 1].close, lows, 0.01);

    // Candlestick patterns
    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];
    
    // Doji
    features.is_doji = Math.abs(lastCandle.close - lastCandle.open) / 
                      (lastCandle.high - lastCandle.low) < 0.1 ? 1 : 0;
    
    // Hammer
    features.is_hammer = this.isHammer(lastCandle) ? 1 : 0;
    
    // Engulfing
    features.bullish_engulfing = this.isBullishEngulfing(prevCandle, lastCandle) ? 1 : 0;
    features.bearish_engulfing = this.isBearishEngulfing(prevCandle, lastCandle) ? 1 : 0;

    return features;
  }

  /**
   * Detect market regime
   */
  private detectMarketRegime(candles: Candle[]): FeatureVector {
    const features: FeatureVector = {};

    // Volatility regime
    const returns = this.calculateReturns(candles);
    const volatility = this.calculateVolatility(returns, 20);
    const avgVolatility = volatility.reduce((a, b) => a + b, 0) / volatility.length;
    
    features.high_volatility = volatility[volatility.length - 1] > avgVolatility * 1.5 ? 1 : 0;
    features.low_volatility = volatility[volatility.length - 1] < avgVolatility * 0.5 ? 1 : 0;

    // Trend regime
    const sma50 = this.indicatorCalculator.calculate('sma', candles, 50) as number[];
    const sma200 = this.indicatorCalculator.calculate('sma', candles, 200) as number[];
    
    if (sma50.length > 0 && sma200.length > 0) {
      features.bullish_regime = sma50[sma50.length - 1] > sma200[sma200.length - 1] ? 1 : 0;
      features.bearish_regime = sma50[sma50.length - 1] < sma200[sma200.length - 1] ? 1 : 0;
    }

    // Volume regime
    const volumes = candles.map(c => c.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    features.high_volume = candles[candles.length - 1].volume > avgVolume * 1.5 ? 1 : 0;
    features.low_volume = candles[candles.length - 1].volume < avgVolume * 0.5 ? 1 : 0;

    return features;
  }

  /**
   * Compute volatility features
   */
  private computeVolatilityFeatures(candles: Candle[]): FeatureVector {
    const features: FeatureVector = {};

    const returns = this.calculateReturns(candles);
    
    // Historical volatility
    features.volatility_20 = this.calculateVolatility(returns, 20)[0] || 0;
    features.volatility_50 = this.calculateVolatility(returns, 50)[0] || 0;
    
    // Parkinson volatility (using high-low)
    features.parkinson_volatility = this.calculateParkinsonVolatility(candles, 20);
    
    // Garman-Klass volatility
    features.gk_volatility = this.calculateGarmanKlassVolatility(candles, 20);

    return features;
  }

  /**
   * Compute momentum features
   */
  private computeMomentumFeatures(candles: Candle[]): FeatureVector {
    const features: FeatureVector = {};

    // Rate of change
    features.roc_10 = this.calculateROC(candles, 10);
    features.roc_20 = this.calculateROC(candles, 20);

    // Momentum
    features.momentum_10 = this.calculateMomentum(candles, 10);
    features.momentum_20 = this.calculateMomentum(candles, 20);

    // Relative strength
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }

    const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
    const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;
    features.relative_strength = avgLoss > 0 ? avgGain / avgLoss : 100;

    return features;
  }

  /**
   * Transform raw features
   */
  transform(
    raw: RawFeatures,
    config: TransformConfig
  ): TransformedFeatures {
    let vector: number[] = [];
    const transformations: string[] = [];

    // Numerical features
    const numericalVector = Object.values(raw.numerical);
    
    // Apply normalization
    if (config.normalization) {
      const normalized = this.normalize(numericalVector, config.normalization);
      vector.push(...normalized);
      transformations.push(`normalization:${config.normalization.method}`);
    } else {
      vector.push(...numericalVector);
    }

    // Categorical encoding
    if (config.encoding && raw.categorical) {
      const encoded = this.encode(raw.categorical, config.encoding);
      vector.push(...encoded);
      transformations.push(`encoding:${config.encoding.method}`);
    }

    // Temporal features
    if (raw.temporal) {
      const temporalFeatures = this.extractTemporalFeatures(raw.temporal);
      vector.push(...temporalFeatures);
      transformations.push('temporal_extraction');
    }

    // Create tensor if needed
    const tensor = tf.tensor1d(vector);

    return {
      vector,
      tensor,
      metadata: {
        originalShape: [Object.keys(raw.numerical).length],
        transformedShape: [vector.length],
        featureNames: [
          ...Object.keys(raw.numerical),
          ...Object.keys(raw.categorical || {}),
          ...Object.keys(raw.temporal || {})
        ],
        transformations
      }
    };
  }

  /**
   * Select features based on importance
   */
  selectFeatures(
    features: FeatureVector,
    importance: FeatureImportance
  ): SelectedFeatures {
    // Sort features by importance
    const sortedFeatures = Object.entries(importance)
      .sort(([, a], [, b]) => b - a);

    // Select top features (e.g., top 80% cumulative importance)
    const totalImportance = sortedFeatures.reduce((sum, [, imp]) => sum + imp, 0);
    let cumulativeImportance = 0;
    const selectedFeatureNames: string[] = [];
    const selectedImportance: FeatureImportance = {};

    for (const [feature, imp] of sortedFeatures) {
      selectedFeatureNames.push(feature);
      selectedImportance[feature] = imp;
      cumulativeImportance += imp;
      
      if (cumulativeImportance / totalImportance > 0.8) {
        break;
      }
    }

    // Extract selected feature values
    const vector = selectedFeatureNames.map(name => {
      const value = features[name];
      return typeof value === 'number' ? value : 0;
    });

    return {
      features: selectedFeatureNames,
      importance: selectedImportance,
      vector
    };
  }

  // Helper methods

  private normalizeVolume(volume: number): number {
    // Simple log normalization
    return Math.log1p(volume);
  }

  private isMarketOpen(timestamp: Date): boolean {
    const hour = timestamp.getUTCHours();
    const day = timestamp.getUTCDay();
    
    // Forex market hours (Sunday 5 PM - Friday 5 PM EST)
    if (day === 0 && hour < 22) return false; // Sunday before 5 PM EST
    if (day === 5 && hour >= 22) return false; // Friday after 5 PM EST
    if (day === 6) return false; // Saturday
    
    return true;
  }

  private isNearLevel(price: number, levels: number[], threshold: number): number {
    return levels.some(level => Math.abs(price - level) / level < threshold) ? 1 : 0;
  }

  private isHammer(candle: Candle): boolean {
    const bodySize = Math.abs(candle.close - candle.open);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    
    return lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5;
  }

  private isBullishEngulfing(prev: Candle, current: Candle): boolean {
    return prev.close < prev.open && // Previous bearish
           current.close > current.open && // Current bullish
           current.open < prev.close && // Current opens below prev close
           current.close > prev.open; // Current closes above prev open
  }

  private isBearishEngulfing(prev: Candle, current: Candle): boolean {
    return prev.close > prev.open && // Previous bullish
           current.close < current.open && // Current bearish
           current.open > prev.close && // Current opens above prev close
           current.close < prev.open; // Current closes below prev open
  }

  private calculateReturns(candles: Candle[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      returns.push((candles[i].close - candles[i - 1].close) / candles[i - 1].close);
    }
    return returns;
  }

  private calculateVolatility(returns: number[], period: number): number[] {
    const volatilities: number[] = [];
    
    for (let i = period - 1; i < returns.length; i++) {
      const periodReturns = returns.slice(i - period + 1, i + 1);
      const mean = periodReturns.reduce((a, b) => a + b, 0) / period;
      const variance = periodReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / period;
      volatilities.push(Math.sqrt(variance) * Math.sqrt(252)); // Annualized
    }
    
    return volatilities;
  }

  private calculateParkinsonVolatility(candles: Candle[], period: number): number {
    let sum = 0;
    const n = Math.min(period, candles.length);
    
    for (let i = candles.length - n; i < candles.length; i++) {
      sum += Math.pow(Math.log(candles[i].high / candles[i].low), 2);
    }
    
    return Math.sqrt(sum / (n * 4 * Math.log(2))) * Math.sqrt(252);
  }

  private calculateGarmanKlassVolatility(candles: Candle[], period: number): number {
    let sum = 0;
    const n = Math.min(period, candles.length);
    
    for (let i = candles.length - n; i < candles.length; i++) {
      const hl = Math.log(candles[i].high / candles[i].low);
      const co = Math.log(candles[i].close / candles[i].open);
      sum += 0.5 * Math.pow(hl, 2) - (2 * Math.log(2) - 1) * Math.pow(co, 2);
    }
    
    return Math.sqrt(sum / n) * Math.sqrt(252);
  }

  private calculateROC(candles: Candle[], period: number): number {
    if (candles.length < period + 1) return 0;
    
    const current = candles[candles.length - 1].close;
    const past = candles[candles.length - period - 1].close;
    
    return ((current - past) / past) * 100;
  }

  private calculateMomentum(candles: Candle[], period: number): number {
    if (candles.length < period + 1) return 0;
    
    const current = candles[candles.length - 1].close;
    const past = candles[candles.length - period - 1].close;
    
    return current - past;
  }

  private normalize(values: number[], config: NormalizationConfig): number[] {
    switch (config.method) {
      case 'minmax':
        return this.minMaxNormalize(values, config.featureRange || [0, 1]);
      case 'zscore':
        return this.zScoreNormalize(values);
      case 'robust':
        return this.robustNormalize(values);
      case 'quantile':
        return this.quantileNormalize(values);
      default:
        return values;
    }
  }

  private minMaxNormalize(values: number[], range: [number, number]): number[] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const [rangeMin, rangeMax] = range;
    
    return values.map(v => {
      if (max === min) return (rangeMin + rangeMax) / 2;
      return rangeMin + ((v - min) / (max - min)) * (rangeMax - rangeMin);
    });
  }

  private zScoreNormalize(values: number[]): number[] {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
    
    return values.map(v => std === 0 ? 0 : (v - mean) / std);
  }

  private robustNormalize(values: number[]): number[] {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const median = sorted[Math.floor(sorted.length * 0.5)];
    
    return values.map(v => iqr === 0 ? 0 : (v - median) / iqr);
  }

  private quantileNormalize(values: number[]): number[] {
    const sorted = [...values].sort((a, b) => a - b);
    const ranks = new Map<number, number>();
    
    values.forEach(v => {
      if (!ranks.has(v)) {
        const index = sorted.indexOf(v);
        ranks.set(v, (index + 0.5) / values.length);
      }
    });
    
    return values.map(v => ranks.get(v) || 0);
  }

  private encode(categorical: Record<string, string>, config: EncodingConfig): number[] {
    const encoded: number[] = [];
    
    for (const [feature, value] of Object.entries(categorical)) {
      if (config.categoricalFeatures.includes(feature)) {
        switch (config.method) {
          case 'onehot':
            // Simplified one-hot encoding
            encoded.push(value === 'true' || value === '1' ? 1 : 0);
            break;
          case 'ordinal':
            // Simplified ordinal encoding
            encoded.push(parseInt(value) || 0);
            break;
          default:
            encoded.push(0);
        }
      }
    }
    
    return encoded;
  }

  private extractTemporalFeatures(temporal: Record<string, Date>): number[] {
    const features: number[] = [];
    
    for (const [, date] of Object.entries(temporal)) {
      features.push(
        date.getHours() / 24,
        date.getDay() / 7,
        date.getDate() / 31,
        date.getMonth() / 12
      );
    }
    
    return features;
  }
}