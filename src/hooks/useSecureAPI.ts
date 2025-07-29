import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSecureAPI = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callSecureWingZeroAPI = async (action: string, params?: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('secure-wingzero-api', {
        body: { action, params }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: "API Error",
        description: error.message || 'Failed to call WingZero API',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const callSecureBrokerAPI = async (action: string, params?: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('secure-broker-api', {
        body: { action, params }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: "API Error",
        description: error.message || 'Failed to call Broker API',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    callSecureWingZeroAPI,
    callSecureBrokerAPI,
  };
};