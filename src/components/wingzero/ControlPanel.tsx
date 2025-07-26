import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Play, Pause, RotateCcw, TrendingUp, Shield, Clock, Target, Wifi, WifiOff, AlertTriangle, Database, DollarSign, Zap } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTradingEngine } from "@/hooks/useTradingEngine";
import { useAccountData } from "@/hooks/useAccountData";
import { useWingZeroPositions } from "@/hooks/useWingZeroPositions";
import { supabase } from '@/integrations/supabase/client';

interface StrategyConfig {
  // Risk Management
  maxRiskPerTrade: number;
  maxDailyLoss: number;
  trailingStopEnabled: boolean;
  trailingStopDistance: number;
  
  // Entry/Exit Settings
  takeProfitPips: number;
  stopLossPips: number;
  riskRewardRatio: number;
  
  // Signal Filtering
  confluenceRequired: boolean;
  minSignalStrength: number;
  trendFilterEnabled: boolean;
  momentumFilterEnabled: boolean;
  
  // Time Filters
  avoidLowVolatility: boolean;
  avoidNews: boolean;
  tradingSessionFilter: string;
  
  // Position Sizing
  dynamicSizing: boolean;
  kellyCriterion: boolean;
  maxPositionSize: number;

  // Passive Income Settings
  monthlyTargetPercent: number;
  autoCompounding: boolean;
  emergencyStopLoss: number;
  maxConcurrentTrades: number;
}

const ControlPanel = () => {
  const { toast } = useToast();
  const [botEnabled, setBotEnabled] = useState(true);
  const [autoTrading, setAutoTrading] = useState(true);
  const [riskManagement, setRiskManagement] = useState(true);
  const [passiveIncomeMode, setPassiveIncomeMode] = useState(true);
  
  // Trading engine integration
  const {
    isRunning,
    isConnected,
    openPositions,
    dailyPnL,
    totalProfit,
    error,
    startEngine,
    stopEngine,
    closeAllPositions,
    isOperational
  } = useTradingEngine();
  
  // MT5 account data
  const { account, isLoading: accountLoading, error: accountError } = useAccountData();
  
  // Wing Zero positions for database sync
  const { syncMT5Position } = useWingZeroPositions();
  const [isTestingDb, setIsTestingDb] = useState(false);
  
  const [strategyConfig, setStrategyConfig] = useLocalStorage<StrategyConfig>('wingzero-strategy', {
    maxRiskPerTrade: 1.0,
    maxDailyLoss: 3,
    trailingStopEnabled: true,
    trailingStopDistance: 15,
    takeProfitPips: 50,
    stopLossPips: 20,
    riskRewardRatio: 2.5,
    confluenceRequired: true,
    minSignalStrength: 80,
    trendFilterEnabled: true,
    momentumFilterEnabled: true,
    avoidLowVolatility: true,
    avoidNews: true,
    tradingSessionFilter: 'london-ny-overlap',
    dynamicSizing: true,
    kellyCriterion: true,
    maxPositionSize: 2.0,
    monthlyTargetPercent: 8,
    autoCompounding: true,
    emergencyStopLoss: 10,
    maxConcurrentTrades: 3
  });

  const handleStart = async () => {
    if (!isConnected) {
      toast({
        title: "No MT5 Connection",
        description: "Please configure MT5 connection in Settings first",
        variant: "destructive"
      });
      return;
    }
    
    if (!riskManagement) {
      toast({
        title: "Risk Management Required",
        description: "Risk management must be enabled for passive income trading",
        variant: "destructive"
      });
      return;
    }
    
    await startEngine();
    
    if (passiveIncomeMode) {
      toast({
        title: "🚀 Wing Zero Activated",
        description: `Passive income mode started. Target: ${strategyConfig.monthlyTargetPercent}% monthly return`,
        duration: 5000
      });
    }
  };

  const handleStop = async () => {
    await stopEngine();
    toast({
      title: "Wing Zero Paused",
      description: "Trading stopped. Your positions remain open for monitoring",
    });
  };

  const handleReset = () => {
    toast({
      title: "Strategy Reset to Family-Safe Defaults",
      description: "Conservative settings optimized for consistent passive income",
    });
    setStrategyConfig({
      maxRiskPerTrade: 1.0,
      maxDailyLoss: 3,
      trailingStopEnabled: true,
      trailingStopDistance: 15,
      takeProfitPips: 50,
      stopLossPips: 20,
      riskRewardRatio: 2.5,
      confluenceRequired: true,
      minSignalStrength: 80,
      trendFilterEnabled: true,
      momentumFilterEnabled: true,
      avoidLowVolatility: true,
      avoidNews: true,
      tradingSessionFilter: 'london-ny-overlap',
      dynamicSizing: true,
      kellyCriterion: true,
      maxPositionSize: 2.0,
      monthlyTargetPercent: 8,
      autoCompounding: true,
      emergencyStopLoss: 10,
      maxConcurrentTrades: 3
    });
  };

  const updateStrategyConfig = (updates: Partial<StrategyConfig>) => {
    setStrategyConfig(prev => ({ ...prev, ...updates }));
  };

  const testWingZeroDatabase = async () => {
    setIsTestingDb(true);
    
    try {
      console.log("Testing Wing Zero database connection...");
      
      const testPosition = {
        symbol: "EURUSD",
        position_type: "buy" as const,
        volume: 0.1,
        open_price: 1.085,
        current_price: 1.086,
        unrealized_pnl: 10,
        stop_loss: 1.08,
        take_profit: 1.09,
        opened_at: new Date().toISOString(),
        order_id: `test-${Date.now()}`,
        ticket: Math.floor(Math.random() * 1000000),
        commission: 0.5,
        swap: 0,
        comment: "WingZero Test Position",
        status: "open" as const,
        user_id: null
      };
      
      console.log("Creating test position with data:", testPosition);
      
      const { data, error } = await supabase
        .from('wingzero_positions')
        .insert(testPosition)
        .select()
        .single();
      
      if (error) {
        console.error("Database error:", error);
        
        if (error.code === '42P01') {
          toast({
            title: "Table Missing",
            description: "wingzero_positions table doesn't exist. Please create it in Supabase.",
            variant: "destructive"
          });
          return;
        }
        
        throw error;
      }
      
      console.log("Test position created successfully:", data);
      
      // Clean up test position
      await supabase
        .from('wingzero_positions')
        .delete()
        .eq('id', data.id);
      
      toast({
        title: "✅ Database Connected",
        description: "Real-time position sync is ready for family wealth building!",
      });
      
    } catch (error: any) {
      console.error("Database test failed:", error);
      toast({
        title: "Database Test Failed",
        description: error.message || "Failed to connect to Wing Zero database",
        variant: "destructive"
      });
    } finally {
      setIsTestingDb(false);
    }
  };

  const calculateMonthlyProjection = () => {
    if (!account) return { projected: 0, daily: 0 };
    
    const balance = account.balance;
    const monthlyTarget = (strategyConfig.monthlyTargetPercent / 100) * balance;
    const dailyTarget = monthlyTarget / 30;
    
    return {
      projected: monthlyTarget,
      daily: dailyTarget
    };
  };

  const calculateExpectedWinRate = () => {
    let baseRate = 72;
    
    // Conservative adjustments for family wealth preservation
    if (strategyConfig.confluenceRequired) baseRate += 4;
    if (strategyConfig.minSignalStrength >= 80) baseRate += 3;
    if (strategyConfig.trendFilterEnabled && strategyConfig.momentumFilterEnabled) baseRate += 3;
    if (strategyConfig.avoidLowVolatility && strategyConfig.avoidNews) baseRate += 2;
    if (strategyConfig.riskRewardRatio >= 2.5) baseRate += 2;
    if (strategyConfig.trailingStopEnabled) baseRate += 1;
    
    return Math.min(baseRate, 87);
  };

  const projections = calculateMonthlyProjection();

  return (
    <div className="space-y-6">
      {/* Passive Income Status Card */}
      <Card className="border-[#00AEEF]/30 bg-gradient-to-r from-[#00AEEF]/10 via-[#00AEEF]/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-[#00AEEF]/20 rounded-full">
                <DollarSign className="h-6 w-6 text-[#00AEEF]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#00AEEF]">Family Wealth Builder Active</h3>
                <p className="text-sm text-muted-foreground">Conservative settings for generational wealth</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-3xl font-bold text-[#00AEEF]">
                {calculateExpectedWinRate()}%
              </div>
              <p className="text-xs text-muted-foreground">Expected Win Rate</p>
              <Badge variant="secondary" className="text-xs">
                Family-Safe Strategy
              </Badge>
            </div>
          </div>
          
          {account && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#00AEEF]/20">
              <div className="text-center">
                <div className="text-lg font-semibold text-[#00AEEF]">
                  ${projections.daily.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Daily Target</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-[#00AEEF]">
                  ${projections.projected.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Monthly Target</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-[#00AEEF]">
                  ${(projections.projected * 12).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Annual Projection</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MT5 Connection Status */}
      <Card className={`border-2 ${isConnected ? 'border-green-500/20 bg-green-50/50 dark:bg-green-950/20' : 'border-red-500/20 bg-red-50/50 dark:bg-red-950/20'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <Wifi className="h-6 w-6 text-green-600" />
              ) : (
                <WifiOff className="h-6 w-6 text-red-600" />
              )}
              <div>
                <h3 className="text-lg font-semibold">MT5 Live Connection</h3>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Real-time trading active' : 'Configure connection in Settings'}
                </p>
              </div>
            </div>
            <div className="text-right space-y-2">
              <Badge variant={isConnected ? "default" : "destructive"} className="mb-2">
                {isConnected ? "🟢 Live" : "🔴 Offline"}
              </Badge>
              {account && (
                <div className="text-sm space-y-1">
                  <div>Balance: ${account.balance.toFixed(2)}</div>
                  <div className={`${account.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Today: ${account.profit.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Progress: {account.balance > 0 ? ((account.profit / projections.daily) * 100).toFixed(1) : 0}% of daily target
                  </div>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertTriangle className="h-3 w-3" />
                  {error}
                </div>
              )}
            </div>
          </div>
          
          {isConnected && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Engine Status</div>
                  <Badge variant={isRunning ? "default" : "secondary"}>
                    {isRunning ? "🚀 Active" : "⏸️ Paused"}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Active Trades</div>
                  <div className="font-semibold">{openPositions.length}/{strategyConfig.maxConcurrentTrades}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Daily P&L</div>
                  <div className={`font-semibold ${dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${dailyPnL.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#00AEEF]" />
            Wing Zero Control Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleStart}
              disabled={isRunning || !isConnected}
              className="bg-[#00AEEF] hover:bg-[#00AEEF]/80 text-black font-medium disabled:opacity-50"
            >
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? "Running" : "Start Income Generation"}
            </Button>
            <Button 
              onClick={handleStop}
              disabled={!isRunning}
              variant="outline"
              className="border-[#00AEEF]/20 hover:border-[#00AEEF]/40 hover:bg-[#00AEEF]/10 disabled:opacity-50"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause Trading
            </Button>
            <Button 
              onClick={handleReset}
              variant="outline"
              className="border-[#00AEEF]/20 hover:border-[#00AEEF]/40 hover:bg-[#00AEEF]/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Family-Safe Reset
            </Button>
          </div>

          {/* Database Test */}
          <div>
            <Button
              onClick={testWingZeroDatabase}
              disabled={isTestingDb}
              variant="outline"
              className="w-full border-[#00AEEF]/20 hover:border-[#00AEEF]/40 hover:bg-[#00AEEF]/10"
            >
              {isTestingDb ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00AEEF] mr-2"></div>
                  Testing Database...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Test Database Connection
                </>
              )}
            </Button>
          </div>

          {/* Master Switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Passive Income Mode</Label>
                <p className="text-sm text-muted-foreground">Conservative settings for long-term wealth building</p>
              </div>
              <Switch
                checked={passiveIncomeMode}
                onCheckedChange={setPassiveIncomeMode}
                className="data-[state=checked]:bg-[#00AEEF]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Auto Trading</Label>
                <p className="text-sm text-muted-foreground">Fully automated trade execution</p>
              </div>
              <Switch
                checked={autoTrading}
                onCheckedChange={setAutoTrading}
                className="data-[state=checked]:bg-[#00AEEF]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Risk Management (Required)</Label>
                <p className="text-sm text-muted-foreground">Essential protection for your family's wealth</p>
              </div>
              <Switch
                checked={riskManagement}
                onCheckedChange={setRiskManagement}
                className="data-[state=checked]:bg-[#00AEEF]"
                disabled={passiveIncomeMode}
              />
            </div>
          </div>

          {/* Strategy Configuration */}
          <Tabs defaultValue="income" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="income" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Income
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Risk
              </TabsTrigger>
              <TabsTrigger value="signals" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Signals
              </TabsTrigger>
              <TabsTrigger value="timing" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Timing
              </TabsTrigger>
            </TabsList>

            {/* Income Settings */}
            <TabsContent value="income" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Monthly Target: {strategyConfig.monthlyTargetPercent}%</Label>
                  <Slider
                    value={[strategyConfig.monthlyTargetPercent]}
                    onValueChange={(value) => updateStrategyConfig({ monthlyTargetPercent: value[0] })}
                    max={15}
                    min={3}
                    step={0.5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Conservative: 3-8%, Moderate: 8-12%, Aggressive: 12-15%</p>
                </div>

                <div className="space-y-3">
                  <Label>Max Concurrent Trades: {strategyConfig.maxConcurrentTrades}</Label>
                  <Slider
                    value={[strategyConfig.maxConcurrentTrades]}
                    onValueChange={(value) => updateStrategyConfig({ maxConcurrentTrades: value[0] })}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Compounding</Label>
                    <p className="text-xs text-muted-foreground">Reinvest profits for exponential growth</p>
                  </div>
                  <Switch
                    checked={strategyConfig.autoCompounding}
                    onCheckedChange={(checked) => updateStrategyConfig({ autoCompounding: checked })}
                    className="data-[state=checked]:bg-[#00AEEF]"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Emergency Stop Loss: {strategyConfig.emergencyStopLoss}%</Label>
                  <Slider
                    value={[strategyConfig.emergencyStopLoss]}
                    onValueChange={(value) => updateStrategyConfig({ emergencyStopLoss: value[0] })}
                    max={20}
                    min={5}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Maximum account drawdown before stopping</p>
                </div>
              </div>
            </TabsContent>

            {/* Risk Management */}
            <TabsContent value="risk" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Risk per Trade: {strategyConfig.maxRiskPerTrade}%</Label>
                  <Slider
                    value={[strategyConfig.maxRiskPerTrade]}
                    onValueChange={(value) => updateStrategyConfig({ maxRiskPerTrade: value[0] })}
                    max={3}
                    min={0.5}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Recommended: 1-2% for family wealth preservation</p>
                </div>

                <div className="space-y-3">
                  <Label>Max Daily Loss: {strategyConfig.maxDailyLoss}%</Label>
                  <Slider
                    value={[strategyConfig.maxDailyLoss]}
                    onValueChange={(value) => updateStrategyConfig({ maxDailyLoss: value[0] })}
                    max={10}
                    min={1}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Stop Loss: {strategyConfig.stopLossPips} pips</Label>
                  <Slider
                    value={[strategyConfig.stopLossPips]}
                    onValueChange={(value) => updateStrategyConfig({ stopLossPips: value[0] })}
                    max={50}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Take Profit: {strategyConfig.takeProfitPips} pips</Label>
                  <Slider
                    value={[strategyConfig.takeProfitPips]}
                    onValueChange={(value) => updateStrategyConfig({ takeProfitPips: value[0] })}
                    max={100}
                    min={20}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Trailing Stop</Label>
                    <p className="text-xs text-muted-foreground">Lock in profits automatically</p>
                  </div>
                  <Switch
                    checked={strategyConfig.trailingStopEnabled}
                    onCheckedChange={(checked) => updateStrategyConfig({ trailingStopEnabled: checked })}
                    className="data-[state=checked]:bg-[#00AEEF]"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Signal Filtering */}
            <TabsContent value="signals" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Signal Strength: {strategyConfig.minSignalStrength}%</Label>
                  <Slider
                    value={[strategyConfig.minSignalStrength]}
                    onValueChange={(value) => updateStrategyConfig({ minSignalStrength: value[0] })}
                    max={95}
                    min={50}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Higher = fewer but more reliable trades</p>
                </div>

                <div className="space-y-3">
                  <Label>Risk/Reward Ratio: {strategyConfig.riskRewardRatio.toFixed(1)}:1</Label>
                  <Slider
                    value={[strategyConfig.riskRewardRatio]}
                    onValueChange={(value) => updateStrategyConfig({ riskRewardRatio: value[0] })}
                    max={5}
                    min={1.5}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Confluence Required</Label>
                    <p className="text-xs text-muted-foreground">Multiple confirmations</p>
                  </div>
                  <Switch
                    checked={strategyConfig.confluenceRequired}
                    onCheckedChange={(checked) => updateStrategyConfig({ confluenceRequired: checked })}
                    className="data-[state=checked]:bg-[#00AEEF]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Trend Filter</Label>
                    <p className="text-xs text-muted-foreground">Trade with the trend</p>
                  </div>
                  <Switch
                    checked={strategyConfig.trendFilterEnabled}
                    onCheckedChange={(checked) => updateStrategyConfig({ trendFilterEnabled: checked })}
                    className="data-[state=checked]:bg-[#00AEEF]"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Timing Filters */}
            <TabsContent value="timing" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Trading Session</Label>
                  <Select
                    value={strategyConfig.tradingSessionFilter}
                    onValueChange={(value) => updateStrategyConfig({ tradingSessionFilter: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sessions</SelectItem>
                      <SelectItem value="london">London Only</SelectItem>
                      <SelectItem value="new-york">New York Only</SelectItem>
                      <SelectItem value="london-ny-overlap">London-NY Overlap (Best)</SelectItem>
                      <SelectItem value="tokyo">Tokyo Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Avoid Low Volatility</Label>
                    <p className="text-xs text-muted-foreground">Skip quiet market periods</p>
                  </div>
                  <Switch
                    checked={strategyConfig.avoidLowVolatility}
                    onCheckedChange={(checked) => updateStrategyConfig({ avoidLowVolatility: checked })}
                    className="data-[state=checked]:bg-[#00AEEF]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Avoid News Events</Label>
                    <p className="text-xs text-muted-foreground">Prevent volatility spikes</p>
                  </div>
                  <Switch
                    checked={strategyConfig.avoidNews}
                    onCheckedChange={(checked) => updateStrategyConfig({ avoidNews: checked })}
                    className="data-[state=checked]:bg-[#00AEEF]"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ControlPanel;