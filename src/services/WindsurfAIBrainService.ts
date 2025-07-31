import * as tf from '@tensorflow/tfjs';
import { AdvancedMLEngine, MLModel } from './AdvancedMLEngine';
import { MarketSentimentService } from './MarketSentimentService';
import { PredictiveModelingEngine } from './PredictiveModelingEngine';
import { TradingSignal } from '@/types/broker';

export interface AIBrainConfig {
  learningRate: number;
  modelUpdateFrequency: number;
  confidenceThreshold: number;
  maxConcurrentAnalysis: number;
  enableRealTimeAdaptation: boolean;
  riskToleranceLevel: 'conservative' | 'moderate' | 'aggressive';
}

export interface AIBrainMetrics {
  modelsActive: number;
  predictionsGenerated: number;
  accuracyScore: number;
  adaptationCycles: number;
  processingLatency: number;
  memoryUsage: number;
}

export class WindsurfAIBrainService {
  private static instance: WindsurfAIBrainService;
  private mlEngine: AdvancedMLEngine;
  private sentimentService: MarketSentimentService;
  private predictiveEngine: PredictiveModelingEngine;
  private isInitialized = false;
  private isActive = false;
  private config: AIBrainConfig;
  private metrics: AIBrainMetrics;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.mlEngine = new AdvancedMLEngine();
    this.sentimentService = MarketSentimentService.getInstance();
    this.predictiveEngine = new PredictiveModelingEngine();
    
    this.config = {
      learningRate: 0.001,
      modelUpdateFrequency: 3600000, // 1 hour
      confidenceThreshold: 0.85,
      maxConcurrentAnalysis: 5,
      enableRealTimeAdaptation: true,
      riskToleranceLevel: 'moderate'
    };

    this.metrics = {
      modelsActive: 0,
      predictionsGenerated: 0,
      accuracyScore: 0,
      adaptationCycles: 0,
      processingLatency: 0,
      memoryUsage: 0
    };
  }

  static getInstance(): WindsurfAIBrainService {
    if (!WindsurfAIBrainService.instance) {
      WindsurfAIBrainService.instance = new WindsurfAIBrainService();
    }
    return WindsurfAIBrainService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🧠 Windsurf AI Brain: Initializing advanced ML systems...');
    
    try {
      // Initialize TensorFlow.js backend
      await tf.ready();
      console.log('✅ TensorFlow.js backend ready:', tf.getBackend());

      // Initialize core services
      await this.mlEngine.initialize();
      await this.predictiveEngine.initialize();
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      this.emit('initialized', { timestamp: Date.now() });
      
      console.log('🚀 Windsurf AI Brain: Fully operational');
    } catch (error) {
      console.error('❌ AI Brain initialization failed:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.isActive = true;
    this.startAnalysisLoop();
    this.emit('started', { timestamp: Date.now() });
    
    console.log('🎯 Windsurf AI Brain: Analysis loops started');
  }

  async stop(): Promise<void> {
    this.isActive = false;
    this.emit('stopped', { timestamp: Date.now() });
    
    console.log('⏹️ Windsurf AI Brain: Stopped');
  }

  async generateAdvancedSignals(symbols: string[]): Promise<TradingSignal[]> {
    const startTime = performance.now();
    const allSignals: TradingSignal[] = [];

    try {
      // Process symbols in batches to respect maxConcurrentAnalysis
      const batches = this.createBatches(symbols, this.config.maxConcurrentAnalysis);
      
      for (const batch of batches) {
        const batchPromises = batch.map(async (symbol) => {
          // Get ML signals
          const mlSignals = await this.mlEngine.generateAdvancedSignals(symbol, '1h');
          
          // Get predictive signals
          const predictiveSignals = await this.predictiveEngine.generatePredictions(symbol);
          
          // Get sentiment analysis
          const sentiment = await this.sentimentService.analyzeSentiment(symbol);
          
          // Combine and enhance signals
          return this.combineSignals(mlSignals, predictiveSignals, sentiment, symbol);
        });
        
        const batchResults = await Promise.all(batchPromises);
        allSignals.push(...batchResults.flat());
      }

      // Filter by confidence threshold
      const highConfidenceSignals = allSignals.filter(
        signal => signal.confidence >= this.config.confidenceThreshold * 100
      );

      // Update metrics
      this.updateMetrics(startTime, highConfidenceSignals.length);
      
      this.emit('signalsGenerated', {
        count: highConfidenceSignals.length,
        symbols: symbols.length,
        avgConfidence: this.calculateAverageConfidence(highConfidenceSignals)
      });

      return highConfidenceSignals;
    } catch (error) {
      console.error('❌ Signal generation failed:', error);
      this.emit('error', { error: error.message, type: 'signal_generation' });
      return [];
    }
  }

  async adaptModels(marketData: any): Promise<void> {
    if (!this.config.enableRealTimeAdaptation) return;

    try {
      // Trigger model evolution in ML engine
      await this.mlEngine.evolveModels();
      
      // Update predictive models with new data
      await this.predictiveEngine.updateModels(marketData);
      
      this.metrics.adaptationCycles++;
      this.emit('modelsAdapted', { 
        cycle: this.metrics.adaptationCycles,
        timestamp: Date.now()
      });
      
      console.log('🧬 AI Brain: Models adapted to market conditions');
    } catch (error) {
      console.error('❌ Model adaptation failed:', error);
      this.emit('error', { error: error.message, type: 'model_adaptation' });
    }
  }

  private async startAnalysisLoop(): Promise<void> {
    while (this.isActive) {
      try {
        // Get market overview
        const marketOverview = await this.sentimentService.getMarketOverview();
        
        // Adapt models based on market regime
        await this.adaptModels(marketOverview);
        
        // Wait for next cycle
        await new Promise(resolve => setTimeout(resolve, this.config.modelUpdateFrequency));
      } catch (error) {
        console.error('❌ Analysis loop error:', error);
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s on error
      }
    }
  }

  private combineSignals(
    mlSignals: TradingSignal[],
    predictiveSignals: TradingSignal[],
    sentiment: any,
    symbol: string
  ): TradingSignal[] {
    const combinedSignals: TradingSignal[] = [];
    
    // Enhance ML signals with sentiment and predictions
    mlSignals.forEach(mlSignal => {
      const matchingPredictive = predictiveSignals.find(p => p.action === mlSignal.action);
      
      let enhancedConfidence = mlSignal.confidence;
      
      // Boost confidence if sentiment aligns
      if (sentiment.sentiment === 'bullish' && mlSignal.action === 'buy') {
        enhancedConfidence = Math.min(98, enhancedConfidence * 1.1);
      } else if (sentiment.sentiment === 'bearish' && mlSignal.action === 'sell') {
        enhancedConfidence = Math.min(98, enhancedConfidence * 1.1);
      }
      
      // Boost confidence if predictive model agrees
      if (matchingPredictive && matchingPredictive.confidence > 80) {
        enhancedConfidence = Math.min(98, enhancedConfidence * 1.05);
      }
      
      combinedSignals.push({
        ...mlSignal,
        confidence: enhancedConfidence,
        metadata: {
          ...mlSignal.metadata,
          sentimentScore: sentiment.score,
          predictiveConfidence: matchingPredictive?.confidence || 0,
          aiEnhanced: true
        }
      });
    });
    
    return combinedSignals;
  }

  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  private calculateAverageConfidence(signals: TradingSignal[]): number {
    if (signals.length === 0) return 0;
    return signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length;
  }

  private updateMetrics(startTime: number, signalCount: number): void {
    this.metrics.processingLatency = performance.now() - startTime;
    this.metrics.predictionsGenerated += signalCount;
    this.metrics.modelsActive = this.getActiveModelCount();
    this.metrics.memoryUsage = this.getMemoryUsage();
  }

  private getActiveModelCount(): number {
    return this.mlEngine.getEvolutionStats().models + 
           this.predictiveEngine.getModelCount();
  }

  private getMemoryUsage(): number {
    if (tf.memory) {
      return tf.memory().numBytes / (1024 * 1024); // MB
    }
    return 0;
  }

  private setupEventListeners(): void {
    // Setup internal event handling
    this.addEventListener('error', (error) => {
      console.error('🚨 AI Brain Error:', error);
    });
  }

  // Event system
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Event listener error for ${event}:`, error);
      }
    });
  }

  addEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  removeEventListener(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Public API
  getMetrics(): AIBrainMetrics {
    return { ...this.metrics };
  }

  updateConfig(newConfig: Partial<AIBrainConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  getConfig(): AIBrainConfig {
    return { ...this.config };
  }

  isOperational(): boolean {
    return this.isInitialized && this.isActive;
  }

  async dispose(): Promise<void> {
    this.stop();
    tf.disposeVariables();
    this.eventListeners.clear();
    console.log('🧠 AI Brain: Resources disposed');
  }
}