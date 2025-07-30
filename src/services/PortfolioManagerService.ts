import { Portfolio, TradingAccount, AllocationStrategy } from '@/types/enterprise';
import { supabase } from '@/integrations/supabase/client';
import { BrokerManagerService } from './BrokerManagerService';

export class PortfolioManagerService {
  private static instance: PortfolioManagerService;
  private brokerManager: BrokerManagerService;

  constructor() {
    this.brokerManager = BrokerManagerService.getInstance();
  }

  static getInstance(): PortfolioManagerService {
    if (!PortfolioManagerService.instance) {
      PortfolioManagerService.instance = new PortfolioManagerService();
    }
    return PortfolioManagerService.instance;
  }

  async createPortfolio(userId: string, portfolioData: Partial<Portfolio>): Promise<Portfolio> {
    const { data, error } = await supabase
      .from('portfolios')
      .insert([{
        user_id: userId,
        name: portfolioData.name,
        description: portfolioData.description,
        allocation_strategy: portfolioData.allocation_strategy || {
          type: 'equal',
          parameters: {}
        },
        total_balance: 0,
        total_equity: 0,
        total_profit: 0
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Portfolio;
  }

  async getPortfolios(userId: string): Promise<Portfolio[]> {
    const { data, error } = await supabase
      .from('portfolios')
      .select(`
        *,
        trading_accounts (*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data as Portfolio[];
  }

  async getPortfolioById(portfolioId: string): Promise<Portfolio | null> {
    const { data, error } = await supabase
      .from('portfolios')
      .select(`
        *,
        trading_accounts (*)
      `)
      .eq('id', portfolioId)
      .single();

    if (error) return null;
    return data as Portfolio;
  }

  async addTradingAccount(portfolioId: string, accountData: Partial<TradingAccount>): Promise<TradingAccount> {
    // Verify the broker connection
    if (!this.brokerManager.isConnected(accountData.broker!)) {
      throw new Error(`Broker ${accountData.broker} is not connected`);
    }

    const { data, error } = await supabase
      .from('trading_accounts')
      .insert([{
        portfolio_id: portfolioId,
        broker: accountData.broker,
        account_id: accountData.account_id,
        account_type: accountData.account_type || 'demo',
        balance: 0,
        equity: 0,
        margin: 0,
        free_margin: 0,
        allocation_percentage: accountData.allocation_percentage || 0,
        is_active: accountData.is_active !== false
      }])
      .select()
      .single();

    if (error) throw error;

    // Update portfolio allocation
    await this.rebalancePortfolio(portfolioId);

    return data as TradingAccount;
  }

  async updateAllocationStrategy(portfolioId: string, strategy: AllocationStrategy): Promise<void> {
    const { error } = await supabase
      .from('portfolios')
      .update({ allocation_strategy: strategy })
      .eq('id', portfolioId);

    if (error) throw error;

    // Rebalance the portfolio with new strategy
    await this.rebalancePortfolio(portfolioId);
  }

  async rebalancePortfolio(portfolioId: string): Promise<void> {
    const portfolio = await this.getPortfolioById(portfolioId);
    if (!portfolio) throw new Error('Portfolio not found');

    const activeAccounts = portfolio.accounts.filter(account => account.is_active);
    
    if (activeAccounts.length === 0) return;

    let newAllocations: Record<string, number> = {};

    switch (portfolio.allocation_strategy.type) {
      case 'equal':
        const equalPercentage = 100 / activeAccounts.length;
        activeAccounts.forEach(account => {
          newAllocations[account.id] = equalPercentage;
        });
        break;

      case 'proportional':
        const totalBalance = activeAccounts.reduce((sum, account) => sum + account.balance, 0);
        activeAccounts.forEach(account => {
          newAllocations[account.id] = totalBalance > 0 ? (account.balance / totalBalance) * 100 : 0;
        });
        break;

      case 'risk_based':
        // Implement risk-based allocation
        const riskWeights = await this.calculateRiskWeights(activeAccounts);
        activeAccounts.forEach((account, index) => {
          newAllocations[account.id] = riskWeights[index] * 100;
        });
        break;

      case 'custom':
        // Use custom allocation from strategy parameters
        const customAllocation = portfolio.allocation_strategy.parameters.allocation || {};
        activeAccounts.forEach(account => {
          newAllocations[account.id] = customAllocation[account.id] || 0;
        });
        break;
    }

    // Update allocations in database
    for (const [accountId, percentage] of Object.entries(newAllocations)) {
      await supabase
        .from('trading_accounts')
        .update({ allocation_percentage: percentage })
        .eq('id', accountId);
    }
  }

  private async calculateRiskWeights(accounts: TradingAccount[]): Promise<number[]> {
    // Simple risk-based allocation (inverse correlation with volatility)
    const risks = await Promise.all(
      accounts.map(async (account) => {
        try {
          // Get account performance data to calculate risk
          const accountData = await this.brokerManager.getAccountData(account.broker);
          // Calculate risk metric (simplified - use volatility, drawdown, etc.)
          return Math.max(0.1, 1 / (accountData.maxDrawdown || 0.1));
        } catch {
          return 1; // Default risk weight
        }
      })
    );

    const totalRisk = risks.reduce((sum, risk) => sum + risk, 0);
    return risks.map(risk => risk / totalRisk);
  }

  async syncPortfolioData(portfolioId: string): Promise<void> {
    const portfolio = await this.getPortfolioById(portfolioId);
    if (!portfolio) return;

    let totalBalance = 0;
    let totalEquity = 0;
    let totalProfit = 0;

    // Update each trading account with live data
    for (const account of portfolio.accounts) {
      if (!account.is_active) continue;

      try {
        const accountData = await this.brokerManager.getAccountData(account.broker);
        
        const updatedData = {
          balance: accountData.balance || 0,
          equity: accountData.equity || 0,
          margin: accountData.margin || 0,
          free_margin: accountData.freeMargin || 0
        };

        await supabase
          .from('trading_accounts')
          .update(updatedData)
          .eq('id', account.id);

        totalBalance += updatedData.balance;
        totalEquity += updatedData.equity;
        totalProfit += (updatedData.equity - updatedData.balance);

      } catch (error) {
        console.error(`Failed to sync account ${account.id}:`, error);
      }
    }

    // Update portfolio totals
    await supabase
      .from('portfolios')
      .update({
        total_balance: totalBalance,
        total_equity: totalEquity,
        total_profit: totalProfit
      })
      .eq('id', portfolioId);
  }

  async getPortfolioPerformance(portfolioId: string, timeframe: string = '1M'): Promise<any> {
    const { data, error } = await supabase
      .from('portfolio_performance')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .gte('timestamp', this.getTimeframeStart(timeframe))
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return {
      equity_curve: data.map(record => ({
        timestamp: record.timestamp,
        equity: record.total_equity
      })),
      drawdown_curve: data.map(record => ({
        timestamp: record.timestamp,
        drawdown: record.drawdown_percentage
      })),
      metrics: {
        total_return: this.calculateTotalReturn(data),
        max_drawdown: Math.min(...data.map(r => r.drawdown_percentage)),
        sharpe_ratio: this.calculateSharpeRatio(data),
        win_rate: this.calculateWinRate(portfolioId, timeframe)
      }
    };
  }

  private getTimeframeStart(timeframe: string): string {
    const now = new Date();
    const timeframes: Record<string, number> = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365
    };

    const days = timeframes[timeframe] || 30;
    now.setDate(now.getDate() - days);
    return now.toISOString();
  }

  private calculateTotalReturn(data: any[]): number {
    if (data.length < 2) return 0;
    const first = data[0].total_equity;
    const last = data[data.length - 1].total_equity;
    return ((last - first) / first) * 100;
  }

  private calculateSharpeRatio(data: any[]): number {
    if (data.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1].total_equity;
      const curr = data[i].total_equity;
      returns.push((curr - prev) / prev);
    }

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );

    return stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
  }

  private async calculateWinRate(portfolioId: string, timeframe: string): Promise<number> {
    const { data, error } = await supabase
      .from('trades')
      .select('profit')
      .eq('portfolio_id', portfolioId)
      .gte('closed_at', this.getTimeframeStart(timeframe))
      .not('closed_at', 'is', null);

    if (error || !data.length) return 0;

    const winningTrades = data.filter(trade => trade.profit > 0).length;
    return (winningTrades / data.length) * 100;
  }

  async deletePortfolio(portfolioId: string): Promise<void> {
    // Delete all associated trading accounts first
    await supabase
      .from('trading_accounts')
      .delete()
      .eq('portfolio_id', portfolioId);

    // Delete the portfolio
    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolioId);

    if (error) throw error;
  }

  async removeTradingAccount(accountId: string): Promise<void> {
    const { data: account, error: fetchError } = await supabase
      .from('trading_accounts')
      .select('portfolio_id')
      .eq('id', accountId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('trading_accounts')
      .delete()
      .eq('id', accountId);

    if (error) throw error;

    // Rebalance the portfolio after removing account
    if (account) {
      await this.rebalancePortfolio(account.portfolio_id);
    }
  }
}