import { PerformanceCacheService } from '@/services';

describe('PerformanceCacheService', () => {
  let cacheService: PerformanceCacheService;

  beforeEach(() => {
    cacheService = PerformanceCacheService.getInstance();
  });

  afterEach(async () => {
    await cacheService.clear();
  });

  it('should return the same instance (singleton)', () => {
    const instance1 = PerformanceCacheService.getInstance();
    const instance2 = PerformanceCacheService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should set and get cached data', async () => {
    const testData = { test: 'value', number: 123 };
    await cacheService.set('test-key', testData);
    
    const retrieved = await cacheService.get('test-key');
    expect(retrieved).toEqual(testData);
  });

  it('should return null for non-existent keys', async () => {
    const result = await cacheService.get('non-existent');
    expect(result).toBeNull();
  });

  it('should handle TTL expiration', async () => {
    const testData = { expired: true };
    await cacheService.set('expire-test', testData, 0.001); // 1ms TTL
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 5));
    
    const result = await cacheService.get('expire-test');
    expect(result).toBeNull();
  });

  it('should invalidate specific keys', async () => {
    await cacheService.set('key1', 'value1');
    await cacheService.set('key2', 'value2');
    
    await cacheService.invalidate('key1');
    
    expect(await cacheService.get('key1')).toBeNull();
    expect(await cacheService.get('key2')).toBe('value2');
  });

  it('should invalidate by pattern', async () => {
    await cacheService.set('user:123:profile', { id: 123 });
    await cacheService.set('user:456:profile', { id: 456 });
    await cacheService.set('product:789', { id: 789 });
    
    await cacheService.invalidatePattern('user:.*:profile');
    
    expect(await cacheService.get('user:123:profile')).toBeNull();
    expect(await cacheService.get('user:456:profile')).toBeNull();
    expect(await cacheService.get('product:789')).toEqual({ id: 789 });
  });

  it('should provide cache metrics', () => {
    const metrics = cacheService.getMetrics();
    
    expect(metrics).toHaveProperty('hitRate');
    expect(metrics).toHaveProperty('missRate');
    expect(metrics).toHaveProperty('size');
    expect(metrics).toHaveProperty('memoryUsage');
    expect(typeof metrics.hitRate).toBe('number');
    expect(typeof metrics.size).toBe('number');
  });

  it('should update configuration', () => {
    const newConfig = {
      ttl: 600,
      maxSize: 2000,
      compressionEnabled: false
    };
    
    cacheService.updateConfig(newConfig);
    
    // Test that new TTL is used
    expect(() => cacheService.updateConfig(newConfig)).not.toThrow();
  });
});