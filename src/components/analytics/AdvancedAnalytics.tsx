import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertTriangle, DollarSign, Activity } from 'lucide-react';

interface PerformanceMetrics {
  totalReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  volatility: number;
  calmarRatio: number;
}

interface RiskMetrics {
  var95: number; // Value at Risk 95%
  var99: number; // Value at Risk 99%
  expectedShortfall: number;
  beta: number;
  alpha: number;
  correlation: Record<string, number>;
  exposureByAsset: Record<string, number>;
  sectorExposure: Record<string, number>;
}

interface DrawdownPeriod {
  start: string;
  end: string;
  duration: number;
  drawdown: number;
  recovery: string;
}

export const AdvancedAnalytics = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    totalReturn: 15.2,
    sharpeRatio: 1.8,
    sortinoRatio: 2.3,
    maxDrawdown: -8.5,
    winRate: 65.4,
    profitFactor: 1.9,
    averageWin: 2.1,
    averageLoss: -1.1,
    volatility: 12.3,
    calmarRatio: 1.6
  });

  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    var95: -2.5,
    var99: -4.2,
    expectedShortfall: -5.1,
    beta: 0.85,
    alpha: 3.2,
    correlation: {
      'SPY': 0.72,
      'EUR/USD': -0.15,
      'Gold': 0.23,
      'USD/JPY': 0.41
    },
    exposureByAsset: {
      'Forex': 45,
      'Stocks': 30,
      'Commodities': 15,
      'Crypto': 10
    },
    sectorExposure: {
      'Technology': 25,
      'Financial': 20,
      'Healthcare': 15,
      'Energy': 10,
      'Consumer': 30
    }
  });

  const [drawdownHistory, setDrawdownHistory] = useState<any[]>([]);
  const [monthlyReturns, setMonthlyReturns] = useState<any[]>([]);
  const [rollingMetrics, setRollingMetrics] = useState<any[]>([]);

  useEffect(() => {
    // Generate mock data
    generateMockData();
  }, []);

  const generateMockData = () => {
    // Generate drawdown history
    const drawdowns = [];
    let currentValue = 100000;
    let maxValue = currentValue;
    
    for (let i = 0; i < 252; i++) { // 1 year of trading days
      const dailyReturn = (Math.random() - 0.48) * 2; // Slightly positive bias
      currentValue *= (1 + dailyReturn / 100);
      maxValue = Math.max(maxValue, currentValue);
      
      const drawdown = ((currentValue - maxValue) / maxValue) * 100;
      
      drawdowns.push({
        date: new Date(Date.now() - (252 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: currentValue,
        drawdown: drawdown
      });
    }
    setDrawdownHistory(drawdowns);

    // Generate monthly returns
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthReturn = (Math.random() - 0.4) * 10; // Slightly positive bias
      months.push({
        month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        return: monthReturn,
        cumulative: months.reduce((sum, m) => sum + m.return, 0) + monthReturn
      });
    }
    setMonthlyReturns(months);

    // Generate rolling metrics
    const rolling = [];
    for (let i = 0; i < 52; i++) { // Weekly data for 1 year
      rolling.push({
        week: i + 1,
        sharpe: 1.2 + Math.random() * 1.2,
        volatility: 8 + Math.random() * 8,
        returns: (Math.random() - 0.45) * 5
      });
    }
    setRollingMetrics(rolling);
  };

  const getMetricColor = (value: number, type: 'performance' | 'risk'): string => {
    if (type === 'performance') {
      if (value > 0) return 'text-green-600';
      if (value < 0) return 'text-red-600';
      return 'text-gray-600';
    } else {
      if (Math.abs(value) > 5) return 'text-red-600';
      if (Math.abs(value) > 2) return 'text-yellow-600';
      return 'text-green-600';
    }
  };

  const getRatingBadge = (value: number, thresholds: [number, number]): 'default' | 'secondary' | 'destructive' => {
    if (value >= thresholds[1]) return 'default';
    if (value >= thresholds[0]) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Advanced Performance Analytics
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of trading performance and risk metrics
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Key Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Return</p>
                    <p className={`text-2xl font-bold ${getMetricColor(performanceMetrics.totalReturn, 'performance')}`}>
                      {performanceMetrics.totalReturn > 0 ? '+' : ''}{performanceMetrics.totalReturn.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                    <p className="text-2xl font-bold">{performanceMetrics.sharpeRatio.toFixed(2)}</p>
                  </div>
                  <Badge variant={getRatingBadge(performanceMetrics.sharpeRatio, [1.0, 2.0])}>
                    {performanceMetrics.sharpeRatio >= 2.0 ? 'Excellent' : 
                     performanceMetrics.sharpeRatio >= 1.0 ? 'Good' : 'Poor'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Max Drawdown</p>
                    <p className={`text-2xl font-bold ${getMetricColor(performanceMetrics.maxDrawdown, 'risk')}`}>
                      {performanceMetrics.maxDrawdown.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-2xl font-bold">{performanceMetrics.winRate.toFixed(1)}%</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyReturns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${value.toFixed(2)}%`, 'Return']} />
                    <Bar 
                      dataKey="return" 
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rolling Sharpe Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={rollingMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [value.toFixed(2), 'Sharpe Ratio']} />
                    <Line 
                      type="monotone" 
                      dataKey="sharpe" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Sortino Ratio</span>
                    <span className="font-medium">{performanceMetrics.sortinoRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Calmar Ratio</span>
                    <span className="font-medium">{performanceMetrics.calmarRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Profit Factor</span>
                    <span className="font-medium">{performanceMetrics.profitFactor.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Win</span>
                    <span className="font-medium text-green-600">+{performanceMetrics.averageWin.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Loss</span>
                    <span className="font-medium text-red-600">{performanceMetrics.averageLoss.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Volatility</span>
                    <span className="font-medium">{performanceMetrics.volatility.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          {/* Risk Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">VaR (95%)</p>
                    <p className="text-2xl font-bold text-red-600">{riskMetrics.var95.toFixed(2)}%</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Shortfall</p>
                    <p className="text-2xl font-bold text-red-600">{riskMetrics.expectedShortfall.toFixed(2)}%</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Beta</p>
                    <p className="text-2xl font-bold">{riskMetrics.beta.toFixed(2)}</p>
                  </div>
                  <Badge variant={riskMetrics.beta < 1 ? 'secondary' : 'default'}>
                    {riskMetrics.beta < 1 ? 'Lower Risk' : 'Higher Risk'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alpha</p>
                    <p className={`text-2xl font-bold ${getMetricColor(riskMetrics.alpha, 'performance')}`}>
                      {riskMetrics.alpha > 0 ? '+' : ''}{riskMetrics.alpha.toFixed(2)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Asset Exposure */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Class Exposure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(riskMetrics.exposureByAsset).map(([asset, exposure]) => (
                    <div key={asset} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{asset}</span>
                        <span className="text-sm text-muted-foreground">{exposure}%</span>
                      </div>
                      <Progress value={exposure} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sector Exposure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(riskMetrics.sectorExposure).map(([sector, exposure]) => (
                    <div key={sector} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{sector}</span>
                        <span className="text-sm text-muted-foreground">{exposure}%</span>
                      </div>
                      <Progress value={exposure} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drawdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Drawdown Analysis</CardTitle>
              <CardDescription>
                Historical drawdown periods and recovery analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={drawdownHistory}>
                  <defs>
                    <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [`${value.toFixed(2)}%`, 'Drawdown']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="drawdown" 
                    stroke="#ef4444" 
                    fillOpacity={1}
                    fill="url(#drawdownGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Attribution</CardTitle>
              <CardDescription>
                Breakdown of returns by strategy and asset class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Performance attribution analysis coming soon</p>
                <p className="text-sm">This will show strategy-level contribution to returns</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Correlation Matrix</CardTitle>
              <CardDescription>
                Asset correlation analysis for risk management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(riskMetrics.correlation).map(([asset, correlation]) => (
                  <div key={asset} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{asset}</span>
                    <div className="flex items-center gap-3">
                      <Progress value={Math.abs(correlation) * 100} className="w-24 h-2" />
                      <span className={`font-mono text-sm ${
                        correlation > 0.5 ? 'text-red-600' :
                        correlation > 0 ? 'text-yellow-600' :
                        correlation > -0.5 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {correlation > 0 ? '+' : ''}{correlation.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};