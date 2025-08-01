import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Brain, TrendingUp, AlertTriangle, Zap, Save, Settings } from 'lucide-react';
import { useSecureAPI } from '@/hooks/useSecureAPI';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import SettingsSaveManager from './SettingsSaveManager';

interface AIBrainControlsProps {
  isConnected?: boolean;
}

export const AIBrainControls: React.FC<AIBrainControlsProps> = ({ isConnected = false }) => {
  const { callAIBrainAPI, callMarketIntelligenceAPI, loading } = useSecureAPI();
  const { toast } = useToast();
  const [brainStatus, setBrainStatus] = useState<'idle' | 'analyzing' | 'learning'>('idle');
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);
  
  const [brainSettings, setBrainSettings] = useLocalStorage('ai-brain-settings', {
    autoAnalysis: true,
    newsScrapingEnabled: true,
    strategyOptimization: true,
    learningMode: 'aggressive'
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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

  const saveBrainSettings = async () => {
    try {
      // Settings are automatically saved via useLocalStorage
      setLastSaved(new Date());
      toast({
        title: "AI Brain Settings Saved",
        description: "Brain configuration has been saved",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save AI brain settings",
        variant: "destructive"
      });
    }
  };

  const updateBrainSetting = (key: string, value: any) => {
    setBrainSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Trading Brain
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Offline"}
              </Badge>
            </CardTitle>
            {lastSaved && (
              <p className="text-xs text-muted-foreground mt-1">
                Last saved: {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
          <Button 
            onClick={saveBrainSettings}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Brain Settings */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
          <h4 className="font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Brain Configuration
          </h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Auto Analysis</Label>
              <Switch
                checked={brainSettings.autoAnalysis}
                onCheckedChange={(checked) => updateBrainSetting('autoAnalysis', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">News Scraping</Label>
              <Switch
                checked={brainSettings.newsScrapingEnabled}
                onCheckedChange={(checked) => updateBrainSetting('newsScrapingEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Strategy Optimization</Label>
              <Switch
                checked={brainSettings.strategyOptimization}
                onCheckedChange={(checked) => updateBrainSetting('strategyOptimization', checked)}
              />
            </div>
          </div>
        </div>

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