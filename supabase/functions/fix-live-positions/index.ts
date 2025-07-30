import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OandaTrade {
  id: string;
  instrument: string;
  currentUnits: string;
  price: string;
  openTime: string;
  state: string;
  unrealizedPL: string;
  stopLossOrder?: any;
  takeProfitOrder?: any;
  trailingStopLossOrder?: any;
}

interface RiskManagementParams {
  stopLossPips: number;
  takeProfitPips: number;
  trailingStopPips: number;
  riskRewardRatio: number;
}

serve(async (req) => {
  console.log(`🛡️ Fix Live Positions initiated - ${new Date().toISOString()}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔧 Fixing live positions for user: ${user.id}`);

    // Get user's OANDA credentials
    const { data: credentials, error: credError } = await supabase
      .from('wingzero_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('broker_type', 'oanda')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (credError || !credentials) {
      throw new Error('No OANDA credentials found. Please configure OANDA credentials first.');
    }

    // Decode credentials
    const apiKey = atob(credentials.encrypted_api_key);
    const accountId = atob(credentials.encrypted_account_id);
    const serverUrl = credentials.server_url;

    console.log(`🏦 Fetching open trades from account: ${accountId}`);

    // Fetch open trades from OANDA
    const tradesResponse = await fetch(`${serverUrl}/v3/accounts/${accountId}/trades`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!tradesResponse.ok) {
      throw new Error(`OANDA API error: ${tradesResponse.status} ${tradesResponse.statusText}`);
    }

    const tradesData = await tradesResponse.json();
    const openTrades: OandaTrade[] = tradesData.trades || [];

    console.log(`📊 Found ${openTrades.length} open trades`);

    if (openTrades.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No open trades found to fix',
        fixedTrades: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Wing Zero strategy configuration for risk parameters
    const { data: configData } = await supabase
      .from('wingzero_configs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Default Wing Zero risk parameters (using conservative values)
    const riskParams: RiskManagementParams = {
      stopLossPips: configData?.config_data?.passiveStopLossPips || 25,
      takeProfitPips: configData?.config_data?.passiveTakeProfitPips || 50,
      trailingStopPips: configData?.config_data?.trailingStopDistance || 15,
      riskRewardRatio: configData?.config_data?.riskRewardRatio || 2.0
    };

    console.log(`🎯 Using risk parameters:`, riskParams);

    const fixedTrades = [];
    const failures = [];

    for (const trade of openTrades) {
      try {
        console.log(`🔧 Fixing trade ${trade.id} for ${trade.instrument}`);
        
        // Check if trade already has risk management
        const hasStopLoss = !!trade.stopLossOrder;
        const hasTakeProfit = !!trade.takeProfitOrder;
        const hasTrailingStop = !!trade.trailingStopLossOrder;
        
        if (hasStopLoss && hasTakeProfit && hasTrailingStop) {
          console.log(`✅ Trade ${trade.id} already has full risk management`);
          continue;
        }

        const currentPrice = parseFloat(trade.price);
        const units = parseFloat(trade.currentUnits);
        const isLong = units > 0;
        
        // Calculate pip value based on instrument
        const pipValue = trade.instrument.includes('JPY') ? 0.01 : 0.0001;
        
        // Calculate proper stop loss and take profit
        let stopLossPrice: number;
        let takeProfitPrice: number;
        
        if (isLong) {
          // Long position: SL below current price, TP above
          stopLossPrice = currentPrice - (riskParams.stopLossPips * pipValue);
          takeProfitPrice = currentPrice + (riskParams.takeProfitPips * pipValue);
        } else {
          // Short position: SL above current price, TP below
          stopLossPrice = currentPrice + (riskParams.stopLossPips * pipValue);
          takeProfitPrice = currentPrice - (riskParams.takeProfitPips * pipValue);
        }

        const trailingStopDistance = riskParams.trailingStopPips * pipValue;

        console.log(`📊 Trade ${trade.id}: Current=${currentPrice.toFixed(5)}, SL=${stopLossPrice.toFixed(5)}, TP=${takeProfitPrice.toFixed(5)}, TS=${trailingStopDistance.toFixed(5)}`);

        // Create/update stop loss order if missing
        if (!hasStopLoss) {
          const stopLossOrder = {
            order: {
              type: 'STOP_LOSS',
              tradeID: trade.id,
              price: stopLossPrice.toFixed(5),
              timeInForce: 'GTC'
            }
          };

          const slResponse = await fetch(`${serverUrl}/v3/accounts/${accountId}/orders`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(stopLossOrder)
          });

          if (slResponse.ok) {
            console.log(`✅ Stop Loss added to trade ${trade.id}`);
          } else {
            const errorData = await slResponse.json();
            console.error(`❌ Failed to add Stop Loss to trade ${trade.id}:`, errorData);
          }
        }

        // Create/update take profit order if missing
        if (!hasTakeProfit) {
          const takeProfitOrder = {
            order: {
              type: 'TAKE_PROFIT',
              tradeID: trade.id,
              price: takeProfitPrice.toFixed(5),
              timeInForce: 'GTC'
            }
          };

          const tpResponse = await fetch(`${serverUrl}/v3/accounts/${accountId}/orders`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(takeProfitOrder)
          });

          if (tpResponse.ok) {
            console.log(`✅ Take Profit added to trade ${trade.id}`);
          } else {
            const errorData = await tpResponse.json();
            console.error(`❌ Failed to add Take Profit to trade ${trade.id}:`, errorData);
          }
        }

        // Create/update trailing stop order if missing
        if (!hasTrailingStop) {
          const trailingStopOrder = {
            order: {
              type: 'TRAILING_STOP_LOSS',
              tradeID: trade.id,
              distance: trailingStopDistance.toFixed(5),
              timeInForce: 'GTC'
            }
          };

          const tsResponse = await fetch(`${serverUrl}/v3/accounts/${accountId}/orders`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(trailingStopOrder)
          });

          if (tsResponse.ok) {
            console.log(`✅ Trailing Stop added to trade ${trade.id}`);
          } else {
            const errorData = await tsResponse.json();
            console.error(`❌ Failed to add Trailing Stop to trade ${trade.id}:`, errorData);
          }
        }

        fixedTrades.push({
          tradeId: trade.id,
          instrument: trade.instrument,
          units: trade.currentUnits,
          currentPrice: currentPrice.toFixed(5),
          stopLoss: stopLossPrice.toFixed(5),
          takeProfit: takeProfitPrice.toFixed(5),
          trailingStop: trailingStopDistance.toFixed(5),
          riskRewardRatio: (riskParams.takeProfitPips / riskParams.stopLossPips).toFixed(2)
        });

      } catch (error) {
        console.error(`❌ Failed to fix trade ${trade.id}:`, error);
        failures.push({
          tradeId: trade.id,
          error: error.message
        });
      }
    }

    const successMessage = `🛡️ WING ZERO RISK MANAGEMENT APPLIED! Fixed ${fixedTrades.length} trades with proper TP/SL/TS`;
    
    console.log(successMessage);

    return new Response(JSON.stringify({
      success: true,
      message: successMessage,
      fixedTrades: fixedTrades.length,
      failedTrades: failures.length,
      trades: fixedTrades,
      failures: failures,
      riskParameters: riskParams
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error fixing live positions:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});