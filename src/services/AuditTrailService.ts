export interface AuditEntry {
  event: string;
  userId: string;
  timestamp: string;
  details?: any;
}

export class AuditTrailService {
  private static logs: AuditEntry[] = [];

  static log(entry: AuditEntry): void {
    this.logs.push(entry);
  }

  static getLogs(): AuditEntry[] {
    return this.logs;
  }

  static clear(): void {
    this.logs = [];
  }
}

// Export as default for compatibility
export default AuditTrailService;