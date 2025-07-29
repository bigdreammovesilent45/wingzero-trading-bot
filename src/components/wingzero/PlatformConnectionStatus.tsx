import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTradingEngine } from "@/hooks/useTradingEngine";
import { CTraderSetup } from "./CTraderSetup";
import { PlatformSetup } from "./PlatformSetup";

type Platform = 'ctrader' | 'ninjatrader' | 'tradingview' | 'interactivebrokers' | 'binance';

export const PlatformConnectionStatus = () => {
  const [selectedPlatform] = useLocalStorage<Platform>('wingzero-platform', 'ctrader');
  const [connectionStatus, setConnectionStatus] = useLocalStorage<{[key: string]: boolean}>('wingzero-connections', {});
  const { isConnected: engineConnected, isOperational } = useTradingEngine();

  const handleConfigUpdate = (config: any) => {
    if (config) {
      setConnectionStatus(prev => ({ ...prev, [selectedPlatform]: true }));
    } else {
      setConnectionStatus(prev => ({ ...prev, [selectedPlatform]: false }));
    }
  };

  const handleTestConnection = async () => {
    // Update connection status to reflect actual engine connection
    setConnectionStatus(prev => ({ ...prev, [selectedPlatform]: engineConnected }));
    console.log(`Testing ${selectedPlatform} connection... Engine connected: ${engineConnected}`);
  };

  const getPlatformName = (platform: Platform) => {
    const names = {
      ctrader: 'cTrader',
      ninjatrader: 'NinjaTrader',
      tradingview: 'TradingView',
      interactivebrokers: 'Interactive Brokers',
      binance: 'Binance'
    };
    return names[platform];
  };

  // Use actual trading engine connection status, fallback to stored status
  const isConnected = engineConnected || connectionStatus[selectedPlatform] || false;

  const renderSetupComponent = () => {
    switch (selectedPlatform) {
      case 'ctrader':
        return <CTraderSetup onConfigUpdate={handleConfigUpdate} />;
      default:
        return <PlatformSetup platform={selectedPlatform} onConfigUpdate={handleConfigUpdate} />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Platform Connection Status
            <Button variant="outline" size="sm" onClick={handleTestConnection}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Test Connection
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platform Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">{getPlatformName(selectedPlatform)}</span>
              {selectedPlatform === 'ctrader' && (
                <Badge variant="default">Recommended</Badge>
              )}
            </div>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          {!isConnected && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Configure your {getPlatformName(selectedPlatform)} connection below to start trading.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Platform Setup Component */}
      {renderSetupComponent()}
    </div>
  );
};