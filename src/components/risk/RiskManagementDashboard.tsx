import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AdvancedRiskManager, RiskLimit, CircuitBreaker, StressTestScenario } from '@/services/AdvancedRiskManager';
import { AlertTriangle, Shield, Zap, Activity, Target, TrendingDown } from 'lucide-react';

export const RiskManagementDashboard = () => {
  const [riskManager] = useState(() => AdvancedRiskManager.getInstance());
  const [riskStatus, setRiskStatus] = useState<any>(null);
  const [selectedStressTest, setSelectedStressTest] = useState<StressTestScenario | null>(null);
  const [stressTestResults, setStressTestResults] = useState<any>(null);
  const [portfolioData, setPortfolioData] = useState({
    dailyPnL: -2.1,
    largestPositionSize: 8.5,
    maxCorrelation: 0.65,
    portfolioVolatility: 18.2,
    totalValue: 100000
  });

  useEffect(() => {
    // Update risk limits with mock data
    riskManager.updateRiskLimits(portfolioData);
    setRiskStatus(riskManager.getRiskStatus());

    // Simulate real-time updates
    const interval = setInterval(() => {
      // Mock some fluctuations
      const newData = {
        ...portfolioData,
        dailyPnL: portfolioData.dailyPnL + (Math.random() - 0.5) * 0.5,
        maxCorrelation: Math.max(0, Math.min(1, portfolioData.maxCorrelation + (Math.random() - 0.5) * 0.1)),
        portfolioVolatility: Math.max(0, portfolioData.portfolioVolatility + (Math.random() - 0.5) * 2)
      };
      
      setPortfolioData(newData);
      riskManager.updateRiskLimits(newData);
      setRiskStatus(riskManager.getRiskStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, [riskManager, portfolioData]);

  const handleStressTest = (scenario: StressTestScenario) => {
    // Mock portfolio positions
    const mockPositions = [
      { symbol: 'EURUSD', value: 25000 },
      { symbol: 'GBPUSD', value: 20000 },
      { symbol: 'SPY', value: 30000 },
      { symbol: 'GOLD', value: 15000 },
      { symbol: 'BTC', value: 10000 }
    ];

    const results = riskManager.runStressTest(mockPositions, scenario);
    setStressTestResults(results);
    setSelectedStressTest(scenario);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'safe': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  if (!riskStatus) {
    return <div>Loading risk management...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Management Dashboard
            </div>
            <Badge variant={getStatusBadge(riskStatus.overall) as any} className="text-sm">
              {riskStatus.overall.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Advanced risk monitoring and control system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{riskStatus.limits.filter((l: RiskLimit) => l.status === 'safe').length}</p>
              <p className="text-sm text-muted-foreground">Limits Safe</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{riskStatus.limits.filter((l: RiskLimit) => l.status === 'warning').length}</p>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Zap className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{riskStatus.limits.filter((l: RiskLimit) => l.status === 'critical').length}</p>
              <p className="text-sm text-muted-foreground">Critical</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{riskStatus.circuitBreakers.filter((cb: CircuitBreaker) => cb.isActive).length}</p>
              <p className="text-sm text-muted-foreground">Breakers Active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="limits" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="limits">Risk Limits</TabsTrigger>
          <TabsTrigger value="breakers">Circuit Breakers</TabsTrigger>
          <TabsTrigger value="stress">Stress Tests</TabsTrigger>
          <TabsTrigger value="kelly">Position Sizing</TabsTrigger>
        </TabsList>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Limit Monitoring</CardTitle>
              <CardDescription>Real-time monitoring of risk exposure limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {riskStatus.limits.map((limit: RiskLimit) => (
                  <div key={limit.type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium capitalize">
                          {limit.type.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {limit.current.toFixed(2)}{limit.type.includes('percentage') || limit.type.includes('loss') ? '%' : ''} / {limit.value}{limit.type.includes('percentage') || limit.type.includes('loss') ? '%' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusBadge(limit.status) as any}>
                          {limit.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {limit.utilization.toFixed(1)}% utilized
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={limit.utilization} 
                      className={`h-3 ${
                        limit.status === 'critical' ? 'bg-red-100' :
                        limit.status === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {riskStatus.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-blue-500" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Circuit Breakers</CardTitle>
              <CardDescription>Automated trading halts and risk controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskStatus.circuitBreakers.map((breaker: CircuitBreaker) => (
                  <div key={breaker.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{breaker.name}</h4>
                        <Badge variant={breaker.isActive ? 'default' : 'secondary'}>
                          {breaker.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{breaker.condition}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Action: {breaker.action.replace('_', ' ')}
                        {breaker.lastTriggered && ` • Last triggered: ${new Date(breaker.lastTriggered).toLocaleString()}`}
                      </p>
                    </div>
                    <Switch
                      checked={breaker.isActive}
                      onCheckedChange={(checked) => riskManager.toggleCircuitBreaker(breaker.id, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stress Testing</CardTitle>
              <CardDescription>Test portfolio resilience under adverse market conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {riskManager.getStressTestScenarios().map((scenario) => (
                  <Card key={scenario.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStressTest(scenario)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{scenario.name}</CardTitle>
                      <CardDescription>{scenario.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Market Shock:</span>
                          <span className="font-medium text-red-600">{scenario.marketShock}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Volatility:</span>
                          <span className="font-medium">{scenario.volatilityMultiplier}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="font-medium">{scenario.duration} days</span>
                        </div>
                      </div>
                      <Button className="w-full mt-3" variant="outline" size="sm">
                        Run Test
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Stress Test Results */}
              {stressTestResults && selectedStressTest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      Stress Test Results: {selectedStressTest.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">Total Loss</p>
                        <p className="text-2xl font-bold text-red-600">
                          ${Math.abs(stressTestResults.totalLoss).toLocaleString()}
                        </p>
                        <p className="text-sm text-red-600">
                          {stressTestResults.lossPercentage.toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <p className="text-sm text-orange-800 dark:text-orange-200">VaR (95%)</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {stressTestResults.riskMetrics.var95.toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">Max Drawdown</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {stressTestResults.riskMetrics.maxDrawdown.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Position Impact</h4>
                      {stressTestResults.positionResults.map((pos: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                          <span className="font-medium">{pos.symbol}</span>
                          <div className="text-right">
                            <span className={`font-medium ${pos.loss < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ${pos.loss.toLocaleString()}
                            </span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({pos.lossPercentage.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kelly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimal Position Sizing</CardTitle>
              <CardDescription>Kelly Criterion and volatility-based position sizing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Kelly Criterion Calculator</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Win Rate:</span>
                      <span className="font-medium">65%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Win:</span>
                      <span className="font-medium text-green-600">+2.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Loss:</span>
                      <span className="font-medium text-red-600">-1.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Optimal Kelly Size:</span>
                      <span className="font-medium">6.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Fractional Kelly (25%):</span>
                      <span className="font-medium text-blue-600">1.7%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Volatility Adjustment</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Target Volatility:</span>
                      <span className="font-medium">15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Current Portfolio Vol:</span>
                      <span className="font-medium">{portfolioData.portfolioVolatility.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Volatility Ratio:</span>
                      <span className="font-medium">
                        {(15 / portfolioData.portfolioVolatility).toFixed(2)}x
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Adjusted Position Size:</span>
                      <span className="font-medium text-purple-600">
                        {(1.7 * (15 / portfolioData.portfolioVolatility)).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Position Sizing Recommendations</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Use fractional Kelly (25%) to reduce risk of ruin</li>
                  <li>• Adjust position size based on current market volatility</li>
                  <li>• Never exceed 10% of portfolio in a single position</li>
                  <li>• Consider correlation when sizing multiple positions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};