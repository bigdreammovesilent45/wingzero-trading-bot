import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OandaPosition {
  instrument: string;
  long?: {
    units: string;
    averagePrice: string;
    tradeIDs: string[];
    pl: string;
    unrealizedPL: string;
  };
  short?: {
    units: string;
    averagePrice: string;
    tradeIDs: string[];
    pl: string;
    unrealizedPL: string;
  };
}

serve(async (req) => {
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

    console.log(`🔄 Syncing OANDA positions for user: ${user.id}`);

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
      console.error('🚨 No OANDA credentials found for user:', user.id);
      return new Response(JSON.stringify({ 
        error: 'No OANDA credentials found. Please configure OANDA credentials first.',
        synced: 0
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decode credentials
    const apiKey = atob(credentials.encrypted_api_key);
    const accountId = atob(credentials.encrypted_account_id);
    const serverUrl = credentials.server_url;

    console.log(`🏦 Fetching positions from account: ${accountId}`);

    // First, clear existing OANDA synced positions to avoid duplicates
    console.log('🧹 Clearing existing OANDA synced positions...');
    await supabase
      .from('wingzero_positions')
      .delete()
      .eq('user_id', user.id)
      .eq('strategy', 'OANDA_SYNC');

    // Fetch positions from OANDA (serverUrl already includes https://)
    const oandaResponse = await fetch(`${serverUrl}/v3/accounts/${accountId}/positions`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!oandaResponse.ok) {
      const errorText = await oandaResponse.text();
      console.error('🚨 OANDA API error:', errorText);
      return new Response(JSON.stringify({ 
        error: `OANDA API error: ${oandaResponse.status} ${oandaResponse.statusText}`,
        synced: 0
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const oandaData = await oandaResponse.json();
    const positions: OandaPosition[] = oandaData.positions || [];

    console.log(`📊 Found ${positions.length} position instruments from OANDA`);

    // Filter positions to only include those with non-zero units
    const activePositions = positions.filter(pos => 
      (pos.long && parseFloat(pos.long.units) !== 0) || 
      (pos.short && parseFloat(pos.short.units) !== 0)
    );

    console.log(`📊 Found ${activePositions.length} active positions from OANDA`);

    // Convert OANDA positions to Wing Zero format and sync
    const syncedPositions = [];
    
    for (const pos of activePositions) {
      // Handle long positions
      if (pos.long && parseFloat(pos.long.units) !== 0) {
        const wingZeroPosition = {
          user_id: user.id,
          symbol: pos.instrument,
          position_type: 'buy',
          volume: Math.abs(parseFloat(pos.long.units)),
          open_price: parseFloat(pos.long.averagePrice),
          current_price: parseFloat(pos.long.averagePrice), // Will be updated by real-time feeds
          unrealized_pnl: parseFloat(pos.long.unrealizedPL),
          opened_at: new Date().toISOString(),
          order_id: `oanda_${pos.instrument}_long`, // Consistent ID without timestamp
          ticket: parseInt(pos.long.tradeIDs[0] || '0'),
          commission: 0,
          swap: 0,
          status: 'open',
          strategy: 'OANDA_SYNC'
        };

        // Insert position directly since we cleared old ones
        const { error: insertError } = await supabase
          .from('wingzero_positions')
          .insert(wingZeroPosition);

        if (!insertError) {
          syncedPositions.push(wingZeroPosition);
          console.log(`✅ Synced long position: ${pos.instrument} ${wingZeroPosition.volume} units`);
        } else {
          console.error(`❌ Failed to sync long position ${pos.instrument}:`, insertError);
        }
      }

      // Handle short positions
      if (pos.short && parseFloat(pos.short.units) !== 0) {
        const wingZeroPosition = {
          user_id: user.id,
          symbol: pos.instrument,
          position_type: 'sell',
          volume: Math.abs(parseFloat(pos.short.units)),
          open_price: parseFloat(pos.short.averagePrice),
          current_price: parseFloat(pos.short.averagePrice), // Will be updated by real-time feeds
          unrealized_pnl: parseFloat(pos.short.unrealizedPL),
          opened_at: new Date().toISOString(),
          order_id: `oanda_${pos.instrument}_short`, // Consistent ID without timestamp
          ticket: parseInt(pos.short.tradeIDs[0] || '0'),
          commission: 0,
          swap: 0,
          status: 'open',
          strategy: 'OANDA_SYNC'
        };

        // Insert position directly since we cleared old ones
        const { error: insertError } = await supabase
          .from('wingzero_positions')
          .insert(wingZeroPosition);

        if (!insertError) {
          syncedPositions.push(wingZeroPosition);
          console.log(`✅ Synced short position: ${pos.instrument} ${wingZeroPosition.volume} units`);
        } else {
          console.error(`❌ Failed to sync short position ${pos.instrument}:`, insertError);
        }
      }
    }

    console.log(`🎯 Successfully synced ${syncedPositions.length} positions`);

    return new Response(JSON.stringify({
      success: true,
      synced: syncedPositions.length,
      positions: syncedPositions.map(p => ({
        symbol: p.symbol,
        type: p.position_type,
        volume: p.volume,
        unrealizedPnL: p.unrealized_pnl
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('🚨 Error in sync-oanda-positions:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      synced: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});