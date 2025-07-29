import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action, data } = await req.json();
    const openAIKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    switch (action) {
      case 'analyze_market_sentiment': {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an expert financial analyst. Analyze the provided market data and news to determine market sentiment. Return a JSON response with:
                {
                  "sentiment": "bullish|bearish|neutral",
                  "confidence": 0-100,
                  "key_factors": ["factor1", "factor2"],
                  "risk_level": "low|medium|high",
                  "recommended_action": "buy|sell|hold|wait"
                }`
              },
              {
                role: 'user',
                content: `Analyze this market data: ${JSON.stringify(data.marketData)}`
              }
            ],
            temperature: 0.3,
          }),
        });

        const aiResponse = await response.json();
        let content = aiResponse.choices[0].message.content;
        
        // Clean up markdown code blocks if present
        if (content.includes('```json')) {
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
        
        const analysis = JSON.parse(content);

        // Store analysis in database
        await supabaseClient.from('wingzero_market_intelligence').insert({
          user_id: user.id,
          intelligence_type: 'sentiment_analysis',
          analysis: analysis,
          content: JSON.stringify(data.marketData),
          sentiment: analysis.sentiment,
          impact_score: analysis.confidence / 100
        });

        return new Response(JSON.stringify(analysis), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate_trading_strategy': {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an expert quantitative trading strategist. Based on the provided market conditions and user preferences, generate a detailed trading strategy. Return JSON with:
                {
                  "strategy_name": "Strategy Name",
                  "entry_conditions": ["condition1", "condition2"],
                  "exit_conditions": ["condition1", "condition2"],
                  "risk_management": {
                    "stop_loss": 0.02,
                    "take_profit": 0.04,
                    "max_position_size": 0.05
                  },
                  "timeframe": "1h|4h|1d",
                  "symbols": ["EURUSD", "GBPUSD"],
                  "confidence": 0-100
                }`
              },
              {
                role: 'user',
                content: `Generate a strategy for these conditions: ${JSON.stringify(data)}`
              }
            ],
            temperature: 0.4,
          }),
        });

        const aiResponse = await response.json();
        let content = aiResponse.choices[0].message.content;
        
        // Clean up markdown code blocks if present
        if (content.includes('```json')) {
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
        
        const strategy = JSON.parse(content);

        // Store strategy in database
        await supabaseClient.from('wingzero_strategies').insert({
          user_id: user.id,
          strategy_name: strategy.strategy_name,
          strategy_type: 'ai_generated',
          parameters: strategy,
          status: 'testing',
          created_by: 'ai_brain'
        });

        return new Response(JSON.stringify(strategy), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'optimize_parameters': {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a trading optimization expert. Analyze the provided performance data and suggest parameter optimizations. Return JSON with:
                {
                  "optimizations": {
                    "stop_loss": 0.025,
                    "take_profit": 0.05,
                    "position_size": 0.03
                  },
                  "expected_improvement": 0.15,
                  "reasoning": "Explanation of changes",
                  "confidence": 0-100
                }`
              },
              {
                role: 'user',
                content: `Optimize based on this performance: ${JSON.stringify(data.performance)}`
              }
            ],
            temperature: 0.2,
          }),
        });

        const aiResponse = await response.json();
        let content = aiResponse.choices[0].message.content;
        
        // Clean up markdown code blocks if present
        if (content.includes('```json')) {
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
        
        const optimization = JSON.parse(content);

        // Store optimization in database
        await supabaseClient.from('wingzero_optimizations').insert({
          user_id: user.id,
          optimization_type: 'ai_parameter_optimization',
          old_config: data.currentConfig,
          new_config: optimization.optimizations,
          expected_improvement: optimization.expected_improvement,
          trigger_reason: optimization.reasoning,
          status: 'pending'
        });

        return new Response(JSON.stringify(optimization), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Unknown action');
    }

  } catch (error) {
    console.error('Error in ai-brain-analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});