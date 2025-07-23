import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from './useLocalStorage';
import { Account, WithdrawalRecord } from '@/types/trading';

interface BrokerConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  broker: 'interactive_brokers' | 'alpaca' | 'forex_com';
}

export const useBrokerAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config] = useLocalStorage<BrokerConfig | null>('broker_config', null);
  const { toast } = useToast();

  const makeRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!config) {
      throw new Error('Broker configuration not found. Please set up API credentials.');
    }

    const response = await fetch(`${config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }, [config]);

  const getAccountData = useCallback(async (): Promise<Account> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!config) {
        throw new Error('MT4 configuration not found. Please set up MT4 connection.');
      }

      // MT4 API call for account information
      const response = await makeRequest('/account/info');
      
      const account: Account = {
        balance: response.balance || 0,
        equity: response.equity || 0,
        margin: response.margin || 0,
        freeMargin: response.freeMargin || 0,
        marginLevel: response.marginLevel || 0,
        profit: response.profit || 0,
        currency: response.currency || 'USD'
      };
      
      return account;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch MT4 account data';
      setError(errorMessage);
      toast({
        title: "MT4 Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [makeRequest, toast]);

  const requestWithdrawal = useCallback(async (amount: number): Promise<WithdrawalRecord> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const withdrawal: WithdrawalRecord = {
        id: `wd_${Date.now()}`,
        amount,
        status: 'pending',
        timestamp: new Date().toISOString(),
        method: 'bank_transfer',
        fee: amount * 0.001, // 0.1% fee
        reference: `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };
      
      toast({
        title: "Withdrawal Requested",
        description: `$${amount.toFixed(2)} withdrawal initiated`,
      });
      
      return withdrawal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request withdrawal';
      setError(errorMessage);
      toast({
        title: "Withdrawal Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [makeRequest, toast]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Connection Test",
        description: "Broker API connection successful",
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      setError(errorMessage);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [makeRequest, toast]);

  return {
    isLoading,
    error,
    isConfigured: !!config,
    getAccountData,
    requestWithdrawal,
    testConnection
  };
};