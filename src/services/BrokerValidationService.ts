import { supabase } from '@/integrations/supabase/client';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  latency: number;
  connectivity: 'excellent' | 'good' | 'poor' | 'failed';
}

export interface BrokerTestSuite {
  connectionTest: boolean;
  authenticationTest: boolean;
  marketDataTest: boolean;
  orderExecutionTest: boolean;
  positionManagementTest: boolean;
  riskManagementTest: boolean;
  latencyTest: boolean;
  failoverTest: boolean;
}

export class BrokerValidationService {
  private testResults: Map<string, ValidationResult> = new Map();
  private isRunning = false;

  async initialize(): Promise<void> {
    console.log('🔧 Production Broker Validation Service initialized');
  }

  async runFullValidationSuite(brokerType: 'oanda' | 'ctrader'): Promise<BrokerTestSuite> {
    console.log(`🧪 Running full production validation suite for ${brokerType.toUpperCase()}`);
    this.isRunning = true;

    const results: BrokerTestSuite = {
      connectionTest: await this.testBrokerConnection(brokerType),
      authenticationTest: await this.testAuthentication(brokerType),
      marketDataTest: await this.testMarketDataFeed(brokerType),
      orderExecutionTest: await this.testOrderExecution(brokerType),
      positionManagementTest: await this.testPositionManagement(brokerType),
      riskManagementTest: await this.testRiskManagement(brokerType),
      latencyTest: await this.testLatency(brokerType),
      failoverTest: await this.testFailover(brokerType)
    };

    await this.logValidationResults(brokerType, results);
    this.isRunning = false;

    console.log('✅ Production validation suite completed:', results);
    return results;
  }

  private async testBrokerConnection(brokerType: string): Promise<boolean> {
    try {
      const startTime = performance.now();
      
      // Test connection stability
      for (let i = 0; i < 5; i++) {
        const { data, error } = await supabase.functions.invoke('secure-broker-api', {
          body: { action: 'test_connection', broker: brokerType }
        });
        
        if (error) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const endTime = performance.now();
      const latency = endTime - startTime;

      this.testResults.set('connection', {
        isValid: true,
        errors: [],
        warnings: latency > 5000 ? ['High connection latency detected'] : [],
        latency,
        connectivity: latency < 1000 ? 'excellent' : latency < 3000 ? 'good' : 'poor'
      });

      return true;
    } catch (error) {
      this.testResults.set('connection', {
        isValid: false,
        errors: [`Connection failed: ${error}`],
        warnings: [],
        latency: 0,
        connectivity: 'failed'
      });
      return false;
    }
  }

  private async testAuthentication(brokerType: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('secure-broker-api', {
        body: { action: 'authenticate', broker: brokerType }
      });

      if (error) throw error;

      // Test token refresh
      await new Promise(resolve => setTimeout(resolve, 2000));
      const { data: refreshData, error: refreshError } = await supabase.functions.invoke('secure-broker-api', {
        body: { action: 'refresh_token', broker: brokerType }
      });

      if (refreshError) throw refreshError;

      return true;
    } catch (error) {
      console.error('Authentication test failed:', error);
      return false;
    }
  }

  private async testMarketDataFeed(brokerType: string): Promise<boolean> {
    try {
      const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCHF'];
      const startTime = performance.now();

      for (const symbol of symbols) {
        const { data, error } = await supabase.functions.invoke('secure-broker-api', {
          body: { action: 'get_quotes', broker: brokerType, symbol }
        });

        if (error) throw error;
        if (!data?.bid || !data?.ask) throw new Error(`Invalid quote data for ${symbol}`);
      }

      const endTime = performance.now();
      const latency = (endTime - startTime) / symbols.length;

      console.log(`📊 Market data feed test: ${latency.toFixed(2)}ms avg per symbol`);
      return latency < 500; // Must be under 500ms per symbol
    } catch (error) {
      console.error('Market data feed test failed:', error);
      return false;
    }
  }

  private async testOrderExecution(brokerType: string): Promise<boolean> {
    try {
      // Test order placement speed and accuracy
      const testOrder = {
        symbol: 'EURUSD',
        type: 'market',
        side: 'buy',
        volume: 0.01,
        stopLoss: 1.0800,
        takeProfit: 1.0900
      };

      const startTime = performance.now();
      
      const { data, error } = await supabase.functions.invoke('secure-broker-api', {
        body: { 
          action: 'place_test_order', 
          broker: brokerType, 
          order: testOrder 
        }
      });

      const executionTime = performance.now() - startTime;

      if (error) throw error;
      
      // Verify order was placed correctly
      if (!data?.orderId) throw new Error('Order ID not returned');

      // Test order modification
      const { data: modifyData, error: modifyError } = await supabase.functions.invoke('secure-broker-api', {
        body: { 
          action: 'modify_test_order', 
          broker: brokerType, 
          orderId: data.orderId,
          stopLoss: 1.0790
        }
      });

      if (modifyError) throw modifyError;

      // Test order cancellation
      const { error: cancelError } = await supabase.functions.invoke('secure-broker-api', {
        body: { 
          action: 'cancel_test_order', 
          broker: brokerType, 
          orderId: data.orderId
        }
      });

      if (cancelError) throw cancelError;

      console.log(`⚡ Order execution test: ${executionTime.toFixed(2)}ms`);
      return executionTime < 2000; // Must execute within 2 seconds
    } catch (error) {
      console.error('Order execution test failed:', error);
      return false;
    }
  }

  private async testPositionManagement(brokerType: string): Promise<boolean> {
    try {
      // Test position tracking accuracy
      const { data, error } = await supabase.functions.invoke('secure-broker-api', {
        body: { action: 'get_positions', broker: brokerType }
      });

      if (error) throw error;

      // Verify position data integrity
      if (Array.isArray(data)) {
        for (const position of data) {
          if (!position.id || !position.symbol || position.volume === undefined) {
            throw new Error('Invalid position data structure');
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Position management test failed:', error);
      return false;
    }
  }

  private async testRiskManagement(brokerType: string): Promise<boolean> {
    try {
      // Test risk calculation accuracy
      const { data, error } = await supabase.functions.invoke('secure-broker-api', {
        body: { 
          action: 'calculate_risk', 
          broker: brokerType,
          symbol: 'EURUSD',
          volume: 1.0,
          stopLoss: 1.0800
        }
      });

      if (error) throw error;
      
      if (!data?.riskAmount || !data?.marginRequired) {
        throw new Error('Invalid risk calculation response');
      }

      return true;
    } catch (error) {
      console.error('Risk management test failed:', error);
      return false;
    }
  }

  private async testLatency(brokerType: string): Promise<boolean> {
    try {
      const tests = 10;
      const latencies: number[] = [];

      for (let i = 0; i < tests; i++) {
        const startTime = performance.now();
        
        const { error } = await supabase.functions.invoke('secure-broker-api', {
          body: { action: 'ping', broker: brokerType }
        });

        const latency = performance.now() - startTime;
        latencies.push(latency);

        if (error) throw error;
      }

      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / tests;
      const maxLatency = Math.max(...latencies);

      console.log(`🏃 Latency test: avg ${avgLatency.toFixed(2)}ms, max ${maxLatency.toFixed(2)}ms`);
      
      return avgLatency < 500 && maxLatency < 1000;
    } catch (error) {
      console.error('Latency test failed:', error);
      return false;
    }
  }

  private async testFailover(brokerType: string): Promise<boolean> {
    try {
      // Test connection resilience
      const { data, error } = await supabase.functions.invoke('secure-broker-api', {
        body: { action: 'test_failover', broker: brokerType }
      });

      if (error) throw error;
      return data?.failoverWorks === true;
    } catch (error) {
      console.error('Failover test failed:', error);
      return false;
    }
  }

  private async logValidationResults(brokerType: string, results: BrokerTestSuite): Promise<void> {
    try {
      await supabase.from('wingzero_diagnostics').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        component: 'broker_validation',
        health_status: Object.values(results).every(Boolean) ? 'healthy' : 'warning',
        metrics: {
          broker: brokerType,
          results: JSON.parse(JSON.stringify(results)),
          timestamp: new Date().toISOString(),
          testResults: JSON.parse(JSON.stringify(Object.fromEntries(this.testResults)))
        }
      });
    } catch (error) {
      console.error('Failed to log validation results:', error);
    }
  }

  async getContinuousMonitoring(): Promise<{ isHealthy: boolean; issues: string[] }> {
    const results = Array.from(this.testResults.values());
    const issues: string[] = [];
    
    for (const result of results) {
      issues.push(...result.errors);
      issues.push(...result.warnings);
    }

    return {
      isHealthy: results.every(r => r.isValid) && issues.length === 0,
      issues
    };
  }

  getValidationResults(): Map<string, ValidationResult> {
    return this.testResults;
  }

  isValidationRunning(): boolean {
    return this.isRunning;
  }
}