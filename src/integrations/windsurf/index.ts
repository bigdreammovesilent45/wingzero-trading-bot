/**
 * Windsurf Integration Index
 * 
 * This file exports all Windsurf integration components for easy importing
 * and use throughout the application.
 */

// Configuration
export { 
  windsurfConfig, 
  WindsurfConfigManager, 
  loadWindsurfConfigFromEnv,
  type WindsurfConfig 
} from './config/windsurf.config';

// Service Management
export { 
  windsurfServiceManager, 
  WindsurfServiceManager,
  type WindsurfService 
} from './services/WindsurfServiceManager';

// Integration Interfaces
export { 
  createCursorIntegration,
  CursorIntegrationAdapter,
  type CursorIntegration,
  type WindsurfEvent,
  type MarketDataIntegration,
  type TradingEngineIntegration,
  type RiskManagementIntegration,
  type StrategyManagementIntegration,
  type AIMLIntegration,
  type PerformanceIntegration
} from './interfaces/cursor-integration';

// React Hooks
export { 
  useWindsurfIntegration,
  useWindsurfConfig,
  useWindsurfEvents,
  useWindsurfServiceStatus,
  type WindsurfIntegrationState,
  type WindsurfIntegrationActions
} from './hooks/useWindsurfIntegration';

// Utility functions
export function initializeWindsurfIntegration() {
  console.log('🌊 Initializing Windsurf Integration...');
  
  // Load configuration from environment
  loadWindsurfConfigFromEnv();
  
  // Validate configuration
  const validation = windsurfConfig.validateConfig();
  if (!validation.valid) {
    console.error('❌ Invalid Windsurf configuration:', validation.errors);
    throw new Error(`Invalid Windsurf configuration: ${validation.errors.join(', ')}`);
  }
  
  console.log('✅ Windsurf Integration initialized successfully');
  return windsurfConfig.getConfig();
}

// Health check utility
export async function checkWindsurfHealth() {
  try {
    const health = await windsurfServiceManager.getHealthStatus();
    return health;
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      healthy: false,
      services: {},
      cursorIntegration: false,
      config: { valid: false, errors: [error.message] },
    };
  }
}

// Feature flag utilities
export function isWindsurfFeatureEnabled(feature: string): boolean {
  return windsurfConfig.isFeatureEnabled(feature as any);
}

export function isWindsurfAIEnabled(): boolean {
  return windsurfConfig.isAIEnabled();
}

export function isWindsurfEnterpriseEnabled(): boolean {
  return windsurfConfig.isEnterpriseEnabled();
}

// Service registration utilities
export function registerWindsurfService(service: any) {
  windsurfServiceManager.registerService(service);
}

export function getWindsurfService(name: string) {
  return windsurfServiceManager.getService(name);
}

// Event utilities
export function emitWindsurfEvent(event: any) {
  windsurfServiceManager.emitEvent(event);
}

export function subscribeToWindsurfEvents(callback: (event: any) => void) {
  return windsurfServiceManager.subscribeToEvents(callback);
}

// Configuration utilities
export function updateWindsurfConfig(updates: any) {
  windsurfConfig.updateConfig(updates);
}

export function getWindsurfConfig() {
  return windsurfConfig.getConfig();
}

// Cleanup utility
export async function cleanupWindsurfIntegration() {
  console.log('🧹 Cleaning up Windsurf Integration...');
  await windsurfServiceManager.cleanup();
  console.log('✅ Windsurf Integration cleanup complete');
}

// Development utilities
export function enableWindsurfDebugMode() {
  windsurfConfig.updateConfig({
    integration: {
      logLevel: 'debug',
    },
  });
  console.log('🐛 Windsurf debug mode enabled');
}

export function disableWindsurfDebugMode() {
  windsurfConfig.updateConfig({
    integration: {
      logLevel: 'info',
    },
  });
  console.log('🐛 Windsurf debug mode disabled');
}

// Version information
export const WINDSURF_VERSION = '1.0.0';
export const WINDSURF_INTEGRATION_VERSION = '1.0.0';

// Export version info
export function getWindsurfVersionInfo() {
  return {
    version: WINDSURF_VERSION,
    integrationVersion: WINDSURF_INTEGRATION_VERSION,
    buildDate: new Date().toISOString(),
    features: windsurfConfig.getFeaturesConfig(),
    config: windsurfConfig.getConfig(),
  };
}