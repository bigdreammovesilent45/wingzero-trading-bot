import { AdvancedRiskModelService } from '../../src/services/AdvancedRiskModelService';

describe('AdvancedRiskModelService', () => {
  let service: AdvancedRiskModelService;

  beforeEach(() => {
    service = new AdvancedRiskModelService();
  });

  it('should calculate risk metrics', async () => {
    const returns = Array.from({ length: 1000 }, () => {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return z * 0.02 + 0.0005; // 2% vol, 0.05% mean daily return
    });

    const portfolioValue = 1000000;
    const confidence = 0.95;

    const result = await service.calculateRiskMetrics(returns, portfolioValue, confidence);
    
    expect(result.VaR).toBeLessThanOrEqual(0);
    expect(result.CVaR).toBeLessThanOrEqual(result.VaR);
    expect(result.sharpeRatio).toBeGreaterThan(0);
    expect(result.maxDrawdown).toBeGreaterThan(0);
  });
});