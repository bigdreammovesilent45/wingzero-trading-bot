import { AuditTrailService } from '@/services/AuditTrailService';
import { TestDataService } from '@/services/TestDataService';

describe('AuditTrailService', () => {
  let auditService: AuditTrailService;
  let testDataService: TestDataService;

  beforeEach(() => {
    auditService = AuditTrailService.getInstance();
    testDataService = TestDataService.getInstance();
  });

  test('should be a singleton', () => {
    const instance1 = AuditTrailService.getInstance();
    const instance2 = AuditTrailService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should log events based on real Wing Zero security events', async () => {
    // Get real security events from database
    const realEvents = await testDataService.getRealSecurityEvents();
    expect(realEvents.length).toBeGreaterThan(0);

    // Test logging based on real event patterns
    const realEvent = realEvents[0];
    const eventId = await auditService.logEvent(
      realEvent.user_id,
      realEvent.event_type,
      'wingzero_system',
      {
        originalEventId: realEvent.id,
        realData: true,
        testContext: 'security_audit'
      },
      {
        ip: realEvent.ip_address || 'unknown',
        userAgent: realEvent.user_agent || 'test-agent'
      }
    );

    expect(typeof eventId).toBe('string');
    expect(eventId.length).toBeGreaterThan(0);

    // Verify the event was logged
    const loggedEvent = await auditService.getEvent(eventId);
    expect(loggedEvent).toBeTruthy();
    expect(loggedEvent?.userId).toBe(realEvent.user_id);
    expect(loggedEvent?.action).toBe(realEvent.event_type);
  });

  test('should query events with real data patterns', async () => {
    const realEvents = await testDataService.getRealSecurityEvents();
    
    if (realEvents.length > 0) {
      const realEvent = realEvents[0];
      
      // Log a test event based on real data
      await auditService.logEvent(
        realEvent.user_id,
        'REAL_DATA_TEST',
        'audit_test',
        { realEventPattern: true, sourceEventId: realEvent.id }
      );

      // Query events
      const events = await auditService.queryEvents({
        userId: realEvent.user_id,
        action: 'REAL_DATA_TEST',
        limit: 10
      });

      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThanOrEqual(1);
      
      const testEvent = events.find(e => e.action === 'REAL_DATA_TEST');
      expect(testEvent).toBeTruthy();
      expect(testEvent?.details?.realEventPattern).toBe(true);
    }
  });

  test('should generate metrics from real audit patterns', async () => {
    const realEvents = await testDataService.getRealSecurityEvents();
    
    // Log events based on real patterns
    for (const realEvent of realEvents.slice(0, 3)) {
      await auditService.logEvent(
        realEvent.user_id,
        `REAL_${realEvent.event_type}`,
        'metrics_test',
        {
          originalSuccess: realEvent.success,
          realEventId: realEvent.id,
          eventType: realEvent.event_type
        }
      );
    }

    const metrics = await auditService.getMetrics();

    expect(metrics).toHaveProperty('totalEvents');
    expect(metrics).toHaveProperty('criticalEvents');
    expect(metrics).toHaveProperty('topActions');
    expect(metrics).toHaveProperty('securityAlerts');

    expect(typeof metrics.totalEvents).toBe('number');
    expect(typeof metrics.criticalEvents).toBe('number');
    expect(Array.isArray(metrics.topActions)).toBe(true);
    expect(Array.isArray(metrics.securityAlerts)).toBe(true);
  });

  test('should export events in multiple formats', async () => {
    const realEvents = await testDataService.getRealSecurityEvents();
    
    if (realEvents.length > 0) {
      // Log a few test events
      for (let i = 0; i < 2; i++) {
        await auditService.logEvent(
          realEvents[0].user_id,
          `EXPORT_TEST_${i}`,
          'export_test',
          { exportTest: true, index: i }
        );
      }

      // Test JSON export
      const jsonExport = await auditService.exportEvents(
        { action: 'EXPORT_TEST_0' },
        'json'
      );
      expect(typeof jsonExport).toBe('string');
      
      const parsedJson = JSON.parse(jsonExport);
      expect(Array.isArray(parsedJson)).toBe(true);

      // Test CSV export
      const csvExport = await auditService.exportEvents(
        { action: 'EXPORT_TEST_1' },
        'csv'
      );
      expect(typeof csvExport).toBe('string');
      expect(csvExport).toContain('eventId,userId,action');
    }
  });

  test('should clear old events', async () => {
    const realEvents = await testDataService.getRealSecurityEvents();
    
    if (realEvents.length > 0) {
      // Log a test event
      await auditService.logEvent(
        realEvents[0].user_id,
        'CLEAR_TEST',
        'clear_test',
        { clearTest: true }
      );

      // Clear events older than now (should clear the test event)
      const cleared = await auditService.clearEvents(new Date());
      expect(typeof cleared).toBe('number');
    }
  });
});