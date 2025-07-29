import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  table_name?: string | null;
  ip_address?: unknown;
  user_agent?: string | null;
  created_at: string;
  new_values?: any;
  old_values?: any;
  record_id?: string | null;
  user_id?: string | null;
}

export const SecurityMonitor = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchAuditLogs();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(!!data);
    } catch (error: any) {
      console.error('Failed to check admin status:', error);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // If not admin, only show own logs
      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('signin') || action.includes('signup')) return 'default';
    if (action.includes('api')) return 'secondary';
    if (action.includes('delete') || action.includes('error')) return 'destructive';
    return 'outline';
  };

  const getSecurityRisk = (action: string, ipAddress?: unknown) => {
    // Simple risk assessment
    if (action.includes('failed') || action.includes('error')) return 'high';
    if (action.includes('api') && !ipAddress) return 'medium';
    if (action.includes('signin') && String(ipAddress).includes('unknown')) return 'medium';
    return 'low';
  };

  if (!user) {
    return <div>Please log in to view security monitor</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Monitor
          </CardTitle>
          <CardDescription>
            {isAdmin ? 'System-wide' : 'Your'} security activity and audit logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Badge variant={isAdmin ? 'default' : 'secondary'}>
                {isAdmin ? 'Admin View' : 'User View'}
              </Badge>
              <Badge variant="outline">
                <Eye className="w-3 h-3 mr-1" />
                {auditLogs.length} events
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAuditLogs}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => {
                    const risk = getSecurityRisk(log.action, log.ip_address);
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {risk === 'high' && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                            <Badge
                              variant={
                                risk === 'high'
                                  ? 'destructive'
                                  : risk === 'medium'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {risk}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">
                            {String(log.ip_address) || 'unknown'}
                          </code>
                        </TableCell>
                        <TableCell>
                          {log.table_name && (
                            <span className="text-sm text-muted-foreground">
                              Table: {log.table_name}
                            </span>
                          )}
                          {log.new_values && Object.keys(log.new_values).length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {Object.keys(log.new_values).join(', ')}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};