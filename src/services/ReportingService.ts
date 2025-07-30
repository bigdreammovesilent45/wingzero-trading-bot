import { Report, ReportData, PerformanceMetrics, TradeAnalysis } from '@/types/enterprise';
import { supabase } from '@/integrations/supabase/client';

export class ReportingService {
  private static instance: ReportingService;

  static getInstance(): ReportingService {
    if (!ReportingService.instance) {
      ReportingService.instance = new ReportingService();
    }
    return ReportingService.instance;
  }

  async generateReport(userId: string, reportType: 'daily' | 'weekly' | 'monthly' | 'custom', options: any = {}): Promise<Report> {
    const { startDate, endDate } = this.getReportPeriod(reportType, options);
    
    const reportData = await this.collectReportData(userId, startDate, endDate);
    
    const report: Omit<Report, 'id'> = {
      user_id: userId,
      type: reportType,
      title: this.generateReportTitle(reportType, startDate, endDate),
      data: reportData,
      format: options.format || 'json',
      created_at: new Date().toISOString(),
      generated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('reports')
      .insert([report])
      .select()
      .single();

    if (error) throw error;
    return data as Report;
  }

  private getReportPeriod(reportType: string, options: any): { startDate: string; endDate: string } {
    const now = new Date();
    const endDate = options.endDate || now.toISOString();
    let startDate: string;

    switch (reportType) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'custom':
        startDate = options.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    return { startDate, endDate };
  }

  private generateReportTitle(reportType: string, startDate: string, endDate: string): string {
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    
    const titles: Record<string, string> = {
      'daily': `Daily Trading Report - ${start}`,
      'weekly': `Weekly Trading Report - ${start} to ${end}`,
      'monthly': `Monthly Trading Report - ${start} to ${end}`,
      'custom': `Custom Trading Report - ${start} to ${end}`
    };

    return titles[reportType] || `Trading Report - ${start} to ${end}`;
  }

  private async collectReportData(userId: string, startDate: string, endDate: string): Promise<ReportData> {
    // Fetch trades data
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (tradesError) throw tradesError;

    // Fetch positions data
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (positionsError) throw positionsError;

    // Calculate summary metrics
    const closedTrades = trades?.filter(trade => trade.status === 'closed') || [];
    const totalTrades = closedTrades.length;
    const profitLoss = closedTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
    const winningTrades = closedTrades.filter(trade => (trade.profit || 0) > 0);
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    
    // Calculate ROI (assuming initial balance)
    const initialBalance = 10000; // This should come from account data
    const roi = (profitLoss / initialBalance) * 100;

    // Generate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(closedTrades);
    
    // Generate trade analysis
    const tradeAnalysis = this.analyzeTradesByCategory(closedTrades);
    
    // Generate charts data
    const charts = this.generateChartsData(closedTrades, positions || []);

    return {
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        total_trades: totalTrades,
        profit_loss: profitLoss,
        win_rate: winRate,
        roi: roi
      },
      performance_metrics: performanceMetrics,
      trade_analysis: tradeAnalysis,
      charts: charts
    };
  }

  private calculatePerformanceMetrics(trades: any[]): PerformanceMetrics {
    if (trades.length === 0) {
      return {
        sharpe_ratio: 0,
        sortino_ratio: 0,
        max_drawdown: 0,
        profit_factor: 0,
        average_trade: 0,
        largest_win: 0,
        largest_loss: 0,
        consecutive_wins: 0,
        consecutive_losses: 0
      };
    }

    const profits = trades.map(trade => trade.profit || 0);
    const winningTrades = profits.filter(profit => profit > 0);
    const losingTrades = profits.filter(profit => profit < 0);

    const totalProfit = winningTrades.reduce((sum, profit) => sum + profit, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, loss) => sum + loss, 0));
    
    // Calculate Sharpe ratio
    const avgReturn = profits.reduce((sum, profit) => sum + profit, 0) / profits.length;
    const stdDev = Math.sqrt(
      profits.reduce((sum, profit) => sum + Math.pow(profit - avgReturn, 2), 0) / profits.length
    );
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    // Calculate Sortino ratio (using only downside deviation)
    const negativeReturns = profits.filter(profit => profit < avgReturn);
    const downsideDeviation = negativeReturns.length > 0 
      ? Math.sqrt(negativeReturns.reduce((sum, profit) => sum + Math.pow(profit - avgReturn, 2), 0) / negativeReturns.length)
      : 0;
    const sortinoRatio = downsideDeviation > 0 ? avgReturn / downsideDeviation : 0;

    // Calculate max drawdown
    let runningPnL = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    for (const profit of profits) {
      runningPnL += profit;
      peak = Math.max(peak, runningPnL);
      const drawdown = peak - runningPnL;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    // Calculate consecutive wins/losses
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let isWinning = false;

    for (const profit of profits) {
      if (profit > 0) {
        if (isWinning) {
          currentStreak++;
        } else {
          currentStreak = 1;
          isWinning = true;
        }
        maxWinStreak = Math.max(maxWinStreak, currentStreak);
      } else {
        if (!isWinning) {
          currentStreak++;
        } else {
          currentStreak = 1;
          isWinning = false;
        }
        maxLossStreak = Math.max(maxLossStreak, currentStreak);
      }
    }

    return {
      sharpe_ratio: sharpeRatio,
      sortino_ratio: sortinoRatio,
      max_drawdown: maxDrawdown,
      profit_factor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0,
      average_trade: avgReturn,
      largest_win: Math.max(...profits, 0),
      largest_loss: Math.min(...profits, 0),
      consecutive_wins: maxWinStreak,
      consecutive_losses: maxLossStreak
    };
  }

  private analyzeTradesByCategory(trades: any[]): TradeAnalysis {
    const analysis: TradeAnalysis = {
      by_symbol: {},
      by_strategy: {},
      by_timeframe: {}
    };

    // Group by symbol
    for (const trade of trades) {
      const symbol = trade.symbol || 'Unknown';
      if (!analysis.by_symbol[symbol]) {
        analysis.by_symbol[symbol] = { trades: 0, profit: 0, win_rate: 0 };
      }
      analysis.by_symbol[symbol].trades++;
      analysis.by_symbol[symbol].profit += trade.profit || 0;
    }

    // Calculate win rates for symbols
    for (const [symbol, data] of Object.entries(analysis.by_symbol)) {
      const symbolTrades = trades.filter(trade => trade.symbol === symbol);
      const winningTrades = symbolTrades.filter(trade => (trade.profit || 0) > 0);
      data.win_rate = symbolTrades.length > 0 ? (winningTrades.length / symbolTrades.length) * 100 : 0;
    }

    // Group by strategy (if available)
    for (const trade of trades) {
      const strategy = trade.strategy || 'Manual';
      if (!analysis.by_strategy[strategy]) {
        analysis.by_strategy[strategy] = { trades: 0, profit: 0, win_rate: 0 };
      }
      analysis.by_strategy[strategy].trades++;
      analysis.by_strategy[strategy].profit += trade.profit || 0;
    }

    // Calculate win rates for strategies
    for (const [strategy, data] of Object.entries(analysis.by_strategy)) {
      const strategyTrades = trades.filter(trade => (trade.strategy || 'Manual') === strategy);
      const winningTrades = strategyTrades.filter(trade => (trade.profit || 0) > 0);
      data.win_rate = strategyTrades.length > 0 ? (winningTrades.length / strategyTrades.length) * 100 : 0;
    }

    // Group by timeframe (mock data for now)
    const timeframes = ['M15', 'H1', 'H4', 'D1'];
    for (const timeframe of timeframes) {
      const timeframeTrades = trades.filter(() => Math.random() > 0.7); // Mock assignment
      if (timeframeTrades.length > 0) {
        const profit = timeframeTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
        const winningTrades = timeframeTrades.filter(trade => (trade.profit || 0) > 0);
        analysis.by_timeframe[timeframe] = {
          trades: timeframeTrades.length,
          profit: profit,
          win_rate: (winningTrades.length / timeframeTrades.length) * 100
        };
      }
    }

    return analysis;
  }

  private generateChartsData(trades: any[], positions: any[]): any[] {
    const charts = [];

    // Equity curve
    let runningPnL = 0;
    const equityCurve = trades.map((trade, index) => {
      runningPnL += trade.profit || 0;
      return {
        x: new Date(trade.created_at).getTime(),
        y: runningPnL
      };
    });

    charts.push({
      type: 'equity_curve',
      data: equityCurve
    });

    // Drawdown curve
    let peak = 0;
    const drawdownCurve = equityCurve.map(point => {
      peak = Math.max(peak, point.y);
      const drawdown = peak > 0 ? ((peak - point.y) / peak) * 100 : 0;
      return {
        x: point.x,
        y: -drawdown // Negative for visual representation
      };
    });

    charts.push({
      type: 'drawdown',
      data: drawdownCurve
    });

    // Monthly returns
    const monthlyReturns = this.calculateMonthlyReturns(trades);
    charts.push({
      type: 'monthly_returns',
      data: monthlyReturns
    });

    // Trade distribution
    const tradeDistribution = this.calculateTradeDistribution(trades);
    charts.push({
      type: 'trade_distribution',
      data: tradeDistribution
    });

    return charts;
  }

  private calculateMonthlyReturns(trades: any[]): Array<{ x: string; y: number }> {
    const monthlyData: Record<string, number> = {};

    for (const trade of trades) {
      const date = new Date(trade.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += trade.profit || 0;
    }

    return Object.entries(monthlyData).map(([month, profit]) => ({
      x: month,
      y: profit
    }));
  }

  private calculateTradeDistribution(trades: any[]): Array<{ x: number; y: number }> {
    const bins: Record<number, number> = {};
    const binSize = 10; // $10 bins

    for (const trade of trades) {
      const profit = trade.profit || 0;
      const bin = Math.floor(profit / binSize) * binSize;
      bins[bin] = (bins[bin] || 0) + 1;
    }

    return Object.entries(bins)
      .map(([bin, count]) => ({
        x: Number(bin),
        y: count
      }))
      .sort((a, b) => a.x - b.x);
  }

  async getReports(userId: string): Promise<Report[]> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Report[];
  }

  async getReport(reportId: string): Promise<Report | null> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) return null;
    return data as Report;
  }

  async deleteReport(reportId: string): Promise<void> {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;
  }

  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'json'): Promise<Blob> {
    const report = await this.getReport(reportId);
    if (!report) throw new Error('Report not found');

    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(report.data, null, 2)], { type: 'application/json' });
      
      case 'pdf':
        // In a real implementation, you'd use a PDF library like jsPDF
        const pdfContent = this.generatePDFContent(report);
        return new Blob([pdfContent], { type: 'application/pdf' });
      
      case 'excel':
        // In a real implementation, you'd use a library like xlsx
        const csvContent = this.generateCSVContent(report);
        return new Blob([csvContent], { type: 'text/csv' });
      
      default:
        throw new Error('Unsupported format');
    }
  }

  private generatePDFContent(report: Report): string {
    // Simplified PDF generation - in reality, use jsPDF or similar
    return `
Trading Report: ${report.title}
Generated: ${new Date(report.generated_at).toLocaleString()}

Summary:
- Total Trades: ${report.data.summary.total_trades}
- Profit/Loss: $${report.data.summary.profit_loss.toFixed(2)}
- Win Rate: ${report.data.summary.win_rate.toFixed(1)}%
- ROI: ${report.data.summary.roi.toFixed(2)}%

Performance Metrics:
- Sharpe Ratio: ${report.data.performance_metrics.sharpe_ratio.toFixed(2)}
- Max Drawdown: $${report.data.performance_metrics.max_drawdown.toFixed(2)}
- Profit Factor: ${report.data.performance_metrics.profit_factor.toFixed(2)}
- Average Trade: $${report.data.performance_metrics.average_trade.toFixed(2)}
    `;
  }

  private generateCSVContent(report: Report): string {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Trades', report.data.summary.total_trades.toString()],
      ['Profit/Loss', report.data.summary.profit_loss.toString()],
      ['Win Rate', report.data.summary.win_rate.toString()],
      ['ROI', report.data.summary.roi.toString()],
      ['Sharpe Ratio', report.data.performance_metrics.sharpe_ratio.toString()],
      ['Max Drawdown', report.data.performance_metrics.max_drawdown.toString()],
      ['Profit Factor', report.data.performance_metrics.profit_factor.toString()]
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  async scheduleReport(userId: string, reportType: string, frequency: 'daily' | 'weekly' | 'monthly', options: any = {}): Promise<void> {
    // In a real implementation, this would set up a scheduled job
    const { error } = await supabase
      .from('scheduled_reports')
      .insert([{
        user_id: userId,
        report_type: reportType,
        frequency: frequency,
        options: options,
        next_run: this.calculateNextRun(frequency),
        is_active: true
      }]);

    if (error) throw error;
  }

  private calculateNextRun(frequency: string): string {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
    }
    
    return now.toISOString();
  }
}