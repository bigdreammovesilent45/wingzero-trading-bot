import CryptoJS from 'crypto-js';

interface TOTPSecret {
  secret: string;
  issuer: string;
  label: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number;
  qrCodeUrl?: string;
  backupCodes: string[];
  createdAt: number;
  isActive: boolean;
}

interface BiometricCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  aaguid: string;
  userHandle: string;
  transports: ('usb' | 'nfc' | 'ble' | 'internal')[];
  createdAt: number;
  lastUsed?: number;
  nickname?: string;
  isActive: boolean;
}

interface HardwareKey {
  keyId: string;
  publicKey: string;
  credentialId: string;
  aaguid: string;
  counter: number;
  algorithm: string;
  createdAt: number;
  lastUsed?: number;
  nickname?: string;
  isActive: boolean;
}

interface AuthenticationAttempt {
  userId: string;
  method: 'totp' | 'biometric' | 'hardware_key' | 'backup_code' | 'sms' | 'email';
  success: boolean;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  riskScore?: number;
}

interface MFAChallenge {
  challengeId: string;
  userId: string;
  requiredMethods: ('totp' | 'biometric' | 'hardware_key')[];
  completedMethods: string[];
  createdAt: number;
  expiresAt: number;
  isCompleted: boolean;
  sessionToken?: string;
}

interface MFAConfiguration {
  requireTOTP: boolean;
  requireBiometric: boolean;
  requireHardwareKey: boolean;
  allowBackupCodes: boolean;
  allowSMSFallback: boolean;
  allowEmailFallback: boolean;
  maxAttempts: number;
  lockoutDurationMinutes: number;
  challengeExpirationMinutes: number;
  totpWindowSize: number;
  riskBasedAuthentication: boolean;
}

interface UserMFAProfile {
  userId: string;
  totpSecret?: TOTPSecret;
  biometricCredentials: BiometricCredential[];
  hardwareKeys: HardwareKey[];
  backupCodes: string[];
  lastAuthentication?: number;
  failedAttempts: number;
  lockedUntil?: number;
  preferences: {
    preferredMethod: 'totp' | 'biometric' | 'hardware_key';
    enableRiskAnalysis: boolean;
    trustedDevices: string[];
  };
}

export class MultifactorAuthenticationService {
  private userProfiles: Map<string, UserMFAProfile> = new Map();
  private activeChallenges: Map<string, MFAChallenge> = new Map();
  private authenticationAttempts: AuthenticationAttempt[] = [];
  private config: MFAConfiguration;
  private isInitialized = false;

  private readonly DEFAULT_CONFIG: MFAConfiguration = {
    requireTOTP: true,
    requireBiometric: false,
    requireHardwareKey: false,
    allowBackupCodes: true,
    allowSMSFallback: false,
    allowEmailFallback: true,
    maxAttempts: 3,
    lockoutDurationMinutes: 15,
    challengeExpirationMinutes: 5,
    totpWindowSize: 1,
    riskBasedAuthentication: true
  };

  constructor(config?: Partial<MFAConfiguration>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ MFA service already initialized');
      return;
    }

    console.log('🔐 Initializing Multi-factor Authentication Service...');

    // Check for WebAuthn support
    const hasWebAuthn = typeof navigator !== 'undefined' && 
                        'credentials' in navigator && 
                        'create' in navigator.credentials;

    if (hasWebAuthn) {
      console.log('✅ WebAuthn support detected');
    } else {
      console.log('⚠️ WebAuthn not supported in this environment');
    }

    // Start cleanup scheduler for expired challenges
    this.startCleanupScheduler();

    this.isInitialized = true;
    console.log('✅ Multi-factor Authentication Service initialized');
  }

  async setupTOTP(userId: string, issuer: string = 'Wing Zero', label?: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    console.log(`🔑 Setting up TOTP for user: ${userId}`);

    // Generate random secret (32 bytes = 160 bits for good security)
    const secretBytes = CryptoJS.lib.WordArray.random(32);
    const secret = this.base32Encode(secretBytes);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    const totpSecret: TOTPSecret = {
      secret,
      issuer,
      label: label || userId,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      backupCodes,
      createdAt: Date.now(),
      isActive: false // Will be activated after verification
    };

    // Generate QR code URL
    const qrCodeUrl = this.generateTOTPQRCode(totpSecret);
    totpSecret.qrCodeUrl = qrCodeUrl;

    // Get or create user profile
    let userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      userProfile = this.createUserProfile(userId);
    }

    userProfile.totpSecret = totpSecret;
    userProfile.backupCodes = backupCodes;
    this.userProfiles.set(userId, userProfile);

    this.auditLog('TOTP_SETUP_INITIATED', {
      userId,
      issuer,
      label: totpSecret.label
    });

    console.log(`✅ TOTP setup completed for user: ${userId}`);

    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }

  async verifyTOTPSetup(userId: string, code: string): Promise<boolean> {
    console.log(`🔍 Verifying TOTP setup for user: ${userId}`);

    const userProfile = this.userProfiles.get(userId);
    if (!userProfile || !userProfile.totpSecret) {
      throw new Error('TOTP not set up for this user');
    }

    const isValid = this.verifyTOTPCode(userProfile.totpSecret.secret, code);

    if (isValid) {
      userProfile.totpSecret.isActive = true;
      this.userProfiles.set(userId, userProfile);

      this.auditLog('TOTP_SETUP_VERIFIED', {
        userId,
        verificationSuccessful: true
      });

      console.log(`✅ TOTP setup verified for user: ${userId}`);
    } else {
      this.auditLog('TOTP_SETUP_VERIFICATION_FAILED', {
        userId,
        verificationSuccessful: false
      });

      console.log(`❌ TOTP verification failed for user: ${userId}`);
    }

    return isValid;
  }

  async registerBiometric(userId: string, credentialOptions: any): Promise<string> {
    console.log(`🔐 Registering biometric credential for user: ${userId}`);

    // Mock biometric registration (in real implementation, this would use WebAuthn)
    const credentialId = this.generateUniqueId();
    const publicKey = this.generateMockPublicKey();

    const biometricCredential: BiometricCredential = {
      credentialId,
      publicKey,
      counter: 0,
      aaguid: 'mock-aaguid-12345678',
      userHandle: userId,
      transports: ['internal'],
      createdAt: Date.now(),
      nickname: credentialOptions.nickname || 'Biometric Key',
      isActive: true
    };

    // Get or create user profile
    let userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      userProfile = this.createUserProfile(userId);
    }

    userProfile.biometricCredentials.push(biometricCredential);
    this.userProfiles.set(userId, userProfile);

    this.auditLog('BIOMETRIC_REGISTERED', {
      userId,
      credentialId,
      nickname: biometricCredential.nickname
    });

    console.log(`✅ Biometric credential registered for user: ${userId}`);
    return credentialId;
  }

  async registerHardwareKey(userId: string, keyOptions: any): Promise<string> {
    console.log(`🔑 Registering hardware key for user: ${userId}`);

    // Mock hardware key registration (in real implementation, this would use WebAuthn)
    const keyId = this.generateUniqueId();
    const credentialId = this.generateUniqueId();
    const publicKey = this.generateMockPublicKey();

    const hardwareKey: HardwareKey = {
      keyId,
      publicKey,
      credentialId,
      aaguid: 'mock-yubikey-aaguid',
      counter: 0,
      algorithm: 'ES256',
      createdAt: Date.now(),
      nickname: keyOptions.nickname || 'Hardware Key',
      isActive: true
    };

    // Get or create user profile
    let userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      userProfile = this.createUserProfile(userId);
    }

    userProfile.hardwareKeys.push(hardwareKey);
    this.userProfiles.set(userId, userProfile);

    this.auditLog('HARDWARE_KEY_REGISTERED', {
      userId,
      keyId,
      credentialId,
      nickname: hardwareKey.nickname
    });

    console.log(`✅ Hardware key registered for user: ${userId}`);
    return keyId;
  }

  async createChallenge(userId: string, requiredMethods?: ('totp' | 'biometric' | 'hardware_key')[]): Promise<string> {
    console.log(`🎯 Creating MFA challenge for user: ${userId}`);

    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      throw new Error('User not found');
    }

    // Check if user is locked out
    if (userProfile.lockedUntil && Date.now() < userProfile.lockedUntil) {
      throw new Error(`User is locked out until ${new Date(userProfile.lockedUntil).toISOString()}`);
    }

    // Determine required methods based on configuration and user setup
    const methods = requiredMethods || this.determineRequiredMethods(userProfile);

    const challengeId = this.generateUniqueId();
    const challenge: MFAChallenge = {
      challengeId,
      userId,
      requiredMethods: methods,
      completedMethods: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + (this.config.challengeExpirationMinutes * 60 * 1000),
      isCompleted: false
    };

    this.activeChallenges.set(challengeId, challenge);

    this.auditLog('MFA_CHALLENGE_CREATED', {
      userId,
      challengeId,
      requiredMethods: methods
    });

    console.log(`✅ MFA challenge created: ${challengeId} for user: ${userId}`);
    return challengeId;
  }

  async verifyChallenge(
    challengeId: string,
    method: 'totp' | 'biometric' | 'hardware_key' | 'backup_code',
    credential: string,
    additionalData?: any
  ): Promise<{
    success: boolean;
    isCompleted: boolean;
    sessionToken?: string;
    remainingMethods?: string[];
  }> {
    console.log(`🔍 Verifying MFA challenge: ${challengeId} with method: ${method}`);

    const challenge = this.activeChallenges.get(challengeId);
    if (!challenge) {
      throw new Error('Invalid challenge ID');
    }

    if (Date.now() > challenge.expiresAt) {
      this.activeChallenges.delete(challengeId);
      throw new Error('Challenge expired');
    }

    const userProfile = this.userProfiles.get(challenge.userId);
    if (!userProfile) {
      throw new Error('User not found');
    }

    let verificationSuccess = false;

    // Verify the credential based on method
    switch (method) {
      case 'totp':
        verificationSuccess = this.verifyTOTPCredential(userProfile, credential);
        break;
      case 'biometric':
        verificationSuccess = this.verifyBiometricCredential(userProfile, credential, additionalData);
        break;
      case 'hardware_key':
        verificationSuccess = this.verifyHardwareKeyCredential(userProfile, credential, additionalData);
        break;
      case 'backup_code':
        verificationSuccess = this.verifyBackupCode(userProfile, credential);
        break;
    }

    // Record authentication attempt
    this.recordAuthenticationAttempt({
      userId: challenge.userId,
      method,
      success: verificationSuccess,
      timestamp: Date.now(),
      ipAddress: additionalData?.ipAddress,
      userAgent: additionalData?.userAgent,
      deviceFingerprint: additionalData?.deviceFingerprint
    });

    if (verificationSuccess) {
      // Add method to completed list
      if (!challenge.completedMethods.includes(method)) {
        challenge.completedMethods.push(method);
      }

      // Reset failed attempts on successful authentication
      userProfile.failedAttempts = 0;
      userProfile.lockedUntil = undefined;

      // Check if all required methods are completed
      const isCompleted = challenge.requiredMethods.every(requiredMethod =>
        challenge.completedMethods.includes(requiredMethod)
      );

      if (isCompleted) {
        challenge.isCompleted = true;
        challenge.sessionToken = this.generateSessionToken(challenge.userId);
        userProfile.lastAuthentication = Date.now();

        this.auditLog('MFA_CHALLENGE_COMPLETED', {
          challengeId,
          userId: challenge.userId,
          completedMethods: challenge.completedMethods
        });

        console.log(`✅ MFA challenge completed successfully: ${challengeId}`);
      }

      const remainingMethods = challenge.requiredMethods.filter(
        requiredMethod => !challenge.completedMethods.includes(requiredMethod)
      );

      return {
        success: true,
        isCompleted,
        sessionToken: challenge.sessionToken,
        remainingMethods
      };
    } else {
      // Handle failed attempt
      userProfile.failedAttempts++;

      if (userProfile.failedAttempts >= this.config.maxAttempts) {
        userProfile.lockedUntil = Date.now() + (this.config.lockoutDurationMinutes * 60 * 1000);
        
        this.auditLog('USER_LOCKED_OUT', {
          userId: challenge.userId,
          failedAttempts: userProfile.failedAttempts,
          lockedUntil: userProfile.lockedUntil
        });

        console.log(`🔒 User locked out: ${challenge.userId}`);
      }

      this.auditLog('MFA_VERIFICATION_FAILED', {
        challengeId,
        userId: challenge.userId,
        method,
        failedAttempts: userProfile.failedAttempts
      });

      console.log(`❌ MFA verification failed for challenge: ${challengeId}`);

      return {
        success: false,
        isCompleted: false
      };
    }
  }

  private verifyTOTPCredential(userProfile: UserMFAProfile, code: string): boolean {
    if (!userProfile.totpSecret || !userProfile.totpSecret.isActive) {
      return false;
    }

    return this.verifyTOTPCode(userProfile.totpSecret.secret, code);
  }

  private verifyBiometricCredential(userProfile: UserMFAProfile, credentialId: string, additionalData: any): boolean {
    const credential = userProfile.biometricCredentials.find(
      cred => cred.credentialId === credentialId && cred.isActive
    );

    if (!credential) {
      return false;
    }

    // In real implementation, this would verify the WebAuthn assertion
    // For mock purposes, we'll simulate verification
    const mockVerification = additionalData?.mockSuccess !== false;

    if (mockVerification) {
      credential.lastUsed = Date.now();
      credential.counter++;
    }

    return mockVerification;
  }

  private verifyHardwareKeyCredential(userProfile: UserMFAProfile, keyId: string, additionalData: any): boolean {
    const hardwareKey = userProfile.hardwareKeys.find(
      key => key.keyId === keyId && key.isActive
    );

    if (!hardwareKey) {
      return false;
    }

    // In real implementation, this would verify the WebAuthn assertion
    // For mock purposes, we'll simulate verification
    const mockVerification = additionalData?.mockSuccess !== false;

    if (mockVerification) {
      hardwareKey.lastUsed = Date.now();
      hardwareKey.counter++;
    }

    return mockVerification;
  }

  private verifyBackupCode(userProfile: UserMFAProfile, code: string): boolean {
    const codeIndex = userProfile.backupCodes.indexOf(code);
    
    if (codeIndex !== -1) {
      // Remove used backup code
      userProfile.backupCodes.splice(codeIndex, 1);
      return true;
    }

    return false;
  }

  private verifyTOTPCode(secret: string, code: string): boolean {
    const timeStep = Math.floor(Date.now() / 1000 / 30);
    
    // Check current time window and adjacent windows (for clock skew tolerance)
    for (let window = -this.config.totpWindowSize; window <= this.config.totpWindowSize; window++) {
      const expectedCode = this.generateTOTPCode(secret, timeStep + window);
      if (expectedCode === code) {
        return true;
      }
    }

    return false;
  }

  private generateTOTPCode(secret: string, timeStep: number): string {
    // Convert base32 secret to bytes
    const secretBytes = this.base32Decode(secret);
    
    // Create time-based counter
    const counter = new ArrayBuffer(8);
    const counterView = new DataView(counter);
    counterView.setUint32(4, timeStep);

    // Generate HMAC-SHA1
    const hmacKey = CryptoJS.enc.Hex.parse(this.arrayBufferToHex(secretBytes));
    const hmacData = CryptoJS.enc.Hex.parse(this.arrayBufferToHex(counter));
    const hmac = CryptoJS.HmacSHA1(hmacData, hmacKey);

    // Dynamic truncation
    const hmacBytes = CryptoJS.enc.Hex.parse(hmac.toString());
    const offset = hmacBytes.words[hmacBytes.words.length - 1] & 0xf;
    
    const code = ((hmacBytes.words[Math.floor(offset / 4)] >>> ((3 - (offset % 4)) * 8)) & 0x7fffffff) % 1000000;
    
    return code.toString().padStart(6, '0');
  }

  private generateTOTPQRCode(totpSecret: TOTPSecret): string {
    const encodedIssuer = encodeURIComponent(totpSecret.issuer);
    const encodedLabel = encodeURIComponent(totpSecret.label);
    const encodedSecret = totpSecret.secret;

    return `otpauth://totp/${encodedIssuer}:${encodedLabel}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=${totpSecret.algorithm}&digits=${totpSecret.digits}&period=${totpSecret.period}`;
  }

  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric backup code
      const code = Array.from(
        { length: 8 }, 
        () => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 36)]
      ).join('');
      
      codes.push(code);
    }

    return codes;
  }

  private determineRequiredMethods(userProfile: UserMFAProfile): ('totp' | 'biometric' | 'hardware_key')[] {
    const methods: ('totp' | 'biometric' | 'hardware_key')[] = [];

    if (this.config.requireTOTP && userProfile.totpSecret?.isActive) {
      methods.push('totp');
    }

    if (this.config.requireBiometric && userProfile.biometricCredentials.some(c => c.isActive)) {
      methods.push('biometric');
    }

    if (this.config.requireHardwareKey && userProfile.hardwareKeys.some(k => k.isActive)) {
      methods.push('hardware_key');
    }

    // If no methods are configured but user has TOTP, require it
    if (methods.length === 0 && userProfile.totpSecret?.isActive) {
      methods.push('totp');
    }

    return methods;
  }

  private createUserProfile(userId: string): UserMFAProfile {
    return {
      userId,
      biometricCredentials: [],
      hardwareKeys: [],
      backupCodes: [],
      failedAttempts: 0,
      preferences: {
        preferredMethod: 'totp',
        enableRiskAnalysis: true,
        trustedDevices: []
      }
    };
  }

  private generateSessionToken(userId: string): string {
    const tokenData = {
      userId,
      timestamp: Date.now(),
      random: Math.random().toString(36)
    };

    const token = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(JSON.stringify(tokenData))
    );

    return `mfa_session_${token}`;
  }

  private generateUniqueId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${randomPart}`;
  }

  private generateMockPublicKey(): string {
    const keyData = CryptoJS.lib.WordArray.random(64);
    return CryptoJS.enc.Base64.stringify(keyData);
  }

  private recordAuthenticationAttempt(attempt: AuthenticationAttempt): void {
    this.authenticationAttempts.push(attempt);

    // Keep only last 1000 attempts
    if (this.authenticationAttempts.length > 1000) {
      this.authenticationAttempts = this.authenticationAttempts.slice(-1000);
    }
  }

  private startCleanupScheduler(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Clean up expired challenges
      for (const [challengeId, challenge] of this.activeChallenges.entries()) {
        if (now > challenge.expiresAt) {
          this.activeChallenges.delete(challengeId);
        }
      }
    }, 60000); // Run every minute
  }

  // Utility functions for base32 encoding/decoding
  private base32Encode(buffer: CryptoJS.lib.WordArray): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes = this.wordArrayToUint8Array(buffer);
    let result = '';
    let bits = 0;
    let value = 0;

    for (const byte of bytes) {
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }

    return result;
  }

  private base32Decode(encoded: string): ArrayBuffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes: number[] = [];
    let bits = 0;
    let value = 0;

    for (const char of encoded.toUpperCase()) {
      const index = alphabet.indexOf(char);
      if (index === -1) continue;

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return new Uint8Array(bytes).buffer;
  }

  private wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
    const arrayOfWords = wordArray.words;
    const length = wordArray.sigBytes;
    const uint8Array = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      const word = arrayOfWords[i >>> 2];
      uint8Array[i] = (word >>> (24 - (i % 4) * 8)) & 0xff;
    }

    return uint8Array;
  }

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private auditLog(operation: string, details: any): void {
    const auditEntry = {
      timestamp: Date.now(),
      operation,
      details,
      serviceVersion: '1.0.0'
    };

    // In production, this would be sent to a secure audit system
    console.log(`📋 MFA AUDIT: ${operation}`, auditEntry);
  }

  // Public API methods
  async getUserMethods(userId: string): Promise<{
    hasTOTP: boolean;
    biometricCount: number;
    hardwareKeyCount: number;
    backupCodeCount: number;
  }> {
    const userProfile = this.userProfiles.get(userId);
    
    if (!userProfile) {
      return {
        hasTOTP: false,
        biometricCount: 0,
        hardwareKeyCount: 0,
        backupCodeCount: 0
      };
    }

    return {
      hasTOTP: !!userProfile.totpSecret?.isActive,
      biometricCount: userProfile.biometricCredentials.filter(c => c.isActive).length,
      hardwareKeyCount: userProfile.hardwareKeys.filter(k => k.isActive).length,
      backupCodeCount: userProfile.backupCodes.length
    };
  }

  async removeCredential(
    userId: string, 
    type: 'totp' | 'biometric' | 'hardware_key',
    credentialId?: string
  ): Promise<boolean> {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      return false;
    }

    switch (type) {
      case 'totp':
        if (userProfile.totpSecret) {
          userProfile.totpSecret.isActive = false;
          userProfile.totpSecret = undefined;
        }
        break;

      case 'biometric':
        if (credentialId) {
          const credential = userProfile.biometricCredentials.find(c => c.credentialId === credentialId);
          if (credential) {
            credential.isActive = false;
          }
        }
        break;

      case 'hardware_key':
        if (credentialId) {
          const key = userProfile.hardwareKeys.find(k => k.keyId === credentialId);
          if (key) {
            key.isActive = false;
          }
        }
        break;
    }

    this.auditLog('CREDENTIAL_REMOVED', {
      userId,
      type,
      credentialId
    });

    return true;
  }

  getServiceHealth(): {
    isInitialized: boolean;
    activeUsers: number;
    activeChallenges: number;
    recentAttempts: number;
    configStatus: string;
  } {
    const recentAttempts = this.authenticationAttempts.filter(
      attempt => Date.now() - attempt.timestamp < 24 * 60 * 60 * 1000
    ).length;

    return {
      isInitialized: this.isInitialized,
      activeUsers: this.userProfiles.size,
      activeChallenges: this.activeChallenges.size,
      recentAttempts,
      configStatus: 'healthy'
    };
  }
}