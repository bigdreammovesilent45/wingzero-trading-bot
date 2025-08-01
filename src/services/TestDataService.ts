import { supabase } from '@/integrations/supabase/client';

export interface RealTradeData {
  id: string;
  symbol: string;
  position_type: string;
  volume: number;
  open_price: number;
  current_price: number;
  unrealized_pnl: number;
  opened_at: string;
  status?: string;
  strategy?: string;
  updated_at?: string;
  user_id?: string;
  stop_loss?: number;
  take_profit?: number;
}

export interface RealStrategyData {
  id: string;
  strategy_name: string;
  strategy_type: string;
  status: string;
  parameters: any;
  performance_metrics?: any;
}

export interface RealSecurityEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_description: string;
  ip_address: string | null;
  success: boolean;
  created_at: string;
  metadata: any;
  user_agent?: string;
}

export class TestDataService {
  private static instance: TestDataService;

  static getInstance(): TestDataService {
    if (!TestDataService.instance) {
      TestDataService.instance = new TestDataService();
    }
    return TestDataService.instance;
  }

  async getRealWingZeroPositions(): Promise<RealTradeData[]> {
    const { data, error } = await supabase
      .from('wingzero_positions')
      .select('*')
      .order('opened_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  }

  async getRealPositions(): Promise<RealTradeData[]> {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  }

  async getRealStrategies(): Promise<RealStrategyData[]> {
    const { data, error } = await supabase
      .from('wingzero_strategies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getRealSecurityEvents(): Promise<RealSecurityEvent[]> {
    const { data, error } = await supabase
      .from('security_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []).map(event => ({
      ...event,
      ip_address: event.ip_address?.toString() || 'unknown'
    }));
  }

  // Convert real data to test formats for different services
  getRealPortfolioReturns(positions: RealTradeData[]): number[][] {
    const symbols = [...new Set(positions.map(p => p.symbol))];
    return symbols.map(symbol => {
      const symbolPositions = positions.filter(p => p.symbol === symbol);
      return symbolPositions.map(p => 
        (p.current_price - p.open_price) / p.open_price
      );
    });
  }

  getRealMarketData(positions: RealTradeData[]) {
    const marketData: { [symbol: string]: Array<{ date: Date; price: number }> } = {};
    
    positions.forEach(position => {
      if (!marketData[position.symbol]) {
        marketData[position.symbol] = [];
      }
      
      marketData[position.symbol].push({
        date: new Date(position.opened_at),
        price: position.open_price
      });
      
      // Add current price as latest point
      marketData[position.symbol].push({
        date: new Date(),
        price: position.current_price
      });
    });

    return marketData;
  }

  getRealFactorReturns(positions: RealTradeData[]) {
    // Generate factor returns based on real position performance
    const marketFactor = positions.map(p => 
      (p.current_price - p.open_price) / p.open_price * 0.8
    );
    
    const smbFactor = positions.map(p => 
      Math.random() * 0.02 - 0.01 // Small-minus-big factor
    );
    
    const hmlFactor = positions.map(p => 
      Math.random() * 0.015 - 0.0075 // High-minus-low factor  
    );

    return {
      market: marketFactor,
      smb: smbFactor,
      hml: hmlFactor
    };
  }

  getComplianceTestData(strategies: RealStrategyData[]) {
    return {
      trades: strategies.map((strategy, i) => ({
        tradeId: `real_trade_${i}`,
        userId: '7a6b4f1f-cb7c-407f-9e8e-0dd9ad04ac37',
        symbol: strategy.parameters?.universeFilters?.[0] || 'EURUSD',
        volume: strategy.parameters?.riskBudget || 0.1,
        timestamp: new Date().toISOString(),
        strategyType: strategy.strategy_type,
        compliance: {
          mifidII: true,
          riskChecks: true,
          leverageCompliant: true
        }
      })),
      userConsents: [{
        userId: '7a6b4f1f-cb7c-407f-9e8e-0dd9ad04ac37',
        consentGiven: true,
        gdprCompliant: true,
        dataProcessingConsent: true,
        timestamp: new Date().toISOString()
      }]
    };
  }

  generateRealEncryptionKeys() {
    // Generate test keys (NOT for production)
    return {
      aes256Key: 'test_aes_key_32_characters_long_1234567890',
      jwtSecret: 'test_jwt_secret_for_testing_purposes_only_123456789',
      mfaSecret: 'JBSWY3DPEHPK3PXP' // Test TOTP secret
    };
  }
}