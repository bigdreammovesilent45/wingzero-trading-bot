import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const ManualTradeTest = () => {
  const { toast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastTrade, setLastTrade] = useState<any>(null);

  const executeTestTrade = async () => {
    setIsExecuting(true);
    
    try {
      console.log('🎯 Initiating manual trade test...');
      
      const { data, error } = await supabase.functions.invoke('manual-trade-test', {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Trade test response:', data);
      setLastTrade(data.trade);

      toast({
        title: "🎯 Test Trade Executed!",
        description: `${data.trade.direction} ${data.trade.instrument} @ ${data.trade.fillPrice}`,
        duration: 8000
      });

    } catch (error: any) {
      console.error('❌ Trade test failed:', error);
      toast({
        title: "Trade Test Failed",
        description: error.message || "Failed to execute test trade",
        variant: "destructive",
        duration: 10000
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-600" />
          Manual Trade Test
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            OANDA Demo
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Testing Mode
            </span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            This will execute a random trade on your OANDA demo account to test Wing Zero's trading functionality.
            It will randomly select a currency pair and direction (buy/sell) with 1000 units.
          </p>
        </div>

        {lastTrade && (
          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Last Test Trade
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-green-700 dark:text-green-300">Pair:</span> {lastTrade.instrument}
              </div>
              <div>
                <span className="text-green-700 dark:text-green-300">Direction:</span> 
                <Badge 
                  variant={lastTrade.direction === 'BUY' ? 'default' : 'destructive'} 
                  className="ml-1 text-xs"
                >
                  {lastTrade.direction}
                </Badge>
              </div>
              <div>
                <span className="text-green-700 dark:text-green-300">Price:</span> {lastTrade.fillPrice}
              </div>
              <div>
                <span className="text-green-700 dark:text-green-300">Units:</span> {lastTrade.units}
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={executeTestTrade}
          disabled={isExecuting}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          {isExecuting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Executing Test Trade...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Execute Random Test Trade
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          This will test the complete trading pipeline including OANDA connection, 
          order execution, and database recording.
        </p>
      </CardContent>
    </Card>
  );
};