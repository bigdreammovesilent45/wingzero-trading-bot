import { useState, useEffect, useCallback, useRef } from 'react';
import { TradingEngine } from '@/services/TradingEngine';
import { Order, RiskMetrics } from '@/types/broker';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useWingZeroPositions } from './useWingZeroPositions';

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
  const [selectedPlatform] = useLocalStorage('wingzero-platform', 'ctrader');
  const [ctraderConfig] = useLocalStorage('wingzero-ctrader-config', null);
  
  // Check if platform is configured
  const isConfigured = selectedPlatform === 'ctrader' ? !!ctraderConfig : false;
  
  // Create broker connection based on selected platform
  const brokerConnection = isConfigured ? {
    id: `${selectedPlatform}-connection`,
    name: `${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Account`,
    type: selectedPlatform as "ctrader" | "cplugin" | "oanda" | "ib" | "alpaca",
    status: 'connected' as const,
    account: ctraderConfig?.accountId || 'demo',
    server: ctraderConfig?.server || 'demo.ctrader.com'
  } : null;
  const { syncPosition, updatePositionPrice, closePosition: closeDbPosition } = useWingZeroPositions();
  const hasInitialized = useRef(false);
  const isRunningRef = useRef(false);
  const isConnectedRef = useRef(false);
  const [tradingConfig] = useLocalStorage('wingzero-strategy', {
    maxRiskPerTrade: 2,
    stopLossPips: 20,
    takeProfitPips: 60,
    minSignalStrength: 70,
    minConfidence: 70,
    onePositionPerSymbol: true,
    closeOnStop: false
  });
  
  const [state, setState] = useState<TradingEngineState>({
    isRunning: false,
    isConnected: false,
    openPositions: [],
    riskMetrics: null,
    dailyPnL: 0,
    totalProfit: 0,
    error: null
  });

  // Initialize engine when broker connection is available (only once)
  useEffect(() => {
    if (brokerConnection && isConfigured && !hasInitialized.current) {
      console.log('Initializing trading engine with broker connection:', brokerConnection.name);
      hasInitialized.current = true;
      
      engine.setBrokerConnection(brokerConnection)
        .then(() => {
          setState(prev => ({ ...prev, isConnected: true, error: null }));
          console.log('Trading engine connected to broker successfully');
        })
        .catch(error => {
          console.error('Failed to connect trading engine to broker:', error);
          setState(prev => ({ ...prev, error: error.message, isConnected: false }));
        });
    } else if (!isConfigured && !hasInitialized.current) {
      // Only set error state once, not on every render
      hasInitialized.current = true;
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        error: `${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} not configured. Please set up your platform connection in Setup.` 
      }));
    }
  }, [brokerConnection, isConfigured, selectedPlatform]); // Removed engine from dependencies - it's stable

  // Update refs when state changes
  useEffect(() => {
    isRunningRef.current = state.isRunning;
    isConnectedRef.current = state.isConnected;
  }, [state.isRunning, state.isConnected]);

  // Update state periodically when engine is running
  useEffect(() => {
    if (!isRunningRef.current || !isConnectedRef.current) return;

    console.log('Starting trading engine status updates...');
    
    const updateInterval = setInterval(async () => {
      try {
        const status = engine.getEngineStatus();
        const orders = engine.getCurrentOrders();
        const metrics = engine.getCurrentRiskMetrics();
        
        // Sync positions to Supabase for real-time mirroring
        for (const order of orders) {
          if (order.status === 'open') {
            await syncPosition(order);
          }
        }
        
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
        setState(prev => ({
          ...prev,
          error: 'Failed to update engine status'
        }));
      }
    }, 2000);

    return () => {
      console.log('Stopping trading engine status updates');
      clearInterval(updateInterval);
    };
  }, []); // Empty dependency array since we use refs

  const startEngine = useCallback(async () => {
    if (!isConfigured) {
      const errorMsg = `No ${selectedPlatform} connection configured. Please set up your platform connection in Setup.`;
      setState(prev => ({ ...prev, error: errorMsg }));
      toast({
        title: "No Platform Connection",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    if (!brokerConnection) {
      const errorMsg = `${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} connection not available. Please check Setup.`;
      setState(prev => ({ ...prev, error: errorMsg }));
      toast({
        title: "Connection Error",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Starting Wing Zero trading engine...');
      setState(prev => ({ ...prev, error: null }));
      
      await engine.start({
        ...tradingConfig,
        loopInterval: 2000, // 2 second update interval
        closeOnStop: false
      });

      setState(prev => ({ ...prev, isRunning: true }));
      
      toast({
        title: "Wing Zero Started",
        description: `Trading engine is now active with ${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} synchronization`,
      });
      
      console.log('Wing Zero trading engine started successfully');
    } catch (error: any) {
      console.error('Failed to start trading engine:', error);
      setState(prev => ({ ...prev, error: error.message }));
      toast({
        title: "Failed to Start Engine",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [brokerConnection, isConfigured, engine, tradingConfig, toast]);

  const stopEngine = useCallback(async () => {
    try {
      console.log('Stopping Wing Zero trading engine...');
      await engine.stop();
      setState(prev => ({ ...prev, isRunning: false }));
      
      toast({
        title: "Wing Zero Stopped",
        description: "Trading engine has been halted",
      });
      
      console.log('Wing Zero trading engine stopped successfully');
    } catch (error: any) {
      console.error('Error stopping trading engine:', error);
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
      await closeDbPosition(orderId); // Sync to database
      
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
  }, [engine, closeDbPosition, toast]);

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
    isOperational: state.isConnected && !state.error && isConfigured
  };
};
