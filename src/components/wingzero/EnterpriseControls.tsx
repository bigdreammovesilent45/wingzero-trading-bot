import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { EnterpriseFeatures } from '@/services/EnterpriseFeatures';
import { ProductionHardening } from '@/services/ProductionHardening';
import { AdvancedMLEngine } from '@/services/AdvancedMLEngine';
import { Save, Settings, RefreshCw } from 'lucide-react';
import SettingsSaveManager from './SettingsSaveManager';

interface EnterpriseControlsProps {
  isConnected?: boolean;
}

const EnterpriseControls: React.FC<EnterpriseControlsProps> = ({ isConnected = false }) => {
  const { toast } = useToast();
  const [enterpriseFeatures] = useState(() => new EnterpriseFeatures());
  const [productionHardening] = useState(() => new ProductionHardening());
  const [mlEngine] = useState(() => new AdvancedMLEngine());
  
  const [isInitialized, setIsInitialized] = useLocalStorage('enterprise-initialized', false);
  const [enterpriseSettings, setEnterpriseSettings] = useLocalStorage('enterprise-settings', {
    autoEvolution: true,
    statsRefreshInterval: 10000,
    healthMonitoring: true
  });
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [evolutionStats, setEvolutionStats] = useState<any>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (isConnected && !isInitialized) {
      initializeEnterpriseSystems();
    }
  }, [isConnected, isInitialized]);

  const initializeEnterpriseSystems = async () => {
    try {
      console.log('🚀 Initializing Wing Zero Enterprise Systems...');
      
      await Promise.all([
        enterpriseFeatures.initialize(),
        productionHardening.initialize(),
        mlEngine.initialize()
      ]);
      
      setIsInitialized(true);
      
      setIsInitialized(true);
      setLastSaved(new Date());
      
      toast({
        title: "🎯 Enterprise Systems Online",
        description: "Advanced ML, Production Hardening, and Enterprise Features activated",
      });

      // Update stats every 10 seconds
      const statsInterval = setInterval(async () => {
        if (isInitialized) {
          try {
            const health = await productionHardening.getSystemHealth();
            const evolution = mlEngine.getEvolutionStats();
            setSystemHealth(health);
            setEvolutionStats(evolution);
          } catch (error) {
            console.error('Error updating stats:', error);
          }
        }
      }, 10000);

      return () => clearInterval(statsInterval);
      
    } catch (error) {
      console.error('Enterprise initialization error:', error);
      toast({
        title: "Enterprise Initialization Error",
        description: "Some enterprise features may not be available",
        variant: "destructive",
      });
    }
  };

  const saveEnterpriseSettings = async () => {
    try {
      // Settings are automatically saved via useLocalStorage
      setLastSaved(new Date());
      toast({
        title: "Enterprise Settings Saved",
        description: "All enterprise configuration has been saved",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save enterprise settings",
        variant: "destructive"
      });
    }
  };

  const createMultiAccountSetup = async () => {
    try {
      const setupId = await enterpriseFeatures.createMultiAccountSetup({
        name: 'Wing Zero Multi-Account Portfolio',
        accounts: [
          {
            id: 'acc1',
            name: 'Primary OANDA',
            broker: 'OANDA',
            balance: 50000,
            equity: 49500,
            currency: 'USD',
            leverage: 50,
            environment: 'live',
            credentials: {}
          },
          {
            id: 'acc2', 
            name: 'Secondary Demo',
            broker: 'OANDA',
            balance: 10000,
            equity: 10200,
            currency: 'USD',
            leverage: 30,
            environment: 'demo',
            credentials: {}
          }
        ],
        strategy: 'portfolio_rebalancing',
        allocation: { acc1: 0.8, acc2: 0.2 },
        riskDistribution: 'risk_weighted'
      });

      toast({
        title: "🏦 Multi-Account Setup Created",
        description: `Portfolio ID: ${setupId}`,
      });
    } catch (error) {
      console.error('Multi-account setup error:', error);
      toast({
        title: "Setup Error",
        description: "Failed to create multi-account portfolio",
        variant: "destructive",
      });
    }
  };

  const createAdvancedStrategy = async () => {
    try {
      const strategyId = await enterpriseFeatures.createPortfolioRebalancingStrategy({
        name: 'Wing Zero Adaptive Portfolio',
        targetWeights: {
          'EURUSD': 0.3,
          'GBPUSD': 0.25,
          'USDJPY': 0.2,
          'AUDUSD': 0.15,
          'USDCHF': 0.1
        },
        rebalanceFrequency: 'daily',
        threshold: 0.05,
        constraints: {
          maxSinglePosition: 0.4,
          minDiversification: 0.8
        }
      });

      toast({
        title: "📈 Advanced Strategy Created",
        description: `Strategy ID: ${strategyId}`,
      });
    } catch (error) {
      console.error('Strategy creation error:', error);
      toast({
        title: "Strategy Error",
        description: "Failed to create advanced strategy",
        variant: "destructive",
      });
    }
  };

  const runMLEvolution = async () => {
    try {
      await mlEngine.evolveModels();
      const stats = mlEngine.getEvolutionStats();
      setEvolutionStats(stats);
      
      toast({
        title: "🧬 AI Evolution Complete",
        description: `Cycle ${stats.cycle}: ${stats.models} models evolved for maximum win rate`,
      });
    } catch (error) {
      console.error('ML evolution error:', error);
      toast({
        title: "Evolution Error",
        description: "Failed to evolve AI models",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                🏢 Wing Zero Enterprise Suite
                {isInitialized && <Badge variant="default">ACTIVE</Badge>}
              </CardTitle>
              <CardDescription>
                Advanced ML Engine, Production Hardening, and Enterprise Features
                {lastSaved && (
                  <span className="block text-xs mt-1">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button 
              onClick={saveEnterpriseSettings}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground">Connect to a trading platform to access enterprise features</p>
            </div>
          ) : !isInitialized ? (
            <Button 
              onClick={initializeEnterpriseSystems}
              className="w-full"
              size="lg"
            >
              🚀 Initialize Enterprise Systems
            </Button>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* System Health */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  {systemHealth ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Status</span>
                        <Badge variant={
                          systemHealth.status === 'healthy' ? 'default' : 
                          systemHealth.status === 'warning' ? 'secondary' : 'destructive'
                        }>
                          {systemHealth.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Memory</span>
                        <span>{(systemHealth.memoryUsage * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Error Rate</span>
                        <span>{(systemHealth.errorRate * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  )}
                </CardContent>
              </Card>

              {/* AI Evolution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">AI Evolution</CardTitle>
                </CardHeader>
                <CardContent>
                  {evolutionStats ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Cycle</span>
                        <Badge variant="outline">{evolutionStats.cycle}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Models</span>
                        <span>{evolutionStats.models}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Accuracy</span>
                        <span>{(evolutionStats.avgAccuracy * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Initializing...</p>
                  )}
                </CardContent>
              </Card>

              {/* Enterprise Actions */}
              <div className="md:col-span-2 space-y-3">
                <Button 
                  onClick={createMultiAccountSetup}
                  className="w-full"
                  variant="outline"
                >
                  🏦 Create Multi-Account Portfolio
                </Button>
                <Button 
                  onClick={createAdvancedStrategy}
                  className="w-full"
                  variant="outline"
                >
                  📈 Create Advanced Strategy
                </Button>
                <Button 
                  onClick={runMLEvolution}
                  className="w-full"
                  variant="outline"
                >
                  🧬 Evolve AI Models
                </Button>
              </div>
            </div>
          )}
          
          {/* Settings Save Manager */}
          {isInitialized && (
            <SettingsSaveManager
              panelName="Enterprise Controls"
              settings={enterpriseSettings}
              onSave={saveEnterpriseSettings}
              autoSave={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnterpriseControls;