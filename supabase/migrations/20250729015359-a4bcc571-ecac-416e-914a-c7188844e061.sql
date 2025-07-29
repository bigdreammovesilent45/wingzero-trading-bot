-- Phase 1: Emergency Database Security - Fix RLS Policies

-- 1. Enable RLS on accounts table and create proper policies
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for accounts table
CREATE POLICY "Users can view own accounts" 
ON public.accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" 
ON public.accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" 
ON public.accounts 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" 
ON public.accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- 2. Fix existing RLS policy on wingzero_positions to be user-specific
DROP POLICY IF EXISTS "Allow Wing Zero operations" ON public.wingzero_positions;

CREATE POLICY "Users can view own wingzero positions" 
ON public.wingzero_positions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wingzero positions" 
ON public.wingzero_positions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wingzero positions" 
ON public.wingzero_positions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wingzero positions" 
ON public.wingzero_positions 
FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Ensure all tables have proper user_id defaults
ALTER TABLE public.accounts ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.positions ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.trades ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.wingzero_positions ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 4. Make user_id columns NOT NULL to enforce security
ALTER TABLE public.accounts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.positions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.trades ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.wingzero_positions ALTER COLUMN user_id SET NOT NULL;