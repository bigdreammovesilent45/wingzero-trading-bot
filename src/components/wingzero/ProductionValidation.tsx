import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { BrokerValidationService, BrokerTestSuite } from '@/services/BrokerValidationService';
import { LoadingSpinner, ProgressIndicator } from '@/components/ui/loading-enhanced';
import { CheckCircle, XCircle, AlertTriangle, Play, Zap } from 'lucide-react';

interface ProductionValidationProps {
  isConnected?: boolean;
}

const ProductionValidation: React.FC<ProductionValidationProps> = ({ isConnected = false }) => {
  const { toast } = useToast();
  const [validationService] = useState(() => new BrokerValidationService());
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<BrokerTestSuite | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');

  useEffect(() => {
    validationService.initialize();
  }, [validationService]);

  const runValidationSuite = async () => {
    if (!isConnected) {
      toast({
        title: "Connection Required",
        description: "Please connect to a trading platform first",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setTestResults(null);

    try {
      const tests = [
        'Connection Test',
        'Authentication Test',
        'Market Data Test',
        'Order Execution Test',
        'Position Management Test',
        'Risk Management Test',
        'Latency Test',
        'Failover Test'
      ];

      // Simulate test progress
      for (let i = 0; i < tests.length; i++) {
        setCurrentTest(tests[i]);
        setProgress(((i + 1) / tests.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const results = await validationService.runFullValidationSuite('oanda');
      setTestResults(results);

      const passedTests = Object.values(results).filter(Boolean).length;
      const totalTests = Object.keys(results).length;

      toast({
        title: "🧪 Validation Complete",
        description: `${passedTests}/${totalTests} tests passed`,
        variant: passedTests === totalTests ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Validation suite error:', error);
      toast({
        title: "Validation Error",
        description: "Failed to complete validation suite",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setProgress(0);
      setCurrentTest('');
    }
  };

  const getTestIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getOverallStatus = () => {
    if (!testResults) return null;
    
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    if (passedTests === totalTests) {
      return { status: 'excellent', color: 'default', text: 'Production Ready' };
    } else if (passedTests >= totalTests * 0.8) {
      return { status: 'good', color: 'secondary', text: 'Minor Issues' };
    } else {
      return { status: 'poor', color: 'destructive', text: 'Needs Attention' };
    }
  };

  const testDescriptions = {
    connectionTest: 'Broker server connectivity and stability',
    authenticationTest: 'API authentication and token management',
    marketDataTest: 'Real-time market data feed reliability',
    orderExecutionTest: 'Order placement, modification, and cancellation',
    positionManagementTest: 'Position tracking and management accuracy',
    riskManagementTest: 'Risk calculation and validation systems',
    latencyTest: 'API response time and performance',
    failoverTest: 'Connection resilience and failover mechanisms'
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[#00AEEF]" />
          Production Validation Suite
        </CardTitle>
        <CardDescription>
          Comprehensive testing for production-ready broker integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="text-center p-6 bg-muted rounded-lg">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-muted-foreground">Connect to a trading platform to run validation tests</p>
          </div>
        ) : (
          <>
            {/* Test Control */}
            <div className="flex items-center justify-between">
              <Button
                onClick={runValidationSuite}
                disabled={isRunning}
                size="lg"
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunning ? 'Running Tests...' : 'Run Validation Suite'}
              </Button>
              
              {testResults && (
                <Badge variant={getOverallStatus()?.color as any}>
                  {getOverallStatus()?.text}
                </Badge>
              )}
            </div>

            {/* Progress Indicator */}
            {isRunning && (
              <div className="space-y-3">
                <ProgressIndicator
                  value={progress}
                  showValue={true}
                  className="w-full"
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoadingSpinner size="sm" variant="dots" />
                  Running: {currentTest}
                </div>
              </div>
            )}

            {/* Test Results */}
            {testResults && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(testResults).map(([testKey, passed]) => {
                    const testName = testKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    const description = testDescriptions[testKey as keyof typeof testDescriptions];
                    
                    return (
                      <Card key={testKey} className="p-4 hover-scale">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getTestIcon(passed)}
                              <span className="font-medium">{testName}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{description}</p>
                          </div>
                          <Badge variant={passed ? 'default' : 'destructive'}>
                            {passed ? 'Pass' : 'Fail'}
                          </Badge>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Overall Score */}
                <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Overall Score</h4>
                      <p className="text-sm text-muted-foreground">
                        {Object.values(testResults).filter(Boolean).length} of {Object.keys(testResults).length} tests passed
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round((Object.values(testResults).filter(Boolean).length / Object.keys(testResults).length) * 100)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Validation Status */}
            <Card className="p-4 border-dashed">
              <h4 className="font-semibold mb-2">Production Readiness Checklist</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Broker connection stability test</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Authentication and security validation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Real-time data feed verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Order execution performance test</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Risk management system validation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Latency and performance benchmarks</span>
                </div>
              </div>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductionValidation;