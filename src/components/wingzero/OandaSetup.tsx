import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, TrendingUp, Info, ExternalLink } from "lucide-react";

interface OandaSetupProps {
  onConfigUpdate: (config: any) => void;
}

export function OandaSetup({ onConfigUpdate }: OandaSetupProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  
  const [config, setConfig] = useState({
    apiKey: '',
    accountId: '',
    environment: 'practice',
    server: 'https://api-fxpractice.oanda.com'
  });

  const handleEnvironmentChange = (environment: string) => {
    const server = environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com'
      : 'https://api-fxtrade.oanda.com';
    
    setConfig(prev => ({ ...prev, environment, server }));
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      if (!config.apiKey || !config.accountId) {
        throw new Error('Missing API Key or Account ID');
      }

      // Test OANDA connection
      const response = await fetch(`${config.server}/v3/accounts/${config.accountId}`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setConnectionStatus('connected');
        
        // Store config for useBrokerAPI hook
        const brokerConfig = {
          apiKey: config.apiKey,
          apiSecret: config.accountId, // Using accountId as secret for OANDA
          baseUrl: config.server,
          broker: 'oanda' as const
        };
        localStorage.setItem('broker_config', JSON.stringify(brokerConfig));
        
        onConfigUpdate({ 
          type: 'oanda', 
          ...config,
          platform: 'oanda'
        });
        
        toast({
          title: "OANDA Connected",
          description: `Successfully connected to OANDA ${config.environment} environment`,
        });
      } else {
        throw new Error(`OANDA API error: ${response.status}`);
      }
    } catch (error: any) {
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: error.message || "Please check your OANDA API credentials",
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
          OANDA Setup
          {connectionStatus === 'connected' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {connectionStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
        </CardTitle>
        <CardDescription>
          Connect Wing Zero to OANDA for automated forex trading
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>OANDA API Setup</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Get your API credentials from the OANDA developer portal:</p>
            <a 
              href="https://www.oanda.com/account/tpa/personal_token" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline flex items-center gap-1"
            >
              OANDA API Token Management <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="environment">Environment</Label>
            <Select value={config.environment} onValueChange={handleEnvironmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="practice">Practice (Demo Trading)</SelectItem>
                <SelectItem value="live">Live Trading</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Start with practice environment for testing
            </p>
          </div>

          <div>
            <Label htmlFor="api-key">API Token</Label>
            <Input
              id="api-key"
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Your OANDA API token"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Generate from OANDA account → Manage API Access
            </p>
          </div>

          <div>
            <Label htmlFor="account-id">Account ID</Label>
            <Input
              id="account-id"
              value={config.accountId}
              onChange={(e) => setConfig(prev => ({ ...prev, accountId: e.target.value }))}
              placeholder="101-001-123456-001"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Found in your OANDA account dashboard
            </p>
          </div>

          <div>
            <Label htmlFor="server">Server URL</Label>
            <Input
              id="server"
              value={config.server}
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Automatically set based on environment
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            OANDA Features:
          </h4>
          <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
            <li>• Comprehensive Forex and CFD trading</li>
            <li>• REST API for automated trading</li>
            <li>• Real-time pricing and market data</li>
            <li>• Advanced risk management tools</li>
            <li>• Practice and live trading environments</li>
            <li>• Regulatory compliance (FCA, CFTC)</li>
          </ul>
        </div>

        <Button 
          onClick={handleConnect} 
          disabled={isConnecting || !config.apiKey || !config.accountId}
          className="w-full"
        >
          {isConnecting ? "Connecting..." : "Connect to OANDA"}
        </Button>

        {connectionStatus !== 'disconnected' && (
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                {connectionStatus === 'connected' ? 'Connected' : 'Error'}
              </Badge>
              <span className="text-sm">OANDA {config.environment} Status</span>
            </div>
            
            {connectionStatus === 'connected' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConnectionStatus('disconnected');
                  onConfigUpdate(null);
                  localStorage.removeItem('broker_config');
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
            <li>Active OANDA account (fxTrade or fxTrade Practice)</li>
            <li>Generated API token with trading permissions</li>
            <li>Account ID from your OANDA dashboard</li>
            <li>Sufficient account balance for trading</li>
            <li>Understanding of OANDA's API rate limits</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}