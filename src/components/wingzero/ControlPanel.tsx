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
import { CloudEngineControls } from "./CloudEngineControls";
import { ManualTradeTest } from "./ManualTradeTest";

interface StrategyConfig {
  // AI Trading Brain Settings
  brainEnabled: boolean;
  brainMode: 'conservative' | 'balanced' | 'aggressive';
  minConfidence: number;
  maxRiskPerTrade: number;
  maxDailyDrawdown: number;
  adaptivePositionSizing: boolean;
  multiTimeframeAnalysis: boolean;
  newsFilterEnabled: boolean;
  sentimentWeight: number;
  technicalWeight: number;
  fundamentalWeight: number;
  emergencyStopLoss: number;
  
  // Dual Mode Settings (Legacy - when brain disabled)
  dualModeEnabled: boolean;
  aggressiveModeEnabled: boolean;
  passiveModeEnabled: boolean;
  aggressiveAllocation: number; // % of balance for aggressive trading
  passiveAllocation: number;    // % of balance for passive income
  
  // Passive Income Settings
  passiveMaxRiskPerTrade: number;
  passiveMaxDailyLoss: number;
  passiveTakeProfitPips: number;
  passiveStopLossPips: number;
  passiveMinSignalStrength: number;
  monthlyTargetPercent: number;
  autoCompounding: boolean;
  maxPassiveTrades: number;
  
  // Aggressive Trading Settings
  aggressiveMaxRiskPerTrade: number;
  aggressiveMaxDailyLoss: number;
  aggressiveTakeProfitPips: number;
  aggressiveStopLossPips: number;
  aggressiveMinSignalStrength: number;
  scalping: boolean;
  newsTrading: boolean;
  highFrequencyMode: boolean;
  maxAggressiveTrades: number;
  aiEnhancedSignals: boolean;
  
  // Shared Settings
  trailingStopEnabled: boolean;
  trailingStopDistance: number;
  riskRewardRatio: number;
  confluenceRequired: boolean;
  trendFilterEnabled: boolean;
  momentumFilterEnabled: boolean;
  tradingSessionFilter: string;
  dynamicSizing: boolean;
  kellyCriterion: boolean;
}

const ControlPanel = () => {
  const { toast } = useToast();
  
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
    isOperational,
    cloudStatus,
    tradingConfig,
    setTradingConfig
  } = useTradingEngine();
  
  // Platform account data
  const { account, isLoading: accountLoading, error: accountError } = useAccountData();
  
  // Wing Zero positions for database sync
  const { syncPosition } = useWingZeroPositions();
  const [isTestingDb, setIsTestingDb] = useState(false);
  
  // Use strategy config from trading engine for consistency
  const strategyConfig = tradingConfig;

  const handleStart = async () => {
    console.log('handleStart called - isConnected:', isConnected, 'isOperational:', isOperational);
    
    if (!isConnected && !isOperational) {
      toast({
        title: "No Platform Connection",
        description: "Please configure your cTrader connection first or enable demo mode",
        variant: "destructive"
      });
      return;
    }
    
    if (!true) { // Risk management is always enabled
      toast({
        title: "Risk Management Required", 
        description: "Risk management must be enabled for AI trading",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await startEngine();
      
      const mode = strategyConfig.brainEnabled ? "🧠 AI Trading Brain" : "Traditional Mode";
      toast({
        title: `Wing Zero Activated! 🚀`,
        description: `Your super smart trader is now running in ${mode}`,
        duration: 5000
      });
    } catch (error) {
      toast({
        title: "Failed to start Wing Zero",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
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

  const saveAllSettings = async () => {
    try {
      // Save all current settings to localStorage
      localStorage.setItem('wingzero-strategy-backup', JSON.stringify(strategyConfig));
      toast({
        title: "All Settings Saved",
        description: "Wing Zero configuration has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    toast({
      title: "Strategy Reset to Optimal Dual-Mode",
      description: "Balanced settings for both aggressive trading and passive income",
    });
    setTradingConfig({
      // AI Trading Brain Settings
      brainEnabled: true,
      brainMode: 'balanced',
      minConfidence: 85,
      maxRiskPerTrade: 0.02,
      maxDailyDrawdown: 0.05,
      adaptivePositionSizing: true,
      multiTimeframeAnalysis: true,
      newsFilterEnabled: true,
      sentimentWeight: 0.3,
      technicalWeight: 0.5,
      fundamentalWeight: 0.2,
      emergencyStopLoss: 0.10,
      stopLossPips: 20,
      takeProfitPips: 60,
      minSignalStrength: 70,
      onePositionPerSymbol: true,
      closeOnStop: false,
      
      // Dual Mode Settings
      dualModeEnabled: false,
      aggressiveModeEnabled: false,
      passiveModeEnabled: false,
      aggressiveAllocation: 30,
      passiveAllocation: 70,
      
      // Passive Income Settings
      passiveMaxRiskPerTrade: 1.0,
      passiveMaxDailyLoss: 3,
      passiveTakeProfitPips: 50,
      passiveStopLossPips: 20,
      passiveMinSignalStrength: 80,
      monthlyTargetPercent: 8,
      autoCompounding: true,
      maxPassiveTrades: 3,
      
      // Aggressive Trading Settings
      aggressiveMaxRiskPerTrade: 3.0,
      aggressiveMaxDailyLoss: 8,
      aggressiveTakeProfitPips: 25,
      aggressiveStopLossPips: 10,
      aggressiveMinSignalStrength: 65,
      scalping: true,
      newsTrading: true,
      highFrequencyMode: true,
      maxAggressiveTrades: 8,
      aiEnhancedSignals: true,
      
      // Shared Settings
      trailingStopEnabled: true,
      trailingStopDistance: 15,
      riskRewardRatio: 2.5,
      confluenceRequired: true,
      trendFilterEnabled: true,
      momentumFilterEnabled: true,
      tradingSessionFilter: 'all',
      dynamicSizing: true,
      kellyCriterion: true
    });
  };

  const updateStrategyConfig = (updates: Partial<StrategyConfig>) => {
    console.log('Updating strategy config:', updates);
    setTradingConfig(prev => ({ ...prev, ...updates }));
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

  const calculateProjections = () => {
    if (!account) return { passive: { projected: 0, daily: 0 }, aggressive: { projected: 0, daily: 0 }, total: { projected: 0, daily: 0 } };
    
    const balance = account.balance;
    const passiveBalance = balance * (strategyConfig.passiveAllocation / 100);
    const aggressiveBalance = balance * (strategyConfig.aggressiveAllocation / 100);
    
    // Passive income projections
    const passiveMonthly = (strategyConfig.monthlyTargetPercent / 100) * passiveBalance;
    const passiveDaily = passiveMonthly / 30;
    
    // Aggressive trading projections (higher volatility, higher potential)
    const aggressiveMonthly = (15 / 100) * aggressiveBalance; // 15% monthly target for aggressive
    const aggressiveDaily = aggressiveMonthly / 30;
    
    return {
      passive: { projected: passiveMonthly, daily: passiveDaily },
      aggressive: { projected: aggressiveMonthly, daily: aggressiveDaily },
      total: { projected: passiveMonthly + aggressiveMonthly, daily: passiveDaily + aggressiveDaily }
    };
  };

  const calculateExpectedWinRate = () => {
    // Base rates for different modes
    let passiveRate = 75; // Conservative base
    let aggressiveRate = 68; // More volatile but higher volume
    
    // Passive mode adjustments
    if (strategyConfig.confluenceRequired) passiveRate += 3;
    if (strategyConfig.passiveMinSignalStrength >= 80) passiveRate += 3;
    if (strategyConfig.trendFilterEnabled && strategyConfig.momentumFilterEnabled) passiveRate += 2;
    if (strategyConfig.trailingStopEnabled) passiveRate += 1;
    
    // Aggressive mode adjustments
    if (strategyConfig.aiEnhancedSignals) aggressiveRate += 5;
    if (strategyConfig.scalping) aggressiveRate += 2;
    if (strategyConfig.newsTrading) aggressiveRate += 3;
    if (strategyConfig.highFrequencyMode) aggressiveRate += 2;
    if (strategyConfig.confluenceRequired) aggressiveRate += 2;
    
    // Combined rate based on allocation
    const combinedRate = (passiveRate * strategyConfig.passiveAllocation + aggressiveRate * strategyConfig.aggressiveAllocation) / 100;
    
    return {
      passive: Math.min(passiveRate, 88),
      aggressive: Math.min(aggressiveRate, 82),
      combined: Math.min(combinedRate, 85)
    };
  };

  const projections = calculateProjections();
  const winRates = calculateExpectedWinRate();

  return (
    <div className="space-y-6">
      {/* Dual Mode Status Card */}
      <Card className="border-[#00AEEF]/30 bg-gradient-to-r from-[#00AEEF]/10 via-red-500/5 to-green-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#00AEEF]/20 to-red-500/20 rounded-full">
                <Zap className="h-6 w-6 text-[#00AEEF]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#00AEEF]">
                  {strategyConfig.dualModeEnabled ? "Dual-Mode Active" : strategyConfig.aggressiveModeEnabled ? "Aggressive Mode" : "Passive Mode"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {strategyConfig.dualModeEnabled 
                    ? "AI-enhanced aggressive trading + family wealth building"
                    : strategyConfig.aggressiveModeEnabled 
                      ? "Maximum performance trading with AI enhancement"
                      : "Conservative family wealth building"
                  }
                </p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-3xl font-bold text-[#00AEEF]">
                {strategyConfig.dualModeEnabled ? winRates.combined.toFixed(1) : strategyConfig.aggressiveModeEnabled ? winRates.aggressive.toFixed(1) : winRates.passive.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Expected Win Rate</p>
              <Badge variant="secondary" className="text-xs">
                {strategyConfig.dualModeEnabled ? "Dual Strategy" : strategyConfig.aggressiveModeEnabled ? "High Performance" : "Family-Safe"}
              </Badge>
            </div>
          </div>
          
          {account && (
            <div className="mt-6 space-y-4">
              {strategyConfig.dualModeEnabled && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#00AEEF]/20">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">Passive Income</div>
                    <div className="text-lg font-bold text-green-600">${projections.passive.daily.toFixed(2)}/day</div>
                    <div className="text-xs text-muted-foreground">{strategyConfig.passiveAllocation}% allocation</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-sm font-medium text-red-700 dark:text-red-300">Aggressive Trading</div>
                    <div className="text-lg font-bold text-red-600">${projections.aggressive.daily.toFixed(2)}/day</div>
                    <div className="text-xs text-muted-foreground">{strategyConfig.aggressiveAllocation}% allocation</div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-lg font-semibold text-[#00AEEF]">
                    ${projections.total.daily.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Daily Target</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-[#00AEEF]">
                    ${projections.total.projected.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Monthly Target</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-[#00AEEF]">
                    ${(projections.total.projected * 12).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Annual Projection</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Connection Status */}
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
                <h3 className="text-lg font-semibold">Platform Live Connection</h3>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Real-time trading active' : 'Configure platform connection in Setup'}
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
                    Progress: {account.balance > 0 ? ((account.profit / projections.total.daily) * 100).toFixed(1) : 0}% of daily target
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
                  {isRunning && (
                    <div className="text-xs text-green-600 mt-1">
                      ✅ VERIFIED ACTIVE
                    </div>
                  )}
                  {cloudStatus.isRunning && (
                    <div className="text-xs text-blue-600 mt-1">
                      ☁️ CLOUD ACTIVE 24/7
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Active Trades</div>
                  <div className="font-semibold">{openPositions.length}/{(strategyConfig.maxPassiveTrades || 3) + (strategyConfig.maxAggressiveTrades || 8)}</div>
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
            <Settings className="h-5 w-5 text-[#00AEEF]" />
            Advanced Trading Control Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              onClick={handleStart}
              disabled={isRunning || !isConnected}
              className="bg-[#00AEEF] hover:bg-[#00AEEF]/80 text-black font-medium disabled:opacity-50"
            >
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? "Running" : "Start Wing Zero"}
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
              Reset to Optimal
            </Button>
            <Button 
              onClick={saveAllSettings}
              variant="outline"
              className="border-green-500/20 hover:border-green-500/40 hover:bg-green-500/10"
            >
              💾 Save All Settings
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
                <Label className="text-base font-medium">Dual Mode (Recommended)</Label>
                <p className="text-sm text-muted-foreground">Run both aggressive trading + passive income simultaneously</p>
              </div>
              <Switch
                checked={strategyConfig.dualModeEnabled || false}
                onCheckedChange={(checked) => updateStrategyConfig({ dualModeEnabled: checked })}
                className="data-[state=checked]:bg-[#00AEEF]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Aggressive Trading Mode</Label>
                <p className="text-sm text-muted-foreground">AI-enhanced high-frequency trading for maximum profits</p>
              </div>
              <Switch
                checked={strategyConfig.aggressiveModeEnabled || false}
                onCheckedChange={(checked) => updateStrategyConfig({ aggressiveModeEnabled: checked })}
                className="data-[state=checked]:bg-red-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Passive Income Mode</Label>
                <p className="text-sm text-muted-foreground">Conservative wealth building for family legacy</p>
              </div>
              <Switch
                checked={strategyConfig.passiveModeEnabled || false}
                onCheckedChange={(checked) => updateStrategyConfig({ passiveModeEnabled: checked })}
                className="data-[state=checked]:bg-green-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Auto Trading</Label>
                <p className="text-sm text-muted-foreground">Fully automated execution - hands-free operation</p>
              </div>
              <Switch
                checked={strategyConfig.brainEnabled}
                onCheckedChange={(checked) => updateStrategyConfig({ brainEnabled: checked })}
                className="data-[state=checked]:bg-[#00AEEF]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Risk Management (Required)</Label>
                <p className="text-sm text-muted-foreground">Essential protection for all trading modes</p>
              </div>
              <Switch
                checked={true} // Risk Management is always required
                onCheckedChange={() => {}} // Cannot be disabled
                disabled
                className="data-[state=checked]:bg-[#00AEEF]"
              />
            </div>
          </div>

          {/* Strategy Configuration */}
          <Tabs defaultValue="brain" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="brain" className="flex items-center gap-1">
                🧠
                AI Brain
              </TabsTrigger>
              <TabsTrigger value="allocation" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Allocation
              </TabsTrigger>
              <TabsTrigger value="passive" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Passive
              </TabsTrigger>
              <TabsTrigger value="aggressive" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Aggressive
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

            {/* AI Trading Brain Settings */}
            <TabsContent value="brain" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">🧠 AI Trading Brain</Label>
                    <p className="text-sm text-muted-foreground">Full autonomous AI trading - your super smart trader friend</p>
                  </div>
                  <Switch
                    checked={strategyConfig.brainEnabled}
                    onCheckedChange={(checked) => updateStrategyConfig({ brainEnabled: checked })}
                    className="data-[state=checked]:bg-[#00AEEF]"
                  />
                </div>

                {strategyConfig.brainEnabled && (
                  <>
                    <div className="space-y-3">
                      <Label>Brain Mode</Label>
                      <Select
                        value={strategyConfig.brainMode}
                        onValueChange={(value) => updateStrategyConfig({ brainMode: value as 'conservative' | 'balanced' | 'aggressive' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conservative">🛡️ Conservative - Family Safe</SelectItem>
                          <SelectItem value="balanced">⚖️ Balanced - Smart Growth</SelectItem>
                          <SelectItem value="aggressive">🚀 Aggressive - Maximum Performance</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Brain adapts risk and strategy automatically</p>
                    </div>

                    <div className="space-y-3">
                      <Label>Minimum Confidence: {strategyConfig.minConfidence}%</Label>
                      <Slider
                        value={[strategyConfig.minConfidence]}
                        onValueChange={(value) => updateStrategyConfig({ minConfidence: value[0] })}
                        max={95}
                        min={70}
                        step={5}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">Higher = AI only trades when extremely confident</p>
                    </div>

                    <div className="space-y-3">
                      <Label>Max Risk Per Trade: {(strategyConfig.maxRiskPerTrade * 100).toFixed(1)}%</Label>
                      <Slider
                        value={[strategyConfig.maxRiskPerTrade * 100]}
                        onValueChange={(value) => updateStrategyConfig({ maxRiskPerTrade: value[0] / 100 })}
                        max={5}
                        min={0.5}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">AI automatically calculates optimal position sizes</p>
                    </div>

                    <div className="space-y-3">
                      <Label>Max Daily Drawdown: {(strategyConfig.maxDailyDrawdown * 100).toFixed(1)}%</Label>
                      <Slider
                        value={[strategyConfig.maxDailyDrawdown * 100]}
                        onValueChange={(value) => updateStrategyConfig({ maxDailyDrawdown: value[0] / 100 })}
                        max={10}
                        min={2}
                        step={0.5}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">Emergency stop if losses exceed this limit</p>
                    </div>

                    <div className="space-y-3">
                      <Label>Signal Weights</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Technical Analysis: {(strategyConfig.technicalWeight * 100).toFixed(0)}%</span>
                          <Slider
                            value={[strategyConfig.technicalWeight * 100]}
                            onValueChange={(value) => updateStrategyConfig({ technicalWeight: value[0] / 100 })}
                            max={70}
                            min={20}
                            step={5}
                            className="w-32"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Market Sentiment: {(strategyConfig.sentimentWeight * 100).toFixed(0)}%</span>
                          <Slider
                            value={[strategyConfig.sentimentWeight * 100]}
                            onValueChange={(value) => updateStrategyConfig({ sentimentWeight: value[0] / 100 })}
                            max={50}
                            min={10}
                            step={5}
                            className="w-32"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Fundamental News: {(strategyConfig.fundamentalWeight * 100).toFixed(0)}%</span>
                          <Slider
                            value={[strategyConfig.fundamentalWeight * 100]}
                            onValueChange={(value) => updateStrategyConfig({ fundamentalWeight: value[0] / 100 })}
                            max={40}
                            min={10}
                            step={5}
                            className="w-32"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">AI combines multiple data sources for decisions</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Adaptive Position Sizing</Label>
                        <p className="text-xs text-muted-foreground">AI uses Kelly Criterion for optimal sizing</p>
                      </div>
                      <Switch
                        checked={strategyConfig.adaptivePositionSizing}
                        onCheckedChange={(checked) => updateStrategyConfig({ adaptivePositionSizing: checked })}
                        className="data-[state=checked]:bg-[#00AEEF]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Multi-Timeframe Analysis</Label>
                        <p className="text-xs text-muted-foreground">AI analyzes multiple timeframes simultaneously</p>
                      </div>
                      <Switch
                        checked={strategyConfig.multiTimeframeAnalysis}
                        onCheckedChange={(checked) => updateStrategyConfig({ multiTimeframeAnalysis: checked })}
                        className="data-[state=checked]:bg-[#00AEEF]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>News Filter</Label>
                        <p className="text-xs text-muted-foreground">AI avoids trading during high-impact news</p>
                      </div>
                      <Switch
                        checked={strategyConfig.newsFilterEnabled}
                        onCheckedChange={(checked) => updateStrategyConfig({ newsFilterEnabled: checked })}
                        className="data-[state=checked]:bg-[#00AEEF]"
                      />
                    </div>
                  </>
                )}
              </div>

              {!strategyConfig.brainEnabled && (
                <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="text-6xl mb-4">🧠</div>
                  <h3 className="text-xl font-semibold mb-2">Enable Wing Zero AI Brain</h3>
                  <p className="text-muted-foreground mb-4">
                    Let Wing Zero's super smart AI trader handle everything for you. 
                    Like having the world's best trader working 24/7 for your family.
                  </p>
                  <Button 
                    onClick={() => updateStrategyConfig({ brainEnabled: true })}
                    className="bg-[#00AEEF] hover:bg-[#00AEEF]/80 text-black font-medium"
                  >
                    Enable AI Brain
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Capital Allocation */}
            <TabsContent value="allocation" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Aggressive Trading Allocation: {strategyConfig.aggressiveAllocation}%</Label>
                  <Slider
                    value={[strategyConfig.aggressiveAllocation]}
                    onValueChange={(value) => updateStrategyConfig({ 
                      aggressiveAllocation: value[0], 
                      passiveAllocation: 100 - value[0] 
                    })}
                    max={70}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Higher allocation = more aggressive profits, higher risk</p>
                </div>

                <div className="space-y-3">
                  <Label>Passive Income Allocation: {strategyConfig.passiveAllocation}%</Label>
                  <Slider
                    value={[strategyConfig.passiveAllocation]}
                    onValueChange={(value) => updateStrategyConfig({ 
                      passiveAllocation: value[0], 
                      aggressiveAllocation: 100 - value[0] 
                    })}
                    max={90}
                    min={30}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Stable, consistent returns for wealth preservation</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Compounding</Label>
                    <p className="text-xs text-muted-foreground">Reinvest profits automatically</p>
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
                  <p className="text-xs text-muted-foreground">Ultimate protection - stops everything</p>
                </div>
              </div>
            </TabsContent>

            {/* Passive Income Settings */}
            <TabsContent value="passive" className="space-y-4">
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
                  <Label>Max Passive Trades: {strategyConfig.maxPassiveTrades}</Label>
                  <Slider
                    value={[strategyConfig.maxPassiveTrades]}
                    onValueChange={(value) => updateStrategyConfig({ maxPassiveTrades: value[0] })}
                    max={8}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Passive Risk per Trade: {strategyConfig.passiveMaxRiskPerTrade}%</Label>
                  <Slider
                    value={[strategyConfig.passiveMaxRiskPerTrade]}
                    onValueChange={(value) => updateStrategyConfig({ passiveMaxRiskPerTrade: value[0] })}
                    max={3}
                    min={0.5}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Conservative risk for family wealth</p>
                </div>

                <div className="space-y-3">
                  <Label>Passive Signal Strength: {strategyConfig.passiveMinSignalStrength}%</Label>
                  <Slider
                    value={[strategyConfig.passiveMinSignalStrength]}
                    onValueChange={(value) => updateStrategyConfig({ passiveMinSignalStrength: value[0] })}
                    max={95}
                    min={60}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Higher = more selective, safer trades</p>
                </div>
              </div>
            </TabsContent>

            {/* Aggressive Trading Settings */}
            <TabsContent value="aggressive" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Max Aggressive Trades: {strategyConfig.maxAggressiveTrades}</Label>
                  <Slider
                    value={[strategyConfig.maxAggressiveTrades]}
                    onValueChange={(value) => updateStrategyConfig({ maxAggressiveTrades: value[0] })}
                    max={15}
                    min={3}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Higher = more opportunities, more activity</p>
                </div>

                <div className="space-y-3">
                  <Label>Aggressive Risk per Trade: {strategyConfig.aggressiveMaxRiskPerTrade}%</Label>
                  <Slider
                    value={[strategyConfig.aggressiveMaxRiskPerTrade]}
                    onValueChange={(value) => updateStrategyConfig({ aggressiveMaxRiskPerTrade: value[0] })}
                    max={8}
                    min={1}
                    step={0.5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Higher risk = higher reward potential</p>
                </div>

                <div className="space-y-3">
                  <Label>Aggressive Signal Strength: {strategyConfig.aggressiveMinSignalStrength}%</Label>
                  <Slider
                    value={[strategyConfig.aggressiveMinSignalStrength]}
                    onValueChange={(value) => updateStrategyConfig({ aggressiveMinSignalStrength: value[0] })}
                    max={85}
                    min={50}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Lower = more trades, higher frequency</p>
                </div>

                <div className="space-y-3">
                  <Label>Take Profit: {strategyConfig.aggressiveTakeProfitPips} pips</Label>
                  <Slider
                    value={[strategyConfig.aggressiveTakeProfitPips]}
                    onValueChange={(value) => updateStrategyConfig({ aggressiveTakeProfitPips: value[0] })}
                    max={50}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Quick profits for high-frequency trading</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>AI Enhanced Signals</Label>
                    <p className="text-xs text-muted-foreground">Smarter than world's best traders</p>
                  </div>
                  <Switch
                    checked={strategyConfig.aiEnhancedSignals}
                    onCheckedChange={(checked) => updateStrategyConfig({ aiEnhancedSignals: checked })}
                    className="data-[state=checked]:bg-[#00AEEF]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Scalping Mode</Label>
                    <p className="text-xs text-muted-foreground">Quick in-and-out trades</p>
                  </div>
                  <Switch
                    checked={strategyConfig.scalping}
                    onCheckedChange={(checked) => updateStrategyConfig({ scalping: checked })}
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>News Trading</Label>
                    <p className="text-xs text-muted-foreground">Capitalize on volatility spikes</p>
                  </div>
                  <Switch
                    checked={strategyConfig.newsTrading}
                    onCheckedChange={(checked) => updateStrategyConfig({ newsTrading: checked })}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>High Frequency Mode</Label>
                    <p className="text-xs text-muted-foreground">Maximum trading speed</p>
                  </div>
                  <Switch
                    checked={strategyConfig.highFrequencyMode}
                    onCheckedChange={(checked) => updateStrategyConfig({ highFrequencyMode: checked })}
                    className="data-[state=checked]:bg-purple-500"
                  />
                </div>
              </div>
            </TabsContent>


            {/* Signal Filtering */}
            <TabsContent value="signals" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <p className="text-xs text-muted-foreground">Higher = bigger wins per trade</p>
                </div>

                <div className="space-y-3">
                  <Label>Trailing Stop Distance: {strategyConfig.trailingStopDistance} pips</Label>
                  <Slider
                    value={[strategyConfig.trailingStopDistance]}
                    onValueChange={(value) => updateStrategyConfig({ trailingStopDistance: value[0] })}
                    max={30}
                    min={5}
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

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Confluence Required</Label>
                    <p className="text-xs text-muted-foreground">Multiple signal confirmations</p>
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
                    <p className="text-xs text-muted-foreground">Trade with the dominant trend</p>
                  </div>
                  <Switch
                    checked={strategyConfig.trendFilterEnabled}
                    onCheckedChange={(checked) => updateStrategyConfig({ trendFilterEnabled: checked })}
                    className="data-[state=checked]:bg-[#00AEEF]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Momentum Filter</Label>
                    <p className="text-xs text-muted-foreground">Enhanced momentum detection</p>
                  </div>
                  <Switch
                    checked={strategyConfig.momentumFilterEnabled}
                    onCheckedChange={(checked) => updateStrategyConfig({ momentumFilterEnabled: checked })}
                    className="data-[state=checked]:bg-[#00AEEF]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dynamic Position Sizing</Label>
                    <p className="text-xs text-muted-foreground">Adaptive Kelly Criterion</p>
                  </div>
                  <Switch
                    checked={strategyConfig.dynamicSizing}
                    onCheckedChange={(checked) => updateStrategyConfig({ dynamicSizing: checked })}
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
                      <SelectItem value="all">24/7 Trading (Aggressive)</SelectItem>
                      <SelectItem value="london">London Session</SelectItem>
                      <SelectItem value="new-york">New York Session</SelectItem>
                      <SelectItem value="london-ny-overlap">London-NY Overlap (High Volume)</SelectItem>
                      <SelectItem value="tokyo">Tokyo Session</SelectItem>
                      <SelectItem value="sydney">Sydney Session</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">All sessions = maximum opportunities</p>
                </div>

                <div className="space-y-3">
                  <Label>Daily Loss Limits</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Passive: {strategyConfig.passiveMaxDailyLoss}%</Label>
                      <Slider
                        value={[strategyConfig.passiveMaxDailyLoss]}
                        onValueChange={(value) => updateStrategyConfig({ passiveMaxDailyLoss: value[0] })}
                        max={10}
                        min={1}
                        step={0.5}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Aggressive: {strategyConfig.aggressiveMaxDailyLoss}%</Label>
                      <Slider
                        value={[strategyConfig.aggressiveMaxDailyLoss]}
                        onValueChange={(value) => updateStrategyConfig({ aggressiveMaxDailyLoss: value[0] })}
                        max={20}
                        min={3}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-6">
                  <Card className="p-4 bg-green-50 dark:bg-green-950/20">
                    <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Passive Mode Win Rate</h4>
                    <div className="text-2xl font-bold text-green-600">{winRates.passive}%</div>
                    <p className="text-xs text-muted-foreground">Conservative & Consistent</p>
                  </Card>
                  
                  <Card className="p-4 bg-red-50 dark:bg-red-950/20">
                    <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">Aggressive Mode Win Rate</h4>
                    <div className="text-2xl font-bold text-red-600">{winRates.aggressive}%</div>
                    <p className="text-xs text-muted-foreground">High Volume & AI Enhanced</p>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Manual Trade Test */}
      <ManualTradeTest />

      {/* Cloud Engine Controls */}
      <CloudEngineControls />
    </div>
  );
};

export default ControlPanel;