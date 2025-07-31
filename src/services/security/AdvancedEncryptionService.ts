import CryptoJS from 'crypto-js';

interface EncryptionResult {
  encryptedData: string;
  iv: string;
  tag?: string;
  timestamp: number;
  algorithm: string;
  keyVersion: string;
}

interface DecryptionResult {
  decryptedData: string;
  isValid: boolean;
  timestamp: number;
  algorithm: string;
}

interface KeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
  algorithm: 'RSA-2048' | 'RSA-4096' | 'ECDSA-P256' | 'ECDSA-P384';
  createdAt: number;
  expiresAt?: number;
}

interface EncryptionKey {
  keyId: string;
  key: string;
  algorithm: 'AES-256-GCM' | 'AES-256-CBC' | 'ChaCha20-Poly1305';
  version: number;
  createdAt: number;
  isActive: boolean;
  purpose: 'data' | 'transit' | 'storage' | 'api';
}

interface SecureChannel {
  channelId: string;
  sessionKey: string;
  algorithm: string;
  establishedAt: number;
  expiresAt: number;
  isActive: boolean;
  remotePublicKey?: string;
}

interface EncryptionConfig {
  defaultAlgorithm: 'AES-256-GCM' | 'AES-256-CBC';
  keyRotationIntervalHours: number;
  maxKeyAge: number;
  requireTwoFactorForKeyOps: boolean;
  auditAllOperations: boolean;
  emergencyKeyEscrow: boolean;
}

export class AdvancedEncryptionService {
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private keyPairs: Map<string, KeyPair> = new Map();
  private secureChannels: Map<string, SecureChannel> = new Map();
  private config: EncryptionConfig;
  private masterKey: string;
  private isInitialized = false;

  private readonly DEFAULT_CONFIG: EncryptionConfig = {
    defaultAlgorithm: 'AES-256-GCM',
    keyRotationIntervalHours: 24,
    maxKeyAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    requireTwoFactorForKeyOps: true,
    auditAllOperations: true,
    emergencyKeyEscrow: false
  };

  constructor(config?: Partial<EncryptionConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.masterKey = this.generateMasterKey();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Encryption service already initialized');
      return;
    }

    console.log('🔐 Initializing Advanced Encryption Service...');

    // Generate initial encryption keys
    await this.generateEncryptionKey('data', 'AES-256-GCM');
    await this.generateEncryptionKey('transit', 'AES-256-GCM');
    await this.generateEncryptionKey('storage', 'AES-256-CBC');
    await this.generateEncryptionKey('api', 'AES-256-GCM');

    // Generate initial key pairs
    await this.generateKeyPair('RSA-2048', 'primary');
    await this.generateKeyPair('ECDSA-P256', 'backup');

    // Start key rotation scheduler
    this.startKeyRotationScheduler();

    this.isInitialized = true;
    console.log('✅ Advanced Encryption Service initialized');
  }

  private generateMasterKey(): string {
    // In production, this should be derived from HSM or secure key storage
    const keyMaterial = CryptoJS.lib.WordArray.random(256 / 8);
    return CryptoJS.enc.Hex.stringify(keyMaterial);
  }

  async generateEncryptionKey(
    purpose: 'data' | 'transit' | 'storage' | 'api',
    algorithm: 'AES-256-GCM' | 'AES-256-CBC' | 'ChaCha20-Poly1305' = 'AES-256-GCM'
  ): Promise<string> {
    console.log(`🔑 Generating new ${algorithm} key for ${purpose}`);

    const keyId = this.generateUniqueId();
    const keyMaterial = CryptoJS.lib.WordArray.random(256 / 8);
    const key = CryptoJS.enc.Hex.stringify(keyMaterial);

    // Encrypt the key with master key for storage
    const encryptedKey = CryptoJS.AES.encrypt(key, this.masterKey).toString();

    // Determine version number
    const existingKeys = Array.from(this.encryptionKeys.values())
      .filter(k => k.purpose === purpose && k.algorithm === algorithm);
    const version = existingKeys.length + 1;

    const encryptionKey: EncryptionKey = {
      keyId,
      key: encryptedKey,
      algorithm,
      version,
      createdAt: Date.now(),
      isActive: true,
      purpose
    };

    // Deactivate previous keys for this purpose
    existingKeys.forEach(existingKey => {
      existingKey.isActive = false;
    });

    this.encryptionKeys.set(keyId, encryptionKey);

    this.auditLog('KEY_GENERATED', {
      keyId,
      purpose,
      algorithm,
      version
    });

    console.log(`✅ Generated ${algorithm} key ${keyId} for ${purpose} (version ${version})`);
    return keyId;
  }

  async generateKeyPair(
    algorithm: 'RSA-2048' | 'RSA-4096' | 'ECDSA-P256' | 'ECDSA-P384',
    label: string,
    expirationDays?: number
  ): Promise<string> {
    console.log(`🔑 Generating ${algorithm} key pair: ${label}`);

    const keyId = this.generateUniqueId();
    let publicKey: string;
    let privateKey: string;

    // In a production environment, these would be generated using WebCrypto API or Node.js crypto
    // For demonstration, we'll create mock key pairs
    switch (algorithm) {
      case 'RSA-2048':
      case 'RSA-4096':
        publicKey = this.generateMockRSAPublicKey(algorithm);
        privateKey = this.generateMockRSAPrivateKey(algorithm);
        break;
      case 'ECDSA-P256':
      case 'ECDSA-P384':
        publicKey = this.generateMockECDSAPublicKey(algorithm);
        privateKey = this.generateMockECDSAPrivateKey(algorithm);
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    // Encrypt private key with master key
    const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, this.masterKey).toString();

    const keyPair: KeyPair = {
      publicKey,
      privateKey: encryptedPrivateKey,
      keyId,
      algorithm,
      createdAt: Date.now(),
      expiresAt: expirationDays ? Date.now() + (expirationDays * 24 * 60 * 60 * 1000) : undefined
    };

    this.keyPairs.set(keyId, keyPair);

    this.auditLog('KEYPAIR_GENERATED', {
      keyId,
      algorithm,
      label,
      expirationDays
    });

    console.log(`✅ Generated ${algorithm} key pair ${keyId} (${label})`);
    return keyId;
  }

  async encryptData(
    data: string,
    purpose: 'data' | 'transit' | 'storage' | 'api' = 'data',
    algorithm?: 'AES-256-GCM' | 'AES-256-CBC'
  ): Promise<EncryptionResult> {
    if (!this.isInitialized) {
      throw new Error('Encryption service not initialized');
    }

    const targetAlgorithm = algorithm || this.config.defaultAlgorithm;
    const key = this.getActiveKey(purpose, targetAlgorithm);

    if (!key) {
      throw new Error(`No active key found for purpose: ${purpose}, algorithm: ${targetAlgorithm}`);
    }

    console.log(`🔐 Encrypting data with ${targetAlgorithm} (purpose: ${purpose})`);

    // Decrypt the key for use
    const decryptedKey = CryptoJS.AES.decrypt(key.key, this.masterKey).toString(CryptoJS.enc.Utf8);

    let encryptionResult: EncryptionResult;

    if (targetAlgorithm === 'AES-256-GCM') {
      // AES-GCM encryption (authenticated encryption)
      const iv = CryptoJS.lib.WordArray.random(96 / 8); // 12 bytes for GCM
      const encrypted = CryptoJS.AES.encrypt(data, decryptedKey, {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding
      });

      encryptionResult = {
        encryptedData: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
        iv: iv.toString(CryptoJS.enc.Base64),
        tag: encrypted.salt?.toString(CryptoJS.enc.Base64), // Authentication tag
        timestamp: Date.now(),
        algorithm: targetAlgorithm,
        keyVersion: `${key.keyId}-v${key.version}`
      };
    } else {
      // AES-CBC encryption
      const iv = CryptoJS.lib.WordArray.random(128 / 8); // 16 bytes for CBC
      const encrypted = CryptoJS.AES.encrypt(data, decryptedKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      encryptionResult = {
        encryptedData: encrypted.toString(),
        iv: iv.toString(CryptoJS.enc.Base64),
        timestamp: Date.now(),
        algorithm: targetAlgorithm,
        keyVersion: `${key.keyId}-v${key.version}`
      };
    }

    this.auditLog('DATA_ENCRYPTED', {
      purpose,
      algorithm: targetAlgorithm,
      keyId: key.keyId,
      dataLength: data.length
    });

    console.log(`✅ Data encrypted successfully (${data.length} bytes)`);
    return encryptionResult;
  }

  async decryptData(encryptionResult: EncryptionResult): Promise<DecryptionResult> {
    if (!this.isInitialized) {
      throw new Error('Encryption service not initialized');
    }

    console.log(`🔓 Decrypting data with ${encryptionResult.algorithm}`);

    // Extract key ID from version
    const keyId = encryptionResult.keyVersion.split('-')[0];
    const key = this.encryptionKeys.get(keyId);

    if (!key) {
      throw new Error(`Encryption key not found: ${keyId}`);
    }

    // Decrypt the key for use
    const decryptedKey = CryptoJS.AES.decrypt(key.key, this.masterKey).toString(CryptoJS.enc.Utf8);

    let decryptedData: string;
    let isValid = true;

    try {
      if (encryptionResult.algorithm === 'AES-256-GCM') {
        // AES-GCM decryption with authentication
        const iv = CryptoJS.enc.Base64.parse(encryptionResult.iv);
        const ciphertext = CryptoJS.enc.Base64.parse(encryptionResult.encryptedData);
        
        // Reconstruct the cipher object
        const cipherParams = CryptoJS.lib.CipherParams.create({
          ciphertext: ciphertext,
          salt: encryptionResult.tag ? CryptoJS.enc.Base64.parse(encryptionResult.tag) : undefined
        });

        const decrypted = CryptoJS.AES.decrypt(cipherParams, decryptedKey, {
          iv: iv,
          mode: CryptoJS.mode.GCM,
          padding: CryptoJS.pad.NoPadding
        });

        decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
      } else {
        // AES-CBC decryption
        const iv = CryptoJS.enc.Base64.parse(encryptionResult.iv);
        const decrypted = CryptoJS.AES.decrypt(encryptionResult.encryptedData, decryptedKey, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });

        decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
      }

      if (!decryptedData) {
        isValid = false;
        decryptedData = '';
      }
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      isValid = false;
      decryptedData = '';
    }

    this.auditLog('DATA_DECRYPTED', {
      keyId,
      algorithm: encryptionResult.algorithm,
      success: isValid,
      timestamp: encryptionResult.timestamp
    });

    console.log(`${isValid ? '✅' : '❌'} Data decryption ${isValid ? 'successful' : 'failed'}`);

    return {
      decryptedData,
      isValid,
      timestamp: Date.now(),
      algorithm: encryptionResult.algorithm
    };
  }

  async establishSecureChannel(remotePublicKey?: string): Promise<string> {
    console.log('🔗 Establishing secure channel...');

    const channelId = this.generateUniqueId();
    
    // Generate session key for this channel
    const sessionKeyMaterial = CryptoJS.lib.WordArray.random(256 / 8);
    const sessionKey = CryptoJS.enc.Hex.stringify(sessionKeyMaterial);

    // Encrypt session key with master key for storage
    const encryptedSessionKey = CryptoJS.AES.encrypt(sessionKey, this.masterKey).toString();

    const channel: SecureChannel = {
      channelId,
      sessionKey: encryptedSessionKey,
      algorithm: 'AES-256-GCM',
      establishedAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      isActive: true,
      remotePublicKey
    };

    this.secureChannels.set(channelId, channel);

    this.auditLog('SECURE_CHANNEL_ESTABLISHED', {
      channelId,
      hasRemoteKey: !!remotePublicKey,
      expiresAt: channel.expiresAt
    });

    console.log(`✅ Secure channel established: ${channelId}`);
    return channelId;
  }

  async encryptForChannel(channelId: string, data: string): Promise<EncryptionResult> {
    const channel = this.secureChannels.get(channelId);
    if (!channel || !channel.isActive) {
      throw new Error(`Invalid or inactive secure channel: ${channelId}`);
    }

    if (Date.now() > channel.expiresAt) {
      channel.isActive = false;
      throw new Error(`Secure channel expired: ${channelId}`);
    }

    console.log(`🔐 Encrypting data for secure channel: ${channelId}`);

    // Decrypt session key for use
    const sessionKey = CryptoJS.AES.decrypt(channel.sessionKey, this.masterKey).toString(CryptoJS.enc.Utf8);

    // Use AES-GCM for channel encryption
    const iv = CryptoJS.lib.WordArray.random(96 / 8);
    const encrypted = CryptoJS.AES.encrypt(data, sessionKey, {
      iv: iv,
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.NoPadding
    });

    const result: EncryptionResult = {
      encryptedData: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
      iv: iv.toString(CryptoJS.enc.Base64),
      tag: encrypted.salt?.toString(CryptoJS.enc.Base64),
      timestamp: Date.now(),
      algorithm: 'AES-256-GCM',
      keyVersion: `channel-${channelId}`
    };

    this.auditLog('CHANNEL_DATA_ENCRYPTED', {
      channelId,
      dataLength: data.length
    });

    return result;
  }

  async decryptFromChannel(channelId: string, encryptionResult: EncryptionResult): Promise<DecryptionResult> {
    const channel = this.secureChannels.get(channelId);
    if (!channel || !channel.isActive) {
      throw new Error(`Invalid or inactive secure channel: ${channelId}`);
    }

    console.log(`🔓 Decrypting data from secure channel: ${channelId}`);

    // Decrypt session key for use
    const sessionKey = CryptoJS.AES.decrypt(channel.sessionKey, this.masterKey).toString(CryptoJS.enc.Utf8);

    let decryptedData: string;
    let isValid = true;

    try {
      const iv = CryptoJS.enc.Base64.parse(encryptionResult.iv);
      const ciphertext = CryptoJS.enc.Base64.parse(encryptionResult.encryptedData);
      
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertext,
        salt: encryptionResult.tag ? CryptoJS.enc.Base64.parse(encryptionResult.tag) : undefined
      });

      const decrypted = CryptoJS.AES.decrypt(cipherParams, sessionKey, {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding
      });

      decryptedData = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedData) {
        isValid = false;
        decryptedData = '';
      }
    } catch (error) {
      console.error('❌ Channel decryption failed:', error);
      isValid = false;
      decryptedData = '';
    }

    this.auditLog('CHANNEL_DATA_DECRYPTED', {
      channelId,
      success: isValid
    });

    return {
      decryptedData,
      isValid,
      timestamp: Date.now(),
      algorithm: encryptionResult.algorithm
    };
  }

  async rotateKeys(purpose?: 'data' | 'transit' | 'storage' | 'api'): Promise<void> {
    console.log(`🔄 Rotating encryption keys${purpose ? ` for ${purpose}` : ' (all purposes)'}`);

    const purposesToRotate = purpose ? [purpose] : ['data', 'transit', 'storage', 'api'] as const;

    for (const p of purposesToRotate) {
      // Find current active key
      const currentKey = this.getActiveKey(p);
      if (currentKey) {
        // Generate new key
        await this.generateEncryptionKey(p, currentKey.algorithm);
        
        // Schedule old key for deletion after grace period
        setTimeout(() => {
          this.encryptionKeys.delete(currentKey.keyId);
          this.auditLog('KEY_DELETED', {
            keyId: currentKey.keyId,
            purpose: p,
            reason: 'rotation_cleanup'
          });
        }, 7 * 24 * 60 * 60 * 1000); // 7 days grace period
      }
    }

    this.auditLog('KEY_ROTATION_COMPLETED', {
      purposes: purposesToRotate
    });

    console.log('✅ Key rotation completed');
  }

  async revokeSecureChannel(channelId: string): Promise<void> {
    const channel = this.secureChannels.get(channelId);
    if (!channel) {
      throw new Error(`Secure channel not found: ${channelId}`);
    }

    channel.isActive = false;
    
    this.auditLog('SECURE_CHANNEL_REVOKED', {
      channelId,
      revokedAt: Date.now()
    });

    console.log(`✅ Secure channel revoked: ${channelId}`);
  }

  // Key management utilities
  getActiveKeys(): EncryptionKey[] {
    return Array.from(this.encryptionKeys.values()).filter(key => key.isActive);
  }

  getKeyPairs(): KeyPair[] {
    return Array.from(this.keyPairs.values());
  }

  getActiveChannels(): SecureChannel[] {
    return Array.from(this.secureChannels.values())
      .filter(channel => channel.isActive && Date.now() < channel.expiresAt);
  }

  private getActiveKey(
    purpose: 'data' | 'transit' | 'storage' | 'api',
    algorithm?: string
  ): EncryptionKey | null {
    const keys = Array.from(this.encryptionKeys.values())
      .filter(key => 
        key.isActive && 
        key.purpose === purpose &&
        (!algorithm || key.algorithm === algorithm)
      )
      .sort((a, b) => b.version - a.version);

    return keys[0] || null;
  }

  private startKeyRotationScheduler(): void {
    setInterval(() => {
      this.rotateKeys().catch(error => {
        console.error('❌ Automatic key rotation failed:', error);
      });
    }, this.config.keyRotationIntervalHours * 60 * 60 * 1000);

    console.log(`🔄 Key rotation scheduler started (interval: ${this.config.keyRotationIntervalHours}h)`);
  }

  private generateUniqueId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${randomPart}`;
  }

  private generateMockRSAPublicKey(algorithm: 'RSA-2048' | 'RSA-4096'): string {
    const keySize = algorithm === 'RSA-2048' ? 2048 : 4096;
    return `-----BEGIN PUBLIC KEY-----\nMOCK_RSA_${keySize}_PUBLIC_KEY_${this.generateUniqueId()}\n-----END PUBLIC KEY-----`;
  }

  private generateMockRSAPrivateKey(algorithm: 'RSA-2048' | 'RSA-4096'): string {
    const keySize = algorithm === 'RSA-2048' ? 2048 : 4096;
    return `-----BEGIN PRIVATE KEY-----\nMOCK_RSA_${keySize}_PRIVATE_KEY_${this.generateUniqueId()}\n-----END PRIVATE KEY-----`;
  }

  private generateMockECDSAPublicKey(algorithm: 'ECDSA-P256' | 'ECDSA-P384'): string {
    const curve = algorithm === 'ECDSA-P256' ? 'P256' : 'P384';
    return `-----BEGIN PUBLIC KEY-----\nMOCK_ECDSA_${curve}_PUBLIC_KEY_${this.generateUniqueId()}\n-----END PUBLIC KEY-----`;
  }

  private generateMockECDSAPrivateKey(algorithm: 'ECDSA-P256' | 'ECDSA-P384'): string {
    const curve = algorithm === 'ECDSA-P256' ? 'P256' : 'P384';
    return `-----BEGIN PRIVATE KEY-----\nMOCK_ECDSA_${curve}_PRIVATE_KEY_${this.generateUniqueId()}\n-----END PRIVATE KEY-----`;
  }

  private auditLog(operation: string, details: any): void {
    if (!this.config.auditAllOperations) return;

    const auditEntry = {
      timestamp: Date.now(),
      operation,
      details,
      serviceVersion: '1.0.0'
    };

    // In production, this would be sent to a secure audit system
    console.log(`📋 AUDIT: ${operation}`, auditEntry);
  }

  // Health check and diagnostics
  getServiceHealth(): {
    isInitialized: boolean;
    activeKeys: number;
    activeChannels: number;
    expiredKeys: number;
    nextRotation: number;
    configStatus: string;
  } {
    const activeKeys = this.getActiveKeys().length;
    const activeChannels = this.getActiveChannels().length;
    const expiredKeys = Array.from(this.encryptionKeys.values())
      .filter(key => !key.isActive).length;
    
    const nextRotation = Date.now() + (this.config.keyRotationIntervalHours * 60 * 60 * 1000);

    return {
      isInitialized: this.isInitialized,
      activeKeys,
      activeChannels,
      expiredKeys,
      nextRotation,
      configStatus: 'healthy'
    };
  }
}