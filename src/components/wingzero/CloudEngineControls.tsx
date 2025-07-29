import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Cloud, CloudOff, Zap, Clock, Upload, CheckCircle } from "lucide-react";
import { useCloudEngine } from "@/hooks/useCloudEngine";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useEffect } from "react";

export const CloudEngineControls = () => {
  const { 
    status, 
    isLoading, 
    startCloudEngine, 
    stopCloudEngine, 
    syncConfigToCloud, 
    syncCredentialsToCloud 
  } = useCloudEngine();
  
  const [strategyConfig] = useLocalStorage('wingzero-strategy', {});

  // Auto-sync config when it changes
  useEffect(() => {
    if (strategyConfig && Object.keys(strategyConfig).length > 0) {
      syncConfigToCloud(strategyConfig);
    }
  }, [strategyConfig, syncConfigToCloud]);

  // Auto-sync credentials on mount
  useEffect(() => {
    syncCredentialsToCloud();
  }, [syncCredentialsToCloud]);

  const handleSyncAll = async () => {
    await syncConfigToCloud(strategyConfig);
    await syncCredentialsToCloud();
  };

  const getStatusColor = () => {
    if (status.isRunning) return 'text-green-600';
    return 'text-gray-600';
  };

  const getStatusIcon = () => {
    if (status.isRunning) return <Cloud className="h-5 w-5 text-green-600" />;
    return <CloudOff className="h-5 w-5 text-gray-600" />;
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="border-2 border-blue-500/20 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-6 w-6 text-blue-600" />
          Wing Zero Cloud Engine
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            24/7 Autonomous
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50/50">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            Cloud Engine runs Wing Zero 24/7 in the cloud - no computer required!
          </AlertDescription>
        </Alert>

        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <div>
              <div className="text-sm font-medium">Engine Status</div>
              <div className={`text-xs ${getStatusColor()}`}>
                {status.isRunning ? '🟢 Running in Cloud' : '⚫ Stopped'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-sm font-medium">Last Activity</div>
              <div className="text-xs text-gray-600">
                {formatTimestamp(status.lastCycle || status.lastHeartbeat)}
              </div>
            </div>
          </div>
        </div>

        {/* Engine Mode Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Mode:</span>
          <Badge variant={status.engineMode === 'cloud_active' ? 'default' : 'secondary'}>
            {status.engineMode === 'cloud_active' ? '☁️ Cloud Active' : 
             status.engineMode === 'cloud' ? '☁️ Cloud Idle' : 
             '💻 Local Mode'}
          </Badge>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={startCloudEngine}
            disabled={isLoading || status.isRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Cloud className="h-4 w-4 mr-2" />
            {status.isRunning ? 'Running' : 'Start Cloud'}
          </Button>

          <Button
            onClick={stopCloudEngine}
            disabled={isLoading || !status.isRunning}
            variant="outline"
            className="border-red-500/20 hover:border-red-500/40 hover:bg-red-50"
          >
            <CloudOff className="h-4 w-4 mr-2" />
            Stop Cloud
          </Button>
        </div>

        {/* Sync Button */}
        <Button
          onClick={handleSyncAll}
          variant="outline"
          className="w-full border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-50"
        >
          <Upload className="h-4 w-4 mr-2" />
          Sync Config to Cloud
        </Button>

        {/* Cloud Features */}
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>24/7 autonomous trading</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>No computer required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Real-time OANDA integration</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>AI Trading Brain active</span>
          </div>
        </div>

        {status.isRunning && (
          <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm font-medium text-green-800">
              🚀 Wing Zero is trading autonomously in the cloud!
            </div>
            <div className="text-xs text-green-600 mt-1">
              You can close this browser and trading will continue 24/7
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};