import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Settings, Zap, Shield, Target } from "lucide-react";
import { useTradingEngine } from "@/hooks/useTradingEngine";
import { useAutoStartTrading } from "@/hooks/useAutoStartTrading";
import { useToast } from "@/hooks/use-toast";

interface AutoTradingSettings {
  autoStart: boolean;
  aggressiveMode: boolean;
  riskLevel: number; // 1-10
  tradingHours: 'always' | 'market_hours' | 'custom';
  maxDailyTrades: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  trailingStop: boolean;
}

export const AutoTradingControls: React.FC = () => {
  const { isRunning, startEngine, stopEngine, isOperational, tradingConfig, setTradingConfig } = useTradingEngine();
  const { hasAutoStarted, resetAutoStart } = useAutoStartTrading();
  const { toast } = useToast();

  const [settings, setSettings] = useState<AutoTradingSettings>({
    autoStart: true,
    aggressiveMode: false,
    riskLevel: 5,
    tradingHours: 'market_hours',
    maxDailyTrades: 10,
    stopLossPercent: 2.0,
    takeProfitPercent: 3.0,
    trailingStop: true
  });

  // Auto-update trading config when settings change
  useEffect(() => {
    if (setTradingConfig) {
      setTradingConfig({
        ...tradingConfig,
        maxRiskPerTrade: settings.riskLevel / 100, // Convert to decimal
        maxDailyDrawdown: settings.stopLossPercent / 100,
        brainEnabled: true,
        brainMode: settings.aggressiveMode ? 'aggressive' : 'balanced',
        minConfidence: settings.aggressiveMode ? 75 : 85
      });
    }
  }, [settings, setTradingConfig]);

  const handleToggleEngine = async () => {
    try {
      if (isRunning) {
        await stopEngine();
        toast({
          title: "🛑 Trading Stopped",
          description: "Wing Zero has been paused"
        });
      } else {
        await startEngine();
        toast({
          title: "🚀 Trading Started",
          description: "Wing Zero is now actively trading"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle trading engine",
        variant: "destructive"
      });
    }
  };

  const handleSettingChange = (key: keyof AutoTradingSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadge = () => {
    if (!isOperational) return <Badge variant="secondary">Not Ready</Badge>;
    if (isRunning) return <Badge variant="default" className="bg-green-600">🚀 ACTIVE</Badge>;
    return <Badge variant="outline">Paused</Badge>;
  };

  const getRiskLevelText = (level: number) => {
    if (level <= 3) return "Conservative";
    if (level <= 6) return "Moderate";
    if (level <= 8) return "Aggressive";
    return "High Risk";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Auto Trading Controls
            </CardTitle>
            <CardDescription>
              Configure Wing Zero for fully automated 24/7 trading
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Engine Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {isRunning ? <Play className="h-5 w-5 text-green-600" /> : <Pause className="h-5 w-5 text-gray-500" />}
            <div>
              <Label className="text-base font-medium">
                Trading Engine
              </Label>
              <p className="text-sm text-muted-foreground">
                {isRunning ? 'Actively monitoring and executing trades' : 'Engine is paused'}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleToggleEngine}
            disabled={!isOperational}
            variant={isRunning ? "destructive" : "default"}
            size="lg"
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Trading
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Trading
              </>
            )}
          </Button>
        </div>

        {/* Auto-Start Setting */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Auto-Start on Load</Label>
            <p className="text-sm text-muted-foreground">
              Automatically start trading when app loads
            </p>
          </div>
          <Switch
            checked={settings.autoStart}
            onCheckedChange={(checked) => handleSettingChange('autoStart', checked)}
          />
        </div>

        {/* Aggressive Mode */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex items-center gap-2">
            <Target className="h-4 w-4" />
            <div>
              <Label className="text-base">Aggressive Mode</Label>
              <p className="text-sm text-muted-foreground">
                Higher frequency, more opportunities
              </p>
            </div>
          </div>
          <Switch
            checked={settings.aggressiveMode}
            onCheckedChange={(checked) => handleSettingChange('aggressiveMode', checked)}
          />
        </div>

        {/* Risk Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk Level: {getRiskLevelText(settings.riskLevel)}
            </Label>
            <Badge variant="outline">{settings.riskLevel}/10</Badge>
          </div>
          <Slider
            value={[settings.riskLevel]}
            onValueChange={(value) => handleSettingChange('riskLevel', value[0])}
            max={10}
            min={1}
            step={1}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Conservative</span>
            <span>Balanced</span>
            <span>Aggressive</span>
          </div>
        </div>

        {/* Trading Hours */}
        <div className="space-y-2">
          <Label className="text-base">Trading Hours</Label>
          <Select 
            value={settings.tradingHours} 
            onValueChange={(value) => handleSettingChange('tradingHours', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="always">24/7 Always</SelectItem>
              <SelectItem value="market_hours">Market Hours Only</SelectItem>
              <SelectItem value="custom">Custom Schedule</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Daily Trades */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-base">Max Daily Trades</Label>
            <Badge variant="outline">{settings.maxDailyTrades}</Badge>
          </div>
          <Slider
            value={[settings.maxDailyTrades]}
            onValueChange={(value) => handleSettingChange('maxDailyTrades', value[0])}
            max={50}
            min={5}
            step={5}
            className="py-4"
          />
        </div>

        {/* Risk Management */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Stop Loss %</Label>
            <Slider
              value={[settings.stopLossPercent]}
              onValueChange={(value) => handleSettingChange('stopLossPercent', value[0])}
              max={5}
              min={0.5}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">{settings.stopLossPercent}%</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Take Profit %</Label>
            <Slider
              value={[settings.takeProfitPercent]}
              onValueChange={(value) => handleSettingChange('takeProfitPercent', value[0])}
              max={10}
              min={1}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">{settings.takeProfitPercent}%</p>
          </div>
        </div>

        {/* Trailing Stop */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Trailing Stop</Label>
            <p className="text-sm text-muted-foreground">
              Automatically adjust stops to lock in profits
            </p>
          </div>
          <Switch
            checked={settings.trailingStop}
            onCheckedChange={(checked) => handleSettingChange('trailingStop', checked)}
          />
        </div>

        {/* Status Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Current Configuration</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Mode: {settings.aggressiveMode ? 'Aggressive' : 'Balanced'}</div>
            <div>Risk: {getRiskLevelText(settings.riskLevel)}</div>
            <div>Hours: {settings.tradingHours.replace('_', ' ')}</div>
            <div>Max Trades: {settings.maxDailyTrades}/day</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};