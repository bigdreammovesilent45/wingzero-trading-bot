import { AntifraudDetectionService } from '@/services/AntifraudDetectionService';
import { TestDataService } from '@/services/TestDataService';

describe('AntifraudDetectionService', () => {
  let fraudService: AntifraudDetectionService;
  let testDataService: TestDataService;

  beforeEach(() => {
    fraudService = AntifraudDetectionService.getInstance();
    testDataService = TestDataService.getInstance();
  });

  test('should be a singleton', () => {
    const instance1 = AntifraudDetectionService.getInstance();
    const instance2 = AntifraudDetectionService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should analyze real Wing Zero trading patterns', async () => {
    // Get real position data
    const realPositions = await testDataService.getRealWingZeroPositions();
    expect(realPositions.length).toBeGreaterThan(0);

    const position = realPositions[0];
    const tradeData = {
      userId: position.user_id || 'test-user',
      symbol: position.symbol,
      volume: position.volume,
      price: position.open_price,
      timestamp: new Date(position.opened_at),
      type: position.position_type,
      metadata: {
        realTradeId: position.id,
        strategy: position.strategy,
        unrealizedPnl: position.unrealized_pnl
      }
    };

    const analysis = await fraudService.analyzeTrade(tradeData);

    expect(analysis).toHaveProperty('riskScore');
    expect(analysis).toHaveProperty('flags');
    expect(analysis).toHaveProperty('recommendations');
    expect(analysis).toHaveProperty('patterns');

    expect(typeof analysis.riskScore).toBe('number');
    expect(analysis.riskScore).toBeGreaterThanOrEqual(0);
    expect(analysis.riskScore).toBeLessThanOrEqual(100);
    expect(Array.isArray(analysis.flags)).toBe(true);
    expect(Array.isArray(analysis.recommendations)).toBe(true);

    // Real Wing Zero trades should have low risk scores
    expect(analysis.riskScore).toBeLessThan(50);
  });

  test('should detect behavioral patterns from real user activity', async () => {
    const realEvents = await testDataService.getRealSecurityEvents();
    const realPositions = await testDataService.getRealWingZeroPositions();

    if (realEvents.length > 0 && realPositions.length > 0) {
      const userId = realEvents[0].user_id;
      
      // Create behavioral data from real activity
      const behaviorData = {
        userId,
        loginPatterns: realEvents.map(e => ({
          timestamp: new Date(e.created_at),
          ipAddress: e.ip_address || '127.0.0.1',
          userAgent: e.user_agent || 'Wing Zero Client',
          success: e.success
        })),
        tradingPatterns: realPositions.map(p => ({
          timestamp: new Date(p.opened_at),
          symbol: p.symbol,
          volume: p.volume,
          type: p.position_type,
          pnl: p.unrealized_pnl
        })),
        metadata: {
          realDataAnalysis: true,
          eventsCount: realEvents.length,
          positionsCount: realPositions.length
        }
      };

      const analysis = await fraudService.analyzeUserBehavior(behaviorData);

      expect(analysis).toHaveProperty('anomalyScore');
      expect(analysis).toHaveProperty('patterns');
      expect(analysis).toHaveProperty('alerts');
      expect(analysis).toHaveProperty('recommendations');

      expect(typeof analysis.anomalyScore).toBe('number');
      expect(analysis.anomalyScore).toBeGreaterThanOrEqual(0);
      expect(analysis.anomalyScore).toBeLessThanOrEqual(100);

      // Real user behavior should show normal patterns
      expect(analysis.anomalyScore).toBeLessThan(30);
    }
  });

  test('should validate account activity with real Wing Zero data', async () => {
    const realPositions = await testDataService.getRealWingZeroPositions();
    const realEvents = await testDataService.getRealSecurityEvents();

    if (realPositions.length > 0) {
      const accountData = {
        userId: realPositions[0].user_id || 'test-user',
        accountBalance: 10000,
        recentTrades: realPositions.slice(0, 5).map(p => ({
          id: p.id,
          symbol: p.symbol,
          volume: p.volume,
          price: p.open_price,
          timestamp: new Date(p.opened_at),
          type: p.position_type,
          pnl: p.unrealized_pnl
        })),
        securityEvents: realEvents.slice(0, 3).map(e => ({
          type: e.event_type,
          timestamp: new Date(e.created_at),
          success: e.success,
          metadata: e.metadata
        })),
        verification: {
          emailVerified: true,
          phoneVerified: true,
          documentsVerified: true,
          mfaEnabled: false
        }
      };

      const validation = await fraudService.validateAccount(accountData);

      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('confidence');
      expect(validation).toHaveProperty('issues');
      expect(validation).toHaveProperty('recommendations');

      expect(typeof validation.isValid).toBe('boolean');
      expect(typeof validation.confidence).toBe('number');
      expect(validation.confidence).toBeGreaterThanOrEqual(0);
      expect(validation.confidence).toBeLessThanOrEqual(100);

      // Real Wing Zero account should be valid
      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBeGreaterThan(70);
    }
  });

  test('should monitor real-time fraud detection', async () => {
    const realPositions = await testDataService.getRealWingZeroPositions();

    if (realPositions.length > 0) {
      const monitoringConfig = {
        userId: realPositions[0].user_id || 'test-user',
        rules: [
          {
            name: 'volume_threshold',
            threshold: 1000,
            timeWindow: 3600000, // 1 hour
            action: 'alert'
          },
          {
            name: 'unusual_timing',
            threshold: 0.8,
            timeWindow: 86400000, // 24 hours
            action: 'flag'
          }
        ],
        realDataContext: {
          baselineFromPositions: realPositions.length,
          averageVolume: realPositions.reduce((sum, p) => sum + p.volume, 0) / realPositions.length
        }
      };

      const monitoring = await fraudService.startRealTimeMonitoring(monitoringConfig);

      expect(monitoring).toHaveProperty('monitoringId');
      expect(monitoring).toHaveProperty('active');
      expect(monitoring).toHaveProperty('rules');

      expect(typeof monitoring.monitoringId).toBe('string');
      expect(monitoring.active).toBe(true);
      expect(Array.isArray(monitoring.rules)).toBe(true);

      // Stop monitoring
      const stopResult = await fraudService.stopRealTimeMonitoring(monitoring.monitoringId);
      expect(stopResult.success).toBe(true);
    }
  });

  test('should generate fraud reports with real data insights', async () => {
    const realPositions = await testDataService.getRealWingZeroPositions();
    const realEvents = await testDataService.getRealSecurityEvents();

    const reportData = {
      timeframe: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        end: new Date()
      },
      scope: {
        includeUsers: true,
        includeTrades: true,
        includePatterns: true
      },
      realDataSources: {
        positions: realPositions.length,
        securityEvents: realEvents.length,
        analysisTimestamp: new Date().toISOString()
      }
    };

    const report = await fraudService.generateFraudReport(reportData);

    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('detectedFraud');
    expect(report).toHaveProperty('patterns');
    expect(report).toHaveProperty('recommendations');
    expect(report).toHaveProperty('timestamp');

    expect(typeof report.summary.totalAnalyzed).toBe('number');
    expect(typeof report.summary.fraudDetected).toBe('number');
    expect(typeof report.summary.falsePositives).toBe('number');
    expect(Array.isArray(report.detectedFraud)).toBe(true);
    expect(Array.isArray(report.patterns)).toBe(true);

    // With real Wing Zero data, fraud should be minimal
    expect(report.summary.fraudDetected).toBe(0);
    expect(report.detectedFraud.length).toBe(0);
  });
});