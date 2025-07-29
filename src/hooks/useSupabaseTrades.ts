import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trade } from '@/types/trading';
import { useToast } from '@/hooks/use-toast';

export interface SupabaseTrade {
  id: string;
  symbol: string;
  trade_type: string;
  volume: number;
  open_price: number;
  close_price?: number;
  profit: number;
  status: string;
  opened_at: string;
  closed_at?: string;
  created_at: string;
}

export const useSupabaseTrades = () => {
  const [trades, setTrades] = useState<SupabaseTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTrades = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setTrades(data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch trades';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTrade = async (trade: Omit<SupabaseTrade, 'id' | 'created_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('trades')
        .insert(trade)
        .select()
        .single();

      if (insertError) throw insertError;
      
      setTrades(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Trade created successfully",
      });
      
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create trade';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateTrade = async (id: string, updates: Partial<SupabaseTrade>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('trades')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      setTrades(prev => prev.map(trade => trade.id === id ? data : trade));
      toast({
        title: "Success",
        description: "Trade updated successfully",
      });
      
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update trade';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    }
  };

  const closeTrade = async (id: string, closePrice: number) => {
    try {
      const trade = trades.find(t => t.id === id);
      if (!trade) throw new Error('Trade not found');

      const profit = trade.trade_type === 'buy' 
        ? (closePrice - trade.open_price) * trade.volume
        : (trade.open_price - closePrice) * trade.volume;

      await updateTrade(id, {
        close_price: closePrice,
        profit,
        status: 'closed',
        closed_at: new Date().toISOString()
      });
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  return {
    trades,
    isLoading,
    error,
    fetchTrades,
    createTrade,
    updateTrade,
    closeTrade,
    clearError: () => setError(null)
  };
};