import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings, Bell, Shield, User, DollarSign, Link as LinkIcon, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { BrokerConnection } from "@/types/broker";

const SettingsPage = () => {
  const { toast } = useToast();
  
  const [brokerConnection, setBrokerConnection] = useLocalStorage<BrokerConnection | null>('broker-connection', null);
  
  const [brokerConfigs, setBrokerConfigs] = useLocalStorage('broker-configs', {
    cplugin: {
      clientId: '',
      clientSecret: '',
      serverUrl: 'https://admin.cplugin.net', // CPlugin server
      environment: 'demo' // demo or live
    },
    oanda: {
      apiKey: '',
      accountId: '',
      environment: 'practice', // practice or live
      server: 'https://api-fxpractice.oanda.com'
    },
    mt4: {
      serverAddress: '',
      login: '',
      password: '',
      account: ''
    },
    mt5: {
      serverAddress: '',
      login: '',
      password: '',
      account: ''
    },
    alpaca: {
      apiKey: '',
      secretKey: '',
      baseUrl: 'https://paper-api.alpaca.markets' // paper or live
    }
  });

  const [selectedBroker, setSelectedBroker] = useState<'cplugin' | 'oanda' | 'mt4' | 'mt5' | 'alpaca'>('cplugin');
  const [testingConnection, setTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    
    try {
      const config = brokerConfigs[selectedBroker];
      
      // Handle different broker types
      if (selectedBroker === 'cplugin') {
        const cpluginConfig = config as any;
        
        // Store the broker config for useBrokerAPI
        const brokerConfig = {
          apiKey: cpluginConfig.clientId || '',
          apiSecret: cpluginConfig.clientSecret || '',
          baseUrl: cpluginConfig.serverUrl || 'https://admin.cplugin.net',
          broker: 'mt5' as const
        };
        
        // Save to localStorage for useBrokerAPI hook
        localStorage.setItem('broker_config', JSON.stringify(brokerConfig));
        
        // Test the connection
        const testResponse = await fetch(`${brokerConfig.baseUrl}/api/test`, {
          headers: {
            'Authorization': `Bearer ${brokerConfig.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!testResponse.ok) {
          throw new Error('Failed to connect to CPlugin WebAPI. Please check your credentials.');
        }
      } else if (selectedBroker === 'mt5') {
        const mt5Config = config as any;
        const apiUrl = mt5Config.serverAddress || 'http://localhost:6542';
        
        // Test the MT5 REST API
        const response = await fetch(`${apiUrl}/info`);
        if (!response.ok) {
          throw new Error('Failed to connect to MT5 REST API. Make sure RestApi EA is running.');
        }
        
        // Store the broker config for useBrokerAPI
        const brokerConfig = {
          apiKey: mt5Config.login || '',
          apiSecret: mt5Config.password || '',
          baseUrl: apiUrl,
          broker: 'mt5' as const
        };
        
        // Save to localStorage for useBrokerAPI hook
        localStorage.setItem('broker_config', JSON.stringify(brokerConfig));
      }
      
      const connectionId = `${selectedBroker}_${Date.now()}`;
      
      // Type-safe way to get account and server info
      let account = 'demo';
      let server = '';
      
      if (selectedBroker === 'cplugin') {
        const cpluginConfig = config as any;
        account = 'cplugin-mt5';
        server = cpluginConfig.serverUrl || 'https://admin.cplugin.net';
      } else if (selectedBroker === 'oanda') {
        const oandaConfig = config as any;
        account = oandaConfig.accountId || 'demo';
        server = oandaConfig.server;
      } else if (selectedBroker === 'mt4' || selectedBroker === 'mt5') {
        const mtConfig = config as any;
        account = mtConfig.account || mtConfig.login || 'demo';
        server = mtConfig.serverAddress;
      } else if (selectedBroker === 'alpaca') {
        const alpacaConfig = config as any;
        account = 'alpaca-account';
        server = alpacaConfig.baseUrl;
      }
      
      const newConnection: BrokerConnection = {
        id: connectionId,
        name: selectedBroker.toUpperCase(),
        type: selectedBroker,
        status: 'connected',
        account,
        server
      };
      
      setBrokerConnection(newConnection);
      
      toast({
        title: "🎉 Connection Successful!",
        description: `Ready for live trading with ${selectedBroker.toUpperCase()}!`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDisconnectBroker = () => {
    setBrokerConnection(null);
    toast({
      title: "Broker Disconnected",
      description: "Trading connection has been removed.",
    });
  };

  const updateBrokerConfig = (broker: string, field: string, value: string) => {
    setBrokerConfigs(prev => ({
      ...prev,
      [broker]: {
        ...(prev[broker] || {}),
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
          </div>
        </div>

        <Tabs defaultValue="broker" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="broker">🔗 Live Trading</TabsTrigger>
            <TabsTrigger value="notifications">🔔 Notifications</TabsTrigger>
            <TabsTrigger value="security">🛡️ Security</TabsTrigger>
            <TabsTrigger value="account">👤 Account</TabsTrigger>
          </TabsList>
          
          {/* Broker Setup Tab */}
          <TabsContent value="broker" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Live Trading Connection
                </CardTitle>
                {brokerConnection && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Connected to {brokerConnection.name}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDisconnectBroker}
                    >
                      Disconnect
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {!brokerConnection && (
                  <>
                    <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      <p className="text-sm">Choose your broker and enter credentials to enable live trading</p>
                    </div>
                    
                    <div className="space-y-4">
                      <Label>Select Broker</Label>
                      <Select value={selectedBroker} onValueChange={(value: any) => setSelectedBroker(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cplugin">CPlugin WebAPI (Recommended)</SelectItem>
                          <SelectItem value="oanda">OANDA</SelectItem>
                          <SelectItem value="mt4">MetaTrader 4</SelectItem>
                          <SelectItem value="mt5">MetaTrader 5</SelectItem>
                          <SelectItem value="alpaca">Alpaca Markets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* CPlugin WebAPI Configuration */}
                    {selectedBroker === 'cplugin' && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold flex items-center gap-2">
                          🚀 CPlugin WebAPI Configuration (Professional MT5)
                        </h3>
                        <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg mb-4">
                          <p className="text-sm text-green-800 dark:text-green-200">
                            ✅ <strong>Professional Solution:</strong> Enterprise-grade MT5 REST API & WebSocket support.
                            <br />
                            🔗 Use your credentials from: https://admin.cplugin.net
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Client ID *</Label>
                            <Input
                              value={brokerConfigs.cplugin?.clientId || ''}
                              onChange={(e) => updateBrokerConfig('cplugin', 'clientId', e.target.value)}
                              placeholder="4b0fd032-2f35-4360-8e2b-08b7d011158a"
                            />
                            <p className="text-xs text-muted-foreground">From your CPlugin dashboard</p>
                          </div>
                          <div>
                            <Label>Client Secret *</Label>
                            <Input
                              type="password"
                              value={brokerConfigs.cplugin?.clientSecret || ''}
                              onChange={(e) => updateBrokerConfig('cplugin', 'clientSecret', e.target.value)}
                              placeholder="d1626da8-a689-4d4b-9fd9-7b862ebbb265"
                            />
                            <p className="text-xs text-muted-foreground">From your CPlugin dashboard</p>
                          </div>
                          <div>
                            <Label>Server URL</Label>
                            <Input
                              value={brokerConfigs.cplugin?.serverUrl || 'https://admin.cplugin.net'}
                              onChange={(e) => updateBrokerConfig('cplugin', 'serverUrl', e.target.value)}
                              placeholder="https://admin.cplugin.net"
                            />
                            <p className="text-xs text-muted-foreground">CPlugin API server</p>
                          </div>
                          <div>
                            <Label>Environment</Label>
                            <Select 
                              value={brokerConfigs.cplugin?.environment || 'demo'} 
                              onValueChange={(value) => updateBrokerConfig('cplugin', 'environment', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="demo">📊 Demo Account</SelectItem>
                                <SelectItem value="live">💰 Live Trading</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            💡 <strong>Ready to use:</strong> Enter your credentials above and test the connection.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* OANDA Configuration */}
                    {selectedBroker === 'oanda' && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold flex items-center gap-2">
                          🏆 OANDA Configuration (Best for Forex)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>API Key *</Label>
                            <Input
                              type="password"
                              value={brokerConfigs.oanda.apiKey}
                              onChange={(e) => updateBrokerConfig('oanda', 'apiKey', e.target.value)}
                              placeholder="Your OANDA API key"
                            />
                            <p className="text-xs text-muted-foreground">Get from OANDA developer portal</p>
                          </div>
                          <div>
                            <Label>Account ID *</Label>
                            <Input
                              value={brokerConfigs.oanda.accountId}
                              onChange={(e) => updateBrokerConfig('oanda', 'accountId', e.target.value)}
                              placeholder="101-001-123456-001"
                            />
                          </div>
                          <div>
                            <Label>Environment</Label>
                            <Select 
                              value={brokerConfigs.oanda.environment} 
                              onValueChange={(value) => updateBrokerConfig('oanda', 'environment', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="practice">📊 Practice (Demo)</SelectItem>
                                <SelectItem value="live">💰 Live Trading</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MetaTrader 4 Configuration */}
                    {selectedBroker === 'mt4' && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold flex items-center gap-2">
                          💹 MetaTrader 4 Configuration
                        </h3>
                        <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg mb-4">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ <strong>Bridge Required:</strong> You need to install an MT4 Bridge Server first.
                            <br />
                            📖 <a href="/MT4_BRIDGE_SETUP.md" target="_blank" className="underline">Read the setup guide</a>
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Bridge Server URL *</Label>
                            <Input
                              value={brokerConfigs.mt4.serverAddress || 'http://localhost:8080'}
                              onChange={(e) => updateBrokerConfig('mt4', 'serverAddress', e.target.value)}
                              placeholder="http://localhost:8080"
                            />
                            <p className="text-xs text-muted-foreground">Default: http://localhost:8080</p>
                          </div>
                          <div>
                            <Label>MT4 Account Number *</Label>
                            <Input
                              value={brokerConfigs.mt4.account}
                              onChange={(e) => updateBrokerConfig('mt4', 'account', e.target.value)}
                              placeholder="Your account number"
                            />
                            <p className="text-xs text-muted-foreground">From your MT4 terminal</p>
                          </div>
                          <div>
                            <Label>MT4 Server *</Label>
                            <Input
                              value={brokerConfigs.mt4.login || 'MetaQuotes-Demo'}
                              onChange={(e) => updateBrokerConfig('mt4', 'login', e.target.value)}
                              placeholder="MetaQuotes-Demo"
                            />
                            <p className="text-xs text-muted-foreground">Your MT4 server name</p>
                          </div>
                          <div>
                            <Label>Password (Optional)</Label>
                            <Input
                              type="password"
                              value={brokerConfigs.mt4.password}
                              onChange={(e) => updateBrokerConfig('mt4', 'password', e.target.value)}
                              placeholder="Bridge authentication"
                            />
                            <p className="text-xs text-muted-foreground">Only if bridge requires auth</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MetaTrader 5 Configuration */}
                    {selectedBroker === 'mt5' && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold flex items-center gap-2">
                          🚀 MetaTrader 5 REST API Configuration
                        </h3>
                        <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg mb-4">
                          <p className="text-sm text-green-800 dark:text-green-200">
                            ✅ <strong>RestApi EA Detected:</strong> Using direct REST API connection to MT5.
                            <br />
                            🔗 Default endpoint: http://localhost:6542
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>REST API URL *</Label>
                            <Input
                              value={brokerConfigs.mt5.serverAddress || 'http://localhost:6542'}
                              onChange={(e) => updateBrokerConfig('mt5', 'serverAddress', e.target.value)}
                              placeholder="http://localhost:6542"
                            />
                            <p className="text-xs text-muted-foreground">Your MT5 RestApi EA endpoint</p>
                          </div>
                          <div>
                            <Label>API Key (Optional)</Label>
                            <Input
                              value={brokerConfigs.mt5.login}
                              onChange={(e) => updateBrokerConfig('mt5', 'login', e.target.value)}
                              placeholder="API key if required"
                            />
                            <p className="text-xs text-muted-foreground">Only if RestApi EA requires authentication</p>
                          </div>
                          <div>
                            <Label>API Secret (Optional)</Label>
                            <Input
                              type="password"
                              value={brokerConfigs.mt5.password}
                              onChange={(e) => updateBrokerConfig('mt5', 'password', e.target.value)}
                              placeholder="API secret if required"
                            />
                            <p className="text-xs text-muted-foreground">Only if RestApi EA requires authentication</p>
                          </div>
                          <div>
                            <Label>Account Number</Label>
                            <Input
                              value={brokerConfigs.mt5.account}
                              onChange={(e) => updateBrokerConfig('mt5', 'account', e.target.value)}
                              placeholder="MT5 account number"
                            />
                            <p className="text-xs text-muted-foreground">Your MT5 account number</p>
                          </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            💡 <strong>Quick Test:</strong> Open <a href="http://localhost:6542" target="_blank" className="underline">http://localhost:6542</a> to verify RestApi EA is running.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Alpaca Configuration */}
                    {selectedBroker === 'alpaca' && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold">Alpaca Markets Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>API Key *</Label>
                            <Input
                              value={brokerConfigs.alpaca.apiKey}
                              onChange={(e) => updateBrokerConfig('alpaca', 'apiKey', e.target.value)}
                              placeholder="PKXXXXXXXXXXXXXXXX"
                            />
                          </div>
                          <div>
                            <Label>Secret Key *</Label>
                            <Input
                              type="password"
                              value={brokerConfigs.alpaca.secretKey}
                              onChange={(e) => updateBrokerConfig('alpaca', 'secretKey', e.target.value)}
                              placeholder="Your secret key"
                            />
                          </div>
                          <div>
                            <Label>Environment</Label>
                            <Select 
                              value={brokerConfigs.alpaca.baseUrl.includes('paper') ? 'paper' : 'live'} 
                              onValueChange={(value) => updateBrokerConfig('alpaca', 'baseUrl', 
                                value === 'paper' ? 'https://paper-api.alpaca.markets' : 'https://api.alpaca.markets'
                              )}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="paper">📊 Paper Trading</SelectItem>
                                <SelectItem value="live">💰 Live Trading</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button 
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {testingConnection ? "🔄 Testing Connection..." : "🚀 Test & Connect"}
                      </Button>
                    </div>
                  </>
                )}

                {brokerConnection && (
                  <div className="space-y-4 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <h3 className="font-bold text-green-800 dark:text-green-200 text-lg">
                        🎉 Connected to {brokerConnection.name}!
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Account:</span> {brokerConnection.account}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> 
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                          {brokerConnection.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Server:</span> {brokerConnection.server?.split('//')[1] || 'Live'}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {brokerConnection.type.toUpperCase()}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                        ✅ Ready for Live Trading Operations!
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Your broker is connected and ready. Go to Wing Zero dashboard to start the optimized trading engine.
                      </p>
                      <Link to="/wingzero">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          🚀 Go to Wing Zero Dashboard
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs placeholder */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Notification settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Security settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Account settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
