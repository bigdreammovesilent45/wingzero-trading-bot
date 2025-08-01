import { SecurityEncryptionService } from '@/services';

describe('SecurityEncryptionService', () => {
  let encryptionService: SecurityEncryptionService;

  beforeEach(() => {
    encryptionService = SecurityEncryptionService.getInstance();
  });

  it('should return the same instance (singleton)', () => {
    const instance1 = SecurityEncryptionService.getInstance();
    const instance2 = SecurityEncryptionService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should encrypt and decrypt data', async () => {
    const originalData = 'sensitive trading data';
    const encrypted = await encryptionService.encrypt(originalData);
    
    expect(encrypted).not.toBe(originalData);
    expect(encrypted.length).toBeGreaterThan(0);
    
    const decrypted = await encryptionService.decrypt(encrypted);
    expect(decrypted).toBe(originalData);
  });

  it('should hash passwords securely', async () => {
    const password = 'mySecurePassword123';
    const hash = await encryptionService.hashPassword(password);
    
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
    
    const isValid = await encryptionService.verifyPassword(password, hash);
    expect(isValid).toBe(true);
    
    const isInvalid = await encryptionService.verifyPassword('wrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('should generate secure tokens', async () => {
    const token1 = await encryptionService.generateSecureToken();
    const token2 = await encryptionService.generateSecureToken();
    
    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
    expect(token2.length).toBe(64);
  });

  it('should generate different tokens each time', async () => {
    const tokens = await Promise.all([
      encryptionService.generateSecureToken(),
      encryptionService.generateSecureToken(),
      encryptionService.generateSecureToken()
    ]);
    
    const uniqueTokens = new Set(tokens);
    expect(uniqueTokens.size).toBe(3);
  });

  it('should handle encryption of objects', async () => {
    const objectData = {
      userId: 123,
      balance: 50000,
      positions: ['EURUSD', 'GBPJPY']
    };
    
    const encrypted = await encryptionService.encrypt(JSON.stringify(objectData));
    const decrypted = await encryptionService.decrypt(encrypted);
    const parsed = JSON.parse(decrypted);
    
    expect(parsed).toEqual(objectData);
  });

  it('should fail to decrypt with wrong data', async () => {
    await expect(encryptionService.decrypt('invalid-encrypted-data'))
      .rejects.toThrow();
  });
});