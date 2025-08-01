import { ComplianceService } from '../../src/services/ComplianceService';

describe('ComplianceService', () => {
  describe('MiFID II Compliance', () => {
    it('should pass MiFID II compliance with all requirements met', async () => {
      const compliantData = {
        bestExecutionPolicy: true,
        transactionReporting: { enabled: true },
        preTradeTranparency: true,
        postTradeTranparency: true,
        recordKeeping: { retentionPeriod: 5 }
      };

      const result = await ComplianceService.checkMiFIDII(compliantData);
      
      expect(result.compliant).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should fail MiFID II compliance with missing requirements', async () => {
      const nonCompliantData = {
        bestExecutionPolicy: false,
        transactionReporting: { enabled: false },
        preTradeTranparency: false,
        postTradeTranparency: true,
        recordKeeping: { retentionPeriod: 3 }
      };

      const result = await ComplianceService.checkMiFIDII(nonCompliantData);
      
      expect(result.compliant).toBe(false);
      expect(result.issues).toContain('Missing best execution policy');
      expect(result.issues).toContain('Transaction reporting not enabled');
      expect(result.issues).toContain('Pre-trade transparency requirements not met');
      expect(result.issues).toContain('Record keeping must be at least 5 years');
    });

    it('should check individual MiFID II requirements', async () => {
      const partialData = {
        bestExecutionPolicy: true,
        transactionReporting: { enabled: true }
        // Missing other requirements
      };

      const result = await ComplianceService.checkMiFIDII(partialData);
      
      expect(result.compliant).toBe(false);
      expect(result.issues).toContain('Pre-trade transparency requirements not met');
      expect(result.issues).toContain('Post-trade transparency requirements not met');
    });
  });

  describe('GDPR Compliance', () => {
    it('should pass GDPR compliance with all requirements met', async () => {
      const compliantData = {
        privacyPolicy: true,
        consentManagement: { enabled: true },
        dataSubjectRights: true,
        dataPortability: true,
        rightToErasure: true,
        breachNotification: { timeframe: 72 }
      };

      const result = await ComplianceService.checkGDPR(compliantData);
      
      expect(result.compliant).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should fail GDPR compliance with missing requirements', async () => {
      const nonCompliantData = {
        privacyPolicy: false,
        consentManagement: { enabled: false },
        dataSubjectRights: false,
        dataPortability: true,
        rightToErasure: false,
        breachNotification: { timeframe: 96 }
      };

      const result = await ComplianceService.checkGDPR(nonCompliantData);
      
      expect(result.compliant).toBe(false);
      expect(result.issues).toContain('Missing privacy policy');
      expect(result.issues).toContain('Consent management not implemented');
      expect(result.issues).toContain('Data subject rights not implemented');
      expect(result.issues).toContain('Right to erasure (right to be forgotten) not implemented');
      expect(result.issues).toContain('Data breach notification must be within 72 hours');
    });

    it('should validate breach notification timeframe', async () => {
      const dataWith73Hours = {
        privacyPolicy: true,
        consentManagement: { enabled: true },
        dataSubjectRights: true,
        dataPortability: true,
        rightToErasure: true,
        breachNotification: { timeframe: 73 } // Just over limit
      };

      const result = await ComplianceService.checkGDPR(dataWith73Hours);
      
      expect(result.compliant).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toBe('Data breach notification must be within 72 hours');
    });
  });

  describe('ComplianceService instance', () => {
    it('should be a singleton', () => {
      const instance1 = ComplianceService.getInstance();
      const instance2 = ComplianceService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});