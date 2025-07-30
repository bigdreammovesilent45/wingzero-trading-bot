-- Create trading preferences table for user-specific trading settings
CREATE TABLE public.trading_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_tolerance TEXT NOT NULL DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high', 'aggressive')),
  max_position_size NUMERIC NOT NULL DEFAULT 1.0,
  max_daily_volume NUMERIC NOT NULL DEFAULT 10.0,
  preferred_symbols TEXT[] NOT NULL DEFAULT '{"EURUSD", "GBPUSD", "USDJPY"}',
  forbidden_symbols TEXT[] NOT NULL DEFAULT '{}',
  auto_close_at_loss NUMERIC NOT NULL DEFAULT 2.0,
  auto_close_at_profit NUMERIC NOT NULL DEFAULT 5.0,
  trading_hours_start TIME NOT NULL DEFAULT '09:00:00',
  trading_hours_end TIME NOT NULL DEFAULT '17:00:00',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  email_alerts BOOLEAN NOT NULL DEFAULT true,
  sms_alerts BOOLEAN NOT NULL DEFAULT false,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.trading_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own trading preferences" 
  ON public.trading_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trading preferences" 
  ON public.trading_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trading preferences" 
  ON public.trading_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trading preferences" 
  ON public.trading_preferences 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_trading_preferences_updated_at
  BEFORE UPDATE ON public.trading_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create security settings table for enhanced security features
CREATE TABLE public.user_security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret TEXT,
  ip_whitelist INET[] NOT NULL DEFAULT '{}',
  session_timeout INTEGER NOT NULL DEFAULT 30,
  max_login_attempts INTEGER NOT NULL DEFAULT 5,
  password_expiry_days INTEGER NOT NULL DEFAULT 90,
  login_notifications BOOLEAN NOT NULL DEFAULT true,
  failed_login_lockout_duration INTEGER NOT NULL DEFAULT 15,
  require_2fa_for_trading BOOLEAN NOT NULL DEFAULT false,
  api_access_enabled BOOLEAN NOT NULL DEFAULT false,
  last_password_change TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own security settings" 
  ON public.user_security_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own security settings" 
  ON public.user_security_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings" 
  ON public.user_security_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_security_settings_updated_at
  BEFORE UPDATE ON public.user_security_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit log table for security events
CREATE TABLE public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own security audit log" 
  ON public.security_audit_log 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert security audit log" 
  ON public.security_audit_log 
  FOR INSERT 
  WITH CHECK (true);

-- Create password reset tokens table
CREATE TABLE public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies  
CREATE POLICY "Users can view their own password reset tokens" 
  ON public.password_reset_tokens 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Function to automatically create trading preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_trading_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.trading_preferences (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_security_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Update the existing trigger to also create trading preferences
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();