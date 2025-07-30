import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AdvancedStrategy = Database['public']['Tables']['advanced_strategies']['Row'];
type AdvancedStrategyInsert = Database['public']['Tables']['advanced_strategies']['Insert'];
type AdvancedStrategyUpdate = Database['public']['Tables']['advanced_strategies']['Update'];

export class AdvancedStrategyService {
  private static instance: AdvancedStrategyService;

  static getInstance(): AdvancedStrategyService {
    if (!AdvancedStrategyService.instance) {
      AdvancedStrategyService.instance = new AdvancedStrategyService();
    }
    return AdvancedStrategyService.instance;
  }

  async createStrategy(userId: string, strategyData: AdvancedStrategyInsert): Promise<AdvancedStrategy> {
    const { data, error } = await supabase
      .from('advanced_strategies')
      .insert([{
        ...strategyData,
        user_id: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getStrategies(userId: string): Promise<AdvancedStrategy[]> {
    const { data, error } = await supabase
      .from('advanced_strategies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getStrategyById(strategyId: string): Promise<AdvancedStrategy | null> {
    const { data, error } = await supabase
      .from('advanced_strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (error) return null;
    return data;
  }

  async updateStrategy(strategyId: string, updates: AdvancedStrategyUpdate): Promise<AdvancedStrategy> {
    const { data, error } = await supabase
      .from('advanced_strategies')
      .update(updates)
      .eq('id', strategyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteStrategy(strategyId: string): Promise<void> {
    const { error } = await supabase
      .from('advanced_strategies')
      .delete()
      .eq('id', strategyId);

    if (error) throw error;
  }

  async activateStrategy(strategyId: string): Promise<void> {
    await this.updateStrategy(strategyId, { is_active: true });
  }

  async deactivateStrategy(strategyId: string): Promise<void> {
    await this.updateStrategy(strategyId, { is_active: false });
  }

  async generateStrategyFromTemplate(userId: string, templateType: string): Promise<AdvancedStrategy> {
    const templates: Record<string, AdvancedStrategyInsert> = {
      'scalping_ema': {
        name: 'EMA Scalping Strategy',
        description: 'Fast scalping using EMA crossovers with tight stops',
        strategy_type: 'scalping',
        parameters: {
          timeframe: 'M1',
          symbols: ['EUR_USD', 'GBP_USD'],
          entry_conditions: [{
            type: 'indicator',
            indicator: 'ema_fast',
            operator: 'crosses_above',
            value: 'ema_slow'
          }],
          exit_conditions: [{
            type: 'indicator',
            indicator: 'profit',
            operator: 'greater_than',
            value: 5
          }],
          risk_management: {
            max_risk_per_trade: 1,
            max_daily_loss: 5,
            position_sizing: 'percentage',
            stop_loss_type: 'fixed',
            take_profit_type: 'fixed'
          }
        },
        user_id: userId
      },
      'grid_trading': {
        name: 'Grid Trading Strategy',
        description: 'Places buy and sell orders at predetermined intervals',
        strategy_type: 'grid',
        parameters: {
          timeframe: 'H1',
          symbols: ['EUR_USD'],
          grid_spacing: 50,
          grid_levels: 10,
          risk_management: {
            max_risk_per_trade: 2,
            max_daily_loss: 10,
            position_sizing: 'fixed'
          }
        },
        user_id: userId
      }
    };

    const template = templates[templateType];
    if (!template) throw new Error('Template not found');

    return await this.createStrategy(userId, template);
  }
}