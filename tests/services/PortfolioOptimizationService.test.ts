import { PortfolioOptimizationService } from '@/services';

describe('PortfolioOptimizationService', () => {
  let service: PortfolioOptimizationService;

  beforeEach(() => {
    service = PortfolioOptimizationService.getInstance();
  });

  test('should be a singleton', () => {
    const instance1 = PortfolioOptimizationService.getInstance();
    const instance2 = PortfolioOptimizationService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should optimize portfolio with equal weights by default', async () => {
    const symbols = ['AAPL', 'GOOGL', 'MSFT'];
    const returns = [
      [0.01, 0.02, -0.01, 0.03], // AAPL returns
      [0.02, -0.01, 0.04, 0.01], // GOOGL returns
      [0.015, 0.01, 0.02, -0.005] // MSFT returns
    ];

    const result = await service.optimizePortfolio(symbols, returns);

    expect(result).toHaveProperty('weights');
    expect(result).toHaveProperty('expectedReturn');
    expect(result).toHaveProperty('risk');
    expect(result).toHaveProperty('sharpeRatio');

    // Check equal weights
    expect(result.weights.AAPL).toBeCloseTo(1/3, 2);
    expect(result.weights.GOOGL).toBeCloseTo(1/3, 2);
    expect(result.weights.MSFT).toBeCloseTo(1/3, 2);

    // Check that all metrics are numbers
    expect(typeof result.expectedReturn).toBe('number');
    expect(typeof result.risk).toBe('number');
    expect(typeof result.sharpeRatio).toBe('number');
  });

  test('should handle single asset portfolio', async () => {
    const symbols = ['AAPL'];
    const returns = [[0.01, 0.02, -0.01, 0.03]];

    const result = await service.optimizePortfolio(symbols, returns);

    expect(result.weights.AAPL).toBe(1);
    expect(result.expectedReturn).toBeGreaterThan(0);
    expect(result.risk).toBeGreaterThan(0);
  });
});