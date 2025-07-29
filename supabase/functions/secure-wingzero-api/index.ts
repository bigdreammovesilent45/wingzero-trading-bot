import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WingZeroRequest {
  action: 'getAccount' | 'getPositions' | 'placeOrder' | 'closePosition';
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

    const { action, params }: WingZeroRequest = await req.json();

    // Get WingZero API credentials from secrets
    const wingzeroApiKey = Deno.env.get('WINGZERO_API_KEY');
    const wingzeroApiSecret = Deno.env.get('WINGZERO_API_SECRET');
    
    if (!wingzeroApiKey || !wingzeroApiSecret) {
      return new Response(JSON.stringify({ error: 'API credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let response;
    const baseUrl = 'https://api.wingzero.ai/v1';

    // Log the API call for audit purposes
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: `wingzero_api_${action}`,
      new_values: { action, params },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    });

    switch (action) {
      case 'getAccount':
        response = await fetch(`${baseUrl}/account`, {
          headers: {
            'Authorization': `Bearer ${wingzeroApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        break;

      case 'getPositions':
        response = await fetch(`${baseUrl}/positions`, {
          headers: {
            'Authorization': `Bearer ${wingzeroApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        break;

      case 'placeOrder':
        response = await fetch(`${baseUrl}/orders`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${wingzeroApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
        break;

      case 'closePosition':
        response = await fetch(`${baseUrl}/positions/${params.positionId}/close`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${wingzeroApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ volume: params.volume }),
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
    console.error('Error in secure-wingzero-api:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});