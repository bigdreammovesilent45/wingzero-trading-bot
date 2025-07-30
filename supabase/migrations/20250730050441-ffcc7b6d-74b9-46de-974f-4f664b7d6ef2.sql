-- Create advanced_strategies table
CREATE TABLE public.advanced_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('grid', 'martingale', 'scalping', 'swing', 'arbitrage', 'custom')),
  parameters JSONB NOT NULL DEFAULT '{}',
  backtest_results JSONB,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolios table
CREATE TABLE public.portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  allocation_strategy JSONB NOT NULL DEFAULT '{}',
  total_balance NUMERIC NOT NULL DEFAULT 0,
  total_equity NUMERIC NOT NULL DEFAULT 0,
  total_profit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trading_accounts table
CREATE TABLE public.trading_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID,
  broker TEXT NOT NULL,
  account_id TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('demo', 'live')),
  balance NUMERIC NOT NULL DEFAULT 0,
  equity NUMERIC NOT NULL DEFAULT 0,
  margin NUMERIC NOT NULL DEFAULT 0,
  free_margin NUMERIC NOT NULL DEFAULT 0,
  allocation_percentage NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE
);

-- Create portfolio_performance table
CREATE TABLE public.portfolio_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_value NUMERIC NOT NULL DEFAULT 0,
  daily_pnl NUMERIC NOT NULL DEFAULT 0,
  total_return NUMERIC NOT NULL DEFAULT 0,
  drawdown NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'custom')),
  title TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  format TEXT NOT NULL CHECK (format IN ('pdf', 'excel', 'json')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scheduled_reports table
CREATE TABLE public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  schedule TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create api_keys table
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  rate_limit INTEGER NOT NULL DEFAULT 1000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  team_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.advanced_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for advanced_strategies
CREATE POLICY "Users can manage their own strategies" ON public.advanced_strategies
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for portfolios
CREATE POLICY "Users can manage their own portfolios" ON public.portfolios
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for trading_accounts
CREATE POLICY "Users can manage their own trading accounts" ON public.trading_accounts
FOR ALL USING (auth.uid() = (SELECT user_id FROM public.portfolios WHERE id = portfolio_id));

-- Create RLS policies for portfolio_performance
CREATE POLICY "Users can view their own portfolio performance" ON public.portfolio_performance
FOR ALL USING (auth.uid() = (SELECT user_id FROM public.portfolios WHERE id = portfolio_id));

-- Create RLS policies for reports
CREATE POLICY "Users can manage their own reports" ON public.reports
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for scheduled_reports
CREATE POLICY "Users can manage their own scheduled reports" ON public.scheduled_reports
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for api_keys
CREATE POLICY "Users can manage their own API keys" ON public.api_keys
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for teams
CREATE POLICY "Team members can view their teams" ON public.teams
FOR SELECT USING (id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Team members can update their teams" ON public.teams
FOR UPDATE USING (id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Create RLS policies for team_members
CREATE POLICY "Users can view team memberships" ON public.team_members
FOR SELECT USING (user_id = auth.uid() OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Team admins can manage memberships" ON public.team_members
FOR ALL USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Create triggers for updated_at columns
CREATE TRIGGER update_advanced_strategies_updated_at
BEFORE UPDATE ON public.advanced_strategies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
BEFORE UPDATE ON public.portfolios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trading_accounts_updated_at
BEFORE UPDATE ON public.trading_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at
BEFORE UPDATE ON public.scheduled_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_advanced_strategies_user_id ON public.advanced_strategies(user_id);
CREATE INDEX idx_advanced_strategies_active ON public.advanced_strategies(is_active);
CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX idx_trading_accounts_portfolio_id ON public.trading_accounts(portfolio_id);
CREATE INDEX idx_portfolio_performance_portfolio_id ON public.portfolio_performance(portfolio_id);
CREATE INDEX idx_portfolio_performance_date ON public.portfolio_performance(date);
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_scheduled_reports_user_id ON public.scheduled_reports(user_id);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key ON public.api_keys(key);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);