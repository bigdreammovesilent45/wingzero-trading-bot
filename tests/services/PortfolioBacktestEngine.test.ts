import { PortfolioBacktestEngine } from '@/services';
import { TestDataService } from '@/services/TestDataService';

describe('PortfolioBacktestEngine', () => {
  let engine: PortfolioBacktestEngine;
  let testDataService: TestDataService;

  beforeEach(() => {
    engine = PortfolioBacktestEngine.getInstance();
    testDataService = TestDataService.getInstance();
  });

  test('should be a singleton', () => {
    const instance1 = PortfolioBacktestEngine.getInstance();
    const instance2 = PortfolioBacktestEngine.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should run backtest with real Wing Zero market data', async () => {
    // Get real position data from Wing Zero
    const realPositions = await testDataService.getRealWingZeroPositions();
    const marketData = testDataService.getRealMarketData(realPositions);
    
    expect(realPositions.length).toBeGreaterThan(0);
    expect(Object.keys(marketData).length).toBeGreaterThan(0);

    // Create strategy based on real symbols from data
    const symbols = Object.keys(marketData);
    const equalWeight = 1 / symbols.length;
    const strategy = () => {
      const weights: { [key: string]: number } = {};
      symbols.forEach(symbol => {
        weights[symbol] = equalWeight;
      });
      return weights;
    };

    // Use real date range from position data
    const dates = realPositions.map(p => new Date(p.opened_at)).sort();
    const config = {
      startDate: dates[0] || new Date('2024-01-01'),
      endDate: dates[dates.length - 1] || new Date(),
      initialCapital: 10000,
      rebalanceFrequency: 'daily' as const,
      transactionCosts: 0.001,
      slippage: 0.001
    };

    const result = await engine.runBacktest(strategy, marketData, config);

    expect(result).toHaveProperty('totalReturn');
    expect(result).toHaveProperty('annualizedReturn');
    expect(result).toHaveProperty('volatility');
    expect(result).toHaveProperty('sharpeRatio');
    expect(result).toHaveProperty('maxDrawdown');
    expect(result).toHaveProperty('trades');
    expect(result).toHaveProperty('equity');
    expect(result).toHaveProperty('performance');

    // Check that all metrics are numbers
    expect(typeof result.totalReturn).toBe('number');
    expect(typeof result.annualizedReturn).toBe('number');
    expect(typeof result.volatility).toBe('number');
    expect(typeof result.sharpeRatio).toBe('number');
    expect(typeof result.maxDrawdown).toBe('number');

    // Check arrays
    expect(Array.isArray(result.trades)).toBe(true);
    expect(Array.isArray(result.equity)).toBe(true);

    // Check performance metrics
    expect(result.performance).toHaveProperty('totalTrades');
    expect(result.performance).toHaveProperty('winningTrades');
    expect(result.performance).toHaveProperty('losingTrades');

    // Equity curve should have points for each trading day
    expect(result.equity.length).toBeGreaterThan(0);
    
    // Each equity point should have required properties
    result.equity.forEach(point => {
      expect(point).toHaveProperty('date');
      expect(point).toHaveProperty('portfolioValue');
      expect(point).toHaveProperty('drawdown');
      expect(typeof point.portfolioValue).toBe('number');
      expect(typeof point.drawdown).toBe('number');
    });
  });

  test('should handle empty market data gracefully', async () => {
    const marketData = {};
    const strategy = () => ({});
    
    const config = {
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-05'),
      initialCapital: 10000,
      rebalanceFrequency: 'daily' as const,
      transactionCosts: 0.001,
      slippage: 0.001
    };

    const result = await engine.runBacktest(strategy, marketData, config);

    expect(result.trades.length).toBe(0);
    expect(result.equity.length).toBe(0);
    expect(result.totalReturn).toBe(0);
  });
});