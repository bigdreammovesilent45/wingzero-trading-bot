import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OandaTradeRequest {
  order: {
    units: string;
    instrument: string;
    timeInForce: string;
    type: string;
    positionFill: string;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 Manual trade test initiated');

    // Initialize Supabase client with service role for auth verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    console.log(`🔐 Authenticated user: ${user.id}`);

    // Create user-scoped Supabase client for database operations
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get user's OANDA credentials
    console.log(`🔍 Searching for credentials for user: ${user.id}`);
    console.log(`🔍 Auth header being used: ${authHeader.substring(0, 20)}...`);
    
    const { data: credentials, error: credError } = await supabase
      .from('wingzero_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('broker_type', 'oanda')
      .maybeSingle();

    console.log(`🔍 Credentials query result:`, { credentials, credError });
    console.log(`🔍 Number of credentials found:`, credentials ? 1 : 0);

    if (credError) {
      console.error('🚨 Database error fetching credentials:', credError);
      throw new Error(`Database error: ${credError.message}`);
    }

    if (!credentials) {
      console.error('🚨 No OANDA credentials found for user:', user.id);
      
      // Let's also try to see all credentials for debugging
      const { data: allCreds, error: allError } = await supabase
        .from('wingzero_credentials')
        .select('user_id, broker_type, created_at')
        .eq('user_id', user.id);
      
      console.log('🔍 All credentials for user:', allCreds);
      console.log('🔍 All credentials error:', allError);
      
      throw new Error('No OANDA credentials found for user. Please configure OANDA credentials first.');
    }

    console.log('📋 Retrieved OANDA credentials');

    // Decode credentials (they're base64 encoded)
    const apiKey = atob(credentials.encrypted_api_key);
    const accountId = atob(credentials.encrypted_account_id);
    const serverUrl = credentials.server_url;

    console.log(`🏦 Using account: ${accountId} on ${serverUrl}`);

    // Get current account info first
    const accountResponse = await fetch(`${serverUrl}/v3/accounts/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!accountResponse.ok) {
      throw new Error(`Failed to get account info: ${accountResponse.statusText}`);
    }

    const accountData = await accountResponse.json();
    console.log(`💰 Account balance: $${accountData.account.balance}`);

    // Define some popular currency pairs for random selection
    const instruments = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD', 'NZD_USD'];
    const randomInstrument = instruments[Math.floor(Math.random() * instruments.length)];
    
    // Random direction (buy or sell)
    const isBuy = Math.random() > 0.5;
    const units = isBuy ? '1000' : '-1000'; // 1000 units for buy, -1000 for sell
    
    console.log(`🎲 Random trade: ${isBuy ? 'BUY' : 'SELL'} ${randomInstrument} (${units} units)`);

    // Create the trade order
    const tradeOrder: OandaTradeRequest = {
      order: {
        units: units,
        instrument: randomInstrument,
        timeInForce: 'FOK', // Fill or Kill
        type: 'MARKET',
        positionFill: 'DEFAULT'
      }
    };

    // Place the trade
    const tradeResponse = await fetch(`${serverUrl}/v3/accounts/${accountId}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tradeOrder)
    });

    const tradeResult = await tradeResponse.json();
    
    if (!tradeResponse.ok) {
      console.error('❌ Trade failed:', tradeResult);
      throw new Error(`Trade execution failed: ${JSON.stringify(tradeResult)}`);
    }

    console.log('✅ Trade executed successfully:', tradeResult);

    // Record the trade in our database
    const tradeRecord = {
      user_id: user.id,
      symbol: randomInstrument,
      position_type: isBuy ? 'buy' : 'sell',
      volume: Math.abs(parseInt(units)) / 10000, // Convert to lots
      status: 'open',
      order_id: `manual-test-${Date.now()}`,
      ticket: tradeResult.orderFillTransaction?.id || Math.floor(Math.random() * 1000000),
      opened_at: new Date().toISOString(),
      comment: 'Manual Wing Zero Test Trade',
      commission: 0,
      swap: 0
    };

    // Add price information if available
    if (tradeResult.orderFillTransaction) {
      tradeRecord.open_price = parseFloat(tradeResult.orderFillTransaction.price);
      tradeRecord.current_price = parseFloat(tradeResult.orderFillTransaction.price);
      tradeRecord.unrealized_pnl = 0;
    }

    // Save to database
    const { error: dbError } = await supabase
      .from('wingzero_positions')
      .insert(tradeRecord);

    if (dbError) {
      console.error('⚠️ Failed to save trade to database:', dbError);
      // Don't throw error here as the trade was successful
    } else {
      console.log('💾 Trade recorded in database');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `🎯 Wing Zero test trade executed successfully!`,
        trade: {
          instrument: randomInstrument,
          direction: isBuy ? 'BUY' : 'SELL',
          units: units,
          orderId: tradeResult.orderCreateTransaction?.id,
          fillPrice: tradeResult.orderFillTransaction?.price,
          timestamp: new Date().toISOString()
        },
        oandaResponse: tradeResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('❌ Manual trade test failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
})