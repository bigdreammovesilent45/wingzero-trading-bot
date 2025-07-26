import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Smartphone, Monitor } from "lucide-react";

interface MT5SetupProps {
  onConfigUpdate: (config: any) => void;
}

export function MT5Setup({ onConfigUpdate }: MT5SetupProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [setupMode, setSetupMode] = useState<'desktop' | 'mobile'>('desktop');
  
  const [desktopConfig, setDesktopConfig] = useState({
    serverUrl: 'http://localhost:6542',
    login: '',
    password: '',
    server: ''
  });

  const [mobileConfig, setMobileConfig] = useState({
    bridgeUrl: 'http://localhost:8080',
    deviceId: '',
    apiKey: ''
  });

  const handleDesktopConnect = async () => {
    setIsConnecting(true);
    try {
      // Test connection to MT5 RestAPI EA
      const response = await fetch(`${desktopConfig.serverUrl}/info`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setConnectionStatus('connected');
        onConfigUpdate({ type: 'desktop', ...desktopConfig });
        toast({
          title: "MT5 Desktop Connected",
          description: "Successfully connected to MT5 RestAPI EA",
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: "Make sure MT5 RestAPI EA is running on your desktop",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleMobileConnect = async () => {
    setIsConnecting(true);
    try {
      // Test connection to mobile bridge
      const response = await fetch(`${mobileConfig.bridgeUrl}/status`, {
        method: 'GET'
      });

      if (response.ok) {
        setConnectionStatus('connected');
        onConfigUpdate({ type: 'mobile', ...mobileConfig });
        toast({
          title: "MT5 Mobile Bridge Connected",
          description: "Successfully connected to mobile trading bridge",
        });
      } else {
        throw new Error('Bridge connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Bridge Connection Failed",
        description: "Make sure the mobile bridge server is running",
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
          MT5 Trading Setup
          {connectionStatus === 'connected' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {connectionStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
        </CardTitle>
        <CardDescription>
          Connect Wing Zero to your MT5 platform for automated trading
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Monitor className="h-4 w-4" />
            <Label htmlFor="setup-mode">Desktop MT5</Label>
          </div>
          <Switch
            id="setup-mode"
            checked={setupMode === 'mobile'}
            onCheckedChange={(checked) => setSetupMode(checked ? 'mobile' : 'desktop')}
          />
          <div className="flex items-center space-x-2">
            <Label htmlFor="setup-mode">Mobile MT5</Label>
            <Smartphone className="h-4 w-4" />
          </div>
        </div>

        <Tabs value={setupMode} onValueChange={(value) => setSetupMode(value as 'desktop' | 'mobile')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Desktop MT5
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile MT5
            </TabsTrigger>
          </TabsList>

          <TabsContent value="desktop" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure you have installed the RestAPI EA in your MT5 desktop terminal and it's running.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="server-url">RestAPI EA URL</Label>
                <Input
                  id="server-url"
                  value={desktopConfig.serverUrl}
                  onChange={(e) => setDesktopConfig(prev => ({ ...prev, serverUrl: e.target.value }))}
                  placeholder="http://localhost:6542"
                />
              </div>
              <div>
                <Label htmlFor="login">MT5 Login</Label>
                <Input
                  id="login"
                  value={desktopConfig.login}
                  onChange={(e) => setDesktopConfig(prev => ({ ...prev, login: e.target.value }))}
                  placeholder="Your MT5 account number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={desktopConfig.password}
                  onChange={(e) => setDesktopConfig(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Your MT5 password"
                />
              </div>
              <div>
                <Label htmlFor="server">Server</Label>
                <Input
                  id="server"
                  value={desktopConfig.server}
                  onChange={(e) => setDesktopConfig(prev => ({ ...prev, server: e.target.value }))}
                  placeholder="Your broker's server name"
                />
              </div>
            </div>

            <Button 
              onClick={handleDesktopConnect} 
              disabled={isConnecting || !desktopConfig.login}
              className="w-full"
            >
              {isConnecting ? "Connecting..." : "Connect to Desktop MT5"}
            </Button>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This connects Wing Zero to your mobile MT5 app via a bridge server. Perfect for trading on the go!
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="bridge-url">Mobile Bridge URL</Label>
                <Input
                  id="bridge-url"
                  value={mobileConfig.bridgeUrl}
                  onChange={(e) => setMobileConfig(prev => ({ ...prev, bridgeUrl: e.target.value }))}
                  placeholder="http://localhost:8080"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL of the bridge server running on your device
                </p>
              </div>

              <div>
                <Label htmlFor="device-id">Device ID (Optional)</Label>
                <Input
                  id="device-id"
                  value={mobileConfig.deviceId}
                  onChange={(e) => setMobileConfig(prev => ({ ...prev, deviceId: e.target.value }))}
                  placeholder="Unique identifier for your device"
                />
              </div>

              <div>
                <Label htmlFor="api-key">API Key (Optional)</Label>
                <Input
                  id="api-key"
                  value={mobileConfig.apiKey}
                  onChange={(e) => setMobileConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Security key for bridge authentication"
                />
              </div>
            </div>

            <Button 
              onClick={handleMobileConnect} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? "Connecting..." : "Connect to Mobile MT5"}
            </Button>
          </TabsContent>
        </Tabs>

        {connectionStatus !== 'disconnected' && (
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                {connectionStatus === 'connected' ? 'Connected' : 'Error'}
              </Badge>
              <span className="text-sm">
                {setupMode === 'desktop' ? 'Desktop MT5' : 'Mobile MT5'} Status
              </span>
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
          <p><strong>Desktop Mode:</strong> Requires RestAPI EA installed in MT5 terminal</p>
          <p><strong>Mobile Mode:</strong> Requires bridge app running on mobile device</p>
          <p>Both modes support real-time trading and position synchronization</p>
        </div>
      </CardContent>
    </Card>
  );
}