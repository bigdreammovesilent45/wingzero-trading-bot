import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

interface CTraderSetupProps {
  onConfigUpdate: (config: any) => void;
}

export function CTraderSetup({ onConfigUpdate }: CTraderSetupProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  
  const [config, setConfig] = useState({
    clientId: '',
    clientSecret: '',
    environment: 'demo', // 'demo' or 'live'
    redirectUri: 'http://localhost:3000/callback'
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Test connection to cTrader Open API
      // In a real implementation, this would handle OAuth2 flow
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection

      if (config.clientId && config.clientSecret) {
        setConnectionStatus('connected');
        onConfigUpdate({ 
          type: 'ctrader', 
          ...config,
          platform: 'ctrader'
        });
        toast({
          title: "cTrader Connected",
          description: "Successfully connected to cTrader Open API",
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
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You'll need to register your application with cTrader Connect to get API credentials.
            Visit the cTrader Connect portal to create your app and get your Client ID and Secret.
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
            <select 
              id="environment"
              value={config.environment}
              onChange={(e) => setConfig(prev => ({ ...prev, environment: e.target.value }))}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="demo">Demo</option>
              <option value="live">Live</option>
            </select>
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

        <Button 
          onClick={handleConnect} 
          disabled={isConnecting || !config.clientId || !config.clientSecret}
          className="w-full"
        >
          {isConnecting ? "Connecting..." : "Connect to cTrader"}
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
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>cTrader Connect app registration</li>
            <li>Valid Client ID and Client Secret</li>
            <li>OAuth2 redirect URI configuration</li>
            <li>Active cTrader account (demo or live)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}