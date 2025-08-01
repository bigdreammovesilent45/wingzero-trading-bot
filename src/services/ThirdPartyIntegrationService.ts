// Phase 6: Advanced Integrations - Third Party Services
export interface IntegrationConfig {
  provider: string;
  apiKey: string;
  endpoint: string;
  rateLimit: number;
  timeout: number;
  retryAttempts: number;
}

export interface IntegrationStatus {
  provider: string;
  isConnected: boolean;
  lastSync: Date;
  errorCount: number;
  rateLimitRemaining: number;
}

export interface DataSyncResult {
  provider: string;
  recordsProcessed: number;
  errors: string[];
  syncDuration: number;
  nextSyncTime: Date;
}

export class ThirdPartyIntegrationService {
  private static instance: ThirdPartyIntegrationService;
  private integrations = new Map<string, IntegrationConfig>();
  private statusMap = new Map<string, IntegrationStatus>();

  static getInstance(): ThirdPartyIntegrationService {
    if (!ThirdPartyIntegrationService.instance) {
      ThirdPartyIntegrationService.instance = new ThirdPartyIntegrationService();
    }
    return ThirdPartyIntegrationService.instance;
  }

  async addIntegration(provider: string, config: Omit<IntegrationConfig, 'provider'>): Promise<boolean> {
    try {
      const fullConfig: IntegrationConfig = { provider, ...config };
      
      // Test connection
      const isValid = await this.testConnection(fullConfig);
      if (!isValid) {
        throw new Error(`Failed to connect to ${provider}`);
      }

      this.integrations.set(provider, fullConfig);
      this.statusMap.set(provider, {
        provider,
        isConnected: true,
        lastSync: new Date(),
        errorCount: 0,
        rateLimitRemaining: config.rateLimit
      });

      return true;
    } catch (error) {
      console.error(`Failed to add integration for ${provider}:`, error);
      return false;
    }
  }

  async syncData(provider: string, dataType: string): Promise<DataSyncResult> {
    const config = this.integrations.get(provider);
    const status = this.statusMap.get(provider);

    if (!config || !status?.isConnected) {
      throw new Error(`Provider ${provider} not configured or not connected`);
    }

    const startTime = performance.now();
    const errors: string[] = [];
    let recordsProcessed = 0;

    try {
      // Rate limiting check
      if (status.rateLimitRemaining <= 0) {
        throw new Error('Rate limit exceeded');
      }

      // Perform data sync based on provider
      switch (provider) {
        case 'bloomberg':
          recordsProcessed = await this.syncBloombergData(dataType);
          break;
        case 'refinitiv':
          recordsProcessed = await this.syncRefinitivData(dataType);
          break;
        case 'factset':
          recordsProcessed = await this.syncFactSetData(dataType);
          break;
        case 'morningstar':
          recordsProcessed = await this.syncMorningstarData(dataType);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Update status
      status.lastSync = new Date();
      status.rateLimitRemaining -= 1;
      status.errorCount = 0;

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      status.errorCount += 1;
      status.isConnected = status.errorCount < 5; // Disconnect after 5 errors
    }

    const syncDuration = performance.now() - startTime;
    const nextSyncTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    return {
      provider,
      recordsProcessed,
      errors,
      syncDuration,
      nextSyncTime
    };
  }

  async getMarketData(provider: string, symbols: string[]): Promise<any[]> {
    const config = this.integrations.get(provider);
    if (!config) {
      throw new Error(`Provider ${provider} not configured`);
    }

    const results = [];
    for (const symbol of symbols) {
      try {
        const data = await this.fetchMarketData(config, symbol);
        results.push(data);
      } catch (error) {
        console.error(`Failed to fetch data for ${symbol} from ${provider}:`, error);
      }
    }

    return results;
  }

  getIntegrationStatus(provider?: string): IntegrationStatus | IntegrationStatus[] {
    if (provider) {
      return this.statusMap.get(provider) || {
        provider,
        isConnected: false,
        lastSync: new Date(0),
        errorCount: 0,
        rateLimitRemaining: 0
      };
    }
    
    return Array.from(this.statusMap.values());
  }

  async removeIntegration(provider: string): Promise<void> {
    this.integrations.delete(provider);
    this.statusMap.delete(provider);
  }

  async healthCheck(): Promise<{ [provider: string]: boolean }> {
    const results: { [provider: string]: boolean } = {};
    
    for (const [provider, config] of this.integrations) {
      try {
        results[provider] = await this.testConnection(config);
      } catch (error) {
        results[provider] = false;
      }
    }

    return results;
  }

  private async testConnection(config: IntegrationConfig): Promise<boolean> {
    try {
      // Mock connection test - replace with actual API calls
      const response = await fetch(`${config.endpoint}/health`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(config.timeout)
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async syncBloombergData(dataType: string): Promise<number> {
    // Mock Bloomberg Terminal API integration
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Math.floor(Math.random() * 1000) + 500;
  }

  private async syncRefinitivData(dataType: string): Promise<number> {
    // Mock Refinitiv Eikon/Workspace integration
    await new Promise(resolve => setTimeout(resolve, 800));
    return Math.floor(Math.random() * 800) + 300;
  }

  private async syncFactSetData(dataType: string): Promise<number> {
    // Mock FactSet integration
    await new Promise(resolve => setTimeout(resolve, 1200));
    return Math.floor(Math.random() * 600) + 400;
  }

  private async syncMorningstarData(dataType: string): Promise<number> {
    // Mock Morningstar Direct integration
    await new Promise(resolve => setTimeout(resolve, 900));
    return Math.floor(Math.random() * 700) + 250;
  }

  private async fetchMarketData(config: IntegrationConfig, symbol: string): Promise<any> {
    // Mock market data fetch
    return {
      symbol,
      price: Math.random() * 1000 + 100,
      volume: Math.floor(Math.random() * 1000000),
      timestamp: new Date(),
      provider: config.provider
    };
  }
}