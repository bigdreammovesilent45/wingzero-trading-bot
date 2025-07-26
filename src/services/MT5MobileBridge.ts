/**
 * MT5 Mobile Bridge Service
 * Facilitates communication between Wing Zero web app and MT5 Mobile app
 * Uses WebSocket for real-time communication and REST API for commands
 */

export interface MT5MobileConfig {
  bridgeUrl: string; // Local bridge server URL (e.g., http://localhost:8080)
  apiKey?: string;
  deviceId?: string;
}

export interface MobileTradeRequest {
  action: 'buy' | 'sell' | 'close';
  symbol: string;
  volume: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  ticket?: number; // For closing positions
  comment?: string;
}

export interface MobileTradeResponse {
  success: boolean;
  ticket?: number;
  error?: string;
  executionPrice?: number;
}

export class MT5MobileBridge {
  private config: MT5MobileConfig;
  private wsConnection: WebSocket | null = null;
  private isConnected = false;
  private messageQueue: any[] = [];
  private responseCallbacks = new Map<string, (data: any) => void>();

  constructor(config: MT5MobileConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      // Test bridge server availability
      const testResponse = await fetch(`${this.config.bridgeUrl}/status`);
      if (!testResponse.ok) {
        throw new Error('Bridge server not available');
      }

      // Establish WebSocket connection
      await this.connectWebSocket();
      
      this.isConnected = true;
      console.log('MT5 Mobile Bridge connected successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect MT5 Mobile Bridge:', error);
      return false;
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.config.bridgeUrl.replace('http', 'ws') + '/ws';
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        console.log('MT5 Mobile WebSocket connected');
        this.processMessageQueue();
        resolve();
      };

      this.wsConnection.onmessage = (event) => {
        this.handleWebSocketMessage(event.data);
      };

      this.wsConnection.onclose = () => {
        console.log('MT5 Mobile WebSocket disconnected');
        this.isConnected = false;
        // Attempt reconnection after 5 seconds
        setTimeout(() => this.reconnect(), 5000);
      };

      this.wsConnection.onerror = (error) => {
        console.error('MT5 Mobile WebSocket error:', error);
        reject(error);
      };

      // Connection timeout
      setTimeout(() => {
        if (this.wsConnection?.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
    });
  }

  private async reconnect(): Promise<void> {
    if (!this.isConnected) {
      console.log('Attempting to reconnect MT5 Mobile Bridge...');
      await this.connect();
    }
  }

  private handleWebSocketMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      // Handle response callbacks
      if (message.id && this.responseCallbacks.has(message.id)) {
        const callback = this.responseCallbacks.get(message.id);
        callback?.(message);
        this.responseCallbacks.delete(message.id);
        return;
      }

      // Handle real-time updates
      this.handleRealTimeUpdate(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleRealTimeUpdate(message: any): void {
    switch (message.type) {
      case 'position_update':
        // Emit position update event
        this.emitEvent('positionUpdate', message.data);
        break;
      case 'price_update':
        // Emit price update event
        this.emitEvent('priceUpdate', message.data);
        break;
      case 'account_update':
        // Emit account update event
        this.emitEvent('accountUpdate', message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private emitEvent(eventType: string, data: any): void {
    // Dispatch custom events for the application to listen to
    const event = new CustomEvent(`mt5Mobile_${eventType}`, { detail: data });
    window.dispatchEvent(event);
  }

  async executeTrade(tradeRequest: MobileTradeRequest): Promise<MobileTradeResponse> {
    if (!this.isConnected) {
      throw new Error('MT5 Mobile Bridge not connected');
    }

    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId();
      const message = {
        id: messageId,
        type: 'trade_request',
        data: tradeRequest,
        timestamp: Date.now()
      };

      // Set up response callback
      this.responseCallbacks.set(messageId, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Trade execution failed'));
        }
      });

      // Send message
      this.sendMessage(message);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.responseCallbacks.has(messageId)) {
          this.responseCallbacks.delete(messageId);
          reject(new Error('Trade execution timeout'));
        }
      }, 30000);
    });
  }

  async getAccountInfo(): Promise<any> {
    return this.sendCommand('get_account_info');
  }

  async getPositions(): Promise<any[]> {
    return this.sendCommand('get_positions');
  }

  async getMarketData(symbols: string[]): Promise<any[]> {
    return this.sendCommand('get_market_data', { symbols });
  }

  private async sendCommand(command: string, params?: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('MT5 Mobile Bridge not connected');
    }

    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId();
      const message = {
        id: messageId,
        type: 'command',
        command,
        params,
        timestamp: Date.now()
      };

      this.responseCallbacks.set(messageId, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Command failed'));
        }
      });

      this.sendMessage(message);

      setTimeout(() => {
        if (this.responseCallbacks.has(messageId)) {
          this.responseCallbacks.delete(messageId);
          reject(new Error('Command timeout'));
        }
      }, 15000);
    });
  }

  private sendMessage(message: any): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(message));
    } else {
      // Queue message for later
      this.messageQueue.push(message);
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    console.log('MT5 Mobile Bridge disconnected');
  }

  getStatus() {
    return {
      connected: this.isConnected,
      bridgeUrl: this.config.bridgeUrl,
      websocketReady: this.wsConnection?.readyState === WebSocket.OPEN
    };
  }

  // Event listener helpers
  onPositionUpdate(callback: (data: any) => void): () => void {
    const handler = (event: CustomEvent) => callback(event.detail);
    window.addEventListener('mt5Mobile_positionUpdate', handler as EventListener);
    return () => window.removeEventListener('mt5Mobile_positionUpdate', handler as EventListener);
  }

  onPriceUpdate(callback: (data: any) => void): () => void {
    const handler = (event: CustomEvent) => callback(event.detail);
    window.addEventListener('mt5Mobile_priceUpdate', handler as EventListener);
    return () => window.removeEventListener('mt5Mobile_priceUpdate', handler as EventListener);
  }

  onAccountUpdate(callback: (data: any) => void): () => void {
    const handler = (event: CustomEvent) => callback(event.detail);
    window.addEventListener('mt5Mobile_accountUpdate', handler as EventListener);
    return () => window.removeEventListener('mt5Mobile_accountUpdate', handler as EventListener);
  }
}