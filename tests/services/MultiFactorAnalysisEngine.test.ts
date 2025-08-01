import { MultiFactorAnalysisEngine } from '../../src/services/MultiFactorAnalysisEngine';

describe('MultiFactorAnalysisEngine', () => {
  let engine: MultiFactorAnalysisEngine;

  beforeEach(() => {
    engine = new MultiFactorAnalysisEngine();
  });

  it('should perform factor attribution', async () => {
    const request = {
      assets: [],
      factors: [],
      period: '1Y'
    };
    const result = await engine.factorAttribution(request);
    expect(result).toBeDefined();
    expect(result.totalReturn).toBeDefined();
    expect(result.factorContributions).toBeDefined();
  });


});