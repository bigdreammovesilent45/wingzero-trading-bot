import { supabase } from '@/integrations/supabase/client';

export interface SentimentData {
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number; // -100 to 100
  volume: number;
  sources: string[];
  timestamp: string;
  confidence: number;
}

export interface MarketRegime {
  type: 'trending_up' | 'trending_down' | 'sideways' | 'volatile' | 'low_volatility';
  confidence: number;
  duration: number;
  characteristics: string[];
  timestamp: string;
}

export interface TradingRecommendation {
  id: string;
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  reasoning: string[];
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  timeframe: string;
  riskLevel: 'low' | 'medium' | 'high';
  timestamp: string;
}

export class MarketSentimentService {
  private static instance: MarketSentimentService;

  static getInstance(): MarketSentimentService {
    if (!MarketSentimentService.instance) {
      MarketSentimentService.instance = new MarketSentimentService();
    }
    return MarketSentimentService.instance;
  }

  async analyzeSentiment(symbol: string): Promise<SentimentData> {
    try {
      // Call the market intelligence edge function
      const { data, error } = await supabase.functions.invoke('market-intelligence', {
        body: {
          action: 'analyze_sentiment',
          symbol,
          sources: ['news', 'social', 'technical']
        }
      });

      if (error) throw error;

      return {
        symbol,
        sentiment: data.sentiment || 'neutral',
        score: data.score || 0,
        volume: data.volume || 0,
        sources: data.sources || [],
        timestamp: new Date().toISOString(),
        confidence: data.confidence || 0
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      
      // Return mock data for development
      return this.getMockSentiment(symbol);
    }
  }

  async detectMarketRegime(): Promise<MarketRegime> {
    try {
      const { data, error } = await supabase.functions.invoke('market-intelligence', {
        body: {
          action: 'detect_regime',
          timeframe: '1D',
          lookback: 30
        }
      });

      if (error) throw error;

      return {
        type: data.regime_type || 'sideways',
        confidence: data.confidence || 0,
        duration: data.duration || 0,
        characteristics: data.characteristics || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error detecting market regime:', error);
      
      // Return mock data
      return this.getMockRegime();
    }
  }

  async generateRecommendations(symbols: string[], userProfile?: any): Promise<TradingRecommendation[]> {
    try {
      const { data, error } = await supabase.functions.invoke('market-intelligence', {
        body: {
          action: 'generate_recommendations',
          symbols,
          user_profile: userProfile,
          analysis_depth: 'comprehensive'
        }
      });

      if (error) throw error;

      return data.recommendations || [];
    } catch (error) {
      console.error('Error generating recommendations:', error);
      
      // Return mock recommendations
      return this.getMockRecommendations(symbols);
    }
  }

  async optimizeStrategy(strategyId: string, performanceData: any): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('market-intelligence', {
        body: {
          action: 'optimize_strategy',
          strategy_id: strategyId,
          performance_data: performanceData,
          optimization_target: 'sharpe_ratio'
        }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error optimizing strategy:', error);
      
      // Return mock optimization
      return {
        optimized_parameters: {},
        expected_improvement: 0,
        confidence: 0
      };
    }
  }

  // Mock data for development
  private getMockSentiment(symbol: string): SentimentData {
    const sentiments: ('bullish' | 'bearish' | 'neutral')[] = ['bullish', 'bearish', 'neutral'];
    const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const score = randomSentiment === 'bullish' ? 
      Math.random() * 100 : 
      randomSentiment === 'bearish' ? 
        -(Math.random() * 100) : 
        (Math.random() - 0.5) * 40;

    return {
      symbol,
      sentiment: randomSentiment,
      score: Math.round(score),
      volume: Math.floor(Math.random() * 1000),
      sources: ['Twitter', 'Reddit', 'News', 'Technical Analysis'],
      timestamp: new Date().toISOString(),
      confidence: Math.random() * 100
    };
  }

  private getMockRegime(): MarketRegime {
    const regimes: MarketRegime['type'][] = ['trending_up', 'trending_down', 'sideways', 'volatile', 'low_volatility'];
    const randomRegime = regimes[Math.floor(Math.random() * regimes.length)];
    
    return {
      type: randomRegime,
      confidence: Math.random() * 100,
      duration: Math.floor(Math.random() * 30) + 1,
      characteristics: [
        'High volume',
        'Increased volatility',
        'Strong momentum',
        'Clear direction'
      ],
      timestamp: new Date().toISOString()
    };
  }

  private getMockRecommendations(symbols: string[]): TradingRecommendation[] {
    return symbols.map(symbol => {
      const actions: ('buy' | 'sell' | 'hold')[] = ['buy', 'sell', 'hold'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const riskLevels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
      
      return {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol,
        action,
        confidence: Math.random() * 100,
        reasoning: [
          'Strong technical indicators',
          'Positive sentiment analysis',
          'Favorable market conditions',
          'Risk-reward ratio is attractive'
        ],
        entryPrice: 100 + (Math.random() * 50),
        stopLoss: 90 + (Math.random() * 20),
        takeProfit: 120 + (Math.random() * 30),
        timeframe: '1D',
        riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
        timestamp: new Date().toISOString()
      };
    });
  }

  async getSentimentHistory(symbol: string, days: number = 30): Promise<SentimentData[]> {
    // Generate mock historical data
    const history: SentimentData[] = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      history.push({
        ...this.getMockSentiment(symbol),
        timestamp: date.toISOString()
      });
    }
    
    return history;
  }

  async getMarketOverview(): Promise<{
    sentiment: SentimentData[];
    regime: MarketRegime;
    hotSymbols: string[];
    riskLevel: number;
  }> {
    const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'];
    const sentiment = await Promise.all(symbols.map(s => this.analyzeSentiment(s)));
    const regime = await this.detectMarketRegime();
    
    return {
      sentiment,
      regime,
      hotSymbols: symbols.slice(0, 3),
      riskLevel: Math.random() * 100
    };
  }
}