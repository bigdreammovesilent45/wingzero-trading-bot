import { PortfolioOptimizationService } from '../../src/services/windsurf/PortfolioOptimizationService';

describe('PortfolioOptimizationService', () => {
  let service: PortfolioOptimizationService;

  beforeEach(() => {
    service = new PortfolioOptimizationService();
  });

  it('should optimize portfolio', async () => {
    const portfolio = {
      assets: [
        {
          symbol: 'AAPL',
          weight: 0.5,
          expectedReturn: 0.12,
          volatility: 0.25,
          correlation: { MSFT: 0.7 }
        },
        {
          symbol: 'MSFT',
          weight: 0.5,
          expectedReturn: 0.15,
          volatility: 0.22,
          correlation: { AAPL: 0.7 }
        }
      ],
      weights: { AAPL: 0.5, MSFT: 0.5 },
      totalValue: 100000
    };

    const constraints = {
      minWeight: 0,
      maxWeight: 1,
      targetReturn: 0.10,
      longOnly: true
    };

    const objective = {
      type: 'minRisk' as const
    };

    // Create proper assets array with more stable returns
    const assets = [
      {
        symbol: 'AAPL',
        name: 'Apple',
        type: 'stock' as const,
        currentPrice: 150,
        historicalReturns: Array.from({ length: 252 }, (_, i) => 
          0.0005 + 0.01 * Math.sin(i / 10) + 0.005 * (Math.random() - 0.5)
        )
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft',
        type: 'stock' as const,
        currentPrice: 300,
        historicalReturns: Array.from({ length: 252 }, (_, i) => 
          0.0004 + 0.008 * Math.sin(i / 12) + 0.004 * (Math.random() - 0.5)
        )
      }
    ];

    const result = await service.optimizePortfolio(assets, constraints, objective);
    expect(result).toBeDefined();
    expect(result.assets).toBeDefined();
    expect(result.expectedReturn).toBeDefined();
    expect(result.volatility).toBeDefined();
  });
});