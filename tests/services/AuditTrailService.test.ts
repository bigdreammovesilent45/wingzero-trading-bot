import AuditTrailService from '../../src/services/AuditTrailService';

describe('AuditTrailService', () => {
  beforeEach(() => {
    // Clear logs before each test
    AuditTrailService.clear();
  });

  it('logs and retrieves audit events', () => {
    const entry = {
      event: 'LOGIN',
      userId: 'u1',
      timestamp: new Date().toISOString(),
      details: { ip: '127.0.0.1' }
    };
    AuditTrailService.log(entry);
    const logs = AuditTrailService.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].event).toBe('LOGIN');
    expect(logs[0].userId).toBe('u1');
    expect(logs[0].details.ip).toBe('127.0.0.1');
  });

  it('returns empty array if no logs', () => {
    expect(AuditTrailService.getLogs()).toEqual([]);
  });
});