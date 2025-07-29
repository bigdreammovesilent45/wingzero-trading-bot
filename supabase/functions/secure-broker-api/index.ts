import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrokerRequest {
  action: 'getAccount' | 'requestWithdrawal' | 'testConnection';
  params?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, params }: BrokerRequest = await req.json();

    // Get broker API credentials from secrets
    const brokerApiKey = Deno.env.get('BROKER_API_KEY');
    const brokerApiSecret = Deno.env.get('BROKER_API_SECRET');
    const brokerBaseUrl = Deno.env.get('BROKER_BASE_URL') || 'https://api.ctrader.com';
    
    if (!brokerApiKey || !brokerApiSecret) {
      return new Response(JSON.stringify({ error: 'Broker API credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the API call for audit purposes
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: `broker_api_${action}`,
      new_values: { action, params },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    });

    let response;

    switch (action) {
      case 'getAccount':
        response = await fetch(`${brokerBaseUrl}/v1/accounts`, {
          headers: {
            'Authorization': `Bearer ${brokerApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        break;

      case 'requestWithdrawal':
        response = await fetch(`${brokerBaseUrl}/v1/withdrawals`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${brokerApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
        break;

      case 'testConnection':
        response = await fetch(`${brokerBaseUrl}/v1/ping`, {
          headers: {
            'Authorization': `Bearer ${brokerApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in secure-broker-api:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});