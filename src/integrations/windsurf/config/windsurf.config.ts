/**
 * Windsurf Configuration
 * 
 * This file contains Windsurf-specific configurations that work alongside
 * Cursor's existing setup without interference.
 */

export interface WindsurfConfig {
  // AI/ML Configuration
  ai: {
    enabled: boolean;
    modelEndpoint: string;
    maxConcurrentRequests: number;
    timeoutMs: number;
    retryAttempts: number;
    confidenceThreshold: number;
  };
  
  // Enterprise Features
  enterprise: {
    enabled: boolean;
    multiAccountSupport: boolean;
    advancedCompliance: boolean;
    institutionalFeatures: boolean;
    auditTrailEnabled: boolean;
  };
  
  // Performance & Scalability
  performance: {
    webAssemblyEnabled: boolean;
    multiThreadingEnabled: boolean;
    cacheEnabled: boolean;
    cacheSize: number;
    optimizationLevel: 'low' | 'medium' | 'high';
  };
  
  // Security & Compliance
  security: {
    encryptionEnabled: boolean;
    mfaRequired: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    ipWhitelistEnabled: boolean;
  };
  
  // Feature Flags
  features: {
    advancedSentimentAnalysis: boolean;
    predictiveModeling: boolean;
    portfolioOptimization: boolean;
    riskParityAlgorithms: boolean;
    socialTrading: boolean;
    copyTrading: boolean;
  };
  
  // Integration Settings
  integration: {
    autoStart: boolean;
    gracefulDegradation: boolean;
    healthCheckInterval: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// Default configuration
export const defaultWindsurfConfig: WindsurfConfig = {
  ai: {
    enabled: true,
    modelEndpoint: process.env.WINDSURF_AI_ENDPOINT || 'https://api.windsurf.ai/v1',
    maxConcurrentRequests: 10,
    timeoutMs: 30000,
    retryAttempts: 3,
    confidenceThreshold: 0.85,
  },
  
  enterprise: {
    enabled: false,
    multiAccountSupport: false,
    advancedCompliance: false,
    institutionalFeatures: false,
    auditTrailEnabled: true,
  },
  
  performance: {
    webAssemblyEnabled: true,
    multiThreadingEnabled: true,
    cacheEnabled: true,
    cacheSize: 1000,
    optimizationLevel: 'medium',
  },
  
  security: {
    encryptionEnabled: true,
    mfaRequired: false,
    sessionTimeout: 3600000, // 1 hour
    maxLoginAttempts: 5,
    ipWhitelistEnabled: false,
  },
  
  features: {
    advancedSentimentAnalysis: true,
    predictiveModeling: true,
    portfolioOptimization: false,
    riskParityAlgorithms: false,
    socialTrading: false,
    copyTrading: false,
  },
  
  integration: {
    autoStart: false,
    gracefulDegradation: true,
    healthCheckInterval: 30000, // 30 seconds
    logLevel: 'info',
  },
};

// Configuration manager
export class WindsurfConfigManager {
  private config: WindsurfConfig;
  
  constructor(initialConfig?: Partial<WindsurfConfig>) {
    this.config = {
      ...defaultWindsurfConfig,
      ...initialConfig,
    };
  }
  
  // Get current configuration
  getConfig(): WindsurfConfig {
    return { ...this.config };
  }
  
  // Update configuration
  updateConfig(updates: Partial<WindsurfConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }
  
  // Get specific section
  getAIConfig() {
    return this.config.ai;
  }
  
  getEnterpriseConfig() {
    return this.config.enterprise;
  }
  
  getPerformanceConfig() {
    return this.config.performance;
  }
  
  getSecurityConfig() {
    return this.config.security;
  }
  
  getFeaturesConfig() {
    return this.config.features;
  }
  
  getIntegrationConfig() {
    return this.config.integration;
  }
  
  // Feature flag checks
  isFeatureEnabled(feature: keyof WindsurfConfig['features']): boolean {
    return this.config.features[feature];
  }
  
  isAIEnabled(): boolean {
    return this.config.ai.enabled;
  }
  
  isEnterpriseEnabled(): boolean {
    return this.config.enterprise.enabled;
  }
  
  // Validation
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (this.config.ai.timeoutMs < 1000) {
      errors.push('AI timeout must be at least 1000ms');
    }
    
    if (this.config.performance.cacheSize < 100) {
      errors.push('Cache size must be at least 100');
    }
    
    if (this.config.security.sessionTimeout < 300000) {
      errors.push('Session timeout must be at least 5 minutes');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Global configuration instance
export const windsurfConfig = new WindsurfConfigManager();

// Environment-based configuration loading
export function loadWindsurfConfigFromEnv(): void {
  const envConfig: Partial<WindsurfConfig> = {
    ai: {
      enabled: process.env.WINDSURF_AI_ENABLED === 'true',
      modelEndpoint: process.env.WINDSURF_AI_ENDPOINT,
      maxConcurrentRequests: parseInt(process.env.WINDSURF_AI_MAX_CONCURRENT || '10'),
      timeoutMs: parseInt(process.env.WINDSURF_AI_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.WINDSURF_AI_RETRY_ATTEMPTS || '3'),
      confidenceThreshold: parseFloat(process.env.WINDSURF_AI_CONFIDENCE_THRESHOLD || '0.85'),
    },
    
    enterprise: {
      enabled: process.env.WINDSURF_ENTERPRISE_ENABLED === 'true',
      multiAccountSupport: process.env.WINDSURF_MULTI_ACCOUNT === 'true',
      advancedCompliance: process.env.WINDSURF_ADVANCED_COMPLIANCE === 'true',
      institutionalFeatures: process.env.WINDSURF_INSTITUTIONAL === 'true',
      auditTrailEnabled: process.env.WINDSURF_AUDIT_TRAIL !== 'false',
    },
    
    features: {
      advancedSentimentAnalysis: process.env.WINDSURF_SENTIMENT_ANALYSIS !== 'false',
      predictiveModeling: process.env.WINDSURF_PREDICTIVE_MODELING !== 'false',
      portfolioOptimization: process.env.WINDSURF_PORTFOLIO_OPTIMIZATION === 'true',
      riskParityAlgorithms: process.env.WINDSURF_RISK_PARITY === 'true',
      socialTrading: process.env.WINDSURF_SOCIAL_TRADING === 'true',
      copyTrading: process.env.WINDSURF_COPY_TRADING === 'true',
    },
    
    integration: {
      autoStart: process.env.WINDSURF_AUTO_START === 'true',
      gracefulDegradation: process.env.WINDSURF_GRACEFUL_DEGRADATION !== 'false',
      healthCheckInterval: parseInt(process.env.WINDSURF_HEALTH_CHECK_INTERVAL || '30000'),
      logLevel: (process.env.WINDSURF_LOG_LEVEL as any) || 'info',
    },
  };
  
  windsurfConfig.updateConfig(envConfig);
}

// Load configuration from environment on module load
if (typeof window !== 'undefined') {
  // Browser environment
  loadWindsurfConfigFromEnv();
}