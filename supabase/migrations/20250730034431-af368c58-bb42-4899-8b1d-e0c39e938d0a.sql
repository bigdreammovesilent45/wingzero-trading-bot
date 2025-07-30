-- Create enterprise tables for Wing Zero advanced features

-- Multi-account management table
CREATE TABLE public.wingzero_multi_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  accounts JSONB NOT NULL DEFAULT '[]'::jsonb,
  strategy TEXT NOT NULL,
  allocation JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_distribution TEXT NOT NULL DEFAULT 'equal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trading accounts table
CREATE TABLE public.wingzero_trading_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  broker TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  equity NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  leverage INTEGER NOT NULL DEFAULT 1,
  environment TEXT NOT NULL DEFAULT 'demo',
  encrypted_credentials TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Risk models table
CREATE TABLE public.wingzero_risk_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC NOT NULL DEFAULT 0.95,
  lookback INTEGER NOT NULL DEFAULT 252,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.wingzero_multi_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wingzero_trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wingzero_risk_models ENABLE ROW LEVEL SECURITY;

-- RLS policies for wingzero_multi_accounts
CREATE POLICY "Users can manage their own multi-account setups"
ON public.wingzero_multi_accounts
FOR ALL
USING (auth.uid() = user_id);

-- RLS policies for wingzero_trading_accounts  
CREATE POLICY "Users can manage their own trading accounts"
ON public.wingzero_trading_accounts
FOR ALL
USING (auth.uid() = user_id);

-- RLS policies for wingzero_risk_models
CREATE POLICY "Users can manage their own risk models"
ON public.wingzero_risk_models
FOR ALL
USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_wingzero_multi_accounts_updated_at
BEFORE UPDATE ON public.wingzero_multi_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wingzero_trading_accounts_updated_at
BEFORE UPDATE ON public.wingzero_trading_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wingzero_risk_models_updated_at
BEFORE UPDATE ON public.wingzero_risk_models
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();