
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MetricCard from "@/components/shared/MetricCard";
import StatusIndicator from "@/components/shared/StatusIndicator";
import { Activity, TrendingUp, Target, Zap } from "lucide-react";

const BotMetrics = () => {
  // Mock data - in real app, this would come from hooks/API
  const botData = {
    status: 'active',
    profit24h: 425.50,
    totalProfit: 8350.00,
    winRate: 68.5,
    totalTrades: 47,
    activeTrades: 3
  };

  return (
    <div className="space-y-6">
      {/* Bot Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#00AEEF]" />
              Wing Zero Status
            </div>
            <StatusIndicator status={botData.status as any} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-[#00AEEF]/10 rounded-lg">
              <span className="font-medium">Bot Engine</span>
              <StatusIndicator status="active" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[#00AEEF]/10 rounded-lg">
              <span className="font-medium">Strategy Module</span>
              <StatusIndicator status="active" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="24h Profit"
          value={`$${botData.profit24h.toLocaleString()}`}
          change="+8.2%"
          changeType="positive"
          icon={TrendingUp}
          color="text-[#00AEEF]"
        />
        <MetricCard
          title="Total Profit"
          value={`$${botData.totalProfit.toLocaleString()}`}
          change="+15.4%"
          changeType="positive"
          icon={Target}
          color="text-[#00AEEF]"
        />
        <MetricCard
          title="Win Rate"
          value={`${botData.winRate}%`}
          change="+2.1%"
          changeType="positive"
          icon={Activity}
          color="text-[#00AEEF]"
        />
        <MetricCard
          title="Active Trades"
          value={botData.activeTrades.toString()}
          icon={Zap}
          color="text-[#00AEEF]"
        />
      </div>

      {/* Strategy Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#00AEEF]" />
            Strategy Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-[#00AEEF]">{botData.totalTrades}</div>
              <div className="text-sm text-muted-foreground">Total Trades</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-500">32</div>
              <div className="text-sm text-muted-foreground">Winning Trades</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-red-500">15</div>
              <div className="text-sm text-muted-foreground">Losing Trades</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BotMetrics;
