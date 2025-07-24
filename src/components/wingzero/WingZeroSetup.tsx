import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Settings, Zap } from 'lucide-react';
import { useWingZeroAPI } from '@/hooks/useWingZeroAPI';
import { WingZeroConfig } from '@/types/wingzero';

export const WingZeroSetup = () => {
  const { 
    isLoading, 
    isConnected, 
    isConfigured, 
    useMockData, 
    config,
    updateConfig, 
    clearConfig, 
    testConnection,
    setUseMockData 
  } = useWingZeroAPI();

  const [formData, setFormData] = useState<WingZeroConfig>({
    apiKey: config?.apiKey || '',
    apiSecret: config?.apiSecret || '',
    baseUrl: config?.baseUrl || 'https://api.wingzero.dev',
    clientId: config?.clientId || '',
    environment: config?.environment || 'sandbox',
    wsEndpoint: config?.wsEndpoint || '',
  });

  const handleInputChange = (field: keyof WingZeroConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConfig = () => {
    updateConfig(formData);
  };

  const handleTestConnection = async () => {
    await testConnection();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Wing Zero API Configuration
        </CardTitle>
        {isConfigured && (
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
              {isConnected ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            {useMockData && (
              <Badge variant="outline">Mock Mode</Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mock Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-blue-600" />
            <Label htmlFor="mock-mode">Development Mode (Mock Data)</Label>
          </div>
          <Switch
            id="mock-mode"
            checked={useMockData}
            onCheckedChange={setUseMockData}
          />
        </div>

        {!useMockData && (
          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Production Mode
              </p>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You're configuring a live connection to Wing Zero API. Make sure your backend server is running and accessible.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>API Key *</Label>
            <Input
              type="password"
              value={formData.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              placeholder="Enter your Wing Zero API key"
              disabled={useMockData}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {useMockData ? 'Not required in mock mode' : 'From your Wing Zero dashboard'}
            </p>
          </div>

          <div>
            <Label>API Secret *</Label>
            <Input
              type="password"
              value={formData.apiSecret}
              onChange={(e) => handleInputChange('apiSecret', e.target.value)}
              placeholder="Enter your Wing Zero API secret"
              disabled={useMockData}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {useMockData ? 'Not required in mock mode' : 'Keep this secure!'}
            </p>
          </div>

          <div>
            <Label>Client ID *</Label>
            <Input
              value={formData.clientId}
              onChange={(e) => handleInputChange('clientId', e.target.value)}
              placeholder="4b0fd032-2f35-4360-8e2b-08b7d011158a"
              disabled={useMockData}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {useMockData ? 'Using mock client ID' : 'Your unique client identifier'}
            </p>
          </div>

          <div>
            <Label>Environment</Label>
            <Select 
              value={formData.environment} 
              onValueChange={(value: 'sandbox' | 'production') => handleInputChange('environment', value)}
              disabled={useMockData}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">🧪 Sandbox (Testing)</SelectItem>
                <SelectItem value="production">🚀 Production (Live)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Base URL</Label>
            <Input
              value={formData.baseUrl}
              onChange={(e) => handleInputChange('baseUrl', e.target.value)}
              placeholder="https://api.wingzero.dev"
              disabled={useMockData}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {useMockData ? 'Using mock endpoint' : 'Your Wing Zero API server URL'}
            </p>
          </div>

          <div className="md:col-span-2">
            <Label>WebSocket Endpoint (Optional)</Label>
            <Input
              value={formData.wsEndpoint}
              onChange={(e) => handleInputChange('wsEndpoint', e.target.value)}
              placeholder="wss://api.wingzero.dev/ws"
              disabled={useMockData}
            />
            <p className="text-xs text-muted-foreground mt-1">
              For real-time data. Leave empty to auto-generate from base URL.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSaveConfig}
            disabled={isLoading}
            className="flex-1"
          >
            {useMockData ? 'Enable Mock Mode' : 'Save Configuration'}
          </Button>
          
          {isConfigured && (
            <>
              <Button 
                onClick={handleTestConnection}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Testing...' : 'Test Connection'}
              </Button>
              
              <Button 
                onClick={clearConfig}
                variant="destructive"
                size="sm"
              >
                Clear
              </Button>
            </>
          )}
        </div>

        {/* Backend Setup Instructions */}
        {!useMockData && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="font-semibold mb-2">Wing Zero Backend Setup</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Your Wing Zero API should implement these endpoints:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><code>GET /api/v1/ping</code> - Health check</li>
                <li><code>GET /api/v1/account</code> - Account information</li>
                <li><code>GET /api/v1/positions</code> - Open positions</li>
                <li><code>GET /api/v1/orders</code> - Pending orders</li>
                <li><code>POST /api/v1/orders</code> - Place new order</li>
                <li><code>GET /api/v1/symbols</code> - Available symbols</li>
                <li><code>WS /ws</code> - Real-time data stream</li>
              </ul>
              <p className="text-xs">
                <strong>Authentication:</strong> Use HMAC-SHA256 signatures with your API key/secret.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};