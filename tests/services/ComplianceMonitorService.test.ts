import { ComplianceMonitorService } from '@/services/ComplianceMonitorService';
import { TestDataService } from '@/services/TestDataService';

describe('ComplianceMonitorService', () => {
  let service: ComplianceMonitorService;
  let testDataService: TestDataService;

  beforeEach(() => {
    service = ComplianceMonitorService.getInstance();
    testDataService = TestDataService.getInstance();
  });

  test('should be a singleton', () => {
    const instance1 = ComplianceMonitorService.getInstance();
    const instance2 = ComplianceMonitorService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should check MiFID II compliance with real strategy data', async () => {
    // Get real strategy data from Wing Zero
    const realStrategies = await testDataService.getRealStrategies();
    expect(realStrategies.length).toBeGreaterThan(0);

    const complianceData = testDataService.getComplianceTestData(realStrategies);
    
    // Test with real trade pattern
    const realTrade = complianceData.trades[0];
    const result = await service.checkMiFIDII(realTrade);

    expect(result).toHaveProperty('compliant');
    expect(result).toHaveProperty('violations');
    expect(result).toHaveProperty('recommendations');

    expect(typeof result.compliant).toBe('boolean');
    expect(Array.isArray(result.violations)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);

    // Should be compliant with real Wing Zero data
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('should check GDPR compliance with real user data', async () => {
    const realStrategies = await testDataService.getRealStrategies();
    const complianceData = testDataService.getComplianceTestData(realStrategies);
    
    const realUserConsent = complianceData.userConsents[0];
    const result = await service.checkGDPR(realUserConsent);

    expect(result).toHaveProperty('compliant');
    expect(result).toHaveProperty('violations');
    expect(result).toHaveProperty('dataProcessingLegal');

    expect(typeof result.compliant).toBe('boolean');
    expect(typeof result.dataProcessingLegal).toBe('boolean');
    expect(Array.isArray(result.violations)).toBe(true);

    // Real Wing Zero user should be GDPR compliant
    expect(result.compliant).toBe(true);
    expect(result.dataProcessingLegal).toBe(true);
  });

  test('should perform risk compliance check with real position data', async () => {
    const realPositions = await testDataService.getRealWingZeroPositions();
    expect(realPositions.length).toBeGreaterThan(0);

    // Use real position for risk compliance check
    const position = realPositions[0];
    const riskData = {
      userId: position.user_id || 'test-user',
      positionSize: position.volume,
      leverageRatio: position.volume / 10000, // Estimate leverage
      riskMetrics: {
        var95: Math.abs(position.unrealized_pnl) / position.volume,
        sharpeRatio: 1.5,
        maxDrawdown: 0.05
      }
    };

    const result = await service.checkRiskCompliance(riskData);

    expect(result).toHaveProperty('compliant');
    expect(result).toHaveProperty('riskLevel');
    expect(result).toHaveProperty('violations');
    expect(result).toHaveProperty('recommendations');

    expect(typeof result.compliant).toBe('boolean');
    expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    expect(Array.isArray(result.violations)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  test('should generate compliance report with real data', async () => {
    const realStrategies = await testDataService.getRealStrategies();
    const realPositions = await testDataService.getRealWingZeroPositions();
    
    const complianceData = testDataService.getComplianceTestData(realStrategies);
    
    const reportData = {
      trades: complianceData.trades,
      users: complianceData.userConsents,
      timeframe: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        end: new Date()
      },
      realDataSource: {
        strategiesCount: realStrategies.length,
        positionsCount: realPositions.length,
        dataTimestamp: new Date().toISOString()
      }
    };

    const report = await service.generateComplianceReport(reportData);

    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('mifidII');
    expect(report).toHaveProperty('gdpr');
    expect(report).toHaveProperty('riskCompliance');
    expect(report).toHaveProperty('recommendations');
    expect(report).toHaveProperty('timestamp');

    expect(typeof report.summary.overallCompliance).toBe('boolean');
    expect(typeof report.summary.totalChecks).toBe('number');
    expect(typeof report.summary.violations).toBe('number');

    // Verify real data integration
    expect(report.summary.totalChecks).toBeGreaterThan(0);
    expect(report.timestamp).toBeTruthy();
  });

  test('should monitor ongoing compliance with real Wing Zero activity', async () => {
    const realPositions = await testDataService.getRealWingZeroPositions();
    const realStrategies = await testDataService.getRealStrategies();

    if (realPositions.length > 0 && realStrategies.length > 0) {
      // Start monitoring based on real data patterns
      await service.startMonitoring({
        intervals: {
          trades: 1000, // 1 second for testing
          users: 2000,
          risk: 1500
        },
        thresholds: {
          riskLevel: 'high',
          violationCount: 5,
          alertsEnabled: true
        },
        realDataSources: {
          positions: realPositions.length,
          strategies: realStrategies.length
        }
      });

      // Verify monitoring is active
      const status = service.getMonitoringStatus();
      expect(status.active).toBe(true);
      expect(status.intervals).toBeTruthy();
      expect(status.thresholds).toBeTruthy();

      // Stop monitoring
      await service.stopMonitoring();
      
      const stoppedStatus = service.getMonitoringStatus();
      expect(stoppedStatus.active).toBe(false);
    }
  });
});