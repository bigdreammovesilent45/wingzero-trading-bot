import { useState } from 'react';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Settings, Trash2, Check, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    permissionGranted,
    requestNotificationPermission
  } = useRealTimeNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'trade' | 'alert' | 'risk'>('all');

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'trade') return notif.type === 'trade';
    if (filter === 'alert') return notif.type === 'price_alert';
    if (filter === 'risk') return notif.type === 'risk_warning';
    return true;
  });

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'trade':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'price_alert':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'risk_warning':
        return <AlertTriangle className={`w-4 h-4 ${priority === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />;
      case 'market_event':
        return <Bell className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50 dark:bg-red-950';
      case 'high': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'medium': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {!permissionGranted && (
              <Button variant="outline" size="sm" onClick={requestNotificationPermission}>
                <Settings className="w-4 h-4 mr-1" />
                Enable Push
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
        <CardDescription>
          Real-time alerts for trades, price movements, and market events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="trade">Trades</TabsTrigger>
            <TabsTrigger value="alert">Alerts</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications to display</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-l-4 rounded-r-lg transition-all cursor-pointer hover:shadow-sm ${
                        getPriorityColor(notification.priority)
                      } ${notification.isRead ? 'opacity-60' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {getNotificationIcon(notification.type, notification.priority)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{notification.title}</h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(notification.timestamp), 'PPp')}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {notification.type.replace('_', ' ')}
                              </Badge>
                              <Badge 
                                variant={notification.priority === 'critical' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {notification.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {!notification.isRead && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};