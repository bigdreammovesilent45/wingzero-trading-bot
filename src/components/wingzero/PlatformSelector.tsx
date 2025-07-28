import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, TrendingUp, BarChart3 } from "lucide-react";
import { CTraderSetup } from "./CTraderSetup";
import { PlatformSetup } from "./PlatformSetup";

interface PlatformSelectorProps {
  onConfigUpdate: (config: any) => void;
}

type Platform = 'ctrader' | 'ninjatrader' | 'tradingview' | 'interactivebrokers' | 'binance' | null;

export function PlatformSelector({ onConfigUpdate }: PlatformSelectorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);
  const [connectionStatus, setConnectionStatus] = useState<{[key: string]: boolean}>({});

  const platforms = [
    {
      id: 'ctrader' as const,
      name: 'cTrader',
      description: 'Professional trading platform with Open API and FIX connectivity (Recommended)',
      icon: TrendingUp,
      features: ['Open API', 'FIX Protocol', 'OAuth2 Security', 'Live & Demo', 'ECN Execution', 'Low Latency'],
      status: connectionStatus.ctrader ? 'connected' : 'recommended'
    },
    {
      id: 'ninjatrader' as const,
      name: 'NinjaTrader',
      description: 'Advanced futures and forex platform with NTDirect API',
      icon: BarChart3,
      features: ['NTDirect API', 'Advanced Charting', 'Strategy Builder', 'Market Replay'],
      status: connectionStatus.ninjatrader ? 'connected' : 'available'
    },
    {
      id: 'tradingview' as const,
      name: 'TradingView',
      description: 'Web-based charting with broker integrations via REST API',
      icon: TrendingUp,
      features: ['REST API', 'Paper Trading', 'Pine Script', 'Social Trading'],
      status: connectionStatus.tradingview ? 'connected' : 'available'
    },
    {
      id: 'interactivebrokers' as const,
      name: 'Interactive Brokers',
      description: 'Professional brokerage with TWS API for institutional trading',
      icon: Smartphone,
      features: ['TWS API', 'Global Markets', 'Low Commissions', 'Portfolio Margin'],
      status: connectionStatus.interactivebrokers ? 'connected' : 'available'
    },
    {
      id: 'binance' as const,
      name: 'Binance',
      description: 'Leading crypto exchange with comprehensive REST and WebSocket APIs',
      icon: Monitor,
      features: ['REST API', 'WebSocket', 'Spot & Futures', 'High Liquidity'],
      status: connectionStatus.binance ? 'connected' : 'available'
    }
  ];

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    // Store the selected platform globally
    localStorage.setItem('wingzero-platform', platform || '');
  };

  const handleConfigUpdate = (config: any) => {
    if (config) {
      setConnectionStatus(prev => ({ ...prev, [selectedPlatform!]: true }));
      onConfigUpdate(config);
    } else {
      setConnectionStatus(prev => ({ ...prev, [selectedPlatform!]: false }));
      onConfigUpdate(null);
    }
  };

  const handleBackToSelection = () => {
    setSelectedPlatform(null);
  };

  if (selectedPlatform === 'ctrader') {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleBackToSelection}>
          ← Back to Platform Selection
        </Button>
        <CTraderSetup onConfigUpdate={handleConfigUpdate} />
      </div>
    );
  }

  if (selectedPlatform) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleBackToSelection}>
          ← Back to Platform Selection
        </Button>
        <PlatformSetup platform={selectedPlatform} onConfigUpdate={handleConfigUpdate} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Trading Platform</h2>
        <p className="text-muted-foreground">
          Select the platform you want to connect Wing Zero to for automated trading
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isConnected = connectionStatus[platform.id];
          
          return (
            <Card 
              key={platform.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isConnected ? 'ring-2 ring-green-500' : ''
              }`}
              onClick={() => handlePlatformSelect(platform.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {platform.status === 'recommended' && (
                      <Badge variant="default">Recommended</Badge>
                    )}
                    {platform.status === 'connected' && (
                      <Badge variant="default" className="bg-green-500">Connected</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {platform.description}
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {platform.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button className="w-full" variant={isConnected ? "outline" : "default"}>
                  {isConnected ? "Reconfigure" : "Setup " + platform.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {Object.values(connectionStatus).some(Boolean) && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>
                You can connect to multiple platforms simultaneously for diversified trading strategies.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}