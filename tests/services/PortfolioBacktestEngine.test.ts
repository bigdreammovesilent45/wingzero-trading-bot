import { PortfolioBacktestEngine } from '@/services';

describe('PortfolioBacktestEngine', () => {
  let engine: PortfolioBacktestEngine;

  beforeEach(() => {
    engine = PortfolioBacktestEngine.getInstance();
  });

  test('should be a singleton', () => {
    const instance1 = PortfolioBacktestEngine.getInstance();
    const instance2 = PortfolioBacktestEngine.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should run backtest with simple buy-and-hold strategy', async () => {
    // Mock market data
    const marketData = {
      AAPL: [
        { date: new Date('2023-01-01'), price: 100 },
        { date: new Date('2023-01-02'), price: 102 },
        { date: new Date('2023-01-03'), price: 98 },
        { date: new Date('2023-01-04'), price: 105 },
        { date: new Date('2023-01-05'), price: 107 }
      ],
      GOOGL: [
        { date: new Date('2023-01-01'), price: 200 },
        { date: new Date('2023-01-02'), price: 205 },
        { date: new Date('2023-01-03'), price: 195 },
        { date: new Date('2023-01-04'), price: 210 },
        { date: new Date('2023-01-05'), price: 215 }
      ]
    };

    // Simple equal-weight strategy
    const strategy = () => ({
      AAPL: 0.5,
      GOOGL: 0.5
    });

    const config = {
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-05'),
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