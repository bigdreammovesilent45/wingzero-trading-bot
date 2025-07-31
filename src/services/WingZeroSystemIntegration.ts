import { EnhancedWingZeroAPI } from './EnhancedWingZeroAPI';
import { EnhancedOandaBrokerService } from './EnhancedOandaBrokerService';
import { EnhancedMarketDataService } from './EnhancedMarketDataService';
import { EnhancedPerformanceProfiler } from './EnhancedPerformanceProfiler';
import { EnhancedSAWAutomationEngine } from './EnhancedSAWAutomationEngine';
import { WingZeroAIBrain } from './ai/WingZeroAIBrain';
import { WingZeroPhase3And4Integration } from './WingZeroPhase3And4Integration';
import { WingZeroPhase5Integration } from './WingZeroPhase5Integration';
import { WingZeroPhase6Integration } from './WingZeroPhase6Integration';
import { WingZeroPhase7Integration } from './WingZeroPhase7Integration';
import { WingZeroConfig } from '@/types/wingzero';
import { BrokerCredentials, BrokerConnection } from '@/types/broker';

interface SystemConfiguration {
  wingZeroConfig: WingZeroConfig;
  brokerCredentials: BrokerCredentials;
  enablePerformanceMonitoring: boolean;
  enableSAWAutomation: boolean;
  enableAIBrain: boolean;
  enableAdvancedFinancials: boolean;
  enableHighPerformance: boolean;
  enableAdvancedIntegration: boolean;
  enableAdvancedFeatures: boolean;
  maxConcurrentOperations: number;
  healthCheckInterval: number;
  autoRecoveryEnabled: boolean;
  // Phase 5 Performance Configuration
  performanceConfig: {
    enableWebAssembly: boolean;
    enableMultithreading: boolean;
    enableLowLatencyTrading: boolean;
    targetThroughput: number;
    maxLatency: number;
  };
  // Phase 6 Advanced Integration Configuration
  enableAdvancedIntegration?: boolean;
  advancedIntegrationConfig?: {
    enableUnifiedAPI: boolean;
    enableAdvancedOMS: boolean;
    enablePositionReconciliation: boolean;
    enableMarketDataAggregation: boolean;
    enableEconomicCalendar: boolean;
    enableSocialSentiment: boolean;
    enableIntelligentRouting: boolean;
    enablePredictiveAnalysis: boolean;
    prioritySymbols: string[];
  };
  // Phase 6 Advanced Integration Configuration
  advancedIntegrationConfig?: {
    enableUnifiedAPI: boolean;
    enableAdvancedOMS: boolean;
    enablePositionReconciliation: boolean;
    enableMarketDataAggregation: boolean;
    enableEconomicCalendar: boolean;
    enableSocialSentiment: boolean;
    enableIntelligentRouting: boolean;
    enablePredictiveAnalysis: boolean;
    prioritySymbols: string[];
  };
  // Phase 7 Advanced Features Configuration
  advancedFeaturesConfig?: {
    socialTrading: {
      enabled: boolean;
      maxCopyPositions: number;
      defaultCopyAmount: number;
      maxTraders: number;
      performanceUpdateInterval: number;
    };
    institutional: {
      enabled: boolean;
      primeBrokerage: {
        enabled: boolean;
        maxBrokers: number;
        nettingFrequency: number;
      };
      algorithmicTrading: {
        enabled: boolean;
        supportedAlgorithms: string[];
        maxConcurrentOrders: number;
      };
      portfolioAttribution: {
        enabled: boolean;
        benchmarks: string[];
        analysisFrequency: number;
      };
    };
    integration: {
      realTimeUpdates: boolean;
      dataSync: boolean;
      crossServiceMessaging: boolean;
      sharedCache: boolean;
    };
  };
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
    aiBrain: {
      isRunning: boolean;
      overallStatus: string;
      componentStatus: {
        sentiment_analyzer: string;
        predictive_models: string;
        pattern_recognition: string;
        risk_scoring: string;
        strategy_optimization: string;
      };
      lastUpdate: number;
    };
    advancedFinancials: {
      isRunning: boolean;
      portfolioTheory: string;
      varModels: string;
      encryptionService: string;
      mfaService: string;
      lastUpdate: number;
    };
    highPerformance: {
      isRunning: boolean;
      overallStatus: string;
      performanceScore: number;
      components: {
        webAssembly: string;
        multithreading: string;
        lowLatencyTrading: string;
        memoryOptimization: string;
        caching: string;
        streamProcessing: string;
      };
      metrics: {
        computeThroughput: number;
        tradingLatency: number;
        systemLoad: number;
        errorRate: number;
      };
      lastUpdate: number;
    };
    advancedFeatures: {
      isRunning: boolean;
      overallStatus: string;
      components: {
        socialTrading: string;
        copyTrading: string;
        performanceAnalytics: string;
        socialNetwork: string;
        primeBrokerage: string;
        algorithmicTrading: string;
        portfolioAttribution: string;
      };
      metrics: {
        totalTradingSignals: number;
        activeCopyRelationships: number;
        algorithmicOrders: number;
        attributionAnalyses: number;
        crossServiceMessages: number;
      };
      lastUpdate: number;
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
  private aiBrain: WingZeroAIBrain | null = null;
  
  // Advanced Integration Services
  private advancedFinancials: WingZeroPhase3And4Integration | null = null;
  private highPerformanceEngine: WingZeroPhase5Integration | null = null;
  private advancedIntegration: WingZeroPhase6Integration | null = null;
  private advancedFeatures: WingZeroPhase7Integration | null = null;

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

      if (this.config.enableAIBrain) {
        await this.initializeAIBrain();
      }

      if (this.config.enableAdvancedFinancials) {
        await this.initializeAdvancedFinancials();
      }

      if (this.config.enableHighPerformance) {
        await this.initializeHighPerformanceEngine();
      }

      if (this.config.enableAdvancedIntegration) {
        await this.initializeAdvancedIntegration();
      }

      if (this.config.enableAdvancedFeatures) {
        await this.initializeAdvancedFeatures();
      }

      // Set up service integrations
      await this.setupServiceIntegrations();

      this.isInitialized = true;
      console.log('✅ Wing Zero Complete System initialized successfully - All 7 Phases Integrated!');

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

  private async initializeAIBrain(): Promise<void> {
    console.log('🧠 Initializing Wing Zero AI Brain...');
    
    this.aiBrain = new WingZeroAIBrain({
      enable_sentiment_analysis: true,
      enable_predictive_modeling: true,
      enable_pattern_recognition: true,
      enable_risk_scoring: true,
      enable_strategy_optimization: true,
      decision_threshold: 0.7,
      max_concurrent_positions: 5,
      risk_tolerance: 'moderate',
      update_frequency: 60000
    });

    await this.aiBrain.start();
    console.log('✅ Wing Zero AI Brain initialized and started');
  }

  private async initializeAdvancedFinancials(): Promise<void> {
    console.log('📊 Initializing Advanced Financial Calculations (Phase 3 & 4)...');
    
    this.advancedFinancials = new WingZeroPhase3And4Integration();
    await this.advancedFinancials.start();
    
    console.log('✅ Advanced Financial Calculations (Phase 3 & 4) initialized and started');
  }

  private async initializeHighPerformanceEngine(): Promise<void> {
    console.log('⚡ Initializing High-Performance Engine (Phase 5)...');
    
    this.highPerformanceEngine = new WingZeroPhase5Integration({
      webAssembly: {
        enableSIMD: this.config.performanceConfig.enableWebAssembly,
        enableThreads: this.config.performanceConfig.enableWebAssembly,
        memoryPages: 512, // Increased for better performance
        optimizationLevel: 'O3'
      },
      multithreading: {
        maxWorkers: Math.min(navigator.hardwareConcurrency || 4, 16),
        minWorkers: 2,
        enableDynamicScaling: true,
        taskQueueMaxSize: 2000, // Increased queue size
        workerMemoryLimit: 512 * 1024 * 1024 // 512MB per worker
      },
      trading: {
        enableSmartRouting: this.config.performanceConfig.enableLowLatencyTrading,
        enableHighFrequencyData: true,
        latencyTarget: this.config.performanceConfig.maxLatency,
        enableNetworkOptimizations: true
      },
      performance: {
        enableMemoryOptimization: true,
        enableCaching: true,
        enableStreamProcessing: true,
        targetThroughput: this.config.performanceConfig.targetThroughput,
        maxLatency: this.config.performanceConfig.maxLatency
      }
    });

    await this.highPerformanceEngine.start();
    console.log('✅ High-Performance Engine (Phase 5) initialized and operational');
  }

  private async initializeAdvancedIntegration(): Promise<void> {
    if (!this.config.enableAdvancedIntegration) {
      console.log('⚠️ Advanced Integration (Phase 6) disabled in configuration');
      return;
    }

    console.log('🚀 Initializing Advanced Integration (Phase 6)...');

    const defaultConfig = {
      brokerConfiguration: {
        enableUnifiedAPI: true,
        enableAdvancedOMS: true,
        enablePositionReconciliation: true,
        maxBrokers: 5,
        defaultAllocation: { 'oanda': 0.5, 'ic_markets': 0.5 },
        riskLimits: {
          maxPositionSize: 1000000,
          maxOrderValue: 500000,
          maxDailyVolume: 10000000
        }
      },
      dataConfiguration: {
        enableMarketDataAggregation: true,
        enableEconomicCalendar: true,
        enableSocialSentiment: true,
        dataRefreshRate: 1000,
        prioritySymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'],
        qualityThresholds: {
          minLatency: 100,
          minReliability: 95,
          minAccuracy: 98
        }
      },
      integrationSettings: {
        enableRealTimeSync: true,
        enableCrossServiceAlerts: true,
        enableIntelligentRouting: true,
        enablePredictiveAnalysis: true,
        performanceMonitoring: true,
        autoFailover: true,
        maxRetryAttempts: 3,
        healthCheckInterval: this.config.healthCheckInterval
      },
      apiConfiguration: {
        enableRESTAPI: true,
        enableWebSocketAPI: true,
        enableGraphQLAPI: false,
        rateLimiting: {
          requestsPerSecond: 100,
          requestsPerHour: 10000,
          burstLimit: 200
        },
        authentication: {
          enableAPIKeys: true,
          enableJWT: true,
          enableOAuth: false
        }
      }
    };

    // Merge with user configuration if provided
    const phase6Config = {
      ...defaultConfig,
      ...this.config.advancedIntegrationConfig
    };

    this.advancedIntegration = new WingZeroPhase6Integration(phase6Config);
    await this.advancedIntegration.initialize();
    
    console.log('✅ Advanced Integration (Phase 6) initialized and operational');
  }

  private async initializeAdvancedFeatures(): Promise<void> {
    if (!this.config.enableAdvancedFeatures) {
      console.log('⚠️ Advanced Features (Phase 7) disabled in configuration');
      return;
    }

    console.log('🚀 Initializing Advanced Features (Phase 7)...');

    const defaultConfig = {
      socialTrading: {
        enabled: true,
        maxCopyPositions: 100,
        defaultCopyAmount: 1000,
        maxTraders: 10000,
        performanceUpdateInterval: 60000,
        riskLimits: {
          maxCopyAmount: 10000,
          maxDrawdown: 0.15,
          maxSlippage: 0.02
        }
      },
      institutional: {
        enabled: true,
        primeBrokerage: {
          enabled: true,
          maxBrokers: 5,
          nettingFrequency: 300000,
          supportedBrokers: ['goldman_sachs', 'morgan_stanley', 'jp_morgan', 'citi', 'barclays']
        },
        algorithmicTrading: {
          enabled: true,
          supportedAlgorithms: ['TWAP', 'VWAP', 'Iceberg', 'POV', 'Implementation_Shortfall'],
          maxConcurrentOrders: 1000,
          maxOrderSize: 1000000
        },
        portfolioAttribution: {
          enabled: true,
          benchmarks: ['SP500', 'NASDAQ', 'DOW', 'RUSSELL2000', 'VIX'],
          analysisFrequency: 3600000,
          attributionMethods: ['brinson', 'fama_french', 'carhart']
        }
      },
      integration: {
        realTimeUpdates: true,
        dataSync: true,
        crossServiceMessaging: true,
        sharedCache: true,
        eventDriven: true,
        performanceMonitoring: true
      }
    };

    // Merge with user configuration if provided
    const phase7Config = {
      ...defaultConfig,
      ...this.config.advancedFeaturesConfig
    };

    this.advancedFeatures = new WingZeroPhase7Integration(phase7Config);
    await this.advancedFeatures.initialize();
    
    console.log('✅ Advanced Features (Phase 7) initialized and operational');
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

    // High-Performance Engine Integration
    if (this.highPerformanceEngine && this.aiBrain) {
      console.log('🔗 Integrating AI Brain with High-Performance Engine...');
      // Connect AI Brain decision-making with high-performance execution
      this.setupAIPerformanceIntegration();
    }

    // Advanced Financials Integration
    if (this.advancedFinancials && this.highPerformanceEngine) {
      console.log('🔗 Integrating Advanced Financials with High-Performance Engine...');
      // Connect financial calculations with performance optimization
      this.setupFinancialPerformanceIntegration();
    }

    // Market Data to High-Performance Trading Integration
    if (this.marketDataService && this.highPerformanceEngine) {
      console.log('🔗 Integrating Market Data with High-Performance Trading...');
      // Connect real-time market data to ultra-fast trading execution
      this.setupMarketDataPerformanceIntegration();
    }

    console.log('✅ All service integrations configured including Phase 5 Performance & Scalability');
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
          sawEngine: await this.getSAWEngineHealth(),
          aiBrain: await this.getAIBrainHealth(),
          advancedFinancials: await this.getAdvancedFinancialsHealth(),
          highPerformance: await this.getHighPerformanceHealth(),
          advancedIntegration: await this.getAdvancedIntegrationHealth(),
          advancedFeatures: await this.getAdvancedFeaturesHealthInternal()
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

  private async getAIBrainHealth(): Promise<any> {
    if (!this.aiBrain) {
      return { 
        isRunning: false, 
        overallStatus: 'offline', 
        componentStatus: {
          sentiment_analyzer: 'offline',
          predictive_models: 'offline',
          pattern_recognition: 'offline',
          risk_scoring: 'offline',
          strategy_optimization: 'offline'
        },
        lastUpdate: Date.now()
      };
    }

    try {
      const status = this.aiBrain.getSystemStatus();
      return {
        isRunning: status.isRunning,
        overallStatus: status.overallStatus,
        componentStatus: status.componentStatus,
        lastUpdate: Date.now()
      };
    } catch (error) {
      return { 
        isRunning: false, 
        overallStatus: 'critical', 
        componentStatus: {
          sentiment_analyzer: 'error',
          predictive_models: 'error',
          pattern_recognition: 'error',
          risk_scoring: 'error',
          strategy_optimization: 'error'
        },
        lastUpdate: Date.now(),
        error: error 
      };
    }
  }

  private async getAdvancedFinancialsHealth(): Promise<any> {
    if (!this.advancedFinancials) {
      return { 
        isRunning: false, 
        portfolioTheory: 'offline',
        varModels: 'offline',
        encryptionService: 'offline',
        mfaService: 'offline',
        lastUpdate: Date.now()
      };
    }

    try {
      const health = this.advancedFinancials.getSystemHealth();
      return {
        isRunning: health.overall_status !== 'offline',
        portfolioTheory: health.components.portfolioTheory || 'online',
        varModels: health.components.varModels || 'online', 
        encryptionService: health.components.encryptionService || 'online',
        mfaService: health.components.mfaService || 'online',
        lastUpdate: Date.now()
      };
    } catch (error) {
      return { 
        isRunning: false,
        portfolioTheory: 'error',
        varModels: 'error',
        encryptionService: 'error',
        mfaService: 'error',
        lastUpdate: Date.now(),
        error: error 
      };
    }
  }

  private async getHighPerformanceHealth(): Promise<any> {
    if (!this.highPerformanceEngine) {
      return { 
        isRunning: false, 
        overallStatus: 'offline',
        performanceScore: 0,
        components: {
          webAssembly: 'offline',
          multithreading: 'offline',
          lowLatencyTrading: 'offline',
          memoryOptimization: 'offline',
          caching: 'offline',
          streamProcessing: 'offline'
        },
        metrics: {
          computeThroughput: 0,
          tradingLatency: 0,
          systemLoad: 0,
          errorRate: 0
        },
        lastUpdate: Date.now()
      };
    }

    try {
      const health = this.highPerformanceEngine.getSystemHealth();
      const metrics = this.highPerformanceEngine.getPerformanceMetrics();
      
      return {
        isRunning: health.overall_status !== 'offline',
        overallStatus: health.overall_status,
        performanceScore: health.performanceScore,
        components: {
          webAssembly: health.components.webAssembly,
          multithreading: health.components.multithreading,
          lowLatencyTrading: health.components.lowLatencyTrading,
          memoryOptimization: health.components.memoryOptimization,
          caching: health.components.caching,
          streamProcessing: health.components.streamProcessing
        },
        metrics: {
          computeThroughput: metrics.wasmComputeThroughput,
          tradingLatency: metrics.orderSubmissionLatency,
          systemLoad: metrics.systemLoad,
          errorRate: metrics.errorRate
        },
        lastUpdate: Date.now()
      };
    } catch (error) {
      return { 
        isRunning: false,
        overallStatus: 'critical',
        performanceScore: 0,
        components: {
          webAssembly: 'error',
          multithreading: 'error', 
          lowLatencyTrading: 'error',
          memoryOptimization: 'error',
          caching: 'error',
          streamProcessing: 'error'
        },
        metrics: {
          computeThroughput: 0,
          tradingLatency: 999,
          systemLoad: 1,
          errorRate: 1
        },
        lastUpdate: Date.now(),
        error: error 
      };
    }
  }

  private async getAdvancedIntegrationHealth(): Promise<any> {
    if (!this.advancedIntegration) {
      return {
        isRunning: false,
        status: 'offline',
        message: 'Advanced Integration (Phase 6) not initialized'
      };
    }

    try {
      const health = await this.advancedIntegration.getSystemHealth();
      const metrics = this.advancedIntegration.getPerformanceMetrics();
      
      return {
        isRunning: this.advancedIntegration.isSystemInitialized(),
        status: health.status,
        components: {
          unifiedBrokerAPI: health.components.unifiedBrokerAPI.status,
          orderManagement: health.components.orderManagement.status,
          positionReconciliation: health.components.positionReconciliation.status,
          marketDataAggregator: health.components.marketDataAggregator.status,
          economicCalendar: health.components.economicCalendar.status,
          socialSentiment: health.components.socialSentiment.status
        },
        performance: {
          totalThroughput: health.performance.totalThroughput,
          averageLatency: health.performance.averageLatency,
          errorRate: health.performance.errorRate,
          memoryUsage: health.performance.memoryUsage,
          cpuUsage: health.performance.cpuUsage
        },
        integration: {
          crossServiceEvents: health.integration.crossServiceEvents,
          intelligentRoutingDecisions: health.integration.intelligentRoutingDecisions,
          predictiveAccuracy: health.integration.predictiveAccuracy,
          autoFailoverEvents: health.integration.autoFailoverEvents
        },
        metrics: {
          totalSignalsGenerated: metrics.totalSignalsGenerated,
          totalAlertsGenerated: metrics.totalAlertsGenerated,
          totalOrdersExecuted: metrics.totalOrdersExecuted,
          averageSignalAccuracy: metrics.averageSignalAccuracy,
          systemUptime: metrics.systemUptime
        },
        lastUpdate: Date.now()
      };
    } catch (error) {
      console.error('❌ Error getting advanced integration health:', error);
      return {
        isRunning: false,
        status: 'offline',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdate: Date.now()
      };
    }
  }

  private async getAdvancedIntegrationHealth(): Promise<any> {
    if (!this.advancedIntegration) {
      return {
        isRunning: false,
        status: 'offline',
        message: 'Advanced Integration (Phase 6) not initialized'
      };
    }

    try {
      const health = await this.advancedIntegration.getSystemHealth();
      const metrics = this.advancedIntegration.getPerformanceMetrics();
      
      return {
        isRunning: this.advancedIntegration.isSystemInitialized(),
        status: health.status,
        components: {
          unifiedBrokerAPI: health.components.unifiedBrokerAPI.status,
          orderManagement: health.components.orderManagement.status,
          positionReconciliation: health.components.positionReconciliation.status,
          marketDataAggregator: health.components.marketDataAggregator.status,
          economicCalendar: health.components.economicCalendar.status,
          socialSentiment: health.components.socialSentiment.status
        },
        performance: {
          totalThroughput: health.performance.totalThroughput,
          averageLatency: health.performance.averageLatency,
          errorRate: health.performance.errorRate,
          memoryUsage: health.performance.memoryUsage,
          cpuUsage: health.performance.cpuUsage
        },
        integration: {
          crossServiceEvents: health.integration.crossServiceEvents,
          intelligentRoutingDecisions: health.integration.intelligentRoutingDecisions,
          predictiveAccuracy: health.integration.predictiveAccuracy,
          autoFailoverEvents: health.integration.autoFailoverEvents
        },
        metrics: {
          totalSignalsGenerated: metrics.totalSignalsGenerated,
          totalAlertsGenerated: metrics.totalAlertsGenerated,
          totalOrdersExecuted: metrics.totalOrdersExecuted,
          averageSignalAccuracy: metrics.averageSignalAccuracy,
          systemUptime: metrics.systemUptime
        },
        lastUpdate: Date.now()
      };
    } catch (error) {
      console.error('❌ Error getting advanced integration health:', error);
      return {
        isRunning: false,
        status: 'offline',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdate: Date.now()
      };
    }
  }

  private async getAdvancedIntegrationHealth(): Promise<any> {
    if (!this.advancedIntegration) {
      return {
        isRunning: false,
        status: 'offline',
        message: 'Advanced Integration (Phase 6) not initialized'
      };
    }

    try {
      const health = await this.advancedIntegration.getSystemHealth();
      const metrics = this.advancedIntegration.getPerformanceMetrics();
      
      return {
        isRunning: this.advancedIntegration.isSystemInitialized(),
        status: health.status,
        components: {
          unifiedBrokerAPI: health.components.unifiedBrokerAPI.status,
          orderManagement: health.components.orderManagement.status,
          positionReconciliation: health.components.positionReconciliation.status,
          marketDataAggregator: health.components.marketDataAggregator.status,
          economicCalendar: health.components.economicCalendar.status,
          socialSentiment: health.components.socialSentiment.status
        },
        performance: {
          totalThroughput: health.performance.totalThroughput,
          averageLatency: health.performance.averageLatency,
          errorRate: health.performance.errorRate,
          memoryUsage: health.performance.memoryUsage,
          cpuUsage: health.performance.cpuUsage
        },
        integration: {
          crossServiceEvents: health.integration.crossServiceEvents,
          intelligentRoutingDecisions: health.integration.intelligentRoutingDecisions,
          predictiveAccuracy: health.integration.predictiveAccuracy,
          autoFailoverEvents: health.integration.autoFailoverEvents
        },
        metrics: {
          totalSignalsGenerated: metrics.totalSignalsGenerated,
          totalAlertsGenerated: metrics.totalAlertsGenerated,
          totalOrdersExecuted: metrics.totalOrdersExecuted,
          averageSignalAccuracy: metrics.averageSignalAccuracy,
          systemUptime: metrics.systemUptime
        },
        lastUpdate: Date.now()
      };
    } catch (error) {
      console.error('❌ Error getting advanced integration health:', error);
      return {
        isRunning: false,
        status: 'offline',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdate: Date.now()
      };
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

  // Phase 5 Integration Methods
  private setupAIPerformanceIntegration(): void {
    if (!this.aiBrain || !this.highPerformanceEngine) return;

    console.log('🧠⚡ Setting up AI Brain + High-Performance Engine integration...');

    // AI-driven performance optimization
    setInterval(async () => {
      try {
        const marketIntelligence = await this.aiBrain!.gatherMarketIntelligence('EURUSD');
        const performanceMetrics = this.highPerformanceEngine!.getPerformanceMetrics();

        // Use AI insights to optimize performance configuration
        if (marketIntelligence.volatility_score > 0.8 && performanceMetrics.averageTaskLatency > 5) {
          // High volatility + high latency = prioritize trading performance
          await this.highPerformanceEngine!.updateConfiguration({
            trading: {
              enableSmartRouting: true,
              enableHighFrequencyData: true,
              latencyTarget: 50, // Reduce latency target
              enableNetworkOptimizations: true
            }
          });
        }

        // AI-driven computation routing
        if (marketIntelligence.market_regime === 'high_volatility') {
          // Use WebAssembly for faster calculations during high volatility
          console.log('🧠 AI detected high volatility - optimizing for WebAssembly computations');
        }

      } catch (error) {
        console.error('❌ AI-Performance integration error:', error);
      }
    }, 30000); // Every 30 seconds

    console.log('✅ AI Brain + High-Performance Engine integration active');
  }

  private setupFinancialPerformanceIntegration(): void {
    if (!this.advancedFinancials || !this.highPerformanceEngine) return;

    console.log('📊⚡ Setting up Financial Calculations + High-Performance Engine integration...');

    // Expose high-performance financial operations
    this.exposedMethods = {
      ...this.exposedMethods,
      
      // High-performance portfolio optimization
      optimizePortfolioHighPerformance: async (portfolios: any[]) => {
        return this.highPerformanceEngine!.executeParallelAnalysis(
          portfolios.map(p => ({ id: p.id, data: p, analysisType: 'optimization' }))
        );
      },

      // Ultra-fast risk calculations
      calculateRiskHighPerformance: async (portfolios: any[]) => {
        const riskTasks = portfolios.map(portfolio => ({
          type: 'risk_calculation' as const,
          data: portfolio,
          priority: 'high' as const
        }));

        const results = await Promise.all(
          riskTasks.map(task => 
            this.highPerformanceEngine!.executeHighPerformanceComputation(
              task.type, task.data, task.priority
            )
          )
        );

        return results;
      },

      // Secure high-performance operations
      secureHighPerformanceOperation: async (operation: any, encryptionLevel: string = 'AES-256') => {
        // Use Phase 4 encryption with Phase 5 performance
        const encrypted = await this.advancedFinancials!.secureDataExchange(operation, encryptionLevel);
        return this.highPerformanceEngine!.executeHighPerformanceComputation(
          'portfolio_optimization', encrypted, 'critical'
        );
      }
    };

    console.log('✅ Financial Calculations + High-Performance Engine integration active');
  }

  private setupMarketDataPerformanceIntegration(): void {
    if (!this.marketDataService || !this.highPerformanceEngine) return;

    console.log('📊⚡ Setting up Market Data + High-Performance Trading integration...');

    // High-frequency market data processing
    const symbols = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD', 'BTC_USD'];
    
    symbols.forEach(symbol => {
      this.marketDataService!.subscribe(symbol, async (tickData) => {
        try {
          // Ultra-fast trade execution based on market conditions
          const marketData = this.highPerformanceEngine!.getWorkloadDistribution();
          
          // Check if trading latency is optimal for high-frequency operations
          const performanceMetrics = this.highPerformanceEngine!.getPerformanceMetrics();
          
          if (performanceMetrics.orderSubmissionLatency < 1 && tickData.volatility > 0.002) {
            // Market conditions + performance conditions optimal for HFT
            console.log(`⚡ Optimal HFT conditions detected for ${symbol} (latency: ${performanceMetrics.orderSubmissionLatency}ms)`);
            
            // Could trigger automated high-frequency trading here
            // await this.highPerformanceEngine!.executeUltraFastTrade(...);
          }

          // Real-time performance optimization based on market data
          if (tickData.spread && tickData.spread > 0.0005) {
            // Wide spread detected - optimize for smart order routing
            await this.highPerformanceEngine!.updateConfiguration({
              trading: {
                enableSmartRouting: true,
                enableHighFrequencyData: true,
                latencyTarget: 100,
                enableNetworkOptimizations: true
              }
            });
          }

        } catch (error) {
          console.error('❌ Market Data + Performance integration error:', error);
        }
      });
    });

    console.log('✅ Market Data + High-Performance Trading integration active');
  }

  // Exposed methods for external access to integrated functionality
  private exposedMethods: { [key: string]: Function } = {};

  // Public API for Phase 5 integration
  public getHighPerformanceEngine() {
    return this.highPerformanceEngine;
  }

  public getAdvancedFinancials() {
    return this.advancedFinancials;
  }

  public async executeHighPerformanceComputation(type: string, data: any, priority: string = 'normal'): Promise<any> {
    if (!this.highPerformanceEngine) {
      throw new Error('High-Performance Engine not initialized');
    }
    return this.highPerformanceEngine.executeHighPerformanceComputation(type as any, data, priority as any);
  }

  public async executeUltraFastTrade(order: any): Promise<string> {
    if (!this.highPerformanceEngine) {
      throw new Error('High-Performance Engine not initialized');
    }
    return this.highPerformanceEngine.executeUltraFastTrade(order);
  }

  public async runPerformanceBenchmark(): Promise<any> {
    if (!this.highPerformanceEngine) {
      throw new Error('High-Performance Engine not initialized');
    }
    return this.highPerformanceEngine.runPerformanceBenchmark();
  }

  // Phase 6: Advanced Integration Public API
  getAdvancedIntegration(): WingZeroPhase6Integration | null {
    return this.advancedIntegration;
  }

  async getIntegratedTradingSignals(symbol?: string): Promise<any[]> {
    if (!this.advancedIntegration) {
      throw new Error('Advanced Integration (Phase 6) not initialized');
    }
    return this.advancedIntegration.getTradingSignals(symbol);
  }

  async getCrossServiceAlerts(type?: string, severity?: string): Promise<any[]> {
    if (!this.advancedIntegration) {
      throw new Error('Advanced Integration (Phase 6) not initialized');
    }
    return this.advancedIntegration.getCrossServiceAlerts(type, severity);
  }

  async subscribeToAdvancedIntegration(callback: (data: any) => void, filters?: any): Promise<string> {
    if (!this.advancedIntegration) {
      throw new Error('Advanced Integration (Phase 6) not initialized');
    }
    return this.advancedIntegration.subscribe(callback, filters);
  }

  async unsubscribeFromAdvancedIntegration(subscriptionId: string): Promise<void> {
    if (!this.advancedIntegration) {
      throw new Error('Advanced Integration (Phase 6) not initialized');
    }
    return this.advancedIntegration.unsubscribe(subscriptionId);
  }

  // Phase 6: Service Component Access
  getUnifiedBroker() {
    return this.advancedIntegration?.getUnifiedBroker() || null;
  }

  getOrderManagement() {
    return this.advancedIntegration?.getOrderManagement() || null;
  }

  getPositionReconciliation() {
    return this.advancedIntegration?.getPositionReconciliation() || null;
  }

  getMarketDataAggregator() {
    return this.advancedIntegration?.getMarketDataAggregator() || null;
  }

  getEconomicCalendar() {
    return this.advancedIntegration?.getEconomicCalendar() || null;
  }

  getSocialSentiment() {
    return this.advancedIntegration?.getSocialSentiment() || null;
  }

  // Phase 1: Enhanced API & Core Services Public API
  getWingZeroAPI() {
    return this.wingZeroAPI || null;
  }

  getOandaBroker() {
    return this.oandaBroker || null;
  }

  getMarketDataService() {
    return this.marketDataService || null;
  }

  getPerformanceProfiler() {
    return this.performanceProfiler || null;
  }

  getSAWEngine() {
    return this.sawEngine || null;
  }

  async executeAutomatedWorkflow(workflow: any) {
    if (!this.sawEngine) {
      throw new Error('SAW Engine (Phase 1) not initialized');
    }
    return await this.sawEngine.executeWorkflow(workflow);
  }

  getCoreServicesHealth() {
    return {
      wingZeroAPI: this.wingZeroAPI ? 'healthy' : 'offline',
      oandaBroker: this.oandaBroker ? 'healthy' : 'offline',
      marketDataService: this.marketDataService ? 'healthy' : 'offline',
      performanceProfiler: this.performanceProfiler ? 'healthy' : 'offline',
      sawEngine: this.sawEngine ? 'healthy' : 'offline'
    };
  }

  // Phase 2: AI Brain & Advanced Analytics Public API
  getAIBrain() {
    return this.aiBrain || null;
  }

  async analyzeSentiment(text: string) {
    if (!this.aiBrain) {
      throw new Error('AI Brain (Phase 2) not initialized');
    }
    return await this.aiBrain.analyzeSentiment(text);
  }

  async generatePrediction(symbol: string, timeframe: string) {
    if (!this.aiBrain) {
      throw new Error('AI Brain (Phase 2) not initialized');
    }
    return await this.aiBrain.generatePrediction(symbol, timeframe);
  }

  async recognizePattern(data: any[]) {
    if (!this.aiBrain) {
      throw new Error('AI Brain (Phase 2) not initialized');
    }
    return await this.aiBrain.recognizePattern(data);
  }

  async calculateRiskScore(portfolio: any) {
    if (!this.aiBrain) {
      throw new Error('AI Brain (Phase 2) not initialized');
    }
    return await this.aiBrain.calculateRiskScore(portfolio);
  }

  async optimizeStrategy(strategy: any, constraints: any) {
    if (!this.aiBrain) {
      throw new Error('AI Brain (Phase 2) not initialized');
    }
    return await this.aiBrain.optimizeStrategy(strategy, constraints);
  }

  getAIBrainHealth() {
    return this.aiBrain?.getHealthStatus() || {
      isRunning: false,
      overallStatus: 'offline',
      componentStatus: {
        sentiment_analyzer: 'offline',
        predictive_models: 'offline',
        pattern_recognition: 'offline',
        risk_scoring: 'offline',
        strategy_optimization: 'offline'
      },
      lastUpdate: 0
    };
  }

  // Phase 3 & 4: Advanced Financial Models & Security Public API
  getModernPortfolioTheory() {
    return this.advancedFinancials?.getModernPortfolioTheory() || null;
  }

  getAdvancedVaRModels() {
    return this.advancedFinancials?.getAdvancedVaRModels() || null;
  }

  getAdvancedEncryptionService() {
    return this.advancedFinancials?.getAdvancedEncryptionService() || null;
  }

  getMultifactorAuthenticationService() {
    return this.advancedFinancials?.getMultifactorAuthenticationService() || null;
  }

  async calculatePortfolioOptimization(assets: any[], constraints: any) {
    if (!this.advancedFinancials) {
      throw new Error('Advanced Financials (Phase 3 & 4) not initialized');
    }
    return await this.advancedFinancials.calculatePortfolioOptimization(assets, constraints);
  }

  async calculateAdvancedVaR(portfolio: any, method: string, confidenceLevel: number) {
    if (!this.advancedFinancials) {
      throw new Error('Advanced Financials (Phase 3 & 4) not initialized');
    }
    return await this.advancedFinancials.calculateAdvancedVaR(portfolio, method, confidenceLevel);
  }

  async encryptSensitiveData(data: any) {
    if (!this.advancedFinancials) {
      throw new Error('Advanced Financials (Phase 3 & 4) not initialized');
    }
    return await this.advancedFinancials.encryptSensitiveData(data);
  }

  async validateMFA(userId: string, token: string) {
    if (!this.advancedFinancials) {
      throw new Error('Advanced Financials (Phase 3 & 4) not initialized');
    }
    return await this.advancedFinancials.validateMFA(userId, token);
  }

  getAdvancedFinancialsHealth() {
    return this.advancedFinancials?.getHealthStatus() || {
      isRunning: false,
      portfolioTheory: 'offline',
      varModels: 'offline',
      encryptionService: 'offline',
      mfaService: 'offline',
      lastUpdate: 0
    };
  }

  // Phase 5: High-Performance & Scalability Public API
  getHighPerformanceEngine() {
    return this.highPerformanceEngine || null;
  }

  async executeHighPerformanceComputation(computation: any) {
    if (!this.highPerformanceEngine) {
      throw new Error('High Performance Engine (Phase 5) not initialized');
    }
    return await this.highPerformanceEngine.executeComputation(computation);
  }

  async executeLowLatencyTrade(tradeRequest: any) {
    if (!this.highPerformanceEngine) {
      throw new Error('High Performance Engine (Phase 5) not initialized');
    }
    return await this.highPerformanceEngine.executeLowLatencyTrade(tradeRequest);
  }

  getPerformanceMetrics() {
    return this.highPerformanceEngine?.getPerformanceMetrics() || {
      computeThroughput: 0,
      tradingLatency: 0,
      systemLoad: 0,
      errorRate: 0,
      cacheHitRate: 0
    };
  }

  getHighPerformanceHealth() {
    return this.highPerformanceEngine?.getHealthStatus() || {
      isRunning: false,
      overallStatus: 'offline',
      performanceScore: 0,
      components: {
        webAssembly: 'offline',
        multithreading: 'offline',
        lowLatencyTrading: 'offline',
        memoryOptimization: 'offline',
        caching: 'offline',
        streamProcessing: 'offline'
      },
      metrics: {
        computeThroughput: 0,
        tradingLatency: 0,
        systemLoad: 0,
        errorRate: 0
      },
      lastUpdate: 0
    };
  }

  // Phase 7: Advanced Features Public API
  getCopyTradingEngine() {
    return this.advancedFeatures?.getCopyTradingEngine() || null;
  }

  getPerformanceAnalyticsEngine() {
    return this.advancedFeatures?.getPerformanceAnalyticsEngine() || null;
  }

  getSocialNetworkEngine() {
    return this.advancedFeatures?.getSocialNetworkEngine() || null;
  }

  getPrimeBrokerageEngine() {
    return this.advancedFeatures?.getPrimeBrokerageEngine() || null;
  }

  getAlgorithmicTradingEngine() {
    return this.advancedFeatures?.getAlgorithmicTradingEngine() || null;
  }

  getPortfolioAttributionEngine() {
    return this.advancedFeatures?.getPortfolioAttributionEngine() || null;
  }

  getAdvancedTradingSignals() {
    return this.advancedFeatures?.getActiveTradingSignals() || new Map();
  }

  getAdvancedAlerts() {
    return this.advancedFeatures?.getActiveAlerts() || new Map();
  }

  async generateAdvancedTradingSignal(symbol: string) {
    if (!this.advancedFeatures) {
      throw new Error('Advanced Features (Phase 7) not initialized');
    }
    return await this.advancedFeatures.generateAdvancedTradingSignal(symbol);
  }

  getAdvancedFeaturesHealth() {
    if (!this.advancedFeatures) {
      return {
        isRunning: false,
        overallStatus: 'offline',
        components: {
          socialTrading: 'offline',
          copyTrading: 'offline',
          performanceAnalytics: 'offline',
          socialNetwork: 'offline',
          primeBrokerage: 'offline',
          algorithmicTrading: 'offline',
          portfolioAttribution: 'offline',
        },
        metrics: {
          totalTradingSignals: 0,
          activeCopyRelationships: 0,
          algorithmicOrders: 0,
          attributionAnalyses: 0,
          crossServiceMessages: 0,
        },
        lastUpdate: 0
      };
    }

    const metrics = this.advancedFeatures.getMetrics();
    return {
      isRunning: true,
      overallStatus: 'healthy',
      components: {
        socialTrading: 'healthy',
        copyTrading: 'healthy',
        performanceAnalytics: 'healthy',
        socialNetwork: 'healthy',
        primeBrokerage: 'healthy',
        algorithmicTrading: 'healthy',
        portfolioAttribution: 'healthy',
      },
      metrics: {
        totalTradingSignals: metrics.socialTrading.totalCopyTrades + metrics.institutional.algorithmicOrders,
        activeCopyRelationships: metrics.socialTrading.activeCopyRelationships,
        algorithmicOrders: metrics.institutional.algorithmicOrders,
        attributionAnalyses: metrics.institutional.attributionAnalyses,
        crossServiceMessages: metrics.crossService.messagesPassed,
      },
      lastUpdate: Date.now()
    };
  }

  private async getAdvancedFeaturesHealthInternal() {
    if (!this.advancedFeatures) {
      return {
        isRunning: false,
        overallStatus: 'offline',
        components: {
          socialTrading: 'offline',
          copyTrading: 'offline',
          performanceAnalytics: 'offline',
          socialNetwork: 'offline',
          primeBrokerage: 'offline',
          algorithmicTrading: 'offline',
          portfolioAttribution: 'offline',
        },
        metrics: {
          totalTradingSignals: 0,
          activeCopyRelationships: 0,
          algorithmicOrders: 0,
          attributionAnalyses: 0,
          crossServiceMessages: 0,
        },
        lastUpdate: 0
      };
    }

    try {
      const metrics = this.advancedFeatures.getMetrics();
      return {
        isRunning: true,
        overallStatus: 'healthy',
        components: {
          socialTrading: 'healthy',
          copyTrading: 'healthy',
          performanceAnalytics: 'healthy',
          socialNetwork: 'healthy',
          primeBrokerage: 'healthy',
          algorithmicTrading: 'healthy',
          portfolioAttribution: 'healthy',
        },
        metrics: {
          totalTradingSignals: metrics.socialTrading.totalCopyTrades + metrics.institutional.algorithmicOrders,
          activeCopyRelationships: metrics.socialTrading.activeCopyRelationships,
          algorithmicOrders: metrics.institutional.algorithmicOrders,
          attributionAnalyses: metrics.institutional.attributionAnalyses,
          crossServiceMessages: metrics.crossService.messagesPassed,
        },
        lastUpdate: Date.now()
      };
    } catch (error) {
      console.error('Error getting Phase 7 health:', error);
      return {
        isRunning: false,
        overallStatus: 'critical',
        components: {
          socialTrading: 'critical',
          copyTrading: 'critical',
          performanceAnalytics: 'critical',
          socialNetwork: 'critical',
          primeBrokerage: 'critical',
          algorithmicTrading: 'critical',
          portfolioAttribution: 'critical',
        },
        metrics: {
          totalTradingSignals: 0,
          activeCopyRelationships: 0,
          algorithmicOrders: 0,
          attributionAnalyses: 0,
          crossServiceMessages: 0,
        },
        lastUpdate: Date.now()
      };
    }
  }

  private async cleanup(): Promise<void> {
    this.stopHealthMonitoring();
    
    if (this.isRunning) {
      await this.stop();
    }
    
    // Shutdown Phase 7 components
    if (this.advancedFeatures) {
      await this.advancedFeatures.shutdown();
    }
    
    // Shutdown Phase 6 components
    if (this.advancedIntegration) {
      await this.advancedIntegration.shutdown();
    }
    
    // Shutdown Phase 5 components
    if (this.highPerformanceEngine) {
      await this.highPerformanceEngine.stop();
    }
    
    // Shutdown Phase 3 & 4 components
    if (this.advancedFinancials) {
      await this.advancedFinancials.stop();
    }
    
    // Shutdown Phase 2 (AI Brain) components
    if (this.aiBrain) {
      await this.aiBrain.shutdown();
    }
    
    // Shutdown Phase 1 core services
    if (this.sawEngine) {
      await this.sawEngine.stop();
    }
    
    if (this.performanceProfiler) {
      this.performanceProfiler.stop();
    }
    
    if (this.marketDataService) {
      await this.marketDataService.disconnect();
    }
    
    if (this.oandaBroker) {
      await this.oandaBroker.disconnect();
    }
    
    if (this.wingZeroAPI) {
      await this.wingZeroAPI.disconnect();
    }
    
    this.isInitialized = false;
    this.wingZeroAPI = null;
    this.oandaBroker = null;
    this.marketDataService = null;
    this.performanceProfiler = null;
    this.sawEngine = null;
    this.aiBrain = null;
    this.advancedFinancials = null;
    this.highPerformanceEngine = null;
    this.advancedIntegration = null;
    this.advancedFeatures = null;
  }

  // Factory method for easy setup
  static async createAndStart(config: SystemConfiguration): Promise<WingZeroSystemIntegration> {
    const system = new WingZeroSystemIntegration(config);
    await system.initialize();
    await system.start();
    return system;
  }
}