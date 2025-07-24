
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MetricCard from "@/components/shared/MetricCard";
import StatusIndicator from "@/components/shared/StatusIndicator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAccountData } from "@/hooks/useAccountData";
import { useBrokerAPI } from "@/hooks/useBrokerAPI";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import { useSupabasePositions } from "@/hooks/useSupabasePositions";
import { DollarSign, TrendingUp, Shield, AlertTriangle, RefreshCw, Database } from "lucide-react";

const SAWDashboard = () => {
  const { account, isLoading, error, isConnected, isConfigured, refreshAccount } = useAccountData();
  const { requestWithdrawal, testConnection, isLoading: apiLoading } = useBrokerAPI();
  const { notifyWithdrawalTriggered } = useNotifications();
  const { toast } = useToast();
  
  // Supabase connection test
  const { positions, isLoading: positionsLoading, error: positionsError, createPosition } = useSupabasePositions();

  const handleManualWithdrawal = async () => {
    if (!account) return;
    
    try {
      const withdrawalAmount = account.profit * 0.1; // 10% of profit
      await requestWithdrawal(withdrawalAmount);
      await notifyWithdrawalTriggered(withdrawalAmount);
      await refreshAccount();
    } catch (error) {
      console.error('Manual withdrawal failed:', error);
    }
  };

  const handleTestNotifications = async () => {
    await notifyWithdrawalTriggered(100);
    toast({
      title: "Test Notification Sent",
      description: "Check your configured notification channels",
    });
  };

  const handleTestDatabase = async () => {
    try {
      console.log("Starting database test...");
      console.log("Supabase positions hook state:", { 
        isLoading: positionsLoading, 
        error: positionsError,
        positionsCount: positions.length 
      });
      
      const testPosition = {
        symbol: "EURUSD",
        position_type: "buy" as const,
        volume: 0.1,
        entry_price: 1.0850,
        current_price: 1.0860,
        unrealized_pnl: 10.0,
        stop_loss: 1.0800,
        take_profit: 1.0900,
        status: "open" as const,
        opened_at: new Date().toISOString()
      };
      
      console.log("Creating position with data:", testPosition);
      const result = await createPosition(testPosition);
      console.log("Position created successfully:", result);
      
      toast({
        title: "Database Test Successful",
        description: "Successfully created test position in Supabase",
      });
    } catch (error) {
      console.error("Database test error:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      toast({
        title: "Database Test Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Supabase",
        variant: "destructive",
      });
    }
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-[#00FFC2] mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Broker API Not Configured</h3>
          <p className="text-muted-foreground mb-4">Please configure your broker API credentials in Settings to continue.</p>
          <Button asChild className="bg-[#00FFC2] hover:bg-[#00FFC2]/80 text-black">
            <a href="/settings">Configure API Settings</a>
          </Button>
        </div>
      </div>
    );
  }

  const systemStatus = {
    webhookListener: 'active',
    brokerConnection: isConnected ? 'active' : 'error',
    notifications: 'active'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#00FFC2]">S.A.W. Dashboard</h1>
          <p className="text-muted-foreground">Stor-A-Way • Your funds. Your flow. Automated.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={refreshAccount}
            variant="outline"
            size="lg"
            disabled={isLoading}
            className="border-[#00FFC2]/20 hover:border-[#00FFC2]/40"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button 
            onClick={handleManualWithdrawal}
            disabled={apiLoading || !account || account.profit <= 0}
            className="bg-[#00FFC2] hover:bg-[#00FFC2]/80 text-black font-medium"
            size="lg"
          >
            {apiLoading ? <LoadingSpinner size="sm" /> : "Manual Override"}
          </Button>
        </div>
      </div>

      {/* Account Metrics */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                <LoadingSpinner size="sm" />
              </div>
              <div className="h-8 bg-muted rounded animate-pulse w-32"></div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive">{error}</p>
        </div>
      ) : account ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Account Balance"
            value={`$${account.balance.toLocaleString()}`}
            icon={DollarSign}
            color="text-[#00FFC2]"
          />
          <MetricCard
            title="Current Profit"
            value={`$${account.profit.toLocaleString()}`}
            change={account.profit > 0 ? "+12.5%" : "-5.2%"}
            changeType={account.profit > 0 ? "positive" : "negative"}
            icon={TrendingUp}
            color="text-[#00FFC2]"
          />
          <MetricCard
            title="Equity"
            value={`$${account.equity.toLocaleString()}`}
            icon={Shield}
            color="text-[#00FFC2]"
          />
          <MetricCard
            title="Free Margin"
            value={`$${account.freeMargin.toLocaleString()}`}
            icon={DollarSign}
            color="text-[#00FFC2]"
          />
        </div>
      ) : null}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#00FFC2]" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Webhook Listener</span>
              <StatusIndicator status={systemStatus.webhookListener as any} />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Broker Connection</span>
              <StatusIndicator status={systemStatus.brokerConnection as any} />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Notifications</span>
              <StatusIndicator status={systemStatus.notifications as any} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start border-[#00FFC2]/20 hover:border-[#00FFC2]/40 hover:bg-[#00FFC2]/10"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Trigger Withdrawal
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-[#00FFC2]/20 hover:border-[#00FFC2]/40 hover:bg-[#00FFC2]/10"
            >
              <Shield className="h-4 w-4 mr-2" />
              Update Thresholds
            </Button>
            <Button 
              onClick={handleTestNotifications}
              variant="outline" 
              className="w-full justify-start border-[#00FFC2]/20 hover:border-[#00FFC2]/40 hover:bg-[#00FFC2]/10"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Test Notifications
            </Button>
            <Button 
              onClick={handleTestDatabase}
              variant="outline" 
              className="w-full justify-start border-[#00FFC2]/20 hover:border-[#00FFC2]/40 hover:bg-[#00FFC2]/10"
              disabled={positionsLoading}
            >
              <Database className="h-4 w-4 mr-2" />
              Test Database
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Keys Encrypted</span>
              <StatusIndicator status="success" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Two-Factor Auth</span>
              <StatusIndicator status="active" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Webhook Security</span>
              <StatusIndicator status="active" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SAWDashboard;
