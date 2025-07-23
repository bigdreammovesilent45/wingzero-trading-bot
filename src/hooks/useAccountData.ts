
import { useState, useEffect } from 'react';
import { Account } from '@/types/trading';
import { useBrokerAPI } from './useBrokerAPI';

export const useAccountData = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getAccountData, isConfigured, brokerConnection } = useBrokerAPI();
  
  // Use broker connection status for real-time connectivity
  const isConnected = isConfigured && !!brokerConnection;

  // Initial data fetch
  useEffect(() => {
    const fetchAccountData = async () => {
      if (!isConfigured) {
        setError('Broker API not configured. Please set up MT5 connection in Settings.');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching account data from MT5...');
        setIsLoading(true);
        const accountData = await getAccountData();
        setAccount(accountData);
        setError(null);
        console.log('Account data fetched successfully:', accountData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch account data';
        console.error('Account data fetch failed:', errorMsg);
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAccountData, 30000);
    return () => clearInterval(interval);
  }, [getAccountData, isConfigured]);

  const refreshAccount = async () => {
    try {
      console.log('Manually refreshing account data...');
      setIsLoading(true);
      const accountData = await getAccountData();
      setAccount(accountData);
      setError(null);
      console.log('Account data refreshed successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh account data';
      console.error('Account refresh failed:', errorMsg);
      setError(errorMsg);
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
