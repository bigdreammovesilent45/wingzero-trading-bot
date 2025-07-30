import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { Smartphone, Vibrate, Wifi, WifiOff, Download } from 'lucide-react';

interface MobileQuickAction {
  id: string;
  label: string;
  action: () => void;
  color: string;
  icon: string;
}

export const MobileTrading = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isVibrationSupported, setIsVibrationSupported] = useState(false);
  const [quickActions, setQuickActions] = useState<MobileQuickAction[]>([]);
  const { addNotification } = useRealTimeNotifications();

  useEffect(() => {
    // Check for vibration support
    setIsVibrationSupported('vibrate' in navigator);

    // Set up online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set up quick actions
    setQuickActions([
      {
        id: 'quick_buy',
        label: 'Quick Buy',
        action: () => handleQuickTrade('buy'),
        color: 'bg-green-500',
        icon: '📈'
      },
      {
        id: 'quick_sell',
        label: 'Quick Sell',
        action: () => handleQuickTrade('sell'),
        color: 'bg-red-500',
        icon: '📉'
      },
      {
        id: 'close_all',
        label: 'Close All',
        action: () => handleCloseAll(),
        color: 'bg-orange-500',
        icon: '🛑'
      },
      {
        id: 'positions',
        label: 'Positions',
        action: () => showPositions(),
        color: 'bg-blue-500',
        icon: '📊'
      }
    ]);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleQuickTrade = (direction: 'buy' | 'sell') => {
    // Haptic feedback for mobile
    if (isVibrationSupported) {
      navigator.vibrate(50);
    }

    addNotification({
      type: 'trade',
      title: `Quick ${direction.toUpperCase()} Order`,
      message: `${direction === 'buy' ? '📈' : '📉'} Quick ${direction} order initiated`,
      priority: 'medium'
    });
  };

  const handleCloseAll = () => {
    if (isVibrationSupported) {
      navigator.vibrate([100, 50, 100]); // Pattern vibration
    }

    addNotification({
      type: 'trade',
      title: 'Close All Positions',
      message: '🛑 All positions are being closed',
      priority: 'high'
    });
  };

  const showPositions = () => {
    addNotification({
      type: 'position_update',
      title: 'Position Overview',
      message: '📊 Showing current positions',
      priority: 'low'
    });
  };

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        addNotification({
          type: 'market_event',
          title: 'Screen Lock Disabled',
          message: 'Screen will stay on while trading',
          priority: 'low'
        });
        return wakeLock;
      }
    } catch (err) {
      console.log('Wake lock not supported');
    }
  };

  const enablePWA = () => {
    addNotification({
      type: 'market_event',
      title: 'Install App',
      message: 'Add to home screen for better experience',
      priority: 'medium'
    });
  };

  return (
    <div className="space-y-4 p-4 max-w-md mx-auto">
      {/* Connection Status */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile Trading
            </div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Online
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                onClick={action.action}
                className={`${action.color} hover:opacity-90 h-16 flex flex-col gap-1 touch-action-manipulation`}
                style={{ WebkitTouchCallout: 'none' }}
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>

          {/* Mobile Features */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Vibrate className="h-4 w-4" />
                <span className="text-sm">Haptic Feedback</span>
              </div>
              <Badge variant={isVibrationSupported ? "default" : "secondary"}>
                {isVibrationSupported ? "Supported" : "Not Available"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="text-sm">Touch Optimized</span>
              </div>
              <Badge variant="default">Active</Badge>
            </div>

            <Button 
              variant="outline" 
              className="w-full flex items-center gap-2"
              onClick={requestWakeLock}
            >
              <Smartphone className="h-4 w-4" />
              Keep Screen On
            </Button>

            <Button 
              variant="outline" 
              className="w-full flex items-center gap-2"
              onClick={enablePWA}
            >
              <Download className="h-4 w-4" />
              Install App
            </Button>
          </div>

          {/* Offline Capabilities */}
          {!isOnline && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                Offline Mode Active
              </h4>
              <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                <li>• View cached positions</li>
                <li>• Access trade history</li>
                <li>• Review performance data</li>
                <li>• Set price alerts (will sync when online)</li>
              </ul>
            </div>
          )}

          {/* Performance Optimizations */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Mobile Optimizations</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Touch Response</span>
                <Progress value={95} className="w-20 h-2" />
              </div>
              <div className="flex justify-between text-sm">
                <span>Data Efficiency</span>
                <Progress value={88} className="w-20 h-2" />
              </div>
              <div className="flex justify-between text-sm">
                <span>Battery Usage</span>
                <Progress value={12} className="w-20 h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-Specific Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mobile Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Push Notifications</span>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Vibration Alerts</span>
              <Badge variant={isVibrationSupported ? "default" : "secondary"}>
                {isVibrationSupported ? "On" : "N/A"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Sound Alerts</span>
              <Badge variant="default">On</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};