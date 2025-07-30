import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedPortfolioService } from '@/services/AdvancedPortfolioService';
import { TrendingUp, TrendingDown, AlertTriangle, Target, BarChart3, PieChart } from 'lucide-react';

const AdvancedPortfolioDashboard = () => {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<any>(null);
  const [rebalanceRecommendations, setRebalanceRecommendations] = useState<any[]>([]);
  const [performanceAttribution, setPerformanceAttribution] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const portfolioService = AdvancedPortfolioService.getInstance();

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      const [allocationsData, riskData, rebalanceData, performanceData] = await Promise.all([
        portfolioService.getPortfolioAllocations(),
        portfolioService.calculateRiskMetrics(),
        portfolioService.getRebalanceRecommendations(),
        portfolioService.getPerformanceAttribution()
      ]);

      setAllocations(allocationsData);
      setRiskMetrics(riskData);
      setRebalanceRecommendations(rebalanceData);
      setPerformanceAttribution(performanceData);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviationColor = (deviation: number) => {
    if (Math.abs(deviation) > 5) return 'text-destructive';
    if (Math.abs(deviation) > 2) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    } as const;
    
    return <Badge variant={variants[priority as keyof typeof variants]}>{priority}</Badge>;
  };

  if (loading) {
    return <div className="p-4">Loading portfolio data...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Portfolio Management</h1>
          <p className="text-muted-foreground">
            Institutional-grade portfolio optimization and risk management
          </p>
        </div>
        <Button onClick={loadPortfolioData}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="allocations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="allocations">Asset Allocation</TabsTrigger>
          <TabsTrigger value="risk">Risk Metrics</TabsTrigger>
          <TabsTrigger value="rebalance">Rebalancing</TabsTrigger>
          <TabsTrigger value="attribution">Performance Attribution</TabsTrigger>
        </TabsList>

        <TabsContent value="allocations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allocations.map((allocation) => (
              <Card key={allocation.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {allocation.symbol}
                    </CardTitle>
                    <Badge variant={Math.abs(allocation.deviation) > 5 ? 'destructive' : 'secondary'}>
                      {allocation.deviation > 0 ? '+' : ''}{allocation.deviation.toFixed(1)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Target</span>
                      <span>{allocation.targetPercentage}%</span>
                    </div>
                    <Progress value={allocation.currentPercentage} className="w-full" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Current</span>
                      <span>{allocation.currentPercentage}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last rebalanced: {allocation.lastRebalance.toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          {riskMetrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Portfolio VaR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(riskMetrics.portfolioVaR * 100).toFixed(2)}%</div>
                  <p className="text-xs text-muted-foreground">95% confidence, 1-day</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Beta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{riskMetrics.portfolioBeta.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">vs. benchmark</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{riskMetrics.sharpeRatio.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">risk-adjusted return</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(riskMetrics.maxDrawdown * 100).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">historical maximum</p>
                </CardContent>
              </Card>
            </div>
          )}

          {riskMetrics && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Regional Exposure</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                      {Object.entries(riskMetrics.exposureByRegion).map(([region, exposure]) => (
                        <div key={region} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{region}</span>
                            <span>{Number(exposure)}%</span>
                          </div>
                          <Progress value={Number(exposure)} className="w-full" />
                        </div>
                      ))}
                    </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Asset Class Exposure</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                      {Object.entries(riskMetrics.exposureBySector).map(([sector, exposure]) => (
                        <div key={sector} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{sector}</span>
                            <span>{Number(exposure)}%</span>
                          </div>
                          <Progress value={Number(exposure)} className="w-full" />
                        </div>
                      ))}
                    </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rebalance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Rebalancing Recommendations
              </CardTitle>
              <CardDescription>
                Optimize portfolio allocation based on current market conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rebalanceRecommendations.map((rec, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{rec.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        Current: {rec.currentWeight.toFixed(1)}% → Target: {rec.targetWeight.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">
                          {rec.recommendedAction === 'buy' ? (
                            <span className="text-green-600">Buy {rec.amount.toLocaleString()}</span>
                          ) : (
                            <span className="text-red-600">Sell {rec.amount.toLocaleString()}</span>
                          )}
                        </div>
                        {getPriorityBadge(rec.priority)}
                      </div>
                      {rec.recommendedAction === 'buy' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attribution" className="space-y-4">
          {performanceAttribution && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Performance Attribution</CardTitle>
                  <CardDescription>
                    Total Return: {performanceAttribution.totalReturn}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(performanceAttribution.attributions).map(([factor, value]) => (
                      <div key={factor} className="flex justify-between items-center">
                        <span className="capitalize">{factor.replace(/([A-Z])/g, ' $1')}</span>
                        <span className={`font-medium ${Number(value) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Number(value) >= 0 ? '+' : ''}{Number(value).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Benchmark Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Portfolio Return</div>
                      <div className="text-2xl font-bold text-green-600">
                        +{performanceAttribution.benchmarkComparison.portfolioReturn}%
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Benchmark Return</div>
                      <div className="text-2xl font-bold">
                        +{performanceAttribution.benchmarkComparison.benchmarkReturn}%
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Active Return</div>
                      <div className="text-2xl font-bold text-green-600">
                        +{performanceAttribution.benchmarkComparison.activeReturn}%
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Information Ratio</div>
                      <div className="text-2xl font-bold">
                        {performanceAttribution.benchmarkComparison.informationRatio}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedPortfolioDashboard;