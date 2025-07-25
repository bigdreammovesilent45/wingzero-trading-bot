import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupabasePosition {
  id: string;
  symbol: string;
  position_type: 'buy' | 'sell';
  volume: number;
  open_price: number;
  current_price: number;
  unrealized_pnl: number;
  stop_loss?: number;
  take_profit?: number;
  opened_at: string;
  updated_at: string;
  user_id?: string; // Made optional for testing
}

export const useSupabasePositions = () => {
  const [positions, setPositions] = useState<SupabasePosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPositions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First, let's try without ordering to see if basic connection works
      const { data, error: fetchError } = await supabase
        .from('positions')
        .select('*');

      if (fetchError) throw fetchError;
      
      console.log("Positions data:", data);
      console.log("Columns in data:", data && data.length > 0 ? Object.keys(data[0]) : "No data");
      
      setPositions(data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch positions';
      setError(errorMsg);
      console.error("Fetch error details:", err);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createPosition = async (position: Omit<SupabasePosition, 'id' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('positions')
        .insert(position)
        .select()
        .single();

      if (insertError) throw insertError;
      
      setPositions(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Position opened successfully",
      });
      
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create position';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updatePosition = async (id: string, updates: Partial<SupabasePosition>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('positions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      setPositions(prev => prev.map(pos => pos.id === id ? data : pos));
      toast({
        title: "Success",
        description: "Position updated successfully",
      });
      
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update position';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateCurrentPrice = async (id: string, currentPrice: number) => {
    try {
      const position = positions.find(p => p.id === id);
      if (!position) throw new Error('Position not found');

      const unrealizedPnl = position.position_type === 'buy' 
        ? (currentPrice - position.open_price) * position.volume
        : (position.open_price - currentPrice) * position.volume;

      await updatePosition(id, {
        current_price: currentPrice,
        unrealized_pnl: unrealizedPnl
      });
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  return {
    positions,
    isLoading,
    error,
    fetchPositions,
    createPosition,
    updatePosition,
    updateCurrentPrice,
    clearError: () => setError(null)
  };
};