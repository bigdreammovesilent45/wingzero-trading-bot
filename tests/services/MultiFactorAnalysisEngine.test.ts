import { MultiFactorAnalysisEngine } from '@/services';

describe('MultiFactorAnalysisEngine', () => {
  let engine: MultiFactorAnalysisEngine;

  beforeEach(() => {
    engine = MultiFactorAnalysisEngine.getInstance();
  });

  test('should be a singleton', () => {
    const instance1 = MultiFactorAnalysisEngine.getInstance();
    const instance2 = MultiFactorAnalysisEngine.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should have default factor models', () => {
    const models = engine.getAvailableModels();
    
    expect(models.length).toBeGreaterThan(0);
    expect(models.some(m => m.id === 'fama_french_3')).toBe(true);
    expect(models.some(m => m.id === 'carhart_4')).toBe(true);
  });

  test('should analyze factor exposure', async () => {
    const assetReturns = [0.01, 0.02, -0.01, 0.03, -0.005];
    const factorReturns = {
      market: [0.008, 0.015, -0.008, 0.025, -0.003],
      smb: [0.002, -0.001, 0.003, 0.001, 0.002],
      hml: [0.001, 0.002, -0.001, 0.002, 0.001]
    };

    const result = await engine.analyzeFactorExposure(assetReturns, factorReturns);

    expect(result).toHaveProperty('factorExposures');
    expect(result).toHaveProperty('factorContributions');
    expect(result).toHaveProperty('idiosyncraticRisk');
    expect(result).toHaveProperty('systematicRisk');
    expect(result).toHaveProperty('totalRisk');
    expect(result).toHaveProperty('rSquared');

    // Check factor exposures
    expect(result.factorExposures).toHaveProperty('market');
    expect(result.factorExposures).toHaveProperty('smb');
    expect(result.factorExposures).toHaveProperty('hml');

    // Check that all values are numbers
    expect(typeof result.idiosyncraticRisk).toBe('number');
    expect(typeof result.systematicRisk).toBe('number');
    expect(typeof result.totalRisk).toBe('number');
    expect(typeof result.rSquared).toBe('number');

    // R-squared should be between 0 and 1
    expect(result.rSquared).toBeGreaterThanOrEqual(0);
    expect(result.rSquared).toBeLessThanOrEqual(1);
  });

  test('should add and remove custom models', () => {
    const customModel = {
      id: 'custom_test',
      name: 'Custom Test Model',
      factors: [
        {
          id: 'factor1',
          name: 'Test Factor',
          description: 'Test factor description',
          weight: 1.0,
          exposure: 0.0
        }
      ],
      r2: 0.75,
      alphaSignificance: 0.05
    };

    engine.addCustomModel(customModel);
    const models = engine.getAvailableModels();
    expect(models.some(m => m.id === 'custom_test')).toBe(true);

    const removed = engine.removeModel('custom_test');
    expect(removed).toBe(true);

    const modelsAfterRemoval = engine.getAvailableModels();
    expect(modelsAfterRemoval.some(m => m.id === 'custom_test')).toBe(false);
  });
});