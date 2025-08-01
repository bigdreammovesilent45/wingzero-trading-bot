import { RiskManagementEngine } from '../../src/services/windsurf';

describe('RiskManagementEngine', () => {
  let engine: RiskManagementEngine;

  beforeEach(() => {
    engine = new RiskManagementEngine();
  });

  describe('initialization', () => {
    it('should create an instance of RiskManagementEngine', () => {
      expect(engine).toBeDefined();
      expect(engine).toBeInstanceOf(RiskManagementEngine);
    });
  });

  describe('calculateRiskMetrics', () => {
    it('should calculate comprehensive risk metrics', async () => {
      const portfolio = {
        id: 'test-portfolio',
        name: 'Test Portfolio',
        positions: [
          {
            symbol: 'AAPL',
            quantity: 100,
            currentPrice: 150,
            costBasis: 140,
            type: 'stock' as const,
            currency: 'USD',
            beta: 1.2,
            volatility: 0.25
          },
          {
            symbol: 'GOOGL',
            quantity: 50,
            currentPrice: 2800,
            costBasis: 2700,
            type: 'stock' as const,
            currency: 'USD',
            beta: 1.1,
            volatility: 0.22
          }
        ],
        totalValue: 155000,
        cash: 10000,
        lastUpdated: new Date()
      };

      const metrics = await engine.calculateRiskMetrics(portfolio);

      expect(metrics).toBeDefined();
      expect(metrics.portfolioVolatility).toBeGreaterThan(0);
      expect(metrics.portfolioBeta).toBeGreaterThan(0);
      expect(metrics.sharpeRatio).toBeDefined();
      expect(metrics.maxDrawdown).toBeDefined();
      expect(metrics.valueAtRisk).toBeDefined();
      expect(metrics.expectedShortfall).toBeDefined();
    });
  });

  describe('calculateVaR', () => {
    it('should calculate Value at Risk using different methods', async () => {
      const returns = Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.04);
      const portfolioValue = 1000000;
      const confidence = 0.95;
      const horizon = 1;

      const parametricVaR = await engine.calculateVaR(
        returns,
        portfolioValue,
        confidence,
        horizon,
        'parametric'
      );

      const historicalVaR = await engine.calculateVaR(
        returns,
        portfolioValue,
        confidence,
        horizon,
        'historical'
      );

      expect(parametricVaR).toBeDefined();
      expect(parametricVaR.value).toBeGreaterThan(0);
      expect(parametricVaR.percentage).toBeGreaterThan(0);
      expect(parametricVaR.confidence).toBe(confidence);

      expect(historicalVaR).toBeDefined();
      expect(historicalVaR.value).toBeGreaterThan(0);
    });
  });

  describe('runStressTests', () => {
    it('should run stress tests on portfolio', async () => {
      const portfolio = {
        id: 'test-portfolio',
        name: 'Test Portfolio',
        positions: [
          {
            symbol: 'SPY',
            quantity: 1000,
            currentPrice: 450,
            costBasis: 420,
            type: 'etf' as const,
            currency: 'USD',
            beta: 1.0,
            volatility: 0.15
          }
        ],
        totalValue: 450000,
        cash: 50000,
        lastUpdated: new Date()
      };

      const scenarios = [
        {
          name: 'Market Crash',
          description: '2008-style financial crisis',
          marketShock: -0.35,
          volatilityMultiplier: 2.5,
          correlationIncrease: 0.3,
          duration: 30
        },
        {
          name: 'Flash Crash',
          description: 'Sudden market drop',
          marketShock: -0.10,
          volatilityMultiplier: 3.0,
          correlationIncrease: 0.5,
          duration: 1
        }
      ];

      const results = await engine.runStressTests(portfolio, scenarios);

      expect(results).toBeDefined();
      expect(results.length).toBe(scenarios.length);
      expect(results[0].scenarioName).toBe('Market Crash');
      expect(results[0].portfolioLoss).toBeLessThan(0);
      expect(results[0].worstCaseValue).toBeLessThan(portfolio.totalValue);
    });
  });
});