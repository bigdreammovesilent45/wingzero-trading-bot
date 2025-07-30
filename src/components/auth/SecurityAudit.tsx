import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, CheckCircle, Clock, Globe, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface SecurityEvent {
  id: string;
  event_type: string;
  event_description: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  metadata?: any;
  created_at: string;
}

interface SecuritySettings {
  two_factor_enabled: boolean;
  login_notifications: boolean;
  session_timeout: number;
  max_login_attempts: number;
  password_expiry_days: number;
  last_password_change?: string;
}

export const SecurityAudit = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchSecurityData();
    }
  }, [user]);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      // Fetch security events
      const { data: auditData, error: auditError } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (auditError) throw auditError;
      setEvents((auditData || []).map(event => ({
        ...event,
        ip_address: event.ip_address as string,
        user_agent: event.user_agent as string,
        metadata: event.metadata as any
      })));

      // Fetch security settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (settingsError) throw settingsError;
      setSettings(settingsData);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logSecurityEvent = async (eventType: string, description: string, success: boolean = true) => {
    try {
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user?.id,
          event_type: eventType,
          event_description: description,
          success,
          ip_address: await getUserIP(),
          user_agent: navigator.userAgent,
        });
      
      fetchSecurityData(); // Refresh events
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  };

  const getEventIcon = (eventType: string, success: boolean) => {
    if (!success) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    
    switch (eventType) {
      case 'login':
        return <Shield className="w-4 h-4 text-green-500" />;
      case 'logout':
        return <Activity className="w-4 h-4 text-blue-500" />;
      case 'password_change':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case '2fa_enable':
      case '2fa_disable':
        return <Shield className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventSeverity = (eventType: string, success: boolean) => {
    if (!success) return 'destructive';
    
    switch (eventType) {
      case 'login':
      case 'logout':
        return 'default';
      case 'password_change':
      case '2fa_enable':
        return 'secondary';
      case '2fa_disable':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSecurityScore = () => {
    if (!settings) return 0;
    
    let score = 0;
    if (settings.two_factor_enabled) score += 30;
    if (settings.login_notifications) score += 20;
    if (settings.session_timeout <= 60) score += 20;
    if (settings.max_login_attempts <= 5) score += 15;
    if (settings.password_expiry_days <= 90) score += 15;
    
    return score;
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const testSecurityEvent = () => {
    logSecurityEvent('manual_test', 'Security audit test event triggered by user');
    toast({
      title: "Test Event Created",
      description: "A test security event has been logged",
    });
  };

  if (loading) {
    return <div>Loading security audit...</div>;
  }

  const securityScore = getSecurityScore();

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Overview
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Security Score:</span>
              <span className={`font-bold text-lg ${getSecurityScoreColor(securityScore)}`}>
                {securityScore}%
              </span>
            </div>
          </CardTitle>
          <CardDescription>
            Your account security status and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium">Account Active</p>
                <p className="text-sm text-muted-foreground">No security issues detected</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium">Last Login</p>
                <p className="text-sm text-muted-foreground">
                  {events.find(e => e.event_type === 'login')?.created_at 
                    ? format(new Date(events.find(e => e.event_type === 'login')!.created_at), 'PPp')
                    : 'Never'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <Globe className="w-8 h-8 text-orange-600" />
              <div>
                <p className="font-medium">Recent IP</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {events.find(e => e.ip_address)?.ip_address || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      {settings && securityScore < 100 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Security Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!settings.two_factor_enabled && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Enable Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account (+30 points)
                    </p>
                  </div>
                </div>
              )}
              
              {settings.session_timeout > 60 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Reduce Session Timeout</p>
                    <p className="text-sm text-muted-foreground">
                      Set session timeout to 60 minutes or less (+20 points)
                    </p>
                  </div>
                </div>
              )}
              
              {!settings.login_notifications && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Enable Login Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified of any login attempts (+20 points)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Security Events
            </div>
            <Button variant="outline" size="sm" onClick={testSecurityEvent}>
              Test Event
            </Button>
          </CardTitle>
          <CardDescription>
            Latest security-related activities on your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.length > 0 ? (
              events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getEventIcon(event.event_type, event.success)}
                    <div>
                      <p className="font-medium">{event.event_description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{format(new Date(event.created_at), 'PPp')}</span>
                        {event.ip_address && (
                          <span className="font-mono">• {event.ip_address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getEventSeverity(event.event_type, event.success) as any}>
                    {event.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No security events recorded</p>
                <p className="text-sm">Security events will appear here as they occur</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};