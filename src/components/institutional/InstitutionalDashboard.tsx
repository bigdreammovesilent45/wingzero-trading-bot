import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstitutionalFeaturesService } from '@/services/InstitutionalFeaturesService';
import { Clock, CheckCircle, XCircle, DollarSign, Users, Shield } from 'lucide-react';

const InstitutionalDashboard = () => {
  const [primeOfDay, setPrimeOfDay] = useState<any[]>([]);
  const [liquidityPools, setLiquidityPools] = useState<any[]>([]);
  const [institutionalOrders, setInstitutionalOrders] = useState<any[]>([]);
  const [creditLimits, setCreditLimits] = useState<any[]>([]);
  const [marginRequirements, setMarginRequirements] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const institutionalService = InstitutionalFeaturesService.getInstance();

  useEffect(() => {
    loadInstitutionalData();
  }, []);

  const loadInstitutionalData = async () => {
    try {
      const [podData, poolsData, ordersData, limitsData, marginData] = await Promise.all([
        institutionalService.getPrimeOfDayTasks(),
        institutionalService.getLiquidityPools(),
        institutionalService.getInstitutionalOrders(),
        institutionalService.getCreditLimits(),
        institutionalService.getMarginRequirements()
      ]);

      setPrimeOfDay(podData);
      setLiquidityPools(poolsData);
      setInstitutionalOrders(ordersData);
      setCreditLimits(limitsData);
      setMarginRequirements(marginData);
    } catch (error) {
      console.error('Error loading institutional data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTierBadge = (tier: string) => {
    const variants = {
      tier1: 'default',
      tier2: 'secondary',
      tier3: 'outline'
    } as const;
    
    return <Badge variant={variants[tier as keyof typeof variants]}>{tier.toUpperCase()}</Badge>;
  };

  if (loading) {
    return <div className="p-4">Loading institutional data...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Institutional Dashboard</h1>
          <p className="text-muted-foreground">
            Enterprise-grade trading infrastructure and prime services
          </p>
        </div>
        <Button onClick={loadInstitutionalData}>
          <Users className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="prime-of-day" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="prime-of-day">Prime of Day</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity Pools</TabsTrigger>
          <TabsTrigger value="orders">Institutional Orders</TabsTrigger>
          <TabsTrigger value="credit">Credit & Margin</TabsTrigger>
          <TabsTrigger value="settlement">Settlement</TabsTrigger>
        </TabsList>

        <TabsContent value="prime-of-day" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Prime of Day Tasks
              </CardTitle>
              <CardDescription>
                Daily operational tasks and system health checks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {primeOfDay.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <div className="font-medium">{task.description}</div>
                        <div className="text-sm text-muted-foreground">
                          Scheduled: {task.time}
                          {task.executedAt && ` | Executed: ${task.executedAt.toLocaleTimeString()}`}
                        </div>
                      </div>
                    </div>
                    <Badge variant={task.status === 'completed' ? 'default' : task.status === 'pending' ? 'secondary' : 'destructive'}>
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liquidity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {liquidityPools.map((pool) => (
              <Card key={pool.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pool.name}</CardTitle>
                    {getTierBadge(pool.tier)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Available Liquidity</span>
                      <span>${pool.availableLiquidity.toLocaleString()}</span>
                    </div>
                    <Progress 
                      value={(pool.availableLiquidity / pool.totalLiquidity) * 100} 
                      className="w-full" 
                    />
                    <div className="text-xs text-muted-foreground">
                      Total: ${pool.totalLiquidity.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Providers</div>
                    <div className="text-xs text-muted-foreground">
                      {pool.providers.join(', ')}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Typical Spreads</div>
                    <div className="space-y-1">
                        {Object.entries(pool.spreads).map(([symbol, spread]) => (
                          <div key={symbol} className="flex justify-between text-xs">
                            <span>{symbol}</span>
                            <span>{Number(spread)} pips</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Institutional Order Management</CardTitle>
              <CardDescription>
                Advanced execution algorithms and large order handling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {institutionalOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{order.type.toUpperCase()}</Badge>
                        <span className="font-medium">{order.symbol}</span>
                        <Badge variant={order.status === 'completed' ? 'default' : order.status === 'active' ? 'secondary' : 'destructive'}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Started: {order.startTime.toLocaleString()}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Size</div>
                        <div className="font-medium">{order.totalSize.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Executed</div>
                        <div className="font-medium">{order.executedSize.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Price</div>
                        <div className="font-medium">{order.averagePrice.toFixed(5)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Progress</div>
                        <Progress value={(order.executedSize / order.totalSize) * 100} className="w-full" />
                      </div>
                    </div>

                    {order.parameters && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Parameters: {JSON.stringify(order.parameters)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit" className="space-y-4">
          {marginRequirements && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${marginRequirements.totalRequired.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Posted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${marginRequirements.totalPosted.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Excess Margin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${marginRequirements.excess.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(marginRequirements.utilizationRatio * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Credit Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creditLimits.map((limit, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium">{limit.counterparty}</div>
                      <Badge variant="outline">{limit.rating}</Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Credit Limit</div>
                        <div className="font-medium">${limit.limit.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Used</div>
                        <div className="font-medium">${limit.used.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Available</div>
                        <div className="font-medium text-green-600">${limit.available.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Progress value={(limit.used / limit.limit) * 100} className="w-full" />
                      <div className="text-xs text-muted-foreground mt-1">
                        Last reviewed: {limit.lastReview.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Settlement Instructions
              </CardTitle>
              <CardDescription>
                Upcoming settlements and payment instructions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Settlement features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstitutionalDashboard;