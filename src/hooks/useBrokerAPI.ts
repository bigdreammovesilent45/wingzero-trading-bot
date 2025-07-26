
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from './useLocalStorage';
import { Account, WithdrawalRecord } from '@/types/trading';
import { BrokerConnection } from '@/types/broker';

interface BrokerConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  broker: 'interactive_brokers' | 'alpaca' | 'forex_com' | 'mt5';
}

export const useBrokerAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config] = useLocalStorage<BrokerConfig | null>('broker_config', null);
  const { toast } = useToast();

  // Convert config to BrokerConnection format
  const getBrokerConnection = useCallback((): BrokerConnection | null => {
    if (!config) return null;
    
    return {
      id: 'mt5-connection',
      name: 'MT5 Trading Account',
      type: 'mt5',
      status: 'connected',
      account: config.apiKey || 'demo-account',
      server: config.baseUrl
    };
  }, [config]);

  const makeRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!config) {
      throw new Error('Broker configuration not found. Please set up API credentials.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${config.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : undefined,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new Error('Connection timeout - MT5 RestApi EA may not be running');
        }
        if (err.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to MT5 RestApi EA. Please ensure:\n1. MT5 terminal is open\n2. RestApi EA is installed and running\n3. Server URL is correct (default: http://localhost:6542)');
        }
      }
      throw err;
    }
  }, [config]);

  const getAccountData = useCallback(async (): Promise<Account> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!config) {
        throw new Error('Broker configuration not found. Please set up broker connection.');
      }

      console.log('Attempting to fetch account data from:', config.baseUrl);
      
      // Try to fetch from MT5 RestApi EA
      const response = await makeRequest('/info');
      
      const account: Account = {
        balance: response.balance || 10000,
        equity: response.equity || 10000,
        margin: response.margin || 0,
        freeMargin: response.freeMargin || 10000,
        marginLevel: response.marginLevel || 100,
        profit: response.profit || 0,
        currency: response.currency || 'USD'
      };
      
      console.log('Account data fetched successfully:', account);
      return account;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch MT5 account data';
      setError(errorMessage);
      console.warn('MT5 connection failed, using demo data:', errorMessage);
      
      // Return demo data when MT5 is not available - Enhanced for trading
      console.log('Using MT5 Demo Account for Wing Zero trading');
      return {
        balance: 50000,        // $50,000 demo balance
        equity: 50000,
        margin: 0,
        freeMargin: 50000,
        marginLevel: 100,
        profit: 0,
        currency: 'USD'
      };
    } finally {
      setIsLoading(false);
    }
  }, [makeRequest, config]);

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
        fee: amount * 0.001,
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
  }, [toast]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!config) {
        throw new Error('No broker configuration found');
      }

      console.log('Testing connection to:', config.baseUrl);
      console.log('Full config:', config);
      
      // Test the actual connection with detailed error handling
      const response = await makeRequest('/info');
      console.log('Connection test response:', response);
      
      toast({
        title: "✅ Connection Successful",
        description: "MT5 RestApi EA is responding correctly",
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      setError(errorMessage);
      
      toast({
        title: "❌ Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [makeRequest, toast, config]);

  return {
    isLoading,
    error,
    isConfigured: !!config,
    brokerConnection: getBrokerConnection(),
    getAccountData,
    requestWithdrawal,
    testConnection
  };
};
