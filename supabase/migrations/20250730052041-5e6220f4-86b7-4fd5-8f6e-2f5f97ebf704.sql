-- Fix security definer functions to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.trading_preferences (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_security_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Fix the search path for the existing insert_ai_strategy function
CREATE OR REPLACE FUNCTION public.insert_ai_strategy(p_user_id uuid, p_strategy_name text, p_strategy_type text, p_parameters jsonb, p_status text DEFAULT 'testing'::text, p_created_by text DEFAULT 'ai_brain'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  strategy_id UUID;
BEGIN
  INSERT INTO public.wingzero_strategies (
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

-- Fix the has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;