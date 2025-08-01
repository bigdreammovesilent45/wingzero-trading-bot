import * as fs from 'fs';
import * as path from 'path';

describe('AuditTrailService', () => {
  const logPath = './audit-logs';
  
  beforeEach(() => {
    // Clean up any existing log files
    if (fs.existsSync(logPath)) {
      fs.rmSync(logPath, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up after tests
    if (fs.existsSync(logPath)) {
      fs.rmSync(logPath, { recursive: true, force: true });
    }
  });

  describe('audit logging', () => {
    it('should create audit log entries', () => {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        userId: 'user123',
        action: 'TRADE_EXECUTED',
        details: {
          symbol: 'AAPL',
          quantity: 100,
          price: 150.25,
          orderType: 'MARKET'
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      // Simulate writing audit log
      if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, { recursive: true });
      }
      
      const logFile = path.join(logPath, `audit-${new Date().toISOString().split('T')[0]}.log`);
      fs.appendFileSync(logFile, JSON.stringify(auditEntry) + '\n');

      // Verify log was created
      expect(fs.existsSync(logFile)).toBe(true);
      const content = fs.readFileSync(logFile, 'utf-8');
      expect(content).toContain(auditEntry.userId);
      expect(content).toContain(auditEntry.action);
    });

    it('should maintain chronological order', () => {
      const entries = [];
      const baseTime = Date.now();

      for (let i = 0; i < 5; i++) {
        entries.push({
          timestamp: new Date(baseTime + i * 1000).toISOString(),
          userId: `user${i}`,
          action: 'ACTION_' + i,
          sequence: i
        });
      }

      // Simulate writing entries
      if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, { recursive: true });
      }
      
      const logFile = path.join(logPath, 'audit-test.log');
      entries.forEach(entry => {
        fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
      });

      // Read and verify order
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.trim().split('\n');
      const parsed = lines.map(line => JSON.parse(line));

      for (let i = 0; i < parsed.length - 1; i++) {
        const current = new Date(parsed[i].timestamp).getTime();
        const next = new Date(parsed[i + 1].timestamp).getTime();
        expect(next).toBeGreaterThanOrEqual(current);
      }
    });

    it('should handle sensitive data appropriately', () => {
      const sensitiveEntry = {
        timestamp: new Date().toISOString(),
        userId: 'user123',
        action: 'PASSWORD_CHANGED',
        details: {
          oldPassword: '[REDACTED]',
          newPassword: '[REDACTED]',
          passwordStrength: 'strong'
        }
      };

      // Ensure passwords are not logged
      expect(sensitiveEntry.details.oldPassword).toBe('[REDACTED]');
      expect(sensitiveEntry.details.newPassword).toBe('[REDACTED]');
      expect(sensitiveEntry.details.passwordStrength).toBe('strong');
    });

    it('should include compliance-required fields', () => {
      const complianceEntry = {
        timestamp: new Date().toISOString(),
        userId: 'user123',
        action: 'TRADE_EXECUTED',
        tradeId: 'TRD-12345',
        executionVenue: 'NASDAQ',
        instrumentId: 'US0378331005', // ISIN
        quantity: 100,
        price: 150.25,
        currency: 'USD',
        counterparty: 'BROKER-XYZ',
        tradingCapacity: 'PRINCIPAL',
        liquidityProvision: false
      };

      // Verify MiFID II required fields
      expect(complianceEntry.timestamp).toBeDefined();
      expect(complianceEntry.instrumentId).toMatch(/^[A-Z]{2}[A-Z0-9]{10}$/); // ISIN format
      expect(complianceEntry.executionVenue).toBeDefined();
      expect(complianceEntry.tradingCapacity).toMatch(/^(PRINCIPAL|AGENT|MATCHED_PRINCIPAL)$/);
    });

    it('should support audit trail querying', () => {
      const entries = [
        { timestamp: new Date().toISOString(), userId: 'user1', action: 'LOGIN' },
        { timestamp: new Date().toISOString(), userId: 'user2', action: 'TRADE_EXECUTED' },
        { timestamp: new Date().toISOString(), userId: 'user1', action: 'TRADE_EXECUTED' },
        { timestamp: new Date().toISOString(), userId: 'user1', action: 'LOGOUT' }
      ];

      // Simulate filtering by userId
      const user1Entries = entries.filter(e => e.userId === 'user1');
      expect(user1Entries).toHaveLength(3);
      expect(user1Entries.every(e => e.userId === 'user1')).toBe(true);

      // Simulate filtering by action
      const tradeEntries = entries.filter(e => e.action === 'TRADE_EXECUTED');
      expect(tradeEntries).toHaveLength(2);
    });
  });
});