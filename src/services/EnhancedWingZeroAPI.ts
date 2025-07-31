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
}