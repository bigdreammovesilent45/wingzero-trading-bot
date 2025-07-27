import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useWingZeroAPI } from "@/hooks/useWingZeroAPI";
import { useBrokerAPI } from "@/hooks/useBrokerAPI";

export const ConnectionStatus = () => {
  const { isConnected: wingZeroConnected, testConnection: testWingZero, useMockData } = useWingZeroAPI();
  const { brokerConnection, testConnection: testBroker } = useBrokerAPI();

  const handleTestAll = async () => {
    await Promise.all([
      testWingZero(),
      testBroker()
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Connection Status
          <Button variant="outline" size="sm" onClick={handleTestAll}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Test All
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

        {/* MT5 Bridge Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium">MT5 Bridge</span>
            <Badge variant="secondary">Demo Mode</Badge>
          </div>
          <Badge variant="default">
            Ready
          </Badge>
        </div>


        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Demo Mode Active:</strong> Wing Zero is running with simulated $50,000 balance. 
            Perfect for testing strategies safely! To connect real MT5:
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Install RestAPI EA in MT5 desktop</li>
              <li>Start MT5 with EA enabled</li>
              <li>Configure Wing Zero API credentials</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};