import { useState, useEffect } from 'react';
import { Account } from '@/types/trading';
import { useBrokerAPI } from './useBrokerAPI';
import { useWebSocket } from './useWebSocket';

export const useAccountData = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getAccountData, isConfigured } = useBrokerAPI();
  
  // Disable WebSocket for now since MT5 API may not support it
  // const { lastMessage, isConnected } = useWebSocket({
  //   url: 'ws://localhost:6542/ws', // MT5 WebSocket endpoint
  //   reconnectInterval: 3000,
  //   maxReconnectAttempts: 5
  // });
  const lastMessage = null;
  const isConnected = isConfigured; // Use REST API connection status instead

  // Handle real-time updates from WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'account_update') {
      setAccount(prevAccount => ({
        ...prevAccount,
        ...lastMessage.data
      }));
    }
  }, [lastMessage]);

  // Initial data fetch
  useEffect(() => {
    const fetchAccountData = async () => {
      if (!isConfigured) {
        setError('Broker API not configured');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const accountData = await getAccountData();
        setAccount(accountData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch account data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountData();
    
    // Refresh every 30 seconds as fallback
    const interval = setInterval(fetchAccountData, 30000);
    return () => clearInterval(interval);
  }, [getAccountData, isConfigured]);

  const refreshAccount = async () => {
    try {
      setIsLoading(true);
      const accountData = await getAccountData();
      setAccount(accountData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh account data');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    account,
    isLoading,
    error,
    isConnected,
    isConfigured,
    refreshAccount
  };
};