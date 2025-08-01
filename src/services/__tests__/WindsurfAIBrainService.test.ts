import { WindsurfAIBrainService, MarketSignal, MarketRegime } from '../WindsurfAIBrainService';

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  sequential: jest.fn(() => ({
    compile: jest.fn(),
    predict: jest.fn(() => ({
      array: jest.fn(() => Promise.resolve([[0.7, 0.2, 0.1]])),
      dispose: jest.fn()
    })),
    fit: jest.fn(() => Promise.resolve({
      history: {
        acc: [0.6, 0.65, 0.7, 0.72],
        loss: [0.5, 0.4, 0.3, 0.25]
      }
    })),
    dispose: jest.fn()
  })),
  layers: {
    dense: jest.fn(() => ({})),
    dropout: jest.fn(() => ({}))
  },
  train: {
    adam: jest.fn()
  },
  tensor2d: jest.fn(() => ({
    dispose: jest.fn()
  }))
}));

// Mock market data types
interface MarketData {
  symbol: string;
  price: number;
  volume?: number;
  avgVolume?: number;
  indicators: {
    rsi?: number;
    macd?: {
      value: number;
      signal: number;
      histogram: number;
    };
    bb?: {
      upper: number;
      middle: number;
      lower: number;
    };
    ema20?: number;
    ema50?: number;
    atr?: number;
    adx?: number;
    stochK?: number;
    stochD?: number;
    obv?: number;
    vwap?: number;
  };
}

describe('WindsurfAIBrainService', () => {
  let aiService: WindsurfAIBrainService;

  beforeEach(async () => {
    // Get fresh instance
    (WindsurfAIBrainService as any).instance = null;
    aiService = WindsurfAIBrainService.getInstance();
    
    // Wait for model initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    await aiService.dispose();
  });

  describe('Service Initialization', () => {
    it('should initialize AI model successfully', () => {
      expect(aiService.isReady()).toBe(true);
      expect(aiService.getModelMetrics()).toBeDefined();
      expect(aiService.getModelMetrics()?.accuracy).toBeGreaterThan(0);
    });

    it('should emit modelLoaded event', (done) => {
      const newService = WindsurfAIBrainService.getInstance();
      newService.on('modelLoaded', () => {
        expect(newService.isReady()).toBe(true);
        done();
      });
    });
  });

  describe('Market Analysis with Real Data', () => {
    it('should analyze bullish EUR/USD scenario', async () => {
      const bullishEURUSD: MarketData[] = [{
        symbol: 'EUR/USD',
        price: 1.0850,
        volume: 125000000,
        avgVolume: 100000000,
        indicators: {
          rsi: 65,
          macd: {
            value: 0.0012,
            signal: 0.0008,
            histogram: 0.0004
          },
          bb: {
            upper: 1.0880,
            middle: 1.0840,
            lower: 1.0800
          },
          ema20: 1.0830,
          ema50: 1.0810,
          atr: 0.0040,
          adx: 35,
          stochK: 75,
          stochD: 70,
          obv: 500000,
          vwap: 1.0845
        }
      }];

      const signals = await aiService.analyzeMarket(bullishEURUSD);
      
      expect(signals).toHaveLength(1);
      expect(signals[0].symbol).toBe('EUR/USD');
      expect(signals[0].action).toBe('BUY');
      expect(signals[0].confidence).toBeGreaterThan(0.65);
      expect(signals[0].reasoning).toContain('MACD bullish crossover');
      expect(signals[0].reasoning).toContain('Short-term trend bullish (EMA20 > EMA50)');
    });

    it('should analyze bearish BTC/USD scenario', async () => {
      const bearishBTC: MarketData[] = [{
        symbol: 'BTC/USD',
        price: 42500,
        volume: 2500000000,
        avgVolume: 2000000000,
        indicators: {
          rsi: 25,
          macd: {
            value: -150,
            signal: -100,
            histogram: -50
          },
          bb: {
            upper: 44000,
            middle: 43000,
            lower: 42000
          },
          ema20: 43200,
          ema50: 43800,
          atr: 800,
          adx: 40,
          stochK: 15,
          stochD: 20,
          obv: -1000000,
          vwap: 42800
        }
      }];

      // Mock bearish prediction
      const tf = require('@tensorflow/tfjs');
      tf.sequential().predict.mockReturnValueOnce({
        array: jest.fn(() => Promise.resolve([[0.1, 0.8, 0.1]])),
        dispose: jest.fn()
      });

      const signals = await aiService.analyzeMarket(bearishBTC);
      
      expect(signals).toHaveLength(1);
      expect(signals[0].action).toBe('SELL');
      expect(signals[0].reasoning).toContain('RSI oversold at 25.0');
      expect(signals[0].reasoning).toContain('MACD bearish crossover');
      expect(signals[0].reasoning).toContain('Short-term trend bearish (EMA20 < EMA50)');
    });

    it('should analyze ranging market scenario', async () => {
      const rangingMarket: MarketData[] = [
        {
          symbol: 'GBP/USD',
          price: 1.2650,
          volume: 80000000,
          avgVolume: 85000000,
          indicators: {
            rsi: 50,
            macd: {
              value: 0.0001,
              signal: 0.0001,
              histogram: 0
            },
            bb: {
              upper: 1.2680,
              middle: 1.2650,
              lower: 1.2620
            },
            ema20: 1.2648,
            ema50: 1.2652,
            atr: 0.0030,
            adx: 15,
            stochK: 50,
            stochD: 50,
            obv: 0,
            vwap: 1.2650
          }
        },
        {
          symbol: 'USD/JPY',
          price: 148.50,
          volume: 90000000,
          avgVolume: 95000000,
          indicators: {
            rsi: 48,
            macd: {
              value: 0.02,
              signal: 0.02,
              histogram: 0
            },
            bb: {
              upper: 149.00,
              middle: 148.50,
              lower: 148.00
            },
            ema20: 148.48,
            ema50: 148.52,
            atr: 0.40,
            adx: 12,
            stochK: 45,
            stochD: 48,
            obv: -50000,
            vwap: 148.50
          }
        }
      ];

      // Mock HOLD predictions
      const tf = require('@tensorflow/tfjs');
      tf.sequential().predict
        .mockReturnValueOnce({
          array: jest.fn(() => Promise.resolve([[0.3, 0.3, 0.4]])),
          dispose: jest.fn()
        })
        .mockReturnValueOnce({
          array: jest.fn(() => Promise.resolve([[0.35, 0.35, 0.3]])),
          dispose: jest.fn()
        });

      const signals = await aiService.analyzeMarket(rangingMarket);
      
      // Signals might be filtered out due to low confidence
      const regime = aiService.getMarketRegime();
      expect(regime?.type).toBe('RANGING');
      expect(regime?.direction).toBe('NEUTRAL');
    });

    it('should handle volatile crypto market', async () => {
      const volatileCrypto: MarketData[] = [
        {
          symbol: 'ETH/USD',
          price: 2250,
          volume: 15000000000,
          avgVolume: 10000000000,
          indicators: {
            rsi: 75,
            macd: {
              value: 25,
              signal: 15,
              histogram: 10
            },
            bb: {
              upper: 2400,
              middle: 2200,
              lower: 2000
            },
            ema20: 2180,
            ema50: 2050,
            atr: 120,
            adx: 45,
            stochK: 85,
            stochD: 80,
            obv: 2000000,
            vwap: 2230
          }
        },
        {
          symbol: 'SOL/USD',
          price: 95,
          volume: 3000000000,
          avgVolume: 2000000000,
          indicators: {
            rsi: 20,
            macd: {
              value: -2,
              signal: -1,
              histogram: -1
            },
            bb: {
              upper: 105,
              middle: 95,
              lower: 85
            },
            ema20: 98,
            ema50: 102,
            atr: 8,
            adx: 50,
            stochK: 10,
            stochD: 15,
            obv: -500000,
            vwap: 96
          }
        }
      ];

      // Mock mixed predictions for volatility
      const tf = require('@tensorflow/tfjs');
      tf.sequential().predict
        .mockReturnValueOnce({
          array: jest.fn(() => Promise.resolve([[0.85, 0.1, 0.05]])),
          dispose: jest.fn()
        })
        .mockReturnValueOnce({
          array: jest.fn(() => Promise.resolve([[0.05, 0.9, 0.05]])),
          dispose: jest.fn()
        });

      const signals = await aiService.analyzeMarket(volatileCrypto);
      
      expect(signals).toHaveLength(2);
      expect(signals[0].action).toBe('BUY');
      expect(signals[0].reasoning).toContain('RSI overbought at 75.0');
      expect(signals[1].action).toBe('SELL');
      expect(signals[1].reasoning).toContain('RSI oversold at 20.0');
      
      const regime = aiService.getMarketRegime();
      expect(regime?.volatility).toBeGreaterThan(0.5);
    });
  });

  describe('Price Prediction', () => {
    it('should predict price for trending market', async () => {
      const trendingData: MarketData = {
        symbol: 'AAPL',
        price: 175.50,
        volume: 75000000,
        avgVolume: 65000000,
        indicators: {
          rsi: 62,
          macd: {
            value: 1.5,
            signal: 1.2,
            histogram: 0.3
          },
          bb: {
            upper: 178,
            middle: 175,
            lower: 172
          },
          ema20: 174,
          ema50: 170,
          atr: 2.5,
          adx: 30,
          stochK: 70,
          stochD: 65,
          obv: 1500000,
          vwap: 175.25
        }
      };

      const prediction = await aiService.predictPrice('AAPL', trendingData, '1H');
      
      expect(prediction.symbol).toBe('AAPL');
      expect(prediction.currentPrice).toBe(175.50);
      expect(prediction.predictedPrice).toBeGreaterThan(175.50); // Bullish prediction
      expect(prediction.confidence).toBeGreaterThan(0.6);
      expect(prediction.supportLevels).toHaveLength(3);
      expect(prediction.resistanceLevels).toHaveLength(3);
      expect(prediction.timeHorizon).toBe('1H');
    });

    it('should predict different time horizons', async () => {
      const marketData: MarketData = {
        symbol: 'EUR/USD',
        price: 1.0850,
        indicators: {
          rsi: 55,
          atr: 0.0040,
          ema20: 1.0840,
          ema50: 1.0830
        }
      };

      const prediction5M = await aiService.predictPrice('EUR/USD', marketData, '5M');
      const prediction1H = await aiService.predictPrice('EUR/USD', marketData, '1H');
      const prediction1D = await aiService.predictPrice('EUR/USD', marketData, '1D');
      
      // Price change should increase with time horizon
      const change5M = Math.abs(prediction5M.predictedChange);
      const change1H = Math.abs(prediction1H.predictedChange);
      const change1D = Math.abs(prediction1D.predictedChange);
      
      expect(change1H).toBeGreaterThan(change5M);
      expect(change1D).toBeGreaterThan(change1H);
    });
  });

  describe('Market Regime Detection', () => {
    it('should detect trending bullish market', async () => {
      const bullishSignals: MarketSignal[] = [
        { symbol: 'EUR/USD', action: 'BUY', confidence: 0.8, strength: 0.75, reasoning: [], indicators: {}, timestamp: new Date() },
        { symbol: 'GBP/USD', action: 'BUY', confidence: 0.75, strength: 0.7, reasoning: [], indicators: {}, timestamp: new Date() },
        { symbol: 'AUD/USD', action: 'BUY', confidence: 0.85, strength: 0.8, reasoning: [], indicators: {}, timestamp: new Date() },
        { symbol: 'NZD/USD', action: 'HOLD', confidence: 0.7, strength: 0.5, reasoning: [], indicators: {}, timestamp: new Date() }
      ];

      (aiService as any).updateMarketRegime(bullishSignals);
      const regime = aiService.getMarketRegime();
      
      expect(regime?.type).toBe('TRENDING');
      expect(regime?.direction).toBe('BULLISH');
      expect(regime?.confidence).toBeGreaterThan(0.7);
    });

    it('should detect volatile market conditions', async () => {
      const mixedSignals: MarketSignal[] = [
        { symbol: 'BTC/USD', action: 'BUY', confidence: 0.9, strength: 0.95, reasoning: [], indicators: {}, timestamp: new Date() },
        { symbol: 'ETH/USD', action: 'SELL', confidence: 0.85, strength: 0.9, reasoning: [], indicators: {}, timestamp: new Date() },
        { symbol: 'XRP/USD', action: 'BUY', confidence: 0.8, strength: 0.2, reasoning: [], indicators: {}, timestamp: new Date() },
        { symbol: 'LTC/USD', action: 'SELL', confidence: 0.75, strength: 0.1, reasoning: [], indicators: {}, timestamp: new Date() }
      ];

      (aiService as any).updateMarketRegime(mixedSignals);
      const regime = aiService.getMarketRegime();
      
      expect(regime?.type).toBe('VOLATILE');
      expect(regime?.volatility).toBeGreaterThan(0.5);
    });

    it('should detect calm ranging market', async () => {
      const calmSignals: MarketSignal[] = [
        { symbol: 'USD/CHF', action: 'HOLD', confidence: 0.7, strength: 0.5, reasoning: [], indicators: {}, timestamp: new Date() },
        { symbol: 'USD/CAD', action: 'HOLD', confidence: 0.72, strength: 0.52, reasoning: [], indicators: {}, timestamp: new Date() },
        { symbol: 'EUR/CHF', action: 'HOLD', confidence: 0.71, strength: 0.51, reasoning: [], indicators: {}, timestamp: new Date() }
      ];

      (aiService as any).updateMarketRegime(calmSignals);
      const regime = aiService.getMarketRegime();
      
      expect(regime?.type).toBe('CALM');
      expect(regime?.direction).toBe('NEUTRAL');
      expect(regime?.volatility).toBeLessThan(0.3);
    });
  });

  describe('Model Training', () => {
    it('should train model with historical data', async () => {
      const trainingData = {
        features: [
          [0.6, 0.7, 0.65, 0.5, 0.5, 0.55, 0.8, 0.6, 0.58, 0.3, 0.4, 0.7, 0.65, 0.5, 0.6],
          [0.3, 0.2, 0.25, 0.7, 0.7, 0.45, 0.6, 0.4, 0.42, 0.5, 0.6, 0.3, 0.35, 0.7, 0.4],
          [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
        ],
        labels: [
          [1, 0, 0], // BUY
          [0, 1, 0], // SELL
          [0, 0, 1]  // HOLD
        ]
      };

      const progressSpy = jest.fn();
      aiService.on('trainingProgress', progressSpy);

      await aiService.trainModel(trainingData);
      
      expect(progressSpy).toHaveBeenCalled();
      
      const metrics = aiService.getModelMetrics();
      expect(metrics?.accuracy).toBe(0.72);
      expect(metrics?.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Real Trading Scenarios', () => {
    it('should handle forex news event scenario', async () => {
      // Scenario: NFP release causes USD strength
      const postNFPData: MarketData[] = [
        {
          symbol: 'EUR/USD',
          price: 1.0750, // Dropping
          volume: 250000000, // High volume
          avgVolume: 100000000,
          indicators: {
            rsi: 25,
            macd: {
              value: -0.0015,
              signal: -0.0010,
              histogram: -0.0005
            },
            bb: {
              upper: 1.0850,
              middle: 1.0800,
              lower: 1.0750
            },
            ema20: 1.0820,
            ema50: 1.0850,
            atr: 0.0080, // High volatility
            adx: 55,
            stochK: 10,
            stochD: 15,
            obv: -2000000,
            vwap: 1.0780
          }
        }
      ];

      // Mock strong sell signal
      const tf = require('@tensorflow/tfjs');
      tf.sequential().predict.mockReturnValueOnce({
        array: jest.fn(() => Promise.resolve([[0.05, 0.9, 0.05]])),
        dispose: jest.fn()
      });

      const signals = await aiService.analyzeMarket(postNFPData);
      
      expect(signals[0].action).toBe('SELL');
      expect(signals[0].confidence).toBeGreaterThan(0.85);
      expect(signals[0].reasoning).toContain('RSI oversold at 25.0');
      expect(signals[0].reasoning).toContain('High volume (250% of average)');
    });

    it('should handle crypto pump scenario', async () => {
      // Scenario: Altcoin pumping on news
      const pumpingAltcoin: MarketData = {
        symbol: 'DOGE/USD',
        price: 0.15,
        volume: 5000000000,
        avgVolume: 1000000000,
        indicators: {
          rsi: 85,
          macd: {
            value: 0.008,
            signal: 0.004,
            histogram: 0.004
          },
          bb: {
            upper: 0.14,
            middle: 0.12,
            lower: 0.10
          },
          ema20: 0.11,
          ema50: 0.09,
          atr: 0.02,
          adx: 70,
          stochK: 95,
          stochD: 90,
          obv: 10000000,
          vwap: 0.13
        }
      };

      // Mock extreme buy signal
      const tf = require('@tensorflow/tfjs');
      tf.sequential().predict.mockReturnValueOnce({
        array: jest.fn(() => Promise.resolve([[0.95, 0.03, 0.02]])),
        dispose: jest.fn()
      });

      const signals = await aiService.analyzeMarket([pumpingAltcoin]);
      
      expect(signals[0].action).toBe('BUY');
      expect(signals[0].strength).toBeGreaterThan(0.9);
      expect(signals[0].reasoning).toContain('RSI overbought at 85.0');
      expect(signals[0].reasoning).toContain('Price above upper Bollinger Band');
      expect(signals[0].reasoning).toContain('High volume (500% of average)');
    });

    it('should handle stock earnings scenario', async () => {
      // Scenario: Stock gapping up on earnings beat
      const earningsGap: MarketData = {
        symbol: 'TSLA',
        price: 265,
        volume: 120000000,
        avgVolume: 50000000,
        indicators: {
          rsi: 72,
          macd: {
            value: 5,
            signal: 3,
            histogram: 2
          },
          bb: {
            upper: 255,
            middle: 245,
            lower: 235
          },
          ema20: 242,
          ema50: 235,
          atr: 8,
          adx: 45,
          stochK: 88,
          stochD: 82,
          obv: 5000000,
          vwap: 260
        }
      };

      const prediction = await aiService.predictPrice('TSLA', earningsGap, '1D');
      
      expect(prediction.predictedPrice).toBeGreaterThan(265);
      expect(prediction.confidence).toBeGreaterThan(0.7);
      
      // Check resistance levels make sense
      expect(prediction.resistanceLevels[0]).toBeGreaterThan(265);
      expect(prediction.supportLevels[0]).toBeLessThan(265);
    });
  });

  describe('Error Handling', () => {
    it('should handle analysis with no model loaded', async () => {
      await aiService.dispose();
      
      await expect(aiService.analyzeMarket([])).rejects.toThrow('AI model not loaded');
    });

    it('should handle prediction with no model loaded', async () => {
      await aiService.dispose();
      
      const mockData: MarketData = {
        symbol: 'TEST',
        price: 100,
        indicators: {}
      };
      
      await expect(aiService.predictPrice('TEST', mockData)).rejects.toThrow('AI model not loaded');
    });

    it('should handle invalid market data gracefully', async () => {
      const invalidData: MarketData[] = [{
        symbol: 'INVALID',
        price: 0,
        indicators: {}
      }];

      const signals = await aiService.analyzeMarket(invalidData);
      
      // Should still return a signal, even if based on limited data
      expect(signals).toBeDefined();
      expect(signals.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance Metrics', () => {
    it('should track model performance metrics', () => {
      const metrics = aiService.getModelMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics?.accuracy).toBe(0.72);
      expect(metrics?.precision).toBe(0.68);
      expect(metrics?.recall).toBe(0.75);
      expect(metrics?.f1Score).toBe(0.71);
      expect(metrics?.profitFactor).toBe(2.3);
      expect(metrics?.sharpeRatio).toBe(1.85);
      expect(metrics?.lastUpdated).toBeInstanceOf(Date);
    });
  });
});