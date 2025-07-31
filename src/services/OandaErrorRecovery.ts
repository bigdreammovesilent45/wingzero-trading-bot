export interface RetryConfig {
  retryAttempts: number;
  retryDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  circuitBreakerThreshold: number;
  timeout: number;
}

export class CircuitBreaker {
  private failures = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private nextAttempt = 0;
  private readonly threshold: number;
  private readonly timeout: number;

  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  getState() {
    return this.state;
  }
}

export class OandaErrorRecovery {
  private static instance: OandaErrorRecovery;
  private circuitBreaker: CircuitBreaker;
  private defaultConfig: RetryConfig = {
    retryAttempts: 3,
    retryDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    circuitBreakerThreshold: 5,
    timeout: 30000
  };

  private constructor() {
    this.circuitBreaker = new CircuitBreaker(
      this.defaultConfig.circuitBreakerThreshold,
      this.defaultConfig.timeout
    );
  }

  static getInstance(): OandaErrorRecovery {
    if (!OandaErrorRecovery.instance) {
      OandaErrorRecovery.instance = new OandaErrorRecovery();
    }
    return OandaErrorRecovery.instance;
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    return this.circuitBreaker.execute(async () => {
      let lastError: Error;
      
      for (let attempt = 1; attempt <= finalConfig.retryAttempts; attempt++) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Operation timeout')), finalConfig.timeout);
          });
          
          const operationPromise = operation();
          const result = await Promise.race([operationPromise, timeoutPromise]);
          
          console.log(`✅ OANDA operation succeeded on attempt ${attempt}`);
          return result;
        } catch (error) {
          lastError = error as Error;
          console.warn(`⚠️ OANDA operation failed on attempt ${attempt}:`, error);
          
          if (attempt < finalConfig.retryAttempts) {
            const delay = Math.min(
              finalConfig.retryDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
              finalConfig.maxDelay
            );
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      throw new Error(`OANDA operation failed after ${finalConfig.retryAttempts} attempts: ${lastError.message}`);
    });
  }

  async oandaApiCall<T>(
    url: string,
    options: RequestInit,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    return this.withRetry(async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        // Handle specific OANDA error codes
        if (response.status === 401) {
          throw new Error('OANDA API authentication failed - check credentials');
        }
        if (response.status === 429) {
          throw new Error('OANDA API rate limit exceeded');
        }
        if (response.status >= 500) {
          throw new Error(`OANDA API server error: ${response.status}`);
        }
        
        const errorText = await response.text();
        throw new Error(`OANDA API error: ${response.status} - ${errorText}`);
      }
      
      return response.json();
    }, config);
  }

  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  // Health check method for monitoring
  async healthCheck(baseUrl: string, apiKey: string, accountId: string): Promise<boolean> {
    try {
      await this.oandaApiCall(
        `${baseUrl}/v3/accounts/${accountId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
        { retryAttempts: 1, timeout: 5000 }
      );
      return true;
    } catch (error) {
      console.error('OANDA health check failed:', error);
      return false;
    }
  }
}

// WebSocket connection manager for OANDA
export class OandaWebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private url: string;
  private apiKey: string;
  private onMessage?: (data: any) => void;
  private onError?: (error: Error) => void;

  constructor(url: string, apiKey: string) {
    this.url = url;
    this.apiKey = apiKey;
  }

  connect(onMessage?: (data: any) => void, onError?: (error: Error) => void) {
    this.onMessage = onMessage;
    this.onError = onError;
    
    try {
      this.ws = new WebSocket(this.url, [], {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      this.ws.onopen = () => {
        console.log('✅ OANDA WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        if (this.onMessage) {
          try {
            const data = JSON.parse(event.data);
            this.onMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ OANDA WebSocket error:', error);
        if (this.onError) {
          this.onError(new Error('WebSocket connection error'));
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 OANDA WebSocket disconnected');
        this.stopHeartbeat();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (this.onError) {
        this.onError(error as Error);
      }
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      if (this.onError) {
        this.onError(new Error('Max reconnection attempts reached'));
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(this.onMessage, this.onError);
    }, delay);
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}