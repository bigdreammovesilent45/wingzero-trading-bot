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
    stopLossOnFill?: {
      price: string;
      timeInForce: string;
    };
    takeProfitOnFill?: {
      price: string;
      timeInForce: string;
    };
    trailingStopLossOnFill?: {
      distance: string;
      timeInForce: string;
    };
  }
}

serve(async (req) => {
  console.log(`🎯 Manual trade test initiated - ${new Date().toISOString()}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('⚡ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {

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
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

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

    // Get current market data for better trade decisions
    const instruments = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD'];
    
    // Fetch current prices for all instruments to make informed decision
    const marketAnalysis = [];
    for (const instrument of instruments) {
      try {
        const priceResponse = await fetch(`${serverUrl}/v3/accounts/${accountId}/pricing?instruments=${instrument}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          const price = priceData.prices[0];
          const spread = parseFloat(price.asks[0].price) - parseFloat(price.bids[0].price);
          
          marketAnalysis.push({
            instrument,
            bid: parseFloat(price.bids[0].price),
            ask: parseFloat(price.asks[0].price),
            spread: spread,
            mid: (parseFloat(price.asks[0].price) + parseFloat(price.bids[0].price)) / 2
          });
        }
      } catch (error) {
        console.log(`⚠️ Could not fetch price for ${instrument}`);
      }
    }

    // Choose instrument with lowest spread for better execution
    const bestInstrument = marketAnalysis.length > 0 
      ? marketAnalysis.reduce((best, current) => current.spread < best.spread ? current : best)
      : { instrument: 'EUR_USD', bid: 1.1000, ask: 1.1001, spread: 0.0001, mid: 1.1000 };

    console.log(`📊 Selected ${bestInstrument.instrument} with spread: ${bestInstrument.spread.toFixed(5)}`);

    // Use conservative position size (500 units instead of 1000)
    const units = 500;
    const direction = 'buy'; // Always buy for test trades (typically safer)
    
    console.log(`🎲 Conservative test trade: ${direction.toUpperCase()} ${bestInstrument.instrument} (${units} units)`);

    // WING ZERO MANDATE: Calculate PROPER risk management parameters
    const pipValue = bestInstrument.instrument.includes('JPY') ? 0.01 : 0.0001;
    const stopLossPips = 25; // Proper stop loss distance
    const takeProfitPips = 50; // 2:1 risk-reward ratio minimum
    
    const entryPrice = direction === 'buy' ? bestInstrument.ask : bestInstrument.bid;
    const takeProfit = direction === 'buy' 
      ? entryPrice + (takeProfitPips * pipValue)
      : entryPrice - (takeProfitPips * pipValue);
    const stopLoss = direction === 'buy'
      ? entryPrice - (stopLossPips * pipValue)
      : entryPrice + (stopLossPips * pipValue);
    
    // Validate risk-reward ratio
    const riskReward = takeProfitPips / stopLossPips;
    console.log(`🎯 WING ZERO MANDATE: Trade with R:R = ${riskReward} (TP: ${takeProfit.toFixed(5)}, SL: ${stopLoss.toFixed(5)})`);
    
    if (riskReward < 1.5) {
      throw new Error(`Risk-Reward ratio ${riskReward} does not meet Wing Zero minimum standard of 1.5`);
    }

    // WING ZERO MANDATE: Create trade order with MANDATORY risk management
    const tradeOrder: OandaTradeRequest = {
      order: {
        units: units.toString(),
        instrument: bestInstrument.instrument,
        timeInForce: 'FOK', // Fill or Kill
        type: 'MARKET',
        positionFill: 'DEFAULT',
        stopLossOnFill: {
          price: stopLoss.toString(),
          timeInForce: 'GTC'
        },
        takeProfitOnFill: {
          price: takeProfit.toString(),
          timeInForce: 'GTC'
        },
        trailingStopLossOnFill: {
          distance: (15 * pipValue).toString(), // 15 pips trailing stop
          timeInForce: 'GTC'
        }
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
      symbol: bestInstrument.instrument,
      position_type: direction,
      volume: units / 10000, // Convert to lots
      status: 'open',
      order_id: `manual-test-${Date.now()}`,
      ticket: tradeResult.orderFillTransaction?.id || Math.floor(Math.random() * 1000000),
      opened_at: new Date().toISOString(),
      comment: 'Conservative Wing Zero Test Trade',
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
        message: `🎯 Conservative Wing Zero test trade executed successfully!`,
      trade: {
        instrument: bestInstrument.instrument,
        direction: direction.toUpperCase(),
        units: units,
        spread: bestInstrument.spread.toFixed(5),
        takeProfit: takeProfit.toFixed(5),
        stopLoss: stopLoss.toFixed(5),
        riskRewardRatio: riskReward.toFixed(2),
        trailingStop: (15 * pipValue).toFixed(5),
        orderId: tradeResult.orderCreateTransaction?.id,
        fillPrice: tradeResult.orderFillTransaction?.price,
        timestamp: new Date().toISOString(),
        wingZeroCompliant: '✅ FULL RISK MANAGEMENT APPLIED'
      },
        marketAnalysis: {
          instrumentsAnalyzed: marketAnalysis.length,
          selectedInstrument: bestInstrument.instrument,
          reason: 'Lowest spread for better execution'
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