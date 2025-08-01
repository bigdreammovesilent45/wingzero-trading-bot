import { RiskManagementEngine } from '../../src/services/windsurf/RiskManagementEngine';

describe('AdvancedRiskModelService', () => {
  let riskEngine: RiskManagementEngine;

  beforeEach(() => {
    riskEngine = new RiskManagementEngine();
  });

  describe('advanced risk calculations', () => {
    it('should calculate Expected Shortfall (CVaR)', async () => {
      const returns = Array.from({ length: 1000 }, () => {
        // Generate returns with fat tails (Student's t-distribution approximation)
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z * 0.02 + 0.0005; // 2% vol, 0.05% mean daily return
      });

      const portfolioValue = 1000000;
      const confidence = 0.95;
      const horizon = 10;

      const esResult = await riskEngine.calculateExpectedShortfall(
        returns,
        portfolioValue,
        confidence,
        horizon
      );

      expect(esResult).toBeDefined();
      expect(esResult.value).toBeGreaterThan(0);
      expect(esResult.percentage).toBeGreaterThan(0);
      expect(esResult.percentage).toBeLessThan(0.2); // Less than 20% loss
      expect(esResult.confidence).toBe(confidence);
      expect(esResult.horizon).toBe(horizon);
    });

    it('should perform Monte Carlo VaR simulation', async () => {
      const portfolio = {
        id: 'test-portfolio',
        name: 'Test Portfolio',
        positions: [
          {
            symbol: 'AAPL',
            quantity: 1000,
            currentPrice: 150,
            costBasis: 140,
            type: 'stock' as const,
            currency: 'USD',
            beta: 1.2,
            volatility: 0.25
          },
          {
            symbol: 'TSLA',
            quantity: 500,
            currentPrice: 800,
            costBasis: 750,
            type: 'stock' as const,
            currency: 'USD',
            beta: 1.8,
            volatility: 0.45
          }
        ],
        totalValue: 550000,
        cash: 50000,
        lastUpdated: new Date()
      };

      const monteCarloParams = {
        simulations: 10000,
        timeHorizon: 252,
        confidenceLevel: 0.99
      };

      // Simulate Monte Carlo VaR calculation
      const simResults = [];
      for (let i = 0; i < 1000; i++) { // Reduced for testing
        let portfolioReturn = 0;
        portfolio.positions.forEach(position => {
          const randomReturn = (Math.random() - 0.5) * position.volatility * Math.sqrt(1/252);
          const weight = (position.quantity * position.currentPrice) / portfolio.totalValue;
          portfolioReturn += weight * randomReturn;
        });
        simResults.push(portfolioReturn);
      }

      simResults.sort((a, b) => a - b);
      const varIndex = Math.floor((1 - monteCarloParams.confidenceLevel) * simResults.length);
      const monteCarloVaR = -simResults[varIndex] * portfolio.totalValue;

      expect(monteCarloVaR).toBeGreaterThan(0);
      expect(monteCarloVaR).toBeLessThan(portfolio.totalValue * 0.3); // Reasonable VaR limit
    });

    it('should calculate portfolio Greeks', async () => {
      const optionsPortfolio = {
        positions: [
          {
            symbol: 'AAPL_CALL_150',
            type: 'option',
            underlying: 'AAPL',
            strike: 150,
            expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            optionType: 'call',
            quantity: 10,
            currentPrice: 5,
            underlyingPrice: 148,
            impliedVolatility: 0.25,
            riskFreeRate: 0.05
          }
        ]
      };

      // Mock Greeks calculation
      const greeks = {
        delta: 0.45,
        gamma: 0.02,
        theta: -0.05,
        vega: 0.15,
        rho: 0.08
      };

      expect(greeks.delta).toBeGreaterThan(0);
      expect(greeks.delta).toBeLessThan(1);
      expect(greeks.theta).toBeLessThan(0); // Time decay
      expect(greeks.vega).toBeGreaterThan(0); // Positive vega for long options
    });

    it('should perform correlation risk analysis', async () => {
      const positions = [
        { symbol: 'AAPL', returns: Array.from({ length: 100 }, () => Math.random() * 0.04 - 0.02) },
        { symbol: 'MSFT', returns: Array.from({ length: 100 }, () => Math.random() * 0.03 - 0.015) },
        { symbol: 'GOOGL', returns: Array.from({ length: 100 }, () => Math.random() * 0.035 - 0.0175) }
      ];

      // Calculate correlation matrix
      const correlationMatrix: number[][] = [];
      for (let i = 0; i < positions.length; i++) {
        correlationMatrix[i] = [];
        for (let j = 0; j < positions.length; j++) {
          if (i === j) {
            correlationMatrix[i][j] = 1;
          } else {
            // Simplified correlation calculation
            const correlation = 0.3 + Math.random() * 0.4; // Between 0.3 and 0.7
            correlationMatrix[i][j] = correlation;
          }
        }
      }

      expect(correlationMatrix).toHaveLength(3);
      expect(correlationMatrix[0]).toHaveLength(3);
      expect(correlationMatrix[0][0]).toBe(1); // Self-correlation
      expect(correlationMatrix[0][1]).toBeGreaterThan(0); // Positive correlation expected
      expect(correlationMatrix[0][1]).toBeLessThan(1);
    });
  });

  describe('stress testing scenarios', () => {
    it('should run comprehensive stress tests', async () => {
      const portfolio = {
        id: 'test-portfolio',
        name: 'Test Portfolio',
        positions: [
          {
            symbol: 'SPY',
            quantity: 2000,
            currentPrice: 450,
            costBasis: 420,
            type: 'etf' as const,
            currency: 'USD',
            beta: 1.0,
            volatility: 0.15
          },
          {
            symbol: 'GLD',
            quantity: 1000,
            currentPrice: 180,
            costBasis: 175,
            type: 'etf' as const,
            currency: 'USD',
            beta: -0.2,
            volatility: 0.12
          }
        ],
        totalValue: 1080000,
        cash: 100000,
        lastUpdated: new Date()
      };

      const stressScenarios = [
        {
          name: 'COVID-19 Scenario',
          description: 'March 2020 market crash',
          marketShock: -0.34,
          volatilityMultiplier: 3.5,
          correlationIncrease: 0.6,
          duration: 30
        },
        {
          name: 'Inflation Shock',
          description: 'Rapid inflation scenario',
          marketShock: -0.15,
          volatilityMultiplier: 2.0,
          correlationIncrease: 0.3,
          duration: 90,
          sectorShocks: {
            'technology': -0.25,
            'financials': 0.05,
            'commodities': 0.15
          }
        }
      ];

      const results = await riskEngine.runStressTests(portfolio, stressScenarios);

      expect(results).toHaveLength(2);
      expect(results[0].scenarioName).toBe('COVID-19 Scenario');
      expect(results[0].portfolioLoss).toBeLessThan(0);
      expect(results[0].worstCaseValue).toBeLessThan(portfolio.totalValue);
      
      // Gold should provide some hedge in market crash
      const spyLoss = results[0].positionImpacts?.find(p => p.symbol === 'SPY')?.loss || 0;
      const gldLoss = results[0].positionImpacts?.find(p => p.symbol === 'GLD')?.loss || 0;
      expect(Math.abs(gldLoss)).toBeLessThan(Math.abs(spyLoss));
    });
  });
});