// Phase 4: Security & Compliance - Anti-Fraud Detection
export interface FraudPattern {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface FraudAlert {
  id: string;
  patternId: string;
  patternName: string;
  userId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  description: string;
  evidence: Record<string, any>;
  timestamp: Date;
  status: 'open' | 'investigating' | 'confirmed' | 'false_positive';
  investigatedBy?: string;
}

export interface UserRiskProfile {
  userId: string;
  riskScore: number;
  lastUpdated: Date;
  factors: {
    accountAge: number;
    tradingHistory: number;
    verificationLevel: number;
    behaviorScore: number;
  };
  flags: string[];
}

export class AntifraudDetectionService {
  private static instance: AntifraudDetectionService;
  private patterns = new Map<string, FraudPattern>();
  private alerts: FraudAlert[] = [];
  private userProfiles = new Map<string, UserRiskProfile>();
  private userSessions = new Map<string, any[]>(); // Track user activities

  static getInstance(): AntifraudDetectionService {
    if (!AntifraudDetectionService.instance) {
      AntifraudDetectionService.instance = new AntifraudDetectionService();
      this.instance.initializePatterns();
    }
    return AntifraudDetectionService.instance;
  }

  private initializePatterns(): void {
    const defaultPatterns: FraudPattern[] = [
      {
        id: 'rapid_trading',
        name: 'Rapid Trading Pattern',
        description: 'Unusual high-frequency trading activity',
        riskLevel: 'medium',
        enabled: true,
        parameters: { 
          tradesPerMinute: 10,
          timeWindow: 60000 // 1 minute
        }
      },
      {
        id: 'large_volume_spike',
        name: 'Large Volume Spike',
        description: 'Sudden large volume trades',
        riskLevel: 'high',
        enabled: true,
        parameters: {
          volumeMultiplier: 10, // 10x normal volume
          baselineWindow: 3600000 // 1 hour
        }
      },
      {
        id: 'unusual_login_pattern',
        name: 'Unusual Login Pattern',
        description: 'Login from suspicious location or device',
        riskLevel: 'high',
        enabled: true,
        parameters: {
          maxGeoDistance: 500, // km
          deviceFingerprint: true
        }
      },
      {
        id: 'pump_dump_detection',
        name: 'Pump and Dump Detection',
        description: 'Coordinated price manipulation',
        riskLevel: 'critical',
        enabled: true,
        parameters: {
          priceIncreaseThreshold: 0.2, // 20%
          volumeIncreaseThreshold: 5, // 5x
          timeWindow: 300000 // 5 minutes
        }
      },
      {
        id: 'account_takeover',
        name: 'Account Takeover',
        description: 'Potential account compromise',
        riskLevel: 'critical',
        enabled: true,
        parameters: {
          passwordChanges: 3,
          settingsChanges: 5,
          timeWindow: 3600000 // 1 hour
        }
      }
    ];

    defaultPatterns.forEach(pattern => this.patterns.set(pattern.id, pattern));
  }

  async analyzeActivity(
    userId: string,
    activity: {
      type: string;
      data: Record<string, any>;
      metadata: {
        ipAddress?: string;
        userAgent?: string;
        deviceId?: string;
        location?: { lat: number; lng: number };
      };
    }
  ): Promise<FraudAlert[]> {
    // Update user session
    this.updateUserSession(userId, activity);

    // Update user risk profile
    await this.updateUserRiskProfile(userId, activity);

    const alerts: FraudAlert[] = [];

    // Check each enabled pattern
    for (const pattern of this.patterns.values()) {
      if (!pattern.enabled) continue;

      const alert = await this.checkPattern(pattern, userId, activity);
      if (alert) {
        alerts.push(alert);
        this.alerts.push(alert);
      }
    }

    return alerts;
  }

  private async checkPattern(
    pattern: FraudPattern,
    userId: string,
    activity: any
  ): Promise<FraudAlert | null> {
    switch (pattern.id) {
      case 'rapid_trading':
        return this.checkRapidTrading(pattern, userId, activity);
      case 'large_volume_spike':
        return this.checkVolumeSpike(pattern, userId, activity);
      case 'unusual_login_pattern':
        return this.checkUnusualLogin(pattern, userId, activity);
      case 'pump_dump_detection':
        return this.checkPumpDump(pattern, userId, activity);
      case 'account_takeover':
        return this.checkAccountTakeover(pattern, userId, activity);
      default:
        return null;
    }
  }

  private async checkRapidTrading(pattern: FraudPattern, userId: string, activity: any): Promise<FraudAlert | null> {
    if (activity.type !== 'trade_executed') return null;

    const userSession = this.userSessions.get(userId) || [];
    const { tradesPerMinute, timeWindow } = pattern.parameters;
    
    const now = Date.now();
    const recentTrades = userSession.filter(a => 
      a.type === 'trade_executed' && 
      (now - a.timestamp) <= timeWindow
    );

    const tradesInWindow = recentTrades.length;
    const actualRate = (tradesInWindow / timeWindow) * 60000; // trades per minute

    if (actualRate > tradesPerMinute) {
      return this.createAlert(pattern, userId, {
        description: `Rapid trading detected: ${actualRate.toFixed(1)} trades/min exceeds ${tradesPerMinute}`,
        actualRate,
        threshold: tradesPerMinute,
        tradeCount: tradesInWindow
      }, 85);
    }

    return null;
  }

  private async checkVolumeSpike(pattern: FraudPattern, userId: string, activity: any): Promise<FraudAlert | null> {
    if (activity.type !== 'trade_executed') return null;

    const { volumeMultiplier, baselineWindow } = pattern.parameters;
    const currentVolume = activity.data.volume || 0;
    
    // Calculate baseline volume (mock)
    const baselineVolume = 10000; // Mock baseline
    
    if (currentVolume > baselineVolume * volumeMultiplier) {
      return this.createAlert(pattern, userId, {
        description: `Large volume spike: ${currentVolume} is ${(currentVolume / baselineVolume).toFixed(1)}x baseline`,
        currentVolume,
        baselineVolume,
        multiplier: currentVolume / baselineVolume
      }, 75);
    }

    return null;
  }

  private async checkUnusualLogin(pattern: FraudPattern, userId: string, activity: any): Promise<FraudAlert | null> {
    if (activity.type !== 'user_login') return null;

    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return null;

    const { location, deviceId } = activity.metadata;
    
    // Check for unusual location (mock check)
    if (location) {
      const isUnusualLocation = Math.random() > 0.8; // 20% chance for demo
      if (isUnusualLocation) {
        return this.createAlert(pattern, userId, {
          description: 'Login from unusual geographic location',
          newLocation: location,
          riskFactors: ['unusual_location']
        }, 70);
      }
    }

    // Check for new device
    if (deviceId) {
      const isNewDevice = Math.random() > 0.9; // 10% chance for demo
      if (isNewDevice) {
        return this.createAlert(pattern, userId, {
          description: 'Login from unrecognized device',
          deviceId,
          riskFactors: ['new_device']
        }, 60);
      }
    }

    return null;
  }

  private async checkPumpDump(pattern: FraudPattern, userId: string, activity: any): Promise<FraudAlert | null> {
    if (activity.type !== 'trade_executed') return null;

    // This would require market data analysis across multiple users
    // Mock implementation for demo
    const isPumpDump = Math.random() > 0.95; // 5% chance for demo
    
    if (isPumpDump) {
      return this.createAlert(pattern, userId, {
        description: 'Potential pump and dump pattern detected',
        symbol: activity.data.symbol,
        priceChange: 0.25,
        volumeIncrease: 8
      }, 90);
    }

    return null;
  }

  private async checkAccountTakeover(pattern: FraudPattern, userId: string, activity: any): Promise<FraudAlert | null> {
    const sensitiveActions = ['password_change', 'email_change', 'withdrawal_address_change'];
    
    if (!sensitiveActions.includes(activity.type)) return null;

    const userSession = this.userSessions.get(userId) || [];
    const { timeWindow } = pattern.parameters;
    
    const now = Date.now();
    const recentSensitiveActions = userSession.filter(a => 
      sensitiveActions.includes(a.type) && 
      (now - a.timestamp) <= timeWindow
    );

    if (recentSensitiveActions.length >= 3) {
      return this.createAlert(pattern, userId, {
        description: 'Multiple sensitive account changes detected',
        actionCount: recentSensitiveActions.length,
        actions: recentSensitiveActions.map(a => a.type)
      }, 95);
    }

    return null;
  }

  async getUserRiskProfile(userId: string): Promise<UserRiskProfile | null> {
    return this.userProfiles.get(userId) || null;
  }

  async updateUserRiskProfile(userId: string, activity: any): Promise<void> {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = {
        userId,
        riskScore: 50, // Start with medium risk
        lastUpdated: new Date(),
        factors: {
          accountAge: 30, // days
          tradingHistory: 50, // score
          verificationLevel: 75, // percentage
          behaviorScore: 50 // score
        },
        flags: []
      };
    }

    // Update factors based on activity
    if (activity.type === 'trade_executed') {
      profile.factors.tradingHistory = Math.min(100, profile.factors.tradingHistory + 1);
    }

    // Recalculate risk score
    profile.riskScore = this.calculateRiskScore(profile.factors);
    profile.lastUpdated = new Date();

    this.userProfiles.set(userId, profile);
  }

  getAlerts(filters?: {
    userId?: string;
    riskLevel?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): FraudAlert[] {
    let filtered = [...this.alerts];

    if (filters) {
      if (filters.userId) {
        filtered = filtered.filter(a => a.userId === filters.userId);
      }
      if (filters.riskLevel) {
        filtered = filtered.filter(a => a.riskLevel === filters.riskLevel);
      }
      if (filters.status) {
        filtered = filtered.filter(a => a.status === filters.status);
      }
      if (filters.startDate) {
        filtered = filtered.filter(a => a.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter(a => a.timestamp <= filters.endDate!);
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async investigateAlert(alertId: string, investigator: string, status: 'investigating' | 'confirmed' | 'false_positive'): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.status = status;
    alert.investigatedBy = investigator;

    return true;
  }

  getPatterns(): FraudPattern[] {
    return Array.from(this.patterns.values());
  }

  updatePattern(patternId: string, updates: Partial<FraudPattern>): boolean {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return false;

    this.patterns.set(patternId, { ...pattern, ...updates });
    return true;
  }

  private updateUserSession(userId: string, activity: any): void {
    const session = this.userSessions.get(userId) || [];
    session.push({
      ...activity,
      timestamp: Date.now()
    });

    // Keep only last 100 activities
    if (session.length > 100) {
      session.splice(0, session.length - 100);
    }

    this.userSessions.set(userId, session);
  }

  private calculateRiskScore(factors: UserRiskProfile['factors']): number {
    const weights = {
      accountAge: 0.2,
      tradingHistory: 0.3,
      verificationLevel: 0.3,
      behaviorScore: 0.2
    };

    return Object.entries(factors).reduce((score, [key, value]) => {
      return score + (value * weights[key as keyof typeof weights]);
    }, 0);
  }

  private createAlert(
    pattern: FraudPattern,
    userId: string,
    evidence: Record<string, any>,
    confidence: number
  ): FraudAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patternId: pattern.id,
      patternName: pattern.name,
      userId,
      riskLevel: pattern.riskLevel,
      confidence,
      description: evidence.description,
      evidence,
      timestamp: new Date(),
      status: 'open'
    };
  }
}
