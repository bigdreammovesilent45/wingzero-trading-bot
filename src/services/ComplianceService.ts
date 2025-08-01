import { supabase } from '@/integrations/supabase/client';

export interface ComplianceReport {
  id: string;
  reportType: 'mifid_ii' | 'trade_reporting' | 'best_execution' | 'transaction_reporting';
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  data: any;
  status: 'generating' | 'completed' | 'failed';
  downloadUrl?: string;
}

export interface TradeReconstruction {
  tradeId: string;
  symbol: string;
  timestamp: string;
  orderFlow: Array<{
    timestamp: string;
    action: string;
    details: any;
    userId: string;
    ipAddress: string;
    userAgent: string;
  }>;
  marketData: Array<{
    timestamp: string;
    price: number;
    spread: number;
    liquidity: number;
  }>;
  decisionFactors: Array<{
    factor: string;
    weight: number;
    value: any;
  }>;
}

export interface DataRetentionPolicy {
  id: string;
  name: string;
  dataType: 'trades' | 'orders' | 'client_data' | 'communications' | 'market_data';
  retentionPeriod: number; // in days
  archiveAfter: number; // in days
  deleteAfter: number; // in days
  jurisdiction: 'EU' | 'US' | 'UK' | 'APAC';
  isActive: boolean;
  lastReviewed: string;
}

export interface AuditTrail {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  complianceFlags: string[];
}

export class ComplianceService {
  private static instance: ComplianceService;

  static getInstance(): ComplianceService {
    if (!ComplianceService.instance) {
      ComplianceService.instance = new ComplianceService();
    }
    return ComplianceService.instance;
  }

  // Generate MiFID II Best Execution Report
  async generateMiFIDIIReport(startDate: string, endDate: string): Promise<ComplianceReport> {
    const report: ComplianceReport = {
      id: `mifid_${Date.now()}`,
      reportType: 'mifid_ii',
      generatedAt: new Date().toISOString(),
      periodStart: startDate,
      periodEnd: endDate,
      status: 'generating',
      data: {}
    };

    try {
      // Fetch trade data for the period
      const { data: trades, error } = await (supabase as any)
        .from('trades')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      // Generate MiFID II compliance data
      const mifidData = {
        executionVenues: this.analyzeExecutionVenues(trades || []),
        bestExecutionFactors: this.analyzeBestExecutionFactors(trades || []),
        clientOrderFlow: this.analyzeClientOrderFlow(trades || []),
        costAnalysis: this.analyzeTradingCosts(trades || []),
        qualityMetrics: this.calculateQualityMetrics(trades || []),
        rtsReporting: this.generateRTSData(trades || [])
      };

      report.data = mifidData;
      report.status = 'completed';

      // Store report in database (using existing reports table)
      const { error: insertError } = await (supabase as any)
        .from('reports')
        .insert({
          user_id: 'system',
          type: report.reportType,
          title: `${report.reportType.toUpperCase()} Report`,
          format: 'json',
          data: report.data
        });

      if (insertError) console.error('Failed to store compliance report:', insertError);

      return report;
    } catch (error) {
      console.error('MiFID II report generation failed:', error);
      report.status = 'failed';
      return report;
    }
  }

  // Trade Reconstruction for audit purposes
  async reconstructTrade(tradeId: string): Promise<TradeReconstruction> {
    try {
      // Get trade details
      const { data: trade, error: tradeError } = await (supabase as any)
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (tradeError) throw tradeError;

      // Get audit trail for this trade (using existing audit_logs table)
      const { data: auditLogs, error: auditError } = await (supabase as any)
        .from('audit_logs')
        .select('*')
        .eq('record_id', tradeId)
        .order('created_at');

      if (auditError) throw auditError;

      // Reconstruct order flow
      const orderFlow = (auditLogs || []).map(log => ({
        timestamp: log.created_at || new Date().toISOString(),
        action: log.action,
        details: log.new_values,
        userId: log.user_id || '',
        ipAddress: log.ip_address?.toString() || 'unknown',
        userAgent: log.user_agent || 'unknown'
      }));

      // Get market data around trade time
      const marketData = await this.getMarketDataForTrade(trade.symbol, trade.created_at);

      // Analyze decision factors
      const decisionFactors = await this.analyzeDecisionFactors(tradeId);

      return {
        tradeId,
        symbol: trade.symbol,
        timestamp: trade.created_at,
        orderFlow,
        marketData,
        decisionFactors
      };
    } catch (error) {
      console.error('Trade reconstruction failed:', error);
      throw error;
    }
  }

  // Data Retention Management
  async enforceDataRetention(): Promise<void> {
    const policies = await this.getActiveRetentionPolicies();

    for (const policy of policies) {
      await this.enforcePolicy(policy);
    }
  }

  private async getActiveRetentionPolicies(): Promise<DataRetentionPolicy[]> {
    // Mock data for now since we don't have this table in the database
    return [
      {
        id: 'eu_trades',
        name: 'EU Trade Data Retention',
        dataType: 'trades',
        retentionPeriod: 2555,
        archiveAfter: 1095,
        deleteAfter: 2555,
        jurisdiction: 'EU',
        isActive: true,
        lastReviewed: new Date().toISOString()
      },
      {
        id: 'client_comms',
        name: 'Client Communications',
        dataType: 'communications',
        retentionPeriod: 1825,
        archiveAfter: 365,
        deleteAfter: 1825,
        jurisdiction: 'US',
        isActive: true,
        lastReviewed: new Date().toISOString()
      }
    ];
  }

  private async enforcePolicy(policy: DataRetentionPolicy): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.deleteAfter);

    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - policy.archiveAfter);

    try {
      // Archive old data
      await this.archiveData(policy.dataType, archiveDate.toISOString());

      // Delete very old data
      await this.deleteOldData(policy.dataType, cutoffDate.toISOString());

      console.log(`Enforced retention policy for ${policy.dataType}`);
    } catch (error) {
      console.error(`Failed to enforce policy for ${policy.dataType}:`, error);
    }
  }

  // Create comprehensive audit trail
  async logActivity(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldValues?: any,
    newValues?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const auditEntry: Omit<AuditTrail, 'id'> = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      sessionId: this.generateSessionId(),
      complianceFlags: this.generateComplianceFlags(action, entityType, newValues)
    };

    const { error } = await (supabase as any)
      .from('audit_logs')
      .insert(auditEntry);

    if (error) {
      console.error('Failed to log audit activity:', error);
    }
  }

  // Helper methods
  private analyzeExecutionVenues(trades: any[]): any {
    const venues = trades.reduce((acc, trade) => {
      const venue = trade.execution_venue || 'internal';
      acc[venue] = (acc[venue] || 0) + 1;
      return acc;
    }, {});

    return {
      totalTrades: trades.length,
      venueBreakdown: venues,
      primaryVenue: Object.keys(venues).reduce((a, b) => venues[a] > venues[b] ? a : b, '')
    };
  }

  private analyzeBestExecutionFactors(trades: any[]): any {
    return {
      priceImprovement: this.calculatePriceImprovement(trades),
      speedOfExecution: this.calculateExecutionSpeed(trades),
      costsAndFees: this.calculateTotalCosts(trades),
      likelihoodOfExecution: this.calculateExecutionLikelihood(trades)
    };
  }

  private analyzeClientOrderFlow(trades: any[]): any {
    return {
      orderTypes: this.categorizeOrderTypes(trades),
      executionQuality: this.assessExecutionQuality(trades),
      slippageAnalysis: this.analyzeSlippage(trades)
    };
  }

  private analyzeTradingCosts(trades: any[]): any {
    return {
      explicitCosts: {
        commissions: trades.reduce((sum, t) => sum + (t.commission || 0), 0),
        fees: trades.reduce((sum, t) => sum + (t.fees || 0), 0)
      },
      implicitCosts: {
        spread: trades.reduce((sum, t) => sum + (t.spread_cost || 0), 0),
        marketImpact: trades.reduce((sum, t) => sum + (t.market_impact || 0), 0)
      }
    };
  }

  private calculateQualityMetrics(trades: any[]): any {
    return {
      fillRate: trades.filter(t => t.status === 'filled').length / trades.length,
      averageExecutionTime: trades.reduce((sum, t) => sum + (t.execution_time || 0), 0) / trades.length,
      priceImprovement: this.calculateAveragePriceImprovement(trades)
    };
  }

  private generateRTSData(trades: any[]): any {
    // Real-time Transaction Reporting
    return {
      reportingDeadline: '15 minutes',
      reportedTrades: trades.filter(t => t.rts_reported).length,
      pendingReports: trades.filter(t => !t.rts_reported).length
    };
  }

  private async getMarketDataForTrade(symbol: string, timestamp: string): Promise<any[]> {
    // Mock market data - in real implementation, fetch from market data provider
    return [
      {
        timestamp: new Date(timestamp).toISOString(),
        price: 1.0875 + (Math.random() - 0.5) * 0.001,
        spread: 0.0001 + Math.random() * 0.0002,
        liquidity: 1000000 + Math.random() * 5000000
      }
    ];
  }

  private async analyzeDecisionFactors(tradeId: string): Promise<any[]> {
    // Mock decision factors - in real implementation, fetch from trading engine
    return [
      { factor: 'Technical Analysis', weight: 0.4, value: 'Bullish RSI divergence' },
      { factor: 'Market Sentiment', weight: 0.3, value: 'Positive news sentiment' },
      { factor: 'Risk Management', weight: 0.3, value: 'Within position limits' }
    ];
  }

  private async archiveData(dataType: string, beforeDate: string): Promise<void> {
    // Move data to archive storage
    console.log(`Archiving ${dataType} data before ${beforeDate}`);
  }

  private async deleteOldData(dataType: string, beforeDate: string): Promise<void> {
    // Delete data older than retention period
    console.log(`Deleting ${dataType} data before ${beforeDate}`);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateComplianceFlags(action: string, entityType: string, data: any): string[] {
    const flags: string[] = [];
    
    if (action === 'trade_execution' && entityType === 'trade') {
      flags.push('MiFID_II_REPORTABLE');
      if (data?.volume > 1000000) flags.push('LARGE_TRADE');
    }
    
    if (action === 'user_data_change') {
      flags.push('DATA_PROTECTION');
    }

    return flags;
  }

  // Calculation helper methods
  private calculatePriceImprovement(trades: any[]): number {
    return trades.reduce((sum, t) => sum + (t.price_improvement || 0), 0) / trades.length;
  }

  private calculateExecutionSpeed(trades: any[]): number {
    return trades.reduce((sum, t) => sum + (t.execution_time || 0), 0) / trades.length;
  }

  private calculateTotalCosts(trades: any[]): number {
    return trades.reduce((sum, t) => sum + (t.total_costs || 0), 0);
  }

  private calculateExecutionLikelihood(trades: any[]): number {
    return trades.filter(t => t.status === 'filled').length / trades.length;
  }

  private categorizeOrderTypes(trades: any[]): Record<string, number> {
    return trades.reduce((acc, trade) => {
      const type = trade.order_type || 'market';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }

  private assessExecutionQuality(trades: any[]): any {
    return {
      averageSlippage: this.analyzeSlippage(trades),
      fillRate: trades.filter(t => t.status === 'filled').length / trades.length,
      partialFills: trades.filter(t => t.status === 'partial').length
    };
  }

  private analyzeSlippage(trades: any[]): number {
    return trades.reduce((sum, t) => sum + Math.abs(t.expected_price - t.actual_price || 0), 0) / trades.length;
  }

  private calculateAveragePriceImprovement(trades: any[]): number {
    return trades.reduce((sum, t) => sum + (t.price_improvement || 0), 0) / trades.length;
  }

  /**
   * Check MiFID II compliance
   */
  static async checkMiFIDII(data: any): Promise<{ compliant: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // Check best execution requirements
    if (!data.bestExecutionPolicy) {
      issues.push('Missing best execution policy');
    }
    
    // Check transaction reporting
    if (!data.transactionReporting || !data.transactionReporting.enabled) {
      issues.push('Transaction reporting not enabled');
    }
    
    // Check pre-trade transparency
    if (!data.preTradeTranparency) {
      issues.push('Pre-trade transparency requirements not met');
    }
    
    // Check post-trade transparency
    if (!data.postTradeTranparency) {
      issues.push('Post-trade transparency requirements not met');
    }
    
    // Check record keeping
    if (!data.recordKeeping || data.recordKeeping.retentionPeriod < 5) {
      issues.push('Record keeping must be at least 5 years');
    }
    
    return {
      compliant: issues.length === 0,
      issues
    };
  }

  /**
   * Check GDPR compliance
   */
  static async checkGDPR(data: any): Promise<{ compliant: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // Check data privacy policy
    if (!data.privacyPolicy) {
      issues.push('Missing privacy policy');
    }
    
    // Check consent management
    if (!data.consentManagement || !data.consentManagement.enabled) {
      issues.push('Consent management not implemented');
    }
    
    // Check data subject rights
    if (!data.dataSubjectRights) {
      issues.push('Data subject rights not implemented');
    }
    
    // Check data portability
    if (!data.dataPortability) {
      issues.push('Data portability not implemented');
    }
    
    // Check right to erasure
    if (!data.rightToErasure) {
      issues.push('Right to erasure (right to be forgotten) not implemented');
    }
    
    // Check data breach notification
    if (!data.breachNotification || data.breachNotification.timeframe > 72) {
      issues.push('Data breach notification must be within 72 hours');
    }
    
    return {
      compliant: issues.length === 0,
      issues
    };
  }
}