import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Target, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const FixLivePositions = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [lastFixResult, setLastFixResult] = useState<any>(null);
  const { toast } = useToast();

  const fixLivePositions = async () => {
    setIsFixing(true);
    try {
      console.log('🛡️ Initiating live position fix...');
      
      const { data, error } = await supabase.functions.invoke('fix-live-positions', {
        body: {}
      });

      if (error) throw error;

      setLastFixResult(data);
      
      if (data.success) {
        toast({
          title: "🛡️ Wing Zero Risk Management Applied!",
          description: `Fixed ${data.fixedTrades} trades with proper TP/SL/TS`,
          variant: "default",
        });
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('Error fixing live positions:', error);
      toast({
        title: "❌ Failed to Fix Positions",
        description: error.message || 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-600" />
          <CardTitle className="text-red-800">Fix Live Positions</CardTitle>
          <Badge variant="destructive" className="ml-auto">
            <AlertTriangle className="h-3 w-3 mr-1" />
            URGENT
          </Badge>
        </div>
        <CardDescription className="text-red-700">
          Apply Wing Zero mandatory TP/SL/TS to existing live trades for proper risk management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-100 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
            <Target className="h-4 w-4" />
            Wing Zero Risk Management Standards
          </h4>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• <strong>Stop Loss:</strong> 25 pips minimum protection</li>
            <li>• <strong>Take Profit:</strong> 50 pips (2:1 risk-reward ratio)</li>
            <li>• <strong>Trailing Stop:</strong> 15 pips to lock in profits</li>
            <li>• <strong>Risk Validation:</strong> Ensures minimum 1.5:1 R:R ratio</li>
          </ul>
        </div>

        {lastFixResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4" />
              Last Fix Results
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700 font-medium">Fixed Trades:</span>
                <span className="ml-2 text-green-800">{lastFixResult.fixedTrades}</span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Failed:</span>
                <span className="ml-2 text-green-800">{lastFixResult.failedTrades || 0}</span>
              </div>
            </div>
            
            {lastFixResult.trades && lastFixResult.trades.length > 0 && (
              <div className="mt-3">
                <h5 className="text-green-800 font-medium mb-2">Fixed Trades:</h5>
                <div className="space-y-2">
                  {lastFixResult.trades.map((trade: any, index: number) => (
                    <div key={index} className="bg-white rounded p-3 border border-green-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-green-800">{trade.instrument}</span>
                        <Badge variant="outline" className="text-green-700">
                          {trade.units > 0 ? 'LONG' : 'SHORT'} {Math.abs(trade.units)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-green-700">
                        <div>TP: {trade.takeProfit}</div>
                        <div>SL: {trade.stopLoss}</div>
                        <div>TS: {trade.trailingStop}</div>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        R:R Ratio: {trade.riskRewardRatio}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            <strong>⚠️ Important:</strong> This will add proper risk management to your current live trades. 
            Existing orders without TP/SL/TS will be protected according to Wing Zero standards.
          </p>
        </div>

        <Button 
          onClick={fixLivePositions}
          disabled={isFixing}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          size="lg"
        >
          {isFixing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Applying Risk Management...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              🛡️ Fix Live Positions Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FixLivePositions;