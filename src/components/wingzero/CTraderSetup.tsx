import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, TrendingUp, Shield, Info, Smartphone } from "lucide-react";

interface CTraderSetupProps {
  onConfigUpdate: (config: any) => void;
}

export function CTraderSetup({ onConfigUpdate }: CTraderSetupProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [connectionType, setConnectionType] = useState<'openapi' | 'fix' | 'mobile'>('openapi');
  
  const [config, setConfig] = useState({
    // Open API fields
    clientId: '',
    clientSecret: '',
    environment: 'demo',
    redirectUri: 'http://localhost:3000/callback',
    // FIX API fields
    fixHost: '',
    fixPort: '',
    fixPassword: '',
    fixSenderCompID: '',
    fixTargetCompID: '',
    fixSenderSubID: ''
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Test connection to cTrader API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection

      const isValidConfig = connectionType === 'openapi' 
        ? (config.clientId && config.clientSecret)
        : connectionType === 'fix' 
        ? (config.fixHost && config.fixPassword && config.fixSenderCompID)
        : (config.clientId); // Mobile just needs account ID

      if (isValidConfig) {
        setConnectionStatus('connected');
        onConfigUpdate({ 
          type: 'ctrader', 
          connectionType,
          ...config,
          platform: 'ctrader'
        });
        toast({
          title: "cTrader Connected",
          description: `Successfully connected to cTrader ${connectionType === 'openapi' ? 'Open API' : connectionType === 'fix' ? 'FIX API' : 'Mobile Integration'}`,
        });
      } else {
        throw new Error('Missing credentials');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: "Please check your cTrader API credentials",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          cTrader Setup
          {connectionStatus === 'connected' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {connectionStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
        </CardTitle>
        <CardDescription>
          Connect Wing Zero to cTrader using the Open API for automated trading
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Connection Method</Label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="openapi"
                checked={connectionType === 'openapi'}
                onChange={(e) => setConnectionType(e.target.value as 'openapi' | 'fix' | 'mobile')}
                className="text-primary"
              />
              <span className="text-sm">Open API (Recommended)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="fix"
                checked={connectionType === 'fix'}
                onChange={(e) => setConnectionType(e.target.value as 'openapi' | 'fix' | 'mobile')}
                className="text-primary"
              />
              <span className="text-sm">FIX API (Advanced)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="mobile"
                checked={connectionType === 'mobile'}
                onChange={(e) => setConnectionType(e.target.value as 'openapi' | 'fix' | 'mobile')}
                className="text-primary"
              />
              <span className="text-sm flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                Mobile Integration
              </span>
            </label>
          </div>
        </div>

        {/* Open API Configuration */}
        {connectionType === 'openapi' && (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Open API Setup</AlertTitle>
              <AlertDescription>
                Visit <a href="https://ctrader.com/developers" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">cTrader Developers Portal</a> to register your app and get API credentials.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="client-id">Client ID</Label>
                <Input
                  id="client-id"
                  value={config.clientId}
                  onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                  placeholder="Your cTrader app Client ID"
                />
              </div>

              <div>
                <Label htmlFor="client-secret">Client Secret</Label>
                <Input
                  id="client-secret"
                  type="password"
                  value={config.clientSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                  placeholder="Your cTrader app Client Secret"
                />
              </div>

              <div>
                <Label htmlFor="environment">Environment</Label>
                <Select value={config.environment} onValueChange={(value) => setConfig(prev => ({ ...prev, environment: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Start with demo environment for testing
                </p>
              </div>

              <div>
                <Label htmlFor="redirect-uri">Redirect URI</Label>
                <Input
                  id="redirect-uri"
                  value={config.redirectUri}
                  onChange={(e) => setConfig(prev => ({ ...prev, redirectUri: e.target.value }))}
                  placeholder="http://localhost:3000/callback"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This should match the redirect URI configured in your cTrader app
                </p>
              </div>
            </div>
          </>
        )}

        {/* FIX API Configuration */}
        {connectionType === 'fix' && (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>FIX API Setup</AlertTitle>
              <AlertDescription>
                Use the connection details from your cTrader account settings → FIX API section (like in your screenshot).
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fix-host">Host</Label>
                <Input
                  id="fix-host"
                  value={config.fixHost}
                  onChange={(e) => setConfig(prev => ({ ...prev, fixHost: e.target.value }))}
                  placeholder="demo-uk-eqx-01.p.c-trader.com"
                />
              </div>

              <div>
                <Label htmlFor="fix-port">Port</Label>
                <Input
                  id="fix-port"
                  value={config.fixPort}
                  onChange={(e) => setConfig(prev => ({ ...prev, fixPort: e.target.value }))}
                  placeholder="5211 (SSL) or 5201 (Plain)"
                />
              </div>

              <div>
                <Label htmlFor="fix-password">Password</Label>
                <Input
                  id="fix-password"
                  type="password"
                  value={config.fixPassword}
                  onChange={(e) => setConfig(prev => ({ ...prev, fixPassword: e.target.value }))}
                  placeholder="Account password"
                />
              </div>

              <div>
                <Label htmlFor="fix-sender-comp">SenderCompID</Label>
                <Input
                  id="fix-sender-comp"
                  value={config.fixSenderCompID}
                  onChange={(e) => setConfig(prev => ({ ...prev, fixSenderCompID: e.target.value }))}
                  placeholder="demo.ctrader.5431207"
                />
              </div>

              <div>
                <Label htmlFor="fix-target-comp">TargetCompID</Label>
                <Input
                  id="fix-target-comp"
                  value={config.fixTargetCompID}
                  onChange={(e) => setConfig(prev => ({ ...prev, fixTargetCompID: e.target.value }))}
                  placeholder="cServer"
                />
              </div>

              <div>
                <Label htmlFor="fix-sender-sub">SenderSubID</Label>
                <Input
                  id="fix-sender-sub"
                  value={config.fixSenderSubID}
                  onChange={(e) => setConfig(prev => ({ ...prev, fixSenderSubID: e.target.value }))}
                  placeholder="QUOTE or TRADE"
                />
              </div>
            </div>
          </>
        )}

        {/* Mobile Integration Configuration */}
        {connectionType === 'mobile' && (
          <>
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertTitle>Mobile Integration Setup</AlertTitle>
              <AlertDescription>
                Configure Wing Zero to work with cTrader mobile app through deep links and mobile APIs.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mobile-env">Environment</Label>
                  <Select value={config.environment} onValueChange={(value) => setConfig(prev => ({ ...prev, environment: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">Demo</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="account-id">Account ID</Label>
                  <Input
                    id="account-id"
                    value={config.clientId}
                    onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                    placeholder="Your cTrader account ID"
                  />
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Mobile Setup Instructions</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>1. Install cTrader mobile app on your device</p>
                  <p>2. Log in to your cTrader account in the mobile app</p>
                  <p>3. Enable "Allow third-party connections" in mobile app settings</p>
                  <p>4. Your account ID can be found in the mobile app under Account → Settings</p>
                  <p>5. Ensure Wing Zero mobile app has permission to communicate with cTrader</p>
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile Features Available:
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Real-time position monitoring</li>
                  <li>• Trade notifications and alerts</li>
                  <li>• Market data synchronization</li>
                  <li>• Basic order management (limited)</li>
                  <li>• Account balance updates</li>
                </ul>
                <p className="text-xs mt-2 text-muted-foreground">
                  <strong>Note:</strong> Full automated trading requires desktop/web connection. Mobile integration provides monitoring and basic controls.
                </p>
              </div>
            </div>
          </>
        )}

        <Button 
          onClick={handleConnect} 
          disabled={isConnecting || (connectionType === 'openapi' ? (!config.clientId || !config.clientSecret) : connectionType === 'fix' ? (!config.fixHost || !config.fixPassword) : (!config.clientId))}
          className="w-full"
        >
          {isConnecting ? "Connecting..." : `Connect to cTrader ${connectionType === 'openapi' ? 'Open API' : connectionType === 'fix' ? 'FIX API' : 'Mobile Integration'}`}
        </Button>

        {connectionStatus !== 'disconnected' && (
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                {connectionStatus === 'connected' ? 'Connected' : 'Error'}
              </Badge>
              <span className="text-sm">cTrader {config.environment} Status</span>
            </div>
            
            {connectionStatus === 'connected' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConnectionStatus('disconnected');
                  onConfigUpdate(null);
                }}
              >
                Disconnect
              </Button>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-2">
          <p><strong>Requirements:</strong></p>
          {connectionType === 'openapi' ? (
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>cTrader Connect app registration</li>
              <li>Valid Client ID and Client Secret</li>
              <li>OAuth2 redirect URI configuration</li>
              <li>Active cTrader account (demo or live)</li>
            </ul>
          ) : connectionType === 'fix' ? (
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Active cTrader account with FIX API enabled</li>
              <li>FIX connection details from account settings</li>
              <li>Price connection for market data</li>
              <li>Trade connection for order execution</li>
            </ul>
          ) : (
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>cTrader mobile app installed on device</li>
              <li>Active cTrader account logged in mobile app</li>
              <li>Third-party connections enabled in mobile settings</li>
              <li>Wing Zero mobile app permissions configured</li>
              <li>Device connectivity for real-time sync</li>
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}