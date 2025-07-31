import { WingZeroSystemIntegration } from './WingZeroSystemIntegration';
import { WingZeroConfig } from '@/types/wingzero';
import { BrokerCredentials } from '@/types/broker';

interface WingZeroSystemConfig {
  wingZeroConfig: WingZeroConfig;
  brokerCredentials: BrokerCredentials;
  enablePerformanceMonitoring?: boolean;
  enableSAWAutomation?: boolean;
  autoRecoveryEnabled?: boolean;
  healthCheckInterval?: number;
}

export class WingZeroSystemManager {
  private static instance: WingZeroSystemManager | null = null;
  private systemIntegration: WingZeroSystemIntegration | null = null;
  private isInitialized = false;
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();

  private constructor() {}

  static getInstance(): WingZeroSystemManager {
    if (!WingZeroSystemManager.instance) {
      WingZeroSystemManager.instance = new WingZeroSystemManager();
    }
    return WingZeroSystemManager.instance;
  }

  async initialize(config: WingZeroSystemConfig): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Wing Zero System already initialized');
      return;
    }

    console.log('🚀 Initializing Wing Zero Enhanced System Manager...');

    try {
      const systemConfig = {
        wingZeroConfig: config.wingZeroConfig,
        brokerCredentials: config.brokerCredentials,
        enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true,
        enableSAWAutomation: config.enableSAWAutomation ?? true,
        maxConcurrentOperations: 10,
        healthCheckInterval: config.healthCheckInterval ?? 30000,
        autoRecoveryEnabled: config.autoRecoveryEnabled ?? true
      };

      this.systemIntegration = new WingZeroSystemIntegration(systemConfig);
      
      // Set up event forwarding
      this.setupEventForwarding();
      
      await this.systemIntegration.initialize();
      this.isInitialized = true;

      console.log('✅ Wing Zero Enhanced System Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Wing Zero System Manager:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized || !this.systemIntegration) {
      throw new Error('System must be initialized before starting');
    }

    console.log('🚀 Starting Wing Zero Enhanced System...');
    await this.systemIntegration.start();
    
    this.emitEvent('system:ready', {
      timestamp: Date.now(),
      message: 'Wing Zero Enhanced System is ready for trading'
    });
    
    console.log('✅ Wing Zero Enhanced System started successfully');
  }

  async stop(): Promise<void> {
    if (!this.systemIntegration) {
      return;
    }

    console.log('🛑 Stopping Wing Zero Enhanced System...');
    await this.systemIntegration.stop();
    
    this.emitEvent('system:stopped', {
      timestamp: Date.now(),
      message: 'Wing Zero Enhanced System stopped'
    });
    
    console.log('✅ Wing Zero Enhanced System stopped');
  }

  private setupEventForwarding(): void {
    if (!this.systemIntegration) return;

    // Forward system events to external listeners
    this.systemIntegration.on('system:started', (data) => {
      this.emitEvent('system:started', data);
    });

    this.systemIntegration.on('system:stopped', (data) => {
      this.emitEvent('system:stopped', data);
    });

    this.systemIntegration.on('health:updated', (data) => {
      this.emitEvent('health:updated', data);
    });

    this.systemIntegration.on('system:recovery', (data) => {
      this.emitEvent('system:recovery', data);
    });

    this.systemIntegration.on('system:recovery_failed', (data) => {
      this.emitEvent('system:recovery_failed', data);
    });
  }

  // Public API methods that wrap the system integration
  async processWithdrawal(accountId: string, amount: number, metadata: any = {}): Promise<string> {
    if (!this.systemIntegration) {
      throw new Error('System not initialized');
    }
    return this.systemIntegration.processWithdrawal(accountId, amount, metadata);
  }

  async getMarketData(symbols: string[]): Promise<any> {
    if (!this.systemIntegration) {
      throw new Error('System not initialized');
    }
    return this.systemIntegration.getMarketData(symbols);
  }

  async getCurrentThreshold(symbol: string): Promise<number | null> {
    if (!this.systemIntegration) {
      return null;
    }
    return this.systemIntegration.getCurrentThreshold(symbol);
  }

  getSystemHealth(): any {
    if (!this.systemIntegration) {
      return null;
    }
    return this.systemIntegration.getSystemHealth();
  }

  getSystemMetrics(): any {
    if (!this.systemIntegration) {
      return null;
    }
    return this.systemIntegration.getSystemMetrics();
  }

  isSystemRunning(): boolean {
    return this.systemIntegration?.isSystemRunning() ?? false;
  }

  // Event system
  on(event: string, handler: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emitEvent(event: string, data: any): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Event handler error for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods for debugging and monitoring
  async forceHealthCheck(): Promise<any> {
    if (!this.systemIntegration) {
      return null;
    }
    // This would trigger a manual health check
    return this.getSystemHealth();
  }

  async restartSystem(): Promise<void> {
    console.log('🔄 Restarting Wing Zero System...');
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await this.start();
    console.log('✅ Wing Zero System restarted successfully');
  }

  // Factory method for easy initialization from config
  static async createFromConfig(config: WingZeroSystemConfig): Promise<WingZeroSystemManager> {
    const manager = WingZeroSystemManager.getInstance();
    await manager.initialize(config);
    return manager;
  }

  // Integration helpers for existing codebase
  static async initializeForTradingEngine(
    wingZeroConfig: WingZeroConfig,
    brokerCredentials: BrokerCredentials
  ): Promise<WingZeroSystemManager> {
    const config: WingZeroSystemConfig = {
      wingZeroConfig,
      brokerCredentials,
      enablePerformanceMonitoring: true,
      enableSAWAutomation: true,
      autoRecoveryEnabled: true,
      healthCheckInterval: 30000
    };

    const manager = await WingZeroSystemManager.createFromConfig(config);
    await manager.start();
    return manager;
  }

  // Method to get a simple status for UI display
  getSimpleStatus(): {
    status: 'offline' | 'starting' | 'running' | 'error';
    message: string;
    uptime?: number;
  } {
    if (!this.isInitialized) {
      return {
        status: 'offline',
        message: 'System not initialized'
      };
    }

    if (!this.isSystemRunning()) {
      return {
        status: 'starting',
        message: 'System initializing...'
      };
    }

    const health = this.getSystemHealth();
    const metrics = this.getSystemMetrics();

    if (!health) {
      return {
        status: 'error',
        message: 'Unable to get system status'
      };
    }

    switch (health.overall) {
      case 'healthy':
        return {
          status: 'running',
          message: 'All systems operational',
          uptime: metrics?.uptime
        };
      case 'degraded':
        return {
          status: 'running',
          message: 'Running with some issues',
          uptime: metrics?.uptime
        };
      case 'critical':
        return {
          status: 'error',
          message: 'Critical issues detected',
          uptime: metrics?.uptime
        };
      default:
        return {
          status: 'offline',
          message: 'System offline'
        };
    }
  }
}