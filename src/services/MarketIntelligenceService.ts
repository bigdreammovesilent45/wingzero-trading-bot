export interface MarketSentiment {
  score: number; // -1 to 1
  confidence: number;
  factors: string[];
  fearGreedIndex: number;
}

export interface NewsAnalysis {
  sentiment: number; // -1 to 1
  impact: number; // 0 to 1
  relevance: number; // 0 to 1
  articles: NewsArticle[];
}

export interface NewsArticle {
  title: string;
  summary: string;
  sentiment: number;
  impact: number;
  source: string;
  timestamp: Date;
  symbols: string[];
}

export interface SymbolSentiment {
  symbol: string;
  score: number;
  volume: number;
  socialMentions: number;
  newsCount: number;
}

export class MarketIntelligenceService {
  private perplexityApiKey: string | null = null;
  private newsCache: Map<string, NewsAnalysis> = new Map();
  private sentimentCache: Map<string, MarketSentiment> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  async initialize(): Promise<void> {
    console.log('🧠 Market Intelligence Service initialized');
    // Use edge function for secure API access
    this.perplexityApiKey = 'edge-function'; // Using edge function
  }

  async getMarketSentiment(): Promise<MarketSentiment> {
    const cacheKey = 'global_sentiment';
    const cached = this.sentimentCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached as any)) {
      return cached;
    }

    try {
      // Get sentiment from multiple sources
      const [
        fearGreedIndex,
        newsSentiment,
        socialSentiment
      ] = await Promise.all([
        this.getFearGreedIndex(),
        this.getNewsSentiment(),
        this.getSocialSentiment()
      ]);

      const sentiment: MarketSentiment = {
        score: (newsSentiment + socialSentiment) / 2,
        confidence: 0.8,
        factors: ['news', 'social', 'vix'],
        fearGreedIndex
      };

      this.sentimentCache.set(cacheKey, sentiment);
      return sentiment;

    } catch (error) {
      console.error('Error getting market sentiment:', error);
      return {
        score: 0,
        confidence: 0,
        factors: [],
        fearGreedIndex: 50
      };
    }
  }

  async getNewsAnalysis(): Promise<NewsAnalysis> {
    const cacheKey = 'global_news';
    const cached = this.newsCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached as any)) {
      return cached;
    }

    try {
      const newsData = await this.fetchLatestNews();
      
      const analysis: NewsAnalysis = {
        sentiment: this.calculateNewsSentiment(newsData),
        impact: this.calculateNewsImpact(newsData),
        relevance: this.calculateNewsRelevance(newsData),
        articles: newsData
      };

      this.newsCache.set(cacheKey, analysis);
      return analysis;

    } catch (error) {
      console.error('Error getting news analysis:', error);
      return {
        sentiment: 0,
        impact: 0,
        relevance: 0,
        articles: []
      };
    }
  }

  async getSymbolNews(symbol: string): Promise<NewsAnalysis> {
    const cacheKey = `news_${symbol}`;
    const cached = this.newsCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached as any)) {
      return cached;
    }

    try {
      const newsData = await this.fetchSymbolNews(symbol);
      
      const analysis: NewsAnalysis = {
        sentiment: this.calculateNewsSentiment(newsData),
        impact: this.calculateNewsImpact(newsData),
        relevance: this.calculateNewsRelevance(newsData),
        articles: newsData
      };

      this.newsCache.set(cacheKey, analysis);
      return analysis;

    } catch (error) {
      console.error(`Error getting news for ${symbol}:`, error);
      return {
        sentiment: 0,
        impact: 0,
        relevance: 0,
        articles: []
      };
    }
  }

  async getSymbolSentiment(symbol: string): Promise<SymbolSentiment> {
    try {
      // Analyze symbol-specific sentiment
      const newsAnalysis = await this.getSymbolNews(symbol);
      
      return {
        symbol,
        score: newsAnalysis.sentiment,
        volume: Math.random() * 1000000, // Mock volume data
        socialMentions: Math.floor(Math.random() * 10000),
        newsCount: newsAnalysis.articles.length
      };

    } catch (error) {
      console.error(`Error getting sentiment for ${symbol}:`, error);
      return {
        symbol,
        score: 0,
        volume: 0,
        socialMentions: 0,
        newsCount: 0
      };
    }
  }

  private async fetchLatestNews(): Promise<NewsArticle[]> {
    try {
      // Use edge function for secure news fetching
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('market-intelligence', {
        body: { 
          action: 'get_financial_news',
          params: {
            timeframe: '24h',
            format: 'forex_analysis'
          }
        }
      });

      if (error) throw error;
      
      return this.parseNewsResponse(data?.news || []);

    } catch (error) {
      console.error('Error fetching news via edge function:', error);
      return this.getMockNews();
    }
  }

  private async fetchSymbolNews(symbol: string): Promise<NewsArticle[]> {
    try {
      // Use edge function for secure symbol news fetching
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('market-intelligence', {
        body: { 
          action: 'get_symbol_news',
          params: {
            symbol,
            timeframe: '24h'
          }
        }
      });

      if (error) throw error;
      
      return this.parseNewsResponse(data?.news || []);

    } catch (error) {
      console.error(`Error fetching news for ${symbol} via edge function:`, error);
      return this.getMockSymbolNews(symbol);
    }
  }

  private parseNewsResponse(newsData: any): NewsArticle[] {
    try {
      // Handle both string and object responses
      let parsedData = newsData;
      if (typeof newsData === 'string') {
        parsedData = JSON.parse(newsData);
      }
      
      if (Array.isArray(parsedData)) {
        return parsedData.map(item => ({
          title: item.title || 'News Update',
          summary: item.summary || item.content || '',
          sentiment: typeof item.sentiment === 'number' ? item.sentiment : 0,
          impact: typeof item.impact === 'number' ? item.impact : 0.5,
          source: item.source || 'Financial News',
          timestamp: new Date(item.timestamp || Date.now()),
          symbols: Array.isArray(item.symbols) ? item.symbols : []
        }));
      }
      
      return this.getMockNews();
    } catch (error) {
      console.error('Error parsing news response:', error);
      return this.getMockNews();
    }
  }

  private getMockNews(): NewsArticle[] {
    return [
      {
        title: "Federal Reserve Maintains Interest Rates",
        summary: "The Fed kept rates unchanged citing inflation concerns and market stability.",
        sentiment: 0.1,
        impact: 0.8,
        source: "Financial Times",
        timestamp: new Date(),
        symbols: ["EURUSD", "GBPUSD", "USDJPY"]
      },
      {
        title: "ECB Signals Dovish Stance",
        summary: "European Central Bank hints at potential easing measures amid economic slowdown.",
        sentiment: -0.3,
        impact: 0.6,
        source: "Reuters",
        timestamp: new Date(),
        symbols: ["EURUSD", "EURGBP"]
      }
    ];
  }

  private getMockSymbolNews(symbol: string): NewsArticle[] {
    const symbolNews = {
      'EURUSD': [
        {
          title: "EUR strengthens on positive eurozone data",
          summary: "Better than expected GDP growth supports euro",
          sentiment: 0.4,
          impact: 0.6,
          source: "MarketWatch",
          timestamp: new Date(),
          symbols: ["EURUSD"]
        }
      ],
      'GBPUSD': [
        {
          title: "GBP under pressure from Brexit concerns",
          summary: "Trade negotiations create uncertainty for pound",
          sentiment: -0.2,
          impact: 0.5,
          source: "Bloomberg",
          timestamp: new Date(),
          symbols: ["GBPUSD"]
        }
      ]
    };

    return symbolNews[symbol as keyof typeof symbolNews] || [];
  }

  private async getFearGreedIndex(): Promise<number> {
    // Mock fear & greed index (0 = extreme fear, 100 = extreme greed)
    return 45 + Math.random() * 20; // Random between 45-65
  }

  private async getNewsSentiment(): Promise<number> {
    const news = await this.getNewsAnalysis();
    return news.sentiment;
  }

  private async getSocialSentiment(): Promise<number> {
    // Mock social sentiment analysis
    return (Math.random() - 0.5) * 0.6; // Random between -0.3 and 0.3
  }

  private calculateNewsSentiment(articles: NewsArticle[]): number {
    if (articles.length === 0) return 0;
    
    const weightedSentiment = articles.reduce((sum, article) => {
      return sum + (article.sentiment * article.impact);
    }, 0);
    
    const totalWeight = articles.reduce((sum, article) => sum + article.impact, 0);
    
    return totalWeight > 0 ? weightedSentiment / totalWeight : 0;
  }

  private calculateNewsImpact(articles: NewsArticle[]): number {
    if (articles.length === 0) return 0;
    
    const avgImpact = articles.reduce((sum, article) => sum + article.impact, 0) / articles.length;
    const recencyBonus = articles.length / 10; // More recent news = higher impact
    
    return Math.min(avgImpact + recencyBonus, 1);
  }

  private calculateNewsRelevance(articles: NewsArticle[]): number {
    if (articles.length === 0) return 0;
    
    const relevantCount = articles.filter(article => 
      article.symbols.length > 0 || 
      article.title.toLowerCase().includes('forex') ||
      article.title.toLowerCase().includes('currency')
    ).length;
    
    return relevantCount / articles.length;
  }

  private isCacheValid(item: any): boolean {
    return Date.now() - item.timestamp < this.cacheExpiry;
  }
}