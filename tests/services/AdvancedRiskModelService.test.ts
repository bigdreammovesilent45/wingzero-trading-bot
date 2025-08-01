import { AdvancedRiskModelService } from '@/services';
import { TestDataService } from '@/services/TestDataService';

describe('AdvancedRiskModelService', () => {
  let service: AdvancedRiskModelService;
  let testDataService: TestDataService;

  beforeEach(() => {
    service = AdvancedRiskModelService.getInstance();
    testDataService = TestDataService.getInstance();
  });

  test('should be a singleton', () => {
    const instance1 = AdvancedRiskModelService.getInstance();
    const instance2 = AdvancedRiskModelService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should calculate risk metrics with real Wing Zero data', async () => {
    // Get real position data and calculate returns
    const realPositions = await testDataService.getRealWingZeroPositions();
    expect(realPositions.length).toBeGreaterThanOrEqual(7);
    
    const portfolioReturns = realPositions.slice(0, 7).map(p => 
      (p.current_price - p.open_price) / p.open_price
    );
    
    // Create benchmark returns (could be market average)
    const benchmarkReturns = portfolioReturns.map(ret => ret * 0.8 + Math.random() * 0.05 - 0.025);

    const metrics = await service.calculateRiskMetrics(portfolioReturns, benchmarkReturns);

    expect(metrics).toHaveProperty('var');
    expect(metrics).toHaveProperty('cvar');
    expect(metrics).toHaveProperty('maxDrawdown');
    expect(metrics).toHaveProperty('sharpeRatio');
    expect(metrics).toHaveProperty('sortinoRatio');
    expect(metrics).toHaveProperty('beta');
    expect(metrics).toHaveProperty('alpha');

    // Check that all metrics are numbers
    expect(typeof metrics.var).toBe('number');
    expect(typeof metrics.cvar).toBe('number');
    expect(typeof metrics.maxDrawdown).toBe('number');
    expect(typeof metrics.sharpeRatio).toBe('number');
    expect(typeof metrics.sortinoRatio).toBe('number');
    expect(typeof metrics.beta).toBe('number');
    expect(typeof metrics.alpha).toBe('number');

    // VaR and CVaR should be positive (representing potential losses)
    expect(metrics.var).toBeGreaterThanOrEqual(0);
    expect(metrics.cvar).toBeGreaterThanOrEqual(0);

    // Max drawdown should be between 0 and 1
    expect(metrics.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(metrics.maxDrawdown).toBeLessThanOrEqual(1);
  });

  test('should update and get config', () => {
    const newConfig = {
      confidenceLevel: 0.99,
      timeHorizon: 5
    };

    service.updateConfig(newConfig);
    const config = service.getConfig();

    expect(config.confidenceLevel).toBe(0.99);
    expect(config.timeHorizon).toBe(5);
    expect(config).toHaveProperty('benchmarkSymbol');
  });
});