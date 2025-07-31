interface SentimentSource {
  sourceId: string;
  name: string;
  type: 'social_media' | 'news' | 'forums' | 'blogs' | 'regulatory';
  platform: 'twitter' | 'reddit' | 'discord' | 'telegram' | 'news_api' | 'sec_filings' | 'custom';
  credentials: {
    apiKey?: string;
    bearerToken?: string;
    clientId?: string;
    clientSecret?: string;
    endpoint: string;
  };
  reliability: number; // 0-100
  updateFrequency: number; // milliseconds
  maxRequestsPerHour: number;
  isActive: boolean;
}

interface SentimentData {
  dataId: string;
  sourceId: string;
  symbol: string;
  timestamp: number;
  
  // Content information
  content: {
    text: string;
    author: string;
    authorFollowers?: number;
    authorVerified?: boolean;
    url?: string;
    language: string;
  };
  
  // Sentiment analysis
  sentiment: {
    score: number; // -1 to 1 (negative to positive)
    magnitude: number; // 0 to 1 (confidence)
    label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
    keywords: string[];
    entities: Array<{
      name: string;
      type: 'person' | 'organization' | 'location' | 'event' | 'product';
      relevance: number;
    }>;
  };
  
  // Engagement metrics
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    views?: number;
    reach?: number;
    engagementRate: number;
  };
  
  // Market relevance
  marketRelevance: {
    relevanceScore: number; // 0-100
    topicCategories: string[];
    marketImpactPotential: 'low' | 'medium' | 'high' | 'critical';
    urgency: 'low' | 'medium' | 'high';
  };
  
  // Processing metadata
  processingTime: number;
  confidence: number;
  flags: string[]; // spam, bot, manipulation, etc.
}

interface AggregatedSentiment {
  symbol: string;
  timestamp: number;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '24h';
  
  // Overall sentiment
  overallSentiment: {
    score: number; // -1 to 1
    magnitude: number; // 0 to 1
    label: SentimentData['sentiment']['label'];
    confidence: number; // 0-100
  };
  
  // Volume metrics
  volume: {
    totalMentions: number;
    uniqueAuthors: number;
    totalReach: number;
    averageEngagement: number;
    trendingScore: number; // 0-100
  };
  
  // Source breakdown
  sourceBreakdown: Array<{
    sourceId: string;
    sourceName: string;
    mentionCount: number;
    averageSentiment: number;
    influence: number; // weighted by followers/engagement
  }>;
  
  // Keyword analysis
  keywords: Array<{
    keyword: string;
    frequency: number;
    sentiment: number;
    relevance: number;
  }>;
  
  // Anomaly detection
  anomalies: Array<{
    type: 'volume_spike' | 'sentiment_shift' | 'viral_content' | 'bot_activity' | 'coordinated_activity';
    severity: 'low' | 'medium' | 'high';
    description: string;
    confidence: number;
    firstDetected: number;
  }>;
  
  // Historical comparison
  historicalContext: {
    averageSentiment30d: number;
    averageVolume30d: number;
    sentimentPercentile: number; // 0-100
    volumePercentile: number; // 0-100
  };
}

interface InsiderActivity {
  activityId: string;
  timestamp: number;
  symbol: string;
  
  // Activity details
  activityType: 'sec_filing' | 'unusual_options' | 'large_block_trade' | 'executive_trade' | 'institutional_move';
  description: string;
  source: string;
  
  // Insider information
  insider: {
    name: string;
    title: string;
    relationship: 'officer' | 'director' | 'beneficial_owner' | 'institutional' | 'unknown';
    ownershipPercent?: number;
  };
  
  // Transaction details
  transaction?: {
    type: 'buy' | 'sell' | 'option' | 'gift' | 'exercise';
    quantity: number;
    price?: number;
    value: number;
    currency: string;
  };
  
  // Analysis
  analysis: {
    significance: 'low' | 'medium' | 'high' | 'critical';
    marketImpact: number; // 0-100
    suspiciousActivity: boolean;
    riskScore: number; // 0-100
    followUpRequired: boolean;
  };
  
  // Related activities
  relatedActivities: string[]; // Other activityIds
  correlatedSentiment?: number; // Sentiment correlation
}

interface TrendingTopic {
  topicId: string;
  keyword: string;
  symbol?: string;
  category: 'stock' | 'crypto' | 'forex' | 'commodities' | 'macro' | 'political' | 'other';
  
  // Trending metrics
  trendScore: number; // 0-100
  velocity: number; // rate of growth
  peakTime: number;
  duration: number; // how long it's been trending
  
  // Volume data
  mentions: {
    current: number;
    previous: number;
    peak: number;
    growth: number; // percentage growth
  };
  
  // Sentiment data
  sentiment: {
    current: number;
    trend: 'improving' | 'declining' | 'stable';
    polarization: number; // 0-100, how divided opinions are
  };
  
  // Geographic data
  geographic: Array<{
    region: string;
    mentionCount: number;
    sentiment: number;
  }>;
  
  // Source distribution
  sourceDistribution: Array<{
    source: string;
    percentage: number;
    influence: number;
  }>;
}

interface MarketSentimentAlert {
  alertId: string;
  timestamp: number;
  symbol: string;
  alertType: 'sentiment_shift' | 'volume_spike' | 'trending_topic' | 'insider_activity' | 'viral_content' | 'manipulation_detected';
  
  severity: 'info' | 'warning' | 'critical';
  message: string;
  
  // Alert data
  data: {
    currentSentiment?: number;
    previousSentiment?: number;
    volumeIncrease?: number;
    trendingScore?: number;
    confidence: number;
  };
  
  // Recommended actions
  recommendations: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    timeframe: string;
  }>;
  
  // Auto-generated flag
  autoGenerated: boolean;
  processed: boolean;
}

export class SocialSentimentAnalyzer {
  private sources: Map<string, SentimentSource> = new Map();
  private rawSentimentData: Map<string, SentimentData[]> = new Map(); // symbol -> data[]
  private aggregatedSentiment: Map<string, Map<string, AggregatedSentiment>> = new Map(); // symbol -> timeframe -> data
  private insiderActivities: Map<string, InsiderActivity> = new Map();
  private trendingTopics: Map<string, TrendingTopic> = new Map();
  private alerts: Map<string, MarketSentimentAlert> = new Map();
  
  // Subscriptions and callbacks
  private subscriptions: Map<string, {
    symbols: string[];
    callback: (sentiment: AggregatedSentiment) => void;
    alertCallback?: (alert: MarketSentimentAlert) => void;
    filters?: {
      minRelevance?: number;
      sources?: string[];
      timeframes?: string[];
    };
    isActive: boolean;
  }> = new Map();
  
  // Processing
  private processingQueue: Array<{
    sourceId: string;
    rawData: any;
    timestamp: number;
    priority: number;
  }> = [];
  private processingTimer?: NodeJS.Timeout;
  private aggregationTimer?: NodeJS.Timeout;
  
  // Monitoring and health
  private sourceHealth: Map<string, {
    status: 'online' | 'offline' | 'rate_limited' | 'error';
    lastUpdate: number;
    errorCount: number;
    requestsToday: number;
    averageLatency: number;
  }> = new Map();
  
  // Performance metrics
  private metrics = {
    totalDataPoints: 0,
    processedToday: 0,
    averageProcessingTime: 0,
    sentimentAccuracy: 0,
    alertsGenerated: 0,
    trendingTopicsDetected: 0,
    insiderActivitiesDetected: 0,
    lastUpdate: 0
  };

  constructor() {
    this.initializeDefaultSources();
  }

  async initialize(): Promise<void> {
    console.log('📱 Initializing Social Sentiment Analyzer...');

    // Initialize data sources
    await this.initializeSources();

    // Start data processing
    this.startDataProcessing();

    // Start aggregation
    this.startAggregation();

    // Start monitoring
    this.startMonitoring();

    console.log('✅ Social Sentiment Analyzer initialized');
  }

  // Source Management
  private async initializeSources(): Promise<void> {
    for (const [sourceId, source] of this.sources.entries()) {
      if (!source.isActive) continue;

      try {
        await this.connectToSource(sourceId);
        console.log(`📡 Connected to ${source.name}`);
      } catch (error) {
        console.error(`❌ Failed to connect to ${source.name}:`, error);
      }
    }
  }

  private async connectToSource(sourceId: string): Promise<void> {
    const source = this.sources.get(sourceId);
    if (!source) return;

    // Initialize health tracking
    this.sourceHealth.set(sourceId, {
      status: 'online',
      lastUpdate: Date.now(),
      errorCount: 0,
      requestsToday: 0,
      averageLatency: 0
    });

    // Start data collection based on source type
    switch (source.platform) {
      case 'twitter':
        await this.initializeTwitterStream(source);
        break;
      case 'reddit':
        await this.initializeRedditStream(source);
        break;
      case 'news_api':
        await this.initializeNewsStream(source);
        break;
      case 'sec_filings':
        await this.initializeSECStream(source);
        break;
      default:
        await this.initializeGenericStream(source);
    }
  }

  private async initializeTwitterStream(source: SentimentSource): Promise<void> {
    console.log('🐦 Starting Twitter sentiment stream...');
    
    // Mock Twitter API connection
    setInterval(() => {
      const mockTweets = this.generateMockTwitterData(source.sourceId);
      for (const tweet of mockTweets) {
        this.processingQueue.push({
          sourceId: source.sourceId,
          rawData: tweet,
          timestamp: Date.now(),
          priority: this.calculatePriority(tweet, source)
        });
      }
    }, source.updateFrequency);
  }

  private async initializeRedditStream(source: SentimentSource): Promise<void> {
    console.log('📱 Starting Reddit sentiment stream...');
    
    // Mock Reddit API connection
    setInterval(() => {
      const mockPosts = this.generateMockRedditData(source.sourceId);
      for (const post of mockPosts) {
        this.processingQueue.push({
          sourceId: source.sourceId,
          rawData: post,
          timestamp: Date.now(),
          priority: this.calculatePriority(post, source)
        });
      }
    }, source.updateFrequency);
  }

  private async initializeNewsStream(source: SentimentSource): Promise<void> {
    console.log('📰 Starting news sentiment stream...');
    
    // Mock News API connection
    setInterval(() => {
      const mockArticles = this.generateMockNewsData(source.sourceId);
      for (const article of mockArticles) {
        this.processingQueue.push({
          sourceId: source.sourceId,
          rawData: article,
          timestamp: Date.now(),
          priority: this.calculatePriority(article, source)
        });
      }
    }, source.updateFrequency);
  }

  private async initializeSECStream(source: SentimentSource): Promise<void> {
    console.log('🏛️ Starting SEC filings stream...');
    
    // Mock SEC filings monitoring
    setInterval(() => {
      const mockFilings = this.generateMockSECData(source.sourceId);
      for (const filing of mockFilings) {
        this.processInsiderActivity(filing);
      }
    }, source.updateFrequency);
  }

  private async initializeGenericStream(source: SentimentSource): Promise<void> {
    console.log(`🔗 Starting ${source.name} stream...`);
    
    setInterval(() => {
      const mockData = this.generateMockSocialData(source.sourceId);
      for (const data of mockData) {
        this.processingQueue.push({
          sourceId: source.sourceId,
          rawData: data,
          timestamp: Date.now(),
          priority: this.calculatePriority(data, source)
        });
      }
    }, source.updateFrequency);
  }

  // Data Processing
  private startDataProcessing(): void {
    this.processingTimer = setInterval(() => {
      this.processDataQueue();
    }, 1000); // Process every second

    console.log('⚙️ Sentiment data processing started');
  }

  private processDataQueue(): void {
    if (this.processingQueue.length === 0) return;

    // Sort by priority and timestamp
    this.processingQueue.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.timestamp - b.timestamp;
    });

    const batchSize = Math.min(50, this.processingQueue.length);
    const batch = this.processingQueue.splice(0, batchSize);

    for (const item of batch) {
      try {
        this.processDataItem(item);
      } catch (error) {
        console.error('❌ Error processing sentiment data:', error);
      }
    }
  }

  private async processDataItem(item: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Extract symbol(s) from content
      const symbols = this.extractSymbols(item.rawData);
      
      for (const symbol of symbols) {
        // Perform sentiment analysis
        const sentimentData = await this.analyzeSentiment(item.rawData, symbol, item.sourceId);
        
        // Store raw data
        if (!this.rawSentimentData.has(symbol)) {
          this.rawSentimentData.set(symbol, []);
        }
        this.rawSentimentData.get(symbol)!.push(sentimentData);
        
        // Keep only recent data (last 24 hours)
        this.cleanupOldData(symbol);
        
        // Check for anomalies
        await this.detectAnomalies(symbol, sentimentData);
      }

      // Update metrics
      this.updateProcessingMetrics(Date.now() - startTime);

    } catch (error) {
      console.error('❌ Error in sentiment processing:', error);
    }
  }

  private extractSymbols(rawData: any): string[] {
    const text = rawData.text || rawData.content || rawData.title || '';
    const symbols: string[] = [];
    
    // Common stock symbol patterns
    const symbolPatterns = [
      /\$([A-Z]{1,5})\b/g, // $AAPL format
      /\b([A-Z]{1,5})\s+stock/gi, // AAPL stock
      /\b(AAPL|MSFT|GOOGL|AMZN|TSLA|META|NVDA|AMD|NFLX|DIS)\b/gi // Common symbols
    ];

    for (const pattern of symbolPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const symbol = match.replace('$', '').replace(/\s+stock/i, '').toUpperCase();
          if (symbol.length >= 1 && symbol.length <= 5 && !symbols.includes(symbol)) {
            symbols.push(symbol);
          }
        }
      }
    }

    return symbols.length > 0 ? symbols : ['GENERAL']; // Default to general market sentiment
  }

  private async analyzeSentiment(rawData: any, symbol: string, sourceId: string): Promise<SentimentData> {
    const text = rawData.text || rawData.content || rawData.title || '';
    
    // Perform sentiment analysis (mock implementation)
    const sentimentScore = this.calculateSentimentScore(text);
    const magnitude = Math.random() * 0.5 + 0.5; // 0.5-1.0
    const keywords = this.extractKeywords(text);
    const entities = this.extractEntities(text);
    
    const sentimentData: SentimentData = {
      dataId: this.generateDataId(),
      sourceId,
      symbol,
      timestamp: Date.now(),
      
      content: {
        text: text.substring(0, 500), // Truncate for storage
        author: rawData.author || rawData.username || 'anonymous',
        authorFollowers: rawData.followers || 0,
        authorVerified: rawData.verified || false,
        url: rawData.url,
        language: rawData.language || 'en'
      },
      
      sentiment: {
        score: sentimentScore,
        magnitude,
        label: this.scoresToLabel(sentimentScore),
        keywords,
        entities
      },
      
      engagement: {
        likes: rawData.likes || rawData.upvotes || 0,
        shares: rawData.shares || rawData.retweets || 0,
        comments: rawData.comments || rawData.replies || 0,
        views: rawData.views,
        reach: this.calculateReach(rawData),
        engagementRate: this.calculateEngagementRate(rawData)
      },
      
      marketRelevance: {
        relevanceScore: this.calculateRelevanceScore(text, symbol),
        topicCategories: this.categorizeContent(text),
        marketImpactPotential: this.assessMarketImpact(rawData, sentimentScore),
        urgency: this.assessUrgency(rawData, sentimentScore)
      },
      
      processingTime: 0, // Will be set later
      confidence: this.calculateConfidence(rawData, sentimentScore),
      flags: this.detectFlags(rawData, text)
    };

    return sentimentData;
  }

  private calculateSentimentScore(text: string): number {
    // Mock sentiment analysis - in production would use ML models
    const positiveWords = ['good', 'great', 'excellent', 'bullish', 'buy', 'moon', 'rocket', 'green'];
    const negativeWords = ['bad', 'terrible', 'bearish', 'sell', 'crash', 'dump', 'red', 'down'];
    
    let score = 0;
    const words = text.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      if (positiveWords.includes(word)) score += 0.1;
      if (negativeWords.includes(word)) score -= 0.1;
    }
    
    // Add some randomness and normalize to -1 to 1
    score += (Math.random() - 0.5) * 0.4;
    return Math.max(-1, Math.min(1, score));
  }

  private scoresToLabel(score: number): SentimentData['sentiment']['label'] {
    if (score > 0.6) return 'very_positive';
    if (score > 0.2) return 'positive';
    if (score > -0.2) return 'neutral';
    if (score > -0.6) return 'negative';
    return 'very_negative';
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'have', 'will', 'been'].includes(word));
    
    // Get most frequent words
    const wordCount = new Map<string, number>();
    for (const word of words) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
    
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }

  private extractEntities(text: string): SentimentData['sentiment']['entities'] {
    // Mock entity extraction
    const entities: SentimentData['sentiment']['entities'] = [];
    
    // Look for company names, CEO names, etc.
    const companyNames = ['Apple', 'Microsoft', 'Google', 'Amazon', 'Tesla', 'Meta', 'Netflix'];
    const ceoNames = ['Elon Musk', 'Tim Cook', 'Satya Nadella', 'Jeff Bezos', 'Mark Zuckerberg'];
    
    for (const company of companyNames) {
      if (text.includes(company)) {
        entities.push({
          name: company,
          type: 'organization',
          relevance: Math.random()
        });
      }
    }
    
    for (const ceo of ceoNames) {
      if (text.includes(ceo)) {
        entities.push({
          name: ceo,
          type: 'person',
          relevance: Math.random()
        });
      }
    }
    
    return entities;
  }

  private calculateReach(rawData: any): number {
    const followers = rawData.followers || 0;
    const engagement = (rawData.likes || 0) + (rawData.shares || 0) + (rawData.comments || 0);
    return Math.floor(followers * 0.1 + engagement * 3); // Estimated reach
  }

  private calculateEngagementRate(rawData: any): number {
    const followers = rawData.followers || 1;
    const engagement = (rawData.likes || 0) + (rawData.shares || 0) + (rawData.comments || 0);
    return Math.min(100, (engagement / followers) * 100);
  }

  private calculateRelevanceScore(text: string, symbol: string): number {
    let score = 0;
    
    // Direct symbol mention
    if (text.includes(symbol) || text.includes(`$${symbol}`)) score += 50;
    
    // Financial keywords
    const financialKeywords = ['stock', 'price', 'earnings', 'revenue', 'profit', 'loss', 'buy', 'sell'];
    for (const keyword of financialKeywords) {
      if (text.toLowerCase().includes(keyword)) score += 5;
    }
    
    // Market-related terms
    const marketTerms = ['market', 'trading', 'investment', 'portfolio', 'dividend'];
    for (const term of marketTerms) {
      if (text.toLowerCase().includes(term)) score += 3;
    }
    
    return Math.min(100, score);
  }

  private categorizeContent(text: string): string[] {
    const categories: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('earnings') || lowerText.includes('financial')) categories.push('earnings');
    if (lowerText.includes('news') || lowerText.includes('announcement')) categories.push('news');
    if (lowerText.includes('technical') || lowerText.includes('chart')) categories.push('technical_analysis');
    if (lowerText.includes('fundamental') || lowerText.includes('valuation')) categories.push('fundamental_analysis');
    if (lowerText.includes('rumor') || lowerText.includes('speculation')) categories.push('speculation');
    if (lowerText.includes('insider') || lowerText.includes('insider trading')) categories.push('insider_activity');
    
    return categories.length > 0 ? categories : ['general'];
  }

  private assessMarketImpact(rawData: any, sentimentScore: number): SentimentData['marketRelevance']['marketImpactPotential'] {
    const followers = rawData.followers || 0;
    const engagement = (rawData.likes || 0) + (rawData.shares || 0);
    const influence = followers + engagement * 10;
    
    if (influence > 100000 && Math.abs(sentimentScore) > 0.7) return 'critical';
    if (influence > 10000 && Math.abs(sentimentScore) > 0.5) return 'high';
    if (influence > 1000 && Math.abs(sentimentScore) > 0.3) return 'medium';
    return 'low';
  }

  private assessUrgency(rawData: any, sentimentScore: number): SentimentData['marketRelevance']['urgency'] {
    const isBreaking = (rawData.text || '').toLowerCase().includes('breaking');
    const isHighEngagement = this.calculateEngagementRate(rawData) > 10;
    const isStrongSentiment = Math.abs(sentimentScore) > 0.8;
    
    if (isBreaking && (isHighEngagement || isStrongSentiment)) return 'high';
    if (isHighEngagement && isStrongSentiment) return 'medium';
    return 'low';
  }

  private calculateConfidence(rawData: any, sentimentScore: number): number {
    let confidence = 50; // Base confidence
    
    // Higher confidence for verified accounts
    if (rawData.verified) confidence += 20;
    
    // Higher confidence for accounts with more followers
    const followers = rawData.followers || 0;
    if (followers > 100000) confidence += 20;
    else if (followers > 10000) confidence += 10;
    else if (followers > 1000) confidence += 5;
    
    // Higher confidence for clear sentiment
    confidence += Math.abs(sentimentScore) * 20;
    
    // Lower confidence for very short content
    const textLength = (rawData.text || '').length;
    if (textLength < 50) confidence -= 15;
    
    return Math.max(0, Math.min(100, confidence));
  }

  private detectFlags(rawData: any, text: string): string[] {
    const flags: string[] = [];
    
    // Bot detection (simplified)
    const followers = rawData.followers || 0;
    const following = rawData.following || 0;
    if (followers === 0 || (following > followers * 10)) flags.push('potential_bot');
    
    // Spam detection
    if (text.includes('http') && text.split('http').length > 3) flags.push('spam');
    if (/(.)\1{4,}/.test(text)) flags.push('spam'); // Repeated characters
    
    // Manipulation detection
    if (text.toLowerCase().includes('pump') || text.toLowerCase().includes('dump')) {
      flags.push('manipulation');
    }
    
    // Coordinated activity (simplified)
    const timestamp = Date.now();
    if (this.detectCoordinatedActivity(text, timestamp)) {
      flags.push('coordinated');
    }
    
    return flags;
  }

  private detectCoordinatedActivity(text: string, timestamp: number): boolean {
    // Simplified coordinated activity detection
    // In production, this would be much more sophisticated
    return Math.random() < 0.05; // 5% chance of flagging as coordinated
  }

  // Aggregation
  private startAggregation(): void {
    this.aggregationTimer = setInterval(() => {
      this.aggregateAllSymbols();
    }, 60000); // Aggregate every minute

    console.log('📊 Sentiment aggregation started');
  }

  private aggregateAllSymbols(): void {
    for (const symbol of this.rawSentimentData.keys()) {
      this.aggregateSentimentForSymbol(symbol);
    }
  }

  private aggregateSentimentForSymbol(symbol: string): void {
    const timeframes = ['1m', '5m', '15m', '1h', '4h', '24h'];
    
    if (!this.aggregatedSentiment.has(symbol)) {
      this.aggregatedSentiment.set(symbol, new Map());
    }
    
    const symbolData = this.aggregatedSentiment.get(symbol)!;
    
    for (const timeframe of timeframes) {
      const aggregated = this.calculateAggregatedSentiment(symbol, timeframe);
      symbolData.set(timeframe, aggregated);
    }
    
    // Notify subscribers
    this.notifySubscribers(symbol);
  }

  private calculateAggregatedSentiment(symbol: string, timeframe: string): AggregatedSentiment {
    const rawData = this.rawSentimentData.get(symbol) || [];
    const timeframeMs = this.getTimeframeMs(timeframe);
    const cutoffTime = Date.now() - timeframeMs;
    
    // Filter data for timeframe
    const relevantData = rawData.filter(d => d.timestamp >= cutoffTime);
    
    if (relevantData.length === 0) {
      return this.createEmptyAggregation(symbol, timeframe);
    }
    
    // Calculate overall sentiment
    const sentimentScores = relevantData.map(d => d.sentiment.score);
    const weights = relevantData.map(d => d.confidence / 100);
    
    const weightedSentiment = sentimentScores.reduce((sum, score, i) => sum + score * weights[i], 0) / 
                             weights.reduce((sum, weight) => sum + weight, 0);
    
    const averageMagnitude = relevantData.reduce((sum, d) => sum + d.sentiment.magnitude, 0) / relevantData.length;
    
    // Calculate volume metrics
    const totalMentions = relevantData.length;
    const uniqueAuthors = new Set(relevantData.map(d => d.content.author)).size;
    const totalReach = relevantData.reduce((sum, d) => sum + d.engagement.reach, 0);
    const averageEngagement = relevantData.reduce((sum, d) => sum + d.engagement.engagementRate, 0) / relevantData.length;
    
    // Source breakdown
    const sourceBreakdown = this.calculateSourceBreakdown(relevantData);
    
    // Keywords analysis
    const keywords = this.calculateKeywordAnalysis(relevantData);
    
    // Anomaly detection
    const anomalies = this.detectSentimentAnomalies(symbol, relevantData);
    
    // Historical context
    const historicalContext = this.calculateHistoricalContext(symbol, weightedSentiment, totalMentions);
    
    const aggregated: AggregatedSentiment = {
      symbol,
      timestamp: Date.now(),
      timeframe: timeframe as any,
      
      overallSentiment: {
        score: weightedSentiment,
        magnitude: averageMagnitude,
        label: this.scoresToLabel(weightedSentiment),
        confidence: this.calculateAggregatedConfidence(relevantData)
      },
      
      volume: {
        totalMentions,
        uniqueAuthors,
        totalReach,
        averageEngagement,
        trendingScore: this.calculateTrendingScore(symbol, timeframe)
      },
      
      sourceBreakdown,
      keywords,
      anomalies,
      historicalContext
    };
    
    return aggregated;
  }

  private createEmptyAggregation(symbol: string, timeframe: string): AggregatedSentiment {
    return {
      symbol,
      timestamp: Date.now(),
      timeframe: timeframe as any,
      overallSentiment: { score: 0, magnitude: 0, label: 'neutral', confidence: 0 },
      volume: { totalMentions: 0, uniqueAuthors: 0, totalReach: 0, averageEngagement: 0, trendingScore: 0 },
      sourceBreakdown: [],
      keywords: [],
      anomalies: [],
      historicalContext: {
        averageSentiment30d: 0,
        averageVolume30d: 0,
        sentimentPercentile: 50,
        volumePercentile: 50
      }
    };
  }

  private getTimeframeMs(timeframe: string): number {
    const timeframes: { [key: string]: number } = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    };
    return timeframes[timeframe] || 60000;
  }

  private calculateSourceBreakdown(data: SentimentData[]): AggregatedSentiment['sourceBreakdown'] {
    const sourceStats = new Map<string, { count: number; totalSentiment: number; totalInfluence: number }>();
    
    for (const item of data) {
      const source = this.sources.get(item.sourceId);
      const sourceName = source?.name || item.sourceId;
      
      if (!sourceStats.has(item.sourceId)) {
        sourceStats.set(item.sourceId, { count: 0, totalSentiment: 0, totalInfluence: 0 });
      }
      
      const stats = sourceStats.get(item.sourceId)!;
      stats.count++;
      stats.totalSentiment += item.sentiment.score;
      stats.totalInfluence += item.engagement.reach || 0;
    }
    
    return Array.from(sourceStats.entries()).map(([sourceId, stats]) => ({
      sourceId,
      sourceName: this.sources.get(sourceId)?.name || sourceId,
      mentionCount: stats.count,
      averageSentiment: stats.totalSentiment / stats.count,
      influence: stats.totalInfluence
    }));
  }

  private calculateKeywordAnalysis(data: SentimentData[]): AggregatedSentiment['keywords'] {
    const keywordStats = new Map<string, { count: number; totalSentiment: number; totalRelevance: number }>();
    
    for (const item of data) {
      for (const keyword of item.sentiment.keywords) {
        if (!keywordStats.has(keyword)) {
          keywordStats.set(keyword, { count: 0, totalSentiment: 0, totalRelevance: 0 });
        }
        
        const stats = keywordStats.get(keyword)!;
        stats.count++;
        stats.totalSentiment += item.sentiment.score;
        stats.totalRelevance += item.marketRelevance.relevanceScore;
      }
    }
    
    return Array.from(keywordStats.entries())
      .map(([keyword, stats]) => ({
        keyword,
        frequency: stats.count,
        sentiment: stats.totalSentiment / stats.count,
        relevance: stats.totalRelevance / stats.count
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private detectSentimentAnomalies(symbol: string, data: SentimentData[]): AggregatedSentiment['anomalies'] {
    const anomalies: AggregatedSentiment['anomalies'] = [];
    
    // Volume spike detection
    const currentVolume = data.length;
    const averageVolume = this.getHistoricalAverageVolume(symbol);
    if (currentVolume > averageVolume * 3) {
      anomalies.push({
        type: 'volume_spike',
        severity: currentVolume > averageVolume * 5 ? 'high' : 'medium',
        description: `Volume spike: ${currentVolume} mentions vs avg ${averageVolume}`,
        confidence: 85,
        firstDetected: Date.now()
      });
    }
    
    // Sentiment shift detection
    const currentSentiment = data.reduce((sum, d) => sum + d.sentiment.score, 0) / data.length;
    const historicalSentiment = this.getHistoricalAverageSentiment(symbol);
    if (Math.abs(currentSentiment - historicalSentiment) > 0.5) {
      anomalies.push({
        type: 'sentiment_shift',
        severity: Math.abs(currentSentiment - historicalSentiment) > 0.8 ? 'high' : 'medium',
        description: `Sentiment shift: ${currentSentiment.toFixed(2)} vs avg ${historicalSentiment.toFixed(2)}`,
        confidence: 75,
        firstDetected: Date.now()
      });
    }
    
    // Viral content detection
    const highEngagementPosts = data.filter(d => d.engagement.engagementRate > 20);
    if (highEngagementPosts.length > data.length * 0.1) {
      anomalies.push({
        type: 'viral_content',
        severity: 'medium',
        description: `Multiple high-engagement posts detected`,
        confidence: 70,
        firstDetected: Date.now()
      });
    }
    
    // Bot activity detection
    const flaggedBotPosts = data.filter(d => d.flags.includes('potential_bot'));
    if (flaggedBotPosts.length > data.length * 0.3) {
      anomalies.push({
        type: 'bot_activity',
        severity: 'high',
        description: `High bot activity detected: ${flaggedBotPosts.length}/${data.length} posts`,
        confidence: 80,
        firstDetected: Date.now()
      });
    }
    
    return anomalies;
  }

  private calculateHistoricalContext(symbol: string, currentSentiment: number, currentVolume: number): AggregatedSentiment['historicalContext'] {
    // Mock historical data - in production would query historical database
    const averageSentiment30d = Math.random() * 0.4 - 0.2; // -0.2 to 0.2
    const averageVolume30d = Math.floor(Math.random() * 100 + 50); // 50-150
    
    // Calculate percentiles
    const sentimentPercentile = this.calculatePercentile(currentSentiment, averageSentiment30d, 0.3);
    const volumePercentile = this.calculatePercentile(currentVolume, averageVolume30d, averageVolume30d * 0.5);
    
    return {
      averageSentiment30d,
      averageVolume30d,
      sentimentPercentile,
      volumePercentile
    };
  }

  private calculatePercentile(current: number, average: number, stdDev: number): number {
    const z = (current - average) / stdDev;
    // Convert z-score to percentile (simplified)
    return Math.max(0, Math.min(100, 50 + z * 20));
  }

  private calculateAggregatedConfidence(data: SentimentData[]): number {
    if (data.length === 0) return 0;
    
    const totalConfidence = data.reduce((sum, d) => sum + d.confidence, 0);
    const averageConfidence = totalConfidence / data.length;
    
    // Adjust for volume (more data = higher confidence)
    const volumeBoost = Math.min(20, data.length * 2);
    
    return Math.min(100, averageConfidence + volumeBoost);
  }

  private calculateTrendingScore(symbol: string, timeframe: string): number {
    // Calculate trending score based on volume increase and sentiment
    const currentData = this.rawSentimentData.get(symbol) || [];
    const timeframeMs = this.getTimeframeMs(timeframe);
    const recentData = currentData.filter(d => d.timestamp >= Date.now() - timeframeMs);
    
    const currentVolume = recentData.length;
    const averageVolume = this.getHistoricalAverageVolume(symbol);
    
    const volumeScore = Math.min(100, (currentVolume / Math.max(1, averageVolume)) * 50);
    const sentimentScore = Math.abs(recentData.reduce((sum, d) => sum + d.sentiment.score, 0) / Math.max(1, recentData.length)) * 25;
    const engagementScore = (recentData.reduce((sum, d) => sum + d.engagement.engagementRate, 0) / Math.max(1, recentData.length)) * 0.25;
    
    return Math.min(100, volumeScore + sentimentScore + engagementScore);
  }

  private getHistoricalAverageVolume(symbol: string): number {
    // Mock historical average - in production would query historical data
    return Math.floor(Math.random() * 50 + 20); // 20-70
  }

  private getHistoricalAverageSentiment(symbol: string): number {
    // Mock historical average sentiment
    return (Math.random() - 0.5) * 0.4; // -0.2 to 0.2
  }

  // Insider Activity Processing
  private processInsiderActivity(filing: any): void {
    const activity: InsiderActivity = {
      activityId: this.generateActivityId(),
      timestamp: Date.now(),
      symbol: filing.symbol || this.extractSymbolFromFiling(filing),
      
      activityType: filing.type || 'sec_filing',
      description: filing.description || 'SEC filing detected',
      source: filing.source || 'sec_edgar',
      
      insider: {
        name: filing.insider_name || 'Unknown',
        title: filing.insider_title || 'Officer',
        relationship: filing.relationship || 'officer',
        ownershipPercent: filing.ownership_percent
      },
      
      transaction: filing.transaction ? {
        type: filing.transaction.type || 'buy',
        quantity: filing.transaction.quantity || 0,
        price: filing.transaction.price,
        value: filing.transaction.value || 0,
        currency: filing.transaction.currency || 'USD'
      } : undefined,
      
      analysis: {
        significance: this.assessInsiderSignificance(filing),
        marketImpact: this.calculateInsiderMarketImpact(filing),
        suspiciousActivity: this.detectSuspiciousInsiderActivity(filing),
        riskScore: this.calculateInsiderRiskScore(filing),
        followUpRequired: false
      },
      
      relatedActivities: [],
      correlatedSentiment: this.getCorrelatedSentiment(filing.symbol)
    };

    this.insiderActivities.set(activity.activityId, activity);
    this.metrics.insiderActivitiesDetected++;

    // Generate alert if significant
    if (activity.analysis.significance === 'high' || activity.analysis.significance === 'critical') {
      this.generateAlert('insider_activity', activity.symbol, activity);
    }

    console.log(`🏛️ Insider activity detected: ${activity.symbol} - ${activity.description}`);
  }

  private extractSymbolFromFiling(filing: any): string {
    // Extract symbol from filing data
    return filing.ticker || filing.symbol || 'UNKNOWN';
  }

  private assessInsiderSignificance(filing: any): InsiderActivity['analysis']['significance'] {
    const value = filing.transaction?.value || 0;
    const ownershipPercent = filing.ownership_percent || 0;
    
    if (value > 10000000 || ownershipPercent > 10) return 'critical'; // $10M+ or 10%+ ownership
    if (value > 1000000 || ownershipPercent > 5) return 'high'; // $1M+ or 5%+ ownership
    if (value > 100000 || ownershipPercent > 1) return 'medium'; // $100K+ or 1%+ ownership
    return 'low';
  }

  private calculateInsiderMarketImpact(filing: any): number {
    const value = filing.transaction?.value || 0;
    const ownershipPercent = filing.ownership_percent || 0;
    const insiderTitle = filing.insider_title || '';
    
    let impact = 0;
    
    // Value impact
    if (value > 10000000) impact += 40;
    else if (value > 1000000) impact += 25;
    else if (value > 100000) impact += 10;
    
    // Ownership impact
    impact += Math.min(30, ownershipPercent * 3);
    
    // Title impact
    if (insiderTitle.toLowerCase().includes('ceo')) impact += 20;
    else if (insiderTitle.toLowerCase().includes('cfo')) impact += 15;
    else if (insiderTitle.toLowerCase().includes('director')) impact += 10;
    
    return Math.min(100, impact);
  }

  private detectSuspiciousInsiderActivity(filing: any): boolean {
    // Simplified suspicious activity detection
    const value = filing.transaction?.value || 0;
    const timing = filing.timing || '';
    
    // Large transactions before earnings
    if (value > 5000000 && timing.includes('pre_earnings')) return true;
    
    // Unusual patterns (would be more sophisticated in production)
    return Math.random() < 0.1; // 10% chance of flagging as suspicious
  }

  private calculateInsiderRiskScore(filing: any): number {
    let risk = 0;
    
    const value = filing.transaction?.value || 0;
    const type = filing.transaction?.type || 'buy';
    
    // Transaction size risk
    if (value > 10000000) risk += 30;
    else if (value > 1000000) risk += 20;
    else if (value > 100000) risk += 10;
    
    // Transaction type risk
    if (type === 'sell') risk += 15;
    
    // Timing risk
    if (filing.timing?.includes('blackout')) risk += 25;
    
    // Suspicious activity risk
    if (this.detectSuspiciousInsiderActivity(filing)) risk += 40;
    
    return Math.min(100, risk);
  }

  private getCorrelatedSentiment(symbol: string): number | undefined {
    const aggregated = this.aggregatedSentiment.get(symbol)?.get('1h');
    return aggregated?.overallSentiment.score;
  }

  // Alert Generation
  private async generateAlert(
    alertType: MarketSentimentAlert['alertType'],
    symbol: string,
    data: any
  ): Promise<void> {
    const alertId = this.generateAlertId();
    
    const alert: MarketSentimentAlert = {
      alertId,
      timestamp: Date.now(),
      symbol,
      alertType,
      severity: this.calculateAlertSeverity(alertType, data),
      message: this.formatAlertMessage(alertType, symbol, data),
      data: this.extractAlertData(alertType, data),
      recommendations: this.generateRecommendations(alertType, data),
      autoGenerated: true,
      processed: false
    };

    this.alerts.set(alertId, alert);
    this.metrics.alertsGenerated++;

    // Notify subscribers
    this.notifyAlertSubscribers(alert);

    console.log(`🚨 Alert generated: ${alertType} for ${symbol}`);
  }

  private calculateAlertSeverity(alertType: string, data: any): MarketSentimentAlert['severity'] {
    switch (alertType) {
      case 'insider_activity':
        return data.analysis?.significance === 'critical' ? 'critical' : 'warning';
      case 'sentiment_shift':
        return Math.abs(data.sentimentChange || 0) > 0.8 ? 'critical' : 'warning';
      case 'volume_spike':
        return (data.volumeIncrease || 0) > 500 ? 'critical' : 'warning';
      default:
        return 'info';
    }
  }

  private formatAlertMessage(alertType: string, symbol: string, data: any): string {
    switch (alertType) {
      case 'insider_activity':
        return `Insider activity detected for ${symbol}: ${data.description}`;
      case 'sentiment_shift':
        return `Significant sentiment shift for ${symbol}: ${data.currentSentiment?.toFixed(2)} (${data.sentimentChange > 0 ? '+' : ''}${(data.sentimentChange * 100).toFixed(1)}%)`;
      case 'volume_spike':
        return `Volume spike for ${symbol}: ${data.currentVolume} mentions (+${data.volumeIncrease.toFixed(0)}%)`;
      case 'trending_topic':
        return `${symbol} is trending with score ${data.trendingScore}`;
      default:
        return `Alert for ${symbol}`;
    }
  }

  private extractAlertData(alertType: string, data: any): MarketSentimentAlert['data'] {
    const baseData = { confidence: data.confidence || 75 };
    
    switch (alertType) {
      case 'sentiment_shift':
        return {
          ...baseData,
          currentSentiment: data.currentSentiment,
          previousSentiment: data.previousSentiment
        };
      case 'volume_spike':
        return {
          ...baseData,
          volumeIncrease: data.volumeIncrease
        };
      case 'trending_topic':
        return {
          ...baseData,
          trendingScore: data.trendingScore
        };
      default:
        return baseData;
    }
  }

  private generateRecommendations(alertType: string, data: any): MarketSentimentAlert['recommendations'] {
    const recommendations: MarketSentimentAlert['recommendations'] = [];
    
    switch (alertType) {
      case 'insider_activity':
        recommendations.push({
          action: 'Review insider transaction details',
          priority: 'high',
          timeframe: 'immediate'
        });
        if (data.analysis?.suspiciousActivity) {
          recommendations.push({
            action: 'Investigate for potential insider trading',
            priority: 'high',
            timeframe: '24 hours'
          });
        }
        break;
      case 'sentiment_shift':
        recommendations.push({
          action: 'Monitor price action for correlation',
          priority: 'medium',
          timeframe: '1 hour'
        });
        recommendations.push({
          action: 'Review news and events for catalyst',
          priority: 'medium',
          timeframe: '30 minutes'
        });
        break;
      case 'volume_spike':
        recommendations.push({
          action: 'Identify source of volume increase',
          priority: 'high',
          timeframe: 'immediate'
        });
        break;
    }
    
    return recommendations;
  }

  // Monitoring and Anomaly Detection
  private startMonitoring(): void {
    // Real-time anomaly detection
    setInterval(() => {
      this.performAnomalyDetection();
    }, 30000); // Every 30 seconds

    // Trending topic detection
    setInterval(() => {
      this.detectTrendingTopics();
    }, 300000); // Every 5 minutes

    // Health monitoring
    setInterval(() => {
      this.performHealthChecks();
    }, 60000); // Every minute

    console.log('👀 Sentiment monitoring started');
  }

  private async performAnomalyDetection(): Promise<void> {
    for (const symbol of this.rawSentimentData.keys()) {
      const anomalies = await this.detectAnomalies(symbol);
      
      for (const anomaly of anomalies) {
        if (anomaly.severity === 'high') {
          await this.generateAlert(anomaly.type as any, symbol, anomaly);
        }
      }
    }
  }

  private async detectAnomalies(symbol: string, newData?: SentimentData): Promise<any[]> {
    const anomalies: any[] = [];
    const data = this.rawSentimentData.get(symbol) || [];
    
    if (data.length < 10) return anomalies; // Need minimum data
    
    // Check for sentiment anomalies
    const recentSentiment = this.calculateRecentSentiment(data, 60 * 60 * 1000); // 1 hour
    const historicalSentiment = this.getHistoricalAverageSentiment(symbol);
    
    if (Math.abs(recentSentiment - historicalSentiment) > 0.6) {
      anomalies.push({
        type: 'sentiment_shift',
        severity: 'high',
        description: `Significant sentiment shift detected`,
        currentSentiment: recentSentiment,
        previousSentiment: historicalSentiment,
        sentimentChange: recentSentiment - historicalSentiment,
        confidence: 80
      });
    }
    
    // Check for volume anomalies
    const recentVolume = this.calculateRecentVolume(data, 60 * 60 * 1000); // 1 hour
    const averageVolume = this.getHistoricalAverageVolume(symbol);
    
    if (recentVolume > averageVolume * 3) {
      const volumeIncrease = ((recentVolume - averageVolume) / averageVolume) * 100;
      anomalies.push({
        type: 'volume_spike',
        severity: recentVolume > averageVolume * 5 ? 'high' : 'medium',
        description: `Volume spike detected`,
        currentVolume: recentVolume,
        averageVolume,
        volumeIncrease,
        confidence: 85
      });
    }
    
    return anomalies;
  }

  private calculateRecentSentiment(data: SentimentData[], timeWindow: number): number {
    const cutoff = Date.now() - timeWindow;
    const recentData = data.filter(d => d.timestamp >= cutoff);
    
    if (recentData.length === 0) return 0;
    
    return recentData.reduce((sum, d) => sum + d.sentiment.score, 0) / recentData.length;
  }

  private calculateRecentVolume(data: SentimentData[], timeWindow: number): number {
    const cutoff = Date.now() - timeWindow;
    return data.filter(d => d.timestamp >= cutoff).length;
  }

  private detectTrendingTopics(): void {
    // Aggregate keywords across all symbols
    const keywordCounts = new Map<string, { count: number; sentiment: number; symbols: Set<string> }>();
    
    for (const [symbol, data] of this.rawSentimentData.entries()) {
      const recentData = data.filter(d => d.timestamp >= Date.now() - 60 * 60 * 1000); // 1 hour
      
      for (const item of recentData) {
        for (const keyword of item.sentiment.keywords) {
          if (!keywordCounts.has(keyword)) {
            keywordCounts.set(keyword, { count: 0, sentiment: 0, symbols: new Set() });
          }
          
          const stats = keywordCounts.get(keyword)!;
          stats.count++;
          stats.sentiment += item.sentiment.score;
          stats.symbols.add(symbol);
        }
      }
    }
    
    // Identify trending keywords
    const trending = Array.from(keywordCounts.entries())
      .filter(([keyword, stats]) => stats.count >= 10) // Minimum threshold
      .map(([keyword, stats]) => ({
        keyword,
        count: stats.count,
        averageSentiment: stats.sentiment / stats.count,
        symbolCount: stats.symbols.size,
        trendScore: this.calculateKeywordTrendScore(keyword, stats.count)
      }))
      .filter(item => item.trendScore > 50)
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 10);
    
    // Update trending topics
    for (const trend of trending) {
      const topicId = this.generateTopicId();
      const topic: TrendingTopic = {
        topicId,
        keyword: trend.keyword,
        category: this.categorizeKeyword(trend.keyword),
        trendScore: trend.trendScore,
        velocity: trend.trendScore, // Simplified
        peakTime: Date.now(),
        duration: 0,
        mentions: {
          current: trend.count,
          previous: this.getPreviousKeywordCount(trend.keyword),
          peak: trend.count,
          growth: 0 // Will be calculated
        },
        sentiment: {
          current: trend.averageSentiment,
          trend: 'stable',
          polarization: 0 // Simplified
        },
        geographic: [],
        sourceDistribution: []
      };
      
      topic.mentions.growth = topic.mentions.previous > 0 
        ? ((topic.mentions.current - topic.mentions.previous) / topic.mentions.previous) * 100 
        : 100;
      
      this.trendingTopics.set(topicId, topic);
      this.metrics.trendingTopicsDetected++;
      
      // Generate alert for high-trending topics
      if (topic.trendScore > 80) {
        this.generateAlert('trending_topic', topic.symbol || 'GENERAL', {
          keyword: topic.keyword,
          trendingScore: topic.trendScore,
          confidence: 90
        });
      }
    }
  }

  private calculateKeywordTrendScore(keyword: string, currentCount: number): number {
    const previousCount = this.getPreviousKeywordCount(keyword);
    const growth = previousCount > 0 ? (currentCount - previousCount) / previousCount : 1;
    
    return Math.min(100, 50 + growth * 50);
  }

  private getPreviousKeywordCount(keyword: string): number {
    // Mock previous count - in production would query historical data
    return Math.floor(Math.random() * 20 + 5); // 5-25
  }

  private categorizeKeyword(keyword: string): TrendingTopic['category'] {
    const stockKeywords = ['stock', 'shares', 'trading', 'buy', 'sell'];
    const cryptoKeywords = ['crypto', 'bitcoin', 'ethereum', 'blockchain'];
    const forexKeywords = ['forex', 'currency', 'dollar', 'euro'];
    
    const lowerKeyword = keyword.toLowerCase();
    
    if (stockKeywords.some(k => lowerKeyword.includes(k))) return 'stock';
    if (cryptoKeywords.some(k => lowerKeyword.includes(k))) return 'crypto';
    if (forexKeywords.some(k => lowerKeyword.includes(k))) return 'forex';
    
    return 'other';
  }

  private async performHealthChecks(): Promise<void> {
    for (const [sourceId, source] of this.sources.entries()) {
      const health = this.sourceHealth.get(sourceId);
      if (!health) continue;
      
      const timeSinceLastUpdate = Date.now() - health.lastUpdate;
      
      // Update status based on last update time
      if (timeSinceLastUpdate > source.updateFrequency * 3) {
        health.status = 'offline';
      } else if (health.errorCount > 5) {
        health.status = 'error';
      } else if (health.requestsToday >= source.maxRequestsPerHour) {
        health.status = 'rate_limited';
      } else {
        health.status = 'online';
      }
      
      this.sourceHealth.set(sourceId, health);
    }
  }

  // Utility Methods
  private cleanupOldData(symbol: string): void {
    const data = this.rawSentimentData.get(symbol);
    if (!data) return;
    
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    const filteredData = data.filter(d => d.timestamp >= cutoff);
    
    this.rawSentimentData.set(symbol, filteredData);
  }

  private calculatePriority(data: any, source: SentimentSource): number {
    let priority = source.reliability;
    
    // Higher priority for verified accounts
    if (data.verified) priority += 20;
    
    // Higher priority for high engagement
    const engagement = (data.likes || 0) + (data.shares || 0) + (data.comments || 0);
    if (engagement > 1000) priority += 15;
    else if (engagement > 100) priority += 10;
    else if (engagement > 10) priority += 5;
    
    // Higher priority for breaking news
    if ((data.text || '').toLowerCase().includes('breaking')) priority += 25;
    
    return Math.min(100, priority);
  }

  private notifySubscribers(symbol: string): void {
    for (const [subId, subscription] of this.subscriptions.entries()) {
      if (!subscription.isActive) continue;
      if (!subscription.symbols.includes(symbol) && !subscription.symbols.includes('ALL')) continue;
      
      try {
        const aggregated = this.aggregatedSentiment.get(symbol)?.get('1h');
        if (aggregated) {
          subscription.callback(aggregated);
        }
      } catch (error) {
        console.error(`❌ Error in sentiment subscription callback ${subId}:`, error);
      }
    }
  }

  private notifyAlertSubscribers(alert: MarketSentimentAlert): void {
    for (const [subId, subscription] of this.subscriptions.entries()) {
      if (!subscription.isActive || !subscription.alertCallback) continue;
      if (!subscription.symbols.includes(alert.symbol) && !subscription.symbols.includes('ALL')) continue;
      
      try {
        subscription.alertCallback(alert);
      } catch (error) {
        console.error(`❌ Error in alert subscription callback ${subId}:`, error);
      }
    }
  }

  private updateProcessingMetrics(processingTime: number): void {
    this.metrics.totalDataPoints++;
    this.metrics.processedToday++;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * 0.9) + (processingTime * 0.1);
    this.metrics.lastUpdate = Date.now();
  }

  // Mock Data Generation
  private generateMockTwitterData(sourceId: string): any[] {
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    const tweets = [];
    
    for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      tweets.push({
        text: this.generateMockTweetText(symbol),
        author: `user_${Math.floor(Math.random() * 10000)}`,
        followers: Math.floor(Math.random() * 100000),
        verified: Math.random() > 0.9,
        likes: Math.floor(Math.random() * 1000),
        retweets: Math.floor(Math.random() * 500),
        replies: Math.floor(Math.random() * 200),
        timestamp: Date.now(),
        language: 'en'
      });
    }
    
    return tweets;
  }

  private generateMockTweetText(symbol: string): string {
    const sentiments = [
      `$${symbol} looking bullish! Great earnings ahead 🚀`,
      `${symbol} stock might be overvalued. Time to sell?`,
      `Just bought more $${symbol} shares. Long term hold!`,
      `${symbol} announcement today could be huge for the stock`,
      `Technical analysis shows $${symbol} breaking resistance`,
      `${symbol} fundamentals are strong despite market volatility`
    ];
    
    return sentiments[Math.floor(Math.random() * sentiments.length)];
  }

  private generateMockRedditData(sourceId: string): any[] {
    const posts = [];
    
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      posts.push({
        title: 'Stock Discussion',
        content: this.generateMockRedditPost(),
        author: `reddit_user_${Math.floor(Math.random() * 10000)}`,
        subreddit: 'wallstreetbets',
        upvotes: Math.floor(Math.random() * 5000),
        downvotes: Math.floor(Math.random() * 1000),
        comments: Math.floor(Math.random() * 500),
        timestamp: Date.now()
      });
    }
    
    return posts;
  }

  private generateMockRedditPost(): string {
    const posts = [
      'DD on AAPL: Why this stock is going to moon 🚀🚀🚀',
      'MSFT earnings play - anyone else in?',
      'GOOGL chart analysis - looks like a breakout incoming',
      'AMZN puts printing today. Market is irrational.',
      'TSLA technical analysis suggests continuation pattern',
      'META fundamentals improving, but sentiment still bearish'
    ];
    
    return posts[Math.floor(Math.random() * posts.length)];
  }

  private generateMockNewsData(sourceId: string): any[] {
    const articles = [];
    
    for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
      articles.push({
        title: this.generateMockNewsTitle(),
        content: this.generateMockNewsContent(),
        author: 'Financial Reporter',
        source: 'Financial News',
        timestamp: Date.now(),
        url: 'https://example.com/news',
        views: Math.floor(Math.random() * 50000)
      });
    }
    
    return articles;
  }

  private generateMockNewsTitle(): string {
    const titles = [
      'Apple Reports Strong Q3 Earnings, Beats Expectations',
      'Microsoft Cloud Revenue Surges 25% Year-over-Year',
      'Google Faces Regulatory Scrutiny Over Market Practices',
      'Amazon Expands Logistics Network Amid Rising Demand',
      'Tesla Production Numbers Exceed Analyst Estimates',
      'Meta Platforms Invests Heavily in Metaverse Technology'
    ];
    
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateMockNewsContent(): string {
    return 'Financial markets showed mixed reactions to the latest corporate earnings reports...';
  }

  private generateMockSECData(sourceId: string): any[] {
    const filings = [];
    
    if (Math.random() > 0.7) { // 30% chance of filing
      filings.push({
        symbol: ['AAPL', 'MSFT', 'GOOGL'][Math.floor(Math.random() * 3)],
        type: 'sec_filing',
        description: 'Form 4 - Statement of Changes in Beneficial Ownership',
        insider_name: 'John Doe',
        insider_title: 'Chief Executive Officer',
        relationship: 'officer',
        ownership_percent: Math.random() * 10,
        transaction: {
          type: Math.random() > 0.5 ? 'buy' : 'sell',
          quantity: Math.floor(Math.random() * 10000) + 1000,
          price: Math.random() * 500 + 100,
          value: 0, // Will be calculated
          currency: 'USD'
        },
        source: 'sec_edgar',
        timestamp: Date.now()
      });
      
      // Calculate transaction value
      const filing = filings[filings.length - 1];
      if (filing.transaction) {
        filing.transaction.value = filing.transaction.quantity * filing.transaction.price;
      }
    }
    
    return filings;
  }

  private generateMockSocialData(sourceId: string): any[] {
    // Generic social media data
    return [{
      text: 'Market sentiment looking positive today',
      author: 'social_user',
      followers: Math.floor(Math.random() * 10000),
      likes: Math.floor(Math.random() * 100),
      shares: Math.floor(Math.random() * 50),
      timestamp: Date.now()
    }];
  }

  // ID Generators
  private generateDataId(): string {
    return `sent_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateActivityId(): string {
    return `act_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateTopicId(): string {
    return `topic_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private initializeDefaultSources(): void {
    // Twitter API
    this.sources.set('twitter_api', {
      sourceId: 'twitter_api',
      name: 'Twitter API v2',
      type: 'social_media',
      platform: 'twitter',
      credentials: {
        bearerToken: process.env.TWITTER_BEARER_TOKEN || 'demo_token',
        endpoint: 'https://api.twitter.com/2'
      },
      reliability: 95,
      updateFrequency: 30000, // 30 seconds
      maxRequestsPerHour: 300,
      isActive: true
    });

    // Reddit API
    this.sources.set('reddit_api', {
      sourceId: 'reddit_api',
      name: 'Reddit API',
      type: 'social_media',
      platform: 'reddit',
      credentials: {
        clientId: process.env.REDDIT_CLIENT_ID || 'demo_client',
        clientSecret: process.env.REDDIT_CLIENT_SECRET || 'demo_secret',
        endpoint: 'https://oauth.reddit.com'
      },
      reliability: 85,
      updateFrequency: 60000, // 1 minute
      maxRequestsPerHour: 60,
      isActive: true
    });

    // News API
    this.sources.set('news_api', {
      sourceId: 'news_api',
      name: 'Financial News API',
      type: 'news',
      platform: 'news_api',
      credentials: {
        apiKey: process.env.NEWS_API_KEY || 'demo_key',
        endpoint: 'https://newsapi.org/v2'
      },
      reliability: 90,
      updateFrequency: 300000, // 5 minutes
      maxRequestsPerHour: 500,
      isActive: true
    });

    // SEC EDGAR
    this.sources.set('sec_edgar', {
      sourceId: 'sec_edgar',
      name: 'SEC EDGAR Database',
      type: 'regulatory',
      platform: 'sec_filings',
      credentials: {
        endpoint: 'https://www.sec.gov/Archives/edgar'
      },
      reliability: 99,
      updateFrequency: 900000, // 15 minutes
      maxRequestsPerHour: 10,
      isActive: true
    });

    console.log(`📱 Initialized ${this.sources.size} sentiment sources`);
  }

  // Public API
  async subscribe(
    symbols: string[],
    callback: (sentiment: AggregatedSentiment) => void,
    options?: {
      alertCallback?: (alert: MarketSentimentAlert) => void;
      filters?: any;
    }
  ): Promise<string> {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    this.subscriptions.set(subscriptionId, {
      symbols,
      callback,
      alertCallback: options?.alertCallback,
      filters: options?.filters,
      isActive: true
    });

    console.log(`📊 Sentiment subscription created: ${subscriptionId} for ${symbols.join(', ')}`);
    return subscriptionId;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      this.subscriptions.delete(subscriptionId);
      console.log(`✅ Sentiment subscription removed: ${subscriptionId}`);
    }
  }

  getSentiment(symbol: string, timeframe: string = '1h'): AggregatedSentiment | undefined {
    return this.aggregatedSentiment.get(symbol)?.get(timeframe);
  }

  getInsiderActivities(symbol?: string): InsiderActivity[] {
    const activities = Array.from(this.insiderActivities.values());
    return symbol ? activities.filter(a => a.symbol === symbol) : activities;
  }

  getTrendingTopics(limit: number = 10): TrendingTopic[] {
    return Array.from(this.trendingTopics.values())
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);
  }

  getAlerts(symbol?: string, severity?: string): MarketSentimentAlert[] {
    const alerts = Array.from(this.alerts.values());
    let filtered = alerts;
    
    if (symbol) filtered = filtered.filter(a => a.symbol === symbol);
    if (severity) filtered = filtered.filter(a => a.severity === severity);
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getSourceHealth(): Map<string, any> {
    return new Map(this.sourceHealth);
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Social Sentiment Analyzer...');

    // Stop all timers
    if (this.processingTimer) clearInterval(this.processingTimer);
    if (this.aggregationTimer) clearInterval(this.aggregationTimer);

    // Clear all data
    this.sources.clear();
    this.rawSentimentData.clear();
    this.aggregatedSentiment.clear();
    this.insiderActivities.clear();
    this.trendingTopics.clear();
    this.alerts.clear();
    this.subscriptions.clear();
    this.processingQueue = [];
    this.sourceHealth.clear();

    console.log('✅ Social Sentiment Analyzer shutdown complete');
  }
}