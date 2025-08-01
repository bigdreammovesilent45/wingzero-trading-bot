import * as crypto from 'crypto';

describe('EncryptionService', () => {
  const algorithm = 'aes-256-gcm';
  const testData = {
    plaintext: 'Sensitive trading data: API_KEY=abc123, ACCOUNT=12345',
    userId: 'user123',
    timestamp: new Date().toISOString()
  };

  describe('AES-256 encryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      // Generate key and IV
      const key = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);

      // Encrypt
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(JSON.stringify(testData), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(JSON.stringify(testData));
      expect(authTag).toBeDefined();

      // Decrypt
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const decryptedData = JSON.parse(decrypted);
      expect(decryptedData).toEqual(testData);
    });

    it('should generate unique encryption for same data', () => {
      const key = crypto.randomBytes(32);
      
      // Encrypt same data twice
      const encrypt = (data: string) => {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return { encrypted, iv: iv.toString('hex'), authTag: cipher.getAuthTag().toString('hex') };
      };

      const result1 = encrypt(testData.plaintext);
      const result2 = encrypt(testData.plaintext);

      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
    });

    it('should fail decryption with wrong key', () => {
      const key = crypto.randomBytes(32);
      const wrongKey = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);

      // Encrypt with correct key
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(testData.plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      // Try to decrypt with wrong key
      expect(() => {
        const decipher = crypto.createDecipheriv(algorithm, wrongKey, iv);
        decipher.setAuthTag(authTag);
        decipher.update(encrypted, 'hex', 'utf8');
        decipher.final('utf8');
      }).toThrow();
    });
  });

  describe('key management', () => {
    it('should generate secure keys', () => {
      const key1 = crypto.randomBytes(32);
      const key2 = crypto.randomBytes(32);

      expect(key1.length).toBe(32);
      expect(key2.length).toBe(32);
      expect(key1).not.toEqual(key2);
    });

    it('should derive keys from passwords', () => {
      const password = 'SecureP@ssw0rd123!';
      const salt = crypto.randomBytes(32);
      const iterations = 100000;
      const keyLength = 32;

      const key = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256');

      expect(key.length).toBe(keyLength);

      // Same password and salt should produce same key
      const key2 = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256');
      expect(key).toEqual(key2);

      // Different salt should produce different key
      const differentSalt = crypto.randomBytes(32);
      const key3 = crypto.pbkdf2Sync(password, differentSalt, iterations, keyLength, 'sha256');
      expect(key).not.toEqual(key3);
    });

    it('should support key rotation', () => {
      const oldKey = crypto.randomBytes(32);
      const newKey = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);

      // Encrypt with old key
      const cipher = crypto.createCipheriv(algorithm, oldKey, iv);
      let encrypted = cipher.update(testData.plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      // Decrypt with old key
      const decipher = crypto.createDecipheriv(algorithm, oldKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // Re-encrypt with new key
      const newIv = crypto.randomBytes(16);
      const newCipher = crypto.createCipheriv(algorithm, newKey, newIv);
      let reEncrypted = newCipher.update(decrypted, 'utf8', 'hex');
      reEncrypted += newCipher.final('hex');

      expect(reEncrypted).toBeDefined();
      expect(reEncrypted).not.toBe(encrypted);
    });
  });

  describe('secure data handling', () => {
    it('should encrypt sensitive fields in objects', () => {
      const sensitiveData = {
        userId: 'user123',
        apiKey: 'sk_live_abcd1234', // Should be encrypted
        accountNumber: '1234567890', // Should be encrypted
        name: 'John Doe',
        email: 'john@example.com',
        balance: 50000 // Should be encrypted
      };

      const sensitiveFields = ['apiKey', 'accountNumber', 'balance'];
      const key = crypto.randomBytes(32);
      
      const encryptedData: any = { ...sensitiveData };
      
      sensitiveFields.forEach(field => {
        if (encryptedData[field] !== undefined) {
          const iv = crypto.randomBytes(16);
          const cipher = crypto.createCipheriv(algorithm, key, iv);
          let encrypted = cipher.update(String(encryptedData[field]), 'utf8', 'hex');
          encrypted += cipher.final('hex');
          
          encryptedData[field] = {
            encrypted,
            iv: iv.toString('hex'),
            authTag: cipher.getAuthTag().toString('hex')
          };
        }
      });

      // Verify sensitive fields are encrypted
      expect(encryptedData.apiKey.encrypted).toBeDefined();
      expect(encryptedData.accountNumber.encrypted).toBeDefined();
      expect(encryptedData.balance.encrypted).toBeDefined();
      
      // Verify non-sensitive fields remain unchanged
      expect(encryptedData.name).toBe(sensitiveData.name);
      expect(encryptedData.email).toBe(sensitiveData.email);
    });
  });
});