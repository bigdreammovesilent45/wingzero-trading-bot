import { useState, useEffect, useCallback, useRef } from 'react';
import { WingZeroAIBrain } from '@/services/ai/WingZeroAIBrain';

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

interface AISystemStatus {
  sentiment_analyzer: 'online' | 'offline' | 'error';
  predictive_models: 'online' | 'offline' | 'error';
  pattern_recognition: 'online' | 'offline' | 'error';
  risk_scoring: 'online' | 'offline' | 'error';
  strategy_optimization: 'online' | 'offline' | 'error';
  overall_status: 'healthy' | 'degraded' | 'critical' | 'offline';
  last_update: number;
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

interface UseAIBrainReturn {
  // AI Brain instance
  aiBrain: WingZeroAIBrain | null;
  
  // Status and configuration
  isInitialized: boolean;
  isRunning: boolean;
  systemStatus: AISystemStatus | null;
  configuration: AIConfiguration | null;
  
  // Market data and insights
  marketIntelligence: Map<string, MarketIntelligence>;
  allDecisions: Map<string, AIDecision[]>;
  latestDecisions: Map<string, AIDecision | null>;
  
  // Summary and alerts
  aiSummary: {
    market_outlook: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    top_opportunities: string[];
    risk_alerts: string[];
    recommended_actions: string[];
  } | null;
  
  // Methods
  initialize: (config?: Partial<AIConfiguration>) => Promise<void>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  forceUpdate: () => Promise<void>;
  getDecision: (symbol: string) => AIDecision | null;
  getIntelligence: (symbol: string) => MarketIntelligence | null;
  updateConfiguration: (config: Partial<AIConfiguration>) => void;
  
  // Component access
  getSentimentAnalyzer: () => any;
  getLSTMModeling: () => any;
  getPatternEngine: () => any;
  getRiskEngine: () => any;
  getStrategyOptimizer: () => any;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

export const useAIBrain = (autoInitialize: boolean = true): UseAIBrainReturn => {
  const [aiBrain, setAIBrain] = useState<WingZeroAIBrain | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [systemStatus, setSystemStatus] = useState<AISystemStatus | null>(null);
  const [configuration, setConfiguration] = useState<AIConfiguration | null>(null);
  const [marketIntelligence, setMarketIntelligence] = useState<Map<string, MarketIntelligence>>(new Map());
  const [allDecisions, setAllDecisions] = useState<Map<string, AIDecision[]>>(new Map());
  const [latestDecisions, setLatestDecisions] = useState<Map<string, AIDecision | null>>(new Map());
  const [aiSummary, setAISummary] = useState<any>(null);
  
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const initialize = useCallback(async (config?: Partial<AIConfiguration>) => {
    if (isInitialized) {
      console.log('⚠️ AI Brain already initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🧠 Initializing AI Brain from hook...');
      const brain = new WingZeroAIBrain(config);
      setAIBrain(brain);
      setConfiguration(brain.getConfiguration());
      setIsInitialized(true);
      console.log('✅ AI Brain initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize AI Brain';
      setError(errorMessage);
      console.error('❌ AI Brain initialization failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const start = useCallback(async () => {
    if (!aiBrain) {
      setError('AI Brain not initialized');
      return;
    }

    if (isRunning) {
      console.log('⚠️ AI Brain already running');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await aiBrain.start();
      setIsRunning(true);
      console.log('✅ AI Brain started successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start AI Brain';
      setError(errorMessage);
      console.error('❌ AI Brain start failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [aiBrain, isRunning]);

  const stop = useCallback(async () => {
    if (!aiBrain || !isRunning) {
      return;
    }

    setIsLoading(true);

    try {
      await aiBrain.stop();
      setIsRunning(false);
      
      // Clear update interval
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      
      console.log('✅ AI Brain stopped successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop AI Brain';
      setError(errorMessage);
      console.error('❌ AI Brain stop failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [aiBrain, isRunning]);

  const forceUpdate = useCallback(async () => {
    if (!aiBrain) {
      setError('AI Brain not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await aiBrain.forceIntelligenceUpdate();
      console.log('✅ AI Brain forced update completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to force update AI Brain';
      setError(errorMessage);
      console.error('❌ AI Brain force update failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [aiBrain]);

  const getDecision = useCallback((symbol: string): AIDecision | null => {
    if (!aiBrain) return null;
    return aiBrain.getLatestDecision(symbol);
  }, [aiBrain]);

  const getIntelligence = useCallback((symbol: string): MarketIntelligence | null => {
    if (!aiBrain) return null;
    return aiBrain.getMarketIntelligence(symbol);
  }, [aiBrain]);

  const updateConfiguration = useCallback((config: Partial<AIConfiguration>) => {
    if (!aiBrain) {
      setError('AI Brain not initialized');
      return;
    }

    try {
      aiBrain.updateConfiguration(config);
      setConfiguration(aiBrain.getConfiguration());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update configuration';
      setError(errorMessage);
      console.error('❌ Configuration update failed:', err);
    }
  }, [aiBrain]);

  // Component access methods
  const getSentimentAnalyzer = useCallback(() => {
    return aiBrain?.getSentimentAnalyzer() || null;
  }, [aiBrain]);

  const getLSTMModeling = useCallback(() => {
    return aiBrain?.getLSTMModeling() || null;
  }, [aiBrain]);

  const getPatternEngine = useCallback(() => {
    return aiBrain?.getPatternEngine() || null;
  }, [aiBrain]);

  const getRiskEngine = useCallback(() => {
    return aiBrain?.getRiskEngine() || null;
  }, [aiBrain]);

  const getStrategyOptimizer = useCallback(() => {
    return aiBrain?.getStrategyOptimizer() || null;
  }, [aiBrain]);

  // Update data from AI Brain
  const updateDataFromBrain = useCallback(() => {
    if (!aiBrain || !isRunning) return;

    try {
      // Update system status
      const status = aiBrain.getSystemStatus();
      setSystemStatus(status);

      // Update market intelligence
      const intelligence = aiBrain.getAllMarketIntelligence();
      setMarketIntelligence(intelligence);

      // Update decisions
      const symbols = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD', 'BTC_USD'];
      const newAllDecisions = new Map<string, AIDecision[]>();
      const newLatestDecisions = new Map<string, AIDecision | null>();

      symbols.forEach(symbol => {
        const decisions = aiBrain.getAllDecisions(symbol);
        const latestDecision = aiBrain.getLatestDecision(symbol);
        
        newAllDecisions.set(symbol, decisions);
        newLatestDecisions.set(symbol, latestDecision);
      });

      setAllDecisions(newAllDecisions);
      setLatestDecisions(newLatestDecisions);

      // Update AI summary
      const summary = aiBrain.getAISummary();
      setAISummary(summary);

    } catch (err) {
      console.error('❌ Failed to update data from AI Brain:', err);
    }
  }, [aiBrain, isRunning]);

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize && !isInitialized && !isLoading) {
      initialize();
    }
  }, [autoInitialize, isInitialized, isLoading, initialize]);

  // Set up periodic data updates when running
  useEffect(() => {
    if (isRunning && aiBrain) {
      // Initial update
      updateDataFromBrain();

      // Set up periodic updates
      updateIntervalRef.current = setInterval(() => {
        updateDataFromBrain();
      }, 30000); // Update every 30 seconds

      return () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
          updateIntervalRef.current = null;
        }
      };
    }
  }, [isRunning, aiBrain, updateDataFromBrain]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  return {
    // Core
    aiBrain,
    isInitialized,
    isRunning,
    systemStatus,
    configuration,
    
    // Data
    marketIntelligence,
    allDecisions,
    latestDecisions,
    aiSummary,
    
    // Methods
    initialize,
    start,
    stop,
    forceUpdate,
    getDecision,
    getIntelligence,
    updateConfiguration,
    
    // Component access
    getSentimentAnalyzer,
    getLSTMModeling,
    getPatternEngine,
    getRiskEngine,
    getStrategyOptimizer,
    
    // States
    isLoading,
    error
  };
};