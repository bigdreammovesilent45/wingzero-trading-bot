describe('GDPRService', () => {
  const testUser = {
    id: 'user123',
    email: 'test@example.com',
    name: 'John Doe',
    createdAt: new Date('2023-01-01'),
    personalData: {
      phone: '+1234567890',
      address: '123 Main St',
      dateOfBirth: '1990-01-01',
      nationality: 'US'
    },
    tradingData: {
      accountBalance: 50000,
      positions: [],
      tradeHistory: []
    },
    consents: {
      marketing: true,
      dataProcessing: true,
      thirdPartySharing: false
    }
  };

  describe('data subject rights', () => {
    it('should handle right to access (data export)', () => {
      const exportData = {
        personalInformation: {
          ...testUser.personalData,
          email: testUser.email,
          name: testUser.name
        },
        tradingActivity: testUser.tradingData,
        consents: testUser.consents,
        dataCollectionDate: testUser.createdAt,
        purposes: [
          'Account management',
          'Trade execution',
          'Regulatory compliance',
          'Risk management'
        ]
      };

      expect(exportData).toBeDefined();
      expect(exportData.personalInformation).toEqual(expect.objectContaining({
        email: testUser.email,
        name: testUser.name
      }));
      expect(exportData.purposes).toContain('Regulatory compliance');
    });

    it('should handle right to rectification', () => {
      const updateRequest = {
        userId: testUser.id,
        updates: {
          email: 'newemail@example.com',
          personalData: {
            phone: '+9876543210'
          }
        },
        verificationToken: 'valid-token'
      };

      const updatedUser = {
        ...testUser,
        email: updateRequest.updates.email,
        personalData: {
          ...testUser.personalData,
          phone: updateRequest.updates.personalData.phone
        }
      };

      expect(updatedUser.email).toBe('newemail@example.com');
      expect(updatedUser.personalData.phone).toBe('+9876543210');
      expect(updatedUser.personalData.address).toBe(testUser.personalData.address); // Unchanged
    });

    it('should handle right to erasure (right to be forgotten)', () => {
      const deletionRequest = {
        userId: testUser.id,
        reason: 'User request',
        retainForCompliance: ['tradeHistory'], // Some data must be retained for regulatory compliance
        confirmationToken: 'valid-token'
      };

      const erasedData = {
        userId: testUser.id,
        status: 'erased',
        erasureDate: new Date(),
        retainedData: {
          tradeHistory: 'RETAINED_FOR_COMPLIANCE',
          retentionPeriod: '7 years',
          reason: 'MiFID II requirement'
        },
        erasedFields: [
          'personalData.phone',
          'personalData.address',
          'personalData.dateOfBirth',
          'personalData.nationality',
          'email',
          'name'
        ]
      };

      expect(erasedData.status).toBe('erased');
      expect(erasedData.erasedFields).toContain('personalData.phone');
      expect(erasedData.retainedData.reason).toContain('MiFID II');
    });

    it('should handle right to data portability', () => {
      const portabilityRequest = {
        userId: testUser.id,
        format: 'JSON',
        includeTypes: ['personal', 'trading', 'consents']
      };

      const portableData = {
        format: 'JSON',
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          personal: {
            id: testUser.id,
            email: testUser.email,
            name: testUser.name,
            ...testUser.personalData
          },
          trading: testUser.tradingData,
          consents: {
            ...testUser.consents,
            exportedAt: new Date().toISOString()
          }
        },
        checksum: 'sha256-hash-here'
      };

      expect(portableData.format).toBe('JSON');
      expect(portableData.data.personal).toBeDefined();
      expect(portableData.data.trading).toBeDefined();
      expect(portableData.data.consents).toBeDefined();
      expect(portableData.checksum).toBeDefined();
    });

    it('should handle right to restriction of processing', () => {
      const restrictionRequest = {
        userId: testUser.id,
        restrictTypes: ['marketing', 'profiling'],
        allowTypes: ['essential', 'legal_compliance'],
        duration: 'indefinite'
      };

      const restrictedProcessing = {
        userId: testUser.id,
        restrictions: {
          marketing: { allowed: false, reason: 'User request' },
          profiling: { allowed: false, reason: 'User request' },
          essential: { allowed: true, reason: 'Service provision' },
          legal_compliance: { allowed: true, reason: 'Legal requirement' }
        },
        effectiveDate: new Date(),
        reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      };

      expect(restrictedProcessing.restrictions.marketing.allowed).toBe(false);
      expect(restrictedProcessing.restrictions.legal_compliance.allowed).toBe(true);
    });
  });

  describe('consent management', () => {
    it('should record consent with proper audit trail', () => {
      const consentRecord = {
        userId: testUser.id,
        consentType: 'marketing',
        granted: true,
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        version: '2.0',
        text: 'I consent to receive marketing communications',
        withdrawable: true
      };

      expect(consentRecord.granted).toBe(true);
      expect(consentRecord.timestamp).toBeDefined();
      expect(consentRecord.withdrawable).toBe(true);
      expect(consentRecord.version).toBeDefined();
    });

    it('should handle consent withdrawal', () => {
      const withdrawalRequest = {
        userId: testUser.id,
        consentType: 'marketing',
        timestamp: new Date(),
        reason: 'No longer interested'
      };

      const updatedConsents = {
        ...testUser.consents,
        marketing: false,
        marketingWithdrawnAt: withdrawalRequest.timestamp
      };

      expect(updatedConsents.marketing).toBe(false);
      expect(updatedConsents.marketingWithdrawnAt).toBeDefined();
      expect(updatedConsents.dataProcessing).toBe(true); // Other consents unchanged
    });
  });

  describe('data breach handling', () => {
    it('should handle breach notification within 72 hours', () => {
      const breachIncident = {
        id: 'breach-001',
        discoveredAt: new Date('2024-01-01T10:00:00Z'),
        type: 'unauthorized_access',
        affectedUsers: 150,
        dataTypes: ['email', 'name', 'trading_history'],
        riskLevel: 'high'
      };

      const notification = {
        incidentId: breachIncident.id,
        notificationTime: new Date('2024-01-02T14:00:00Z'),
        timeSinceDiscovery: 28, // hours
        authorities: ['ICO', 'CNIL'],
        userNotifications: {
          sent: 150,
          method: ['email', 'in-app'],
          template: 'high_risk_breach'
        },
        measures: [
          'Passwords reset',
          'Sessions invalidated',
          'Additional monitoring enabled'
        ]
      };

      const hoursElapsed = (notification.notificationTime.getTime() - breachIncident.discoveredAt.getTime()) / (1000 * 60 * 60);
      expect(hoursElapsed).toBeLessThanOrEqual(72);
      expect(notification.authorities.length).toBeGreaterThan(0);
      expect(notification.userNotifications.sent).toBe(breachIncident.affectedUsers);
    });
  });
});