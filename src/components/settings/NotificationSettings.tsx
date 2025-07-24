import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, Webhook, Volume2, Vibrate } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { NotificationPreferences } from '@/types/wingzero';

export const NotificationSettings = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useLocalStorage<NotificationPreferences>('notification_preferences', {
    email: { trades: true, account: true, system: true, news: false },
    push: { trades: true, account: true, system: false, news: false },
    sms: { trades: false, account: true, security: true },
    webhook: { enabled: false, url: '', secret: '' }
  });

  const [webhookData, setWebhookData] = useState({
    url: notifications.webhook.url || '',
    secret: notifications.webhook.secret || ''
  });

  const [testing, setTesting] = useState({
    email: false,
    push: false,
    sms: false,
    webhook: false
  });

  const updateNotificationSetting = (category: keyof NotificationPreferences, setting: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const updateWebhookSetting = (field: 'enabled' | 'url' | 'secret', value: string | boolean) => {
    if (field === 'enabled') {
      setNotifications(prev => ({
        ...prev,
        webhook: { ...prev.webhook, enabled: value as boolean }
      }));
    } else {
      setWebhookData(prev => ({ ...prev, [field]: value as string }));
    }
  };

  const saveWebhookSettings = () => {
    setNotifications(prev => ({
      ...prev,
      webhook: {
        ...prev.webhook,
        url: webhookData.url,
        secret: webhookData.secret
      }
    }));
    
    toast({
      title: "Webhook Settings Saved",
      description: "Your webhook configuration has been updated.",
    });
  };

  const testNotification = async (type: keyof typeof testing) => {
    setTesting(prev => ({ ...prev, [type]: true }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const messages = {
        email: "Test email sent to your registered address",
        push: "Test push notification sent to your devices",
        sms: "Test SMS sent to your phone number",
        webhook: "Test webhook payload sent to your endpoint"
      };

      toast({
        title: `${type.toUpperCase()} Test Successful`,
        description: messages[type],
      });
    } catch (error) {
      toast({
        title: `${type.toUpperCase()} Test Failed`,
        description: "There was an error sending the test notification.",
        variant: "destructive"
      });
    } finally {
      setTesting(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
            <Badge variant="outline" className="ml-auto">
              {Object.values(notifications.email).filter(Boolean).length} enabled
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-trades">Trade Confirmations</Label>
              <Switch
                id="email-trades"
                checked={notifications.email.trades}
                onCheckedChange={(checked) => updateNotificationSetting('email', 'trades', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-account">Account Updates</Label>
              <Switch
                id="email-account"
                checked={notifications.email.account}
                onCheckedChange={(checked) => updateNotificationSetting('email', 'account', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-system">System Alerts</Label>
              <Switch
                id="email-system"
                checked={notifications.email.system}
                onCheckedChange={(checked) => updateNotificationSetting('email', 'system', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-news">Market News</Label>
              <Switch
                id="email-news"
                checked={notifications.email.news}
                onCheckedChange={(checked) => updateNotificationSetting('email', 'news', checked)}
              />
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => testNotification('email')}
            disabled={testing.email}
          >
            {testing.email ? 'Sending...' : 'Send Test Email'}
          </Button>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
            <Badge variant="outline" className="ml-auto">
              {Object.values(notifications.push).filter(Boolean).length} enabled
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-trades">Trade Alerts</Label>
              <Switch
                id="push-trades"
                checked={notifications.push.trades}
                onCheckedChange={(checked) => updateNotificationSetting('push', 'trades', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-account">Balance Changes</Label>
              <Switch
                id="push-account"
                checked={notifications.push.account}
                onCheckedChange={(checked) => updateNotificationSetting('push', 'account', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-system">System Notifications</Label>
              <Switch
                id="push-system"
                checked={notifications.push.system}
                onCheckedChange={(checked) => updateNotificationSetting('push', 'system', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-news">Breaking News</Label>
              <Switch
                id="push-news"
                checked={notifications.push.news}
                onCheckedChange={(checked) => updateNotificationSetting('push', 'news', checked)}
              />
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => testNotification('push')}
            disabled={testing.push}
          >
            {testing.push ? 'Sending...' : 'Send Test Push'}
          </Button>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Notifications
            <Badge variant="outline" className="ml-auto">
              {Object.values(notifications.sms).filter(Boolean).length} enabled
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-trades">Critical Trades</Label>
              <Switch
                id="sms-trades"
                checked={notifications.sms.trades}
                onCheckedChange={(checked) => updateNotificationSetting('sms', 'trades', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-account">Account Alerts</Label>
              <Switch
                id="sms-account"
                checked={notifications.sms.account}
                onCheckedChange={(checked) => updateNotificationSetting('sms', 'account', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-security">Security Alerts</Label>
              <Switch
                id="sms-security"
                checked={notifications.sms.security}
                onCheckedChange={(checked) => updateNotificationSetting('sms', 'security', checked)}
              />
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              💡 SMS notifications require phone number verification and may incur charges.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => testNotification('sms')}
            disabled={testing.sms}
          >
            {testing.sms ? 'Sending...' : 'Send Test SMS'}
          </Button>
        </CardContent>
      </Card>

      {/* Webhook Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Integration
            <Badge variant={notifications.webhook.enabled ? "default" : "secondary"} className="ml-auto">
              {notifications.webhook.enabled ? 'Active' : 'Disabled'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Label htmlFor="webhook-enabled">Enable Webhook</Label>
            <Switch
              id="webhook-enabled"
              checked={notifications.webhook.enabled}
              onCheckedChange={(checked) => updateWebhookSetting('enabled', checked)}
            />
          </div>

          {notifications.webhook.enabled && (
            <div className="space-y-4">
              <div>
                <Label>Webhook URL</Label>
                <Input
                  value={webhookData.url}
                  onChange={(e) => updateWebhookSetting('url', e.target.value)}
                  placeholder="https://your-server.com/webhook"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your server endpoint to receive notifications
                </p>
              </div>

              <div>
                <Label>Secret (Optional)</Label>
                <Input
                  type="password"
                  value={webhookData.secret}
                  onChange={(e) => updateWebhookSetting('secret', e.target.value)}
                  placeholder="webhook-secret-key"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used to verify webhook authenticity
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  <strong>Webhook Payload Format:</strong>
                </p>
                <Textarea
                  value={`{
  "event": "trade.opened",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "symbol": "EURUSD",
    "type": "buy",
    "volume": 0.1,
    "price": 1.0875,
    "profit": 25.00
  }
}`}
                  readOnly
                  className="text-xs"
                  rows={8}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={saveWebhookSettings} size="sm">
                  Save Webhook Settings
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => testNotification('webhook')}
                  disabled={testing.webhook || !webhookData.url}
                >
                  {testing.webhook ? 'Testing...' : 'Test Webhook'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Enable all critical notifications
                setNotifications(prev => ({
                  ...prev,
                  email: { ...prev.email, trades: true, account: true, system: true },
                  push: { ...prev.push, trades: true, account: true },
                  sms: { ...prev.sms, account: true, security: true }
                }));
                toast({ title: "Critical notifications enabled" });
              }}
            >
              Enable All Critical
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Disable all notifications
                setNotifications(prev => ({
                  ...prev,
                  email: { trades: false, account: false, system: false, news: false },
                  push: { trades: false, account: false, system: false, news: false },
                  sms: { trades: false, account: false, security: false }
                }));
                toast({ title: "All notifications disabled" });
              }}
            >
              Disable All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Trading only
                setNotifications(prev => ({
                  ...prev,
                  email: { trades: true, account: false, system: false, news: false },
                  push: { trades: true, account: false, system: false, news: false },
                  sms: { trades: false, account: false, security: false }
                }));
                toast({ title: "Trading notifications only" });
              }}
            >
              Trading Only
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};