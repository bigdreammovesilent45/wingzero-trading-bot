
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useTradingEngine } from "@/hooks/useTradingEngine";
import { useSupabaseTrades } from "@/hooks/useSupabaseTrades";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const TradeHistory = () => {
  const { openPositions, dailyPnL, totalProfit, isRunning, cloudStatus } = useTradingEngine();
  const { trades, isLoading, fetchTrades } = useSupabaseTrades();
  const [selectedPlatform] = useLocalStorage('wingzero-platform', 'ctrader');
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncOandaPositions = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-oanda-positions');
      
      if (error) throw error;
      
      toast({
        title: "Positions Synced",
        description: `Successfully synced ${data.synced} positions from OANDA`,
      });
      
      // Refresh trades after sync
      await fetchTrades();
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync positions from OANDA",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? 'text-green-500' : 'text-red-500';
  };

  const getTradeIcon = (type: string) => {
    return type === 'buy' ? TrendingUp : TrendingDown;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      closed: 'bg-gray-500/20 text-gray-500 border-gray-500/30'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.closed}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#00AEEF]" />
            Trade History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00AEEF]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#00AEEF]" />
            Trade History
          </div>
          {selectedPlatform === 'oanda' && (
            <Button
              size="sm"
              variant="outline"
              onClick={syncOandaPositions}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync OANDA'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Trading Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-[#00AEEF]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#00AEEF]">{trades.length}</div>
            <div className="text-sm text-muted-foreground">Total Trades</div>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg">
            <div className={`text-2xl font-bold ${getProfitColor(dailyPnL)}`}>
              ${dailyPnL.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Daily P&L</div>
          </div>
          <div className="text-center p-4 bg-blue-500/10 rounded-lg">
            <div className="text-2xl font-bold text-blue-500">{openPositions.length}</div>
            <div className="text-sm text-muted-foreground">Open Positions</div>
          </div>
        </div>

        {/* Trade List */}
        <div className="space-y-4">
          {!isRunning && !cloudStatus.isRunning && (
            <div className="text-center py-8 bg-yellow-50/50 rounded-lg border border-yellow-200">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Wing Zero Not Running</h3>
              <p className="text-yellow-700">
                Start the trading engine from the Control Panel to begin making trades
              </p>
            </div>
          )}
          
          {cloudStatus.isRunning && !isRunning && (
            <div className="text-center py-8 bg-blue-50/50 rounded-lg border border-blue-200">
              <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Cloud Engine Active 24/7</h3>
              <p className="text-blue-700">
                Wing Zero is running in the cloud and will trade even when you're offline
              </p>
              {cloudStatus.lastHeartbeat && (
                <p className="text-xs text-blue-600 mt-2">
                  Last activity: {new Date(cloudStatus.lastHeartbeat).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {trades.length === 0 && isRunning && (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No trades yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Wing Zero is analyzing the market and will execute trades when opportunities arise
              </p>
            </div>
          )}

          {trades.map((trade) => {
            const TradeIcon = getTradeIcon(trade.trade_type);
            return (
              <div
                key={trade.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-[#00AEEF]/20 rounded-full">
                    <TradeIcon className="h-5 w-5 text-[#00AEEF]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{trade.symbol}</span>
                      <Badge variant="outline" className="text-xs">
                        {trade.trade_type.toUpperCase()}
                      </Badge>
                      {getStatusBadge(trade.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Vol: {trade.volume} • Open: {trade.open_price.toFixed(5)}
                      {trade.close_price && ` • Close: ${trade.close_price.toFixed(5)}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getProfitColor(trade.profit)}`}>
                    ${trade.profit > 0 ? '+' : ''}{trade.profit.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTime(trade.opened_at)}
                    {trade.closed_at && ` - ${formatTime(trade.closed_at)}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeHistory;
