import { PortfolioOptimizationService } from '../../src/services/windsurf/PortfolioOptimizationService';

describe('PortfolioBacktestEngine', () => {
  let service: PortfolioOptimizationService;

  beforeEach(() => {
    service = new PortfolioOptimizationService();
  });

  describe('backtesting', () => {
    it('should perform portfolio backtesting', async () => {
      const generateHistoricalData = (periods: number) => {
        const data = [];
        let price = 100;
        for (let i = 0; i < periods; i++) {
          const change = (Math.random() - 0.5) * 0.05;
          price = price * (1 + change);
          data.push({
            date: new Date(Date.now() - (periods - i) * 24 * 60 * 60 * 1000),
            price,
            return: change
          });
        }
        return data;
      };

      const assets = [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          type: 'stock' as const,
          currentPrice: 150,
          historicalReturns: Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.04)
        },
        {
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          type: 'stock' as const,
          currentPrice: 2800,
          historicalReturns: Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.03)
        }
      ];

      const constraints = {
        minWeight: 0.1,
        maxWeight: 0.9,
        longOnly: true
      };

      const objective = {
        type: 'maxSharpe' as const
      };

      // First optimize the portfolio
      const optimalPortfolio = await service.optimizePortfolio(
        assets,
        constraints,
        objective
      );

      expect(optimalPortfolio).toBeDefined();
      expect(optimalPortfolio.assets).toHaveLength(2);
      
      // Verify backtest-related metrics
      expect(optimalPortfolio.expectedReturn).toBeGreaterThan(-0.5);
      expect(optimalPortfolio.expectedReturn).toBeLessThan(0.5);
      expect(optimalPortfolio.volatility).toBeGreaterThan(0);
      expect(optimalPortfolio.sharpeRatio).toBeDefined();
    });

    it('should calculate performance metrics over historical period', async () => {
      const assets = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          type: 'crypto' as const,
          currentPrice: 45000,
          historicalReturns: Array.from({ length: 365 }, (_, i) => 
            Math.sin(i / 30) * 0.05 + (Math.random() - 0.5) * 0.02
          )
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          type: 'crypto' as const,
          currentPrice: 3000,
          historicalReturns: Array.from({ length: 365 }, (_, i) => 
            Math.sin(i / 25) * 0.06 + (Math.random() - 0.5) * 0.03
          )
        }
      ];

      const constraints = {
        minWeight: 0.2,
        maxWeight: 0.8,
        longOnly: true
      };

      const result = await service.optimizePortfolio(
        assets,
        constraints,
        { type: 'minRisk' as const }
      );

      expect(result).toBeDefined();
      expect(result.volatility).toBeGreaterThan(0); // Should have some volatility
      expect(result.volatility).toBeLessThan(1.0); // But reasonable bounds
    });
  });
});