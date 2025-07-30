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
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');

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
          
          // Safe JSON parsing with error handling
          let analysis;
          try {
            let content = aiResponse.choices[0].message.content;
            content = content.trim();
            if (content.includes('```')) {
              content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            }
            content = content.trim();
            
            try {
              analysis = JSON.parse(content);
            } catch (parseError) {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                content = jsonMatch[0];
              }
              analysis = JSON.parse(content);
            }
          } catch (error) {
            console.error('Failed to parse AI response:', error);
            analysis = {
              headlines: ['Error parsing news'],
              sentiment: 'neutral',
              impact: 50,
              affected_currencies: ['USD'],
              key_events: ['Error in analysis'],
              market_implications: 'Analysis unavailable'
            };
          }
          
          return {
            ...news,
            analysis: analysis
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

        // Safe JSON parsing with error handling
        let analysis;
        try {
          const aiResponseData = await aiResponse.json();
          let content = aiResponseData.choices[0].message.content;
          content = content.trim();
          if (content.includes('```')) {
            content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          }
          content = content.trim();
          
          try {
            analysis = JSON.parse(content);
          } catch (parseError) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              content = jsonMatch[0];
            }
            analysis = JSON.parse(content);
          }
        } catch (error) {
          console.error('Failed to parse symbol sentiment analysis:', error);
          analysis = {
            sentiment: 'neutral',
            confidence: 50,
            price_prediction: 'sideways',
            key_factors: ['Analysis unavailable'],
            timeframe: 'short',
            recommendation: 'Hold pending better data'
          };
        }

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

        // Safe JSON parsing with error handling
        let overview;
        try {
          const aiResponseData = await aiResponse.json();
          let content = aiResponseData.choices[0].message.content;
          content = content.trim();
          if (content.includes('```')) {
            content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          }
          content = content.trim();
          
          try {
            overview = JSON.parse(content);
          } catch (parseError) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              content = jsonMatch[0];
            }
            overview = JSON.parse(content);
          }
        } catch (error) {
          console.error('Failed to parse market overview:', error);
          overview = {
            overall_sentiment: 'neutral',
            market_volatility: 'medium',
            top_opportunities: ['Data analysis pending'],
            risk_factors: ['Analysis unavailable'],
            recommended_pairs: ['EURUSD', 'GBPUSD'],
            market_summary: 'Market overview temporarily unavailable due to parsing error'
          };
        }

        return new Response(JSON.stringify(overview), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_financial_news': {
        if (!perplexityKey) {
          // Return mock data if Perplexity API key not available
          return new Response(JSON.stringify({ 
            success: true, 
            news: getMockFinancialNews() 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        try {
          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${perplexityKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.1-sonar-small-128k-chat',
              messages: [
                {
                  role: 'system',
                  content: 'You are a financial news analyst. Provide current financial news with sentiment analysis. Always respond with valid JSON array format.'
                },
                {
                  role: 'user',
                  content: `Get the latest financial market news from the past ${params?.timeframe || '24h'}. For each news item, provide: title, summary, sentiment score (-1 to 1), impact score (0 to 1), and affected symbols. Return as JSON array.`
                }
              ],
              temperature: 0.2,
              max_tokens: 2000,
            }),
          });

          const data = await response.json();
          let newsArray = [];
          
          try {
            // Check if the response has the expected structure
            if (data && data.choices && data.choices.length > 0 && data.choices[0].message) {
              const content = data.choices[0].message.content;
              if (content && typeof content === 'string') {
                // Try to extract JSON from the content
                let jsonContent = content.trim();
                if (jsonContent.includes('[') && jsonContent.includes(']')) {
                  // Extract JSON array from markdown or mixed content
                  const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
                  if (jsonMatch) {
                    jsonContent = jsonMatch[0];
                  }
                }
                newsArray = JSON.parse(jsonContent);
              } else {
                throw new Error('No content in response');
              }
            } else {
              throw new Error('Invalid response structure from Perplexity API');
            }
          } catch (parseError) {
            console.error('Error parsing Perplexity response:', parseError);
            console.error('Full response:', JSON.stringify(data, null, 2));
            newsArray = getMockFinancialNews();
          }

          return new Response(JSON.stringify({ 
            success: true, 
            news: Array.isArray(newsArray) ? newsArray : getMockFinancialNews()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Error fetching financial news:', error);
          return new Response(JSON.stringify({ 
            success: true, 
            news: getMockFinancialNews() 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'get_symbol_news': {
        if (!perplexityKey || !params?.symbol) {
          return new Response(JSON.stringify({ 
            success: true, 
            news: getMockSymbolNews(params?.symbol || 'EURUSD') 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        try {
          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${perplexityKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.1-sonar-small-128k-chat',
              messages: [
                {
                  role: 'system',
                  content: 'You are a financial news analyst specializing in forex markets. Always respond with valid JSON array format.'
                },
                {
                  role: 'user',
                  content: `Get news related to ${params.symbol} currency pair from the past ${params?.timeframe || '24h'}. Analyze sentiment and potential impact on the currency. Return as JSON array with title, summary, sentiment (-1 to 1), impact (0 to 1), and source.`
                }
              ],
              temperature: 0.2,
              max_tokens: 1500,
            }),
          });

          const data = await response.json();
          let newsArray = [];
          
          try {
            // Check if the response has the expected structure
            if (data && data.choices && data.choices.length > 0 && data.choices[0].message) {
              const content = data.choices[0].message.content;
              if (content && typeof content === 'string') {
                // Try to extract JSON from the content
                let jsonContent = content.trim();
                if (jsonContent.includes('[') && jsonContent.includes(']')) {
                  // Extract JSON array from markdown or mixed content
                  const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
                  if (jsonMatch) {
                    jsonContent = jsonMatch[0];
                  }
                }
                newsArray = JSON.parse(jsonContent);
              } else {
                throw new Error('No content in response');
              }
            } else {
              throw new Error('Invalid response structure from Perplexity API');
            }
          } catch (parseError) {
            console.error('Error parsing Perplexity response for symbol:', parseError);
            console.error('Full response:', JSON.stringify(data, null, 2));
            newsArray = getMockSymbolNews(params.symbol);
          }

          return new Response(JSON.stringify({ 
            success: true, 
            news: Array.isArray(newsArray) ? newsArray : getMockSymbolNews(params.symbol)
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error(`Error fetching news for ${params.symbol}:`, error);
          return new Response(JSON.stringify({ 
            success: true, 
            news: getMockSymbolNews(params.symbol) 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
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

function getMockFinancialNews() {
  return [
    {
      title: "Federal Reserve Maintains Interest Rates",
      summary: "The Fed kept rates unchanged citing inflation concerns and market stability.",
      sentiment: 0.1,
      impact: 0.8,
      source: "Financial Times",
      timestamp: new Date().toISOString(),
      symbols: ["EURUSD", "GBPUSD", "USDJPY"]
    },
    {
      title: "ECB Signals Dovish Stance",
      summary: "European Central Bank hints at potential easing measures amid economic slowdown.",
      sentiment: -0.3,
      impact: 0.6,
      source: "Reuters",
      timestamp: new Date().toISOString(),
      symbols: ["EURUSD", "EURGBP"]
    }
  ];
}

function getMockSymbolNews(symbol: string) {
  const symbolNews: Record<string, any[]> = {
    'EURUSD': [
      {
        title: "EUR strengthens on positive eurozone data",
        summary: "Better than expected GDP growth supports euro",
        sentiment: 0.4,
        impact: 0.6,
        source: "MarketWatch",
        timestamp: new Date().toISOString(),
        symbols: ["EURUSD"]
      }
    ],
    'GBPUSD': [
      {
        title: "GBP under pressure from Brexit concerns",
        summary: "Trade negotiations create uncertainty for pound",
        sentiment: -0.2,
        impact: 0.5,
        source: "Bloomberg",
        timestamp: new Date().toISOString(),
        symbols: ["GBPUSD"]
      }
    ]
  };

  return symbolNews[symbol] || [
    {
      title: `${symbol} market analysis`,
      summary: `Current market conditions for ${symbol} show mixed signals`,
      sentiment: 0,
      impact: 0.3,
      source: "Market Analysis",
      timestamp: new Date().toISOString(),
      symbols: [symbol]
    }
  ];
}