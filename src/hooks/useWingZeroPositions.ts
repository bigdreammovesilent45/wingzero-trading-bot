import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/types/broker';

export interface WingZeroPosition {
  id?: string;
  user_id?: string | null;
  symbol: string;
  position_type: 'buy' | 'sell';
  volume: number;
  open_price: number;
  current_price: number;
  unrealized_pnl: number;
  stop_loss?: number;
  take_profit?: number;
  opened_at: string;
  updated_at?: string;
  // Wing Zero specific fields
  order_id: string;
  ticket: number;
  commission: number;
  swap: number;
  comment?: string;
  strategy?: string;
  status: 'pending' | 'open' | 'closed' | 'cancelled';
}

export const useWingZeroPositions = () => {
  const [positions, setPositions] = useState<WingZeroPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPositions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('wingzero_positions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setPositions(data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch Wing Zero positions';
      setError(errorMsg);
      console.error("Wing Zero positions fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncMT5Position = useCallback(async (order: Order): Promise<WingZeroPosition | null> => {
    try {
      const positionData: Omit<WingZeroPosition, 'id' | 'updated_at'> = {
        symbol: order.symbol,
        position_type: order.side,
        volume: order.volume,
        open_price: order.openPrice,
        current_price: order.currentPrice,
        unrealized_pnl: order.profit,
        stop_loss: order.stopLoss,
        take_profit: order.takeProfit,
        opened_at: order.openTime,
        order_id: order.id,
        ticket: order.ticket,
        commission: order.commission,
        swap: order.swap,
        comment: order.comment,
        status: order.status,
        user_id: null
      };

      // Check if position already exists
      const { data: existing } = await supabase
        .from('wingzero_positions')
        .select('*')
        .eq('order_id', order.id)
        .single();

      if (existing) {
        // Update existing position
        const { data, error: updateError } = await supabase
          .from('wingzero_positions')
          .update({
            current_price: order.currentPrice,
            unrealized_pnl: order.profit,
            status: order.status,
            commission: order.commission,
            swap: order.swap
          })
          .eq('order_id', order.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return data;
      } else {
        // Create new position
        const { data, error: createError } = await supabase
          .from('wingzero_positions')
          .insert(positionData)
          .select()
          .single();

        if (createError) throw createError;
        return data;
      }
    } catch (error) {
      console.error('Failed to sync MT5 position:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync position with database",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  const updatePositionPrice = useCallback(async (orderId: string, currentPrice: number, profit: number) => {
    try {
      const { error: updateError } = await supabase
        .from('wingzero_positions')
        .update({
          current_price: currentPrice,
          unrealized_pnl: profit
        })
        .eq('order_id', orderId);

      if (updateError) throw updateError;
      
      // Update local state
      setPositions(prev => prev.map(pos => 
        pos.order_id === orderId 
          ? { ...pos, current_price: currentPrice, unrealized_pnl: profit }
          : pos
      ));
    } catch (error) {
      console.error('Failed to update position price:', error);
    }
  }, []);

  const closePosition = useCallback(async (orderId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('wingzero_positions')
        .update({ status: 'closed' })
        .eq('order_id', orderId);

      if (updateError) throw updateError;
      
      // Update local state
      setPositions(prev => prev.map(pos => 
        pos.order_id === orderId 
          ? { ...pos, status: 'closed' as const }
          : pos
      ));

      toast({
        title: "Position Closed",
        description: `Position ${orderId} has been closed`,
      });
    } catch (error) {
      console.error('Failed to close position:', error);
      toast({
        title: "Error",
        description: "Failed to close position",
        variant: "destructive"
      });
    }
  }, [toast]);

  const getOpenPositions = useCallback(() => {
    return positions.filter(pos => pos.status === 'open');
  }, [positions]);

  const getTotalPnL = useCallback(() => {
    return positions
      .filter(pos => pos.status === 'open')
      .reduce((total, pos) => total + pos.unrealized_pnl, 0);
  }, [positions]);

  // Fetch positions on mount
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return {
    positions,
    isLoading,
    error,
    fetchPositions,
    syncMT5Position,
    updatePositionPrice,
    closePosition,
    getOpenPositions,
    getTotalPnL
  };
};