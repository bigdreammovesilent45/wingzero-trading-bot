import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { useSecureAPI } from '@/hooks/useSecureAPI';
import { useToast } from '@/hooks/use-toast';

interface AIBrainControlsProps {
  isConnected?: boolean;
}

export const AIBrainControls: React.FC<AIBrainControlsProps> = ({ isConnected = false }) => {
  const { callAIBrainAPI, callMarketIntelligenceAPI, loading } = useSecureAPI();
  const { toast } = useToast();
  const [brainStatus, setBrainStatus] = useState<'idle' | 'analyzing' | 'learning'>('idle');
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);

  const runMarketAnalysis = async () => {
    try {
      setBrainStatus('analyzing');
      
      // Get market overview first
      console.log('🔍 Getting market overview...');
      const overview = await callMarketIntelligenceAPI('get_market_overview');
      console.log('📊 Market overview received:', overview);
      
      // Analyze sentiment with AI Brain
      console.log('🧠 Analyzing market sentiment...');
      const sentiment = await callAIBrainAPI('analyze_market_sentiment', {
        marketData: overview
      });
      console.log('💡 Sentiment analysis complete:', sentiment);
      
      setLastAnalysis(sentiment);
      setBrainStatus('idle');
      
      toast({
        title: "Analysis Complete",
        description: `Market sentiment: ${sentiment.sentiment} (${sentiment.confidence}% confidence)`,
      });
    } catch (error) {
      setBrainStatus('idle');
      console.error('🚨 Analysis failed:', error);
      
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };

  const scrapeLatestNews = async () => {
    try {
      const result = await callMarketIntelligenceAPI('scrape_financial_news');
      
      toast({
        title: "News Scraped",
        description: `Analyzed ${result.newsCount} financial news sources`,
      });
    } catch (error) {
      console.error('News scraping failed:', error);
    }
  };

  const generateStrategy = async () => {
    try {
      setBrainStatus('learning');
      
      const strategy = await callAIBrainAPI('generate_trading_strategy', {
        riskTolerance: 'medium',
        timeframe: '4h',
        preferredPairs: ['EURUSD', 'GBPUSD']
      });
      
      setBrainStatus('idle');
      
      toast({
        title: "Strategy Generated",
        description: `New strategy: ${strategy.strategy_name}`,
      });
    } catch (error) {
      setBrainStatus('idle');
      console.error('Strategy generation failed:', error);
    }
  };

  const optimizeParameters = async () => {
    try {
      const optimization = await callAIBrainAPI('optimize_parameters', {
        currentConfig: {
          stopLoss: 0.02,
          takeProfit: 0.04,
          positionSize: 0.03
        },
        performance: {
          winRate: 0.65,
          avgReturn: 0.025,
          maxDrawdown: 0.08
        }
      });
      
      toast({
        title: "Parameters Optimized",
        description: `Expected improvement: ${(optimization.expected_improvement * 100).toFixed(1)}%`,
      });
    } catch (error) {
      console.error('Optimization failed:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Trading Brain
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Offline"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={runMarketAnalysis}
            disabled={loading || !isConnected}
            variant="outline"
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Analyze Market
          </Button>
          
          <Button
            onClick={scrapeLatestNews}
            disabled={loading || !isConnected}
            variant="outline"
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Scrape News
          </Button>
          
          <Button
            onClick={generateStrategy}
            disabled={loading || !isConnected}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Generate Strategy
          </Button>
          
          <Button
            onClick={optimizeParameters}
            disabled={loading || !isConnected}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            Optimize
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Brain Status:</span>
            <Badge variant={brainStatus === 'idle' ? 'default' : 'secondary'}>
              {brainStatus}
            </Badge>
          </div>
          
          {lastAnalysis && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="font-medium">Last Analysis:</div>
              <div className="flex justify-between mt-1">
                <span>Sentiment:</span>
                <Badge variant={lastAnalysis.sentiment === 'bullish' ? 'default' : 'destructive'}>
                  {lastAnalysis.sentiment}
                </Badge>
              </div>
              <div className="flex justify-between mt-1">
                <span>Confidence:</span>
                <span>{lastAnalysis.confidence}%</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Action:</span>
                <span className="font-medium">{lastAnalysis.recommended_action}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};