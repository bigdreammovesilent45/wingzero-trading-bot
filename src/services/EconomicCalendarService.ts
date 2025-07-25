export interface EconomicEvent {
  id: string;
  title: string;
  description: string;
  country: string;
  currency: string;
  impact: 'low' | 'medium' | 'high';
  actual?: number;
  forecast?: number;
  previous?: number;
  timestamp: Date;
  affectedSymbols: string[];
  impactScore: number; // -1 to 1
}

export interface EconomicCalendar {
  events: EconomicEvent[];
  nextMajorEvent?: EconomicEvent;
  todayHighImpact: EconomicEvent[];
  thisWeekEvents: EconomicEvent[];
}

export class EconomicCalendarService {
  private events: EconomicEvent[] = [];
  private lastUpdate: Date = new Date(0);
  private updateInterval = 60 * 60 * 1000; // 1 hour

  async initialize(): Promise<void> {
    console.log('📅 Economic Calendar Service initialized');
    await this.loadEconomicEvents();
  }

  async getTodaysEvents(): Promise<EconomicEvent[]> {
    await this.ensureDataIsFresh();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return this.events.filter(event => 
      event.timestamp >= today && event.timestamp < tomorrow
    );
  }

  async getHighImpactEvents(): Promise<EconomicEvent[]> {
    await this.ensureDataIsFresh();
    
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return this.events.filter(event => 
      event.impact === 'high' && 
      event.timestamp >= now && 
      event.timestamp <= next24Hours
    );
  }

  async getEventsForSymbol(symbol: string): Promise<EconomicEvent[]> {
    await this.ensureDataIsFresh();
    
    return this.events.filter(event => 
      event.affectedSymbols.includes(symbol)
    );
  }

  async getNextMajorEvent(): Promise<EconomicEvent | null> {
    const highImpactEvents = await this.getHighImpactEvents();
    
    if (highImpactEvents.length === 0) return null;
    
    return highImpactEvents.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    )[0];
  }

  async getMarketImpactScore(timeWindow: number = 60): Promise<number> {
    // Calculate overall market impact in the next X minutes
    const now = new Date();
    const windowEnd = new Date(now.getTime() + timeWindow * 60 * 1000);
    
    const upcomingEvents = this.events.filter(event => 
      event.timestamp >= now && event.timestamp <= windowEnd
    );
    
    const totalImpact = upcomingEvents.reduce((sum, event) => {
      const impactWeight = event.impact === 'high' ? 1 : event.impact === 'medium' ? 0.5 : 0.2;
      return sum + (event.impactScore * impactWeight);
    }, 0);
    
    // Normalize to -1 to 1 scale
    return Math.max(-1, Math.min(1, totalImpact / 5));
  }

  async shouldAvoidTrading(symbol: string, minutesAhead: number = 30): Promise<boolean> {
    const now = new Date();
    const checkUntil = new Date(now.getTime() + minutesAhead * 60 * 1000);
    
    const relevantEvents = this.events.filter(event => 
      event.affectedSymbols.includes(symbol) &&
      event.impact === 'high' &&
      event.timestamp >= now &&
      event.timestamp <= checkUntil
    );
    
    return relevantEvents.length > 0;
  }

  private async ensureDataIsFresh(): Promise<void> {
    const now = new Date();
    
    if (now.getTime() - this.lastUpdate.getTime() > this.updateInterval) {
      await this.loadEconomicEvents();
      this.lastUpdate = now;
    }
  }

  private async loadEconomicEvents(): Promise<void> {
    try {
      // In production, fetch from economic calendar API
      // For now, generate mock events
      this.events = this.generateMockEvents();
      console.log(`📊 Loaded ${this.events.length} economic events`);
      
    } catch (error) {
      console.error('Error loading economic events:', error);
      this.events = this.generateMockEvents();
    }
  }

  private generateMockEvents(): EconomicEvent[] {
    const now = new Date();
    const events: EconomicEvent[] = [];
    
    // Generate events for the next 7 days
    for (let i = 0; i < 7; i++) {
      const eventDate = new Date(now);
      eventDate.setDate(now.getDate() + i);
      
      // NFP (if Friday)
      if (eventDate.getDay() === 5) {
        events.push({
          id: `nfp_${eventDate.getTime()}`,
          title: 'Non-Farm Payrolls',
          description: 'Monthly employment change excluding agricultural sector',
          country: 'United States',
          currency: 'USD',
          impact: 'high',
          forecast: 180000,
          previous: 206000,
          timestamp: new Date(eventDate.setHours(13, 30, 0, 0)), // 1:30 PM
          affectedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCHF', 'USDCAD'],
          impactScore: Math.random() > 0.5 ? 0.8 : -0.8
        });
      }
      
      // CPI (if day 15 of month)
      if (eventDate.getDate() === 15) {
        events.push({
          id: `cpi_${eventDate.getTime()}`,
          title: 'Consumer Price Index',
          description: 'Monthly inflation rate',
          country: 'United States',
          currency: 'USD',
          impact: 'high',
          forecast: 3.2,
          previous: 3.4,
          timestamp: new Date(eventDate.setHours(13, 30, 0, 0)),
          affectedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'],
          impactScore: Math.random() > 0.5 ? 0.6 : -0.6
        });
      }
      
      // ECB events
      if (i === 2) {
        events.push({
          id: `ecb_${eventDate.getTime()}`,
          title: 'ECB Interest Rate Decision',
          description: 'European Central Bank monetary policy decision',
          country: 'European Union',
          currency: 'EUR',
          impact: 'high',
          forecast: 4.25,
          previous: 4.25,
          timestamp: new Date(eventDate.setHours(12, 15, 0, 0)),
          affectedSymbols: ['EURUSD', 'EURGBP', 'EURJPY', 'EURCHF'],
          impactScore: Math.random() > 0.5 ? 0.7 : -0.7
        });
      }
      
      // Daily medium impact events
      events.push({
        id: `retail_${eventDate.getTime()}`,
        title: 'Retail Sales',
        description: 'Monthly retail sales change',
        country: 'United States',
        currency: 'USD',
        impact: 'medium',
        forecast: 0.5,
        previous: 0.7,
        timestamp: new Date(eventDate.setHours(13, 30, 0, 0)),
        affectedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY'],
        impactScore: Math.random() > 0.5 ? 0.4 : -0.4
      });
      
      // Manufacturing PMI
      events.push({
        id: `pmi_${eventDate.getTime()}`,
        title: 'Manufacturing PMI',
        description: 'Manufacturing Purchasing Managers Index',
        country: 'European Union',
        currency: 'EUR',
        impact: 'medium',
        forecast: 48.5,
        previous: 47.8,
        timestamp: new Date(eventDate.setHours(9, 0, 0, 0)),
        affectedSymbols: ['EURUSD', 'EURGBP'],
        impactScore: Math.random() > 0.5 ? 0.3 : -0.3
      });
    }
    
    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Helper methods
  public getEventImpactForSymbol(event: EconomicEvent, symbol: string): number {
    if (!event.affectedSymbols.includes(symbol)) return 0;
    
    const impactMultiplier = event.impact === 'high' ? 1 : event.impact === 'medium' ? 0.6 : 0.3;
    return event.impactScore * impactMultiplier;
  }

  public getTimeUntilEvent(event: EconomicEvent): number {
    return event.timestamp.getTime() - Date.now();
  }

  public isEventImminent(event: EconomicEvent, minutesThreshold: number = 15): boolean {
    const timeUntil = this.getTimeUntilEvent(event);
    return timeUntil > 0 && timeUntil <= minutesThreshold * 60 * 1000;
  }

  public formatEventTime(event: EconomicEvent): string {
    return event.timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  public getEventsByImpact(impact: 'low' | 'medium' | 'high'): EconomicEvent[] {
    return this.events.filter(event => event.impact === impact);
  }

  public getEventsByCurrency(currency: string): EconomicEvent[] {
    return this.events.filter(event => event.currency === currency);
  }
}