import { BrokerCredentials } from '@/types/broker';

interface OandaTokenInfo {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

interface OandaCircuitBreaker {
  isOpen: boolean;
  failures: number;
  lastFailure: number;
  halfOpenTime: number;
}

interface OandaRequestOptions extends RequestInit {
  skipAuth?: boolean;
  retryCount?: number;
}

export class EnhancedOandaBrokerService {
  private credentials: BrokerCredentials | null = null;
  private tokenInfo: OandaTokenInfo | null = null;
  private circuitBreaker: OandaCircuitBreaker;
  private refreshPromise: Promise<void> | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly CIRCUIT_THRESHOLD = 5;
  private readonly CIRCUIT_TIMEOUT = 60000; // 1 minute

  constructor() {
    this.circuitBreaker = {
      isOpen: false,
      failures: 0,
      lastFailure: 0,
      halfOpenTime: 0
    };
  }

  async initialize(credentials: BrokerCredentials): Promise<void> {
    this.credentials = credentials;
    await this.validateAndSetupConnection();
  }

  private async validateAndSetupConnection(): Promise<void> {
    if (!this.credentials) {
      throw new Error('No OANDA credentials provided');
    }

    // Validate credential format
    if (!this.credentials.apiKey || this.credentials.apiKey.length < 30) {
      throw new Error('Invalid OANDA API key format - must be at least 30 characters');
    }

    if (!this.credentials.accountId) {
      throw new Error('OANDA account ID is required');
    }

    // Test connection with account endpoint
    try {
      await this.testConnection();
      console.log('✅ OANDA credentials validated successfully');
    } catch (error) {
      console.error('❌ OANDA credential validation failed:', error);
      throw new Error(`OANDA credential validation failed: ${error}`);
    }
  }

  private getBaseUrl(): string {
    if (!this.credentials) throw new Error('No credentials configured');
    return this.credentials.environment === 'demo' 
      ? 'https://api-fxpractice.oanda.com' 
      : 'https://api-fxtrade.oanda.com';
  }

  private getStreamingUrl(): string {
    if (!this.credentials) throw new Error('No credentials configured');
    return this.credentials.environment === 'demo'
      ? 'https://stream-fxpractice.oanda.com'
      : 'https://stream-fxtrade.oanda.com';
  }

  // Enhanced authentication with comprehensive error handling
  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.credentials) {
      throw new Error('No OANDA credentials configured');
    }

    return {
      'Authorization': `Bearer ${this.credentials.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Version': '1.0.0'
    };
  }

  // Circuit breaker pattern implementation
  private checkCircuitBreaker(): void {
    if (!this.circuitBreaker.isOpen) return;

    const now = Date.now();
    if (now - this.circuitBreaker.lastFailure > this.CIRCUIT_TIMEOUT) {
      console.log('🔄 OANDA circuit breaker entering half-open state');
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.halfOpenTime = now;
    } else {
      throw new Error('OANDA service circuit breaker is OPEN - please wait before retrying');
    }
  }

  private recordSuccess(): void {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.halfOpenTime = 0;
  }

  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();

    if (this.circuitBreaker.failures >= this.CIRCUIT_THRESHOLD) {
      console.log('🚨 OANDA circuit breaker OPEN - too many failures');
      this.circuitBreaker.isOpen = true;
    }
  }

  // Enhanced request method with retry logic and 401 handling
  private async makeRequest<T>(
    endpoint: string, 
    options: OandaRequestOptions = {}
  ): Promise<T> {
    this.checkCircuitBreaker();

    const { retryCount = 0, skipAuth = false, ...requestOptions } = options;
    
    if (retryCount >= this.MAX_RETRIES) {
      throw new Error(`Max retries (${this.MAX_RETRIES}) exceeded for OANDA API request`);
    }

    try {
      const url = `${this.getBaseUrl()}${endpoint}`;
      const headers = skipAuth ? {} : await this.getAuthHeaders();

      console.log(`🌐 OANDA API Request: ${requestOptions.method || 'GET'} ${endpoint}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
        headers: {
          ...headers,
          ...requestOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        console.log('🔐 OANDA 401 Unauthorized - handling authentication issue');
        await this.handle401Error(endpoint, options);
        
        // Retry the request once after handling 401
        return this.makeRequest<T>(endpoint, {
          ...options,
          retryCount: retryCount + 1
        });
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ OANDA API Error ${response.status}:`, errorText);
        
        // Parse OANDA error format
        let errorMessage = `OANDA API Error: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.errorMessage) {
            errorMessage = errorData.errorMessage;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }

        // Handle specific error codes
        if (response.status === 400) {
          throw new Error(`Bad Request: ${errorMessage}`);
        } else if (response.status === 403) {
          throw new Error(`Forbidden: ${errorMessage} - Check account permissions`);
        } else if (response.status === 404) {
          throw new Error(`Not Found: ${errorMessage}`);
        } else if (response.status === 429) {
          // Rate limit - implement exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          console.log(`⏱️ Rate limited, retrying in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.makeRequest<T>(endpoint, {
            ...options,
            retryCount: retryCount + 1
          });
        } else if (response.status >= 500) {
          // Server errors - retry with exponential backoff
          const delay = Math.min(2000 * Math.pow(2, retryCount), 15000);
          console.log(`🔄 Server error, retrying in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.makeRequest<T>(endpoint, {
            ...options,
            retryCount: retryCount + 1
          });
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      this.recordSuccess();
      
      console.log(`✅ OANDA API Success: ${endpoint}`);
      return data;

    } catch (error) {
      console.error(`❌ OANDA API Request failed:`, error);
      
      // Network or timeout errors - retry with exponential backoff
      if (error instanceof Error && (
        error.name === 'AbortError' || 
        error.message.includes('fetch') ||
        error.message.includes('network')
      )) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        console.log(`🔄 Network error, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.makeRequest<T>(endpoint, {
          ...options,
          retryCount: retryCount + 1
        });
      }

      this.recordFailure();
      throw error;
    }
  }

  // Enhanced 401 error handling
  private async handle401Error(endpoint: string, options: OandaRequestOptions): Promise<void> {
    console.log('🔍 Analyzing 401 error for OANDA API...');

    // First, validate API key format again
    if (!this.credentials?.apiKey || this.credentials.apiKey.length < 30) {
      throw new Error('Invalid OANDA API key format - please verify your API key');
    }

    // Test with a minimal endpoint to isolate the issue
    try {
      console.log('🧪 Testing OANDA API key validity...');
      
      const testResponse = await fetch(`${this.getBaseUrl()}/v3/accounts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (testResponse.status === 401) {
        // API key is invalid
        throw new Error('OANDA API key is invalid or expired. Please check your credentials in OANDA console.');
      } else if (testResponse.status === 403) {
        // API key valid but insufficient permissions
        throw new Error('OANDA API key has insufficient permissions. Please check scope settings in OANDA console.');
      } else if (!testResponse.ok) {
        const errorText = await testResponse.text();
        throw new Error(`OANDA authentication test failed: ${testResponse.status} - ${errorText}`);
      }

      // If we get here, the API key works for basic requests
      console.log('✅ OANDA API key is valid');

      // Check if specific endpoint requires special permissions
      if (endpoint.includes('/orders') || endpoint.includes('/trades')) {
        console.log('⚠️ Trading endpoint access issue - verify trading permissions');
        throw new Error('OANDA API key lacks trading permissions. Enable trading scope in OANDA console.');
      }

    } catch (error) {
      console.error('❌ OANDA 401 error analysis failed:', error);
      throw error;
    }
  }

  // Core API Methods with enhanced error handling
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest(`/v3/accounts/${this.credentials?.accountId}`);
      return true;
    } catch (error) {
      console.error('❌ OANDA connection test failed:', error);
      return false;
    }
  }

  async getAccount(): Promise<any> {
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}`);
  }

  async getAccountSummary(): Promise<any> {
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}/summary`);
  }

  async getInstruments(): Promise<any> {
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}/instruments`);
  }

  async getPricing(instruments: string[]): Promise<any> {
    const instrumentList = instruments.join(',');
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}/pricing?instruments=${instrumentList}`);
  }

  async getPositions(): Promise<any> {
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}/positions`);
  }

  async getOpenPositions(): Promise<any> {
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}/openPositions`);
  }

  async getTrades(): Promise<any> {
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}/trades`);
  }

  async getOpenTrades(): Promise<any> {
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}/openTrades`);
  }

  async getOrders(): Promise<any> {
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}/orders`);
  }

  async getPendingOrders(): Promise<any> {
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}/pendingOrders`);
  }

  async createOrder(orderData: any): Promise<any> {
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}/orders`, {
      method: 'POST',
      body: JSON.stringify({ order: orderData })
    });
  }

  async modifyOrder(orderId: string, orderData: any): Promise<any> {
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ order: orderData })
    });
  }

  async cancelOrder(orderId: string): Promise<any> {
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}/orders/${orderId}/cancel`, {
      method: 'PUT'
    });
  }

  async closeTrade(tradeId: string, units?: string): Promise<any> {
    const body = units ? JSON.stringify({ units }) : undefined;
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}/trades/${tradeId}/close`, {
      method: 'PUT',
      body
    });
  }

  async modifyTrade(tradeId: string, tradeData: any): Promise<any> {
    return this.makeRequest(`/v3/accounts/${this.credentials?.accountId}/trades/${tradeId}`, {
      method: 'PUT',
      body: JSON.stringify(tradeData)
    });
  }

  async getTransactionHistory(fromTime?: string, toTime?: string): Promise<any> {
    let endpoint = `/v3/accounts/${this.credentials?.accountId}/transactions`;
    const params = new URLSearchParams();
    
    if (fromTime) params.append('from', fromTime);
    if (toTime) params.append('to', toTime);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return this.makeRequest(endpoint);
  }

  // Enhanced streaming connection with reconnection
  async createPricingStream(instruments: string[], onMessage: (data: any) => void, onError?: (error: Error) => void): Promise<void> {
    const streamUrl = `${this.getStreamingUrl()}/v3/accounts/${this.credentials?.accountId}/pricing/stream`;
    const instrumentList = instruments.join(',');
    const url = `${streamUrl}?instruments=${instrumentList}`;

    console.log('🌊 Creating OANDA pricing stream...');

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Streaming connection failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming connection');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      console.log('✅ OANDA pricing stream connected');

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('📡 OANDA stream ended');
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const data = JSON.parse(line);
                  onMessage(data);
                } catch (parseError) {
                  console.error('❌ Failed to parse streaming data:', parseError);
                }
              }
            }
          }
        } catch (streamError) {
          console.error('❌ OANDA stream error:', streamError);
          if (onError) onError(streamError as Error);
        }
      };

      processStream();

    } catch (error) {
      console.error('❌ Failed to create OANDA pricing stream:', error);
      if (onError) onError(error as Error);
      throw error;
    }
  }

  // System health and monitoring
  getSystemHealth(): {
    status: string;
    circuitBreaker: OandaCircuitBreaker;
    credentials: {
      configured: boolean;
      environment: string | undefined;
      accountId: string | undefined;
    };
  } {
    return {
      status: this.circuitBreaker.isOpen ? 'degraded' : 'healthy',
      circuitBreaker: { ...this.circuitBreaker },
      credentials: {
        configured: !!this.credentials,
        environment: this.credentials?.environment,
        accountId: this.credentials?.accountId
      }
    };
  }

  // Reset circuit breaker (for admin/recovery)
  resetCircuitBreaker(): void {
    this.circuitBreaker = {
      isOpen: false,
      failures: 0,
      lastFailure: 0,
      halfOpenTime: 0
    };
    console.log('🔄 OANDA circuit breaker reset');
  }

  // Validate environment and permissions
  async validateEnvironmentAndPermissions(): Promise<{
    environment: string;
    permissions: string[];
    issues: string[];
  }> {
    const result = {
      environment: this.credentials?.environment || 'unknown',
      permissions: [] as string[],
      issues: [] as string[]
    };

    try {
      // Test basic account access
      await this.getAccount();
      result.permissions.push('account_read');

      // Test pricing access
      try {
        await this.getPricing(['EUR_USD']);
        result.permissions.push('pricing_read');
      } catch {
        result.issues.push('No pricing access');
      }

      // Test trading access
      try {
        await this.getOrders();
        result.permissions.push('orders_read');
      } catch {
        result.issues.push('No orders access');
      }

      // Additional permission checks can be added here

    } catch (error) {
      result.issues.push(`Account access failed: ${error}`);
    }

    return result;
  }
}