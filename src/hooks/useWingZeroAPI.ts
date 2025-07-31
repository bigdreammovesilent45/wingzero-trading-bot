import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from './useLocalStorage';
import { EnhancedWingZeroAPI } from '@/services/EnhancedWingZeroAPI';
import { WingZeroAPI, MockWingZeroAPI } from '@/services/WingZeroAPI';
import { 
  WingZeroConfig, 
  WingZeroAccount, 
  WingZeroPosition, 
  WingZeroOrder, 
  WingZeroSymbol,
  WingZeroNotification 
} from '@/types/wingzero';
import { Account } from '@/types/trading';

export const useWingZeroAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [config, setConfig] = useLocalStorage<WingZeroConfig | null>('wingzero_config', null);
  const [useMockData, setUseMockData] = useLocalStorage('wingzero_mock_mode', true);
  const { toast } = useToast();

  // Initialize API instance with enhanced capabilities
  const api = config 
    ? (useMockData ? new MockWingZeroAPI(config) : new EnhancedWingZeroAPI(config))
    : null;

  // Test connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!api) {
      setError('API not configured');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isConnected = await api.testConnection();
      setIsConnected(isConnected);
      
      if (isConnected) {
        toast({
          title: "✅ Connection Successful",
          description: "Wing Zero API is responding correctly",
        });
      } else {
        throw new Error('Connection test failed');
      }
      
      return isConnected;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      setError(errorMessage);
      setIsConnected(false);
      
      toast({
        title: "❌ Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [api, toast]);

  // Account data
  const getAccountData = useCallback(async (): Promise<Account> => {
    if (!api) {
      throw new Error('API not configured');
    }

    setIsLoading(true);
    setError(null);

    try {
      const wingZeroAccount = await api.getAccount();
      
      // Convert WingZeroAccount to Account interface
      const account: Account = {
        balance: wingZeroAccount.balance,
        equity: wingZeroAccount.equity,
        margin: wingZeroAccount.margin,
        freeMargin: wingZeroAccount.freeMargin,
        marginLevel: wingZeroAccount.marginLevel,
        profit: wingZeroAccount.profit,
        currency: wingZeroAccount.currency
      };
      
      return account;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account data';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  // Positions
  const getPositions = useCallback(async (): Promise<WingZeroPosition[]> => {
    if (!api) {
      throw new Error('API not configured');
    }

    setIsLoading(true);
    setError(null);

    try {
      return await api.getPositions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch positions';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  // Orders
  const getOrders = useCallback(async (): Promise<WingZeroOrder[]> => {
    if (!api) {
      throw new Error('API not configured');
    }

    setIsLoading(true);
    setError(null);

    try {
      return await api.getOrders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  // Symbols
  const getSymbols = useCallback(async (): Promise<WingZeroSymbol[]> => {
    if (!api) {
      throw new Error('API not configured');
    }

    setIsLoading(true);
    setError(null);

    try {
      return await api.getSymbols();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch symbols';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  // Notifications
  const getNotifications = useCallback(async (unreadOnly = false): Promise<WingZeroNotification[]> => {
    if (!api) {
      throw new Error('API not configured');
    }

    try {
      return await api.getNotifications(unreadOnly);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      return [];
    }
  }, [api]);

  // Trading operations
  const placeOrder = useCallback(async (order: Partial<WingZeroOrder>): Promise<WingZeroOrder> => {
    if (!api) {
      throw new Error('API not configured');
    }

    setIsLoading(true);
    setError(null);

    try {
      const placedOrder = await api.placeOrder(order);
      
      toast({
        title: "✅ Order Placed",
        description: `${order.type?.toUpperCase()} ${order.volume} ${order.symbol}`,
      });
      
      return placedOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place order';
      setError(errorMessage);
      
      toast({
        title: "❌ Order Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, toast]);

  const closePosition = useCallback(async (positionId: string, volume?: number) => {
    if (!api) {
      throw new Error('API not configured');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.closePosition(positionId, volume);
      
      toast({
        title: "✅ Position Closed",
        description: volume ? `Partial close: ${volume}` : "Position fully closed",
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close position';
      setError(errorMessage);
      
      toast({
        title: "❌ Close Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, toast]);

  // WebSocket connection
  const connectWebSocket = useCallback(async (onMessage: (data: any) => void) => {
    if (!api) {
      throw new Error('API not configured');
    }

    try {
      await api.connectWebSocket(onMessage, (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "🔄 Connection Issue",
          description: "Real-time data connection lost. Attempting to reconnect...",
          variant: "destructive",
        });
      });
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
    }
  }, [api, toast]);

  const disconnectWebSocket = useCallback(async () => {
    if (api) {
      await api.disconnectWebSocket();
    }
  }, [api]);

  // Configuration management
  const updateConfig = useCallback((newConfig: WingZeroConfig) => {
    setConfig(newConfig);
    setIsConnected(false);
  }, [setConfig]);

  const clearConfig = useCallback(() => {
    setConfig(null);
    setIsConnected(false);
  }, [setConfig]);

  // Phase 5: High-Performance Operations
  const executeHighPerformanceComputation = useCallback(async (
    type: 'portfolio_optimization' | 'risk_calculation' | 'monte_carlo' | 'matrix_operations',
    data: any,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<any> => {
    if (!api || !(api as any).executeHighPerformanceComputation) {
      throw new Error('High-Performance Engine not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await (api as any).executeHighPerformanceComputation(type, data, priority);
      
      toast({
        title: "⚡ High-Performance Computation Complete",
        description: `${type} executed successfully with ${priority} priority`,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'High-performance computation failed';
      setError(errorMessage);
      toast({
        title: "❌ Computation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, toast]);

  const executeUltraFastTrade = useCallback(async (order: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    orderType: 'market' | 'limit';
    price?: number;
    timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'DAY';
  }): Promise<string> => {
    if (!api || !(api as any).executeUltraFastTrade) {
      throw new Error('Ultra-Fast Trading Engine not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const orderId = await (api as any).executeUltraFastTrade({
        userId: 'current_user', // This would come from user context
        ...order
      });
      
      toast({
        title: "⚡ Ultra-Fast Trade Executed",
        description: `Order ${orderId} placed with ultra-low latency`,
      });

      return orderId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ultra-fast trade failed';
      setError(errorMessage);
      toast({
        title: "❌ Ultra-Fast Trade Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, toast]);

  const runPerformanceBenchmark = useCallback(async (): Promise<any> => {
    if (!api || !(api as any).runPerformanceBenchmark) {
      throw new Error('Performance Benchmark not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const benchmark = await (api as any).runPerformanceBenchmark();
      
      toast({
        title: "🏁 Performance Benchmark Complete",
        description: `Overall Score: ${benchmark.overallScore.toFixed(1)}`,
      });

      return benchmark;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Performance benchmark failed';
      setError(errorMessage);
      toast({
        title: "❌ Benchmark Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, toast]);

  const getPerformanceMetrics = useCallback(async (): Promise<any> => {
    if (!api || !(api as any).getPerformanceMetrics) {
      throw new Error('Performance Metrics not available');
    }

    try {
      return await (api as any).getPerformanceMetrics();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get performance metrics';
      setError(errorMessage);
      throw err;
    }
  }, [api]);

  const getSystemHealth = useCallback(async (): Promise<any> => {
    if (!api || !(api as any).getSystemHealth) {
      throw new Error('System Health not available');
    }

    try {
      return await (api as any).getSystemHealth();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get system health';
      setError(errorMessage);
      throw err;
    }
  }, [api]);

  // Auto-test connection when config changes (only for mock mode)
  useEffect(() => {
    if (config && !isConnected && useMockData) {
      console.log('🔧 Auto-testing Wing Zero connection in mock mode...');
      testConnection();
    }
  }, [config, isConnected, useMockData, testConnection]);

  return {
    // State
    isLoading,
    error,
    isConnected,
    isConfigured: !!config,
    useMockData,
    config,

    // Configuration
    updateConfig,
    clearConfig,
    setUseMockData,

    // Connection
    testConnection,
    connectWebSocket,
    disconnectWebSocket,

    // Data fetching
    getAccountData,
    getPositions,
    getOrders,
    getSymbols,
    getNotifications,

    // Trading
    placeOrder,
    closePosition,

    // Phase 5: High-Performance Operations
    executeHighPerformanceComputation,
    executeUltraFastTrade,
    runPerformanceBenchmark,
    getPerformanceMetrics,
    getSystemHealth,

    // Utilities
    clearError: () => setError(null),
  };
};