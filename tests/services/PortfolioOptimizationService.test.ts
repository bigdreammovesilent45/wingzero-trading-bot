import { PortfolioOptimizationService } from '../../src/services/windsurf';

describe('PortfolioOptimizationService', () => {
  let service: PortfolioOptimizationService;

  beforeEach(() => {
    service = new PortfolioOptimizationService();
  });

  describe('initialization', () => {
    it('should create an instance of PortfolioOptimizationService', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(PortfolioOptimizationService);
    });
  });

  describe('optimizePortfolio', () => {
    it('should optimize a simple portfolio', async () => {
      const assets = [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          type: 'stock' as const,
          currentPrice: 150,
          historicalReturns: [0.01, 0.02, -0.01, 0.03, 0.01]
        },
        {
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          type: 'stock' as const,
          currentPrice: 2800,
          historicalReturns: [0.02, 0.01, 0.01, 0.02, 0.02]
        }
      ];

      const constraints = {
        minWeight: 0.1,
        maxWeight: 0.9,
        targetReturn: 0.015,
        longOnly: true
      };

      const objective = {
        type: 'maxSharpe' as const
      };

      const result = await service.optimizePortfolio(
        assets,
        constraints,
        objective
      );

      expect(result).toBeDefined();
      expect(result.assets).toBeDefined();
      expect(result.assets.length).toBe(2);
      expect(result.expectedReturn).toBeGreaterThan(0);
      expect(result.volatility).toBeGreaterThan(0);
      expect(result.sharpeRatio).toBeDefined();
    });
  });

  describe('calculateEfficientFrontier', () => {
    it('should calculate efficient frontier points', async () => {
      // Use more realistic data with more historical returns
      const generateReturns = (mean: number, volatility: number, count: number) => {
        const returns = [];
        for (let i = 0; i < count; i++) {
          returns.push(mean + (Math.random() - 0.5) * volatility);
        }
        return returns;
      };

      const assets = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          type: 'crypto' as const,
          currentPrice: 45000,
          historicalReturns: generateReturns(0.002, 0.04, 100) // 0.2% daily return, 4% volatility
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          type: 'crypto' as const,
          currentPrice: 3000,
          historicalReturns: generateReturns(0.0015, 0.05, 100) // 0.15% daily return, 5% volatility
        },
        {
          symbol: 'USDT',
          name: 'Tether',
          type: 'crypto' as const,
          currentPrice: 1,
          historicalReturns: generateReturns(0.0001, 0.001, 100) // 0.01% daily return, 0.1% volatility
        }
      ];

      const constraints = {
        minWeight: 0,
        maxWeight: 1,
        longOnly: true
      };

      const frontier = await service.calculateEfficientFrontier(assets, constraints, 5);

      expect(frontier).toBeDefined();
      expect(frontier.points).toBeDefined();
      expect(frontier.points.length).toBeGreaterThan(0);
      expect(frontier.minVariance).toBeDefined();
      expect(frontier.maxReturn).toBeDefined();
      expect(frontier.tangency).toBeDefined();
    });
  });

  describe('generateRebalanceRecommendation', () => {
    it('should generate rebalance recommendations', async () => {
      const currentPortfolio = {
        id: 'test-portfolio',
        name: 'Test Portfolio',
        assets: [
          {
            asset: {
              symbol: 'AAPL',
              name: 'Apple Inc.',
              type: 'stock' as const,
              currentPrice: 150,
              historicalReturns: [0.01, 0.02, -0.01, 0.03, 0.01]
            },
            weight: 0.35,
            quantity: 100,
            value: 15000,
            contribution: { return: 0.01, risk: 0.02 }
          },
          {
            asset: {
              symbol: 'GOOGL',
              name: 'Alphabet Inc.',
              type: 'stock' as const,
              currentPrice: 2800,
              historicalReturns: [0.02, 0.01, 0.01, 0.02, 0.02]
            },
            weight: 0.65,
            quantity: 10,
            value: 28000,
            contribution: { return: 0.015, risk: 0.015 }
          }
        ],
        totalValue: 43000,
        expectedReturn: 0.0125,
        volatility: 0.018,
        sharpeRatio: 0.7,
        diversificationRatio: 1.2,
        metadata: {
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          rebalanceFrequency: 'monthly' as const,
          lastRebalance: new Date('2024-01-01'),
          constraints: { longOnly: true }
        }
      };

      const targetObjective = {
        type: 'maxSharpe' as const
      };

      const recommendation = await service.generateRebalanceRecommendation(
        currentPortfolio,
        targetObjective
      );

      expect(recommendation).toBeDefined();
      expect(recommendation.trades).toBeDefined();
      expect(recommendation.estimatedCosts).toBeDefined();
      expect(recommendation.estimatedCosts.total).toBeDefined();
      expect(recommendation.targetWeights).toBeDefined();
    });
  });
});