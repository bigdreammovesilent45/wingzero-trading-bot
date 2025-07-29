-- Create tables for Wing Zero self-awareness system

-- Performance Intelligence - stores analytics and insights
CREATE TABLE wingzero_performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  analysis_type TEXT NOT NULL, -- 'trade_analysis', 'strategy_performance', 'risk_assessment'
  time_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  metrics JSONB NOT NULL, -- win_rate, profit_loss, drawdown, etc.
  insights JSONB NOT NULL, -- AI-generated insights and recommendations
  confidence_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Market Intelligence - stores market research and analysis
CREATE TABLE wingzero_market_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  intelligence_type TEXT NOT NULL, -- 'news_analysis', 'market_sentiment', 'trend_analysis'
  source_url TEXT,
  content TEXT,
  analysis JSONB NOT NULL, -- AI analysis of market conditions
  impact_score NUMERIC DEFAULT 0, -- How much this affects trading decisions
  sentiment TEXT, -- 'bullish', 'bearish', 'neutral'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours')
);

-- Strategy Evolution - stores generated and tested strategies
CREATE TABLE wingzero_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  strategy_name TEXT NOT NULL,
  strategy_type TEXT NOT NULL, -- 'ai_generated', 'evolved', 'hybrid'
  parameters JSONB NOT NULL, -- strategy configuration
  performance_metrics JSONB, -- backtesting and live results
  status TEXT DEFAULT 'testing', -- 'testing', 'active', 'retired'
  created_by TEXT DEFAULT 'ai_brain', -- 'ai_brain', 'evolution_engine'
  parent_strategy_id UUID, -- for evolved strategies
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Self-Optimization - stores optimization history and decisions
CREATE TABLE wingzero_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  optimization_type TEXT NOT NULL, -- 'parameter_tuning', 'risk_adjustment', 'strategy_switch'
  trigger_reason TEXT NOT NULL, -- what caused the optimization
  old_config JSONB,
  new_config JSONB,
  expected_improvement NUMERIC,
  actual_improvement NUMERIC,
  status TEXT DEFAULT 'pending', -- 'pending', 'applied', 'reverted'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  applied_at TIMESTAMP WITH TIME ZONE
);

-- Learning Database - stores all learning experiences
CREATE TABLE wingzero_learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  learning_type TEXT NOT NULL, -- 'trade_outcome', 'market_event', 'strategy_result'
  input_data JSONB NOT NULL, -- market conditions, signals, etc.
  action_taken JSONB NOT NULL, -- what the AI decided to do
  outcome JSONB NOT NULL, -- results of the action
  lesson_learned TEXT, -- AI-generated lesson
  confidence_impact NUMERIC DEFAULT 0, -- how this affects future confidence
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Self-Diagnostics - monitors system health
CREATE TABLE wingzero_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  component TEXT NOT NULL, -- 'trading_engine', 'data_feed', 'ai_brain'
  health_status TEXT DEFAULT 'healthy', -- 'healthy', 'warning', 'error'
  metrics JSONB NOT NULL, -- performance metrics, error rates, etc.
  issues_detected JSONB, -- any problems found
  auto_fixes_applied JSONB, -- automatic corrections made
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS policies for all tables
ALTER TABLE wingzero_performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE wingzero_market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE wingzero_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE wingzero_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wingzero_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE wingzero_diagnostics ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can manage their own analytics" ON wingzero_performance_analytics
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own intelligence" ON wingzero_market_intelligence
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own strategies" ON wingzero_strategies
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own optimizations" ON wingzero_optimizations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own learning data" ON wingzero_learning_data
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own diagnostics" ON wingzero_diagnostics
  FOR ALL USING (auth.uid() = user_id);

-- Service role policies for AI operations
CREATE POLICY "Service role can manage analytics" ON wingzero_performance_analytics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage intelligence" ON wingzero_market_intelligence
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage strategies" ON wingzero_strategies
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage optimizations" ON wingzero_optimizations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage learning data" ON wingzero_learning_data
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage diagnostics" ON wingzero_diagnostics
  FOR ALL USING (auth.role() = 'service_role');