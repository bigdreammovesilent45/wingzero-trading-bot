// Phase 5: Performance & Scalability - Caching Service
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum cache size
  compressionEnabled: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  size: number;
  memoryUsage: number;
}

export class PerformanceCacheService {
  private static instance: PerformanceCacheService;
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig = {
    ttl: 300, // 5 minutes default
    maxSize: 1000,
    compressionEnabled: true
  };

  static getInstance(): PerformanceCacheService {
    if (!PerformanceCacheService.instance) {
      PerformanceCacheService.instance = new PerformanceCacheService();
    }
    return PerformanceCacheService.instance;
  }

  async set<T>(key: string, data: T, customTtl?: number): Promise<void> {
    const ttl = customTtl || this.config.ttl;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
      accessCount: 0
    };

    // Check cache size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access count for LRU
    entry.accessCount++;
    return entry.data as T;
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  getMetrics(): CacheMetrics {
    const totalRequests = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);
    
    return {
      hitRate: totalRequests > 0 ? (this.cache.size / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? ((totalRequests - this.cache.size) / totalRequests) * 100 : 0,
      size: this.cache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  private evictLRU(): void {
    let lruKey = '';
    let lruAccessCount = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.accessCount < lruAccessCount) {
        lruAccessCount = entry.accessCount;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let size = 0;
    for (const [key, entry] of this.cache) {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(entry.data).length * 2;
      size += 32; // Overhead for entry metadata
    }
    return size;
  }
}