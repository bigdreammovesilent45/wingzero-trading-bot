import { EventEmitter } from 'events';
import { supabase } from '@/integrations/supabase/client';

export interface WithdrawalRule {
  id: string;
  name: string;
  type: 'profit_percentage' | 'fixed_amount' | 'target_balance' | 'time_based';
  enabled: boolean;
  threshold: number;
  amount?: number;
  frequency?: 'daily' | 'weekly' | 'monthly';
  lastExecuted?: Date;
  destination: {
    type: 'bank' | 'crypto_wallet' | 'investment_account';
    details: Record<string, string>;
  };
}

export interface WithdrawalHistory {
  id: string;
  ruleId: string;
  amount: number;
  currency: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  error?: string;
}

export interface AccountMetrics {
  balance: number;
  equity: number;
  profit: number;
  profitPercentage: number;
  drawdown: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}

export class SAWService extends EventEmitter {
  private static instance: SAWService;
  private rules: Map<string, WithdrawalRule> = new Map();
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    super();
    this.loadRules();
  }

  static getInstance(): SAWService {
    if (!SAWService.instance) {
      SAWService.instance = new SAWService();
    }
    return SAWService.instance;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    console.log('🏦 S.A.W. Service started - Smart Automated Withdrawals active');
    this.isRunning = true;
    
    // Check every hour
    this.checkInterval = setInterval(() => {
      this.checkWithdrawalRules();
    }, 3600000); // 1 hour
    
    // Initial check
    await this.checkWithdrawalRules();
    
    this.emit('started');
  }

  stop(): void {
    if (!this.isRunning) return;
    
    console.log('🏦 S.A.W. Service stopped');
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.emit('stopped');
  }

  async addRule(rule: Omit<WithdrawalRule, 'id'>): Promise<WithdrawalRule> {
    const newRule: WithdrawalRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.rules.set(newRule.id, newRule);
    await this.saveRules();
    
    this.emit('ruleAdded', newRule);
    return newRule;
  }

  async updateRule(id: string, updates: Partial<WithdrawalRule>): Promise<WithdrawalRule> {
    const rule = this.rules.get(id);
    if (!rule) {
      throw new Error(`Rule ${id} not found`);
    }
    
    const updatedRule = { ...rule, ...updates };
    this.rules.set(id, updatedRule);
    await this.saveRules();
    
    this.emit('ruleUpdated', updatedRule);
    return updatedRule;
  }

  async deleteRule(id: string): Promise<void> {
    const rule = this.rules.get(id);
    if (!rule) {
      throw new Error(`Rule ${id} not found`);
    }
    
    this.rules.delete(id);
    await this.saveRules();
    
    this.emit('ruleDeleted', rule);
  }

  getRules(): WithdrawalRule[] {
    return Array.from(this.rules.values());
  }

  getRule(id: string): WithdrawalRule | undefined {
    return this.rules.get(id);
  }

  async getWithdrawalHistory(limit: number = 100): Promise<WithdrawalHistory[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('saw_withdrawal_history')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
      return [];
    }
  }

  private async checkWithdrawalRules(): Promise<void> {
    if (!this.isRunning) return;
    
    try {
      const metrics = await this.getAccountMetrics();
      const enabledRules = Array.from(this.rules.values()).filter(r => r.enabled);
      
      for (const rule of enabledRules) {
        const shouldExecute = await this.evaluateRule(rule, metrics);
        
        if (shouldExecute) {
          await this.executeWithdrawal(rule, metrics);
        }
      }
    } catch (error) {
      console.error('Error checking withdrawal rules:', error);
      this.emit('error', error);
    }
  }

  private async evaluateRule(rule: WithdrawalRule, metrics: AccountMetrics): Promise<boolean> {
    const now = new Date();
    
    // Check if rule was recently executed
    if (rule.lastExecuted) {
      const timeSinceLastExecution = now.getTime() - rule.lastExecuted.getTime();
      const minInterval = this.getMinInterval(rule);
      
      if (timeSinceLastExecution < minInterval) {
        return false;
      }
    }
    
    switch (rule.type) {
      case 'profit_percentage':
        return metrics.profitPercentage >= rule.threshold;
      
      case 'fixed_amount':
        return metrics.profit >= rule.threshold;
      
      case 'target_balance':
        return metrics.balance >= rule.threshold;
      
      case 'time_based':
        return this.isTimeForExecution(rule, now);
      
      default:
        return false;
    }
  }

  private getMinInterval(rule: WithdrawalRule): number {
    switch (rule.frequency) {
      case 'daily':
        return 24 * 60 * 60 * 1000;
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000;
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000; // Default to daily
    }
  }

  private isTimeForExecution(rule: WithdrawalRule, now: Date): boolean {
    if (!rule.lastExecuted) return true;
    
    const timeSinceLastExecution = now.getTime() - rule.lastExecuted.getTime();
    const interval = this.getMinInterval(rule);
    
    return timeSinceLastExecution >= interval;
  }

  private async executeWithdrawal(rule: WithdrawalRule, metrics: AccountMetrics): Promise<void> {
    try {
      const amount = this.calculateWithdrawalAmount(rule, metrics);
      
      if (amount <= 0) {
        console.log(`No withdrawal needed for rule ${rule.name}`);
        return;
      }
      
      // Create withdrawal record
      const withdrawal: WithdrawalHistory = {
        id: `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ruleId: rule.id,
        amount,
        currency: 'USD',
        timestamp: new Date(),
        status: 'pending'
      };
      
      // Save withdrawal record
      await this.saveWithdrawal(withdrawal);
      
      // Execute the actual withdrawal (mock for now)
      const success = await this.processWithdrawal(withdrawal, rule.destination);
      
      // Update withdrawal status
      withdrawal.status = success ? 'completed' : 'failed';
      if (success) {
        withdrawal.transactionId = `TXN_${Date.now()}`;
      } else {
        withdrawal.error = 'Mock withdrawal failed';
      }
      
      await this.updateWithdrawal(withdrawal);
      
      // Update rule last executed time
      if (success) {
        rule.lastExecuted = new Date();
        await this.updateRule(rule.id, { lastExecuted: rule.lastExecuted });
      }
      
      this.emit('withdrawalExecuted', withdrawal);
      
    } catch (error) {
      console.error(`Error executing withdrawal for rule ${rule.name}:`, error);
      this.emit('withdrawalError', { rule, error });
    }
  }

  private calculateWithdrawalAmount(rule: WithdrawalRule, metrics: AccountMetrics): number {
    switch (rule.type) {
      case 'profit_percentage':
        // Withdraw a percentage of profits
        return metrics.profit * (rule.amount || 0.5); // Default 50% of profits
      
      case 'fixed_amount':
        // Withdraw fixed amount if available
        return Math.min(rule.amount || 0, metrics.profit);
      
      case 'target_balance':
        // Withdraw excess above target
        const excess = metrics.balance - rule.threshold;
        return excess > 0 ? excess * (rule.amount || 1.0) : 0; // Default 100% of excess
      
      case 'time_based':
        // Withdraw fixed amount or percentage
        return rule.amount || 1000; // Default $1000
      
      default:
        return 0;
    }
  }

  private async processWithdrawal(
    withdrawal: WithdrawalHistory, 
    destination: WithdrawalRule['destination']
  ): Promise<boolean> {
    // Mock implementation - in production, this would integrate with payment processors
    console.log(`Processing withdrawal of $${withdrawal.amount} to ${destination.type}`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate 95% success rate
    return Math.random() > 0.05;
  }

  private async getAccountMetrics(): Promise<AccountMetrics> {
    // In production, this would fetch real account data
    // For now, return mock data
    return {
      balance: 50000 + Math.random() * 10000,
      equity: 52000 + Math.random() * 10000,
      profit: 5000 + Math.random() * 5000,
      profitPercentage: 10 + Math.random() * 20,
      drawdown: Math.random() * 10,
      winRate: 0.55 + Math.random() * 0.15,
      avgWin: 200 + Math.random() * 100,
      avgLoss: 100 + Math.random() * 50
    };
  }

  private async loadRules(): Promise<void> {
    try {
      const { data, error } = await (supabase as any)
        .from('saw_withdrawal_rules')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        this.rules.clear();
        data.forEach((rule: WithdrawalRule) => {
          this.rules.set(rule.id, rule);
        });
      }
    } catch (error) {
      console.error('Error loading withdrawal rules:', error);
      // Load default rules if database fails
      this.loadDefaultRules();
    }
  }

  private loadDefaultRules(): void {
    const defaultRules: WithdrawalRule[] = [
      {
        id: 'default_profit_rule',
        name: 'Weekly Profit Withdrawal',
        type: 'profit_percentage',
        enabled: true,
        threshold: 10, // 10% profit
        amount: 0.5, // Withdraw 50% of profits
        frequency: 'weekly',
        destination: {
          type: 'bank',
          details: { account: '****1234' }
        }
      },
      {
        id: 'default_balance_rule',
        name: 'Maintain Target Balance',
        type: 'target_balance',
        enabled: true,
        threshold: 50000, // Target balance
        amount: 1.0, // Withdraw 100% of excess
        destination: {
          type: 'investment_account',
          details: { account: 'IRA-****5678' }
        }
      }
    ];
    
    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  private async saveRules(): Promise<void> {
    try {
      const rules = Array.from(this.rules.values());
      
      for (const rule of rules) {
        await (supabase as any)
          .from('saw_withdrawal_rules')
          .upsert(rule);
      }
    } catch (error) {
      console.error('Error saving withdrawal rules:', error);
    }
  }

  private async saveWithdrawal(withdrawal: WithdrawalHistory): Promise<void> {
    try {
      await (supabase as any)
        .from('saw_withdrawal_history')
        .insert(withdrawal);
    } catch (error) {
      console.error('Error saving withdrawal record:', error);
    }
  }

  private async updateWithdrawal(withdrawal: WithdrawalHistory): Promise<void> {
    try {
      await (supabase as any)
        .from('saw_withdrawal_history')
        .update(withdrawal)
        .eq('id', withdrawal.id);
    } catch (error) {
      console.error('Error updating withdrawal record:', error);
    }
  }
}

export default SAWService;