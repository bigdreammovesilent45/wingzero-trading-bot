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

  const callAIBrainAPI = async (action: string, data?: any) => {
    setLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('ai-brain-analysis', {
        body: { action, data }
      });

      if (error) throw error;
      return response;
    } catch (error: any) {
      toast({
        title: "AI Brain Error",
        description: error.message || 'Failed to call AI Brain API',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const callMarketIntelligenceAPI = async (action: string, params?: any) => {
    setLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('market-intelligence', {
        body: { action, params }
      });

      if (error) throw error;
      return response;
    } catch (error: any) {
      toast({
        title: "Market Intelligence Error",
        description: error.message || 'Failed to call Market Intelligence API',
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
    callAIBrainAPI,
    callMarketIntelligenceAPI,
  };
};