import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useWingZeroAPI } from "@/hooks/useWingZeroAPI";
import { useBrokerAPI } from "@/hooks/useBrokerAPI";
import { MT5Setup } from "./MT5Setup";

export const ConnectionStatus = () => {
  const { isConnected: wingZeroConnected, testConnection: testWingZero, useMockData } = useWingZeroAPI();
  const { brokerConnection, testConnection: testBroker, isConfigured, error } = useBrokerAPI();

  const handleTestAll = async () => {
    await Promise.all([
      testWingZero(),
      testBroker()
    ]);
  };

  const handleConfigUpdate = (config: any) => {
    console.log('MT5 configuration updated:', config);
    // Configuration is handled by MT5Setup component internally
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Connection Status
            <Button variant="outline" size="sm" onClick={handleTestAll}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Test Connection
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wing Zero API Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {wingZeroConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">Wing Zero API</span>
              {useMockData && (
                <Badge variant="secondary">Demo Mode</Badge>
              )}
            </div>
            <Badge variant={wingZeroConnected ? "default" : "destructive"}>
              {wingZeroConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          {/* MT5 Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {isConfigured && !error ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-medium">MT5 Terminal</span>
              <Badge variant={isConfigured && !error ? "default" : "secondary"}>
                {isConfigured && !error ? "Connected" : "Setup Required"}
              </Badge>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* MT5 Setup Component */}
      <MT5Setup onConfigUpdate={handleConfigUpdate} />
    </div>
  );
};