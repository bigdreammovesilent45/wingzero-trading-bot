-- Ensure wingzero_market_intelligence table exists with proper structure
CREATE TABLE IF NOT EXISTS public.wingzero_market_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  intelligence_type TEXT NOT NULL,
  content TEXT,
  analysis JSONB,
  source_url TEXT,
  sentiment TEXT,
  impact_score DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wingzero_market_intelligence ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
DROP POLICY IF EXISTS "Users can view their own intelligence" ON public.wingzero_market_intelligence;
CREATE POLICY "Users can view their own intelligence" 
ON public.wingzero_market_intelligence 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own intelligence" ON public.wingzero_market_intelligence;
CREATE POLICY "Users can create their own intelligence" 
ON public.wingzero_market_intelligence 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own intelligence" ON public.wingzero_market_intelligence;
CREATE POLICY "Users can update their own intelligence" 
ON public.wingzero_market_intelligence 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own intelligence" ON public.wingzero_market_intelligence;
CREATE POLICY "Users can delete their own intelligence" 
ON public.wingzero_market_intelligence 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_wingzero_market_intelligence_updated_at ON public.wingzero_market_intelligence;
CREATE TRIGGER update_wingzero_market_intelligence_updated_at
BEFORE UPDATE ON public.wingzero_market_intelligence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure wingzero_strategies table exists
CREATE TABLE IF NOT EXISTS public.wingzero_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  strategy_name TEXT NOT NULL,
  strategy_type TEXT,
  parameters JSONB,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for strategies
ALTER TABLE public.wingzero_strategies ENABLE ROW LEVEL SECURITY;

-- Create policies for strategies
DROP POLICY IF EXISTS "Users can view their own strategies" ON public.wingzero_strategies;
CREATE POLICY "Users can view their own strategies" 
ON public.wingzero_strategies 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own strategies" ON public.wingzero_strategies;
CREATE POLICY "Users can create their own strategies" 
ON public.wingzero_strategies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own strategies" ON public.wingzero_strategies;
CREATE POLICY "Users can update their own strategies" 
ON public.wingzero_strategies 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_wingzero_strategies_updated_at ON public.wingzero_strategies;
CREATE TRIGGER update_wingzero_strategies_updated_at
BEFORE UPDATE ON public.wingzero_strategies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure wingzero_optimizations table exists
CREATE TABLE IF NOT EXISTS public.wingzero_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  optimization_type TEXT NOT NULL,
  old_config JSONB,
  new_config JSONB,
  expected_improvement DECIMAL,
  trigger_reason TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for optimizations
ALTER TABLE public.wingzero_optimizations ENABLE ROW LEVEL SECURITY;

-- Create policies for optimizations
DROP POLICY IF EXISTS "Users can view their own optimizations" ON public.wingzero_optimizations;
CREATE POLICY "Users can view their own optimizations" 
ON public.wingzero_optimizations 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own optimizations" ON public.wingzero_optimizations;
CREATE POLICY "Users can create their own optimizations" 
ON public.wingzero_optimizations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own optimizations" ON public.wingzero_optimizations;
CREATE POLICY "Users can update their own optimizations" 
ON public.wingzero_optimizations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_wingzero_optimizations_updated_at ON public.wingzero_optimizations;
CREATE TRIGGER update_wingzero_optimizations_updated_at
BEFORE UPDATE ON public.wingzero_optimizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();