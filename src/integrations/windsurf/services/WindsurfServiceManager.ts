/**
 * Windsurf Service Manager
 * 
 * This service manager provides a centralized way for Windsurf to manage
 * its services and integrate safely with Cursor's existing system.
 */

import { windsurfConfig } from '../config/windsurf.config';
import { CursorIntegration, createCursorIntegration } from '../interfaces/cursor-integration';
import { WindsurfEvent } from '../interfaces/cursor-integration';

// Import Cursor's services (these will be injected)
import { TradingBrain } from '@/services/TradingBrain';
import { MarketDataService } from '@/services/MarketDataService';
import { RiskManager } from '@/services/RiskManager';
import { OrderManager } from '@/services/OrderManager';
import { StrategyManager } from '@/services/StrategyManager';

export interface WindsurfService {
  name: string;
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
  getHealth(): Promise<{ healthy: boolean; details: any }>;
}

export class WindsurfServiceManager {
  private services: Map<string, WindsurfService> = new Map();
  private cursorIntegration: CursorIntegration | null = null;
  private isInitialized = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.setupHealthMonitoring();
  }
  
  /**
   * Initialize the Windsurf service manager with Cursor's services
   */
  async initialize(
    tradingBrain: TradingBrain,
    marketDataService: MarketDataService,
    riskManager: RiskManager,
    orderManager: OrderManager,
    strategyManager: StrategyManager
  ): Promise<void> {
    if (this.isInitialized) {
      console.warn('WindsurfServiceManager already initialized');
      return;
    }
    
    console.log('🚀 Initializing Windsurf Service Manager...');
    
    try {
      // Create Cursor integration adapter
      this.cursorIntegration = createCursorIntegration(
        tradingBrain,
        marketDataService,
        riskManager,
        orderManager,
        strategyManager
      );
      
      // Validate configuration
      const configValidation = windsurfConfig.validateConfig();
      if (!configValidation.valid) {
        throw new Error(`Invalid Windsurf configuration: ${configValidation.errors.join(', ')}`);
      }
      
      // Initialize all registered services
      for (const [name, service] of this.services) {
        try {
          console.log(`📦 Initializing Windsurf service: ${name}`);
          await service.initialize();
        } catch (error) {
          console.error(`❌ Failed to initialize Windsurf service ${name}:`, error);
          if (!windsurfConfig.getIntegrationConfig().gracefulDegradation) {
            throw error;
          }
        }
      }
      
      this.isInitialized = true;
      console.log('✅ Windsurf Service Manager initialized successfully');
      
      // Auto-start if configured
      if (windsurfConfig.getIntegrationConfig().autoStart) {
        await this.start();
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize Windsurf Service Manager:', error);
      throw error;
    }
  }
  
  /**
   * Start all Windsurf services
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('WindsurfServiceManager must be initialized before starting');
    }
    
    console.log('🚀 Starting Windsurf services...');
    
    for (const [name, service] of this.services) {
      try {
        if (!service.isRunning()) {
          console.log(`▶️ Starting Windsurf service: ${name}`);
          await service.start();
        }
      } catch (error) {
        console.error(`❌ Failed to start Windsurf service ${name}:`, error);
        if (!windsurfConfig.getIntegrationConfig().gracefulDegradation) {
          throw error;
        }
      }
    }
    
    console.log('✅ All Windsurf services started');
  }
  
  /**
   * Stop all Windsurf services
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Windsurf services...');
    
    for (const [name, service] of this.services) {
      try {
        if (service.isRunning()) {
          console.log(`⏹️ Stopping Windsurf service: ${name}`);
          await service.stop();
        }
      } catch (error) {
        console.error(`❌ Failed to stop Windsurf service ${name}:`, error);
      }
    }
    
    console.log('✅ All Windsurf services stopped');
  }
  
  /**
   * Register a Windsurf service
   */
  registerService(service: WindsurfService): void {
    if (this.services.has(service.name)) {
      console.warn(`Service ${service.name} already registered, overwriting`);
    }
    
    this.services.set(service.name, service);
    console.log(`📝 Registered Windsurf service: ${service.name}`);
  }
  
  /**
   * Get a Windsurf service by name
   */
  getService(name: string): WindsurfService | undefined {
    return this.services.get(name);
  }
  
  /**
   * Get all registered services
   */
  getAllServices(): WindsurfService[] {
    return Array.from(this.services.values());
  }
  
  /**
   * Get Cursor integration interface
   */
  getCursorIntegration(): CursorIntegration | null {
    return this.cursorIntegration;
  }
  
  /**
   * Emit a Windsurf event
   */
  emitEvent(event: Omit<WindsurfEvent, 'source' | 'timestamp'>): void {
    if (!this.cursorIntegration) {
      console.warn('Cannot emit event: Cursor integration not available');
      return;
    }
    
    const fullEvent: WindsurfEvent = {
      ...event,
      source: 'windsurf',
      timestamp: new Date(),
    };
    
    this.cursorIntegration.emitEvent(fullEvent);
  }
  
  /**
   * Subscribe to events from Cursor
   */
  subscribeToEvents(callback: (event: WindsurfEvent) => void): (() => void) | null {
    if (!this.cursorIntegration) {
      console.warn('Cannot subscribe to events: Cursor integration not available');
      return null;
    }
    
    return this.cursorIntegration.subscribeToEvents(callback);
  }
  
  /**
   * Get overall health status
   */
  async getHealthStatus(): Promise<{
    healthy: boolean;
    services: { [name: string]: { healthy: boolean; details: any } };
    cursorIntegration: boolean;
    config: { valid: boolean; errors: string[] };
  }> {
    const serviceHealth: { [name: string]: { healthy: boolean; details: any } } = {};
    let allServicesHealthy = true;
    
    // Check each service
    for (const [name, service] of this.services) {
      try {
        const health = await service.getHealth();
        serviceHealth[name] = health;
        if (!health.healthy) {
          allServicesHealthy = false;
        }
      } catch (error) {
        serviceHealth[name] = { healthy: false, details: { error: error.message } };
        allServicesHealthy = false;
      }
    }
    
    // Check Cursor integration
    const cursorIntegrationHealthy = this.cursorIntegration ? await this.cursorIntegration.isHealthy() : false;
    
    // Check configuration
    const configValidation = windsurfConfig.validateConfig();
    
    const overallHealthy = allServicesHealthy && cursorIntegrationHealthy && configValidation.valid;
    
    return {
      healthy: overallHealthy,
      services: serviceHealth,
      cursorIntegration: cursorIntegrationHealthy,
      config: configValidation,
    };
  }
  
  /**
   * Setup health monitoring
   */
  private setupHealthMonitoring(): void {
    const interval = windsurfConfig.getIntegrationConfig().healthCheckInterval;
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthStatus();
        
        if (!health.healthy) {
          console.warn('⚠️ Windsurf health check failed:', health);
          
          // Emit health event
          this.emitEvent({
            type: 'health_check_failed',
            payload: health,
          });
        }
      } catch (error) {
        console.error('❌ Health check error:', error);
      }
    }, interval);
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Windsurf Service Manager...');
    
    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Stop all services
    await this.stop();
    
    // Shutdown Cursor integration
    if (this.cursorIntegration) {
      await this.cursorIntegration.shutdown();
    }
    
    // Clear services
    this.services.clear();
    this.isInitialized = false;
    
    console.log('✅ Windsurf Service Manager cleanup complete');
  }
  
  /**
   * Get service status
   */
  getServiceStatus(): {
    initialized: boolean;
    serviceCount: number;
    runningServices: number;
  } {
    let runningCount = 0;
    for (const service of this.services.values()) {
      if (service.isRunning()) {
        runningCount++;
      }
    }
    
    return {
      initialized: this.isInitialized,
      serviceCount: this.services.size,
      runningServices: runningCount,
    };
  }
}

// Global Windsurf service manager instance
export const windsurfServiceManager = new WindsurfServiceManager();