import { MultiFactorAuthService } from '@/services/MultiFactorAuthService';
import { TestDataService } from '@/services/TestDataService';

describe('MultiFactorAuthService', () => {
  let mfaService: MultiFactorAuthService;
  let testDataService: TestDataService;

  beforeEach(() => {
    mfaService = MultiFactorAuthService.getInstance();
    testDataService = TestDataService.getInstance();
  });

  test('should be a singleton', () => {
    const instance1 = MultiFactorAuthService.getInstance();
    const instance2 = MultiFactorAuthService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should setup MFA with real Wing Zero user data', async () => {
    // Get real security events to get actual user ID
    const realEvents = await testDataService.getRealSecurityEvents();
    expect(realEvents.length).toBeGreaterThan(0);

    const realUserId = realEvents[0].user_id;
    const realKeys = testDataService.generateRealEncryptionKeys();

    // Setup MFA for real user
    const result = await mfaService.setupMFA(realUserId, {
      method: 'totp',
      deviceName: 'Wing Zero Test Device',
      encryptionKey: realKeys.mfaSecret
    });

    expect(result).toHaveProperty('secret');
    expect(result).toHaveProperty('qrCode');
    expect(result).toHaveProperty('backupCodes');

    expect(typeof result.secret).toBe('string');
    expect(typeof result.qrCode).toBe('string');
    expect(Array.isArray(result.backupCodes)).toBe(true);
    expect(result.backupCodes.length).toBe(10);

    // QR code should contain real user ID
    expect(result.qrCode).toContain(realUserId);
  });

  test('should verify TOTP tokens with real patterns', async () => {
    const realEvents = await testDataService.getRealSecurityEvents();
    const realUserId = realEvents[0]?.user_id || 'test-user';
    const realKeys = testDataService.generateRealEncryptionKeys();

    // Setup MFA first
    const setupResult = await mfaService.setupMFA(realUserId, {
      method: 'totp',
      deviceName: 'Test Device',
      encryptionKey: realKeys.mfaSecret
    });

    // Generate a token using the secret
    const token = await mfaService.generateTOTP(setupResult.secret);
    expect(typeof token).toBe('string');
    expect(token.length).toBe(6);
    expect(/^\d{6}$/.test(token)).toBe(true);

    // Verify the token
    const isValid = await mfaService.verifyTOTP(realUserId, token);
    expect(isValid).toBe(true);

    // Verify invalid token
    const isInvalid = await mfaService.verifyTOTP(realUserId, '000000');
    expect(isInvalid).toBe(false);
  });

  test('should handle backup codes with real user scenarios', async () => {
    const realEvents = await testDataService.getRealSecurityEvents();
    const realUserId = realEvents[0]?.user_id || 'test-user';

    // Setup MFA
    const setupResult = await mfaService.setupMFA(realUserId, {
      method: 'totp',
      deviceName: 'Wing Zero Main'
    });

    const backupCode = setupResult.backupCodes[0];

    // Use backup code
    const isValidBackup = await mfaService.verifyBackupCode(realUserId, backupCode);
    expect(isValidBackup).toBe(true);

    // Backup code should only work once
    const isValidSecondUse = await mfaService.verifyBackupCode(realUserId, backupCode);
    expect(isValidSecondUse).toBe(false);
  });

  test('should manage MFA status for real Wing Zero users', async () => {
    const realEvents = await testDataService.getRealSecurityEvents();
    const realUserId = realEvents[0]?.user_id || 'test-user';

    // Initially MFA should not be enabled
    const initialStatus = await mfaService.getMFAStatus(realUserId);
    expect(initialStatus.enabled).toBe(false);

    // Setup MFA
    await mfaService.setupMFA(realUserId, {
      method: 'totp',
      deviceName: 'Wing Zero Security'
    });

    // Enable MFA
    const enableResult = await mfaService.enableMFA(realUserId);
    expect(enableResult.success).toBe(true);

    // Check status
    const enabledStatus = await mfaService.getMFAStatus(realUserId);
    expect(enabledStatus.enabled).toBe(true);
    expect(enabledStatus.method).toBe('totp');

    // Disable MFA
    const disableResult = await mfaService.disableMFA(realUserId);
    expect(disableResult.success).toBe(true);

    // Check status again
    const disabledStatus = await mfaService.getMFAStatus(realUserId);
    expect(disabledStatus.enabled).toBe(false);
  });

  test('should integrate with real Wing Zero authentication flow', async () => {
    const realEvents = await testDataService.getRealSecurityEvents();
    
    if (realEvents.length > 0) {
      const realUserId = realEvents[0].user_id;
      
      // Setup MFA for Wing Zero user
      const setupResult = await mfaService.setupMFA(realUserId, {
        method: 'totp',
        deviceName: 'Wing Zero Production',
        metadata: {
          realUserTest: true,
          sourceEvent: realEvents[0].id,
          wingZeroIntegration: true
        }
      });

      // Enable MFA
      await mfaService.enableMFA(realUserId);

      // Simulate authentication flow
      const authData = {
        userId: realUserId,
        sessionId: `wing_zero_session_${Date.now()}`,
        ipAddress: realEvents[0].ip_address || '127.0.0.1',
        userAgent: realEvents[0].user_agent || 'Wing Zero Client',
        timestamp: new Date().toISOString()
      };

      // Generate and verify TOTP
      const token = await mfaService.generateTOTP(setupResult.secret);
      const mfaResult = await mfaService.verifyMFA(realUserId, {
        token,
        method: 'totp',
        authContext: authData
      });

      expect(mfaResult.success).toBe(true);
      expect(mfaResult.sessionValid).toBe(true);
      expect(mfaResult.authContext).toBeTruthy();
    }
  });
});