import { ThirdPartyIntegrationService } from '@/services';

describe('ThirdPartyIntegrationService', () => {
  let integrationService: ThirdPartyIntegrationService;

  beforeEach(() => {
    integrationService = ThirdPartyIntegrationService.getInstance();
  });

  it('should return the same instance (singleton)', () => {
    const instance1 = ThirdPartyIntegrationService.getInstance();
    const instance2 = ThirdPartyIntegrationService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should add integration successfully', async () => {
    const config = {
      apiKey: 'test-api-key',
      endpoint: 'https://api.test.com',
      rateLimit: 1000,
      timeout: 5000,
      retryAttempts: 3
    };

    const result = await integrationService.addIntegration('test-provider', config);
    expect(result).toBe(true);

    const status = integrationService.getIntegrationStatus('test-provider');
    expect(status).toHaveProperty('provider', 'test-provider');
    expect(status).toHaveProperty('isConnected', true);
  });

  it('should sync data from provider', async () => {
    const config = {
      apiKey: 'bloomberg-key',
      endpoint: 'https://api.bloomberg.com',
      rateLimit: 100,
      timeout: 10000,
      retryAttempts: 3
    };

    await integrationService.addIntegration('bloomberg', config);
    
    const syncResult = await integrationService.syncData('bloomberg', 'market-data');
    
    expect(syncResult).toHaveProperty('provider', 'bloomberg');
    expect(syncResult).toHaveProperty('recordsProcessed');
    expect(syncResult).toHaveProperty('errors');
    expect(syncResult).toHaveProperty('syncDuration');
    expect(syncResult).toHaveProperty('nextSyncTime');
    expect(typeof syncResult.recordsProcessed).toBe('number');
    expect(Array.isArray(syncResult.errors)).toBe(true);
  });

  it('should get market data from provider', async () => {
    const config = {
      apiKey: 'test-key',
      endpoint: 'https://api.test.com',
      rateLimit: 500,
      timeout: 5000,
      retryAttempts: 2
    };

    await integrationService.addIntegration('test-provider', config);
    
    const symbols = ['AAPL', 'GOOGL', 'MSFT'];
    const marketData = await integrationService.getMarketData('test-provider', symbols);
    
    expect(Array.isArray(marketData)).toBe(true);
    expect(marketData.length).toBeLessThanOrEqual(symbols.length);
    
    if (marketData.length > 0) {
      expect(marketData[0]).toHaveProperty('symbol');
      expect(marketData[0]).toHaveProperty('price');
      expect(marketData[0]).toHaveProperty('provider', 'test-provider');
    }
  });

  it('should get all integration statuses', () => {
    const statuses = integrationService.getIntegrationStatus();
    expect(Array.isArray(statuses)).toBe(true);
  });

  it('should perform health check', async () => {
    const config = {
      apiKey: 'health-test-key',
      endpoint: 'https://api.healthtest.com',
      rateLimit: 100,
      timeout: 3000,
      retryAttempts: 1
    };

    await integrationService.addIntegration('health-test', config);
    
    const healthResults = await integrationService.healthCheck();
    expect(typeof healthResults).toBe('object');
    expect(healthResults).toHaveProperty('health-test');
    expect(typeof healthResults['health-test']).toBe('boolean');
  });

  it('should remove integration', async () => {
    const config = {
      apiKey: 'remove-test-key',
      endpoint: 'https://api.removetest.com',
      rateLimit: 50,
      timeout: 2000,
      retryAttempts: 1
    };

    await integrationService.addIntegration('remove-test', config);
    
    let status = integrationService.getIntegrationStatus('remove-test');
    expect(status).toHaveProperty('isConnected', true);
    
    await integrationService.removeIntegration('remove-test');
    
    status = integrationService.getIntegrationStatus('remove-test');
    expect(status).toHaveProperty('isConnected', false);
  });

  it('should fail to sync data without proper integration', async () => {
    await expect(integrationService.syncData('non-existent-provider', 'data'))
      .rejects.toThrow('Provider non-existent-provider not configured or not connected');
  });
});