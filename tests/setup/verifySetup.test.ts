import { PortfolioOptimizationService } from '../../src/services/windsurf/PortfolioOptimizationService';
import { FeatureEngineeringPipeline } from '../../src/services/windsurf/FeatureEngineeringPipeline';
import { ModelVersioningService } from '../../src/services/windsurf/ModelVersioningService';
import { ModelMonitoringService } from '../../src/services/windsurf/ModelMonitoringService';
import { RiskManagementEngine } from '../../src/services/windsurf/RiskManagementEngine';

describe('Windsurf Setup Verification', () => {
  it('should import PortfolioOptimizationService', () => {
    expect(PortfolioOptimizationService).toBeDefined();
    const service = new PortfolioOptimizationService();
    expect(service).toBeInstanceOf(PortfolioOptimizationService);
  });

  it('should import FeatureEngineeringPipeline', () => {
    expect(FeatureEngineeringPipeline).toBeDefined();
    const pipeline = new FeatureEngineeringPipeline();
    expect(pipeline).toBeInstanceOf(FeatureEngineeringPipeline);
  });

  it('should import ModelVersioningService', () => {
    expect(ModelVersioningService).toBeDefined();
    // Note: ModelVersioningService requires dependencies
    expect(typeof ModelVersioningService).toBe('function');
  });

  it('should import ModelMonitoringService', () => {
    expect(ModelMonitoringService).toBeDefined();
    const service = new ModelMonitoringService();
    expect(service).toBeInstanceOf(ModelMonitoringService);
  });

  it('should import RiskManagementEngine', () => {
    expect(RiskManagementEngine).toBeDefined();
    const engine = new RiskManagementEngine();
    expect(engine).toBeInstanceOf(RiskManagementEngine);
  });

  it('should verify TypeScript compilation', () => {
    // Test TypeScript types
    const testAsset: any = {
      symbol: 'TEST',
      name: 'Test Asset',
      type: 'stock',
      currentPrice: 100,
      historicalReturns: [0.01, 0.02, -0.01]
    };

    expect(testAsset.symbol).toBe('TEST');
  });

  it('should verify async/await support', async () => {
    const asyncTest = async (): Promise<string> => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('async works'), 10);
      });
    };

    const result = await asyncTest();
    expect(result).toBe('async works');
  });
});