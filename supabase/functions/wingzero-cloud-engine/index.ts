import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cloud-based Wing Zero Trading Engine
class CloudTradingEngine {
  private supabase: any
  private isRunning = false
  private userId: string
  private tradingLoop: number | null = null

  constructor(supabase: any, userId: string) {
    this.supabase = supabase
    this.userId = userId
  }

  async start() {
    if (this.isRunning) return

    console.log('🚀 Starting Cloud Wing Zero Trading Engine for user:', this.userId)
    this.isRunning = true

    // Store engine status in database
    const { error: upsertError } = await this.supabase
      .from('wingzero_engine_status')
      .upsert({
        user_id: this.userId,
        is_running: true,
        last_heartbeat: new Date().toISOString(),
        engine_mode: 'cloud_active'
      })

    if (upsertError) {
      console.error('Failed to update engine status:', upsertError)
    }

    // Start persistent trading loop using background task
    this.runTradingLoop()
    
    return { success: true, message: 'Cloud engine started' }
  }

  async stop() {
    console.log('🛑 Stopping Cloud Wing Zero Trading Engine for user:', this.userId)
    this.isRunning = false
    
    if (this.tradingLoop) {
      clearInterval(this.tradingLoop)
      this.tradingLoop = null
    }

    // Update engine status in database
    const { error: upsertError } = await this.supabase
      .from('wingzero_engine_status')
      .upsert({
        user_id: this.userId,
        is_running: false,
        last_heartbeat: new Date().toISOString(),
        engine_mode: 'client'
      })

    if (upsertError) {
      console.error('Failed to update engine status:', upsertError)
    }

    return { success: true, message: 'Cloud engine stopped' }
  }

  private async runTradingLoop() {
    while (this.isRunning) {
      try {
        console.log('🤖 Cloud Engine executing trading cycle for user:', this.userId)
        
        // Get user's trading config from database
        const { data: config } = await this.supabase
          .from('wingzero_configs')
          .select('*')
          .eq('user_id', this.userId)
          .maybeSingle()

        if (!config) {
          console.log('No trading config found for user:', this.userId)
          await this.sleep(30000)
          continue
        }

        // Get user's broker credentials (encrypted)
        const { data: credentials } = await this.supabase
          .from('wingzero_credentials')
          .select('*')
          .eq('user_id', this.userId)
          .maybeSingle()

        if (!credentials) {
          console.log('No broker credentials found for user:', this.userId)
          await this.sleep(30000)
          continue
        }

        // Execute trading logic
        await this.executeTradingCycle(config, credentials)

        // Update heartbeat
        await this.supabase
          .from('wingzero_engine_status')
          .upsert({
            user_id: this.userId,
            is_running: true,
            last_heartbeat: new Date().toISOString(),
            last_cycle: new Date().toISOString(),
            engine_mode: 'cloud_active'
          })

        // Wait 30 seconds before next cycle
        await this.sleep(30000)

      } catch (error) {
        console.error('Error in cloud trading loop:', error)
        await this.sleep(30000)
      }
    }
  }

  private async executeTradingCycle(config: any, credentials: any) {
    try {
      console.log('📊 Analyzing markets for user:', this.userId)
      
      // 1. Market Analysis - Check if markets are open and get current data
      const marketOpen = this.isMarketOpen()
      if (!marketOpen) {
        console.log('Markets are closed, skipping cycle')
        return
      }

      // 2. Generate signals using AI brain (if enabled)
      if (config.brain_enabled) {
        console.log('🧠 AI Brain analysis enabled')
        
        // Call AI brain analysis function
        const { data: signalData, error: signalError } = await this.supabase.functions.invoke('ai-brain-analysis', {
          body: {
            action: 'generate_signal',
            user_id: this.userId,
            config: config.config_data
          }
        })
        
        if (signalError) {
          console.error('AI Brain analysis failed:', signalError)
        } else if (signalData?.signal) {
          console.log('📈 Signal generated:', signalData.signal)
          
          // 3. Execute trade based on signal (demo mode for now)
          await this.executeTradeSignal(signalData.signal, credentials)
        }
      }

      // 4. Update activity log
      const timestamp = new Date().toISOString()
      await this.supabase
        .from('wingzero_activity_log')
        .insert({
          user_id: this.userId,
          activity_type: 'trading_cycle',
          message: `Cloud engine executed ${config.brain_enabled ? 'AI-powered' : 'standard'} trading cycle`,
          timestamp: timestamp,
          data: { 
            config_id: config.id,
            market_open: marketOpen,
            brain_enabled: config.brain_enabled
          }
        })

    } catch (error) {
      console.error('Error in trading cycle:', error)
      
      // Log error
      await this.supabase
        .from('wingzero_activity_log')
        .insert({
          user_id: this.userId,
          activity_type: 'error',
          message: `Cloud engine error: ${error.message}`,
          timestamp: new Date().toISOString(),
          data: { error: error.message }
        })
    }
  }

  private isMarketOpen(): boolean {
    const now = new Date()
    const utcDay = now.getUTCDay()
    const utcHours = now.getUTCHours()
    
    // Forex markets are closed on weekends
    if (utcDay === 0 || utcDay === 6) {
      return false
    }
    
    // Markets are generally active 24/5, but let's be conservative
    // and only trade during major session hours
    return utcHours >= 1 && utcHours <= 22
  }

  private async executeTradeSignal(signal: any, credentials: any) {
    console.log('💰 Executing trade signal in demo mode:', signal)
    
    // For demo mode, just log the trade execution
    // In production, this would make actual API calls to OANDA
    await this.supabase
      .from('wingzero_positions')
      .insert({
        user_id: this.userId,
        symbol: signal.symbol || 'EUR_USD',
        type: signal.action || 'buy',
        volume: signal.volume || 1000,
        entry_price: signal.price || 1.0850,
        stop_loss: signal.stop_loss,
        take_profit: signal.take_profit,
        status: 'open',
        broker: 'oanda_demo',
        platform_order_id: `demo_${Date.now()}`,
        confidence: signal.confidence || 85,
        created_at: new Date().toISOString()
      })
    
    console.log('✅ Demo trade recorded successfully')
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()
    
    // Use service role for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const engine = new CloudTradingEngine(supabase, user.id)

    switch (action) {
      case 'start':
        const startResult = await engine.start()
        return new Response(
          JSON.stringify(startResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'stop':
        const stopResult = await engine.stop()
        return new Response(
          JSON.stringify(stopResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'status':
        const { data: status } = await supabase
          .from('wingzero_engine_status')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        return new Response(
          JSON.stringify({ status }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Error in wingzero-cloud-engine:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Handle function shutdown gracefully
addEventListener('beforeunload', (ev) => {
  console.log('Cloud Wing Zero function shutdown due to:', ev.detail?.reason)
})