export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  user_id: string;
  team_id: string;
  role: UserRole;
  joined_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  accounts: TradingAccount[];
  allocation_strategy: AllocationStrategy;
  total_balance: number;
  total_equity: number;
  total_profit: number;
  created_at: string;
  updated_at: string;
}

export interface TradingAccount {
  id: string;
  portfolio_id: string;
  broker: string;
  account_id: string;
  account_type: 'demo' | 'live';
  balance: number;
  equity: number;
  margin: number;
  free_margin: number;
  allocation_percentage: number;
  is_active: boolean;
}

export interface AllocationStrategy {
  type: 'equal' | 'proportional' | 'risk_based' | 'custom';
  parameters: Record<string, any>;
}

export interface AdvancedStrategy {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  strategy_type: 'grid' | 'martingale' | 'scalping' | 'swing' | 'arbitrage' | 'custom';
  parameters: StrategyParameters;
  backtest_results?: BacktestResult;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StrategyParameters {
  timeframe: string;
  symbols: string[];
  entry_conditions: Condition[];
  exit_conditions: Condition[];
  risk_management: RiskParameters;
  custom_indicators?: CustomIndicator[];
}

export interface Condition {
  type: 'indicator' | 'price' | 'time' | 'custom';
  operator: 'greater_than' | 'less_than' | 'equals' | 'crosses_above' | 'crosses_below';
  value: number | string;
  indicator?: string;
}

export interface RiskParameters {
  max_risk_per_trade: number;
  max_daily_loss: number;
  position_sizing: 'fixed' | 'percentage' | 'volatility_based';
  stop_loss_type: 'fixed' | 'atr' | 'percentage';
  take_profit_type: 'fixed' | 'rr_ratio' | 'trailing';
}

export interface CustomIndicator {
  name: string;
  formula: string;
  parameters: Record<string, number>;
}

export interface BacktestResult {
  period_start: string;
  period_end: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  profit_factor: number;
  max_drawdown: number;
  sharpe_ratio: number;
  net_profit: number;
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  entry_time: string;
  exit_time: string;
  symbol: string;
  direction: 'buy' | 'sell';
  entry_price: number;
  exit_price: number;
  quantity: number;
  profit: number;
  strategy_signals: string[];
}

export interface Report {
  id: string;
  user_id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  title: string;
  data: ReportData;
  format: 'pdf' | 'excel' | 'json';
  created_at: string;
  generated_at: string;
}

export interface ReportData {
  period: {
    start: string;
    end: string;
  };
  summary: {
    total_trades: number;
    profit_loss: number;
    win_rate: number;
    roi: number;
  };
  performance_metrics: PerformanceMetrics;
  trade_analysis: TradeAnalysis;
  charts: ChartData[];
}

export interface PerformanceMetrics {
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  profit_factor: number;
  average_trade: number;
  largest_win: number;
  largest_loss: number;
  consecutive_wins: number;
  consecutive_losses: number;
}

export interface TradeAnalysis {
  by_symbol: Record<string, {
    trades: number;
    profit: number;
    win_rate: number;
  }>;
  by_strategy: Record<string, {
    trades: number;
    profit: number;
    win_rate: number;
  }>;
  by_timeframe: Record<string, {
    trades: number;
    profit: number;
    win_rate: number;
  }>;
}

export interface ChartData {
  type: 'equity_curve' | 'drawdown' | 'monthly_returns' | 'trade_distribution';
  data: Array<{
    x: string | number;
    y: number;
  }>;
}

export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key: string;
  permissions: string[];
  rate_limit: number;
  is_active: boolean;
  last_used: string;
  created_at: string;
  expires_at?: string;
}

export interface BrokerIntegration {
  id: string;
  name: string;
  type: 'ctrader' | 'interactive_brokers' | 'mt4' | 'mt5' | 'binance' | 'kraken';
  api_config: BrokerAPIConfig;
  supported_features: string[];
  is_available: boolean;
}

export interface BrokerAPIConfig {
  base_url: string;
  auth_type: 'api_key' | 'oauth' | 'basic';
  endpoints: Record<string, string>;
  rate_limits: Record<string, number>;
  websocket_url?: string;
}