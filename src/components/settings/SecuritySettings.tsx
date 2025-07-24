import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Key, Lock, Clock, Globe, AlertTriangle, CheckCircle, Eye, EyeOff, Bell } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { SecuritySettings as SecuritySettingsType } from '@/types/wingzero';

export const SecuritySettings = () => {
  const { toast } = useToast();
  const [showPasswords, setShowPasswords] = useState(false);
  const [securitySettings, setSecuritySettings] = useLocalStorage<SecuritySettingsType>('security_settings', {
    twoFactorEnabled: false,
    ipWhitelist: [],
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordExpiry: 90,
    apiKeyExpiry: 365,
    loginNotifications: true,
    tradingRestrictions: {
      maxDailyVolume: 10,
      maxPositionSize: 1,
      allowedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY'],
      forbiddenSymbols: [],
      tradingHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'UTC'
      }
    }
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [newIpAddress, setNewIpAddress] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const updateSecuritySetting = (field: keyof SecuritySettingsType, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateTradingRestriction = (field: string, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      tradingRestrictions: {
        ...prev.tradingRestrictions,
        [field]: value
      }
    }));
  };

  const addIpToWhitelist = () => {
    if (newIpAddress && !securitySettings.ipWhitelist.includes(newIpAddress)) {
      updateSecuritySetting('ipWhitelist', [...securitySettings.ipWhitelist, newIpAddress]);
      setNewIpAddress('');
      toast({
        title: "IP Address Added",
        description: `${newIpAddress} has been added to the whitelist.`,
      });
    }
  };

  const removeIpFromWhitelist = (ip: string) => {
    updateSecuritySetting('ipWhitelist', securitySettings.ipWhitelist.filter(addr => addr !== ip));
    toast({
      title: "IP Address Removed",
      description: `${ip} has been removed from the whitelist.`,
    });
  };

  const changePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.new.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPasswordData({ current: '', new: '', confirm: '' });
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description: "There was an error updating your password.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const enable2FA = async () => {
    try {
      // Simulate enabling 2FA
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateSecuritySetting('twoFactorEnabled', true);
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been activated.",
      });
    } catch (error) {
      toast({
        title: "2FA Setup Failed",
        description: "There was an error setting up 2FA.",
        variant: "destructive"
      });
    }
  };

  const disable2FA = async () => {
    try {
      // Simulate disabling 2FA
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateSecuritySetting('twoFactorEnabled', false);
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been deactivated.",
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "2FA Disable Failed",
        description: "There was an error disabling 2FA.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
            <Badge variant={securitySettings.twoFactorEnabled ? "default" : "destructive"} className="ml-auto">
              {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enhanced Security</p>
              <p className="text-sm text-muted-foreground">
                Protect your account with authenticator app verification
              </p>
            </div>
            <Switch
              checked={securitySettings.twoFactorEnabled}
              onCheckedChange={(checked) => checked ? enable2FA() : disable2FA()}
            />
          </div>
          
          {!securitySettings.twoFactorEnabled && (
            <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Security Risk:</strong> Enable 2FA to protect your trading account
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Session Timeout (minutes)</Label>
              <Select 
                value={securitySettings.sessionTimeout.toString()} 
                onValueChange={(value) => updateSecuritySetting('sessionTimeout', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Max Login Attempts</Label>
              <Select 
                value={securitySettings.maxLoginAttempts.toString()} 
                onValueChange={(value) => updateSecuritySetting('maxLoginAttempts', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 attempts</SelectItem>
                  <SelectItem value="5">5 attempts</SelectItem>
                  <SelectItem value="10">10 attempts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Password Expiry (days)</Label>
              <Select 
                value={securitySettings.passwordExpiry.toString()} 
                onValueChange={(value) => updateSecuritySetting('passwordExpiry', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">6 months</SelectItem>
                  <SelectItem value="365">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>API Key Expiry (days)</Label>
              <Select 
                value={securitySettings.apiKeyExpiry.toString()} 
                onValueChange={(value) => updateSecuritySetting('apiKeyExpiry', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">6 months</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="999999">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>Change Password</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Current Password</Label>
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={passwordData.current}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <Label>New Password</Label>
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={passwordData.new}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            
            <Button 
              onClick={changePassword}
              disabled={isChangingPassword || !passwordData.current || !passwordData.new}
              size="sm"
            >
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* IP Whitelist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            IP Address Whitelist
            <Badge variant="outline" className="ml-auto">
              {securitySettings.ipWhitelist.length} addresses
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Restrict access to your account from specific IP addresses only.
          </p>
          
          <div className="flex gap-2">
            <Input
              value={newIpAddress}
              onChange={(e) => setNewIpAddress(e.target.value)}
              placeholder="192.168.1.1 or 203.0.113.0/24"
            />
            <Button onClick={addIpToWhitelist} disabled={!newIpAddress}>
              Add IP
            </Button>
          </div>

          <div className="space-y-2">
            {securitySettings.ipWhitelist.map((ip, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <span className="font-mono text-sm">{ip}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeIpFromWhitelist(ip)}
                >
                  Remove
                </Button>
              </div>
            ))}
            
            {securitySettings.ipWhitelist.length === 0 && (
              <p className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                No IP restrictions set. Access allowed from any IP address.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trading Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Trading Restrictions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Max Daily Volume (lots)</Label>
              <Input
                type="number"
                value={securitySettings.tradingRestrictions.maxDailyVolume}
                onChange={(e) => updateTradingRestriction('maxDailyVolume', parseFloat(e.target.value))}
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <Label>Max Position Size (lots)</Label>
              <Input
                type="number"
                value={securitySettings.tradingRestrictions.maxPositionSize}
                onChange={(e) => updateTradingRestriction('maxPositionSize', parseFloat(e.target.value))}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label>Trading Start Time</Label>
              <Input
                type="time"
                value={securitySettings.tradingRestrictions.tradingHours.start}
                onChange={(e) => updateTradingRestriction('tradingHours', {
                  ...securitySettings.tradingRestrictions.tradingHours,
                  start: e.target.value
                })}
              />
            </div>

            <div>
              <Label>Trading End Time</Label>
              <Input
                type="time"
                value={securitySettings.tradingRestrictions.tradingHours.end}
                onChange={(e) => updateTradingRestriction('tradingHours', {
                  ...securitySettings.tradingRestrictions.tradingHours,
                  end: e.target.value
                })}
              />
            </div>
          </div>

          <div>
            <Label>Allowed Symbols (comma-separated)</Label>
            <Textarea
              value={securitySettings.tradingRestrictions.allowedSymbols.join(', ')}
              onChange={(e) => updateTradingRestriction('allowedSymbols', 
                e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              )}
              placeholder="EURUSD, GBPUSD, USDJPY"
              rows={2}
            />
          </div>

          <div>
            <Label>Forbidden Symbols (comma-separated)</Label>
            <Textarea
              value={securitySettings.tradingRestrictions.forbiddenSymbols.join(', ')}
              onChange={(e) => updateTradingRestriction('forbiddenSymbols', 
                e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              )}
              placeholder="XAUUSD, BTCUSD"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Login Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Login Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email on Login</p>
              <p className="text-sm text-muted-foreground">
                Get notified when someone logs into your account
              </p>
            </div>
            <Switch
              checked={securitySettings.loginNotifications}
              onCheckedChange={(checked) => updateSecuritySetting('loginNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};