import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, X, BarChart3, DollarSign } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useWingZeroPositions } from "@/hooks/useWingZeroPositions";
import { useTradingEngine } from "@/hooks/useTradingEngine";
import { formatDistanceToNow } from "date-fns";

type Platform = 'ctrader' | 'mt5' | 'ninjatrader' | 'tradingview' | 'interactivebrokers' | 'binance';

export const PlatformLivePositions = () => {
  const [selectedPlatform] = useLocalStorage<Platform>('wingzero-platform', 'ctrader');
  const { positions, isLoading, getTotalPnL, getOpenPositions } = useWingZeroPositions();
  const { closePosition } = useTradingEngine();
  
  const openPositions = getOpenPositions();
  const totalPnL = getTotalPnL();

  const getPlatformName = (platform: Platform) => {
    const names = {
      ctrader: 'cTrader',
      mt5: 'MetaTrader 5',
      ninjatrader: 'NinjaTrader',
      tradingview: 'TradingView',
      interactivebrokers: 'Interactive Brokers',
      binance: 'Binance'
    };
    return names[platform];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getPositionIcon = (type: 'buy' | 'sell') => {
    return type === 'buy' ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return "text-green-600";
    if (pnl < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#00AEEF]" />
            Live {getPlatformName(selectedPlatform)} Positions
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
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#00AEEF]/20 bg-gradient-to-r from-[#00AEEF]/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Positions</p>
                <p className="text-2xl font-bold text-[#00AEEF]">{openPositions.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-[#00AEEF]" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${totalPnL >= 0 ? 'border-green-500/20 bg-green-50/20' : 'border-red-500/20 bg-red-50/20'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Unrealized P&L</p>
                <p className={`text-2xl font-bold ${getPnLColor(totalPnL)}`}>
                  {formatCurrency(totalPnL)}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platform</p>
                <Badge variant="default" className="bg-[#00AEEF] text-black">
                  {getPlatformName(selectedPlatform)}
                </Badge>
              </div>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#00AEEF]" />
            Live {getPlatformName(selectedPlatform)} Positions ({openPositions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {openPositions.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No open positions</p>
              <p className="text-sm text-muted-foreground mt-1">
                Positions will appear here when Wing Zero trading engine is active
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Open Price</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openPositions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">
                        {position.symbol}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPositionIcon(position.position_type)}
                          <span className={`font-medium ${
                            position.position_type === 'buy' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {position.position_type.toUpperCase()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{position.volume}</TableCell>
                      <TableCell>{position.open_price.toFixed(5)}</TableCell>
                      <TableCell>{position.current_price.toFixed(5)}</TableCell>
                      <TableCell className={getPnLColor(position.unrealized_pnl)}>
                        {formatCurrency(position.unrealized_pnl)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(position.opened_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {position.strategy || position.comment || 'WingZero'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => closePosition(position.order_id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};