import { supabase } from '@/integrations/supabase/client';

export interface BrokerCredentials {
  apiKey: string;
  accountId: string;
  serverUrl?: string;
  environment: 'demo' | 'live';
}

export interface BrokerConfig {
  name: string;
  type: 'oanda' | 'ctrader' | 'interactive_brokers' | 'mt4' | 'mt5';
  apiEndpoints: {
    base: string;
    accounts: string;
    orders: string;
    positions: string;
    pricing: string;
  };
  websocketUrl?: string;
  supportedFeatures: string[];
}

export class BrokerManagerService {
  private static instance: BrokerManagerService;
  private brokerConfigs: Map<string, BrokerConfig> = new Map();

  static getInstance(): BrokerManagerService {
    if (!BrokerManagerService.instance) {
      BrokerManagerService.instance = new BrokerManagerService();
      BrokerManagerService.instance.initializeBrokerConfigs();
    }
    return BrokerManagerService.instance;
  }

  private initializeBrokerConfigs() {
    // OANDA Configuration
    this.brokerConfigs.set('oanda', {
      name: 'OANDA',
      type: 'oanda',
      apiEndpoints: {
        base: 'https://api-fxtrade.oanda.com',
        accounts: '/v3/accounts',
        orders: '/v3/accounts/{accountId}/orders',
        positions: '/v3/accounts/{accountId}/positions',
        pricing: '/v3/accounts/{accountId}/pricing'
      },
      websocketUrl: 'wss://stream-fxtrade.oanda.com',
      supportedFeatures: ['spot_trading', 'streaming_prices', 'position_management', 'order_management']
    });

    // cTrader Configuration
    this.brokerConfigs.set('ctrader', {
      name: 'cTrader',
      type: 'ctrader',
      apiEndpoints: {
        base: 'https://connect.ctraderapi.com',
        accounts: '/api/v2/ctid/accounts',
        orders: '/api/v2/ctid/accounts/{accountId}/orders',
        positions: '/api/v2/ctid/accounts/{accountId}/positions',
        pricing: '/api/v2/ctid/accounts/{accountId}/pricing'
      },
      websocketUrl: 'wss://connect.ctraderapi.com/streaming',
      supportedFeatures: ['spot_trading', 'streaming_prices', 'advanced_orders', 'multi_account']
    });

    // Interactive Brokers Configuration
    this.brokerConfigs.set('interactive_brokers', {
      name: 'Interactive Brokers',
      type: 'interactive_brokers',
      apiEndpoints: {
        base: 'https://localhost:5000/v1/api',
        accounts: '/accounts',
        orders: '/orders',
        positions: '/positions',
        pricing: '/marketdata'
      },
      supportedFeatures: ['stocks', 'options', 'futures', 'forex', 'streaming_data']
    });
  }

  getSupportedBrokers(): BrokerConfig[] {
    return Array.from(this.brokerConfigs.values());
  }

  getBrokerConfig(brokerType: string): BrokerConfig | null {
    return this.brokerConfigs.get(brokerType) || null;
  }

  async validateCredentials(brokerType: string, credentials: BrokerCredentials): Promise<boolean> {
    const config = this.getBrokerConfig(brokerType);
    if (!config) throw new Error(`Unsupported broker: ${brokerType}`);

    try {
      switch (brokerType) {
        case 'oanda':
          return await this.validateOandaCredentials(credentials);
        case 'ctrader':
          return await this.validateCTraderCredentials(credentials);
        case 'interactive_brokers':
          return await this.validateIBCredentials(credentials);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Credential validation failed for ${brokerType}:`, error);
      return false;
    }
  }

  private async validateOandaCredentials(credentials: BrokerCredentials): Promise<boolean> {
    const baseUrl = credentials.environment === 'demo' 
      ? 'https://api-fxpractice.oanda.com' 
      : 'https://api-fxtrade.oanda.com';
    
    try {
      // First validate API key format
      if (!credentials.apiKey || credentials.apiKey.length < 30) {
        console.error('Invalid OANDA API key format');
        return false;
      }

      // Test with account endpoint to ensure API key is valid
      const response = await fetch(`${baseUrl}/v3/accounts/${credentials.accountId}`, {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`OANDA API validation failed: ${response.status} - ${response.statusText}`);
        const errorBody = await response.text();
        console.error('Error details:', errorBody);
        return false;
      }

      return true;
    } catch (error) {
      console.error('OANDA credential validation error:', error);
      return false;
    }
  }

  private async validateCTraderCredentials(credentials: BrokerCredentials): Promise<boolean> {
    // Implement cTrader credential validation
    // This would involve OAuth2 flow for cTrader
    return true; // Placeholder
  }

  private async validateIBCredentials(credentials: BrokerCredentials): Promise<boolean> {
    // Implement Interactive Brokers credential validation
    // This would check the local TWS/Gateway connection
    return true; // Placeholder
  }

  async getAccountInfo(brokerType: string, credentials: BrokerCredentials): Promise<any> {
    const config = this.getBrokerConfig(brokerType);
    if (!config) throw new Error(`Unsupported broker: ${brokerType}`);

    switch (brokerType) {
      case 'oanda':
        return await this.getOandaAccountInfo(credentials);
      case 'ctrader':
        return await this.getCTraderAccountInfo(credentials);
      case 'interactive_brokers':
        return await this.getIBAccountInfo(credentials);
      default:
        throw new Error(`Account info not implemented for ${brokerType}`);
    }
  }

  private async getOandaAccountInfo(credentials: BrokerCredentials): Promise<any> {
    const baseUrl = credentials.environment === 'demo' 
      ? 'https://api-fxpractice.oanda.com' 
      : 'https://api-fxtrade.oanda.com';
    
    const response = await fetch(`${baseUrl}/v3/accounts/${credentials.accountId}`, {
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch account info');
    return await response.json();
  }

  private async getCTraderAccountInfo(credentials: BrokerCredentials): Promise<any> {
    // Implement cTrader account info fetching
    return {}; // Placeholder
  }

  private async getIBAccountInfo(credentials: BrokerCredentials): Promise<any> {
    // Implement Interactive Brokers account info fetching
    return {}; // Placeholder
  }

  async storeBrokerCredentials(userId: string, brokerType: string, credentials: BrokerCredentials): Promise<void> {
    // Validate credentials before storing
    if (!credentials.apiKey || !credentials.accountId) {
      throw new Error('Invalid credentials: missing API key or account ID');
    }

    try {
      // Use base64 encoding to prevent truncation issues
      const encodedApiKey = btoa(credentials.apiKey);
      const encodedAccountId = btoa(credentials.accountId);
      
      const { error } = await supabase
        .from('wingzero_credentials')
        .upsert({
          user_id: userId,
          broker_type: brokerType,
          encrypted_api_key: encodedApiKey,
          encrypted_account_id: encodedAccountId,
          server_url: credentials.serverUrl || '',
          environment: credentials.environment
        });

      if (error) throw error;
      
      console.log(`Successfully stored ${brokerType} credentials for user ${userId}`);
    } catch (error) {
      console.error('Failed to store broker credentials:', error);
      throw error;
    }
  }

  async getBrokerCredentials(userId: string, brokerType: string): Promise<BrokerCredentials | null> {
    try {
      const { data, error } = await supabase
        .from('wingzero_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('broker_type', brokerType)
        .single();

      if (error || !data) {
        console.log(`No ${brokerType} credentials found for user ${userId}`);
        return null;
      }

      // Decode base64 encoded credentials
      const apiKey = atob(data.encrypted_api_key);
      const accountId = atob(data.encrypted_account_id);

      return {
        apiKey,
        accountId,
        serverUrl: data.server_url || undefined,
        environment: data.environment as 'demo' | 'live'
      };
    } catch (error) {
      console.error('Failed to retrieve broker credentials:', error);
      return null;
    }
  }
}