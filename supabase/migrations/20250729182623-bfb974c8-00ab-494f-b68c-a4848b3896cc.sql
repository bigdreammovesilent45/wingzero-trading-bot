-- Fix RLS policy for wingzero_engine_status to allow edge function updates
DROP POLICY IF EXISTS "Users can manage their own engine status" ON wingzero_engine_status;

-- Create separate policies for better control
CREATE POLICY "Users can view their own engine status" 
ON wingzero_engine_status 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own engine status" 
ON wingzero_engine_status 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own engine status" 
ON wingzero_engine_status 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow service role to update engine status (for cloud engine)
CREATE POLICY "Service role can manage engine status" 
ON wingzero_engine_status 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can delete their own engine status" 
ON wingzero_engine_status 
FOR DELETE 
USING (auth.uid() = user_id);