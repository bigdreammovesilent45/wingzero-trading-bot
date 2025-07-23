import { useState, useEffect, useCallback } from 'react';
import { TradingEngine } from '@/services/TradingEngine';
import { BrokerConnection, Order, RiskMetrics } from '@/types/broker';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface TradingEngineState {
  isRunning: boolean;
  isConnected: boolean;
  openPositions: Order[];
  riskMetrics: RiskMetrics | null;
  dailyPnL: number;
  totalProfit: number;
  error: string | null;
}

export const useTradingEngine = () => {
  const { toast } = useToast();
  const [engine] = useState(() => new TradingEngine());
  const [brokerConnection] = useLocalStorage<BrokerConnection | null>('broker-connection', null);
  const [tradingConfig] = useLocalStorage('wingzero-strategy', {});
  
  const [state, setState] = useState<TradingEngineState>({
    isRunning: false,
    isConnected: false,
    openPositions: [],
    riskMetrics: null,
    dailyPnL: 0,
    totalProfit: 0,
    error: null
  });

  // Initialize engine when broker connection is available
  useEffect(() => {
    if (brokerConnection) {
      engine.setBrokerConnection(brokerConnection)
        .then(() => {
          setState(prev => ({ ...prev, isConnected: true, error: null }));
          toast({
            title: "Broker Connected",
            description: `Connected to ${brokerConnection.name}`,
          });
        })
        .catch(error => {
          setState(prev => ({ ...prev, error: error.message }));
          toast({
            title: "Connection Failed",
            description: error.message,
            variant: "destructive"
          });
        });
    }
  }, [brokerConnection, engine, toast]);

  // Update state periodically when engine is running
  useEffect(() => {
    if (!state.isRunning) return;

    const updateInterval = setInterval(() => {
      try {
        const status = engine.getEngineStatus();
        const orders = engine.getCurrentOrders();
        const metrics = engine.getCurrentRiskMetrics();
        
        setState(prev => ({
          ...prev,
          isConnected: status.brokerConnected,
          openPositions: orders.filter(o => o.status === 'open'),
          riskMetrics: metrics,
          dailyPnL: status.dailyPnL,
          totalProfit: orders.reduce((sum, o) => sum + o.profit, 0)
        }));
      } catch (error) {
        console.error('Error updating trading engine state:', error);
      }
    }, 2000);

    return () => clearInterval(updateInterval);
  }, [state.isRunning, engine]);

  const startEngine = useCallback(async () => {
    if (!brokerConnection) {
      toast({
        title: "No Broker Connection",
        description: "Please configure a broker connection first",
        variant: "destructive"
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      
      await engine.start({
        ...tradingConfig,
        loopInterval: 2000, // 2 second update interval
        closeOnStop: false
      });

      setState(prev => ({ ...prev, isRunning: true }));
      
      toast({
        title: "Trading Engine Started",
        description: "Wing Zero is now actively trading with optimized parameters",
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      toast({
        title: "Failed to Start Engine",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [brokerConnection, engine, tradingConfig, toast]);

  const stopEngine = useCallback(async () => {
    try {
      await engine.stop();
      setState(prev => ({ ...prev, isRunning: false }));
      
      toast({
        title: "Trading Engine Stopped",
        description: "All trading operations have been halted",
      });
    } catch (error: any) {
      toast({
        title: "Error Stopping Engine",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [engine, toast]);

  const closePosition = useCallback(async (orderId: string) => {
    try {
      await engine.closePosition(orderId);
      
      toast({
        title: "Position Closed",
        description: `Position ${orderId} has been closed`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Close Position",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [engine, toast]);

  const closeAllPositions = useCallback(async () => {
    try {
      await engine.closeAllPositions();
      
      toast({
        title: "All Positions Closed",
        description: "All open positions have been closed",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Close Positions",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [engine, toast]);

  const getEngineMetrics = useCallback(() => {
    return engine.getEngineStatus();
  }, [engine]);

  return {
    // State
    ...state,
    
    // Actions
    startEngine,
    stopEngine,
    closePosition,
    closeAllPositions,
    
    // Getters
    getEngineMetrics,
    
    // Computed values
    winRate: state.riskMetrics?.winRate || 0,
    profitFactor: state.riskMetrics?.profitFactor || 0,
    currentExposure: state.riskMetrics?.totalExposure || 0,
    isOperational: state.isConnected && !state.error
  };
};