import { PortfolioOptimizationService } from '@/services';
import { TestDataService } from '@/services/TestDataService';

describe('PortfolioOptimizationService', () => {
  let service: PortfolioOptimizationService;
  let testDataService: TestDataService;

  beforeEach(() => {
    service = PortfolioOptimizationService.getInstance();
    testDataService = TestDataService.getInstance();
  });

  test('should be a singleton', () => {
    const instance1 = PortfolioOptimizationService.getInstance();
    const instance2 = PortfolioOptimizationService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should optimize portfolio with real Wing Zero data', async () => {
    // Get real positions and calculate returns
    const realPositions = await testDataService.getRealWingZeroPositions();
    const symbols = [...new Set(realPositions.map(p => p.symbol))];
    const returns = testDataService.getRealPortfolioReturns(realPositions);
    
    expect(symbols.length).toBeGreaterThan(0);
    expect(returns.length).toBeGreaterThan(0);

    const result = await service.optimizePortfolio(symbols, returns);

    expect(result).toHaveProperty('weights');
    expect(result).toHaveProperty('expectedReturn');
    expect(result).toHaveProperty('risk');
    expect(result).toHaveProperty('sharpeRatio');

    // Check that weights sum to 1 and are valid
    const totalWeight = Object.values(result.weights).reduce((sum, weight) => sum + weight, 0);
    expect(totalWeight).toBeCloseTo(1, 2);
    
    // Check that we have weights for all real symbols
    symbols.forEach(symbol => {
      expect(result.weights).toHaveProperty(symbol);
      expect(result.weights[symbol]).toBeGreaterThanOrEqual(0);
    });

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