-- Fix the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add missing policy for password_reset_tokens INSERT
CREATE POLICY "System can insert password reset tokens" 
  ON public.password_reset_tokens 
  FOR INSERT 
  WITH CHECK (true);