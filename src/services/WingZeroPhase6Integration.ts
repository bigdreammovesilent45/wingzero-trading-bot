import { UnifiedBrokerAPI } from './brokers/UnifiedBrokerAPI';
import { AdvancedOrderManagementSystem } from './orders/AdvancedOrderManagementSystem';
import { PositionReconciliationEngine } from './reconciliation/PositionReconciliationEngine';
import { EnterpriseMarketDataAggregator } from './data/EnterpriseMarketDataAggregator';
import { EconomicCalendarService } from './data/EconomicCalendarService';
import { SocialSentimentAnalyzer } from './data/SocialSentimentAnalyzer';

interface Phase6Configuration {
  // Multi-broker Architecture
  brokerConfiguration: {
    enableUnifiedAPI: boolean;
    enableAdvancedOMS: boolean;
    enablePositionReconciliation: boolean;
    maxBrokers: number;
    defaultAllocation: { [brokerId: string]: number };
    riskLimits: {
      maxPositionSize: number;
      maxOrderValue: number;
      maxDailyVolume: number;
    };
  };
  
  // External Data Sources
  dataConfiguration: {
    enableMarketDataAggregation: boolean;
    enableEconomicCalendar: boolean;
    enableSocialSentiment: boolean;
    dataRefreshRate: number;
    prioritySymbols: string[];
    qualityThresholds: {
      minLatency: number;
      minReliability: number;
      minAccuracy: number;
    };
  };
  
  // Integration Settings
  integrationSettings: {
    enableRealTimeSync: boolean;
    enableCrossServiceAlerts: boolean;
    enableIntelligentRouting: boolean;
    enablePredictiveAnalysis: boolean;
    performanceMonitoring: boolean;
    autoFailover: boolean;
    maxRetryAttempts: number;
    healthCheckInterval: number;
  };
  
  // API Configuration
  apiConfiguration: {
    enableRESTAPI: boolean;
    enableWebSocketAPI: boolean;
    enableGraphQLAPI: boolean;
    rateLimiting: {
      requestsPerSecond: number;
      requestsPerHour: number;
      burstLimit: number;
    };
    authentication: {
      enableAPIKeys: boolean;
      enableJWT: boolean;
      enableOAuth: boolean;
    };
  };
}

interface Phase6Health {
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  timestamp: number;
  
  // Component health
  components: {
    unifiedBrokerAPI: {
      status: 'online' | 'offline' | 'degraded';
      brokersConnected: number;
      totalBrokers: number;
      averageLatency: number;
      successRate: number;
    };
    orderManagement: {
      status: 'online' | 'offline' | 'degraded';
      ordersProcessed: number;
      averageExecutionTime: number;
      successRate: number;
      strategiesActive: number;
    };
    positionReconciliation: {
      status: 'online' | 'offline' | 'degraded';
      positionsTracked: number;
      discrepanciesFound: number;
      reconciliationScore: number;
      lastReconciliation: number;
    };
    marketDataAggregator: {
      status: 'online' | 'offline' | 'degraded';
      providersConnected: number;
      dataQualityScore: number;
      averageLatency: number;
      symbolsCovered: number;
    };
    economicCalendar: {
      status: 'online' | 'offline' | 'degraded';
      eventsTracked: number;
      alertsGenerated: number;
      criticalEventsToday: number;
      lastUpdate: number;
    };
    socialSentiment: {
      status: 'online' | 'offline' | 'degraded';
      sourcesActive: number;
      sentimentAccuracy: number;
      alertsGenerated: number;
      trendingTopics: number;
    };
  };
  
  // Performance metrics
  performance: {
    totalThroughput: number;
    averageLatency: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  
  // Integration status
  integration: {
    crossServiceEvents: number;
    intelligentRoutingDecisions: number;
    predictiveAccuracy: number;
    autoFailoverEvents: number;
  };
}

interface IntegratedTradingSignal {
  signalId: string;
  timestamp: number;
  symbol: string;
  
  // Signal components
  technicalSignal: {
    direction: 'buy' | 'sell' | 'hold';
    strength: number; // 0-100
    confidence: number; // 0-100
    timeframe: string;
    indicators: string[];
  };
  
  fundamentalSignal: {
    direction: 'buy' | 'sell' | 'hold';
    strength: number;
    confidence: number;
    reasoning: string[];
    priceTarget: number;
  };
  
  sentimentSignal: {
    direction: 'buy' | 'sell' | 'hold';
    strength: number;
    confidence: number;
    volume: number;
    trendingScore: number;
  };
  
  economicSignal: {
    direction: 'buy' | 'sell' | 'hold';
    strength: number;
    confidence: number;
    impactingEvents: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  
  // Integrated analysis
  consolidatedSignal: {
    direction: 'buy' | 'sell' | 'hold';
    strength: number; // 0-100
    confidence: number; // 0-100
    riskScore: number; // 0-100
    timeHorizon: 'short' | 'medium' | 'long';
    reasoning: string[];
  };
  
  // Execution recommendations
  executionRecommendation: {
    orderType: 'market' | 'limit' | 'stop' | 'iceberg' | 'twap' | 'vwap';
    quantity: number;
    priceTarget: number;
    stopLoss: number;
    takeProfit: number;
    maxSlippage: number;
    brokerPreference: string[];
    urgency: 'low' | 'medium' | 'high';
  };
}

interface CrossServiceAlert {
  alertId: string;
  timestamp: number;
  type: 'market_opportunity' | 'risk_warning' | 'system_anomaly' | 'data_quality' | 'execution_issue';
  severity: 'info' | 'warning' | 'critical';
  
  // Alert source
  sourceServices: string[];
  triggerEvent: string;
  
  // Alert data
  symbol?: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  
  // Recommendations
  recommendations: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    timeframe: string;
    service: string;
  }>;
  
  // Cross-service correlation
  correlatedData: {
    marketData?: any;
    economicEvents?: any;
    sentimentData?: any;
    orderBookData?: any;
    positionData?: any;
  };
  
  autoGenerated: boolean;
  processed: boolean;
}

export class WingZeroPhase6Integration {
  private config: Phase6Configuration;
  private isInitialized = false;
  private isHealthy = true;
  
  // Core services
  private unifiedBroker: UnifiedBrokerAPI | null = null;
  private orderManagement: AdvancedOrderManagementSystem | null = null;
  private positionReconciliation: PositionReconciliationEngine | null = null;
  private marketDataAggregator: EnterpriseMarketDataAggregator | null = null;
  private economicCalendar: EconomicCalendarService | null = null;
  private socialSentiment: SocialSentimentAnalyzer | null = null;
  
  // Integration components
  private tradingSignals: Map<string, IntegratedTradingSignal> = new Map();
  private crossServiceAlerts: Map<string, CrossServiceAlert> = new Map();
  private subscriptions: Map<string, {
    callback: Function;
    filters: any;
    isActive: boolean;
  }> = new Map();
  
  // Performance monitoring
  private performanceMetrics = {
    totalSignalsGenerated: 0,
    totalAlertsGenerated: 0,
    totalOrdersExecuted: 0,
    averageSignalAccuracy: 0,
    averageExecutionTime: 0,
    systemUptime: 0,
    lastUpdate: 0
  };
  
  // Health monitoring
  private healthCheckTimer?: NodeJS.Timeout;
  private integrationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Phase6Configuration) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Phase 6 Integration already initialized');
      return;
    }

    console.log('🚀 Initializing Wing Zero Phase 6: Advanced Integration...');

    try {
      // Initialize core services in sequence
      await this.initializeMultiBrokerArchitecture();
      await this.initializeExternalDataSources();
      await this.setupServiceIntegrations();
      await this.startPerformanceMonitoring();
      
      this.isInitialized = true;
      console.log('✅ Wing Zero Phase 6 Advanced Integration fully operational');

    } catch (error) {
      console.error('❌ Failed to initialize Phase 6 Integration:', error);
      throw error;
    }
  }

  // Multi-broker Architecture Initialization
  private async initializeMultiBrokerArchitecture(): Promise<void> {
    console.log('🌐 Initializing Multi-broker Architecture...');

    if (this.config.brokerConfiguration.enableUnifiedAPI) {
      // Initialize Unified Broker API
      this.unifiedBroker = new UnifiedBrokerAPI();
      await this.unifiedBroker.initialize([
        {
          brokerId: 'oanda',
          name: 'OANDA',
          type: 'forex',
          environment: 'demo',
          apiEndpoint: 'https://api-fxpractice.oanda.com',
          credentials: {
            apiKey: process.env.OANDA_API_KEY || 'demo_key',
            accountId: process.env.OANDA_ACCOUNT_ID || 'demo_account'
          },
          capabilities: {
            trading: true,
            marketData: true,
            options: false,
            futures: false,
            crypto: false
          },
          limits: {
            maxPositions: 100,
            maxOrderSize: 1000000,
            rateLimit: 100,
            dailyLimit: 10000
          },
          fees: {
            commission: 0,
            spread: 1.5,
            marginRate: 3.4,
            overnightFee: 0.1
          }
        },
        {
          brokerId: 'ic_markets',
          name: 'IC Markets',
          type: 'forex',
          environment: 'demo',
          apiEndpoint: 'https://api.icmarkets.com',
          credentials: {
            apiKey: process.env.IC_MARKETS_API_KEY || 'demo_key',
            accountId: process.env.IC_MARKETS_ACCOUNT_ID || 'demo_account'
          },
          capabilities: {
            trading: true,
            marketData: true,
            options: false,
            futures: true,
            crypto: false
          },
          limits: {
            maxPositions: 200,
            maxOrderSize: 5000000,
            rateLimit: 200,
            dailyLimit: 50000
          },
          fees: {
            commission: 3.5,
            spread: 0.8,
            marginRate: 2.9,
            overnightFee: 0.08
          }
        }
      ]);
      console.log('✅ Unified Broker API initialized');
    }

    if (this.config.brokerConfiguration.enableAdvancedOMS && this.unifiedBroker) {
      // Initialize Advanced Order Management System
      this.orderManagement = new AdvancedOrderManagementSystem(this.unifiedBroker);
      await this.orderManagement.initialize();
      console.log('✅ Advanced Order Management System initialized');
    }

    if (this.config.brokerConfiguration.enablePositionReconciliation && this.unifiedBroker) {
      // Initialize Position Reconciliation Engine
      this.positionReconciliation = new PositionReconciliationEngine(this.unifiedBroker);
      await this.positionReconciliation.initialize();
      
      // Add reconciliation accounts
      await this.positionReconciliation.addAccount({
        accountId: 'main_trading_account',
        accountName: 'Main Trading Account',
        brokerAccounts: [
          {
            brokerId: 'oanda',
            brokerAccountId: process.env.OANDA_ACCOUNT_ID || 'demo_account',
            accountType: 'main',
            currency: 'USD',
            isActive: true
          },
          {
            brokerId: 'ic_markets',
            brokerAccountId: process.env.IC_MARKETS_ACCOUNT_ID || 'demo_account',
            accountType: 'main',
            currency: 'USD',
            isActive: true
          }
        ],
        masterCurrency: 'USD',
        reconciliationFrequency: 300000, // 5 minutes
        tolerances: {
          positionTolerance: 0.01,
          valueTolerance: 0.1,
          pnlTolerance: 0.5,
          timeTolerance: 30000
        }
      });
      console.log('✅ Position Reconciliation Engine initialized');
    }

    console.log('✅ Multi-broker Architecture initialized');
  }

  // External Data Sources Initialization
  private async initializeExternalDataSources(): Promise<void> {
    console.log('📡 Initializing External Data Sources...');

    if (this.config.dataConfiguration.enableMarketDataAggregation) {
      // Initialize Enterprise Market Data Aggregator
      this.marketDataAggregator = new EnterpriseMarketDataAggregator();
      await this.marketDataAggregator.initialize();
      console.log('✅ Enterprise Market Data Aggregator initialized');
    }

    if (this.config.dataConfiguration.enableEconomicCalendar) {
      // Initialize Economic Calendar Service
      this.economicCalendar = new EconomicCalendarService();
      await this.economicCalendar.initialize();
      console.log('✅ Economic Calendar Service initialized');
    }

    if (this.config.dataConfiguration.enableSocialSentiment) {
      // Initialize Social Sentiment Analyzer
      this.socialSentiment = new SocialSentimentAnalyzer();
      await this.socialSentiment.initialize();
      console.log('✅ Social Sentiment Analyzer initialized');
    }

    console.log('✅ External Data Sources initialized');
  }

  // Service Integration Setup
  private async setupServiceIntegrations(): Promise<void> {
    console.log('🔗 Setting up service integrations...');

    // Market Data -> Order Management Integration
    if (this.marketDataAggregator && this.orderManagement) {
      await this.setupMarketDataOrderIntegration();
    }

    // Economic Calendar -> Trading Signals Integration
    if (this.economicCalendar) {
      await this.setupEconomicCalendarIntegration();
    }

    // Social Sentiment -> Risk Management Integration
    if (this.socialSentiment) {
      await this.setupSocialSentimentIntegration();
    }

    // Position Reconciliation -> Alert System Integration
    if (this.positionReconciliation) {
      await this.setupPositionReconciliationIntegration();
    }

    // Cross-service intelligent routing
    if (this.config.integrationSettings.enableIntelligentRouting) {
      await this.setupIntelligentRouting();
    }

    // Predictive analysis integration
    if (this.config.integrationSettings.enablePredictiveAnalysis) {
      await this.setupPredictiveAnalysis();
    }

    console.log('✅ Service integrations established');
  }

  private async setupMarketDataOrderIntegration(): Promise<void> {
    console.log('📊 Setting up Market Data -> Order Management integration...');

    // Subscribe to high-priority symbols
    await this.marketDataAggregator!.subscribe(
      this.config.dataConfiguration.prioritySymbols,
      ['level1', 'level2'],
      (data) => {
        this.handleMarketDataUpdate(data);
      },
      {
        filters: {
          minVolume: 10000,
          minPrice: 0.01
        },
        errorCallback: (error) => {
          this.generateCrossServiceAlert('data_quality', 'critical', {
            description: `Market data feed error: ${error.message}`,
            sourceServices: ['marketDataAggregator'],
            triggerEvent: 'data_feed_error'
          });
        }
      }
    );

    console.log('✅ Market Data -> Order Management integration active');
  }

  private async setupEconomicCalendarIntegration(): Promise<void> {
    console.log('📅 Setting up Economic Calendar integration...');

    // Subscribe to critical economic events
    await this.economicCalendar!.subscribe(
      {
        importance: ['high', 'critical'],
        categories: ['central_bank', 'economic_data'],
        currencies: ['USD', 'EUR', 'GBP', 'JPY']
      },
      (event) => {
        this.handleEconomicEvent(event);
      },
      (alert) => {
        this.handleEconomicAlert(alert);
      }
    );

    console.log('✅ Economic Calendar integration active');
  }

  private async setupSocialSentimentIntegration(): Promise<void> {
    console.log('📱 Setting up Social Sentiment integration...');

    // Subscribe to sentiment for priority symbols
    await this.socialSentiment!.subscribe(
      this.config.dataConfiguration.prioritySymbols,
      (sentiment) => {
        this.handleSentimentUpdate(sentiment);
      },
      {
        alertCallback: (alert) => {
          this.handleSentimentAlert(alert);
        },
        filters: {
          minRelevance: 70,
          timeframes: ['1h', '4h']
        }
      }
    );

    console.log('✅ Social Sentiment integration active');
  }

  private async setupPositionReconciliationIntegration(): Promise<void> {
    console.log('🔄 Setting up Position Reconciliation integration...');

    // Set up automatic reconciliation monitoring
    const reconciliationTimer = setInterval(async () => {
      try {
        const snapshot = await this.positionReconciliation!.reconcilePositions('main_trading_account');
        
        if (snapshot.reconciliationScore < 95) {
          this.generateCrossServiceAlert('system_anomaly', 'warning', {
            description: `Position reconciliation score below threshold: ${snapshot.reconciliationScore.toFixed(1)}`,
            sourceServices: ['positionReconciliation'],
            triggerEvent: 'low_reconciliation_score',
            correlatedData: { positionData: snapshot }
          });
        }
      } catch (error) {
        this.generateCrossServiceAlert('execution_issue', 'critical', {
          description: `Position reconciliation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          sourceServices: ['positionReconciliation'],
          triggerEvent: 'reconciliation_failure'
        });
      }
    }, this.config.integrationSettings.healthCheckInterval);

    this.integrationTimers.set('reconciliation', reconciliationTimer);

    console.log('✅ Position Reconciliation integration active');
  }

  private async setupIntelligentRouting(): Promise<void> {
    console.log('🧠 Setting up Intelligent Routing...');

    // Intelligent broker selection based on multiple factors
    setInterval(() => {
      this.performIntelligentRoutingAnalysis();
    }, 60000); // Every minute

    console.log('✅ Intelligent Routing active');
  }

  private async setupPredictiveAnalysis(): Promise<void> {
    console.log('🔮 Setting up Predictive Analysis...');

    // Generate integrated trading signals
    setInterval(() => {
      this.generateIntegratedTradingSignals();
    }, 30000); // Every 30 seconds

    console.log('✅ Predictive Analysis active');
  }

  // Event Handlers
  private handleMarketDataUpdate(data: any): void {
    try {
      // Check for significant price movements
      if (data.changePercent && Math.abs(data.changePercent) > 2) {
        this.generateCrossServiceAlert('market_opportunity', 'warning', {
          description: `Significant price movement detected: ${data.symbol} ${data.changePercent > 0 ? '+' : ''}${data.changePercent.toFixed(2)}%`,
          symbol: data.symbol,
          sourceServices: ['marketDataAggregator'],
          triggerEvent: 'price_movement',
          correlatedData: { marketData: data }
        });
      }

      // Update order management with new data
      if (this.orderManagement) {
        // Trigger smart order routing updates
        this.performanceMetrics.totalOrdersExecuted++;
      }

    } catch (error) {
      console.error('❌ Error handling market data update:', error);
    }
  }

  private handleEconomicEvent(event: any): void {
    try {
      // Generate trading signal based on economic event
      if (event.importance === 'critical' && event.volatilityExpected > 70) {
        const signal = this.generateEconomicBasedSignal(event);
        this.tradingSignals.set(signal.signalId, signal);

        this.generateCrossServiceAlert('market_opportunity', 'critical', {
          description: `High-impact economic event: ${event.title}`,
          symbol: event.affectedCurrencies[0] + 'USD',
          sourceServices: ['economicCalendar'],
          triggerEvent: 'critical_economic_event',
          correlatedData: { economicEvents: event }
        });
      }

      this.performanceMetrics.totalSignalsGenerated++;
    } catch (error) {
      console.error('❌ Error handling economic event:', error);
    }
  }

  private handleEconomicAlert(alert: any): void {
    try {
      this.generateCrossServiceAlert('risk_warning', alert.severity, {
        description: alert.message,
        sourceServices: ['economicCalendar'],
        triggerEvent: alert.alertType,
        correlatedData: { economicEvents: alert }
      });
    } catch (error) {
      console.error('❌ Error handling economic alert:', error);
    }
  }

  private handleSentimentUpdate(sentiment: any): void {
    try {
      // Check for sentiment anomalies
      if (sentiment.anomalies && sentiment.anomalies.length > 0) {
        for (const anomaly of sentiment.anomalies) {
          if (anomaly.severity === 'high') {
            this.generateCrossServiceAlert('market_opportunity', 'warning', {
              description: `Sentiment anomaly detected: ${anomaly.description}`,
              symbol: sentiment.symbol,
              sourceServices: ['socialSentiment'],
              triggerEvent: anomaly.type,
              correlatedData: { sentimentData: sentiment }
            });
          }
        }
      }

      // Generate sentiment-based trading signal
      if (Math.abs(sentiment.overallSentiment.score) > 0.7 && sentiment.volume.trendingScore > 80) {
        const signal = this.generateSentimentBasedSignal(sentiment);
        this.tradingSignals.set(signal.signalId, signal);
      }

    } catch (error) {
      console.error('❌ Error handling sentiment update:', error);
    }
  }

  private handleSentimentAlert(alert: any): void {
    try {
      this.generateCrossServiceAlert('market_opportunity', alert.severity, {
        description: alert.message,
        symbol: alert.symbol,
        sourceServices: ['socialSentiment'],
        triggerEvent: alert.alertType,
        correlatedData: { sentimentData: alert }
      });
    } catch (error) {
      console.error('❌ Error handling sentiment alert:', error);
    }
  }

  // Intelligent Analysis
  private performIntelligentRoutingAnalysis(): void {
    try {
      if (!this.unifiedBroker) return;

      // Analyze broker performance and route orders intelligently
      const brokerHealth = this.unifiedBroker.getBrokerHealth();
      const routingDecisions = [];

      for (const health of Array.isArray(brokerHealth) ? brokerHealth : [brokerHealth]) {
        if (health.status === 'online' && health.trading.successRate > 95) {
          routingDecisions.push({
            brokerId: health.brokerId,
            score: this.calculateBrokerScore(health),
            recommendation: 'increase_allocation'
          });
        } else if (health.trading.successRate < 90) {
          routingDecisions.push({
            brokerId: health.brokerId,
            score: this.calculateBrokerScore(health),
            recommendation: 'decrease_allocation'
          });
        }
      }

      this.performanceMetrics.lastUpdate = Date.now();
      console.log(`🧠 Intelligent routing analysis completed: ${routingDecisions.length} decisions made`);

    } catch (error) {
      console.error('❌ Error in intelligent routing analysis:', error);
    }
  }

  private calculateBrokerScore(health: any): number {
    let score = 0;
    
    // Success rate (40%)
    score += health.trading.successRate * 0.4;
    
    // Latency (30%)
    const latencyScore = Math.max(0, 100 - health.connectivity.latency / 10);
    score += latencyScore * 0.3;
    
    // Uptime (20%)
    score += health.connectivity.uptime * 0.2;
    
    // Market data quality (10%)
    const dataQualityScore = 100 - health.marketData.missedUpdates;
    score += dataQualityScore * 0.1;
    
    return Math.min(100, score);
  }

  private generateIntegratedTradingSignals(): void {
    try {
      for (const symbol of this.config.dataConfiguration.prioritySymbols) {
        const signal = this.createIntegratedSignal(symbol);
        if (signal && signal.consolidatedSignal.confidence > 70) {
          this.tradingSignals.set(signal.signalId, signal);
          
          // Execute signal if confidence is very high
          if (signal.consolidatedSignal.confidence > 90) {
            this.executeIntegratedSignal(signal);
          }
        }
      }

      this.performanceMetrics.totalSignalsGenerated++;
    } catch (error) {
      console.error('❌ Error generating integrated trading signals:', error);
    }
  }

  private createIntegratedSignal(symbol: string): IntegratedTradingSignal | null {
    try {
      // Gather data from all sources
      const marketData = this.marketDataAggregator?.getLatestData(symbol);
      const economicEvents = this.economicCalendar?.getEventsByCurrency(
        symbol.includes('USD') ? 'USD' : 'EUR', 1
      );
      const sentiment = this.socialSentiment?.getSentiment(symbol, '1h');

      if (!marketData) return null;

      // Technical analysis (mock)
      const technicalSignal = this.analyzeTechnicalSignal(marketData);
      
      // Fundamental analysis (mock)
      const fundamentalSignal = this.analyzeFundamentalSignal(symbol, economicEvents || []);
      
      // Sentiment analysis
      const sentimentSignal = this.analyzeSentimentSignal(sentiment);
      
      // Economic impact analysis
      const economicSignal = this.analyzeEconomicSignal(economicEvents || []);

      // Consolidate signals
      const consolidatedSignal = this.consolidateSignals(
        technicalSignal, fundamentalSignal, sentimentSignal, economicSignal
      );

      const signal: IntegratedTradingSignal = {
        signalId: this.generateSignalId(),
        timestamp: Date.now(),
        symbol,
        technicalSignal,
        fundamentalSignal,
        sentimentSignal,
        economicSignal,
        consolidatedSignal,
        executionRecommendation: this.generateExecutionRecommendation(consolidatedSignal, symbol)
      };

      return signal;

    } catch (error) {
      console.error(`❌ Error creating integrated signal for ${symbol}:`, error);
      return null;
    }
  }

  private analyzeTechnicalSignal(marketData: any): IntegratedTradingSignal['technicalSignal'] {
    // Mock technical analysis
    const change = marketData.changePercent || 0;
    const volume = marketData.volume || 0;
    
    return {
      direction: change > 0 ? 'buy' : change < 0 ? 'sell' : 'hold',
      strength: Math.min(100, Math.abs(change) * 20),
      confidence: volume > 1000000 ? 85 : 65,
      timeframe: '1h',
      indicators: ['RSI', 'MACD', 'Moving Average']
    };
  }

  private analyzeFundamentalSignal(symbol: string, events: any[]): IntegratedTradingSignal['fundamentalSignal'] {
    // Mock fundamental analysis
    const hasPositiveEvents = events.some(e => e.actual > e.forecast);
    
    return {
      direction: hasPositiveEvents ? 'buy' : 'hold',
      strength: hasPositiveEvents ? 70 : 50,
      confidence: events.length > 0 ? 80 : 60,
      reasoning: hasPositiveEvents ? ['Positive economic data'] : ['No significant events'],
      priceTarget: 1.0 + (hasPositiveEvents ? 0.02 : 0)
    };
  }

  private analyzeSentimentSignal(sentiment: any): IntegratedTradingSignal['sentimentSignal'] {
    if (!sentiment) {
      return {
        direction: 'hold',
        strength: 0,
        confidence: 0,
        volume: 0,
        trendingScore: 0
      };
    }

    const score = sentiment.overallSentiment.score;
    return {
      direction: score > 0.3 ? 'buy' : score < -0.3 ? 'sell' : 'hold',
      strength: Math.abs(score) * 100,
      confidence: sentiment.overallSentiment.confidence,
      volume: sentiment.volume.totalMentions,
      trendingScore: sentiment.volume.trendingScore
    };
  }

  private analyzeEconomicSignal(events: any[]): IntegratedTradingSignal['economicSignal'] {
    const criticalEvents = events.filter(e => e.importance === 'critical');
    const hasHighImpact = criticalEvents.length > 0;
    
    return {
      direction: hasHighImpact ? 'hold' : 'buy',
      strength: hasHighImpact ? 90 : 50,
      confidence: events.length > 0 ? 85 : 60,
      impactingEvents: criticalEvents.map(e => e.title),
      riskLevel: hasHighImpact ? 'high' : 'low'
    };
  }

  private consolidateSignals(
    technical: any, 
    fundamental: any, 
    sentiment: any, 
    economic: any
  ): IntegratedTradingSignal['consolidatedSignal'] {
    
    // Weight signals by confidence
    const weights = {
      technical: 0.3,
      fundamental: 0.25,
      sentiment: 0.25,
      economic: 0.2
    };

    // Calculate weighted direction score
    const directionScores = {
      buy: 0,
      sell: 0,
      hold: 0
    };

    const signals = [
      { signal: technical, weight: weights.technical },
      { signal: fundamental, weight: weights.fundamental },
      { signal: sentiment, weight: weights.sentiment },
      { signal: economic, weight: weights.economic }
    ];

    for (const { signal, weight } of signals) {
      const confidenceWeight = (signal.confidence / 100) * weight;
      directionScores[signal.direction as keyof typeof directionScores] += confidenceWeight;
    }

    // Determine overall direction
    const direction = Object.entries(directionScores).reduce((a, b) => 
      directionScores[a[0] as keyof typeof directionScores] > directionScores[b[0] as keyof typeof directionScores] ? a : b
    )[0] as 'buy' | 'sell' | 'hold';

    // Calculate overall strength and confidence
    const averageStrength = signals.reduce((sum, { signal, weight }) => 
      sum + signal.strength * weight, 0
    );

    const averageConfidence = signals.reduce((sum, { signal, weight }) => 
      sum + signal.confidence * weight, 0
    );

    // Risk assessment
    const riskScore = economic.riskLevel === 'high' ? 80 : 
                     economic.riskLevel === 'medium' ? 60 : 40;

    return {
      direction,
      strength: Math.round(averageStrength),
      confidence: Math.round(averageConfidence),
      riskScore,
      timeHorizon: averageConfidence > 80 ? 'short' : 'medium',
      reasoning: [
        `Technical: ${technical.direction} (${technical.confidence}%)`,
        `Fundamental: ${fundamental.direction} (${fundamental.confidence}%)`,
        `Sentiment: ${sentiment.direction} (${sentiment.confidence}%)`,
        `Economic: ${economic.direction} (${economic.confidence}%)`
      ]
    };
  }

  private generateExecutionRecommendation(
    signal: IntegratedTradingSignal['consolidatedSignal'], 
    symbol: string
  ): IntegratedTradingSignal['executionRecommendation'] {
    
    return {
      orderType: signal.confidence > 90 ? 'market' : 
                signal.confidence > 70 ? 'limit' : 'iceberg',
      quantity: this.calculatePositionSize(signal, symbol),
      priceTarget: 1.0, // Would be calculated based on analysis
      stopLoss: signal.direction === 'buy' ? 0.98 : 1.02,
      takeProfit: signal.direction === 'buy' ? 1.03 : 0.97,
      maxSlippage: signal.riskScore > 70 ? 0.1 : 0.05,
      brokerPreference: this.getBrokerPreference(symbol),
      urgency: signal.confidence > 90 ? 'high' : 
               signal.confidence > 70 ? 'medium' : 'low'
    };
  }

  private calculatePositionSize(signal: any, symbol: string): number {
    // Risk-based position sizing
    const baseSize = 10000; // Base position size
    const riskMultiplier = (100 - signal.riskScore) / 100;
    const confidenceMultiplier = signal.confidence / 100;
    
    return Math.round(baseSize * riskMultiplier * confidenceMultiplier);
  }

  private getBrokerPreference(symbol: string): string[] {
    // Return preferred brokers based on symbol and current performance
    return ['ic_markets', 'oanda']; // Default preference
  }

  private async executeIntegratedSignal(signal: IntegratedTradingSignal): Promise<void> {
    try {
      if (!this.orderManagement) {
        console.log('⚠️ Order Management not available for signal execution');
        return;
      }

      console.log(`⚡ Executing integrated signal: ${signal.symbol} ${signal.consolidatedSignal.direction}`);

      const order = {
        brokerId: signal.executionRecommendation.brokerPreference[0],
        symbol: signal.symbol,
        side: signal.consolidatedSignal.direction === 'buy' ? 'buy' : 'sell',
        type: signal.executionRecommendation.orderType === 'market' ? 'market' : 'limit',
        quantity: signal.executionRecommendation.quantity,
        price: signal.executionRecommendation.priceTarget,
        timeInForce: 'GTC' as const,
        metadata: {
          signalId: signal.signalId,
          strategy: 'integrated_signal',
          confidence: signal.consolidatedSignal.confidence.toString()
        }
      };

      // Select execution strategy based on order type
      let strategyId = 'sniper_default';
      if (signal.executionRecommendation.orderType === 'iceberg') {
        strategyId = 'iceberg_default';
      } else if (signal.executionRecommendation.orderType === 'twap') {
        strategyId = 'twap_default';
      }

      const result = await this.orderManagement.submitOrderWithStrategy(order, strategyId);
      
      console.log(`✅ Signal executed: ${result.parentOrderId}`);
      this.performanceMetrics.totalOrdersExecuted++;

    } catch (error) {
      console.error(`❌ Failed to execute integrated signal:`, error);
      
      this.generateCrossServiceAlert('execution_issue', 'critical', {
        description: `Failed to execute integrated signal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        symbol: signal.symbol,
        sourceServices: ['orderManagement'],
        triggerEvent: 'signal_execution_failure'
      });
    }
  }

  // Signal Generation Helpers
  private generateEconomicBasedSignal(event: any): IntegratedTradingSignal {
    const direction = event.actual > event.forecast ? 'buy' : 'sell';
    const strength = Math.abs(((event.actual - event.forecast) / event.forecast) * 100);
    
    return {
      signalId: this.generateSignalId(),
      timestamp: Date.now(),
      symbol: event.currency + 'USD',
      
      technicalSignal: {
        direction: 'hold',
        strength: 50,
        confidence: 60,
        timeframe: '1h',
        indicators: []
      },
      
      fundamentalSignal: {
        direction,
        strength: Math.min(100, strength),
        confidence: 85,
        reasoning: [`Economic event: ${event.title}`],
        priceTarget: 1.0
      },
      
      sentimentSignal: {
        direction: 'hold',
        strength: 50,
        confidence: 50,
        volume: 0,
        trendingScore: 0
      },
      
      economicSignal: {
        direction,
        strength: Math.min(100, strength),
        confidence: 90,
        impactingEvents: [event.title],
        riskLevel: event.importance === 'critical' ? 'high' : 'medium'
      },
      
      consolidatedSignal: {
        direction,
        strength: Math.min(100, strength),
        confidence: 85,
        riskScore: event.importance === 'critical' ? 80 : 60,
        timeHorizon: 'short',
        reasoning: [`High-impact economic event: ${event.title}`]
      },
      
      executionRecommendation: {
        orderType: 'limit',
        quantity: 50000,
        priceTarget: 1.0,
        stopLoss: direction === 'buy' ? 0.99 : 1.01,
        takeProfit: direction === 'buy' ? 1.02 : 0.98,
        maxSlippage: 0.05,
        brokerPreference: ['ic_markets', 'oanda'],
        urgency: 'high'
      }
    };
  }

  private generateSentimentBasedSignal(sentiment: any): IntegratedTradingSignal {
    const direction = sentiment.overallSentiment.score > 0 ? 'buy' : 'sell';
    const strength = Math.abs(sentiment.overallSentiment.score) * 100;
    
    return {
      signalId: this.generateSignalId(),
      timestamp: Date.now(),
      symbol: sentiment.symbol,
      
      technicalSignal: {
        direction: 'hold',
        strength: 50,
        confidence: 60,
        timeframe: '1h',
        indicators: []
      },
      
      fundamentalSignal: {
        direction: 'hold',
        strength: 50,
        confidence: 60,
        reasoning: [],
        priceTarget: 1.0
      },
      
      sentimentSignal: {
        direction,
        strength,
        confidence: sentiment.overallSentiment.confidence,
        volume: sentiment.volume.totalMentions,
        trendingScore: sentiment.volume.trendingScore
      },
      
      economicSignal: {
        direction: 'hold',
        strength: 50,
        confidence: 50,
        impactingEvents: [],
        riskLevel: 'low'
      },
      
      consolidatedSignal: {
        direction,
        strength,
        confidence: sentiment.overallSentiment.confidence,
        riskScore: 40,
        timeHorizon: 'short',
        reasoning: [`Strong social sentiment: ${sentiment.overallSentiment.label}`]
      },
      
      executionRecommendation: {
        orderType: 'iceberg',
        quantity: 25000,
        priceTarget: 1.0,
        stopLoss: direction === 'buy' ? 0.985 : 1.015,
        takeProfit: direction === 'buy' ? 1.015 : 0.985,
        maxSlippage: 0.03,
        brokerPreference: ['ic_markets', 'oanda'],
        urgency: sentiment.volume.trendingScore > 90 ? 'high' : 'medium'
      }
    };
  }

  // Alert Generation
  private generateCrossServiceAlert(
    type: CrossServiceAlert['type'],
    severity: CrossServiceAlert['severity'],
    alertData: Partial<CrossServiceAlert>
  ): void {
    const alertId = this.generateAlertId();
    
    const alert: CrossServiceAlert = {
      alertId,
      timestamp: Date.now(),
      type,
      severity,
      sourceServices: alertData.sourceServices || [],
      triggerEvent: alertData.triggerEvent || 'unknown',
      symbol: alertData.symbol,
      description: alertData.description || 'Cross-service alert generated',
      impact: alertData.impact || 'medium',
      recommendations: alertData.recommendations || [
        {
          action: 'Review alert details and take appropriate action',
          priority: 'medium',
          timeframe: '15 minutes',
          service: 'manual'
        }
      ],
      correlatedData: alertData.correlatedData || {},
      autoGenerated: true,
      processed: false
    };

    this.crossServiceAlerts.set(alertId, alert);
    this.performanceMetrics.totalAlertsGenerated++;

    // Notify subscribers
    this.notifyAlertSubscribers(alert);

    console.log(`🚨 Cross-service alert generated: ${type} - ${severity} - ${alert.description}`);
  }

  private notifyAlertSubscribers(alert: CrossServiceAlert): void {
    for (const [subId, subscription] of this.subscriptions.entries()) {
      if (!subscription.isActive) continue;
      
      try {
        if (subscription.callback) {
          subscription.callback(alert);
        }
      } catch (error) {
        console.error(`❌ Error in alert subscription callback ${subId}:`, error);
      }
    }
  }

  // Performance Monitoring
  private async startPerformanceMonitoring(): Promise<void> {
    console.log('📊 Starting performance monitoring...');

    // Health check timer
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.integrationSettings.healthCheckInterval);

    // Performance metrics update
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 60000); // Every minute

    console.log('✅ Performance monitoring started');
  }

  private async performHealthCheck(): Promise<Phase6Health> {
    const health: Phase6Health = {
      status: 'healthy',
      timestamp: Date.now(),
      
      components: {
        unifiedBrokerAPI: await this.getUnifiedBrokerHealth(),
        orderManagement: await this.getOrderManagementHealth(),
        positionReconciliation: await this.getPositionReconciliationHealth(),
        marketDataAggregator: await this.getMarketDataAggregatorHealth(),
        economicCalendar: await this.getEconomicCalendarHealth(),
        socialSentiment: await this.getSocialSentimentHealth()
      },
      
      performance: {
        totalThroughput: this.calculateTotalThroughput(),
        averageLatency: this.calculateAverageLatency(),
        errorRate: this.calculateErrorRate(),
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: this.getCPUUsage()
      },
      
      integration: {
        crossServiceEvents: this.crossServiceAlerts.size,
        intelligentRoutingDecisions: this.performanceMetrics.totalOrdersExecuted,
        predictiveAccuracy: this.calculatePredictiveAccuracy(),
        autoFailoverEvents: 0 // Would track actual failover events
      }
    };

    // Determine overall status
    const componentStatuses = Object.values(health.components).map(c => c.status);
    if (componentStatuses.some(s => s === 'offline')) {
      health.status = 'critical';
    } else if (componentStatuses.some(s => s === 'degraded')) {
      health.status = 'degraded';
    }

    this.isHealthy = health.status === 'healthy';
    return health;
  }

  private async getUnifiedBrokerHealth(): Promise<Phase6Health['components']['unifiedBrokerAPI']> {
    if (!this.unifiedBroker) {
      return {
        status: 'offline',
        brokersConnected: 0,
        totalBrokers: 0,
        averageLatency: 0,
        successRate: 0
      };
    }

    try {
      const brokerHealth = this.unifiedBroker.getBrokerHealth();
      const healthArray = Array.isArray(brokerHealth) ? brokerHealth : [brokerHealth];
      
      const onlineBrokers = healthArray.filter(h => h.status === 'online').length;
      const totalBrokers = healthArray.length;
      const avgLatency = healthArray.reduce((sum, h) => sum + h.connectivity.latency, 0) / totalBrokers;
      const avgSuccessRate = healthArray.reduce((sum, h) => sum + h.trading.successRate, 0) / totalBrokers;

      return {
        status: onlineBrokers === totalBrokers ? 'online' : onlineBrokers > 0 ? 'degraded' : 'offline',
        brokersConnected: onlineBrokers,
        totalBrokers,
        averageLatency: avgLatency,
        successRate: avgSuccessRate
      };
    } catch (error) {
      return {
        status: 'offline',
        brokersConnected: 0,
        totalBrokers: 0,
        averageLatency: 0,
        successRate: 0
      };
    }
  }

  private async getOrderManagementHealth(): Promise<Phase6Health['components']['orderManagement']> {
    if (!this.orderManagement) {
      return {
        status: 'offline',
        ordersProcessed: 0,
        averageExecutionTime: 0,
        successRate: 0,
        strategiesActive: 0
      };
    }

    try {
      const metrics = this.orderManagement.getExecutionMetrics();
      
      return {
        status: 'online',
        ordersProcessed: metrics.totalOrders,
        averageExecutionTime: metrics.averageExecutionTime,
        successRate: metrics.successfulOrders / Math.max(1, metrics.totalOrders) * 100,
        strategiesActive: this.orderManagement.getOrderStrategies().length
      };
    } catch (error) {
      return {
        status: 'offline',
        ordersProcessed: 0,
        averageExecutionTime: 0,
        successRate: 0,
        strategiesActive: 0
      };
    }
  }

  private async getPositionReconciliationHealth(): Promise<Phase6Health['components']['positionReconciliation']> {
    if (!this.positionReconciliation) {
      return {
        status: 'offline',
        positionsTracked: 0,
        discrepanciesFound: 0,
        reconciliationScore: 0,
        lastReconciliation: 0
      };
    }

    try {
      // Mock health data - in production would get real metrics
      return {
        status: 'online',
        positionsTracked: 15,
        discrepanciesFound: 1,
        reconciliationScore: 98.5,
        lastReconciliation: Date.now() - 300000 // 5 minutes ago
      };
    } catch (error) {
      return {
        status: 'offline',
        positionsTracked: 0,
        discrepanciesFound: 0,
        reconciliationScore: 0,
        lastReconciliation: 0
      };
    }
  }

  private async getMarketDataAggregatorHealth(): Promise<Phase6Health['components']['marketDataAggregator']> {
    if (!this.marketDataAggregator) {
      return {
        status: 'offline',
        providersConnected: 0,
        dataQualityScore: 0,
        averageLatency: 0,
        symbolsCovered: 0
      };
    }

    try {
      const metrics = this.marketDataAggregator.getPerformanceMetrics();
      const providers = this.marketDataAggregator.getProviders();
      const healthMap = this.marketDataAggregator.getProviderHealth();
      
      const onlineProviders = Array.from(healthMap.values()).filter(h => h.status === 'online').length;
      
      return {
        status: onlineProviders > 0 ? 'online' : 'offline',
        providersConnected: onlineProviders,
        dataQualityScore: metrics.dataQualityScore,
        averageLatency: metrics.averageLatency,
        symbolsCovered: this.marketDataAggregator.getAllLatestData().size
      };
    } catch (error) {
      return {
        status: 'offline',
        providersConnected: 0,
        dataQualityScore: 0,
        averageLatency: 0,
        symbolsCovered: 0
      };
    }
  }

  private async getEconomicCalendarHealth(): Promise<Phase6Health['components']['economicCalendar']> {
    if (!this.economicCalendar) {
      return {
        status: 'offline',
        eventsTracked: 0,
        alertsGenerated: 0,
        criticalEventsToday: 0,
        lastUpdate: 0
      };
    }

    try {
      const metrics = this.economicCalendar.getMetrics();
      
      return {
        status: 'online',
        eventsTracked: metrics.totalEvents,
        alertsGenerated: metrics.alertsSent,
        criticalEventsToday: metrics.criticalEvents,
        lastUpdate: metrics.lastUpdate
      };
    } catch (error) {
      return {
        status: 'offline',
        eventsTracked: 0,
        alertsGenerated: 0,
        criticalEventsToday: 0,
        lastUpdate: 0
      };
    }
  }

  private async getSocialSentimentHealth(): Promise<Phase6Health['components']['socialSentiment']> {
    if (!this.socialSentiment) {
      return {
        status: 'offline',
        sourcesActive: 0,
        sentimentAccuracy: 0,
        alertsGenerated: 0,
        trendingTopics: 0
      };
    }

    try {
      const metrics = this.socialSentiment.getMetrics();
      const sourceHealth = this.socialSentiment.getSourceHealth();
      
      const activeSources = Array.from(sourceHealth.values()).filter(h => h.status === 'online').length;
      
      return {
        status: activeSources > 0 ? 'online' : 'offline',
        sourcesActive: activeSources,
        sentimentAccuracy: metrics.sentimentAccuracy,
        alertsGenerated: metrics.alertsGenerated,
        trendingTopics: metrics.trendingTopicsDetected
      };
    } catch (error) {
      return {
        status: 'offline',
        sourcesActive: 0,
        sentimentAccuracy: 0,
        alertsGenerated: 0,
        trendingTopics: 0
      };
    }
  }

  // Performance Calculations
  private calculateTotalThroughput(): number {
    return this.performanceMetrics.totalSignalsGenerated + 
           this.performanceMetrics.totalOrdersExecuted + 
           this.performanceMetrics.totalAlertsGenerated;
  }

  private calculateAverageLatency(): number {
    // Mock calculation - would aggregate latencies from all services
    return 150; // milliseconds
  }

  private calculateErrorRate(): number {
    // Mock calculation - would track actual errors
    return 0.5; // 0.5% error rate
  }

  private getMemoryUsage(): number {
    // Mock memory usage
    return 45.2; // percent
  }

  private getCPUUsage(): number {
    // Mock CPU usage
    return 23.8; // percent
  }

  private calculatePredictiveAccuracy(): number {
    // Mock predictive accuracy
    return 78.5; // percent
  }

  private updatePerformanceMetrics(): void {
    this.performanceMetrics.systemUptime = Date.now() - (this.performanceMetrics.lastUpdate || Date.now());
    this.performanceMetrics.lastUpdate = Date.now();
  }

  // Utility Methods
  private generateSignalId(): string {
    return `signal_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  // Public API
  async subscribe(
    callback: (data: any) => void,
    filters?: any
  ): Promise<string> {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    this.subscriptions.set(subscriptionId, {
      callback,
      filters: filters || {},
      isActive: true
    });

    console.log(`📊 Phase 6 subscription created: ${subscriptionId}`);
    return subscriptionId;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      this.subscriptions.delete(subscriptionId);
      console.log(`✅ Phase 6 subscription removed: ${subscriptionId}`);
    }
  }

  getTradingSignals(symbol?: string): IntegratedTradingSignal[] {
    const signals = Array.from(this.tradingSignals.values());
    return symbol ? signals.filter(s => s.symbol === symbol) : signals;
  }

  getCrossServiceAlerts(type?: string, severity?: string): CrossServiceAlert[] {
    const alerts = Array.from(this.crossServiceAlerts.values());
    let filtered = alerts;
    
    if (type) filtered = filtered.filter(a => a.type === type);
    if (severity) filtered = filtered.filter(a => a.severity === severity);
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getSystemHealth(): Promise<Phase6Health> {
    return this.performHealthCheck();
  }

  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  // Service getters
  getUnifiedBroker(): UnifiedBrokerAPI | null {
    return this.unifiedBroker;
  }

  getOrderManagement(): AdvancedOrderManagementSystem | null {
    return this.orderManagement;
  }

  getPositionReconciliation(): PositionReconciliationEngine | null {
    return this.positionReconciliation;
  }

  getMarketDataAggregator(): EnterpriseMarketDataAggregator | null {
    return this.marketDataAggregator;
  }

  getEconomicCalendar(): EconomicCalendarService | null {
    return this.economicCalendar;
  }

  getSocialSentiment(): SocialSentimentAnalyzer | null {
    return this.socialSentiment;
  }

  isSystemHealthy(): boolean {
    return this.isHealthy;
  }

  isSystemInitialized(): boolean {
    return this.isInitialized;
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Wing Zero Phase 6 Integration...');

    // Stop all timers
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    for (const timer of this.integrationTimers.values()) {
      clearInterval(timer);
    }

    // Shutdown all services
    const shutdownPromises = [];

    if (this.unifiedBroker) {
      shutdownPromises.push(this.unifiedBroker.shutdown());
    }

    if (this.orderManagement) {
      shutdownPromises.push(this.orderManagement.shutdown());
    }

    if (this.positionReconciliation) {
      shutdownPromises.push(this.positionReconciliation.shutdown());
    }

    if (this.marketDataAggregator) {
      shutdownPromises.push(this.marketDataAggregator.shutdown());
    }

    if (this.economicCalendar) {
      shutdownPromises.push(this.economicCalendar.shutdown());
    }

    if (this.socialSentiment) {
      shutdownPromises.push(this.socialSentiment.shutdown());
    }

    await Promise.all(shutdownPromises);

    // Clear all data
    this.tradingSignals.clear();
    this.crossServiceAlerts.clear();
    this.subscriptions.clear();
    this.integrationTimers.clear();

    this.isInitialized = false;
    this.isHealthy = false;

    console.log('✅ Wing Zero Phase 6 Integration shutdown complete');
  }
}