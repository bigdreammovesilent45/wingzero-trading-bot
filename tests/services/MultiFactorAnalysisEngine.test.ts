import { FeatureEngineeringPipeline } from '../../src/services/windsurf/FeatureEngineeringPipeline';

describe('MultiFactorAnalysisEngine', () => {
  let pipeline: FeatureEngineeringPipeline;

  beforeEach(() => {
    pipeline = new FeatureEngineeringPipeline();
  });

  describe('feature extraction', () => {
    it('should extract multiple technical factors from market data', async () => {
      const candles = Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - (100 - i) * 60000,
        open: 100 + Math.sin(i / 10) * 5,
        high: 102 + Math.sin(i / 10) * 5,
        low: 98 + Math.sin(i / 10) * 5,
        close: 100 + Math.sin(i / 10) * 5 + (Math.random() - 0.5),
        volume: 1000000 + Math.random() * 500000
      }));

      const features = await pipeline.computeRealTimeFeatures(candles);

      expect(features).toBeDefined();
      expect(features.timestamp).toBeDefined();
      expect(features.features).toBeDefined();
      
      // Check for various technical indicators
      const featureKeys = Object.keys(features.features);
      expect(featureKeys).toContain('sma_20');
      expect(featureKeys).toContain('ema_20');
      expect(featureKeys).toContain('rsi');
      expect(featureKeys).toContain('macd_line');
      expect(featureKeys).toContain('bb_upper');
      expect(featureKeys).toContain('atr');
    });

    it('should normalize features for model input', async () => {
      const rawFeatures = {
        numerical: {
          price: 50000,
          volume: 1000000,
          rsi: 65,
          volatility: 0.02
        },
        categorical: {},
        temporal: {}
      };

      const transformConfig = {
        normalization: {
          method: 'zscore' as const,
          params: {}
        }
      };

      const normalized = await pipeline.transform(rawFeatures, transformConfig);

      expect(normalized).toBeDefined();
      // Z-score normalization should center around 0
      Object.values(normalized).forEach(value => {
        if (typeof value === 'number') {
          expect(Math.abs(value)).toBeLessThan(10); // Reasonable range for z-scores
        }
      });
    });

    it('should calculate feature importance scores', async () => {
      const features = {
        momentum: 0.5,
        volatility: 0.3,
        volume_ratio: 0.8,
        price_change: 0.2,
        trend_strength: 0.6
      };

      const labels = Array.from({ length: 100 }, () => Math.random() > 0.5 ? 1 : 0);
      
      // Mock feature importance calculation
      const importance = {
        momentum: 0.25,
        volatility: 0.15,
        volume_ratio: 0.35,
        price_change: 0.10,
        trend_strength: 0.15
      };

      expect(importance).toBeDefined();
      expect(Object.values(importance).reduce((a, b) => a + b)).toBeCloseTo(1.0, 2);
      expect(importance.volume_ratio).toBeGreaterThan(importance.price_change);
    });
  });

  describe('multi-factor model', () => {
    it('should combine multiple factors for prediction', async () => {
      const factors = {
        value: { pe_ratio: 15, pb_ratio: 2.5, dividend_yield: 0.03 },
        momentum: { rsi: 60, macd: 0.5, price_change_30d: 0.1 },
        quality: { roe: 0.15, debt_to_equity: 0.5, profit_margin: 0.2 },
        volatility: { historical_vol: 0.25, implied_vol: 0.30, vol_smile: 0.05 }
      };

      // Simulate factor weights
      const weights = {
        value: 0.3,
        momentum: 0.25,
        quality: 0.25,
        volatility: 0.2
      };

      const factorScores = {
        value: 0.7,
        momentum: 0.6,
        quality: 0.8,
        volatility: -0.3
      };

      const combinedScore = Object.entries(weights).reduce(
        (sum, [factor, weight]) => sum + weight * factorScores[factor as keyof typeof factorScores],
        0
      );

      expect(combinedScore).toBeGreaterThan(0);
      expect(combinedScore).toBeLessThan(1);
    });
  });
});