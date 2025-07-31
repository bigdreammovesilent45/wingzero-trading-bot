import { EnhancedWingZeroAPI } from './EnhancedWingZeroAPI';
import { EnhancedOandaBrokerService } from './EnhancedOandaBrokerService';
import { EnhancedMarketDataService } from './EnhancedMarketDataService';
import { EnhancedPerformanceProfiler } from './EnhancedPerformanceProfiler';
import { EnhancedSAWAutomationEngine } from './EnhancedSAWAutomationEngine';
import { WingZeroConfig } from '@/types/wingzero';
import { BrokerCredentials, BrokerConnection } from '@/types/broker';

interface SystemConfiguration {
  wingZeroConfig: WingZeroConfig;
  brokerCredentials: BrokerCredentials;
  enablePerformanceMonitoring: boolean;
  enableSAWAutomation: boolean;
  maxConcurrentOperations: number;
  healthCheckInterval: number;
  autoRecoveryEnabled: boolean;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical' | 'offline';
  components: {
    wingZeroAPI: {
      status: string;
      circuitBreaker: any;
      reconnectAttempts: number;
      tokenStatus: any;
    };
    oandaBroker: {
      status: string;
      circuitBreaker: any;
      credentials: any;
    };
    marketData: {
      isConnected: boolean;
      primaryStatus: string;
      backupStatus: string;
      performanceMetrics: any;
    };
    performance: {
      isMonitoring: boolean;
      memoryTrend: string;
      cpuUsage: number;
      leakDetection: any[];
    };
    sawEngine: {
      isRunning: boolean;
      activeTransactions: number;
      completedJobs: number;
      averageTransactionTime: number;
    };
  };
  lastHealthCheck: number;
}

interface SystemMetrics {
  uptime: number;
  totalApiCalls: number;
  successfulApiCalls: number;
  failedApiCalls: number;
  averageResponseTime: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  memoryUsage: number;
  cpuUsage: number;
  dataQuality: number;
}

export class WingZeroSystemIntegration {
  private config: SystemConfiguration;
  private isInitialized = false;
  private isRunning = false;
  private startTime = 0;

  // Core services
  private wingZeroAPI: EnhancedWingZeroAPI | null = null;
  private oandaBroker: EnhancedOandaBrokerService | null = null;
  private marketDataService: EnhancedMarketDataService | null = null;
  private performanceProfiler: EnhancedPerformanceProfiler | null = null;
  private sawEngine: EnhancedSAWAutomationEngine | null = null;

  // System monitoring
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private systemHealth: SystemHealth | null = null;
  private metrics: SystemMetrics;

  // Event handlers
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();

  constructor(config: SystemConfiguration) {
    this.config = config;
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    this.metrics = {
      uptime: 0,
      totalApiCalls: 0,
      successfulApiCalls: 0,
      failedApiCalls: 0,
      averageResponseTime: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      dataQuality: 0
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Wing Zero System already initialized');
      return;
    }

    console.log('🚀 Initializing Wing Zero Enhanced System...');

    try {
      // Initialize core services
      await this.initializeWingZeroAPI();
      await this.initializeOandaBroker();
      await this.initializeMarketDataService();
      
      if (this.config.enablePerformanceMonitoring) {
        await this.initializePerformanceProfiler();
      }
      
      if (this.config.enableSAWAutomation) {
        await this.initializeSAWEngine();
      }

      // Set up service integrations
      await this.setupServiceIntegrations();

      this.isInitialized = true;
      console.log('✅ Wing Zero Enhanced System initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Wing Zero System:', error);
      await this.cleanup();
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('System must be initialized before starting');
    }

    if (this.isRunning) {
      console.log('⚠️ Wing Zero System already running');
      return;
    }

    console.log('🚀 Starting Wing Zero Enhanced System...');
    this.startTime = Date.now();

    try {
      // Start market data service first (provides data to other services)
      if (this.marketDataService) {
        await this.marketDataService.start();
        console.log('✅ Market Data Service started');
      }

      // Start performance monitoring
      if (this.performanceProfiler) {
        await this.performanceProfiler.startProfiling();
        console.log('✅ Performance Profiler started');
      }

      // Start S.A.W. automation engine
      if (this.sawEngine) {
        await this.sawEngine.start();
        console.log('✅ S.A.W. Automation Engine started');
      }

      // Start health monitoring
      this.startHealthMonitoring();

      this.isRunning = true;
      this.emitEvent('system:started', { timestamp: Date.now() });
      
      console.log('✅ Wing Zero Enhanced System started successfully');

    } catch (error) {
      console.error('❌ Failed to start Wing Zero System:', error);
      await this.stop();
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping Wing Zero Enhanced System...');

    // Stop health monitoring
    this.stopHealthMonitoring();

    // Stop services in reverse order
    if (this.sawEngine) {
      await this.sawEngine.stop();
      console.log('✅ S.A.W. Automation Engine stopped');
    }

    if (this.performanceProfiler) {
      await this.performanceProfiler.stopProfiling();
      console.log('✅ Performance Profiler stopped');
    }

    if (this.marketDataService) {
      await this.marketDataService.stop();
      console.log('✅ Market Data Service stopped');
    }

    // Disconnect WebSocket connections
    if (this.wingZeroAPI) {
      await this.wingZeroAPI.disconnectWebSocket();
    }

    this.isRunning = false;
    this.emitEvent('system:stopped', { timestamp: Date.now() });
    
    console.log('✅ Wing Zero Enhanced System stopped successfully');
  }

  // Service initialization methods
  private async initializeWingZeroAPI(): Promise<void> {
    this.wingZeroAPI = new EnhancedWingZeroAPI(this.config.wingZeroConfig);
    
    // Test connection
    const isConnected = await this.wingZeroAPI.testConnection();
    if (!isConnected) {
      console.log('⚠️ Wing Zero API connection test failed, will retry during operations');
    }
  }

  private async initializeOandaBroker(): Promise<void> {
    this.oandaBroker = new EnhancedOandaBrokerService();
    await this.oandaBroker.initialize(this.config.brokerCredentials);
  }

  private async initializeMarketDataService(): Promise<void> {
    this.marketDataService = new EnhancedMarketDataService();
    
    const brokerConnection: BrokerConnection = {
      name: 'OANDA',
      type: this.config.brokerCredentials.brokerType as any,
      server: this.config.brokerCredentials.environment === 'demo' 
        ? 'https://api-fxpractice.oanda.com'
        : 'https://api-fxtrade.oanda.com',
      credentials: this.config.brokerCredentials
    };
    
    await this.marketDataService.setBrokerConnection(brokerConnection);
  }

  private async initializePerformanceProfiler(): Promise<void> {
    this.performanceProfiler = new EnhancedPerformanceProfiler();
  }

  private async initializeSAWEngine(): Promise<void> {
    this.sawEngine = new EnhancedSAWAutomationEngine({
      thresholdUpdateInterval: 30000,
      maxVolatilityMultiplier: 3.0,
      minThresholdAmount: 10,
      maxThresholdAmount: 10000,
      transactionTimeout: 30000,
      jobProcessingInterval: 5000,
      maxConcurrentJobs: 5
    });
  }

  // Service integration setup
  private async setupServiceIntegrations(): Promise<void> {
    console.log('🔗 Setting up service integrations...');

    // Market data to S.A.W. integration
    if (this.marketDataService && this.sawEngine) {
      // Subscribe to market data for volatility analysis
      const symbols = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD', 'BTC_USD'];
      
      symbols.forEach(symbol => {
        this.marketDataService!.subscribe(symbol, (tickData) => {
          // Market data will be used by S.A.W. for threshold calculations
          // This is handled internally by the S.A.W. engine's market analysis
        });
      });
    }

    // Performance monitoring integration
    if (this.performanceProfiler && this.config.autoRecoveryEnabled) {
      // Set up performance thresholds for auto-recovery
      this.performanceProfiler.setThresholds({
        memoryMB: 500,
        cpuPercent: 80,
        minFPS: 30,
        maxRenderTime: 20
      });
    }

    console.log('✅ Service integrations configured');
  }

  // Health monitoring
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);

    console.log('💓 Health monitoring started');
  }

  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const health: SystemHealth = {
        overall: 'healthy',
        components: {
          wingZeroAPI: await this.getWingZeroAPIHealth(),
          oandaBroker: await this.getOandaBrokerHealth(),
          marketData: await this.getMarketDataHealth(),
          performance: await this.getPerformanceHealth(),
          sawEngine: await this.getSAWEngineHealth()
        },
        lastHealthCheck: Date.now()
      };

      // Determine overall system health
      const componentStatuses = Object.values(health.components);
      const criticalIssues = componentStatuses.filter(c => 
        c.status === 'critical' || 
        c.status === 'offline' || 
        c.isConnected === false ||
        c.isRunning === false
      );

      if (criticalIssues.length > 0) {
        health.overall = 'critical';
      } else {
        const degradedIssues = componentStatuses.filter(c => c.status === 'degraded');
        if (degradedIssues.length > 0) {
          health.overall = 'degraded';
        }
      }

      this.systemHealth = health;
      this.updateMetrics();

      // Emit health status event
      this.emitEvent('health:updated', health);

      // Auto-recovery if enabled
      if (this.config.autoRecoveryEnabled && health.overall === 'critical') {
        await this.performAutoRecovery();
      }

    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.systemHealth = {
        overall: 'offline',
        components: {} as any,
        lastHealthCheck: Date.now()
      };
    }
  }

  private async getWingZeroAPIHealth(): Promise<any> {
    if (!this.wingZeroAPI) {
      return { status: 'offline', error: 'Not initialized' };
    }

    try {
      return await this.wingZeroAPI.getSystemHealth();
    } catch (error) {
      return { status: 'critical', error: error };
    }
  }

  private async getOandaBrokerHealth(): Promise<any> {
    if (!this.oandaBroker) {
      return { status: 'offline', error: 'Not initialized' };
    }

    try {
      return this.oandaBroker.getSystemHealth();
    } catch (error) {
      return { status: 'critical', error: error };
    }
  }

  private async getMarketDataHealth(): Promise<any> {
    if (!this.marketDataService) {
      return { status: 'offline', error: 'Not initialized' };
    }

    try {
      const connectionStatus = this.marketDataService.getConnectionStatus();
      const performanceMetrics = this.marketDataService.getPerformanceMetrics();
      
      return {
        ...connectionStatus,
        performanceMetrics,
        status: connectionStatus.isConnected ? 'healthy' : 'degraded'
      };
    } catch (error) {
      return { status: 'critical', error: error };
    }
  }

  private async getPerformanceHealth(): Promise<any> {
    if (!this.performanceProfiler) {
      return { status: 'offline', error: 'Not initialized' };
    }

    try {
      const report = this.performanceProfiler.getPerformanceReport();
      const isMonitoring = this.performanceProfiler.isMonitoringActive();
      
      return {
        isMonitoring,
        memoryTrend: report.memory.trend,
        cpuUsage: report.cpu.current?.cpuUsage || 0,
        leakDetection: report.leaks,
        status: report.leaks.length > 0 ? 'degraded' : 'healthy'
      };
    } catch (error) {
      return { status: 'critical', error: error };
    }
  }

  private async getSAWEngineHealth(): Promise<any> {
    if (!this.sawEngine) {
      return { status: 'offline', error: 'Not initialized' };
    }

    try {
      return this.sawEngine.getSystemStatus();
    } catch (error) {
      return { status: 'critical', error: error };
    }
  }

  // Auto-recovery mechanisms
  private async performAutoRecovery(): Promise<void> {
    console.log('🔄 Performing automatic system recovery...');

    try {
      // Reset circuit breakers
      if (this.wingZeroAPI) {
        this.wingZeroAPI.resetCircuitBreaker();
      }

      if (this.oandaBroker) {
        this.oandaBroker.resetCircuitBreaker();
      }

      // Force garbage collection if memory issues detected
      if (this.performanceProfiler) {
        const report = this.performanceProfiler.getPerformanceReport();
        if (report.memory.trend === 'increasing' || report.leaks.length > 0) {
          this.performanceProfiler.forceGarbageCollection();
        }
      }

      // Clear market data buffers if needed
      if (this.marketDataService) {
        this.marketDataService.forceCleanup();
      }

      console.log('✅ Auto-recovery completed');
      this.emitEvent('system:recovery', { timestamp: Date.now() });

    } catch (error) {
      console.error('❌ Auto-recovery failed:', error);
      this.emitEvent('system:recovery_failed', { error, timestamp: Date.now() });
    }
  }

  // Metrics and monitoring
  private updateMetrics(): void {
    if (!this.systemHealth) return;

    this.metrics.uptime = Date.now() - this.startTime;
    
    // Update from performance profiler
    if (this.performanceProfiler) {
      const report = this.performanceProfiler.getPerformanceReport();
      this.metrics.memoryUsage = report.memory.current?.heapUsed || 0;
      this.metrics.cpuUsage = report.cpu.current?.cpuUsage || 0;
    }

    // Update from market data service
    if (this.marketDataService) {
      const perfMetrics = this.marketDataService.getPerformanceMetrics();
      this.metrics.dataQuality = perfMetrics.dataQuality;
    }

    // Update from S.A.W. engine
    if (this.sawEngine) {
      const sawStatus = this.sawEngine.getSystemStatus();
      this.metrics.totalTransactions = sawStatus.processedTransactions;
      this.metrics.failedTransactions = sawStatus.failedTransactions;
      this.metrics.successfulTransactions = sawStatus.processedTransactions - sawStatus.failedTransactions;
    }
  }

  // Event system
  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emitEvent(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
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

  // Public API methods
  async processWithdrawal(accountId: string, amount: number, metadata: any = {}): Promise<string> {
    if (!this.sawEngine) {
      throw new Error('S.A.W. Automation Engine not available');
    }

    try {
      const transactionId = await this.sawEngine.processWithdrawal(accountId, amount, metadata);
      this.metrics.totalApiCalls++;
      this.metrics.successfulApiCalls++;
      return transactionId;
    } catch (error) {
      this.metrics.totalApiCalls++;
      this.metrics.failedApiCalls++;
      throw error;
    }
  }

  async getMarketData(symbols: string[]): Promise<any> {
    if (!this.wingZeroAPI) {
      throw new Error('Wing Zero API not available');
    }

    try {
      const startTime = Date.now();
      const data = await this.wingZeroAPI.getMarketData(symbols);
      const responseTime = Date.now() - startTime;
      
      this.updateResponseTime(responseTime);
      this.metrics.totalApiCalls++;
      this.metrics.successfulApiCalls++;
      
      return data;
    } catch (error) {
      this.metrics.totalApiCalls++;
      this.metrics.failedApiCalls++;
      throw error;
    }
  }

  async getCurrentThreshold(symbol: string): Promise<number | null> {
    if (!this.sawEngine) {
      return null;
    }
    
    return this.sawEngine.getCurrentThreshold(symbol);
  }

  getSystemHealth(): SystemHealth | null {
    return this.systemHealth;
  }

  getSystemMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  isSystemRunning(): boolean {
    return this.isRunning;
  }

  // Utility methods
  private updateResponseTime(responseTime: number): void {
    this.metrics.averageResponseTime = this.metrics.averageResponseTime === 0
      ? responseTime
      : (this.metrics.averageResponseTime * 0.9 + responseTime * 0.1);
  }

  private async cleanup(): Promise<void> {
    this.stopHealthMonitoring();
    
    if (this.isRunning) {
      await this.stop();
    }
    
    this.isInitialized = false;
    this.wingZeroAPI = null;
    this.oandaBroker = null;
    this.marketDataService = null;
    this.performanceProfiler = null;
    this.sawEngine = null;
  }

  // Factory method for easy setup
  static async createAndStart(config: SystemConfiguration): Promise<WingZeroSystemIntegration> {
    const system = new WingZeroSystemIntegration(config);
    await system.initialize();
    await system.start();
    return system;
  }
}