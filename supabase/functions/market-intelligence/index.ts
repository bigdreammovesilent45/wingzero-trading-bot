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

    const { action, params } = await req.json();
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const openAIKey = Deno.env.get('OPENAI_API_KEY');

    if (!firecrawlKey || !openAIKey) {
      throw new Error('API keys not configured');
    }

    switch (action) {
      case 'scrape_financial_news': {
        const financialSources = [
          'https://www.reuters.com/business/finance/',
          'https://www.bloomberg.com/markets',
          'https://finance.yahoo.com/news/',
          'https://www.marketwatch.com/latest-news'
        ];

        const newsData = [];
        
        for (const url of financialSources.slice(0, 2)) { // Limit to 2 sources for demo
          try {
            const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: url,
                formats: ['markdown'],
                actions: [{
                  type: 'wait',
                  milliseconds: 2000
                }]
              }),
            });

            const data = await response.json();
            if (data.success && data.data?.markdown) {
              newsData.push({
                source: url,
                content: data.data.markdown.slice(0, 5000), // Limit content length
                timestamp: new Date().toISOString()
              });
            }
          } catch (error) {
            console.warn(`Failed to scrape ${url}:`, error);
          }
        }

        // Analyze news with OpenAI
        const analysisPromises = newsData.map(async (news) => {
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
                  content: `Extract key financial insights from this news content. Return JSON with:
                  {
                    "headlines": ["headline1", "headline2"],
                    "sentiment": "positive|negative|neutral",
                    "impact": 0-100,
                    "affected_currencies": ["EUR", "USD", "GBP"],
                    "key_events": ["event1", "event2"],
                    "market_implications": "Brief analysis"
                  }`
                },
                {
                  role: 'user',
                  content: news.content
                }
              ],
              temperature: 0.3,
            }),
          });

          const aiResponse = await response.json();
          return {
            ...news,
            analysis: JSON.parse(aiResponse.choices[0].message.content)
          };
        });

        const analyzedNews = await Promise.all(analysisPromises);

        // Store in database
        for (const news of analyzedNews) {
          await supabaseClient.from('wingzero_market_intelligence').insert({
            user_id: user.id,
            intelligence_type: 'financial_news',
            content: news.content,
            analysis: news.analysis,
            source_url: news.source,
            sentiment: news.analysis.sentiment,
            impact_score: news.analysis.impact / 100
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          newsCount: analyzedNews.length,
          intelligence: analyzedNews 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'analyze_symbol_sentiment': {
        const { symbol } = params;
        
        // Scrape symbol-specific news
        const searchQuery = `${symbol} forex trading news analysis`;
        const response = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 5
          }),
        });

        const searchData = await response.json();
        let symbolNews = '';
        
        if (searchData.success && searchData.data) {
          symbolNews = searchData.data.map((item: any) => item.markdown || item.content).join('\n').slice(0, 8000);
        }

        // Analyze with OpenAI
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: `Analyze sentiment for ${symbol} based on the news. Return JSON with:
                {
                  "sentiment": "bullish|bearish|neutral",
                  "confidence": 0-100,
                  "price_prediction": "up|down|sideways",
                  "key_factors": ["factor1", "factor2"],
                  "timeframe": "short|medium|long",
                  "recommendation": "Strong recommendation based on analysis"
                }`
              },
              {
                role: 'user',
                content: `Analyze ${symbol} sentiment from this news: ${symbolNews}`
              }
            ],
            temperature: 0.3,
          }),
        });

        const analysis = JSON.parse((await aiResponse.json()).choices[0].message.content);

        // Store analysis
        await supabaseClient.from('wingzero_market_intelligence').insert({
          user_id: user.id,
          intelligence_type: 'symbol_sentiment',
          content: symbolNews,
          analysis: { symbol, ...analysis },
          sentiment: analysis.sentiment,
          impact_score: analysis.confidence / 100
        });

        return new Response(JSON.stringify(analysis), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_market_overview': {
        // Get recent intelligence from database
        const { data: intelligence } = await supabaseClient
          .from('wingzero_market_intelligence')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false });

        // Create market overview with OpenAI
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: `Create a comprehensive market overview based on recent intelligence. Return JSON with:
                {
                  "overall_sentiment": "bullish|bearish|neutral",
                  "market_volatility": "low|medium|high",
                  "top_opportunities": ["opportunity1", "opportunity2"],
                  "risk_factors": ["risk1", "risk2"],
                  "recommended_pairs": ["EURUSD", "GBPUSD"],
                  "market_summary": "Brief overview of current conditions"
                }`
              },
              {
                role: 'user',
                content: `Create market overview from: ${JSON.stringify(intelligence?.slice(0, 10))}`
              }
            ],
            temperature: 0.4,
          }),
        });

        const overview = JSON.parse((await aiResponse.json()).choices[0].message.content);

        return new Response(JSON.stringify(overview), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Unknown action');
    }

  } catch (error) {
    console.error('Error in market-intelligence:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});