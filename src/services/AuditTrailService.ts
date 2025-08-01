// Phase 4: Security & Compliance - Audit Trail Service
export interface AuditEvent {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  resource?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditMetrics {
  totalEvents: number;
  criticalEvents: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  securityAlerts: number;
}

export class AuditTrailService {
  private static instance: AuditTrailService;
  private events: AuditEvent[] = [];
  private maxEvents: number = 100000; // Keep last 100k events in memory

  static getInstance(): AuditTrailService {
    if (!AuditTrailService.instance) {
      AuditTrailService.instance = new AuditTrailService();
    }
    return AuditTrailService.instance;
  }

  async logEvent(
    userId: string,
    action: string,
    resource: string,
    details: Record<string, any> = {},
    request?: { ip?: string; userAgent?: string }
  ): Promise<string> {
    const event: AuditEvent = {
      id: this.generateEventId(),
      userId,
      action,
      resource,
      details: { ...details },
      ipAddress: request?.ip || 'unknown',
      userAgent: request?.userAgent || 'unknown',
      timestamp: new Date(),
      severity: this.determineSeverity(action, resource, details)
    };

    this.events.push(event);

    // Maintain max events limit
    if (this.events.length > this.maxEvents) {
      this.events.shift(); // Remove oldest event
    }

    // Check for security alerts
    await this.checkSecurityAlerts(event);

    return event.id;
  }

  async queryEvents(query: AuditQuery): Promise<AuditEvent[]> {
    let filteredEvents = [...this.events];

    // Apply filters
    if (query.userId) {
      filteredEvents = filteredEvents.filter(e => e.userId === query.userId);
    }

    if (query.action) {
      filteredEvents = filteredEvents.filter(e => 
        e.action.toLowerCase().includes(query.action!.toLowerCase())
      );
    }

    if (query.resource) {
      filteredEvents = filteredEvents.filter(e => 
        e.resource.toLowerCase().includes(query.resource!.toLowerCase())
      );
    }

    if (query.severity) {
      filteredEvents = filteredEvents.filter(e => e.severity === query.severity);
    }

    if (query.startDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= query.endDate!);
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    return filteredEvents.slice(offset, offset + limit);
  }

  async getEvent(eventId: string): Promise<AuditEvent | null> {
    return this.events.find(e => e.id === eventId) || null;
  }

  async getMetrics(timeRange?: { start: Date; end: Date }): Promise<AuditMetrics> {
    let events = this.events;

    if (timeRange) {
      events = events.filter(e => 
        e.timestamp >= timeRange.start && e.timestamp <= timeRange.end
      );
    }

    const totalEvents = events.length;
    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    const uniqueUsers = new Set(events.map(e => e.userId)).size;
    const securityAlerts = events.filter(e => this.isSecurityAlert(e)).length;

    // Calculate top actions
    const actionCounts = new Map<string, number>();
    events.forEach(e => {
      actionCounts.set(e.action, (actionCounts.get(e.action) || 0) + 1);
    });

    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents,
      criticalEvents,
      uniqueUsers,
      topActions,
      securityAlerts
    };
  }

  async exportEvents(query: AuditQuery, format: 'json' | 'csv' = 'json'): Promise<string> {
    const events = await this.queryEvents(query);

    if (format === 'csv') {
      return this.eventsToCSV(events);
    }

    return JSON.stringify(events, null, 2);
  }

  async clearEvents(olderThan?: Date): Promise<number> {
    const originalLength = this.events.length;
    
    if (olderThan) {
      this.events = this.events.filter(e => e.timestamp >= olderThan);
    } else {
      this.events = [];
    }

    return originalLength - this.events.length;
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(
    action: string,
    resource: string,
    details: Record<string, any>
  ): 'low' | 'medium' | 'high' | 'critical' {
    const actionLower = action.toLowerCase();
    const resourceLower = resource.toLowerCase();

    // Critical actions
    if (actionLower.includes('delete') && resourceLower.includes('user')) return 'critical';
    if (actionLower.includes('permission') && actionLower.includes('grant')) return 'critical';
    if (actionLower.includes('security') && actionLower.includes('disable')) return 'critical';

    // High severity actions
    if (actionLower.includes('login') && details.failed) return 'high';
    if (actionLower.includes('password') && actionLower.includes('change')) return 'high';
    if (actionLower.includes('api_key') && actionLower.includes('generate')) return 'high';

    // Medium severity actions
    if (actionLower.includes('trade') && actionLower.includes('execute')) return 'medium';
    if (actionLower.includes('withdrawal')) return 'medium';
    if (actionLower.includes('settings') && actionLower.includes('update')) return 'medium';

    // Default to low
    return 'low';
  }

  private async checkSecurityAlerts(event: AuditEvent): Promise<void> {
    // Check for suspicious patterns
    const recentEvents = this.events.filter(e => 
      e.userId === event.userId && 
      Date.now() - e.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    // Multiple failed login attempts
    const failedLogins = recentEvents.filter(e => 
      e.action.includes('login') && e.details.failed
    );

    if (failedLogins.length >= 3) {
      await this.logEvent(
        event.userId,
        'security_alert_multiple_failed_logins',
        'authentication',
        { attemptCount: failedLogins.length, ipAddress: event.ipAddress },
        { ip: event.ipAddress, userAgent: event.userAgent }
      );
    }

    // Unusual IP address
    const userEvents = this.events.filter(e => e.userId === event.userId);
    const commonIPs = userEvents
      .map(e => e.ipAddress)
      .filter(ip => ip !== 'unknown');
    
    const uniqueIPs = [...new Set(commonIPs)];
    if (uniqueIPs.length > 0 && !uniqueIPs.includes(event.ipAddress)) {
      await this.logEvent(
        event.userId,
        'security_alert_unusual_ip',
        'authentication',
        { newIP: event.ipAddress, knownIPs: uniqueIPs },
        { ip: event.ipAddress, userAgent: event.userAgent }
      );
    }
  }

  private isSecurityAlert(event: AuditEvent): boolean {
    return event.action.includes('security_alert') || event.severity === 'critical';
  }

  private eventsToCSV(events: AuditEvent[]): string {
    const headers = ['ID', 'User ID', 'Action', 'Resource', 'Severity', 'IP Address', 'Timestamp'];
    const rows = events.map(e => [
      e.id,
      e.userId,
      e.action,
      e.resource,
      e.severity,
      e.ipAddress,
      e.timestamp.toISOString()
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }
}