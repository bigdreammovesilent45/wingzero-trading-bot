// Phase 4: Security & Compliance - Multi-Factor Authentication
import * as speakeasy from 'speakeasy';

export interface MFASetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerification {
  isValid: boolean;
  remainingAttempts?: number;
  lockoutTime?: Date;
}

export interface MFAConfig {
  issuer: string;
  window: number; // Time window for TOTP validation
  maxAttempts: number;
  lockoutDuration: number; // minutes
}

export class MultiFactorAuthService {
  private static instance: MultiFactorAuthService;
  private config: MFAConfig = {
    issuer: 'WingZero Trading',
    window: 2,
    maxAttempts: 3,
    lockoutDuration: 15
  };
  private attemptCounts = new Map<string, number>();
  private lockouts = new Map<string, Date>();

  static getInstance(): MultiFactorAuthService {
    if (!MultiFactorAuthService.instance) {
      MultiFactorAuthService.instance = new MultiFactorAuthService();
    }
    return MultiFactorAuthService.instance;
  }

  async setupMFA(userId: string, email: string): Promise<MFASetup> {
    const secret = speakeasy.generateSecret({
      issuer: this.config.issuer,
      name: email,
      length: 32
    });

    const qrCodeUrl = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: email,
      issuer: this.config.issuer,
      encoding: 'ascii'
    });

    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes
    };
  }

  async verifyTOTP(userId: string, token: string, secret: string): Promise<MFAVerification> {
    // Check if user is locked out
    if (this.isUserLockedOut(userId)) {
      const lockoutTime = this.lockouts.get(userId);
      return {
        isValid: false,
        lockoutTime
      };
    }

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: this.config.window
    });

    if (isValid) {
      // Reset attempt count on successful verification
      this.attemptCounts.delete(userId);
      this.lockouts.delete(userId);
      return { isValid: true };
    } else {
      // Increment failed attempts
      const attempts = (this.attemptCounts.get(userId) || 0) + 1;
      this.attemptCounts.set(userId, attempts);

      if (attempts >= this.config.maxAttempts) {
        // Lock out user
        const lockoutTime = new Date(Date.now() + this.config.lockoutDuration * 60 * 1000);
        this.lockouts.set(userId, lockoutTime);
        this.attemptCounts.delete(userId);
        
        return {
          isValid: false,
          lockoutTime
        };
      }

      return {
        isValid: false,
        remainingAttempts: this.config.maxAttempts - attempts
      };
    }
  }

  async verifyBackupCode(userId: string, code: string, backupCodes: string[]): Promise<boolean> {
    const hashedCode = await this.hashBackupCode(code);
    const isValid = backupCodes.includes(hashedCode);
    
    if (isValid) {
      // Reset lockout on successful backup code verification
      this.attemptCounts.delete(userId);
      this.lockouts.delete(userId);
    }
    
    return isValid;
  }

  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  isUserLockedOut(userId: string): boolean {
    const lockoutTime = this.lockouts.get(userId);
    if (!lockoutTime) return false;
    
    const now = new Date();
    if (now >= lockoutTime) {
      // Lockout expired, remove it
      this.lockouts.delete(userId);
      return false;
    }
    
    return true;
  }

  getRemainingLockoutTime(userId: string): number {
    const lockoutTime = this.lockouts.get(userId);
    if (!lockoutTime) return 0;
    
    const now = new Date();
    const remaining = lockoutTime.getTime() - now.getTime();
    return Math.max(0, Math.ceil(remaining / 1000)); // seconds
  }

  updateConfig(newConfig: Partial<MFAConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): MFAConfig {
    return { ...this.config };
  }

  clearUserAttempts(userId: string): void {
    this.attemptCounts.delete(userId);
    this.lockouts.delete(userId);
  }

  private async hashBackupCode(code: string): Promise<string> {
    // Simple hash for demo - use proper crypto hash in production
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}