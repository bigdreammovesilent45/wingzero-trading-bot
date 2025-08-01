import { MultiFactorAnalysisEngine } from '@/services';
import { TestDataService } from '@/services/TestDataService';

describe('MultiFactorAnalysisEngine', () => {
  let engine: MultiFactorAnalysisEngine;
  let testDataService: TestDataService;

  beforeEach(() => {
    engine = MultiFactorAnalysisEngine.getInstance();
    testDataService = TestDataService.getInstance();
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

  test('should analyze factor exposure with real Wing Zero data', async () => {
    // Get real position data and calculate returns
    const realPositions = await testDataService.getRealWingZeroPositions();
    expect(realPositions.length).toBeGreaterThan(0);
    
    // Calculate asset returns from first position
    const assetReturns = realPositions.slice(0, 5).map(p => 
      (p.current_price - p.open_price) / p.open_price
    );
    
    // Generate factor returns based on real data
    const factorReturns = testDataService.getRealFactorReturns(realPositions.slice(0, 5));

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