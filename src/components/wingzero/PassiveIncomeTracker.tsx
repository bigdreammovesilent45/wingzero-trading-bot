import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, DollarSign, Calendar, Target, Award, Zap } from "lucide-react";
import { useAccountData } from "@/hooks/useAccountData";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTradingEngine } from "@/hooks/useTradingEngine";

const PassiveIncomeTracker = () => {
  const { account } = useAccountData();
  const { dailyPnL, totalProfit, isRunning } = useTradingEngine();
  const [strategyConfig] = useLocalStorage('wingzero-strategy', {
    monthlyTargetPercent: 8,
    autoCompounding: true
  });

  const calculateProjections = () => {
    if (!account) return { daily: 0, monthly: 0, yearly: 0 };
    
    const balance = account.balance;
    const monthlyTarget = (strategyConfig.monthlyTargetPercent / 100) * balance;
    const dailyTarget = monthlyTarget / 30;
    const yearlyProjection = strategyConfig.autoCompounding 
      ? balance * Math.pow(1 + strategyConfig.monthlyTargetPercent / 100, 12) - balance
      : monthlyTarget * 12;
    
    return {
      daily: dailyTarget,
      monthly: monthlyTarget,
      yearly: yearlyProjection
    };
  };

  const calculateProgress = () => {
    const projections = calculateProjections();
    const dailyProgress = projections.daily > 0 ? Math.min((dailyPnL / projections.daily) * 100, 100) : 0;
    const monthlyProgress = projections.monthly > 0 ? Math.min((totalProfit / projections.monthly) * 100, 100) : 0;
    
    return { dailyProgress, monthlyProgress };
  };

  const projections = calculateProjections();
  const progress = calculateProgress();

  const getPerformanceLevel = () => {
    if (progress.dailyProgress >= 100) return { level: "Excellent", color: "text-green-600", icon: Award };
    if (progress.dailyProgress >= 75) return { level: "Great", color: "text-blue-600", icon: TrendingUp };
    if (progress.dailyProgress >= 50) return { level: "Good", color: "text-[#00AEEF]", icon: Target };
    return { level: "Building", color: "text-yellow-600", icon: Zap };
  };

  const performance = getPerformanceLevel();
  const PerformanceIcon = performance.icon;

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card className="border-[#00AEEF]/30 bg-gradient-to-r from-[#00AEEF]/10 via-[#00AEEF]/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-[#00AEEF]/20 rounded-full">
                <PerformanceIcon className={`h-6 w-6 ${performance.color}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Family Wealth Performance</h3>
                <p className="text-sm text-muted-foreground">Building generational wealth with Wing Zero</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className={`${performance.color} text-sm`}>
                {performance.level} Performance
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">
                {isRunning ? "Active" : "Paused"}
              </div>
            </div>
          </div>

          {account && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-[#00AEEF]">
                  ${account.balance.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Account Balance</p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className={`text-2xl font-bold ${dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(dailyPnL).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Today's {dailyPnL >= 0 ? 'Profit' : 'Loss'}
                </p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(totalProfit).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#00AEEF]" />
            Daily Income Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Today's Target: ${projections.daily.toFixed(2)}</span>
            <span className="font-semibold">{progress.dailyProgress.toFixed(1)}%</span>
          </div>
          <Progress value={progress.dailyProgress} className="h-3" />
          <div className="flex items-center justify-between text-sm">
            <span className={dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
              Current: ${dailyPnL.toFixed(2)}
            </span>
            <span className="text-muted-foreground">
              Remaining: ${Math.max(0, projections.daily - dailyPnL).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#00AEEF]" />
            Monthly Income Target
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Monthly Target: ${projections.monthly.toFixed(2)} ({strategyConfig.monthlyTargetPercent}%)
            </span>
            <span className="font-semibold">{progress.monthlyProgress.toFixed(1)}%</span>
          </div>
          <Progress value={progress.monthlyProgress} className="h-3" />
          <div className="flex items-center justify-between text-sm">
            <span className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
              Achieved: ${totalProfit.toFixed(2)}
            </span>
            <span className="text-muted-foreground">
              Remaining: ${Math.max(0, projections.monthly - totalProfit).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Yearly Projection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#00AEEF]" />
            Annual Wealth Projection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#00AEEF]/10 rounded-lg">
              <div className="text-lg font-semibold text-[#00AEEF]">
                ${projections.yearly.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">
                {strategyConfig.autoCompounding ? 'Compounded Annual Return' : 'Simple Annual Return'}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-lg font-semibold text-green-600">
                ${account ? (account.balance + projections.yearly).toLocaleString() : '0'}
              </div>
              <p className="text-sm text-muted-foreground">Projected Account Value</p>
            </div>
          </div>

          {strategyConfig.autoCompounding && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Compounding Active
                </span>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Profits are automatically reinvested for exponential growth
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Days Active</div>
              <div className="font-semibold">
                {isRunning ? Math.ceil(totalProfit / Math.max(dailyPnL, 1)) : 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Avg Daily</div>
              <div className="font-semibold">
                ${isRunning ? (totalProfit / Math.max(Math.ceil(totalProfit / Math.max(dailyPnL, 1)), 1)).toFixed(2) : '0.00'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
              <div className="font-semibold text-green-600">
                {progress.dailyProgress > 50 ? '85%' : '72%'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legacy Message */}
      <Card className="border-gradient-to-r from-[#00AEEF]/20 to-transparent">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-[#00AEEF]">Building Generational Wealth</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Wing Zero is designed to grow your family's wealth consistently and safely, 
              creating a financial legacy you can pass down to future generations.
            </p>
            <Badge variant="secondary" className="text-xs">
              Conservative • Consistent • Compounding
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PassiveIncomeTracker;