interface SecurityThreat {
  id: string;
  type: 'unauthorized_access' | 'suspicious_trading' | 'data_breach' | 'malware' | 'ddos';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  source: string;
  status: 'active' | 'investigating' | 'resolved';
  mitigation?: string;
  affectedSystems: string[];
}

interface SecurityMetrics {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  activeThreats: number;
  blockedAttempts: number;
  suspiciousActivities: number;
  systemVulnerabilities: number;
  complianceScore: number;
  lastSecurityScan: Date;
}

interface AuditEvent {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure';
  ipAddress: string;
  userAgent: string;
  riskScore: number;
  details: Record<string, any>;
}

interface ComplianceCheck {
  id: string;
  regulation: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial';
  lastChecked: Date;
  nextCheck: Date;
  evidence: string[];
  remediation?: string;
}

export class SecurityMonitoringService {
  private static instance: SecurityMonitoringService;

  static getInstance(): SecurityMonitoringService {
    if (!this.instance) {
      this.instance = new SecurityMonitoringService();
    }
    return this.instance;
  }

  async getSecurityThreats(): Promise<SecurityThreat[]> {
    return [
      {
        id: '1',
        type: 'unauthorized_access',
        severity: 'high',
        description: 'Multiple failed login attempts from suspicious IP addresses',
        detectedAt: new Date(Date.now() - 3600000),
        source: '192.168.1.100',
        status: 'investigating',
        affectedSystems: ['Authentication Service', 'User Portal']
      },
      {
        id: '2',
        type: 'suspicious_trading',
        severity: 'medium',
        description: 'Unusual trading pattern detected: Large volume trades outside normal hours',
        detectedAt: new Date(Date.now() - 7200000),
        source: 'Trading Engine',
        status: 'active',
        mitigation: 'Increased monitoring enabled',
        affectedSystems: ['Trading Platform']
      },
      {
        id: '3',
        type: 'ddos',
        severity: 'low',
        description: 'Minor DDoS attempt blocked by security systems',
        detectedAt: new Date(Date.now() - 10800000),
        source: 'Multiple IPs',
        status: 'resolved',
        mitigation: 'Traffic filtered, sources blacklisted',
        affectedSystems: ['Web Gateway']
      }
    ];
  }

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    return {
      threatLevel: 'medium',
      activeThreats: 2,
      blockedAttempts: 1247,
      suspiciousActivities: 15,
      systemVulnerabilities: 3,
      complianceScore: 94.5,
      lastSecurityScan: new Date(Date.now() - 3600000 * 6)
    };
  }

  async getAuditEvents(limit: number = 50): Promise<AuditEvent[]> {
    const events: AuditEvent[] = [];
    
    for (let i = 0; i < limit; i++) {
      events.push({
        id: (i + 1).toString(),
        timestamp: new Date(Date.now() - Math.random() * 3600000 * 24),
        user: `user_${Math.floor(Math.random() * 100)}`,
        action: ['login', 'logout', 'trade_execution', 'settings_change', 'data_access'][Math.floor(Math.random() * 5)],
        resource: ['user_portal', 'trading_api', 'admin_panel', 'data_export'][Math.floor(Math.random() * 4)],
        outcome: Math.random() > 0.1 ? 'success' : 'failure',
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        riskScore: Math.random() * 100,
        details: {
          sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
          duration: Math.floor(Math.random() * 3600)
        }
      });
    }
    
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getComplianceChecks(): Promise<ComplianceCheck[]> {
    return [
      {
        id: '1',
        regulation: 'MiFID II',
        requirement: 'Transaction reporting within T+1',
        status: 'compliant',
        lastChecked: new Date(Date.now() - 3600000 * 12),
        nextCheck: new Date(Date.now() + 3600000 * 12),
        evidence: ['automated_reports.pdf', 'validation_log.txt']
      },
      {
        id: '2',
        regulation: 'GDPR',
        requirement: 'Data subject consent tracking',
        status: 'compliant',
        lastChecked: new Date(Date.now() - 3600000 * 24),
        nextCheck: new Date(Date.now() + 3600000 * 24 * 7),
        evidence: ['consent_database.db', 'audit_trail.log']
      },
      {
        id: '3',
        regulation: 'SOX',
        requirement: 'Financial controls documentation',
        status: 'partial',
        lastChecked: new Date(Date.now() - 3600000 * 48),
        nextCheck: new Date(Date.now() + 3600000 * 24),
        evidence: ['control_matrix.xlsx'],
        remediation: 'Update quarterly testing documentation'
      }
    ];
  }

  async runSecurityScan(): Promise<{ success: boolean; findings: any[] }> {
    // Simulate security scan
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      findings: [
        {
          category: 'vulnerability',
          severity: 'medium',
          description: 'Outdated SSL certificate detected',
          recommendation: 'Update SSL certificate before expiration'
        },
        {
          category: 'configuration',
          severity: 'low',
          description: 'Default admin account still enabled',
          recommendation: 'Disable or rename default administrative accounts'
        }
      ]
    };
  }

  async updateThreatStatus(threatId: string, status: SecurityThreat['status'], mitigation?: string): Promise<boolean> {
    // Mock implementation
    console.log(`Updating threat ${threatId} to status: ${status}`, mitigation);
    return true;
  }

  async getNetworkTraffic(): Promise<any> {
    return {
      inbound: {
        total: 15600000,
        legitimate: 14200000,
        suspicious: 1200000,
        blocked: 200000
      },
      outbound: {
        total: 8900000,
        normal: 8750000,
        flagged: 150000
      },
      topSources: [
        { ip: '203.0.113.1', requests: 125000, status: 'trusted' },
        { ip: '198.51.100.45', requests: 89000, status: 'suspicious' },
        { ip: '192.0.2.100', requests: 67000, status: 'blocked' }
      ]
    };
  }

  async getEncryptionStatus(): Promise<any> {
    return {
      dataAtRest: {
        encrypted: 98.5,
        algorithms: ['AES-256', 'RSA-2048'],
        keyRotation: 'automated'
      },
      dataInTransit: {
        tlsVersion: 'TLS 1.3',
        certificateExpiry: new Date(Date.now() + 3600000 * 24 * 90),
        hstsEnabled: true
      },
      backups: {
        encrypted: true,
        offsite: true,
        lastVerified: new Date(Date.now() - 3600000 * 24)
      }
    };
  }
}