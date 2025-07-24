import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, Globe, Palette, DollarSign, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, TradingPreferences } from '@/types/wingzero';

export const AccountSettings = () => {
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('user_profile', {
    id: 'user-1',
    username: 'wingzero_trader',
    email: 'trader@wingzero.dev',
    firstName: 'Wing',
    lastName: 'Zero',
    phone: '+1-555-0123',
    country: 'US',
    timezone: 'UTC',
    language: 'en',
    avatar: '',
    emailVerified: true,
    phoneVerified: false,
    kycStatus: 'approved',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    preferences: {
      theme: 'system',
      currency: 'USD',
      notifications: {
        email: { trades: true, account: true, system: true, news: false },
        push: { trades: true, account: true, system: false, news: false },
        sms: { trades: false, account: true, security: true },
        webhook: { enabled: false, url: '', secret: '' }
      },
      trading: {
        defaultVolume: 0.1,
        riskLevel: 'moderate',
        autoTrading: false,
        copyTrading: false,
        maxSpread: 3,
        slippage: 2,
        confirmations: {
          trades: true,
          modifications: true,
          closures: false
        }
      }
    }
  });

  const [isEditing, setIsEditing] = useState({
    profile: false,
    trading: false
  });

  const [isSaving, setIsSaving] = useState(false);

  const updateProfile = (field: keyof UserProfile, value: any) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updatePreference = (category: 'theme' | 'currency', value: string) => {
    setUserProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [category]: value
      }
    }));
  };

  const updateTradingPreference = (field: keyof TradingPreferences, value: any) => {
    setUserProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        trading: {
          ...prev.preferences.trading,
          [field]: value
        }
      }
    }));
  };

  const updateTradingConfirmation = (field: string, value: boolean) => {
    setUserProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        trading: {
          ...prev.preferences.trading,
          confirmations: {
            ...prev.preferences.trading.confirmations,
            [field]: value
          }
        }
      }
    }));
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsEditing(prev => ({ ...prev, profile: false }));
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const verifyEmail = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateProfile('emailVerified', true);
      toast({
        title: "Email Verified",
        description: "Your email address has been verified.",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "There was an error verifying your email.",
        variant: "destructive"
      });
    }
  };

  const verifyPhone = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateProfile('phoneVerified', true);
      toast({
        title: "Phone Verified",
        description: "Your phone number has been verified.",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "There was an error verifying your phone.",
        variant: "destructive"
      });
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      // Simulate file upload
      const reader = new FileReader();
      reader.onload = (e) => {
        updateProfile('avatar', e.target?.result as string);
        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been updated.",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your avatar.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
            <div className="ml-auto flex gap-2">
              <Badge variant={userProfile.kycStatus === 'approved' ? "default" : "destructive"}>
                KYC: {userProfile.kycStatus}
              </Badge>
              {!isEditing.profile ? (
                <Button size="sm" onClick={() => setIsEditing(prev => ({ ...prev, profile: true }))}>
                  Edit
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button size="sm" onClick={saveProfile} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsEditing(prev => ({ ...prev, profile: false }))}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userProfile.avatar} />
              <AvatarFallback className="text-lg">
                {userProfile.firstName[0]}{userProfile.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{userProfile.firstName} {userProfile.lastName}</p>
              <p className="text-sm text-muted-foreground">@{userProfile.username}</p>
              {isEditing.profile && (
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadAvatar(file);
                    }}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Change Avatar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input
                value={userProfile.firstName}
                onChange={(e) => updateProfile('firstName', e.target.value)}
                disabled={!isEditing.profile}
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={userProfile.lastName}
                onChange={(e) => updateProfile('lastName', e.target.value)}
                disabled={!isEditing.profile}
              />
            </div>
            <div>
              <Label>Username</Label>
              <Input
                value={userProfile.username}
                onChange={(e) => updateProfile('username', e.target.value)}
                disabled={!isEditing.profile}
              />
            </div>
            <div>
              <Label>Country</Label>
              <Select 
                value={userProfile.country} 
                onValueChange={(value) => updateProfile('country', value)}
                disabled={!isEditing.profile}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="JP">Japan</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Timezone</Label>
              <Select 
                value={userProfile.timezone} 
                onValueChange={(value) => updateProfile('timezone', value)}
                disabled={!isEditing.profile}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Berlin">Berlin</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  <SelectItem value="Asia/Singapore">Singapore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Language</Label>
              <Select 
                value={userProfile.language} 
                onValueChange={(value) => updateProfile('language', value)}
                disabled={!isEditing.profile}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact & Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex gap-2">
                <Input
                  value={userProfile.email}
                  onChange={(e) => updateProfile('email', e.target.value)}
                  disabled={!isEditing.profile}
                  className="flex-1"
                />
                <div className="flex items-center gap-2">
                  {userProfile.emailVerified ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Unverified
                      </Badge>
                      <Button size="sm" onClick={verifyEmail}>
                        Verify
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  value={userProfile.phone || ''}
                  onChange={(e) => updateProfile('phone', e.target.value)}
                  disabled={!isEditing.profile}
                  className="flex-1"
                />
                <div className="flex items-center gap-2">
                  {userProfile.phoneVerified ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Unverified
                      </Badge>
                      <Button size="sm" onClick={verifyPhone}>
                        Verify
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Application Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Theme</Label>
              <Select 
                value={userProfile.preferences.theme} 
                onValueChange={(value: 'light' | 'dark' | 'system') => updatePreference('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Display Currency</Label>
              <Select 
                value={userProfile.preferences.currency} 
                onValueChange={(value) => updatePreference('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Trading Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Default Volume (lots)</Label>
              <Input
                type="number"
                value={userProfile.preferences.trading.defaultVolume}
                onChange={(e) => updateTradingPreference('defaultVolume', parseFloat(e.target.value))}
                min="0.01"
                step="0.01"
              />
            </div>

            <div>
              <Label>Risk Level</Label>
              <Select 
                value={userProfile.preferences.trading.riskLevel} 
                onValueChange={(value: 'conservative' | 'moderate' | 'aggressive') => 
                  updateTradingPreference('riskLevel', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Max Spread (pips)</Label>
              <Input
                type="number"
                value={userProfile.preferences.trading.maxSpread}
                onChange={(e) => updateTradingPreference('maxSpread', parseInt(e.target.value))}
                min="0"
              />
            </div>

            <div>
              <Label>Slippage (pips)</Label>
              <Input
                type="number"
                value={userProfile.preferences.trading.slippage}
                onChange={(e) => updateTradingPreference('slippage', parseInt(e.target.value))}
                min="0"
              />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Trading Confirmations</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <Label>Trade Entries</Label>
                <input
                  type="checkbox"
                  checked={userProfile.preferences.trading.confirmations.trades}
                  onChange={(e) => updateTradingConfirmation('trades', e.target.checked)}
                  className="rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Modifications</Label>
                <input
                  type="checkbox"
                  checked={userProfile.preferences.trading.confirmations.modifications}
                  onChange={(e) => updateTradingConfirmation('modifications', e.target.checked)}
                  className="rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Trade Closures</Label>
                <input
                  type="checkbox"
                  checked={userProfile.preferences.trading.confirmations.closures}
                  onChange={(e) => updateTradingConfirmation('closures', e.target.checked)}
                  className="rounded"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Account Created:</strong> {new Date(userProfile.createdAt).toLocaleDateString()}</p>
              <p><strong>Last Login:</strong> {new Date(userProfile.lastLogin).toLocaleString()}</p>
            </div>
            <div>
              <p><strong>Account ID:</strong> {userProfile.id}</p>
              <p><strong>Status:</strong> <Badge variant="default">Active</Badge></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};