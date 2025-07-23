
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trade } from "@/types/trading";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

const TradeHistory = () => {
  // Mock data - in real app, this would come from hooks/API
  const trades: Trade[] = [
    {
      id: "1",
      symbol: "EURUSD",
      type: "buy",
      volume: 0.1,
      openPrice: 1.0850,
      closePrice: 1.0875,
      profit: 25.00,
      openTime: "2025-01-23T14:30:00Z",
      closeTime: "2025-01-23T15:15:00Z",
      status: "closed"
    },
    {
      id: "2",
      symbol: "GBPUSD",
      type: "sell",
      volume: 0.05,
      openPrice: 1.2450,
      closePrice: 1.2435,
      profit: 7.50,
      openTime: "2025-01-23T13:45:00Z",
      closeTime: "2025-01-23T14:20:00Z",
      status: "closed"
    },
    {
      id: "3",
      symbol: "USDJPY",
      type: "buy",
      volume: 0.08,
      openPrice: 149.25,
      profit: -12.50,
      openTime: "2025-01-23T16:00:00Z",
      status: "open"
    }
  ];

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

  const getStatusBadge = (status: Trade['status']) => {
    const variants = {
      open: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      closed: 'bg-gray-500/20 text-gray-500 border-gray-500/30'
    };

    return (
      <Badge className={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#00AEEF]" />
          Trade History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trades.map((trade) => {
            const TradeIcon = getTradeIcon(trade.type);
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
                        {trade.type.toUpperCase()}
                      </Badge>
                      {getStatusBadge(trade.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Vol: {trade.volume} • Open: {trade.openPrice}
                      {trade.closePrice && ` • Close: ${trade.closePrice}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getProfitColor(trade.profit)}`}>
                    ${trade.profit > 0 ? '+' : ''}{trade.profit.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTime(trade.openTime)}
                    {trade.closeTime && ` - ${formatTime(trade.closeTime)}`}
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
