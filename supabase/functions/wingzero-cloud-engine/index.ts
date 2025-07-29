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
    await this.supabase
      .from('wingzero_engine_status')
      .upsert({
        user_id: this.userId,
        is_running: true,
        last_heartbeat: new Date().toISOString(),
        engine_mode: 'cloud'
      })

    // Start persistent trading loop using background task
    EdgeRuntime.waitUntil(this.runTradingLoop())
    
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
    await this.supabase
      .from('wingzero_engine_status')
      .upsert({
        user_id: this.userId,
        is_running: false,
        last_heartbeat: new Date().toISOString(),
        engine_mode: 'stopped'
      })

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
          .single()

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
          .single()

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
    // 1. Fetch market data
    // 2. Generate signals using AI brain
    // 3. Execute trades via OANDA API
    // 4. Update positions in database
    // 5. Manage risk

    console.log('📊 Analyzing markets for user:', this.userId)
    
    // This would contain the actual trading logic
    // For now, just log the activity
    const timestamp = new Date().toISOString()
    
    await this.supabase
      .from('wingzero_activity_log')
      .insert({
        user_id: this.userId,
        activity_type: 'trading_cycle',
        message: 'Cloud engine executed trading cycle',
        timestamp: timestamp,
        data: { config_id: config.id }
      })
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
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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
          .single()

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