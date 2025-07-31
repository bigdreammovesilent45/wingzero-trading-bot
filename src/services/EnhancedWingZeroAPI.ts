import { 
  WingZeroConfig, 
  WingZeroAccount, 
  WingZeroPosition, 
  WingZeroOrder, 
  WingZeroSymbol, 
  WingZeroTrade, 
  WingZeroMarketData, 
  WingZeroApiResponse,
  WingZeroNotification 
} from '@/types/wingzero';
import { WingZeroSystemIntegration } from './WingZeroSystemIntegration';

interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
  halfOpenAttempts: number;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
}

interface TokenInfo {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

export class EnhancedWingZeroAPI {
  private config: WingZeroConfig;
  private wsConnection?: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private circuitBreaker: CircuitBreakerState;
  private retryConfig: RetryConfig;
  private tokenInfo: TokenInfo | null = null;
  private refreshTokenPromise: Promise<void> | null = null;
  private wsReconnectTimer: NodeJS.Timeout | null = null;
  private connectionPool: WebSocket[] = [];
  private readonly MAX_POOL_SIZE = 3;
  
  // Phase 5: High-Performance System Integration
  private static systemIntegration: WingZeroSystemIntegration | null = null;

  constructor(config: WingZeroConfig) {
    this.config = config;
    this.initializeCircuitBreaker();
    this.initializeRetryConfig();
  }

  private initializeCircuitBreaker(): void {
    this.circuitBreaker = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: 0,
      halfOpenAttempts: 0
    };
  }

  private initializeRetryConfig(): void {
    this.retryConfig = {
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 30000,
      exponentialBase: 2
    };
  }

  // Enhanced Authentication with Token Refresh
  private async getAuthHeaders(): Promise<Record<string, string>> {
    await this.ensureValidToken();
    
    const timestamp = Date.now().toString();
    const signature = await this.generateSignature(timestamp);
    
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-API-Secret': this.config.apiSecret,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
      'X-Client-ID': this.config.clientId,
      'Authorization': this.tokenInfo ? `Bearer ${this.tokenInfo.token}` : '',
    };
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.tokenInfo || this.isTokenExpiring()) {
      if (this.refreshTokenPromise) {
        await this.refreshTokenPromise;
        return;
      }
      
      this.refreshTokenPromise = this.refreshToken();
      await this.refreshTokenPromise;
      this.refreshTokenPromise = null;
    }
  }

  private isTokenExpiring(): boolean {
    if (!this.tokenInfo) return true;
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    return Date.now() >= (this.tokenInfo.expiresAt - bufferTime);
  }

  private async refreshToken(): Promise<void> {
    try {
      console.log('🔄 Refreshing authentication token...');
      
      const response = await fetch(`${this.config.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
          'X-Client-ID': this.config.clientId,
          ...(this.tokenInfo?.refreshToken && {
            'X-Refresh-Token': this.tokenInfo.refreshToken
          })
        },
        body: JSON.stringify({
          apiKey: this.config.apiKey,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔑 Performing full authentication...');
          await this.performFullAuthentication();
          return;
        }
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      this.tokenInfo = {
        token: data.token,
        expiresAt: Date.now() + (data.expiresIn * 1000),
        refreshToken: data.refreshToken || this.tokenInfo?.refreshToken
      };

      console.log('✅ Token refreshed successfully');
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.tokenInfo = null;
      throw error;
    }
  }

  private async performFullAuthentication(): Promise<void> {
    const timestamp = Date.now().toString();
    const signature = await this.generateSignature(timestamp);
    
    const response = await fetch(`${this.config.baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
        'X-API-Secret': this.config.apiSecret,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
        'X-Client-ID': this.config.clientId,
      }
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data = await response.json();
    this.tokenInfo = {
      token: data.token,
      expiresAt: Date.now() + (data.expiresIn * 1000),
      refreshToken: data.refreshToken
    };
  }

  private async generateSignature(timestamp: string): Promise<string> {
    const message = `${timestamp}${this.config.apiKey}${this.config.clientId}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.config.apiSecret);
    const messageData = encoder.encode(message);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Circuit Breaker Implementation
  private checkCircuitBreaker(): void {
    if (!this.circuitBreaker.isOpen) return;
    
    const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime;
    const timeoutDuration = 60000; // 1 minute
    
    if (timeSinceLastFailure > timeoutDuration) {
      console.log('🔄 Circuit breaker moving to half-open state');
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.halfOpenAttempts = 0;
    }
  }

  private recordSuccess(): void {
    this.circuitBreaker.failureCount = 0;
    this.circuitBreaker.halfOpenAttempts = 0;
  }

  private recordFailure(): void {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failureCount >= 5) {
      console.log('🚨 Circuit breaker OPEN - too many failures');
      this.circuitBreaker.isOpen = true;
    }
  }

  // Enhanced Request with Retry Logic and Circuit Breaker
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<WingZeroApiResponse<T>> {
    this.checkCircuitBreaker();
    
    if (this.circuitBreaker.isOpen) {
      throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
    }

    return await this.executeWithRetry(async () => {
      const url = `${this.config.baseUrl}${endpoint}`;
      const headers = await this.getAuthHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...headers,
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        // Handle 401 specifically
        if (response.status === 401) {
          console.log('🔄 Received 401, attempting token refresh...');
          this.tokenInfo = null; // Invalidate current token
          await this.ensureValidToken();
          
          // Retry the request once with new token
          const retryHeaders = await this.getAuthHeaders();
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...retryHeaders,
              ...options.headers,
            },
          });
          
          if (!retryResponse.ok) {
            throw new Error(`API request failed after retry: ${retryResponse.status}`);
          }
          
          const retryData = await retryResponse.json();
          this.recordSuccess();
          return retryData;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `API request failed: ${response.status}`);
        }

        this.recordSuccess();
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry for certain error types
        if (error instanceof Error && error.message.includes('Circuit breaker')) {
          throw error;
        }
        
        if (attempt === this.retryConfig.maxAttempts) {
          this.recordFailure();
          break;
        }
        
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.exponentialBase, attempt - 1),
          this.retryConfig.maxDelay
        );
        
        console.log(`🔄 Request failed, retrying in ${delay}ms (attempt ${attempt}/${this.retryConfig.maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    this.recordFailure();
    throw lastError!;
  }

  // Enhanced WebSocket with Connection Pooling
  async connectWebSocket(onMessage: (data: any) => void, onError?: (error: Event) => void): Promise<void> {
    try {
      await this.createWebSocketConnection(onMessage, onError);
    } catch (error) {
      console.error('❌ Failed to establish WebSocket connection:', error);
      if (onError) {
        onError(error as Event);
      }
      throw error;
    }
  }

  private async createWebSocketConnection(onMessage: (data: any) => void, onError?: (error: Event) => void): Promise<void> {
    // Clean up existing connection
    if (this.wsConnection) {
      this.wsConnection.close();
    }

    const wsUrl = this.config.wsEndpoint || this.config.baseUrl.replace('http', 'ws') + '/ws';
    console.log('🔌 Creating WebSocket connection to:', wsUrl);
    
    this.wsConnection = new WebSocket(wsUrl);

    return new Promise((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        this.wsConnection?.close();
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      this.wsConnection!.onopen = async () => {
        clearTimeout(connectionTimeout);
        console.log('✅ WebSocket connected successfully');
        this.reconnectAttempts = 0;
        
        try {
          // Authenticate WebSocket connection
          await this.ensureValidToken();
          this.wsConnection!.send(JSON.stringify({
            type: 'auth',
            data: {
              apiKey: this.config.apiKey,
              token: this.tokenInfo?.token,
              timestamp: Date.now(),
            }
          }));
          
          resolve();
        } catch (error) {
          console.error('❌ WebSocket authentication failed:', error);
          reject(error);
        }
      };

      this.wsConnection!.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle auth response
          if (data.type === 'auth_response') {
            if (data.success) {
              console.log('✅ WebSocket authenticated');
            } else {
              console.error('❌ WebSocket authentication failed:', data.error);
              this.wsConnection?.close();
              return;
            }
          }
          
          onMessage(data);
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error);
        }
      };

      this.wsConnection!.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`🔌 WebSocket disconnected: code=${event.code}, reason=${event.reason}`);
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnection(onMessage, onError);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('❌ Max WebSocket reconnection attempts reached');
          if (onError) {
            onError(new Event('max_reconnect_attempts'));
          }
        }
      };

      this.wsConnection!.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ WebSocket error:', error);
        if (onError) {
          onError(error);
        }
        reject(error);
      };
    });
  }

  private scheduleReconnection(onMessage: (data: any) => void, onError?: (error: Event) => void): void {
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(5000 * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
    
    console.log(`🔄 Scheduling WebSocket reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.wsReconnectTimer = setTimeout(async () => {
      try {
        await this.createWebSocketConnection(onMessage, onError);
      } catch (error) {
        console.error(`❌ WebSocket reconnection attempt ${this.reconnectAttempts} failed:`, error);
      }
    }, delay);
  }

  async disconnectWebSocket(): Promise<void> {
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }

    if (this.wsConnection) {
      this.wsConnection.close(1000, 'Client disconnect');
      this.wsConnection = undefined;
    }
    
    this.reconnectAttempts = 0;
    console.log('🔌 WebSocket disconnected gracefully');
  }

  // Core API Methods (unchanged but now using enhanced request handler)
  async getAccount(): Promise<WingZeroAccount> {
    const response = await this.makeRequest<WingZeroAccount>('/api/v1/account');
    return response.data!;
  }

  async getPositions(): Promise<WingZeroPosition[]> {
    const response = await this.makeRequest<WingZeroPosition[]>('/api/v1/positions');
    return response.data!;
  }

  async getOrders(): Promise<WingZeroOrder[]> {
    const response = await this.makeRequest<WingZeroOrder[]>('/api/v1/orders');
    return response.data!;
  }

  async createOrder(order: Partial<WingZeroOrder>): Promise<WingZeroOrder> {
    const response = await this.makeRequest<WingZeroOrder>('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
    return response.data!;
  }

  async closePosition(positionId: string): Promise<boolean> {
    const response = await this.makeRequest<boolean>(`/api/v1/positions/${positionId}/close`, {
      method: 'POST',
    });
    return response.data!;
  }

  async getMarketData(symbols: string[]): Promise<WingZeroMarketData[]> {
    const response = await this.makeRequest<WingZeroMarketData[]>(`/api/v1/market-data?symbols=${symbols.join(',')}`);
    return response.data!;
  }

  // System Health and Monitoring
  async getSystemHealth(): Promise<{
    status: string;
    circuitBreaker: CircuitBreakerState;
    reconnectAttempts: number;
    tokenStatus: {
      hasToken: boolean;
      expiresAt: number | null;
      isExpiring: boolean;
    };
  }> {
    return {
      status: this.circuitBreaker.isOpen ? 'degraded' : 'healthy',
      circuitBreaker: { ...this.circuitBreaker },
      reconnectAttempts: this.reconnectAttempts,
      tokenStatus: {
        hasToken: !!this.tokenInfo,
        expiresAt: this.tokenInfo?.expiresAt || null,
        isExpiring: this.isTokenExpiring()
      }
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ status: string }>('/api/v1/ping');
      return response.success && response.data?.status === 'ok';
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  // Force reset circuit breaker (for admin/debugging)
  resetCircuitBreaker(): void {
    this.initializeCircuitBreaker();
    console.log('🔄 Circuit breaker reset');
  }

  // Phase 5: High-Performance System Integration Methods
  static async initializeSystemIntegration(config?: any): Promise<void> {
    if (EnhancedWingZeroAPI.systemIntegration) {
      console.log('⚠️ System Integration already initialized');
      return;
    }

    console.log('🚀 Initializing Wing Zero System Integration with Phase 5...');

    const systemConfig = {
      wingZeroConfig: {
        apiKey: 'system_key',
        accountId: 'system_account',
        environment: 'production' as const,
        baseUrl: 'https://api.wingzero.example.com'
      },
      brokerCredentials: {
        apiKey: process.env.OANDA_API_KEY || 'demo_key',
        accountId: process.env.OANDA_ACCOUNT_ID || 'demo_account',
        environment: 'practice' as const
      },
      enablePerformanceMonitoring: true,
      enableSAWAutomation: true,
      enableAIBrain: true,
      enableAdvancedFinancials: true,
      enableHighPerformance: true,
      enableAdvancedIntegration: true,
      maxConcurrentOperations: 100,
      healthCheckInterval: 30000,
      autoRecoveryEnabled: true,
      performanceConfig: {
        enableWebAssembly: true,
        enableMultithreading: true,
        enableLowLatencyTrading: true,
        targetThroughput: 10000,
        maxLatency: 10
      },
      ...config
    };

    try {
      EnhancedWingZeroAPI.systemIntegration = await WingZeroSystemIntegration.createAndStart(systemConfig);
      console.log('✅ Wing Zero System Integration with Phase 5 fully operational');
    } catch (error) {
      console.error('❌ Failed to initialize System Integration:', error);
      throw error;
    }
  }

  static getSystemIntegration(): WingZeroSystemIntegration | null {
    return EnhancedWingZeroAPI.systemIntegration;
  }

  // High-Performance Computation API
  async executeHighPerformanceComputation(
    type: 'portfolio_optimization' | 'risk_calculation' | 'monte_carlo' | 'matrix_operations',
    data: any,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<any> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    
    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      console.log(`⚡ Executing high-performance ${type} computation with ${priority} priority`);
      
      const result = await systemIntegration.executeHighPerformanceComputation(type, data, priority);
      
      console.log(`✅ High-performance ${type} computation completed successfully`);
      return result;
      
    } catch (error) {
      console.error(`❌ High-performance ${type} computation failed:`, error);
      throw error;
    }
  }

  // Ultra-Fast Trading API
  async executeUltraFastTrade(order: {
    userId: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    orderType: 'market' | 'limit';
    price?: number;
    timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'DAY';
  }): Promise<string> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    
    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      console.log(`⚡ Executing ultra-fast trade: ${order.side} ${order.quantity} ${order.symbol}`);
      
      const orderId = await systemIntegration.executeUltraFastTrade(order);
      
      console.log(`✅ Ultra-fast trade executed successfully: ${orderId}`);
      return orderId;
      
    } catch (error) {
      console.error(`❌ Ultra-fast trade failed:`, error);
      throw error;
    }
  }

  // Performance Benchmark API
  async runPerformanceBenchmark(): Promise<any> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    
    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      console.log('🏁 Running comprehensive performance benchmark...');
      
      const benchmark = await systemIntegration.runPerformanceBenchmark();
      
      console.log(`🏁 Performance benchmark completed with score: ${benchmark.overallScore.toFixed(1)}`);
      return benchmark;
      
    } catch (error) {
      console.error('❌ Performance benchmark failed:', error);
      throw error;
    }
  }

  // Performance Metrics API
  async getPerformanceMetrics(): Promise<any> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    
    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      const highPerformanceEngine = systemIntegration.getHighPerformanceEngine();
      if (!highPerformanceEngine) {
        throw new Error('High-Performance Engine not available');
      }

      return highPerformanceEngine.getPerformanceMetrics();
      
    } catch (error) {
      console.error('❌ Failed to get performance metrics:', error);
      throw error;
    }
  }

  // Enhanced System Health (includes Phase 5)
  async getEnhancedSystemHealth(): Promise<any> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    
    if (!systemIntegration) {
      return {
        ...await this.getSystemHealth(),
        phase5Available: false,
        message: 'Phase 5 Performance & Scalability not initialized'
      };
    }

    try {
      const systemHealth = systemIntegration.getSystemHealth();
      const apiHealth = await this.getSystemHealth();

      return {
        ...apiHealth,
        phase5Available: true,
        systemIntegration: systemHealth,
        performanceEngines: {
          webAssembly: systemHealth?.components.highPerformance?.components.webAssembly || 'offline',
          multithreading: systemHealth?.components.highPerformance?.components.multithreading || 'offline',
          lowLatencyTrading: systemHealth?.components.highPerformance?.components.lowLatencyTrading || 'offline'
        },
        overallPerformanceScore: systemHealth?.components.highPerformance?.performanceScore || 0
      };
      
    } catch (error) {
      console.error('❌ Failed to get enhanced system health:', error);
      return {
        ...await this.getSystemHealth(),
        phase5Available: false,
        phase5Error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Parallel Portfolio Operations
  async executeParallelPortfolioAnalysis(portfolios: Array<{ id: string; data: any; analysisType: string }>): Promise<any[]> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    
    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      console.log(`📊 Executing parallel portfolio analysis for ${portfolios.length} portfolios`);
      
      const highPerformanceEngine = systemIntegration.getHighPerformanceEngine();
      if (!highPerformanceEngine) {
        throw new Error('High-Performance Engine not available');
      }

      const results = await highPerformanceEngine.executeParallelAnalysis(portfolios);
      
      console.log(`✅ Parallel portfolio analysis completed for ${portfolios.length} portfolios`);
      return results;
      
    } catch (error) {
      console.error('❌ Parallel portfolio analysis failed:', error);
      throw error;
    }
  }

  // Phase 6: Advanced Integration API
  async getIntegratedTradingSignals(symbol?: string): Promise<any[]> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();

    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      console.log(`📊 Getting integrated trading signals${symbol ? ` for ${symbol}` : ''}`);

      const signals = await systemIntegration.getIntegratedTradingSignals(symbol);

      console.log(`✅ Retrieved ${signals.length} integrated trading signals`);
      return signals;

    } catch (error) {
      console.error('❌ Failed to get integrated trading signals:', error);
      throw error;
    }
  }

  async getCrossServiceAlerts(type?: string, severity?: string): Promise<any[]> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();

    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      console.log(`🚨 Getting cross-service alerts${type ? ` of type ${type}` : ''}${severity ? ` with severity ${severity}` : ''}`);

      const alerts = await systemIntegration.getCrossServiceAlerts(type, severity);

      console.log(`✅ Retrieved ${alerts.length} cross-service alerts`);
      return alerts;

    } catch (error) {
      console.error('❌ Failed to get cross-service alerts:', error);
      throw error;
    }
  }

  async subscribeToAdvancedIntegration(callback: (data: any) => void, filters?: any): Promise<string> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();

    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      console.log('📡 Subscribing to advanced integration events');

      const subscriptionId = await systemIntegration.subscribeToAdvancedIntegration(callback, filters);

      console.log(`✅ Advanced integration subscription created: ${subscriptionId}`);
      return subscriptionId;

    } catch (error) {
      console.error('❌ Failed to subscribe to advanced integration:', error);
      throw error;
    }
  }

  // Phase 6: Service Component Access
  getUnifiedBroker() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getUnifiedBroker() || null;
  }

  getOrderManagement() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getOrderManagement() || null;
  }

  getMarketDataAggregator() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getMarketDataAggregator() || null;
  }

  getEconomicCalendar() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getEconomicCalendar() || null;
  }

  getSocialSentiment() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getSocialSentiment() || null;
  }

  // Secure High-Performance Operations (Phase 4 + Phase 5)
  async executeSecureHighPerformanceOperation(operation: any, encryptionLevel: string = 'AES-256'): Promise<any> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    
    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      console.log(`🔐⚡ Executing secure high-performance operation with ${encryptionLevel} encryption`);
      
      const advancedFinancials = systemIntegration.getAdvancedFinancials();
      const highPerformanceEngine = systemIntegration.getHighPerformanceEngine();
      
      if (!advancedFinancials || !highPerformanceEngine) {
        throw new Error('Advanced Financials or High-Performance Engine not available');
      }

      // Encrypt the operation using Phase 4 security
      const encrypted = await advancedFinancials.secureDataExchange(operation, encryptionLevel);
      
      // Execute with high performance using Phase 5
      const result = await highPerformanceEngine.executeHighPerformanceComputation(
        'portfolio_optimization', encrypted, 'critical'
      );
      
      console.log('✅ Secure high-performance operation completed successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Secure high-performance operation failed:', error);
      throw error;
    }
  }

  // Phase 6: Advanced Integration API
  async getIntegratedTradingSignals(symbol?: string): Promise<any[]> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();

    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      console.log(`📊 Getting integrated trading signals${symbol ? ` for ${symbol}` : ''}`);

      const signals = await systemIntegration.getIntegratedTradingSignals(symbol);

      console.log(`✅ Retrieved ${signals.length} integrated trading signals`);
      return signals;

    } catch (error) {
      console.error('❌ Failed to get integrated trading signals:', error);
      throw error;
    }
  }

  async getCrossServiceAlerts(type?: string, severity?: string): Promise<any[]> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();

    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      console.log(`🚨 Getting cross-service alerts${type ? ` of type ${type}` : ''}${severity ? ` with severity ${severity}` : ''}`);

      const alerts = await systemIntegration.getCrossServiceAlerts(type, severity);

      console.log(`✅ Retrieved ${alerts.length} cross-service alerts`);
      return alerts;

    } catch (error) {
      console.error('❌ Failed to get cross-service alerts:', error);
      throw error;
    }
  }

  async subscribeToAdvancedIntegration(callback: (data: any) => void, filters?: any): Promise<string> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();

    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      console.log('📡 Subscribing to advanced integration events');

      const subscriptionId = await systemIntegration.subscribeToAdvancedIntegration(callback, filters);

      console.log(`✅ Advanced integration subscription created: ${subscriptionId}`);
      return subscriptionId;

    } catch (error) {
      console.error('❌ Failed to subscribe to advanced integration:', error);
      throw error;
    }
  }

  // Phase 6: Service Component Access
  getUnifiedBroker() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getUnifiedBroker() || null;
  }

  getOrderManagement() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getOrderManagement() || null;
  }

  getMarketDataAggregator() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getMarketDataAggregator() || null;
  }

  getEconomicCalendar() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getEconomicCalendar() || null;
  }

  getSocialSentiment() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getSocialSentiment() || null;
  }

  // Phase 7: Advanced Features API
  getCopyTradingEngine() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getCopyTradingEngine() || null;
  }

  getPerformanceAnalyticsEngine() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getPerformanceAnalyticsEngine() || null;
  }

  getSocialNetworkEngine() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getSocialNetworkEngine() || null;
  }

  getPrimeBrokerageEngine() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getPrimeBrokerageEngine() || null;
  }

  getAlgorithmicTradingEngine() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getAlgorithmicTradingEngine() || null;
  }

  getPortfolioAttributionEngine() {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getPortfolioAttributionEngine() || null;
  }

  async getAdvancedTradingSignals(): Promise<any[]> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();

    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      console.log('📈 Getting advanced trading signals...');

      const signalsMap = await systemIntegration.getAdvancedTradingSignals();
      const signals = Array.from(signalsMap.values());

      console.log(`✅ Retrieved ${signals.length} advanced trading signals`);
      return signals;

    } catch (error) {
      console.error('❌ Failed to get advanced trading signals:', error);
      throw error;
    }
  }

  async generateAdvancedTradingSignal(symbol: string): Promise<any> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();

    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      console.log(`🎯 Generating advanced trading signal for ${symbol}...`);

      const signal = await systemIntegration.generateAdvancedTradingSignal(symbol);

      console.log(`✅ Advanced trading signal generated for ${symbol}: ${signal.signal.action} with ${(signal.signal.confidence * 100).toFixed(1)}% confidence`);
      return signal;

    } catch (error) {
      console.error(`❌ Failed to generate advanced trading signal for ${symbol}:`, error);
      throw error;
    }
  }

  async getAdvancedAlerts(): Promise<any[]> {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();

    if (!systemIntegration) {
      throw new Error('System Integration not initialized. Call EnhancedWingZeroAPI.initializeSystemIntegration() first');
    }

    try {
      console.log('🚨 Getting advanced alerts...');

      const alertsMap = await systemIntegration.getAdvancedAlerts();
      const alerts = Array.from(alertsMap.values());

      console.log(`✅ Retrieved ${alerts.length} advanced alerts`);
      return alerts;

    } catch (error) {
      console.error('❌ Failed to get advanced alerts:', error);
      throw error;
    }
  }

  async getCopyTradingSignals(traderId?: string): Promise<any[]> {
    const copyEngine = this.getCopyTradingEngine();

    if (!copyEngine) {
      throw new Error('Copy Trading Engine not available. Ensure Phase 7 is enabled.');
    }

    try {
      console.log(`📋 Getting copy trading signals${traderId ? ` for trader ${traderId}` : ''}...`);

      const signals = traderId 
        ? await copyEngine.getTraderSignals(traderId)
        : await copyEngine.getAllActiveSignals();

      console.log(`✅ Retrieved ${signals.length} copy trading signals`);
      return signals;

    } catch (error) {
      console.error('❌ Failed to get copy trading signals:', error);
      throw error;
    }
  }

  async setupCopyTradingRelationship(followerId: string, traderId: string, options: any): Promise<string> {
    const copyEngine = this.getCopyTradingEngine();

    if (!copyEngine) {
      throw new Error('Copy Trading Engine not available. Ensure Phase 7 is enabled.');
    }

    try {
      console.log(`🔗 Setting up copy trading relationship: ${followerId} -> ${traderId}`);

      const relationshipId = await copyEngine.setupCopyRelationship(followerId, traderId, options);

      console.log(`✅ Copy trading relationship established: ${relationshipId}`);
      return relationshipId;

    } catch (error) {
      console.error('❌ Failed to setup copy trading relationship:', error);
      throw error;
    }
  }

  async getTraderPerformance(traderId: string, period?: string): Promise<any> {
    const analyticsEngine = this.getPerformanceAnalyticsEngine();

    if (!analyticsEngine) {
      throw new Error('Performance Analytics Engine not available. Ensure Phase 7 is enabled.');
    }

    try {
      console.log(`📊 Getting trader performance for ${traderId}${period ? ` (${period})` : ''}...`);

      const performance = await analyticsEngine.calculatePerformance(traderId, period);

      console.log(`✅ Retrieved performance data for ${traderId}`);
      return performance;

    } catch (error) {
      console.error(`❌ Failed to get trader performance for ${traderId}:`, error);
      throw error;
    }
  }

  async getTraderLeaderboard(category?: string, limit?: number): Promise<any[]> {
    const socialEngine = this.getSocialNetworkEngine();

    if (!socialEngine) {
      throw new Error('Social Network Engine not available. Ensure Phase 7 is enabled.');
    }

    try {
      console.log(`🏆 Getting trader leaderboard${category ? ` for ${category}` : ''}...`);

      const leaderboard = await socialEngine.getLeaderboard(category, limit);

      console.log(`✅ Retrieved leaderboard with ${leaderboard.length} traders`);
      return leaderboard;

    } catch (error) {
      console.error('❌ Failed to get trader leaderboard:', error);
      throw error;
    }
  }

  async submitAlgorithmicOrder(orderRequest: any): Promise<string> {
    const algoEngine = this.getAlgorithmicTradingEngine();

    if (!algoEngine) {
      throw new Error('Algorithmic Trading Engine not available. Ensure Phase 7 is enabled.');
    }

    try {
      console.log(`🤖 Submitting algorithmic order: ${orderRequest.algorithm.type} for ${orderRequest.symbol}`);

      const orderId = await algoEngine.submitAlgorithmicOrder(orderRequest);

      console.log(`✅ Algorithmic order submitted: ${orderId}`);
      return orderId;

    } catch (error) {
      console.error('❌ Failed to submit algorithmic order:', error);
      throw error;
    }
  }

  async getAlgorithmicOrders(status?: string): Promise<any[]> {
    const algoEngine = this.getAlgorithmicTradingEngine();

    if (!algoEngine) {
      throw new Error('Algorithmic Trading Engine not available. Ensure Phase 7 is enabled.');
    }

    try {
      console.log(`📋 Getting algorithmic orders${status ? ` with status ${status}` : ''}...`);

      const orders = status === 'active' 
        ? await algoEngine.getActiveOrders()
        : await algoEngine.getAllOrders();

      console.log(`✅ Retrieved ${orders.length} algorithmic orders`);
      return orders;

    } catch (error) {
      console.error('❌ Failed to get algorithmic orders:', error);
      throw error;
    }
  }

  async submitMultiPrimeOrder(orderRequest: any): Promise<string> {
    const primeEngine = this.getPrimeBrokerageEngine();

    if (!primeEngine) {
      throw new Error('Prime Brokerage Engine not available. Ensure Phase 7 is enabled.');
    }

    try {
      console.log(`🏛️ Submitting multi-prime order for ${orderRequest.symbol}`);

      const orderId = await primeEngine.submitMultiPrimeOrder(orderRequest);

      console.log(`✅ Multi-prime order submitted: ${orderId}`);
      return orderId;

    } catch (error) {
      console.error('❌ Failed to submit multi-prime order:', error);
      throw error;
    }
  }

  async performPortfolioAttribution(portfolioId: string, benchmarkId: string, period: any): Promise<string> {
    const attributionEngine = this.getPortfolioAttributionEngine();

    if (!attributionEngine) {
      throw new Error('Portfolio Attribution Engine not available. Ensure Phase 7 is enabled.');
    }

    try {
      console.log(`📊 Performing portfolio attribution analysis for ${portfolioId} vs ${benchmarkId}`);

      const analysisId = await attributionEngine.performAttributionAnalysis(portfolioId, benchmarkId, period);

      console.log(`✅ Portfolio attribution analysis completed: ${analysisId}`);
      return analysisId;

    } catch (error) {
      console.error('❌ Failed to perform portfolio attribution:', error);
      throw error;
    }
  }

  async getPortfolioComparison(portfolioId: string, benchmarkIds: string[], period: any): Promise<string> {
    const attributionEngine = this.getPortfolioAttributionEngine();

    if (!attributionEngine) {
      throw new Error('Portfolio Attribution Engine not available. Ensure Phase 7 is enabled.');
    }

    try {
      console.log(`📈 Performing portfolio comparison for ${portfolioId}`);

      const comparisonId = await attributionEngine.performPerformanceComparison(portfolioId, benchmarkIds, period);

      console.log(`✅ Portfolio comparison completed: ${comparisonId}`);
      return comparisonId;

    } catch (error) {
      console.error('❌ Failed to perform portfolio comparison:', error);
      throw error;
    }
  }

  getAdvancedFeaturesHealth(): any {
    const systemIntegration = EnhancedWingZeroAPI.getSystemIntegration();
    return systemIntegration?.getAdvancedFeaturesHealth() || {
      isRunning: false,
      overallStatus: 'offline',
      components: {},
      metrics: {},
      lastUpdate: 0
    };
  }
}