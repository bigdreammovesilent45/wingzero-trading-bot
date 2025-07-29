-- Create tables for Wing Zero cloud engine functionality

-- Engine status tracking
CREATE TABLE IF NOT EXISTS public.wingzero_engine_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  is_running BOOLEAN NOT NULL DEFAULT false,
  engine_mode TEXT NOT NULL DEFAULT 'client',
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_cycle TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trading configurations for cloud engine
CREATE TABLE IF NOT EXISTS public.wingzero_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  config_name TEXT NOT NULL DEFAULT 'default',
  brain_enabled BOOLEAN NOT NULL DEFAULT true,
  brain_mode TEXT NOT NULL DEFAULT 'balanced',
  min_confidence INTEGER NOT NULL DEFAULT 85,
  max_risk_per_trade DECIMAL NOT NULL DEFAULT 0.02,
  max_daily_drawdown DECIMAL NOT NULL DEFAULT 0.05,
  config_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Encrypted broker credentials for cloud engine
CREATE TABLE IF NOT EXISTS public.wingzero_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  broker_type TEXT NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  encrypted_account_id TEXT NOT NULL,
  server_url TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'practice',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activity logging for cloud engine
CREATE TABLE IF NOT EXISTS public.wingzero_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cloud engine heartbeat tracking
CREATE TABLE IF NOT EXISTS public.wingzero_heartbeats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  heartbeat_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  engine_status TEXT NOT NULL,
  active_positions INTEGER DEFAULT 0,
  daily_pnl DECIMAL DEFAULT 0,
  data JSONB
);

-- Enable Row Level Security
ALTER TABLE public.wingzero_engine_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wingzero_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wingzero_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wingzero_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wingzero_heartbeats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user data access
CREATE POLICY "Users can manage their own engine status" 
ON public.wingzero_engine_status 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own configs" 
ON public.wingzero_configs 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own credentials" 
ON public.wingzero_credentials 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity log" 
ON public.wingzero_activity_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity log" 
ON public.wingzero_activity_log 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own heartbeats" 
ON public.wingzero_heartbeats 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_wingzero_engine_status_user_id ON public.wingzero_engine_status(user_id);
CREATE INDEX idx_wingzero_configs_user_id ON public.wingzero_configs(user_id);
CREATE INDEX idx_wingzero_credentials_user_id ON public.wingzero_credentials(user_id);
CREATE INDEX idx_wingzero_activity_log_user_id ON public.wingzero_activity_log(user_id);
CREATE INDEX idx_wingzero_activity_log_timestamp ON public.wingzero_activity_log(timestamp);
CREATE INDEX idx_wingzero_heartbeats_user_id ON public.wingzero_heartbeats(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_wingzero_engine_status_updated_at
BEFORE UPDATE ON public.wingzero_engine_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wingzero_configs_updated_at
BEFORE UPDATE ON public.wingzero_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();