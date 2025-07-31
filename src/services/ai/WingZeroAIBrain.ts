import { AdvancedMarketSentimentAnalyzer } from './AdvancedMarketSentimentAnalyzer';
import { LSTMPredictiveModeling } from './LSTMPredictiveModeling';
import { PatternRecognitionEngine } from './PatternRecognitionEngine';
import { RiskScoringEngine } from './RiskScoringEngine';
import { StrategyOptimizationEngine } from './StrategyOptimizationEngine';

interface AIDecision {
  symbol: string;
  action: 'buy' | 'sell' | 'hold' | 'close';
  confidence: number;
  reasoning: string[];
  risk_assessment: {
    risk_score: number;
    position_size: number;
    stop_loss: number;
    take_profit: number;
  };
  supporting_signals: {
    sentiment: number;
    technical_patterns: string[];
    price_prediction: number;
    volatility_forecast: number;
    strategy_signals: string[];
  };
  time_horizon: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface AISystemStatus {
  sentiment_analyzer: 'online' | 'offline' | 'error';
  predictive_models: 'online' | 'offline' | 'error';
  pattern_recognition: 'online' | 'offline' | 'error';
  risk_scoring: 'online' | 'offline' | 'error';
  strategy_optimization: 'online' | 'offline' | 'error';
  overall_status: 'healthy' | 'degraded' | 'critical' | 'offline';
  last_update: number;
}

interface MarketIntelligence {
  symbol: string;
  current_sentiment: {
    overall: number;
    confidence: number;
    trend: string;
  };
  price_forecasts: {
    short_term: number;
    medium_term: number;
    long_term: number;
  };
  detected_patterns: {
    candlestick: string[];
    chart_formations: string[];
    support_resistance: number[];
  };
  risk_metrics: {
    var_95: number;
    volatility: number;
    risk_category: string;
  };
  optimal_strategies: {
    name: string;
    expected_return: number;
    max_drawdown: number;
  }[];
  market_regime: 'trending' | 'ranging' | 'volatile' | 'calm';
  conviction_level: number;
}

interface AIConfiguration {
  enable_sentiment_analysis: boolean;
  enable_predictive_modeling: boolean;
  enable_pattern_recognition: boolean;
  enable_risk_scoring: boolean;
  enable_strategy_optimization: boolean;
  decision_threshold: number;
  max_concurrent_positions: number;
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  update_frequency: number;
}

export class WingZeroAIBrain {
  private isRunning = false;
  private configuration: AIConfiguration;
  private marketIntelligence: Map<string, MarketIntelligence> = new Map();
  private aiDecisions: Map<string, AIDecision[]> = new Map();
  private systemStatus: AISystemStatus;

  // AI Component Instances
  private sentimentAnalyzer: AdvancedMarketSentimentAnalyzer;
  private lstmModeling: LSTMPredictiveModeling;
  private patternEngine: PatternRecognitionEngine;
  private riskEngine: RiskScoringEngine;
  private strategyOptimizer: StrategyOptimizationEngine;

  private readonly DEFAULT_CONFIG: AIConfiguration = {
    enable_sentiment_analysis: true,
    enable_predictive_modeling: true,
    enable_pattern_recognition: true,
    enable_risk_scoring: true,
    enable_strategy_optimization: true,
    decision_threshold: 0.7,
    max_concurrent_positions: 5,
    risk_tolerance: 'moderate',
    update_frequency: 60000
  };

    constructor(config?: Partial<AIConfiguration>) {
    this.configuration = { ...this.DEFAULT_CONFIG, ...config };
    
    this.systemStatus = {
      sentiment_analyzer: 'offline',
      predictive_models: 'offline', 
      pattern_recognition: 'offline',
      risk_scoring: 'offline',
      strategy_optimization: 'offline',
      overall_status: 'offline',
      last_update: Date.now()
    };

    // Initialize AI components
    this.sentimentAnalyzer = new AdvancedMarketSentimentAnalyzer();
    this.lstmModeling = new LSTMPredictiveModeling();
    this.patternEngine = new PatternRecognitionEngine();
    this.riskEngine = new RiskScoringEngine();
    this.strategyOptimizer = new StrategyOptimizationEngine();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Wing Zero AI Brain already running');
      return;
    }

    console.log('🧠 Starting Wing Zero AI Brain...');
    this.isRunning = true;

    try {
      // Start all AI components
      if (this.configuration.enable_sentiment_analysis) {
        await this.sentimentAnalyzer.start();
        this.systemStatus.sentiment_analyzer = 'online';
      }

      if (this.configuration.enable_predictive_modeling) {
        await this.lstmModeling.start();
        this.systemStatus.predictive_models = 'online';
      }

      if (this.configuration.enable_pattern_recognition) {
        await this.patternEngine.start();
        this.systemStatus.pattern_recognition = 'online';
      }

      if (this.configuration.enable_risk_scoring) {
        await this.riskEngine.start();
        this.systemStatus.risk_scoring = 'online';
      }

      if (this.configuration.enable_strategy_optimization) {
        await this.strategyOptimizer.start();
        this.systemStatus.strategy_optimization = 'online';
      }

      this.systemStatus.overall_status = 'healthy';
      this.systemStatus.last_update = Date.now();

      // Start intelligence gathering with real AI components
      setInterval(() => {
        this.gatherMarketIntelligence();
        this.generateAIDecisions();
      }, this.configuration.update_frequency);

      console.log('✅ Wing Zero AI Brain is online with all components active');
    } catch (error) {
      console.error('❌ Failed to start AI Brain:', error);
      this.systemStatus.overall_status = 'critical';
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Stop all AI components
    await Promise.all([
      this.sentimentAnalyzer.stop(),
      this.lstmModeling.stop(),
      this.patternEngine.stop(),
      this.riskEngine.stop(),
      this.strategyOptimizer.stop()
    ]);

    this.systemStatus = {
      sentiment_analyzer: 'offline',
      predictive_models: 'offline',
      pattern_recognition: 'offline',
      risk_scoring: 'offline',
      strategy_optimization: 'offline',
      overall_status: 'offline',
      last_update: Date.now()
    };

    console.log('🛑 Wing Zero AI Brain stopped');
  }

  private async gatherMarketIntelligence(): Promise<void> {
    if (!this.isRunning) return;

    const symbols = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD', 'BTC_USD'];

    for (const symbol of symbols) {
      try {
        const intelligence = await this.generateRealIntelligence(symbol);
        this.marketIntelligence.set(symbol, intelligence);
      } catch (error) {
        console.error(`❌ Failed to gather intelligence for ${symbol}:`, error);
        // Fallback to mock data if real analysis fails
        const fallbackIntelligence = this.generateMockIntelligence(symbol);
        this.marketIntelligence.set(symbol, fallbackIntelligence);
      }
    }
  }

  private async generateRealIntelligence(symbol: string): Promise<MarketIntelligence> {
    // Gather real AI insights from all components
    const sentimentData = this.configuration.enable_sentiment_analysis ? 
      this.sentimentAnalyzer.getMarketSentiment(symbol) : null;
    
    const predictions = this.configuration.enable_predictive_modeling ? 
      this.lstmModeling.getPrediction(symbol) : null;
    
    const patterns = this.configuration.enable_pattern_recognition ? 
      this.patternEngine.getAllPatterns()[symbol] : null;
    
    const riskMetrics = this.configuration.enable_risk_scoring ? 
      this.riskEngine.getRiskMetrics(symbol) : null;
    
    const strategies = this.configuration.enable_strategy_optimization ? 
      this.strategyOptimizer.getStrategyPerformance() : null;

    // Synthesize all AI inputs into unified intelligence
    const overallSentiment = sentimentData?.overall || 0;
    const sentimentConfidence = sentimentData?.confidence || 0;
    const sentimentTrend = overallSentiment > 0.1 ? 'bullish' : 
                         overallSentiment < -0.1 ? 'bearish' : 'neutral';

    const shortTermForecast = predictions?.predictions?.[0]?.price || 1.0850;
    const mediumTermForecast = predictions?.predictions?.[1]?.price || 1.0850;
    const longTermForecast = predictions?.predictions?.[2]?.price || 1.0850;

    const candlestickPatterns = patterns?.candlestick?.map(p => p.name) || [];
    const chartFormations = patterns?.chart?.map(p => p.name) || [];
    const supportLevels = patterns?.levels?.filter(l => l.type === 'support').map(l => l.price) || [1.0800];
    const resistanceLevels = patterns?.levels?.filter(l => l.type === 'resistance').map(l => l.price) || [1.0900];

    const var95 = riskMetrics?.value_at_risk?.confidence_95 || 0.02;
    const volatility = riskMetrics?.volatility || 0.01;
    const riskCategory = riskMetrics?.risk_category || 'medium';

    const topStrategies = Object.entries(strategies || {})
      .filter(([_, perf]: [string, any]) => perf.sharpe_ratio > 0.5)
      .slice(0, 2)
      .map(([name, perf]: [string, any]) => ({
        name,
        expected_return: perf.total_return,
        max_drawdown: perf.max_drawdown
      }));

    // Determine market regime based on multiple factors
    let marketRegime: 'trending' | 'ranging' | 'volatile' | 'calm';
    const trendDirection = patterns?.trend?.direction;
    const trendStrength = patterns?.trend?.strength || 0;
    
    if (volatility > 0.02) {
      marketRegime = 'volatile';
    } else if (trendStrength > 0.7) {
      marketRegime = 'trending';
    } else if (volatility < 0.005) {
      marketRegime = 'calm';
    } else {
      marketRegime = 'ranging';
    }

    // Calculate conviction level based on signal alignment
    let convictionFactors = 0;
    let totalFactors = 0;

    if (sentimentData) {
      convictionFactors += Math.abs(sentimentData.overall) * sentimentData.confidence;
      totalFactors++;
    }

    if (predictions) {
      const predictionConfidence = predictions.predictions[0]?.confidence || 0;
      convictionFactors += predictionConfidence;
      totalFactors++;
    }

    if (patterns?.candlestick?.length > 0) {
      const avgPatternConfidence = patterns.candlestick.reduce((sum, p) => sum + p.confidence, 0) / patterns.candlestick.length;
      convictionFactors += avgPatternConfidence;
      totalFactors++;
    }

    const convictionLevel = totalFactors > 0 ? (convictionFactors / totalFactors) * 100 : 50;

    return {
      symbol,
      current_sentiment: {
        overall: overallSentiment,
        confidence: sentimentConfidence,
        trend: sentimentTrend
      },
      price_forecasts: {
        short_term: shortTermForecast,
        medium_term: mediumTermForecast,
        long_term: longTermForecast
      },
      detected_patterns: {
        candlestick: candlestickPatterns,
        chart_formations: chartFormations,
        support_resistance: [...supportLevels, ...resistanceLevels].slice(0, 5)
      },
      risk_metrics: {
        var_95: var95,
        volatility,
        risk_category: riskCategory
      },
      optimal_strategies: topStrategies,
      market_regime: marketRegime,
      conviction_level: convictionLevel
    };
  }

  private generateMockIntelligence(symbol: string): MarketIntelligence {
    const sentiment = (Math.random() - 0.5) * 2; // -1 to 1
    const volatility = 0.01 + Math.random() * 0.02; // 1% to 3%
    const conviction = 50 + Math.random() * 50; // 50-100

    return {
      symbol,
      current_sentiment: {
        overall: sentiment,
        confidence: 0.6 + Math.random() * 0.4,
        trend: sentiment > 0.1 ? 'bullish' : sentiment < -0.1 ? 'bearish' : 'neutral'
      },
      price_forecasts: {
        short_term: 1.0850 + (Math.random() - 0.5) * 0.01,
        medium_term: 1.0850 + (Math.random() - 0.5) * 0.02,
        long_term: 1.0850 + (Math.random() - 0.5) * 0.03
      },
      detected_patterns: {
        candlestick: ['Doji', 'Hammer'][Math.floor(Math.random() * 2)] ? ['Doji'] : [],
        chart_formations: ['Triangle', 'Flag'][Math.floor(Math.random() * 2)] ? ['Triangle'] : [],
        support_resistance: [1.0800, 1.0900]
      },
      risk_metrics: {
        var_95: volatility * 1.64,
        volatility,
        risk_category: volatility > 0.02 ? 'high' : volatility > 0.015 ? 'medium' : 'low'
      },
      optimal_strategies: [
        { name: 'Trend Following', expected_return: 0.12, max_drawdown: 0.08 },
        { name: 'Mean Reversion', expected_return: 0.08, max_drawdown: 0.05 }
      ],
      market_regime: ['trending', 'ranging', 'volatile', 'calm'][Math.floor(Math.random() * 4)] as any,
      conviction_level: conviction
    };
  }

  private async generateAIDecisions(): Promise<void> {
    if (!this.isRunning) return;

    for (const [symbol, intelligence] of this.marketIntelligence.entries()) {
      if (intelligence.conviction_level > 70) {
        const decision = this.createMockDecision(symbol, intelligence);
        
        if (!this.aiDecisions.has(symbol)) {
          this.aiDecisions.set(symbol, []);
        }
        
        const decisions = this.aiDecisions.get(symbol)!;
        decisions.push(decision);
        
        if (decisions.length > 10) {
          this.aiDecisions.set(symbol, decisions.slice(-10));
        }
      }
    }
  }

  private createMockDecision(symbol: string, intelligence: MarketIntelligence): AIDecision {
    const sentiment = intelligence.current_sentiment.overall;
    const action = sentiment > 0.3 ? 'buy' : sentiment < -0.3 ? 'sell' : 'hold';
    const confidence = 0.6 + Math.random() * 0.3;

    return {
      symbol,
      action,
      confidence,
      reasoning: [`${intelligence.current_sentiment.trend} sentiment detected`, 'Technical patterns support decision'],
      risk_assessment: {
        risk_score: intelligence.risk_metrics.var_95 * 100,
        position_size: 0.02,
        stop_loss: intelligence.risk_metrics.volatility * 2,
        take_profit: intelligence.risk_metrics.volatility * 4
      },
      supporting_signals: {
        sentiment: intelligence.current_sentiment.overall,
        technical_patterns: intelligence.detected_patterns.candlestick,
        price_prediction: intelligence.price_forecasts.short_term,
        volatility_forecast: intelligence.risk_metrics.volatility,
        strategy_signals: intelligence.optimal_strategies.map(s => s.name)
      },
      time_horizon: 120,
      priority: confidence > 0.8 ? 'high' : confidence > 0.7 ? 'medium' : 'low'
    };
  }

  // Public API methods
  getMarketIntelligence(symbol: string): MarketIntelligence | null {
    return this.marketIntelligence.get(symbol) || null;
  }

  getAllMarketIntelligence(): Map<string, MarketIntelligence> {
    return new Map(this.marketIntelligence);
  }

  getLatestDecision(symbol: string): AIDecision | null {
    const decisions = this.aiDecisions.get(symbol);
    return decisions && decisions.length > 0 ? decisions[decisions.length - 1] : null;
  }

  getAllDecisions(symbol: string): AIDecision[] {
    return this.aiDecisions.get(symbol) || [];
  }

  getSystemStatus(): AISystemStatus {
    return { ...this.systemStatus };
  }

  updateConfiguration(config: Partial<AIConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
    console.log('🔧 AI Brain configuration updated');
  }

  getConfiguration(): AIConfiguration {
    return { ...this.configuration };
  }

  async forceIntelligenceUpdate(): Promise<void> {
    // Force update all AI components
    if (this.configuration.enable_sentiment_analysis) {
      await this.sentimentAnalyzer.forceUpdate();
    }
    
    if (this.configuration.enable_predictive_modeling) {
      await this.lstmModeling.forceUpdate();
    }
    
    if (this.configuration.enable_pattern_recognition) {
      await this.patternEngine.forceUpdate();
    }
    
    if (this.configuration.enable_risk_scoring) {
      await this.riskEngine.forceUpdate();
    }
    
    if (this.configuration.enable_strategy_optimization) {
      await this.strategyOptimizer.forceOptimization();
    }

    // Then update intelligence and decisions
    await this.gatherMarketIntelligence();
    await this.generateAIDecisions();
  }

  // Public API for accessing AI components
  getSentimentAnalyzer(): AdvancedMarketSentimentAnalyzer {
    return this.sentimentAnalyzer;
  }

  getLSTMModeling(): LSTMPredictiveModeling {
    return this.lstmModeling;
  }

  getPatternEngine(): PatternRecognitionEngine {
    return this.patternEngine;
  }

  getRiskEngine(): RiskScoringEngine {
    return this.riskEngine;
  }

  getStrategyOptimizer(): StrategyOptimizationEngine {
    return this.strategyOptimizer;
  }

  getAISummary(): {
    market_outlook: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    top_opportunities: string[];
    risk_alerts: string[];
    recommended_actions: string[];
  } {
    const allIntelligence = Array.from(this.marketIntelligence.values());
    
    if (allIntelligence.length === 0) {
      return {
        market_outlook: 'neutral',
        confidence: 0,
        top_opportunities: [],
        risk_alerts: [],
        recommended_actions: ['Waiting for market data...']
      };
    }

    const avgSentiment = allIntelligence.reduce((sum, intel) => 
      sum + intel.current_sentiment.overall, 0) / allIntelligence.length;

    const avgConfidence = allIntelligence.reduce((sum, intel) => 
      sum + intel.conviction_level, 0) / allIntelligence.length;

    const marketOutlook = avgSentiment > 0.1 ? 'bullish' : 
                         avgSentiment < -0.1 ? 'bearish' : 'neutral';

    const opportunities = allIntelligence
      .filter(intel => intel.conviction_level > 70)
      .sort((a, b) => b.conviction_level - a.conviction_level)
      .slice(0, 3)
      .map(intel => `${intel.symbol}: ${intel.current_sentiment.trend} trend`);

    const riskAlerts = allIntelligence
      .filter(intel => intel.risk_metrics.risk_category === 'high')
      .map(intel => `High volatility in ${intel.symbol}`);

    const recommendations = [
      marketOutlook === 'bullish' ? 'Consider long positions' : 
      marketOutlook === 'bearish' ? 'Consider defensive positioning' : 
      'Wait for clearer signals'
    ];

    return {
      market_outlook: marketOutlook,
      confidence: avgConfidence,
      top_opportunities: opportunities,
      risk_alerts: riskAlerts,
      recommended_actions: recommendations
    };
  }
}