interface TradingStrategy {
  id: string;
  name: string;
  type: 'momentum' | 'mean_reversion' | 'breakout' | 'scalping' | 'swing' | 'arbitrage';
  parameters: {
    [key: string]: number | string | boolean;
  };
  risk_profile: 'conservative' | 'moderate' | 'aggressive';
  target_symbols: string[];
  timeframes: string[];
  created_at: number;
  last_optimized: number;
}

interface BacktestResult {
  strategy_id: string;
  symbol: string;
  period_start: number;
  period_end: number;
  total_return: number;
  annualized_return: number;
  max_drawdown: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  avg_trade_duration: number;
  best_trade: number;
  worst_trade: number;
  volatility: number;
  calmar_ratio: number;
  trades: TradeResult[];
}

interface TradeResult {
  entry_time: number;
  exit_time: number;
  entry_price: number;
  exit_price: number;
  size: number;
  side: 'long' | 'short';
  pnl: number;
  pnl_percentage: number;
  duration_minutes: number;
  entry_reason: string;
  exit_reason: string;
}

interface GeneticAlgorithmConfig {
  population_size: number;
  generations: number;
  mutation_rate: number;
  crossover_rate: number;
  elite_percentage: number;
  fitness_function: 'sharpe' | 'sortino' | 'calmar' | 'profit_factor' | 'custom';
  parameter_ranges: {
    [key: string]: {
      min: number;
      max: number;
      step?: number;
      type: 'integer' | 'float' | 'boolean';
    };
  };
}

interface OptimizationResult {
  strategy_id: string;
  original_parameters: { [key: string]: any };
  optimized_parameters: { [key: string]: any };
  original_fitness: number;
  optimized_fitness: number;
  improvement_percentage: number;
  generations_used: number;
  optimization_time_ms: number;
  backtest_results: BacktestResult;
  parameter_sensitivity: {
    [key: string]: {
      impact_score: number;
      optimal_range: [number, number];
    };
  };
}

interface StrategyGene {
  parameters: { [key: string]: any };
  fitness: number;
  age: number;
}

export class StrategyOptimizationEngine {
  private strategies: Map<string, TradingStrategy> = new Map();
  private backtestResults: Map<string, BacktestResult[]> = new Map();
  private optimizationResults: Map<string, OptimizationResult> = new Map();
  private marketData: Map<string, any[]> = new Map();
  
  private isRunning = false;
  private readonly UPDATE_INTERVAL = 1800000; // 30 minutes

  private readonly DEFAULT_GA_CONFIG: GeneticAlgorithmConfig = {
    population_size: 50,
    generations: 100,
    mutation_rate: 0.1,
    crossover_rate: 0.8,
    elite_percentage: 0.2,
    fitness_function: 'sharpe',
    parameter_ranges: {}
  };

  constructor() {}

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Strategy Optimization Engine already running');
      return;
    }

    console.log('🧬 Starting Strategy Optimization Engine...');
    this.isRunning = true;

    await this.initializeDefaultStrategies();
    await this.generateMarketData();

    setInterval(() => {
      this.runPeriodicOptimization();
    }, this.UPDATE_INTERVAL);

    console.log('✅ Strategy Optimization Engine started');
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('🛑 Strategy Optimization Engine stopped');
  }

  private async initializeDefaultStrategies(): Promise<void> {
    const defaultStrategies: TradingStrategy[] = [
      {
        id: 'momentum_ma_cross',
        name: 'Moving Average Crossover',
        type: 'momentum',
        parameters: {
          fast_ma_period: 20,
          slow_ma_period: 50,
          rsi_threshold: 70,
          stop_loss_pct: 2.0,
          take_profit_pct: 4.0,
          position_size: 0.02
        },
        risk_profile: 'moderate',
        target_symbols: ['EUR_USD', 'GBP_USD', 'USD_JPY'],
        timeframes: ['1h', '4h'],
        created_at: Date.now(),
        last_optimized: 0
      },
      {
        id: 'mean_reversion_bb',
        name: 'Bollinger Bands Mean Reversion',
        type: 'mean_reversion',
        parameters: {
          bb_period: 20,
          bb_deviation: 2.0,
          rsi_oversold: 30,
          rsi_overbought: 70,
          stop_loss_pct: 1.5,
          take_profit_pct: 3.0,
          position_size: 0.015
        },
        risk_profile: 'conservative',
        target_symbols: ['EUR_USD', 'XAU_USD'],
        timeframes: ['1h'],
        created_at: Date.now(),
        last_optimized: 0
      },
      {
        id: 'breakout_channel',
        name: 'Channel Breakout',
        type: 'breakout',
        parameters: {
          channel_period: 20,
          breakout_threshold: 0.5,
          volume_confirmation: true,
          stop_loss_pct: 3.0,
          take_profit_pct: 6.0,
          position_size: 0.025
        },
        risk_profile: 'aggressive',
        target_symbols: ['BTC_USD', 'XAU_USD'],
        timeframes: ['4h', '1d'],
        created_at: Date.now(),
        last_optimized: 0
      }
    ];

    for (const strategy of defaultStrategies) {
      this.strategies.set(strategy.id, strategy);
      console.log(`📋 Initialized strategy: ${strategy.name}`);
    }
  }

  private async generateMarketData(): Promise<void> {
    const symbols = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'XAU_USD', 'BTC_USD'];
    const dataPoints = 1000;

    for (const symbol of symbols) {
      const data = this.generateMockOHLCData(symbol, dataPoints);
      this.marketData.set(symbol, data);
      console.log(`📊 Generated ${data.length} data points for ${symbol}`);
    }
  }

  private generateMockOHLCData(symbol: string, count: number): any[] {
    const data: any[] = [];
    const basePrice = this.getBasePrice(symbol);
    let currentPrice = basePrice;
    
    const now = Date.now();
    const interval = 3600000; // 1 hour

    for (let i = count; i >= 0; i--) {
      const timestamp = now - (i * interval);
      
      const volatility = this.getSymbolVolatility(symbol);
      const trend = Math.sin(i / 50) * 0.001;
      const noise = (Math.random() - 0.5) * volatility;
      
      const priceChange = (trend + noise) * currentPrice;
      const open = currentPrice;
      currentPrice += priceChange;
      
      const wickSize = volatility * 0.3;
      const high = Math.max(open, currentPrice) + (Math.random() * wickSize * currentPrice);
      const low = Math.min(open, currentPrice) - (Math.random() * wickSize * currentPrice);
      
      const volume = 1000 + Math.random() * 5000;

      data.push({
        timestamp,
        open,
        high,
        low,
        close: currentPrice,
        volume
      });
    }

    return data;
  }

  private getBasePrice(symbol: string): number {
    const basePrices: { [key: string]: number } = {
      'EUR_USD': 1.0850,
      'GBP_USD': 1.2650,
      'USD_JPY': 149.50,
      'XAU_USD': 2045.50,
      'BTC_USD': 43250.00
    };

    return basePrices[symbol] || 1.0000;
  }

  private getSymbolVolatility(symbol: string): number {
    const volatilities: { [key: string]: number } = {
      'EUR_USD': 0.008,
      'GBP_USD': 0.012,
      'USD_JPY': 0.010,
      'XAU_USD': 0.015,
      'BTC_USD': 0.035
    };

    return volatilities[symbol] || 0.01;
  }

  async optimizeStrategy(
    strategyId: string,
    config?: Partial<GeneticAlgorithmConfig>
  ): Promise<OptimizationResult> {
    console.log(`🧬 Optimizing strategy: ${strategyId}`);

    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    const gaConfig = { ...this.DEFAULT_GA_CONFIG, ...config };
    gaConfig.parameter_ranges = this.defineParameterRanges(strategy);

    const startTime = Date.now();

    const originalBacktest = await this.backtestStrategy(strategy, strategy.target_symbols[0]);
    const originalFitness = this.calculateFitness(originalBacktest, gaConfig.fitness_function);

    let population = this.initializePopulation(strategy, gaConfig);

    for (let generation = 0; generation < gaConfig.generations; generation++) {
      await this.evaluatePopulation(population, strategy, gaConfig);
      
      population.sort((a, b) => b.fitness - a.fitness);
      
      if (generation % 20 === 0) {
        console.log(`Generation ${generation}: Best fitness = ${population[0].fitness.toFixed(4)}`);
      }

      const newPopulation = this.createNextGeneration(population, gaConfig);
      population = newPopulation;
    }

    await this.evaluatePopulation(population, strategy, gaConfig);
    population.sort((a, b) => b.fitness - a.fitness);

    const bestGene = population[0];
    const optimizedStrategy = { ...strategy, parameters: bestGene.parameters };
    const optimizedBacktest = await this.backtestStrategy(optimizedStrategy, strategy.target_symbols[0]);

    const optimizationTime = Date.now() - startTime;
    const improvement = ((bestGene.fitness - originalFitness) / originalFitness) * 100;

    const result: OptimizationResult = {
      strategy_id: strategyId,
      original_parameters: strategy.parameters,
      optimized_parameters: bestGene.parameters,
      original_fitness: originalFitness,
      optimized_fitness: bestGene.fitness,
      improvement_percentage: improvement,
      generations_used: gaConfig.generations,
      optimization_time_ms: optimizationTime,
      backtest_results: optimizedBacktest,
      parameter_sensitivity: await this.calculateParameterSensitivity(strategy, gaConfig)
    };

    this.optimizationResults.set(strategyId, result);

    if (improvement > 5) {
      strategy.parameters = bestGene.parameters;
      strategy.last_optimized = Date.now();
      console.log(`✅ Strategy ${strategyId} optimized with ${improvement.toFixed(2)}% improvement`);
    }

    return result;
  }

  private defineParameterRanges(strategy: TradingStrategy): { [key: string]: any } {
    const ranges: { [key: string]: any } = {};

    Object.keys(strategy.parameters).forEach(param => {
      const value = strategy.parameters[param];
      
      if (typeof value === 'number') {
        if (param.includes('period')) {
          ranges[param] = { min: 5, max: 100, step: 1, type: 'integer' };
        } else if (param.includes('pct') || param.includes('percentage')) {
          ranges[param] = { min: 0.5, max: 10.0, step: 0.1, type: 'float' };
        } else if (param.includes('threshold') || param.includes('deviation')) {
          ranges[param] = { min: 0.1, max: 5.0, step: 0.1, type: 'float' };
        } else if (param.includes('size')) {
          ranges[param] = { min: 0.001, max: 0.1, step: 0.001, type: 'float' };
        } else {
          ranges[param] = { 
            min: Math.max(1, value * 0.5), 
            max: value * 2, 
            step: value > 1 ? 1 : 0.1, 
            type: value % 1 === 0 ? 'integer' : 'float' 
          };
        }
      } else if (typeof value === 'boolean') {
        ranges[param] = { min: 0, max: 1, type: 'boolean' };
      }
    });

    return ranges;
  }

  private initializePopulation(
    strategy: TradingStrategy,
    config: GeneticAlgorithmConfig
  ): StrategyGene[] {
    const population: StrategyGene[] = [];

    for (let i = 0; i < config.population_size; i++) {
      const parameters: { [key: string]: any } = {};
      
      Object.keys(config.parameter_ranges).forEach(param => {
        const range = config.parameter_ranges[param];
        
        if (range.type === 'boolean') {
          parameters[param] = Math.random() < 0.5;
        } else if (range.type === 'integer') {
          parameters[param] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        } else {
          parameters[param] = Math.random() * (range.max - range.min) + range.min;
        }
      });

      population.push({
        parameters,
        fitness: 0,
        age: 0
      });
    }

    return population;
  }

  private async evaluatePopulation(
    population: StrategyGene[],
    strategy: TradingStrategy,
    config: GeneticAlgorithmConfig
  ): Promise<void> {
    for (const gene of population) {
      if (gene.fitness === 0) {
        const testStrategy = { ...strategy, parameters: gene.parameters };
        const backtest = await this.backtestStrategy(testStrategy, strategy.target_symbols[0]);
        gene.fitness = this.calculateFitness(backtest, config.fitness_function);
      }
      gene.age++;
    }
  }

  private createNextGeneration(
    population: StrategyGene[],
    config: GeneticAlgorithmConfig
  ): StrategyGene[] {
    const newPopulation: StrategyGene[] = [];
    const eliteCount = Math.floor(config.population_size * config.elite_percentage);

    for (let i = 0; i < eliteCount; i++) {
      newPopulation.push({ ...population[i], age: population[i].age });
    }

    while (newPopulation.length < config.population_size) {
      const parent1 = this.selectParent(population);
      const parent2 = this.selectParent(population);

      let child: StrategyGene;
      
      if (Math.random() < config.crossover_rate) {
        child = this.crossover(parent1, parent2, config);
      } else {
        child = { ...parent1, fitness: 0, age: 0 };
      }

      if (Math.random() < config.mutation_rate) {
        child = this.mutate(child, config);
      }

      newPopulation.push(child);
    }

    return newPopulation;
  }

  private selectParent(population: StrategyGene[]): StrategyGene {
    const tournamentSize = 3;
    const tournament: StrategyGene[] = [];

    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }

    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0];
  }

  private crossover(
    parent1: StrategyGene,
    parent2: StrategyGene,
    config: GeneticAlgorithmConfig
  ): StrategyGene {
    const childParameters: { [key: string]: any } = {};

    Object.keys(parent1.parameters).forEach(param => {
      if (Math.random() < 0.5) {
        childParameters[param] = parent1.parameters[param];
      } else {
        childParameters[param] = parent2.parameters[param];
      }
    });

    return {
      parameters: childParameters,
      fitness: 0,
      age: 0
    };
  }

  private mutate(gene: StrategyGene, config: GeneticAlgorithmConfig): StrategyGene {
    const mutatedParameters = { ...gene.parameters };

    Object.keys(mutatedParameters).forEach(param => {
      if (Math.random() < 0.1) {
        const range = config.parameter_ranges[param];
        
        if (range.type === 'boolean') {
          mutatedParameters[param] = !mutatedParameters[param];
        } else if (range.type === 'integer') {
          const mutation = Math.floor((Math.random() - 0.5) * (range.max - range.min) * 0.1);
          mutatedParameters[param] = Math.max(range.min, 
            Math.min(range.max, mutatedParameters[param] + mutation));
        } else {
          const mutation = (Math.random() - 0.5) * (range.max - range.min) * 0.1;
          mutatedParameters[param] = Math.max(range.min, 
            Math.min(range.max, mutatedParameters[param] + mutation));
        }
      }
    });

    return {
      parameters: mutatedParameters,
      fitness: 0,
      age: 0
    };
  }

  async backtestStrategy(strategy: TradingStrategy, symbol: string): Promise<BacktestResult> {
    const data = this.marketData.get(symbol);
    if (!data) {
      throw new Error(`No market data for ${symbol}`);
    }

    const trades: TradeResult[] = [];
    let position = 0;
    let entryPrice = 0;
    let entryTime = 0;
    let balance = 100000;

    for (let i = 20; i < data.length - 1; i++) {
      const current = data[i];
      const signal = this.generateTradingSignal(strategy, data, i);

      if (position === 0 && signal !== 'hold') {
        position = signal === 'buy' ? 1 : -1;
        entryPrice = current.close;
        entryTime = current.timestamp;
      } else if (position !== 0) {
        const shouldExit = this.shouldExitPosition(strategy, data, i, entryPrice, position);
        
        if (shouldExit || signal === 'hold') {
          const exitPrice = current.close;
          const pnl = position * (exitPrice - entryPrice);
          const pnlPct = (pnl / entryPrice) * 100;
          
          trades.push({
            entry_time: entryTime,
            exit_time: current.timestamp,
            entry_price: entryPrice,
            exit_price: exitPrice,
            size: Math.abs(position * strategy.parameters.position_size * balance),
            side: position > 0 ? 'long' : 'short',
            pnl,
            pnl_percentage: pnlPct,
            duration_minutes: (current.timestamp - entryTime) / 60000,
            entry_reason: signal,
            exit_reason: shouldExit ? 'exit_signal' : 'timeout'
          });

          balance += pnl * strategy.parameters.position_size * balance;
          position = 0;
        }
      }
    }

    return this.calculateBacktestMetrics(trades, balance, data[0].timestamp, data[data.length - 1].timestamp, strategy.id, symbol);
  }

  private generateTradingSignal(strategy: TradingStrategy, data: any[], index: number): 'buy' | 'sell' | 'hold' {
    const current = data[index];
    
    if (strategy.type === 'momentum') {
      const fastMA = this.calculateSMA(data, index, strategy.parameters.fast_ma_period);
      const slowMA = this.calculateSMA(data, index, strategy.parameters.slow_ma_period);
      const rsi = this.calculateRSI(data, index, 14);
      
      if (fastMA > slowMA && rsi < strategy.parameters.rsi_threshold) {
        return 'buy';
      } else if (fastMA < slowMA && rsi > (100 - strategy.parameters.rsi_threshold)) {
        return 'sell';
      }
    } else if (strategy.type === 'mean_reversion') {
      const bb = this.calculateBollingerBands(data, index, strategy.parameters.bb_period, strategy.parameters.bb_deviation);
      const rsi = this.calculateRSI(data, index, 14);
      
      if (current.close < bb.lower && rsi < strategy.parameters.rsi_oversold) {
        return 'buy';
      } else if (current.close > bb.upper && rsi > strategy.parameters.rsi_overbought) {
        return 'sell';
      }
    } else if (strategy.type === 'breakout') {
      const channel = this.calculateChannel(data, index, strategy.parameters.channel_period);
      const volumeRatio = current.volume / this.calculateAverageVolume(data, index, 20);
      
      if (current.close > channel.upper && volumeRatio > 1.5) {
        return 'buy';
      } else if (current.close < channel.lower && volumeRatio > 1.5) {
        return 'sell';
      }
    }

    return 'hold';
  }

  private shouldExitPosition(strategy: TradingStrategy, data: any[], index: number, entryPrice: number, position: number): boolean {
    const current = data[index];
    const currentReturn = position * (current.close - entryPrice) / entryPrice;
    
    if (currentReturn <= -strategy.parameters.stop_loss_pct / 100) {
      return true;
    }
    
    if (currentReturn >= strategy.parameters.take_profit_pct / 100) {
      return true;
    }

    return false;
  }

  private calculateSMA(data: any[], index: number, period: number): number {
    const start = Math.max(0, index - period + 1);
    const slice = data.slice(start, index + 1);
    return slice.reduce((sum, candle) => sum + candle.close, 0) / slice.length;
  }

  private calculateRSI(data: any[], index: number, period: number): number {
    if (index < period) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = index - period + 1; i <= index; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateBollingerBands(data: any[], index: number, period: number, deviation: number): { upper: number; middle: number; lower: number } {
    const sma = this.calculateSMA(data, index, period);
    const start = Math.max(0, index - period + 1);
    const slice = data.slice(start, index + 1);
    
    const variance = slice.reduce((sum, candle) => sum + Math.pow(candle.close - sma, 2), 0) / slice.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * deviation),
      middle: sma,
      lower: sma - (stdDev * deviation)
    };
  }

  private calculateChannel(data: any[], index: number, period: number): { upper: number; lower: number } {
    const start = Math.max(0, index - period + 1);
    const slice = data.slice(start, index + 1);
    
    const highest = Math.max(...slice.map(c => c.high));
    const lowest = Math.min(...slice.map(c => c.low));
    
    return { upper: highest, lower: lowest };
  }

  private calculateAverageVolume(data: any[], index: number, period: number): number {
    const start = Math.max(0, index - period + 1);
    const slice = data.slice(start, index + 1);
    return slice.reduce((sum, candle) => sum + candle.volume, 0) / slice.length;
  }

  private calculateBacktestMetrics(
    trades: TradeResult[],
    finalBalance: number,
    startTime: number,
    endTime: number,
    strategyId: string,
    symbol: string
  ): BacktestResult {
    if (trades.length === 0) {
      return {
        strategy_id: strategyId,
        symbol,
        period_start: startTime,
        period_end: endTime,
        total_return: 0,
        annualized_return: 0,
        max_drawdown: 0,
        sharpe_ratio: 0,
        sortino_ratio: 0,
        win_rate: 0,
        profit_factor: 0,
        total_trades: 0,
        avg_trade_duration: 0,
        best_trade: 0,
        worst_trade: 0,
        volatility: 0,
        calmar_ratio: 0,
        trades: []
      };
    }

    const totalReturn = (finalBalance - 100000) / 100000;
    const periodDays = (endTime - startTime) / (24 * 60 * 60 * 1000);
    const annualizedReturn = totalReturn * (365 / periodDays);

    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    const winRate = winningTrades.length / trades.length;
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

    const returns = trades.map(t => t.pnl_percentage / 100);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    
    const sharpeRatio = volatility > 0 ? (avgReturn - 0.02 / 365) / volatility : 0;
    
    const downsideReturns = returns.filter(r => r < avgReturn);
    const downsideDeviation = downsideReturns.length > 0 ? 
      Math.sqrt(downsideReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / downsideReturns.length) : 0;
    const sortinoRatio = downsideDeviation > 0 ? (avgReturn - 0.02 / 365) / downsideDeviation : 0;

    let peak = 100000;
    let maxDrawdown = 0;
    let runningBalance = 100000;
    
    for (const trade of trades) {
      runningBalance += trade.pnl;
      if (runningBalance > peak) peak = runningBalance;
      const drawdown = (peak - runningBalance) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

    return {
      strategy_id: strategyId,
      symbol,
      period_start: startTime,
      period_end: endTime,
      total_return: totalReturn,
      annualized_return: annualizedReturn,
      max_drawdown: maxDrawdown,
      sharpe_ratio: sharpeRatio,
      sortino_ratio: sortinoRatio,
      win_rate: winRate,
      profit_factor: profitFactor,
      total_trades: trades.length,
      avg_trade_duration: trades.reduce((sum, t) => sum + t.duration_minutes, 0) / trades.length,
      best_trade: Math.max(...trades.map(t => t.pnl_percentage)),
      worst_trade: Math.min(...trades.map(t => t.pnl_percentage)),
      volatility: volatility * Math.sqrt(252),
      calmar_ratio: calmarRatio,
      trades
    };
  }

  private calculateFitness(backtest: BacktestResult, fitnessFunction: string): number {
    switch (fitnessFunction) {
      case 'sharpe':
        return backtest.sharpe_ratio;
      case 'sortino':
        return backtest.sortino_ratio;
      case 'calmar':
        return backtest.calmar_ratio;
      case 'profit_factor':
        return backtest.profit_factor;
      default:
        const composite = 
          backtest.sharpe_ratio * 0.3 +
          backtest.profit_factor * 0.2 +
          backtest.win_rate * 0.2 +
          (1 - backtest.max_drawdown) * 0.3;
        return composite;
    }
  }

  private async calculateParameterSensitivity(
    strategy: TradingStrategy,
    config: GeneticAlgorithmConfig
  ): Promise<{ [key: string]: { impact_score: number; optimal_range: [number, number] } }> {
    const sensitivity: { [key: string]: { impact_score: number; optimal_range: [number, number] } } = {};

    for (const param of Object.keys(strategy.parameters)) {
      const results: { value: number; fitness: number }[] = [];
      const range = config.parameter_ranges[param];
      
      if (!range) continue;

      const testValues = [];
      for (let i = 0; i < 10; i++) {
        const value = range.min + (i / 9) * (range.max - range.min);
        testValues.push(range.type === 'integer' ? Math.round(value) : value);
      }

      for (const value of testValues) {
        const testStrategy = { 
          ...strategy, 
          parameters: { ...strategy.parameters, [param]: value } 
        };
        
        const backtest = await this.backtestStrategy(testStrategy, strategy.target_symbols[0]);
        const fitness = this.calculateFitness(backtest, config.fitness_function);
        
        results.push({ value, fitness });
      }

      results.sort((a, b) => b.fitness - a.fitness);
      
      const maxFitness = results[0].fitness;
      const minFitness = results[results.length - 1].fitness;
      const impactScore = maxFitness - minFitness;
      
      const topResults = results.slice(0, 3);
      const optimalRange: [number, number] = [
        Math.min(...topResults.map(r => r.value)),
        Math.max(...topResults.map(r => r.value))
      ];

      sensitivity[param] = { impact_score: impactScore, optimal_range: optimalRange };
    }

    return sensitivity;
  }

  private async runPeriodicOptimization(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🔄 Running periodic strategy optimization...');

    for (const [strategyId, strategy] of this.strategies.entries()) {
      const timeSinceLastOptimization = Date.now() - strategy.last_optimized;
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      if (timeSinceLastOptimization > oneWeek) {
        try {
          await this.optimizeStrategy(strategyId);
        } catch (error) {
          console.error(`❌ Failed to optimize strategy ${strategyId}:`, error);
        }
      }
    }
  }

  // Public API methods
  getStrategy(strategyId: string): TradingStrategy | null {
    return this.strategies.get(strategyId) || null;
  }

  getAllStrategies(): Map<string, TradingStrategy> {
    return new Map(this.strategies);
  }

  getOptimizationResult(strategyId: string): OptimizationResult | null {
    return this.optimizationResults.get(strategyId) || null;
  }

  async runBacktest(strategyId: string, symbol: string): Promise<BacktestResult> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    return await this.backtestStrategy(strategy, symbol);
  }

  addStrategy(strategy: TradingStrategy): void {
    this.strategies.set(strategy.id, strategy);
    console.log(`📋 Added strategy: ${strategy.name}`);
  }

  updateStrategy(strategyId: string, updates: Partial<TradingStrategy>): void {
    const strategy = this.strategies.get(strategyId);
    if (strategy) {
      Object.assign(strategy, updates);
      console.log(`📝 Updated strategy: ${strategyId}`);
    }
  }

  getStrategyPerformance(): {
    [strategyId: string]: {
      total_return: number;
      sharpe_ratio: number;
      max_drawdown: number;
      win_rate: number;
      last_optimized: number;
    };
  } {
    const performance: any = {};

    for (const [strategyId, strategy] of this.strategies.entries()) {
      const results = this.backtestResults.get(strategyId);
      if (results && results.length > 0) {
        const latest = results[results.length - 1];
        performance[strategyId] = {
          total_return: latest.total_return,
          sharpe_ratio: latest.sharpe_ratio,
          max_drawdown: latest.max_drawdown,
          win_rate: latest.win_rate,
          last_optimized: strategy.last_optimized
        };
      }
    }

    return performance;
  }

  async forceOptimization(): Promise<void> {
    for (const strategyId of this.strategies.keys()) {
      try {
        await this.optimizeStrategy(strategyId);
      } catch (error) {
        console.error(`❌ Failed to optimize ${strategyId}:`, error);
      }
    }
  }
}