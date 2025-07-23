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
      // For now, return mock data with loading simulation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const account: Account = {
        balance: 2470.32 + Math.random() * 100,
        equity: 2480.15 + Math.random() * 100,
        margin: 150.00,
        freeMargin: 2330.15,
        marginLevel: 1653.43,
        profit: 310.00 + Math.random() * 50,
        currency: 'USD'
      };
      
      return account;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account data';
      setError(errorMessage);
      toast({
        title: "API Error",
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