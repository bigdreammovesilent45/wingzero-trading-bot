import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Shield, Clock, Bell } from 'lucide-react';

interface TradingPreference {
  id: string;
  user_id: string;
  risk_tolerance: 'low' | 'medium' | 'high' | 'aggressive';
  max_position_size: number;
  max_daily_volume: number;
  preferred_symbols: string[];
  forbidden_symbols: string[];
  auto_close_at_loss: number;
  auto_close_at_profit: number;
  trading_hours_start: string;
  trading_hours_end: string;
  timezone: string;
  notifications_enabled: boolean;
  email_alerts: boolean;
  sms_alerts: boolean;
  push_notifications: boolean;
}

export const TradingPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<TradingPreference | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trading_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPreferences({
          ...data,
          risk_tolerance: data.risk_tolerance as 'low' | 'medium' | 'high' | 'aggressive'
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load trading preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (field: keyof TradingPreference, value: any) => {
    if (!preferences) return;
    setPreferences(prev => prev ? { ...prev, [field]: value } : null);
  };

  const savePreferences = async () => {
    if (!preferences || !user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('trading_preferences')
        .upsert({
          ...preferences,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trading preferences saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading trading preferences...</div>;
  }

  if (!preferences) {
    return <div>No trading preferences found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Risk Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Management
          </CardTitle>
          <CardDescription>
            Configure your trading risk parameters and position limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Risk Tolerance</Label>
              <Select 
                value={preferences.risk_tolerance} 
                onValueChange={(value) => updatePreference('risk_tolerance', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Conservative</SelectItem>
                  <SelectItem value="medium">Moderate</SelectItem>
                  <SelectItem value="high">Aggressive</SelectItem>
                  <SelectItem value="aggressive">Very Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Max Position Size (lots)</Label>
              <Input
                type="number"
                step="0.01"
                value={preferences.max_position_size}
                onChange={(e) => updatePreference('max_position_size', parseFloat(e.target.value))}
              />
            </div>

            <div>
              <Label>Max Daily Volume (lots)</Label>
              <Input
                type="number"
                step="0.1"
                value={preferences.max_daily_volume}
                onChange={(e) => updatePreference('max_daily_volume', parseFloat(e.target.value))}
              />
            </div>

            <div>
              <Label>Timezone</Label>
              <Select 
                value={preferences.timezone} 
                onValueChange={(value) => updatePreference('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="EST">EST</SelectItem>
                  <SelectItem value="PST">PST</SelectItem>
                  <SelectItem value="GMT">GMT</SelectItem>
                  <SelectItem value="CET">CET</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Auto Close at Loss (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={preferences.auto_close_at_loss}
                onChange={(e) => updatePreference('auto_close_at_loss', parseFloat(e.target.value))}
              />
            </div>

            <div>
              <Label>Auto Close at Profit (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={preferences.auto_close_at_profit}
                onChange={(e) => updatePreference('auto_close_at_profit', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Trading Hours
          </CardTitle>
          <CardDescription>
            Set your preferred trading time window
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={preferences.trading_hours_start}
                onChange={(e) => updatePreference('trading_hours_start', e.target.value)}
              />
            </div>

            <div>
              <Label>End Time</Label>
              <Input
                type="time"
                value={preferences.trading_hours_end}
                onChange={(e) => updatePreference('trading_hours_end', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symbol Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Symbol Preferences
          </CardTitle>
          <CardDescription>
            Configure which currency pairs you want to trade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Preferred Symbols (comma-separated)</Label>
            <Textarea
              value={preferences.preferred_symbols.join(', ')}
              onChange={(e) => updatePreference('preferred_symbols', 
                e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              )}
              placeholder="EURUSD, GBPUSD, USDJPY"
              rows={3}
            />
          </div>

          <div>
            <Label>Forbidden Symbols (comma-separated)</Label>
            <Textarea
              value={preferences.forbidden_symbols.join(', ')}
              onChange={(e) => updatePreference('forbidden_symbols', 
                e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              )}
              placeholder="XAUUSD, BTCUSD"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive trading alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Turn on/off all trading notifications
                </p>
              </div>
              <Switch
                checked={preferences.notifications_enabled}
                onCheckedChange={(checked) => updatePreference('notifications_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Receive trade notifications via email
                </p>
              </div>
              <Switch
                checked={preferences.email_alerts}
                onCheckedChange={(checked) => updatePreference('email_alerts', checked)}
                disabled={!preferences.notifications_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Receive critical notifications via SMS
                </p>
              </div>
              <Switch
                checked={preferences.sms_alerts}
                onCheckedChange={(checked) => updatePreference('sms_alerts', checked)}
                disabled={!preferences.notifications_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive browser push notifications
                </p>
              </div>
              <Switch
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
                disabled={!preferences.notifications_enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};