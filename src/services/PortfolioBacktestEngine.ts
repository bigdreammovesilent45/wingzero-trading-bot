export interface BacktestConfig {
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  rebalanceFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  transactionCosts: number;
  slippage: number;
  benchmark?: string;
}

export interface BacktestResult {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  winRate: number;
  profitFactor: number;
  trades: TradeRecord[];
  equity: EquityPoint[];
  performance: PerformanceMetrics;
}

export interface TradeRecord {
  date: Date;
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  value: number;
  transactionCost: number;
}

export interface EquityPoint {
  date: Date;
  portfolioValue: number;
  benchmarkValue?: number;
  drawdown: number;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export class PortfolioBacktestEngine {
  private static instance: PortfolioBacktestEngine;

  private constructor() {}

  static getInstance(): PortfolioBacktestEngine {
    if (!PortfolioBacktestEngine.instance) {
      PortfolioBacktestEngine.instance = new PortfolioBacktestEngine();
    }
    return PortfolioBacktestEngine.instance;
  }

  async runBacktest(
    strategy: (date: Date, portfolio: any, marketData: any) => { [symbol: string]: number },
    marketData: { [symbol: string]: { date: Date; price: number }[] },
    config: BacktestConfig
  ): Promise<BacktestResult> {
    const trades: TradeRecord[] = [];
    const equity: EquityPoint[] = [];
    let currentPortfolio: { [symbol: string]: number } = {};
    let cash = config.initialCapital;
    let portfolioValue = config.initialCapital;
    let maxPortfolioValue = config.initialCapital;

    // Get trading dates
    const tradingDates = this.getTradingDates(config.startDate, config.endDate, marketData);

    for (const date of tradingDates) {
      // Get current market prices
      const currentPrices = this.getCurrentPrices(date, marketData);
      
      // Calculate current portfolio value
      portfolioValue = cash + Object.entries(currentPortfolio).reduce((sum, [symbol, quantity]) => {
        return sum + quantity * (currentPrices[symbol] || 0);
      }, 0);

      // Update max portfolio value for drawdown calculation
      maxPortfolioValue = Math.max(maxPortfolioValue, portfolioValue);

      // Get new weights from strategy
      const targetWeights = strategy(date, currentPortfolio, { prices: currentPrices, date });

      // Rebalance portfolio
      const rebalanceTrades = this.rebalancePortfolio(
        currentPortfolio,
        targetWeights,
        portfolioValue,
        currentPrices,
        config.transactionCosts,
        config.slippage
      );

      // Execute trades
      for (const trade of rebalanceTrades) {
        trades.push({
          ...trade,
          date
        });

        if (trade.action === 'buy') {
          currentPortfolio[trade.symbol] = (currentPortfolio[trade.symbol] || 0) + trade.quantity;
          cash -= trade.value + trade.transactionCost;
        } else {
          currentPortfolio[trade.symbol] = (currentPortfolio[trade.symbol] || 0) - trade.quantity;
          cash += trade.value - trade.transactionCost;
        }
      }

      // Record equity point
      const drawdown = (maxPortfolioValue - portfolioValue) / maxPortfolioValue;
      equity.push({
        date,
        portfolioValue,
        drawdown
      });
    }

    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(trades);
    const returns = this.calculateReturns(equity);
    
    const totalReturn = (portfolioValue - config.initialCapital) / config.initialCapital;
    const annualizedReturn = this.calculateAnnualizedReturn(totalReturn, config.startDate, config.endDate);
    const volatility = this.calculateVolatility(returns);
    const sharpeRatio = annualizedReturn / volatility;
    const maxDrawdown = Math.max(...equity.map(e => e.drawdown));
    const calmarRatio = annualizedReturn / maxDrawdown;

    return {
      totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      calmarRatio,
      winRate: performance.winningTrades / performance.totalTrades,
      profitFactor: performance.averageWin / Math.abs(performance.averageLoss),
      trades,
      equity,
      performance
    };
  }

  private getTradingDates(
    startDate: Date,
    endDate: Date,
    marketData: { [symbol: string]: { date: Date; price: number }[] }
  ): Date[] {
    // Get all available dates from market data
    const allDates = new Set<string>();
    Object.values(marketData).forEach(data => {
      data.forEach(point => {
        if (point.date >= startDate && point.date <= endDate) {
          allDates.add(point.date.toISOString().split('T')[0]);
        }
      });
    });

    return Array.from(allDates)
      .sort()
      .map(dateStr => new Date(dateStr));
  }

  private getCurrentPrices(date: Date, marketData: { [symbol: string]: { date: Date; price: number }[] }): { [symbol: string]: number } {
    const prices: { [symbol: string]: number } = {};
    
    Object.entries(marketData).forEach(([symbol, data]) => {
      const pricePoint = data.find(p => 
        p.date.toDateString() === date.toDateString()
      );
      if (pricePoint) {
        prices[symbol] = pricePoint.price;
      }
    });

    return prices;
  }

  private rebalancePortfolio(
    currentPortfolio: { [symbol: string]: number },
    targetWeights: { [symbol: string]: number },
    portfolioValue: number,
    currentPrices: { [symbol: string]: number },
    transactionCost: number,
    slippage: number
  ): Omit<TradeRecord, 'date'>[] {
    const trades: Omit<TradeRecord, 'date'>[] = [];

    Object.entries(targetWeights).forEach(([symbol, targetWeight]) => {
      const currentQuantity = currentPortfolio[symbol] || 0;
      const currentValue = currentQuantity * currentPrices[symbol];
      const currentWeight = currentValue / portfolioValue;
      
      const targetValue = targetWeight * portfolioValue;
      const targetQuantity = targetValue / currentPrices[symbol];
      
      const quantityDiff = targetQuantity - currentQuantity;
      
      if (Math.abs(quantityDiff) > 0.001) { // Minimum trade threshold
        const action = quantityDiff > 0 ? 'buy' : 'sell';
        const absQuantity = Math.abs(quantityDiff);
        const price = currentPrices[symbol] * (1 + (action === 'buy' ? slippage : -slippage));
        const value = absQuantity * price;
        const cost = value * transactionCost;

        trades.push({
          symbol,
          action,
          quantity: absQuantity,
          price,
          value,
          transactionCost: cost
        });
      }
    });

    return trades;
  }

  private calculatePerformanceMetrics(trades: TradeRecord[]): PerformanceMetrics {
    const tradePnLs: number[] = [];
    const tradesBySymbol: { [symbol: string]: TradeRecord[] } = {};

    // Group trades by symbol to calculate P&L
    trades.forEach(trade => {
      if (!tradesBySymbol[trade.symbol]) {
        tradesBySymbol[trade.symbol] = [];
      }
      tradesBySymbol[trade.symbol].push(trade);
    });

    // Calculate P&L for each symbol
    Object.values(tradesBySymbol).forEach(symbolTrades => {
      let position = 0;
      let totalCost = 0;

      symbolTrades.forEach(trade => {
        if (trade.action === 'buy') {
          totalCost += trade.value + trade.transactionCost;
          position += trade.quantity;
        } else {
          const avgCost = totalCost / position;
          const pnl = (trade.price - avgCost) * trade.quantity - trade.transactionCost;
          tradePnLs.push(pnl);
          
          totalCost -= avgCost * trade.quantity;
          position -= trade.quantity;
        }
      });
    });

    const winningTrades = tradePnLs.filter(pnl => pnl > 0);
    const losingTrades = tradePnLs.filter(pnl => pnl < 0);

    return {
      totalTrades: tradePnLs.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageWin: winningTrades.length > 0 ? winningTrades.reduce((sum, pnl) => sum + pnl, 0) / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? losingTrades.reduce((sum, pnl) => sum + pnl, 0) / losingTrades.length : 0,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades) : 0,
      consecutiveWins: this.calculateMaxConsecutive(tradePnLs, true),
      consecutiveLosses: this.calculateMaxConsecutive(tradePnLs, false)
    };
  }

  private calculateMaxConsecutive(pnls: number[], wins: boolean): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    pnls.forEach(pnl => {
      const isWin = pnl > 0;
      if (isWin === wins) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    });

    return maxConsecutive;
  }

  private calculateReturns(equity: EquityPoint[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < equity.length; i++) {
      const prevValue = equity[i - 1].portfolioValue;
      const currentValue = equity[i].portfolioValue;
      returns.push((currentValue - prevValue) / prevValue);
    }
    return returns;
  }

  private calculateAnnualizedReturn(totalReturn: number, startDate: Date, endDate: Date): number {
    const days = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const years = days / 365.25;
    return Math.pow(1 + totalReturn, 1 / years) - 1;
  }

  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance * 252); // Annualized
  }
}