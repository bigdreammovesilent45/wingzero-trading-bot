import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Portfolio = Database['public']['Tables']['portfolios']['Row'];
type PortfolioInsert = Database['public']['Tables']['portfolios']['Insert'];
type PortfolioUpdate = Database['public']['Tables']['portfolios']['Update'];
type TradingAccount = Database['public']['Tables']['trading_accounts']['Row'];
type TradingAccountInsert = Database['public']['Tables']['trading_accounts']['Insert'];

export class PortfolioManagerService {
  private static instance: PortfolioManagerService;

  static getInstance(): PortfolioManagerService {
    if (!PortfolioManagerService.instance) {
      PortfolioManagerService.instance = new PortfolioManagerService();
    }
    return PortfolioManagerService.instance;
  }

  async createPortfolio(userId: string, portfolioData: PortfolioInsert): Promise<Portfolio> {
    const { data, error } = await supabase
      .from('portfolios')
      .insert([{
        ...portfolioData,
        user_id: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPortfolios(userId: string): Promise<Portfolio[]> {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getPortfolioById(portfolioId: string): Promise<Portfolio | null> {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();

    if (error) return null;
    return data;
  }

  async updatePortfolio(portfolioId: string, updates: PortfolioUpdate): Promise<Portfolio> {
    const { data, error } = await supabase
      .from('portfolios')
      .update(updates)
      .eq('id', portfolioId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePortfolio(portfolioId: string): Promise<void> {
    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolioId);

    if (error) throw error;
  }

  async addTradingAccount(portfolioId: string, accountData: TradingAccountInsert): Promise<TradingAccount> {
    const { data, error } = await supabase
      .from('trading_accounts')
      .insert([{
        ...accountData,
        portfolio_id: portfolioId,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTradingAccounts(portfolioId: string): Promise<TradingAccount[]> {
    const { data, error } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateTradingAccount(accountId: string, updates: Partial<TradingAccount>): Promise<TradingAccount> {
    const { data, error } = await supabase
      .from('trading_accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async calculatePortfolioMetrics(portfolioId: string): Promise<{
    totalBalance: number;
    totalEquity: number;
    totalProfit: number;
    allocation: Record<string, number>;
  }> {
    const accounts = await this.getTradingAccounts(portfolioId);
    
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = accounts.reduce((sum, acc) => sum + acc.equity, 0);
    const totalProfit = totalEquity - totalBalance;
    
    const allocation = accounts.reduce((acc, account) => {
      acc[account.broker] = (acc[account.broker] || 0) + account.allocation_percentage;
      return acc;
    }, {} as Record<string, number>);

    // Update portfolio with calculated metrics
    await this.updatePortfolio(portfolioId, {
      total_balance: totalBalance,
      total_equity: totalEquity,
      total_profit: totalProfit
    });

    return { totalBalance, totalEquity, totalProfit, allocation };
  }
}