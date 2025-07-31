interface SentimentData {
  source: 'news' | 'social' | 'economic' | 'technical';
  text: string;
  timestamp: number;
  relevance: number;
  confidence: number;
}

interface SentimentScore {
  overall: number;
  bullish: number;
  bearish: number;
  neutral: number;
  confidence: number;
  factors: {
    news: number;
    social: number;
    economic: number;
    technical: number;
  };
}

interface MarketEvent {
  type: 'earnings' | 'economic_data' | 'central_bank' | 'geopolitical' | 'technical_breakout';
  symbol?: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  description: string;
  timestamp: number;
  expectedDuration: number;
}

interface VolatilityPrediction {
  symbol: string;
  timeframe: '1h' | '4h' | '1d' | '1w';
  predictedVolatility: number;
  currentVolatility: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  factors: string[];
}

export class AdvancedMarketSentimentAnalyzer {
  private sentimentHistory: Map<string, SentimentData[]> = new Map();
  private marketEvents: MarketEvent[] = [];
  private volatilityPredictions: Map<string, VolatilityPrediction> = new Map();
  private sentimentKeywords: Map<string, number> = new Map();
  private economicIndicators: Map<string, number> = new Map();
  private isRunning = false;
  
  private readonly SENTIMENT_WINDOW = 24 * 60 * 60 * 1000;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.6;
  private readonly UPDATE_INTERVAL = 60000;

  constructor() {
    this.initializeSentimentKeywords();
    this.initializeEconomicIndicators();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Market Sentiment Analyzer already running');
      return;
    }

    console.log('🧠 Starting Advanced Market Sentiment Analyzer...');
    this.isRunning = true;

    setInterval(() => {
      this.performSentimentAnalysis();
      this.updateVolatilityPredictions();
      this.detectMarketEvents();
    }, this.UPDATE_INTERVAL);

    console.log('✅ Advanced Market Sentiment Analyzer started');
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('🛑 Advanced Market Sentiment Analyzer stopped');
  }

  private initializeSentimentKeywords(): void {
    const bullishKeywords = [
      'bullish', 'rally', 'surge', 'breakout', 'uptrend', 'momentum', 'strong',
      'buy', 'long', 'optimistic', 'positive', 'growth', 'expansion',
      'recovery', 'support', 'resistance', 'breakthrough', 'acceleration'
    ];

    const bearishKeywords = [
      'bearish', 'crash', 'dump', 'breakdown', 'downtrend', 'weak', 'sell',
      'short', 'pessimistic', 'negative', 'decline', 'contraction', 'recession',
      'fear', 'uncertainty', 'volatility', 'risk', 'correction', 'pullback'
    ];

    bullishKeywords.forEach(keyword => {
      this.sentimentKeywords.set(keyword, 1.0);
    });

    bearishKeywords.forEach(keyword => {
      this.sentimentKeywords.set(keyword, -1.0);
    });

    const neutralKeywords = [
      'sideways', 'range', 'consolidation', 'stable', 'unchanged', 'flat',
      'neutral', 'wait', 'monitor', 'observe', 'analysis', 'data'
    ];

    neutralKeywords.forEach(keyword => {
      this.sentimentKeywords.set(keyword, 0.0);
    });
  }

  private initializeEconomicIndicators(): void {
    const indicators = [
      { name: 'GDP', impact: 0.9 },
      { name: 'inflation', impact: 0.8 },
      { name: 'employment', impact: 0.7 },
      { name: 'interest_rates', impact: 0.9 },
      { name: 'retail_sales', impact: 0.6 },
      { name: 'manufacturing', impact: 0.5 },
      { name: 'consumer_confidence', impact: 0.6 },
      { name: 'trade_balance', impact: 0.4 },
      { name: 'oil_prices', impact: 0.7 },
      { name: 'dollar_index', impact: 0.8 }
    ];

    indicators.forEach(indicator => {
      this.economicIndicators.set(indicator.name, indicator.impact);
    });
  }

  private analyzeSentiment(text: string, source: SentimentData['source']): {
    sentiment: number;
    confidence: number;
    keywords: string[];
  } {
    const words = this.tokenizeText(text);
    const matchedKeywords: string[] = [];
    let sentimentSum = 0;
    let keywordCount = 0;

    words.forEach(word => {
      const sentiment = this.sentimentKeywords.get(word.toLowerCase());
      if (sentiment !== undefined) {
        sentimentSum += sentiment;
        keywordCount++;
        matchedKeywords.push(word);
      }
    });

    let sentiment = keywordCount > 0 ? sentimentSum / keywordCount : 0;
    const sourceWeight = this.getSourceWeight(source);
    sentiment *= sourceWeight;

    const keywordDensity = keywordCount / words.length;
    const confidence = Math.min(0.95, keywordDensity * 2 + sourceWeight * 0.3);

    sentiment = this.applyContextualModifiers(text, sentiment);

    return {
      sentiment: Math.max(-1, Math.min(1, sentiment)),
      confidence,
      keywords: matchedKeywords
    };
  }

  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  private getSourceWeight(source: SentimentData['source']): number {
    switch (source) {
      case 'economic': return 1.0;
      case 'news': return 0.8;
      case 'technical': return 0.7;
      case 'social': return 0.5;
      default: return 0.5;
    }
  }

  private applyContextualModifiers(text: string, sentiment: number): number {
    let modifier = 1.0;

    if (text.match(/\b(not|no|never|without|lack)\b/i)) {
      modifier *= -0.8;
    }

    if (text.match(/\b(very|extremely|highly|significantly)\b/i)) {
      modifier *= 1.3;
    }

    if (text.match(/\b(slightly|somewhat|moderately)\b/i)) {
      modifier *= 0.7;
    }

    if (text.includes('?')) {
      modifier *= 0.8;
    }

    return sentiment * modifier;
  }

  async processSentimentData(data: SentimentData[]): Promise<void> {
    for (const item of data) {
      const analysis = this.analyzeSentiment(item.text, item.source);
      
      const enrichedData: SentimentData = {
        ...item,
        confidence: analysis.confidence
      };

      const symbol = this.extractSymbolFromText(item.text) || 'GENERAL';
      if (!this.sentimentHistory.has(symbol)) {
        this.sentimentHistory.set(symbol, []);
      }

      const history = this.sentimentHistory.get(symbol)!;
      history.push(enrichedData);

      const cutoffTime = Date.now() - this.SENTIMENT_WINDOW;
      this.sentimentHistory.set(symbol, 
        history.filter(item => item.timestamp > cutoffTime)
      );
    }
  }

  private extractSymbolFromText(text: string): string | null {
    const symbolPatterns = [
      /\b(EUR[/_]USD|EURUSD)\b/i,
      /\b(GBP[/_]USD|GBPUSD)\b/i,
      /\b(USD[/_]JPY|USDJPY)\b/i,
      /\b(XAU[/_]USD|XAUUSD|GOLD)\b/i,
      /\b(BTC[/_]USD|BTCUSD|BITCOIN)\b/i
    ];

    for (const pattern of symbolPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].replace(/[/_]/g, '_').toUpperCase();
      }
    }

    return null;
  }

  getSentimentScore(symbol: string): SentimentScore {
    const history = this.sentimentHistory.get(symbol) || [];
    const recentData = history.filter(item => 
      Date.now() - item.timestamp < this.SENTIMENT_WINDOW
    );

    if (recentData.length === 0) {
      return {
        overall: 0,
        bullish: 0,
        bearish: 0,
        neutral: 1,
        confidence: 0,
        factors: {
          news: 0,
          social: 0,
          economic: 0,
          technical: 0
        }
      };
    }

    let weightedSentiment = 0;
    let totalWeight = 0;
    const factors = { news: 0, social: 0, economic: 0, technical: 0 };
    const factorCounts = { news: 0, social: 0, economic: 0, technical: 0 };

    recentData.forEach(item => {
      const analysis = this.analyzeSentiment(item.text, item.source);
      const recencyWeight = this.calculateRecencyWeight(item.timestamp);
      const weight = analysis.confidence * recencyWeight * item.relevance;

      weightedSentiment += analysis.sentiment * weight;
      totalWeight += weight;

      factors[item.source] += analysis.sentiment * weight;
      factorCounts[item.source] += weight;
    });

    Object.keys(factors).forEach(key => {
      const k = key as keyof typeof factors;
      factors[k] = factorCounts[k] > 0 ? factors[k] / factorCounts[k] : 0;
    });

    const overall = totalWeight > 0 ? weightedSentiment / totalWeight : 0;
    const confidence = Math.min(0.95, totalWeight / recentData.length);

    const bullish = Math.max(0, overall);
    const bearish = Math.max(0, -overall);
    const neutral = 1 - Math.abs(overall);

    return {
      overall,
      bullish,
      bearish,
      neutral,
      confidence,
      factors
    };
  }

  private calculateRecencyWeight(timestamp: number): number {
    const age = Date.now() - timestamp;
    const maxAge = this.SENTIMENT_WINDOW;
    return Math.max(0.1, 1 - (age / maxAge));
  }

  private async performSentimentAnalysis(): Promise<void> {
    try {
      const mockData = await this.fetchMockSentimentData();
      await this.processSentimentData(mockData);
    } catch (error) {
      console.error('❌ Sentiment analysis failed:', error);
    }
  }

  private async fetchMockSentimentData(): Promise<SentimentData[]> {
    const sources: SentimentData['source'][] = ['news', 'social', 'economic', 'technical'];
    const symbols = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD', 'BTC_USD'];
    
    const sentimentTexts = [
      'EUR/USD showing strong bullish momentum after positive economic data',
      'Gold prices surge amid geopolitical uncertainty and inflation fears',
      'Technical analysis suggests bearish breakdown for GBP/USD below support',
      'Bitcoin rally continues with institutional buying pressure',
      'USD/JPY consolidating in tight range, awaiting direction',
      'Market sentiment remains cautious ahead of central bank meeting',
      'Retail sales data disappoints, raising recession concerns',
      'Strong employment numbers boost currency optimism'
    ];

    const mockData: SentimentData[] = [];

    for (let i = 0; i < 5; i++) {
      const source = sources[Math.floor(Math.random() * sources.length)];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const text = sentimentTexts[Math.floor(Math.random() * sentimentTexts.length)]
        .replace(/EUR\/USD|GBP\/USD|USD\/JPY|XAU\/USD|BTC\/USD/g, symbol.replace('_', '/'));

      mockData.push({
        source,
        text,
        timestamp: Date.now() - Math.random() * 3600000,
        relevance: 0.7 + Math.random() * 0.3,
        confidence: 0.6 + Math.random() * 0.4
      });
    }

    return mockData;
  }

  private detectMarketEvents(): void {
    const symbols = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD', 'BTC_USD'];
    
    symbols.forEach(symbol => {
      const sentiment = this.getSentimentScore(symbol);
      
      if (Math.abs(sentiment.overall) > 0.7 && sentiment.confidence > 0.8) {
        const event: MarketEvent = {
          type: 'technical_breakout',
          symbol,
          impact: Math.abs(sentiment.overall) > 0.9 ? 'critical' : 'high',
          sentiment: sentiment.overall > 0 ? 'positive' : 'negative',
          confidence: sentiment.confidence,
          description: `Strong ${sentiment.overall > 0 ? 'bullish' : 'bearish'} sentiment detected for ${symbol}`,
          timestamp: Date.now(),
          expectedDuration: 240
        };

        this.addMarketEvent(event);
      }
    });
  }

  private addMarketEvent(event: MarketEvent): void {
    const exists = this.marketEvents.some(existing => 
      existing.type === event.type &&
      existing.symbol === event.symbol &&
      Math.abs(existing.timestamp - event.timestamp) < 3600000
    );

    if (!exists) {
      this.marketEvents.push(event);
      
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
      this.marketEvents = this.marketEvents.filter(e => e.timestamp > cutoffTime);
      
      console.log(`🚨 Market event detected: ${event.description}`);
    }
  }

  private updateVolatilityPredictions(): void {
    const symbols = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD', 'BTC_USD'];
    
    symbols.forEach(symbol => {
      const sentiment = this.getSentimentScore(symbol);
      const currentVol = this.calculateCurrentVolatility(symbol);
      
      const sentimentVolatility = Math.abs(sentiment.overall) * 0.02;
      const eventVolatility = this.calculateEventVolatility(symbol);
      
      const predictedVolatility = Math.min(0.05, currentVol + sentimentVolatility + eventVolatility);
      
      const prediction: VolatilityPrediction = {
        symbol,
        timeframe: '1h',
        predictedVolatility,
        currentVolatility: currentVol,
        trend: predictedVolatility > currentVol * 1.1 ? 'increasing' : 
               predictedVolatility < currentVol * 0.9 ? 'decreasing' : 'stable',
        confidence: sentiment.confidence,
        factors: this.getVolatilityFactors(symbol, sentiment)
      };

      this.volatilityPredictions.set(symbol, prediction);
    });
  }

  private calculateCurrentVolatility(symbol: string): number {
    const baseVolatility = {
      'EUR_USD': 0.008,
      'GBP_USD': 0.012,
      'USD_JPY': 0.010,
      'XAU_USD': 0.015,
      'BTC_USD': 0.035
    };

    return (baseVolatility[symbol as keyof typeof baseVolatility] || 0.01) * 
           (0.8 + Math.random() * 0.4);
  }

  private calculateEventVolatility(symbol: string): number {
    const recentEvents = this.marketEvents.filter(event => 
      event.symbol === symbol &&
      Date.now() - event.timestamp < 3600000
    );

    return recentEvents.reduce((total, event) => {
      const impact = { low: 0.001, medium: 0.003, high: 0.006, critical: 0.012 };
      return total + impact[event.impact];
    }, 0);
  }

  private getVolatilityFactors(symbol: string, sentiment: SentimentScore): string[] {
    const factors: string[] = [];

    if (Math.abs(sentiment.overall) > 0.6) {
      factors.push(`Strong ${sentiment.overall > 0 ? 'bullish' : 'bearish'} sentiment`);
    }

    if (sentiment.factors.economic > 0.5) {
      factors.push('Economic data impact');
    }

    if (sentiment.factors.news > 0.5) {
      factors.push('News events');
    }

    const recentEvents = this.marketEvents.filter(event => 
      event.symbol === symbol &&
      Date.now() - event.timestamp < 3600000
    );

    if (recentEvents.length > 0) {
      factors.push('Recent market events');
    }

    return factors;
  }

  // Public API methods
  getMarketSentiment(symbol: string): SentimentScore {
    return this.getSentimentScore(symbol);
  }

  getVolatilityPrediction(symbol: string): VolatilityPrediction | null {
    return this.volatilityPredictions.get(symbol) || null;
  }

  getRecentMarketEvents(symbol?: string): MarketEvent[] {
    const cutoffTime = Date.now() - (6 * 60 * 60 * 1000);
    return this.marketEvents
      .filter(event => event.timestamp > cutoffTime)
      .filter(event => !symbol || event.symbol === symbol)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getSentimentSummary(): {
    [symbol: string]: {
      sentiment: number;
      confidence: number;
      trend: string;
    };
  } {
    const summary: any = {};
    const symbols = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD', 'BTC_USD'];

    symbols.forEach(symbol => {
      const sentiment = this.getSentimentScore(symbol);
      summary[symbol] = {
        sentiment: sentiment.overall,
        confidence: sentiment.confidence,
        trend: sentiment.overall > 0.1 ? 'bullish' : 
               sentiment.overall < -0.1 ? 'bearish' : 'neutral'
      };
    });

    return summary;
  }

  async forceUpdate(): Promise<void> {
    await this.performSentimentAnalysis();
    this.updateVolatilityPredictions();
    this.detectMarketEvents();
  }
}