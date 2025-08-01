// Phase 4: Security & Compliance - Compliance Monitoring
export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  type: 'trading' | 'financial' | 'data' | 'operational';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface ComplianceViolation {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  description: string;
  details: Record<string, any>;
  timestamp: Date;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  assignedTo?: string;
}

export interface ComplianceReport {
  period: { start: Date; end: Date };
  totalRules: number;
  activeRules: number;
  violations: {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    resolved: number;
  };
  riskScore: number;
  recommendations: string[];
}

export class ComplianceMonitorService {
  private static instance: ComplianceMonitorService;
  private rules = new Map<string, ComplianceRule>();
  private violations: ComplianceViolation[] = [];
  private isMonitoring = false;

  static getInstance(): ComplianceMonitorService {
    if (!ComplianceMonitorService.instance) {
      ComplianceMonitorService.instance = new ComplianceMonitorService();
      this.instance.initializeDefaultRules();
    }
    return ComplianceMonitorService.instance;
  }

  private initializeDefaultRules(): void {
    const defaultRules: ComplianceRule[] = [
      {
        id: 'trading_position_limit',
        name: 'Position Size Limit',
        description: 'Maximum position size per trade',
        type: 'trading',
        severity: 'high',
        enabled: true,
        parameters: { maxPositionSize: 100000, currency: 'USD' }
      },
      {
        id: 'daily_loss_limit',
        name: 'Daily Loss Limit',
        description: 'Maximum daily loss allowed',
        type: 'trading',
        severity: 'critical',
        enabled: true,
        parameters: { maxDailyLoss: 10000, currency: 'USD' }
      },
      {
        id: 'concentration_risk',
        name: 'Portfolio Concentration',
        description: 'Maximum concentration in single asset',
        type: 'financial',
        severity: 'medium',
        enabled: true,
        parameters: { maxConcentration: 0.25 } // 25%
      },
      {
        id: 'data_retention',
        name: 'Data Retention Policy',
        description: 'Minimum data retention period',
        type: 'data',
        severity: 'medium',
        enabled: true,
        parameters: { retentionDays: 2555 } // 7 years
      },
      {
        id: 'api_rate_limit',
        name: 'API Rate Limiting',
        description: 'Maximum API calls per minute',
        type: 'operational',
        severity: 'low',
        enabled: true,
        parameters: { maxCallsPerMinute: 1000 }
      }
    ];

    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Compliance monitoring started');
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('Compliance monitoring stopped');
  }

  async checkCompliance(
    event: {
      type: string;
      userId: string;
      data: Record<string, any>;
    }
  ): Promise<ComplianceViolation[]> {
    if (!this.isMonitoring) return [];

    const violations: ComplianceViolation[] = [];
    
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const violation = await this.evaluateRule(rule, event);
      if (violation) {
        violations.push(violation);
        this.violations.push(violation);
      }
    }

    return violations;
  }

  async evaluateRule(
    rule: ComplianceRule,
    event: { type: string; userId: string; data: Record<string, any> }
  ): Promise<ComplianceViolation | null> {
    switch (rule.id) {
      case 'trading_position_limit':
        return this.checkPositionLimit(rule, event);
      case 'daily_loss_limit':
        return this.checkDailyLossLimit(rule, event);
      case 'concentration_risk':
        return this.checkConcentrationRisk(rule, event);
      case 'data_retention':
        return this.checkDataRetention(rule, event);
      case 'api_rate_limit':
        return this.checkApiRateLimit(rule, event);
      default:
        return null;
    }
  }

  addRule(rule: Omit<ComplianceRule, 'id'>): string {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullRule: ComplianceRule = { ...rule, id };
    this.rules.set(id, fullRule);
    return id;
  }

  updateRule(ruleId: string, updates: Partial<ComplianceRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    this.rules.set(ruleId, { ...rule, ...updates });
    return true;
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRules(): ComplianceRule[] {
    return Array.from(this.rules.values());
  }

  getViolations(filters?: {
    severity?: string;
    status?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): ComplianceViolation[] {
    let filtered = [...this.violations];

    if (filters) {
      if (filters.severity) {
        filtered = filtered.filter(v => v.severity === filters.severity);
      }
      if (filters.status) {
        filtered = filtered.filter(v => v.status === filters.status);
      }
      if (filters.userId) {
        filtered = filtered.filter(v => v.userId === filters.userId);
      }
      if (filters.startDate) {
        filtered = filtered.filter(v => v.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter(v => v.timestamp <= filters.endDate!);
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async resolveViolation(violationId: string, assignedTo?: string): Promise<boolean> {
    const violation = this.violations.find(v => v.id === violationId);
    if (!violation) return false;

    violation.status = 'resolved';
    if (assignedTo) violation.assignedTo = assignedTo;
    
    return true;
  }

  async generateReport(period: { start: Date; end: Date }): Promise<ComplianceReport> {
    const periodViolations = this.violations.filter(v => 
      v.timestamp >= period.start && v.timestamp <= period.end
    );

    const bySeverity = periodViolations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = periodViolations.reduce((acc, v) => {
      const rule = this.rules.get(v.ruleId);
      if (rule) {
        acc[rule.type] = (acc[rule.type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const resolved = periodViolations.filter(v => v.status === 'resolved').length;
    const riskScore = this.calculateRiskScore(periodViolations);

    return {
      period,
      totalRules: this.rules.size,
      activeRules: Array.from(this.rules.values()).filter(r => r.enabled).length,
      violations: {
        total: periodViolations.length,
        bySeverity,
        byType,
        resolved
      },
      riskScore,
      recommendations: this.generateRecommendations(periodViolations)
    };
  }

  private async checkPositionLimit(rule: ComplianceRule, event: any): Promise<ComplianceViolation | null> {
    if (event.type !== 'trade_executed') return null;

    const { positionSize } = event.data;
    const { maxPositionSize } = rule.parameters;

    if (positionSize > maxPositionSize) {
      return this.createViolation(rule, event.userId, {
        description: `Position size ${positionSize} exceeds limit of ${maxPositionSize}`,
        positionSize,
        limit: maxPositionSize
      });
    }

    return null;
  }

  private async checkDailyLossLimit(rule: ComplianceRule, event: any): Promise<ComplianceViolation | null> {
    if (event.type !== 'trade_executed') return null;

    // Mock daily P&L calculation
    const dailyPnL = event.data.pnl || 0;
    const { maxDailyLoss } = rule.parameters;

    if (dailyPnL < -maxDailyLoss) {
      return this.createViolation(rule, event.userId, {
        description: `Daily loss ${Math.abs(dailyPnL)} exceeds limit of ${maxDailyLoss}`,
        dailyLoss: Math.abs(dailyPnL),
        limit: maxDailyLoss
      });
    }

    return null;
  }

  private async checkConcentrationRisk(rule: ComplianceRule, event: any): Promise<ComplianceViolation | null> {
    if (event.type !== 'portfolio_update') return null;

    const { concentration } = event.data;
    const { maxConcentration } = rule.parameters;

    if (concentration > maxConcentration) {
      return this.createViolation(rule, event.userId, {
        description: `Portfolio concentration ${(concentration * 100).toFixed(1)}% exceeds limit of ${(maxConcentration * 100).toFixed(1)}%`,
        concentration,
        limit: maxConcentration
      });
    }

    return null;
  }

  private async checkDataRetention(rule: ComplianceRule, event: any): Promise<ComplianceViolation | null> {
    // Mock data retention check
    return null;
  }

  private async checkApiRateLimit(rule: ComplianceRule, event: any): Promise<ComplianceViolation | null> {
    if (event.type !== 'api_call') return null;

    // Mock rate limit check
    const { callCount } = event.data;
    const { maxCallsPerMinute } = rule.parameters;

    if (callCount > maxCallsPerMinute) {
      return this.createViolation(rule, event.userId, {
        description: `API calls ${callCount} per minute exceeds limit of ${maxCallsPerMinute}`,
        callCount,
        limit: maxCallsPerMinute
      });
    }

    return null;
  }

  private createViolation(
    rule: ComplianceRule,
    userId: string,
    details: Record<string, any>
  ): ComplianceViolation {
    return {
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      userId,
      description: details.description,
      details,
      timestamp: new Date(),
      status: 'open'
    };
  }

  private calculateRiskScore(violations: ComplianceViolation[]): number {
    const weights = { critical: 10, high: 5, medium: 2, low: 1 };
    const totalScore = violations.reduce((sum, v) => sum + weights[v.severity], 0);
    
    // Normalize to 0-100 scale
    return Math.min(100, totalScore);
  }

  private generateRecommendations(violations: ComplianceViolation[]): string[] {
    const recommendations: string[] = [];
    
    const criticalCount = violations.filter(v => v.severity === 'critical').length;
    if (criticalCount > 0) {
      recommendations.push('Immediate action required for critical violations');
    }

    const tradingViolations = violations.filter(v => {
      const rule = this.rules.get(v.ruleId);
      return rule?.type === 'trading';
    });
    
    if (tradingViolations.length > 5) {
      recommendations.push('Review trading limits and risk parameters');
    }

    return recommendations;
  }
}