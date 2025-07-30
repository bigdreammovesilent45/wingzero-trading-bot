-- Fix RLS policies for wingzero_strategies table to allow service role access for AI-generated strategies

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Service role can manage strategies" ON wingzero_strategies;
DROP POLICY IF EXISTS "Users can create their own strategies" ON wingzero_strategies;
DROP POLICY IF EXISTS "Users can manage their own strategies" ON wingzero_strategies;
DROP POLICY IF EXISTS "Users can update their own strategies" ON wingzero_strategies;
DROP POLICY IF EXISTS "Users can view their own strategies" ON wingzero_strategies;

-- Create new comprehensive policies that allow both user access and service role access
CREATE POLICY "Allow service role full access to strategies" 
ON wingzero_strategies 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert their own strategies" 
ON wingzero_strategies 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to view their own strategies" 
ON wingzero_strategies 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update their own strategies" 
ON wingzero_strategies 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete their own strategies" 
ON wingzero_strategies 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Ensure the function has proper security context by creating a helper function
CREATE OR REPLACE FUNCTION insert_ai_strategy(
  p_user_id UUID,
  p_strategy_name TEXT,
  p_strategy_type TEXT,
  p_parameters JSONB,
  p_status TEXT DEFAULT 'testing',
  p_created_by TEXT DEFAULT 'ai_brain'
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  strategy_id UUID;
BEGIN
  INSERT INTO wingzero_strategies (
    user_id,
    strategy_name,
    strategy_type,
    parameters,
    status,
    created_by
  ) VALUES (
    p_user_id,
    p_strategy_name,
    p_strategy_type,
    p_parameters,
    p_status,
    p_created_by
  ) RETURNING id INTO strategy_id;
  
  RETURN strategy_id;
END;
$$;