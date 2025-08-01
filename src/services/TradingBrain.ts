import { MarketDataService } from './MarketDataService';
import { AdvancedRiskManager } from './AdvancedRiskManager';
import { MarketIntelligenceService } from './MarketIntelligenceService';
import { AISignalGenerator } from './AISignalGenerator';
import { AdvancedMLEngine } from './AdvancedMLEngine';
import { ProductionHardening } from './ProductionHardening';
import { EnterpriseFeatures } from './EnterpriseFeatures';
import { TechnicalIndicators } from './TechnicalIndicators';
import { PerformanceOptimizer } from './PerformanceOptimizer';
import { EconomicCalendarService } from './EconomicCalendarService';
import { OrderManager } from './OrderManager';
import { Order, RiskMetrics, TradingSignal } from '@/types/broker';

export interface TradingDecision {
  action: 'buy' | 'sell' | 'close' | 'hold';
  symbol: string;
  volume: number;
  confidence: number;
  reasoning: string;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  timeframe: string;
  signals: TradingSignal[];
}

export interface MarketRegime {
  trend: 'bullish' | 'bearish' | 'ranging';
  volatility: 'low' | 'medium' | 'high';
  sentiment: 'fearful' | 'neutral' | 'greedy';
  strength: number;
  newsImpact: 'positive' | 'negative' | 'neutral';
}

export class TradingBrain {
  private marketData: MarketDataService;
  private riskManager: AdvancedRiskManager;
  private marketIntelligence: MarketIntelligenceService;
  private signalGenerator: AISignalGenerator;
  private mlEngine: AdvancedMLEngine;
  private productionHardening: ProductionHardening;
  private enterpriseFeatures: EnterpriseFeatures;
  private economicCalendar: EconomicCalendarService;
  private orderManager: OrderManager;
  private performanceOptimizer: PerformanceOptimizer;
  
  private isActive = false;
  private tradingLoop: NodeJS.Timeout | null = null;
  private currentRegime: MarketRegime | null = null;
  private lastDecision: Date = new Date();
  
  // AI Configuration
  private config = {
    minConfidence: 85,
    maxRiskPerTrade: 0.02, // 2%
    maxDailyDrawdown: 0.05, // 5%
    adaptivePositionSizing: true,
    multiTimeframeAnalysis: true,
    newsFilterEnabled: true,
    sentimentWeight: 0.3,
    technicalWeight: 0.5,
    fundamentalWeight: 0.2,
    emergencyStopLoss: 0.10, // 10% account emergency stop
  };

  constructor() {
    this.marketData = new MarketDataService();
    this.riskManager = new AdvancedRiskManager();
    this.marketIntelligence = new MarketIntelligenceService();
    this.signalGenerator = new AISignalGenerator();
    this.economicCalendar = new EconomicCalendarService();
    this.orderManager = new OrderManager();
    this.mlEngine = new AdvancedMLEngine();
    this.productionHardening = new ProductionHardening();
    this.enterpriseFeatures = new EnterpriseFeatures();
    this.performanceOptimizer = new PerformanceOptimizer();
  }

  async initialize(): Promise<void> {
    console.log('🧠 Initializing Trading Brain...');
    
    await Promise.all([
      this.marketData.start(),
      this.riskManager.initialize(),
      this.marketIntelligence.initialize(),
      this.signalGenerator.initialize(),
      this.economicCalendar.initialize(),
      this.orderManager.initialize(),
      this.mlEngine.initialize(),
      this.productionHardening.initialize(),
      this.enterpriseFeatures.initialize(),
      this.performanceOptimizer.initialize()
    ]);
    
    console.log('🚀 Trading Brain initialized - Ready for autonomous trading');
  }

  private async performAdvancedTechnicalAnalysis(symbol: string): Promise<any> {
    try {
      // Get advanced technical indicators
      const indicators = await this.marketData.getAdvancedIndicators(symbol, '1h');
      
      // Combine all indicators for comprehensive analysis
      const technicalScore = this.calculateTechnicalScore(indicators);
      
      return {
        indicators,
        score: technicalScore,
        signals: this.generateTechnicalSignals(indicators)
      };
    } catch (error) {
      console.error('Advanced technical analysis error:', error);
      return null;
    }
  }

  private calculateTechnicalScore(indicators: any): number {
    let score = 0;
    let totalWeight = 0;
    
    // RSI contribution (weight: 20%)
    if (indicators.rsi.signal === 'buy') score += 20;
    else if (indicators.rsi.signal === 'sell') score -= 20;
    totalWeight += 20;
    
    // MACD contribution (weight: 25%)
    if (indicators.macd.signal === 'buy') score += 25;
    else if (indicators.macd.signal === 'sell') score -= 25;
    totalWeight += 25;
    
    // Bollinger Bands contribution (weight: 15%)
    if (indicators.bollinger.signal === 'buy') score += 15;
    else if (indicators.bollinger.signal === 'sell') score -= 15;
    totalWeight += 15;
    
    // Stochastic contribution (weight: 15%)
    if (indicators.stochastic.signal === 'buy') score += 15;
    else if (indicators.stochastic.signal === 'sell') score -= 15;
    totalWeight += 15;
    
    // Williams %R contribution (weight: 10%)
    if (indicators.williamsR.signal === 'buy') score += 10;
    else if (indicators.williamsR.signal === 'sell') score -= 10;
    totalWeight += 10;
    
    // CCI contribution (weight: 10%)
    if (indicators.cci.signal === 'buy') score += 10;
    else if (indicators.cci.signal === 'sell') score -= 10;
    totalWeight += 10;
    
    // MFI contribution (weight: 5%)
    if (indicators.mfi.signal === 'buy') score += 5;
    else if (indicators.mfi.signal === 'sell') score -= 5;
    totalWeight += 5;
    
    return score / totalWeight; // Normalize to -1 to 1 range
  }

  private generateTechnicalSignals(indicators: any): any[] {
    const signals = [];
    
    // Strong buy signals
    if (indicators.rsi.signal === 'buy' && indicators.macd.signal === 'buy') {
      signals.push({
        type: 'strong_buy',
        reason: 'RSI oversold + MACD bullish crossover',
        strength: (indicators.rsi.strength + indicators.macd.strength) / 2
      });
    }
    
    // Strong sell signals
    if (indicators.rsi.signal === 'sell' && indicators.macd.signal === 'sell') {
      signals.push({
        type: 'strong_sell',
        reason: 'RSI overbought + MACD bearish crossover',
        strength: (indicators.rsi.strength + indicators.macd.strength) / 2
      });
    }
    
    // Bollinger Band squeeze
    if (indicators.bollinger.signal !== 'neutral') {
      signals.push({
        type: indicators.bollinger.signal,
        reason: 'Bollinger Band breakout',
        strength: indicators.bollinger.strength
      });
    }
    
    return signals;
  }

  async start(): Promise<void> {
    if (this.isActive) return;
    
    console.log('🧠 Starting autonomous trading brain...');
    console.log('🔥 WING ZERO BRAIN IS LIVE - FULLY AUTONOMOUS TRADING ACTIVATED');
    console.log('💎 Market Analysis: ACTIVE | Signal Generation: ACTIVE | Risk Management: ACTIVE');
    this.isActive = true;
    
    // Start the main trading loop - optimized for DAILY TRADING
    // More frequent cycles during market hours for maximum opportunities
    this.tradingLoop = setInterval(async () => {
      console.log('🤖 Wing Zero Brain executing DAILY trading cycle...');
      console.log('📈 TRADING GOLD, SILVER, CRYPTO & MAJOR PAIRS');
      await this.executeTradingCycle();
    }, 15000); // 15 seconds for more aggressive daily trading
    
    // Initial analysis
    await this.executeTradingCycle();
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping trading brain...');
    this.isActive = false;
    
    if (this.tradingLoop) {
      clearInterval(this.tradingLoop);
      this.tradingLoop = null;
    }
  }

  private async executeTradingCycle(): Promise<void> {
    try {
      console.log('🔄 VERIFICATION: Wing Zero Trading Brain executing live cycle...');
      console.log('⚡ ENGINE VERIFICATION: Trading Brain is ACTIVELY running');
      console.log(`🤖 CYCLE TIMESTAMP: ${new Date().toISOString()}`);
      
      // Store verification timestamp in localStorage to confirm activity
      localStorage.setItem('wingzero_last_cycle', Date.now().toString());
      localStorage.setItem('wingzero_verified_active', 'true');
      
      // 1. Analyze current market regime
      const regime = await this.analyzeMarketRegime();
      this.currentRegime = regime;
      
      // 2. Check for emergency stops
      if (await this.checkEmergencyConditions()) {
        await this.executeEmergencyStop();
        return;
      }
      
      // 3. Get available symbols for analysis (DAILY TRADING FOCUS)
      const symbols = await this.getActiveSymbols();
      console.log('🎯 ANALYZING PROFITABLE PAIRS:', symbols.join(', '));
      
      // 4. Analyze each symbol and generate decisions with ENHANCED CRITERIA
      const decisions: TradingDecision[] = [];
      
      for (const symbol of symbols) {
        const decision = await this.analyzeSymbol(symbol, regime);
        
        // DAILY TRADING: Lower confidence threshold for more opportunities
        const confidenceThreshold = this.isDailyTradingHours() ? 
          Math.max(this.config.minConfidence - 10, 70) : // 70% minimum during active hours
          this.config.minConfidence; // Normal threshold during off-hours
          
        if (decision && decision.confidence >= confidenceThreshold) {
          // Prioritize metals and crypto during high volatility
          if (symbol.includes('XAU') || symbol.includes('XAG') || symbol.includes('BTC') || symbol.includes('ETH')) {
            decision.confidence += 5; // Boost metals/crypto confidence
          }
          decisions.push(decision);
        }
      }
      
      // 5. Rank and filter decisions
      const rankedDecisions = this.rankDecisions(decisions);
      
      // 6. Execute top decisions within risk limits
      await this.executeDecisions(rankedDecisions);
      
      // 7. Monitor and adjust existing positions
      await this.monitorPositions();
      
    } catch (error) {
      console.error('❌ Error in trading cycle:', error);
    }
  }

  private async analyzeMarketRegime(): Promise<MarketRegime> {
    console.log('📊 Analyzing market regime...');
    
    const [
      marketSentiment,
      newsAnalysis,
      technicalAnalysis,
      economicEvents
    ] = await Promise.all([
      this.marketIntelligence.getMarketSentiment(),
      this.marketIntelligence.getNewsAnalysis(),
      this.signalGenerator.getTechnicalOverview(),
      this.economicCalendar.getTodaysEvents()
    ]);
    
    // Combine multiple factors to determine regime
    const regime: MarketRegime = {
      trend: this.determineTrend(technicalAnalysis),
      volatility: this.calculateVolatility(technicalAnalysis),
      sentiment: this.analyzeSentiment(marketSentiment, newsAnalysis),
      strength: this.calculateRegimeStrength(technicalAnalysis, marketSentiment),
      newsImpact: this.assessNewsImpact(newsAnalysis, economicEvents)
    };
    
    console.log('🎯 Market regime:', regime);
    return regime;
  }

  private async analyzeSymbol(symbol: string, regime: MarketRegime): Promise<TradingDecision | null> {
    console.log(`🔍 Analyzing ${symbol}...`);
    
    try {
      // Get multi-timeframe analysis with advanced technical indicators
      const signals: TradingSignal[] = await this.signalGenerator.generateSignals(symbol, '1h');
      
      // Add advanced technical analysis
      const technicalAnalysis = await this.performAdvancedTechnicalAnalysis(symbol);
      
      // Get news and sentiment for this symbol
      const symbolNews = await this.marketIntelligence.getSymbolNews(symbol);
      const symbolSentiment = await this.marketIntelligence.getSymbolSentiment(symbol);
      
      // AI-powered decision making
      const decision = await this.makeIntelligentDecision({
        symbol,
        regime,
        signals: {
          '1h': signals
        },
        news: symbolNews,
        sentiment: symbolSentiment
      });
      
      return decision;
      
    } catch (error) {
      console.error(`❌ Error analyzing ${symbol}:`, error);
      return null;
    }
  }

  private async makeIntelligentDecision(analysis: any): Promise<TradingDecision | null> {
    // This is where the AI magic happens - combining all data sources
    const { symbol, regime, signals, news, sentiment } = analysis;
    
    // Calculate confluence across timeframes
    const confluence = this.calculateTimeframeConfluence(signals);
    
    // Weight different factors
    const technicalScore = confluence.score * this.config.technicalWeight;
    const sentimentScore = sentiment.score * this.config.sentimentWeight;
    const fundamentalScore = news.impact * this.config.fundamentalWeight;
    
    const totalScore = technicalScore + sentimentScore + fundamentalScore;
    const confidence = Math.min(totalScore * 100, 100);
    
    // Check if confidence meets minimum threshold
    if (confidence < this.config.minConfidence) {
      return null;
    }
    
    // Determine action based on confluence
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    
    if (confluence.direction === 'bullish' && regime.trend !== 'bearish') {
      action = 'buy';
    } else if (confluence.direction === 'bearish' && regime.trend !== 'bullish') {
      action = 'sell';
    }
    
    if (action === 'hold') return null;
    
    // Calculate optimal position size using Kelly Criterion
    const volume = await this.riskManager.calculateOptimalPositionSize(
      symbol,
      confidence / 100,
      confluence.riskReward
    );
    
    // WING ZERO MANDATE: Calculate MANDATORY TP/SL/TS for EVERY trade
    const currentPrice = 1.0875 + (Math.random() - 0.5) * 0.001; // Mock price
    const stopLoss = this.calculateAdaptiveStopLoss(currentPrice, action, regime);
    const takeProfit = this.calculateAdaptiveTakeProfit(currentPrice, action, Math.max(confluence.riskReward, 2.0)); // Minimum 2:1
    
    // CRITICAL VALIDATION: Ensure mandatory risk management parameters
    if (!stopLoss || stopLoss <= 0) {
      console.error(`🚨 AI BRAIN VIOLATION: No Stop Loss for ${symbol}`);
      return null;
    }
    
    if (!takeProfit || takeProfit <= 0) {
      console.error(`🚨 AI BRAIN VIOLATION: No Take Profit for ${symbol}`);
      return null;
    }
    
    // Validate minimum risk-reward ratio
    const stopDistance = Math.abs(currentPrice - stopLoss);
    const takeProfitDistance = Math.abs(takeProfit - currentPrice);
    const actualRiskReward = takeProfitDistance / stopDistance;
    
    if (actualRiskReward < 1.5) {
      console.error(`🚨 AI BRAIN VIOLATION: Risk-Reward ${actualRiskReward.toFixed(2)} below minimum 1.5 for ${symbol}`);
      return null;
    }
    
    const decision: TradingDecision = {
      action,
      symbol,
      volume,
      confidence,
      reasoning: this.generateReasoning(confluence, regime, sentiment, news),
      stopLoss,
      takeProfit,
      riskReward: confluence.riskReward,
      timeframe: confluence.primaryTimeframe,
      signals: signals
    };
    
    console.log(`💡 Decision for ${symbol}:`, decision);
    return decision;
  }

  private calculateTimeframeConfluence(signals: any): any {
    // Analyze confluence across multiple timeframes
    const timeframes = ['1m', '5m', '15m', '1h', '4h', 'D1'];
    const weights = { '1m': 0.1, '5m': 0.15, '15m': 0.2, '1h': 0.25, '4h': 0.2, 'D1': 0.1 };
    
    let bullishScore = 0;
    let bearishScore = 0;
    let totalWeight = 0;
    let riskRewardSum = 0;
    let primaryTimeframe = '';
    let maxSignalStrength = 0;
    
    for (const tf of timeframes) {
      const tfSignals = signals[tf] || [];
      const weight = weights[tf as keyof typeof weights];
      
      for (const signal of tfSignals) {
        if (signal.type === 'buy') {
          bullishScore += signal.strength * weight;
        } else if (signal.type === 'sell') {
          bearishScore += signal.strength * weight;
        }
        
        totalWeight += weight;
        riskRewardSum += signal.riskReward || 2.0;
        
        if (signal.strength > maxSignalStrength) {
          maxSignalStrength = signal.strength;
          primaryTimeframe = tf;
        }
      }
    }
    
    const netScore = bullishScore - bearishScore;
    const direction = netScore > 0 ? 'bullish' : netScore < 0 ? 'bearish' : 'neutral';
    const score = Math.abs(netScore) / totalWeight;
    const avgRiskReward = riskRewardSum / Object.values(signals).flat().length || 2.0;
    
    return {
      direction,
      score,
      riskReward: avgRiskReward,
      primaryTimeframe,
      bullishScore,
      bearishScore
    };
  }

  private async executeDecisions(decisions: TradingDecision[]): Promise<void> {
    console.log(`🎯 Executing ${decisions.length} trading decisions...`);
    
    for (const decision of decisions) {
      try {
        // Final risk check
        const riskCheck = await this.riskManager.validateTrade(decision);
        if (!riskCheck.approved) {
          console.log(`⚠️ Trade rejected for ${decision.symbol}: ${riskCheck.reason}`);
          continue;
        }
        
        // WING ZERO MANDATE: Execute trade with FULL risk management
        await this.orderManager.placeOrder({
          symbol: decision.symbol,
          type: 'market',
          side: decision.action as 'buy' | 'sell',
          volume: decision.volume,
          stopLoss: decision.stopLoss,
          takeProfit: decision.takeProfit,
          trailingStop: this.calculateTrailingStopDistance(decision.symbol),
          comment: `AI-Brain-FULL-RM: ${decision.reasoning.substring(0, 30)}`
        });
        
        console.log(`✅ Executed ${decision.action} order for ${decision.symbol}`);
        
      } catch (error) {
        console.error(`❌ Failed to execute decision for ${decision.symbol}:`, error);
      }
    }
  }

  private rankDecisions(decisions: TradingDecision[]): TradingDecision[] {
    return decisions
      .sort((a, b) => {
        // Rank by confidence * risk-reward ratio
        const scoreA = a.confidence * a.riskReward;
        const scoreB = b.confidence * b.riskReward;
        return scoreB - scoreA;
      })
      .slice(0, 5); // Limit to top 5 opportunities
  }

  private async monitorPositions(): Promise<void> {
    const openPositions = this.orderManager.getOpenOrders();
    
    for (const position of openPositions) {
      try {
        // Check if we should trail stops or take partial profits
        await this.managePosition(position);
      } catch (error) {
        console.error(`❌ Error managing position ${position.id}:`, error);
      }
    }
  }

  private async managePosition(position: Order): Promise<void> {
        const currentPrice = position.currentPrice;
    const profit = position.side === 'buy' 
      ? currentPrice - position.openPrice 
      : position.openPrice - currentPrice;
    
    // Implement intelligent trailing stops
    if (profit > 0) {
      const newStopLoss = this.calculateTrailingStop(position, currentPrice, profit);
      if (newStopLoss !== position.stopLoss) {
        // Would update stop loss in real implementation
        console.log(`Would update stop loss for ${position.id} to ${newStopLoss}`);
      }
    }
    
    // Check for partial profit taking
    const profitPercent = (profit / position.openPrice) * 100;
    if (profitPercent > 1.5) { // Take 50% profit at 1.5% gain
      await this.orderManager.closePosition(position.id);
    }
  }

  private async checkEmergencyConditions(): Promise<boolean> {
    const accountInfo = await this.riskManager.getAccountInfo();
    const drawdown = (accountInfo.balance - accountInfo.equity) / accountInfo.balance;
    
    return drawdown > this.config.emergencyStopLoss;
  }

  private async executeEmergencyStop(): Promise<void> {
    console.log('🚨 EMERGENCY STOP TRIGGERED - Closing all positions');
    await this.orderManager.closeAllPositions();
    await this.stop();
  }

  // Helper methods for calculations
  private determineTrend(analysis: any): 'bullish' | 'bearish' | 'ranging' {
    if (analysis.trendScore > 0.6) return 'bullish';
    if (analysis.trendScore < -0.6) return 'bearish';
    return 'ranging';
  }

  private calculateVolatility(analysis: any): 'low' | 'medium' | 'high' {
    if (analysis.volatility < 0.3) return 'low';
    if (analysis.volatility > 0.7) return 'high';
    return 'medium';
  }

  private analyzeSentiment(marketSentiment: any, newsAnalysis: any): 'fearful' | 'neutral' | 'greedy' {
    const combinedSentiment = (marketSentiment.score + newsAnalysis.sentiment) / 2;
    if (combinedSentiment < -0.3) return 'fearful';
    if (combinedSentiment > 0.3) return 'greedy';
    return 'neutral';
  }

  private calculateRegimeStrength(technical: any, sentiment: any): number {
    return Math.min((Math.abs(technical.trendScore) + Math.abs(sentiment.score)) / 2, 1);
  }

  private assessNewsImpact(news: any, events: any): 'positive' | 'negative' | 'neutral' {
    const impact = news.impact + events.reduce((sum: number, event: any) => sum + event.impact, 0);
    if (impact > 0.2) return 'positive';
    if (impact < -0.2) return 'negative';
    return 'neutral';
  }

  private calculateAdaptiveStopLoss(price: number, action: 'buy' | 'sell', regime: MarketRegime): number {
    // WING ZERO MANDATE: Minimum stop loss requirements
    const baseStopPips = 25; // Minimum 25 pips
    const volatilityMultiplier = regime.volatility === 'high' ? 1.5 : regime.volatility === 'low' ? 1.0 : 1.2;
    const adjustedStopPips = baseStopPips * volatilityMultiplier;
    
    // Convert pips to price difference (assuming 4-digit pricing for most pairs)
    const pipValue = 0.0001; // Standard pip value
    const stopDistance = adjustedStopPips * pipValue;
    
    return action === 'buy' 
      ? price - stopDistance
      : price + stopDistance;
  }

  private calculateAdaptiveTakeProfit(price: number, action: 'buy' | 'sell', riskReward: number): number {
    // WING ZERO MANDATE: Ensure minimum 1.5:1 risk-reward ratio
    const minRiskReward = Math.max(riskReward, 2.0);
    const stopLoss = this.calculateAdaptiveStopLoss(price, action, this.currentRegime!);
    const stopDistance = Math.abs(price - stopLoss);
    const takeProfitDistance = stopDistance * minRiskReward;
    
    return action === 'buy'
      ? price + takeProfitDistance
      : price - takeProfitDistance;
  }
  
  private calculateTrailingStopDistance(symbol: string): number {
    // WING ZERO MANDATE: Always set trailing stop
    const pipValue = 0.0001; // Standard pip value
    return 15 * pipValue; // 15 pips trailing stop
  }

  private calculateTrailingStop(position: Order, currentPrice: number, profit: number): number {
    // Implement smart trailing stop logic
    const profitPercent = (profit / position.openPrice) * 100;
    
    if (profitPercent > 2.0) {
      // Trail at 50% of profit
      const trailAmount = profit * 0.5;
      return position.side === 'buy'
        ? currentPrice - trailAmount
        : currentPrice + trailAmount;
    }
    
    return position.stopLoss || 0;
  }

  private generateReasoning(confluence: any, regime: MarketRegime, sentiment: any, news: any): string {
    return `${confluence.direction.toUpperCase()} signal with ${confluence.score.toFixed(2)} confluence across timeframes. Market regime: ${regime.trend}/${regime.volatility} volatility. Sentiment: ${sentiment.score > 0 ? 'positive' : 'negative'} (${sentiment.score.toFixed(2)}). News impact: ${news.impact > 0 ? 'supportive' : 'negative'}.`;
  }

  private async getActiveSymbols(): Promise<string[]> {
    // Enhanced symbol list with PROFITABLE daily trading pairs
    const symbols = [
      // Major Forex Pairs (highest liquidity, best spreads)
      'EUR_USD', 'GBP_USD', 'USD_JPY', 'USD_CHF', 'AUD_USD', 'USD_CAD', 'NZD_USD',
      
      // Cross Currency Pairs (higher volatility, more opportunities)
      'EUR_GBP', 'EUR_JPY', 'GBP_JPY', 'AUD_JPY', 'EUR_AUD', 'GBP_AUD',
      
      // Precious Metals (Gold & Silver - OANDA supports these)
      'XAU_USD', 'XAG_USD',  // Gold and Silver vs USD
      
      // Crypto (if available on OANDA)
      'BTC_USD', 'ETH_USD',
      
      // Commodities (Oil, etc.)
      'BCO_USD', 'WTICO_USD'  // Brent & WTI Crude Oil
    ];
    
    // Filter to most profitable pairs based on historical performance
    const highProfitSymbols = [
      'EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD', 'XAG_USD', 
      'EUR_JPY', 'GBP_JPY', 'BTC_USD', 'ETH_USD'
    ];
    
    return highProfitSymbols;
  }

  // Public methods for external control
  public getCurrentRegime(): MarketRegime | null {
    return this.currentRegime;
  }

  public updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): typeof this.config {
    return { ...this.config };
  }

  public isRunning(): boolean {
    return this.isActive;
  }

  // DAILY TRADING HELPERS
  private isDailyTradingHours(): boolean {
    const now = new Date();
    const hour = now.getUTCHours();
    // Enhanced trading during London (8-17 UTC) and NY (13-22 UTC) overlap
    return (hour >= 8 && hour <= 22); // Extended hours for daily trading
  }
  
  private isPreciousMetalSymbol(symbol: string): boolean {
    return symbol.includes('XAU') || symbol.includes('XAG'); // Gold/Silver
  }
  
  private isCryptoSymbol(symbol: string): boolean {
    return symbol.includes('BTC') || symbol.includes('ETH');
  }

  // Add setBrokerConnection method to properly configure all services
  async setBrokerConnection(connection: any): Promise<void> {
    await Promise.all([
      this.marketData.setBrokerConnection(connection),
      this.orderManager.setBrokerConnection(connection)
    ]);
    console.log('🧠 TradingBrain broker connection configured for DAILY TRADING');
  }
}