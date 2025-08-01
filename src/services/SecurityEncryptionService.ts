// Phase 4: Security & Compliance - Security Encryption Service
import CryptoJS from 'crypto-js';

export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  iterations: number;
}

export class SecurityEncryptionService {
  private static instance: SecurityEncryptionService;
  private config: EncryptionConfig = {
    algorithm: 'AES',
    keySize: 256,
    iterations: 1000
  };

  static getInstance(): SecurityEncryptionService {
    if (!SecurityEncryptionService.instance) {
      SecurityEncryptionService.instance = new SecurityEncryptionService();
    }
    return SecurityEncryptionService.instance;
  }

  async encrypt(data: string, passphrase: string = 'default-key'): Promise<string> {
    return CryptoJS.AES.encrypt(data, passphrase).toString();
  }

  async decrypt(encryptedData: string, passphrase: string = 'default-key'): Promise<string> {
    const bytes = CryptoJS.AES.decrypt(encryptedData, passphrase);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  async hashPassword(password: string): Promise<string> {
    return CryptoJS.SHA256(password).toString();
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(password);
    return hashedPassword === hash;
  }

  async generateSecureToken(): Promise<string> {
    return CryptoJS.lib.WordArray.random(32).toString();
  }
}