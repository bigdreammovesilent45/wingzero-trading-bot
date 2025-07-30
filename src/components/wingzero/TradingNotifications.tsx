import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseTrades } from "@/hooks/useSupabaseTrades";
import { useTradingEngine } from "@/hooks/useTradingEngine";

interface TradeNotification {
  id: string;
  type: 'trade_opened' | 'trade_closed' | 'profit_target' | 'risk_alert' | 'daily_summary';
  title: string;
  message: string;
  timestamp: Date;
  amount?: number;
  symbol?: string;
  read: boolean;
  severity: 'info' | 'success' | 'warning' | 'error';
}

export const TradingNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<TradeNotification[]>([]);
  const { toast } = useToast();
  const { trades } = useSupabaseTrades();
  const { dailyPnL, totalProfit, isRunning } = useTradingEngine();

  // Monitor for new trades and generate notifications
  useEffect(() => {
    if (!trades.length) return;

    const latestTrade = trades[0];
    const now = new Date();
    const tradeTime = new Date(latestTrade.created_at);
    
    // Only notify for trades within last 5 minutes
    if (now.getTime() - tradeTime.getTime() < 5 * 60 * 1000) {
      const notification: TradeNotification = {
        id: `trade_${latestTrade.id}`,
        type: latestTrade.status === 'open' ? 'trade_opened' : 'trade_closed',
        title: latestTrade.status === 'open' ? '🚀 Trade Opened' : '📈 Trade Closed',
        message: `${latestTrade.symbol} ${latestTrade.trade_type} - Volume: ${latestTrade.volume} ${
          latestTrade.status === 'closed' ? `| P/L: $${latestTrade.profit?.toFixed(2)}` : ''
        }`,
        timestamp: tradeTime,
        amount: latestTrade.profit || undefined,
        symbol: latestTrade.symbol,
        read: false,
        severity: latestTrade.status === 'closed' && (latestTrade.profit || 0) > 0 ? 'success' : 'info'
      };

      setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep last 20

      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    }
  }, [trades, toast]);

  // Daily P&L alerts
  useEffect(() => {
    if (dailyPnL === 0) return;

    if (dailyPnL > 100) {
      const notification: TradeNotification = {
        id: `profit_${Date.now()}`,
        type: 'profit_target',
        title: '🎯 Profit Target Hit!',
        message: `Daily profit reached $${dailyPnL.toFixed(2)}! Excellent performance.`,
        timestamp: new Date(),
        amount: dailyPnL,
        read: false,
        severity: 'success'
      };
      setNotifications(prev => [notification, ...prev.slice(0, 19)]);
    } else if (dailyPnL < -50) {
      const notification: TradeNotification = {
        id: `risk_${Date.now()}`,
        type: 'risk_alert',
        title: '⚠️ Risk Alert',
        message: `Daily loss at $${Math.abs(dailyPnL).toFixed(2)}. Risk management active.`,
        timestamp: new Date(),
        amount: dailyPnL,
        read: false,
        severity: 'warning'
      };
      setNotifications(prev => [notification, ...prev.slice(0, 19)]);
    }
  }, [dailyPnL]);

  // Engine status notifications
  useEffect(() => {
    if (isRunning) {
      const notification: TradeNotification = {
        id: `engine_${Date.now()}`,
        type: 'daily_summary',
        title: '✅ Wing Zero Active',
        message: 'Trading engine is running and monitoring markets 24/7',
        timestamp: new Date(),
        read: false,
        severity: 'success'
      };
      setNotifications(prev => [notification, ...prev.slice(0, 19)]);
    }
  }, [isRunning]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Trading Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time alerts for trades, profits, and risk management
          </CardDescription>
        </div>
        {notifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notifications yet</p>
            <p className="text-sm">Trade alerts will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  notification.read 
                    ? 'bg-muted/30 border-muted' 
                    : 'bg-background border-primary/20 shadow-sm'
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(notification.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${notification.read ? 'text-muted-foreground' : ''}`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {notification.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${notification.read ? 'text-muted-foreground' : ''}`}>
                      {notification.message}
                    </p>
                    {notification.amount && (
                      <div className="flex items-center gap-1 mt-2">
                        <DollarSign className="h-3 w-3" />
                        <span className={`text-xs font-medium ${
                          notification.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {notification.amount > 0 ? '+' : ''}${notification.amount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};