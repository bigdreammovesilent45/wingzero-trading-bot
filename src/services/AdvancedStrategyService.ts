import { AdvancedStrategy, StrategyParameters, BacktestResult, BacktestTrade } from '@/types/enterprise';
import { supabase } from '@/integrations/supabase/client';

export class AdvancedStrategyService {
  private static instance: AdvancedStrategyService;

  static getInstance(): AdvancedStrategyService {
    if (!AdvancedStrategyService.instance) {
      AdvancedStrategyService.instance = new AdvancedStrategyService();
    }
    return AdvancedStrategyService.instance;
  }

  async createStrategy(userId: string, strategyData: Partial<AdvancedStrategy>): Promise<AdvancedStrategy> {
    const { data, error } = await supabase
      .from('advanced_strategies')
      .insert([{
        user_id: userId,
        name: strategyData.name,
        description: strategyData.description,
        strategy_type: strategyData.strategy_type,
        parameters: strategyData.parameters,
        is_active: false
      }])
      .select()
      .single();

    if (error) throw error;
    return data as AdvancedStrategy;
  }

  async getStrategies(userId: string): Promise<AdvancedStrategy[]> {
    const { data, error } = await supabase
      .from('advanced_strategies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AdvancedStrategy[];
  }

  async getStrategyById(strategyId: string): Promise<AdvancedStrategy | null> {
    const { data, error } = await supabase
      .from('advanced_strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (error) return null;
    return data as AdvancedStrategy;
  }

  async updateStrategy(strategyId: string, updates: Partial<AdvancedStrategy>): Promise<AdvancedStrategy> {
    const { data, error } = await supabase
      .from('advanced_strategies')
      .update(updates)
      .eq('id', strategyId)
      .select()
      .single();

    if (error) throw error;
    return data as AdvancedStrategy;
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

  async runBacktest(strategyId: string, startDate: string, endDate: string): Promise<BacktestResult> {
    const strategy = await this.getStrategyById(strategyId);
    if (!strategy) throw new Error('Strategy not found');

    // Generate mock historical data and run backtest
    const mockTrades = await this.generateBacktestTrades(strategy, startDate, endDate);
    
    const winningTrades = mockTrades.filter(trade => trade.profit > 0);
    const losingTrades = mockTrades.filter(trade => trade.profit <= 0);
    
    const totalProfit = mockTrades.reduce((sum, trade) => sum + trade.profit, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profit, 0));
    
    const result: BacktestResult = {
      period_start: startDate,
      period_end: endDate,
      total_trades: mockTrades.length,
      winning_trades: winningTrades.length,
      losing_trades: losingTrades.length,
      win_rate: mockTrades.length > 0 ? (winningTrades.length / mockTrades.length) * 100 : 0,
      profit_factor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0,
      max_drawdown: this.calculateMaxDrawdown(mockTrades),
      sharpe_ratio: this.calculateSharpeRatio(mockTrades),
      net_profit: totalProfit,
      trades: mockTrades
    };

    // Save backtest result
    await this.updateStrategy(strategyId, { backtest_results: result });

    return result;
  }

  private async generateBacktestTrades(strategy: AdvancedStrategy, startDate: string, endDate: string): Promise<BacktestTrade[]> {
    const trades: BacktestTrade[] = [];
    const symbols = strategy.parameters.symbols || ['EUR_USD', 'GBP_USD', 'USD_JPY'];
    
    let currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);
    
    while (currentDate < endDateTime) {
      // Simulate trade frequency based on strategy type
      const tradesPerDay = this.getTradesPerDay(strategy.strategy_type);
      
      for (let i = 0; i < tradesPerDay; i++) {
        if (Math.random() > 0.7) continue; // 30% chance of trade
        
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const direction = Math.random() > 0.5 ? 'buy' : 'sell';
        const entryPrice = 1.1000 + (Math.random() - 0.5) * 0.1; // Mock price
        const exitPrice = entryPrice + (Math.random() - 0.5) * 0.005; // Mock exit
        const quantity = 10000; // Standard lot
        
        const profit = direction === 'buy' 
          ? (exitPrice - entryPrice) * quantity
          : (entryPrice - exitPrice) * quantity;

        trades.push({
          entry_time: new Date(currentDate.getTime() + (i * 8 * 60 * 60 * 1000)).toISOString(),
          exit_time: new Date(currentDate.getTime() + ((i + 1) * 8 * 60 * 60 * 1000)).toISOString(),
          symbol,
          direction,
          entry_price: entryPrice,
          exit_price: exitPrice,
          quantity,
          profit,
          strategy_signals: this.getStrategySignals(strategy)
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return trades;
  }

  private getTradesPerDay(strategyType: string): number {
    const tradeFrequencies: Record<string, number> = {
      'scalping': 10,
      'grid': 5,
      'swing': 1,
      'martingale': 3,
      'arbitrage': 8,
      'custom': 2
    };
    return tradeFrequencies[strategyType] || 2;
  }

  private getStrategySignals(strategy: AdvancedStrategy): string[] {
    const baseSignals = ['entry_signal', 'risk_management'];
    
    switch (strategy.strategy_type) {
      case 'scalping':
        return [...baseSignals, 'quick_profit', 'tight_stops'];
      case 'grid':
        return [...baseSignals, 'grid_level', 'averaging'];
      case 'swing':
        return [...baseSignals, 'trend_following', 'support_resistance'];
      case 'martingale':
        return [...baseSignals, 'position_doubling', 'recovery'];
      case 'arbitrage':
        return [...baseSignals, 'price_difference', 'correlation'];
      default:
        return baseSignals;
    }
  }

  private calculateMaxDrawdown(trades: BacktestTrade[]): number {
    let runningPnL = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    for (const trade of trades) {
      runningPnL += trade.profit;
      peak = Math.max(peak, runningPnL);
      const drawdown = (peak - runningPnL) / peak * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }

  private calculateSharpeRatio(trades: BacktestTrade[]): number {
    if (trades.length < 2) return 0;
    
    const returns = trades.map(trade => trade.profit);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }

  async generateStrategyFromTemplate(userId: string, templateType: string): Promise<AdvancedStrategy> {
    const templates: Record<string, Partial<AdvancedStrategy>> = {
      'scalping_ema': {
        name: 'EMA Scalping Strategy',
        description: 'Fast scalping using EMA crossovers with tight stops',
        strategy_type: 'scalping',
        parameters: {
          timeframe: 'M1',
          symbols: ['EUR_USD', 'GBP_USD'],
          entry_conditions: [
            {
              type: 'indicator',
              indicator: 'ema_fast',
              operator: 'crosses_above',
              value: 'ema_slow'
            }
          ],
          exit_conditions: [
            {
              type: 'indicator',
              indicator: 'profit',
              operator: 'greater_than',
              value: 5
            }
          ],
          risk_management: {
            max_risk_per_trade: 1,
            max_daily_loss: 5,
            position_sizing: 'percentage',
            stop_loss_type: 'fixed',
            take_profit_type: 'fixed'
          },
          custom_indicators: [
            { name: 'ema_fast', formula: 'EMA(close, 8)', parameters: { period: 8 } },
            { name: 'ema_slow', formula: 'EMA(close, 21)', parameters: { period: 21 } }
          ]
        }
      },
      'grid_trading': {
        name: 'Grid Trading Strategy',
        description: 'Places buy and sell orders at predetermined intervals',
        strategy_type: 'grid',
        parameters: {
          timeframe: 'H1',
          symbols: ['EUR_USD'],
          entry_conditions: [
            {
              type: 'price',
              operator: 'equals',
              value: 'grid_level'
            }
          ],
          exit_conditions: [
            {
              type: 'price',
              operator: 'greater_than',
              value: 'next_grid_level'
            }
          ],
          risk_management: {
            max_risk_per_trade: 2,
            max_daily_loss: 10,
            position_sizing: 'fixed',
            stop_loss_type: 'percentage',
            take_profit_type: 'fixed'
          }
        }
      },
      'swing_trading': {
        name: 'Swing Trading Strategy',
        description: 'Medium-term strategy based on support/resistance levels',
        strategy_type: 'swing',
        parameters: {
          timeframe: 'H4',
          symbols: ['EUR_USD', 'GBP_USD', 'USD_JPY'],
          entry_conditions: [
            {
              type: 'indicator',
              indicator: 'rsi',
              operator: 'less_than',
              value: 30
            }
          ],
          exit_conditions: [
            {
              type: 'indicator',
              indicator: 'rsi',
              operator: 'greater_than',
              value: 70
            }
          ],
          risk_management: {
            max_risk_per_trade: 3,
            max_daily_loss: 15,
            position_sizing: 'volatility_based',
            stop_loss_type: 'atr',
            take_profit_type: 'rr_ratio'
          },
          custom_indicators: [
            { name: 'rsi', formula: 'RSI(close, 14)', parameters: { period: 14 } }
          ]
        }
      }
    };

    const template = templates[templateType];
    if (!template) throw new Error('Template not found');

    return await this.createStrategy(userId, template);
  }

  async optimizeStrategy(strategyId: string, optimizationParams: any): Promise<AdvancedStrategy> {
    const strategy = await this.getStrategyById(strategyId);
    if (!strategy) throw new Error('Strategy not found');

    // Run multiple backtests with different parameters
    const parameterSets = this.generateParameterSets(strategy.parameters, optimizationParams);
    const results: Array<{ params: StrategyParameters; result: BacktestResult }> = [];

    for (const params of parameterSets) {
      const tempStrategy = { ...strategy, parameters: params };
      const result = await this.runBacktest(strategy.id, 
        optimizationParams.startDate, 
        optimizationParams.endDate
      );
      results.push({ params, result });
    }

    // Find best performing parameters
    const bestResult = results.reduce((best, current) => 
      current.result.sharpe_ratio > best.result.sharpe_ratio ? current : best
    );

    // Update strategy with optimized parameters
    return await this.updateStrategy(strategyId, {
      parameters: bestResult.params,
      backtest_results: bestResult.result
    });
  }

  private generateParameterSets(baseParams: StrategyParameters, optimizationParams: any): StrategyParameters[] {
    const sets: StrategyParameters[] = [];
    
    // Simple parameter optimization - varies key parameters
    const riskLevels = [1, 2, 3, 5];
    const timeframes = ['M15', 'H1', 'H4'];
    
    for (const risk of riskLevels) {
      for (const timeframe of timeframes) {
        sets.push({
          ...baseParams,
          timeframe,
          risk_management: {
            ...baseParams.risk_management,
            max_risk_per_trade: risk
          }
        });
      }
    }
    
    return sets.slice(0, 10); // Limit to 10 combinations
  }

  async exportStrategy(strategyId: string): Promise<string> {
    const strategy = await this.getStrategyById(strategyId);
    if (!strategy) throw new Error('Strategy not found');

    return JSON.stringify(strategy, null, 2);
  }

  async importStrategy(userId: string, strategyJson: string): Promise<AdvancedStrategy> {
    try {
      const strategyData = JSON.parse(strategyJson);
      
      // Remove ID and user-specific fields
      delete strategyData.id;
      delete strategyData.created_at;
      delete strategyData.updated_at;
      
      strategyData.user_id = userId;
      strategyData.name = `${strategyData.name} (Imported)`;
      
      return await this.createStrategy(userId, strategyData);
    } catch (error) {
      throw new Error('Invalid strategy format');
    }
  }
}