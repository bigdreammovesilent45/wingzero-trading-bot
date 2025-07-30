import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  tradeExecutions: boolean;
  priceAlerts: boolean;
  riskWarnings: boolean;
  marketEvents: boolean;
  positionUpdates: boolean;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  price: number;
  isActive: boolean;
}

export interface NotificationEvent {
  id: string;
  type: 'trade' | 'price_alert' | 'risk_warning' | 'market_event' | 'position_update';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
}

export const useRealTimeNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    tradeExecutions: true,
    priceAlerts: true,
    riskWarnings: true,
    marketEvents: false,
    positionUpdates: true,
  });
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionGranted(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  }, []);

  // Send push notification
  const sendPushNotification = useCallback((title: string, body: string, data?: any) => {
    if (permissionGranted && preferences.pushEnabled) {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data,
        requireInteraction: data?.priority === 'critical',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds unless critical
      if (data?.priority !== 'critical') {
        setTimeout(() => notification.close(), 5000);
      }
    }
  }, [permissionGranted, preferences.pushEnabled]);

  // Add notification to state
  const addNotification = useCallback((notification: Omit<NotificationEvent, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: NotificationEvent = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 100)); // Keep only latest 100

    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.priority === 'critical' ? 'destructive' : 'default',
    });

    // Send push notification
    sendPushNotification(notification.title, notification.message, notification);

    return newNotification.id;
  }, [toast, sendPushNotification]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Add price alert
  const addPriceAlert = useCallback((alert: Omit<PriceAlert, 'id'>) => {
    const newAlert: PriceAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    setPriceAlerts(prev => [...prev, newAlert]);
    
    addNotification({
      type: 'price_alert',
      title: 'Price Alert Created',
      message: `Alert set for ${alert.symbol} ${alert.condition} ${alert.price}`,
      priority: 'low',
    });

    return newAlert.id;
  }, [addNotification]);

  // Remove price alert
  const removePriceAlert = useCallback((alertId: string) => {
    setPriceAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Simulate trade execution notification
  const notifyTradeExecution = useCallback((trade: any) => {
    if (!preferences.tradeExecutions) return;

    addNotification({
      type: 'trade',
      title: 'Trade Executed',
      message: `${trade.type} ${trade.volume} ${trade.symbol} at ${trade.price}`,
      priority: 'medium',
      data: trade,
    });
  }, [preferences.tradeExecutions, addNotification]);

  // Simulate risk warning notification
  const notifyRiskWarning = useCallback((warning: { message: string; severity: 'low' | 'medium' | 'high' | 'critical' }) => {
    if (!preferences.riskWarnings) return;

    addNotification({
      type: 'risk_warning',
      title: 'Risk Warning',
      message: warning.message,
      priority: warning.severity,
      data: warning,
    });
  }, [preferences.riskWarnings, addNotification]);

  // Simulate market event notification
  const notifyMarketEvent = useCallback((event: { title: string; message: string; impact: string }) => {
    if (!preferences.marketEvents) return;

    addNotification({
      type: 'market_event',
      title: event.title,
      message: event.message,
      priority: 'medium',
      data: event,
    });
  }, [preferences.marketEvents, addNotification]);

  // Check price alerts (simulation)
  const checkPriceAlerts = useCallback((currentPrices: Record<string, number>) => {
    priceAlerts.forEach(alert => {
      if (!alert.isActive) return;
      
      const currentPrice = currentPrices[alert.symbol];
      if (!currentPrice) return;

      const triggered = 
        (alert.condition === 'above' && currentPrice >= alert.price) ||
        (alert.condition === 'below' && currentPrice <= alert.price);

      if (triggered) {
        addNotification({
          type: 'price_alert',
          title: 'Price Alert Triggered',
          message: `${alert.symbol} is now ${alert.condition} ${alert.price} (Current: ${currentPrice})`,
          priority: 'high',
          data: { alert, currentPrice },
        });

        // Deactivate the alert
        setPriceAlerts(prev => 
          prev.map(a => a.id === alert.id ? { ...a, isActive: false } : a)
        );
      }
    });
  }, [priceAlerts, addNotification]);

  // Initialize on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }

    // Load saved preferences
    const savedPrefs = localStorage.getItem('notification-preferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }

    // Load saved price alerts
    const savedAlerts = localStorage.getItem('price-alerts');
    if (savedAlerts) {
      setPriceAlerts(JSON.parse(savedAlerts));
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('notification-preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Save price alerts when they change
  useEffect(() => {
    localStorage.setItem('price-alerts', JSON.stringify(priceAlerts));
  }, [priceAlerts]);

  // Set up real-time subscriptions if user is authenticated
  useEffect(() => {
    if (!user) return;

    // Subscribe to trades updates
    const tradesChannel = supabase
      .channel('trades-notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'trades', filter: `user_id=eq.${user.id}` },
        (payload) => {
          notifyTradeExecution(payload.new);
        }
      )
      .subscribe();

    // Subscribe to positions updates
    const positionsChannel = supabase
      .channel('positions-notifications')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'positions', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (preferences.positionUpdates) {
            addNotification({
              type: 'position_update',
              title: 'Position Updated',
              message: `Position ${payload.eventType}: ${(payload.new as any)?.symbol || (payload.old as any)?.symbol || 'Unknown'}`,
              priority: 'low',
              data: payload,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(positionsChannel);
    };
  }, [user, preferences.positionUpdates, addNotification, notifyTradeExecution]);

  return {
    notifications,
    priceAlerts,
    preferences,
    permissionGranted,
    unreadCount: notifications.filter(n => !n.isRead).length,
    
    // Methods
    requestNotificationPermission,
    addNotification,
    markAsRead,
    clearAll,
    addPriceAlert,
    removePriceAlert,
    notifyTradeExecution,
    notifyRiskWarning,
    notifyMarketEvent,
    checkPriceAlerts,
    updatePreferences: setPreferences,
  };
};