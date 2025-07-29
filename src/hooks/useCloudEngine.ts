import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CloudEngineStatus {
  isRunning: boolean;
  lastHeartbeat: string | null;
  lastCycle: string | null;
  engineMode: string;
  error?: string;
}

export const useCloudEngine = () => {
  const [status, setStatus] = useState<CloudEngineStatus>({
    isRunning: false,
    lastHeartbeat: null,
    lastCycle: null,
    engineMode: 'client'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check cloud engine status
  const checkStatus = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wingzero_engine_status')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching cloud engine status:', error);
        return;
      }

      if (data) {
        setStatus({
          isRunning: data.is_running,
          lastHeartbeat: data.last_heartbeat,
          lastCycle: data.last_cycle,
          engineMode: data.engine_mode
        });
      }
    } catch (error) {
      console.error('Error checking cloud engine status:', error);
    }
  }, [user]);

  // Start cloud engine
  const startCloudEngine = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log('🚀 Starting Wing Zero Cloud Engine...');

      // Call the cloud engine edge function
      const { data, error } = await supabase.functions.invoke('wingzero-cloud-engine', {
        body: {
          action: 'start'
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        await checkStatus();
        toast({
          title: "☁️ Cloud Engine Started",
          description: "Wing Zero is now running 24/7 in the cloud!",
        });
      } else {
        throw new Error(data?.message || 'Failed to start cloud engine');
      }
    } catch (error: any) {
      console.error('Error starting cloud engine:', error);
      toast({
        title: "Failed to Start Cloud Engine",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, checkStatus, toast]);

  // Stop cloud engine
  const stopCloudEngine = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log('🛑 Stopping Wing Zero Cloud Engine...');

      const { data, error } = await supabase.functions.invoke('wingzero-cloud-engine', {
        body: {
          action: 'stop'
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        await checkStatus();
        toast({
          title: "☁️ Cloud Engine Stopped",
          description: "Wing Zero cloud engine has been stopped",
        });
      } else {
        throw new Error(data?.message || 'Failed to stop cloud engine');
      }
    } catch (error: any) {
      console.error('Error stopping cloud engine:', error);
      toast({
        title: "Failed to Stop Cloud Engine",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, checkStatus, toast]);

  // Upload trading config to cloud
  const syncConfigToCloud = useCallback(async (config: any) => {
    if (!user) return;

    try {
      console.log('📤 Syncing trading config to cloud...');

      const { error } = await supabase
        .from('wingzero_configs')
        .upsert({
          user_id: user.id,
          config_name: 'default',
          brain_enabled: config.brainEnabled,
          brain_mode: config.brainMode,
          min_confidence: config.minConfidence,
          max_risk_per_trade: config.maxRiskPerTrade,
          max_daily_drawdown: config.maxDailyDrawdown,
          config_data: config
        });

      if (error) {
        throw error;
      }

      console.log('✅ Trading config synced to cloud');
    } catch (error) {
      console.error('Error syncing config to cloud:', error);
    }
  }, [user]);

  // Upload OANDA credentials to cloud (encrypted)
  const syncCredentialsToCloud = useCallback(async () => {
    if (!user) return;

    try {
      const oandaConfig = localStorage.getItem('oanda-config');
      if (!oandaConfig) {
        console.log('No OANDA config found to sync');
        return;
      }

      const config = JSON.parse(oandaConfig);
      console.log('📤 Syncing OANDA credentials to cloud...');

      // Simple encryption for demo (in production, use proper encryption)
      const encryptedApiKey = btoa(config.apiKey);
      const encryptedAccountId = btoa(config.accountId);

      const { error } = await supabase
        .from('wingzero_credentials')
        .upsert({
          user_id: user.id,
          broker_type: 'oanda',
          encrypted_api_key: encryptedApiKey,
          encrypted_account_id: encryptedAccountId,
          server_url: config.server,
          environment: config.environment
        });

      if (error) {
        throw error;
      }

      console.log('✅ OANDA credentials synced to cloud');
    } catch (error) {
      console.error('Error syncing credentials to cloud:', error);
    }
  }, [user]);

  // Real-time status updates
  useEffect(() => {
    if (!user) return;

    checkStatus();

    // Set up real-time subscription for status updates
    const subscription = supabase
      .channel('wingzero_engine_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wingzero_engine_status',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Cloud engine status updated:', payload);
          checkStatus();
        }
      )
      .subscribe();

    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [user, checkStatus]);

  return {
    status,
    isLoading,
    startCloudEngine,
    stopCloudEngine,
    syncConfigToCloud,
    syncCredentialsToCloud,
    checkStatus
  };
};