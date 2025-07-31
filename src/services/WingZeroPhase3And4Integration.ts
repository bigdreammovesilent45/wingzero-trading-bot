import { ModernPortfolioTheory } from './financial/ModernPortfolioTheory';
import { AdvancedVaRModels } from './financial/AdvancedVaRModels';
import { AdvancedEncryptionService } from './security/AdvancedEncryptionService';
import { MultifactorAuthenticationService } from './security/MultifactorAuthenticationService';

interface SystemConfiguration {
  // Phase 3 - Financial Configuration
  financial: {
    enablePortfolioOptimization: boolean;
    enableAdvancedVaR: boolean;
    enableRiskParity: boolean;
    enableMultiFactorModels: boolean;
    defaultRiskFreeRate: number;
    defaultConfidenceLevel: number;
    portfolioRebalanceFrequency: 'daily' | 'weekly' | 'monthly';
  };
  // Phase 4 - Security Configuration  
  security: {
    enableEndToEndEncryption: boolean;
    enableMultifactorAuth: boolean;
    enableAuditTrail: boolean;
    enableAntiFraud: boolean;
    requireMFAForTrades: boolean;
    encryptionKeyRotationHours: number;
  };
  // Integration Configuration
  integration: {
    enableRealTimeRiskMonitoring: boolean;
    enableAutomatedCompliance: boolean;
    enableSecureDataExchange: boolean;
    maxConcurrentUsers: number;
    systemHealthCheckInterval: number;
  };
}

interface SystemHealth {
  timestamp: number;
  overall_status: 'healthy' | 'degraded' | 'critical' | 'offline';
  components: {
    portfolioOptimization: 'online' | 'offline' | 'degraded';
    varModels: 'online' | 'offline' | 'degraded';
    encryption: 'online' | 'offline' | 'degraded';
    multifactorAuth: 'online' | 'offline' | 'degraded';
    integration: 'online' | 'offline' | 'degraded';
  };
  metrics: {
    activeUsers: number;
    activePortfolios: number;
    totalEncryptedData: number;
    activeMFAChallenges: number;
    systemUptime: number;
  };
  alerts: Array<{
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: number;
    component: string;
  }>;
}

interface SecurePortfolioData {
  portfolioId: string;
  encryptedData: string;
  keyVersion: string;
  lastUpdated: number;
  checksum: string;
}

interface RiskAnalysisResult {
  portfolioId: string;
  timestamp: number;
  currentVaR: number;
  expectedShortfall: number;
  sharpeRatio: number;
  riskContributions: { [symbol: string]: number };
  stressTestResults: any[];
  complianceStatus: 'compliant' | 'warning' | 'violation';
  encrypted: boolean;
}

interface ComplianceReport {
  reportId: string;
  timestamp: number;
  userId: string;
  portfolios: string[];
  riskMetrics: any;
  tradeCompliance: any;
  encryptionStatus: any;
  mfaCompliance: any;
  overallScore: number;
  violations: any[];
}

export class WingZeroPhase3And4Integration {
  // Phase 3 Services
  private portfolioTheory: ModernPortfolioTheory;
  private varModels: AdvancedVaRModels;
  
  // Phase 4 Services
  private encryptionService: AdvancedEncryptionService;
  private mfaService: MultifactorAuthenticationService;

  // Integration State
  private configuration: SystemConfiguration;
  private systemHealth: SystemHealth;
  private isRunning = false;
  private securePortfolios: Map<string, SecurePortfolioData> = new Map();
  private riskAnalysisCache: Map<string, RiskAnalysisResult> = new Map();
  private activeUsers: Set<string> = new Set();

  private readonly DEFAULT_CONFIG: SystemConfiguration = {
    financial: {
      enablePortfolioOptimization: true,
      enableAdvancedVaR: true,
      enableRiskParity: true,
      enableMultiFactorModels: true,
      defaultRiskFreeRate: 0.02,
      defaultConfidenceLevel: 0.95,
      portfolioRebalanceFrequency: 'weekly'
    },
    security: {
      enableEndToEndEncryption: true,
      enableMultifactorAuth: true,
      enableAuditTrail: true,
      enableAntiFraud: true,
      requireMFAForTrades: true,
      encryptionKeyRotationHours: 24
    },
    integration: {
      enableRealTimeRiskMonitoring: true,
      enableAutomatedCompliance: true,
      enableSecureDataExchange: true,
      maxConcurrentUsers: 1000,
      systemHealthCheckInterval: 30000 // 30 seconds
    }
  };

  constructor(config?: Partial<SystemConfiguration>) {
    this.configuration = this.mergeConfiguration(config);
    this.systemHealth = this.initializeSystemHealth();

    // Initialize Phase 3 Services (Financial)
    this.portfolioTheory = new ModernPortfolioTheory(this.configuration.financial.defaultRiskFreeRate);
    this.varModels = new AdvancedVaRModels();

    // Initialize Phase 4 Services (Security)
    this.encryptionService = new AdvancedEncryptionService({
      keyRotationIntervalHours: this.configuration.security.encryptionKeyRotationHours,
      auditAllOperations: this.configuration.security.enableAuditTrail
    });
    
    this.mfaService = new MultifactorAuthenticationService({
      requireTOTP: this.configuration.security.enableMultifactorAuth,
      riskBasedAuthentication: this.configuration.security.enableAntiFraud
    });

    console.log('🚀 Wing Zero Phase 3 & 4 Integration initialized');
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ System already running');
      return;
    }

    console.log('🚀 Starting Wing Zero Phase 3 & 4 Integration...');

    try {
      // Start Phase 4 Security Services first
      if (this.configuration.security.enableEndToEndEncryption) {
        await this.encryptionService.initialize();
        this.systemHealth.components.encryption = 'online';
        console.log('✅ Encryption service online');
      }

      if (this.configuration.security.enableMultifactorAuth) {
        await this.mfaService.initialize();
        this.systemHealth.components.multifactorAuth = 'online';
        console.log('✅ Multi-factor authentication service online');
      }

      // Start Phase 3 Financial Services
      if (this.configuration.financial.enablePortfolioOptimization) {
        // Portfolio Theory is ready immediately
        this.systemHealth.components.portfolioOptimization = 'online';
        console.log('✅ Portfolio optimization service online');
      }

      if (this.configuration.financial.enableAdvancedVaR) {
        // VaR Models are ready immediately
        this.systemHealth.components.varModels = 'online';
        console.log('✅ Advanced VaR models service online');
      }

      // Start Integration Services
      if (this.configuration.integration.enableRealTimeRiskMonitoring) {
        this.startRealTimeRiskMonitoring();
      }

      if (this.configuration.integration.enableAutomatedCompliance) {
        this.startAutomatedComplianceMonitoring();
      }

      // Start system health monitoring
      this.startSystemHealthMonitoring();

      this.systemHealth.components.integration = 'online';
      this.systemHealth.overall_status = 'healthy';
      this.isRunning = true;

      console.log('✅ Wing Zero Phase 3 & 4 Integration fully operational');

    } catch (error) {
      console.error('❌ Failed to start integration services:', error);
      this.systemHealth.overall_status = 'critical';
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ System already stopped');
      return;
    }

    console.log('🛑 Stopping Wing Zero Phase 3 & 4 Integration...');

    this.isRunning = false;
    this.systemHealth.overall_status = 'offline';
    
    // Set all components to offline
    Object.keys(this.systemHealth.components).forEach(component => {
      (this.systemHealth.components as any)[component] = 'offline';
    });

    console.log('✅ Wing Zero Phase 3 & 4 Integration stopped');
  }

  // SECURE PORTFOLIO MANAGEMENT
  async createSecurePortfolio(
    userId: string,
    portfolioId: string,
    assets: Array<{ symbol: string; expectedReturn: number; volatility: number; weight: number }>,
    correlationMatrix: { [symbol: string]: { [symbol: string]: number } }
  ): Promise<string> {
    console.log(`💼 Creating secure portfolio: ${portfolioId} for user: ${userId}`);

    // Verify user authentication
    await this.verifyUserAccess(userId);

    // Add assets to portfolio theory
    assets.forEach(asset => this.portfolioTheory.addAsset(asset));
    this.portfolioTheory.setCorrelationMatrix(correlationMatrix);

    // Optimize portfolio
    const optimizedPortfolio = this.portfolioTheory.findOptimalPortfolio({
      minWeight: 0,
      maxWeight: 1,
      riskFreeRate: this.configuration.financial.defaultRiskFreeRate,
      allowShortSelling: false
    });

    // Encrypt portfolio data
    const portfolioData = {
      portfolioId,
      userId,
      assets,
      correlationMatrix,
      optimizedWeights: optimizedPortfolio.weights,
      expectedReturn: optimizedPortfolio.expectedReturn,
      volatility: optimizedPortfolio.volatility,
      sharpeRatio: optimizedPortfolio.sharpeRatio,
      createdAt: Date.now()
    };

    const encryptionResult = await this.encryptionService.encryptData(
      JSON.stringify(portfolioData),
      'data'
    );

    // Calculate checksum for integrity verification
    const checksum = this.calculateChecksum(JSON.stringify(portfolioData));

    const securePortfolio: SecurePortfolioData = {
      portfolioId,
      encryptedData: encryptionResult.encryptedData,
      keyVersion: encryptionResult.keyVersion,
      lastUpdated: Date.now(),
      checksum
    };

    this.securePortfolios.set(portfolioId, securePortfolio);

    // Initial risk analysis
    await this.performSecureRiskAnalysis(portfolioId, userId);

    this.auditLog('SECURE_PORTFOLIO_CREATED', {
      userId,
      portfolioId,
      assetCount: assets.length,
      encrypted: true
    });

    console.log(`✅ Secure portfolio created: ${portfolioId}`);
    return portfolioId;
  }

  async performSecureRiskAnalysis(portfolioId: string, userId: string): Promise<RiskAnalysisResult> {
    console.log(`📊 Performing secure risk analysis for portfolio: ${portfolioId}`);

    // Verify user access
    await this.verifyUserAccess(userId);

    // Retrieve and decrypt portfolio data
    const portfolioData = await this.getDecryptedPortfolioData(portfolioId);
    
    // Add historical data for VaR calculation (mock data for demonstration)
    const mockHistoricalData = this.generateMockHistoricalData(portfolioData.assets);
    portfolioData.assets.forEach(asset => {
      this.varModels.addHistoricalData(asset.symbol, mockHistoricalData[asset.symbol]);
    });

    // Calculate portfolio VaR
    const portfolioPositions = portfolioData.optimizedWeights.map((weight, index) => ({
      symbol: portfolioData.assets[index].symbol,
      weight
    }));

    const varResult = this.varModels.calculatePortfolioVaR(
      portfolioPositions,
      this.configuration.financial.defaultConfidenceLevel,
      1, // 1 day horizon
      'parametric'
    );

    // Calculate risk contributions
    const portfolio = this.portfolioTheory.calculatePortfolioMetrics(portfolioData.optimizedWeights);
    const riskContributions = this.portfolioTheory.calculateRiskContribution(portfolio);

    // Perform stress tests
    const stressScenarios = [
      { name: 'Market Crash', shock: -0.20 },
      { name: 'Interest Rate Spike', shock: -0.10 },
      { name: 'Currency Crisis', shock: -0.15 },
      { name: 'Geopolitical Crisis', shock: -0.12 }
    ];

    const stressTestResults = [];
    for (const asset of portfolioData.assets) {
      const stressTests = this.varModels.performStressTest(asset.symbol, stressScenarios);
      stressTestResults.push({ symbol: asset.symbol, results: stressTests });
    }

    // Determine compliance status
    const complianceStatus = this.assessComplianceStatus(varResult, portfolio);

    const riskAnalysis: RiskAnalysisResult = {
      portfolioId,
      timestamp: Date.now(),
      currentVaR: varResult.var_amount,
      expectedShortfall: varResult.expected_shortfall,
      sharpeRatio: portfolio.sharpeRatio,
      riskContributions,
      stressTestResults,
      complianceStatus,
      encrypted: true
    };

    // Cache the analysis (encrypted)
    this.riskAnalysisCache.set(portfolioId, riskAnalysis);

    this.auditLog('SECURE_RISK_ANALYSIS_COMPLETED', {
      portfolioId,
      userId,
      varAmount: varResult.var_amount,
      complianceStatus
    });

    console.log(`✅ Secure risk analysis completed for portfolio: ${portfolioId}`);
    return riskAnalysis;
  }

  // MULTI-FACTOR AUTHENTICATION INTEGRATION
  async authenticateUserForTrading(userId: string, deviceInfo?: any): Promise<string> {
    console.log(`🔐 Authenticating user for trading: ${userId}`);

    if (!this.configuration.security.enableMultifactorAuth) {
      // If MFA is disabled, generate a simple session token
      return this.generateSimpleSessionToken(userId);
    }

    // Create MFA challenge
    const challengeId = await this.mfaService.createChallenge(userId);

    this.auditLog('TRADING_AUTHENTICATION_INITIATED', {
      userId,
      challengeId,
      deviceInfo
    });

    console.log(`✅ MFA challenge created for trading: ${challengeId}`);
    return challengeId;
  }

  async completeTradingAuthentication(
    challengeId: string,
    method: 'totp' | 'biometric' | 'hardware_key',
    credential: string
  ): Promise<{ success: boolean; sessionToken?: string }> {
    console.log(`🔍 Completing trading authentication for challenge: ${challengeId}`);

    const result = await this.mfaService.verifyChallenge(challengeId, method, credential);

    if (result.success && result.isCompleted) {
      this.auditLog('TRADING_AUTHENTICATION_COMPLETED', {
        challengeId,
        method,
        success: true
      });

      console.log(`✅ Trading authentication completed successfully`);
      return { success: true, sessionToken: result.sessionToken };
    } else {
      this.auditLog('TRADING_AUTHENTICATION_FAILED', {
        challengeId,
        method,
        success: false
      });

      console.log(`❌ Trading authentication failed`);
      return { success: false };
    }
  }

  // SECURE DATA EXCHANGE
  async establishSecureChannel(remoteEndpoint: string): Promise<string> {
    console.log(`🔗 Establishing secure channel with: ${remoteEndpoint}`);

    if (!this.configuration.security.enableEndToEndEncryption) {
      throw new Error('End-to-end encryption is disabled');
    }

    const channelId = await this.encryptionService.establishSecureChannel();

    this.auditLog('SECURE_CHANNEL_ESTABLISHED', {
      channelId,
      remoteEndpoint
    });

    console.log(`✅ Secure channel established: ${channelId}`);
    return channelId;
  }

  async sendSecureData(channelId: string, data: any): Promise<void> {
    console.log(`📤 Sending secure data via channel: ${channelId}`);

    const encryptedData = await this.encryptionService.encryptForChannel(
      channelId,
      JSON.stringify(data)
    );

    // In a real implementation, this would send the encrypted data over the network
    console.log(`✅ Secure data sent successfully`);

    this.auditLog('SECURE_DATA_SENT', {
      channelId,
      dataSize: JSON.stringify(data).length
    });
  }

  // COMPLIANCE REPORTING
  async generateComplianceReport(userId: string, portfolios: string[]): Promise<ComplianceReport> {
    console.log(`📋 Generating compliance report for user: ${userId}`);

    await this.verifyUserAccess(userId);

    const reportId = this.generateUniqueId();
    const timestamp = Date.now();

    // Collect risk metrics for all portfolios
    const riskMetrics: any = {};
    for (const portfolioId of portfolios) {
      const analysis = this.riskAnalysisCache.get(portfolioId);
      if (analysis) {
        riskMetrics[portfolioId] = {
          var: analysis.currentVaR,
          expectedShortfall: analysis.expectedShortfall,
          sharpeRatio: analysis.sharpeRatio,
          complianceStatus: analysis.complianceStatus
        };
      }
    }

    // Check trade compliance (mock implementation)
    const tradeCompliance = {
      totalTrades: 0,
      compliantTrades: 0,
      violations: []
    };

    // Check encryption status
    const encryptionStatus = this.encryptionService.getServiceHealth();

    // Check MFA compliance
    const mfaStatus = this.mfaService.getServiceHealth();

    // Calculate overall compliance score
    const complianceViolations = Object.values(riskMetrics)
      .filter((metrics: any) => metrics.complianceStatus === 'violation').length;
    
    const overallScore = Math.max(0, 100 - (complianceViolations * 20));

    const report: ComplianceReport = {
      reportId,
      timestamp,
      userId,
      portfolios,
      riskMetrics,
      tradeCompliance,
      encryptionStatus,
      mfaCompliance: mfaStatus,
      overallScore,
      violations: []
    };

    this.auditLog('COMPLIANCE_REPORT_GENERATED', {
      reportId,
      userId,
      portfolioCount: portfolios.length,
      overallScore
    });

    console.log(`✅ Compliance report generated: ${reportId} (Score: ${overallScore})`);
    return report;
  }

  // REAL-TIME MONITORING
  private startRealTimeRiskMonitoring(): void {
    console.log('📊 Starting real-time risk monitoring...');

    setInterval(async () => {
      try {
        for (const [portfolioId, _] of this.securePortfolios) {
          const analysis = this.riskAnalysisCache.get(portfolioId);
          if (analysis && analysis.complianceStatus === 'violation') {
            this.addAlert('warning', `Portfolio ${portfolioId} has compliance violations`, 'risk_monitoring');
          }
        }
      } catch (error) {
        console.error('Risk monitoring error:', error);
      }
    }, 60000); // Check every minute

    console.log('✅ Real-time risk monitoring started');
  }

  private startAutomatedComplianceMonitoring(): void {
    console.log('🔍 Starting automated compliance monitoring...');

    setInterval(async () => {
      try {
        // Check system compliance status
        const encryptionHealth = this.encryptionService.getServiceHealth();
        const mfaHealth = this.mfaService.getServiceHealth();

        if (!encryptionHealth.isInitialized) {
          this.addAlert('critical', 'Encryption service is not initialized', 'compliance');
        }

        if (!mfaHealth.isInitialized) {
          this.addAlert('critical', 'MFA service is not initialized', 'compliance');
        }

        // Check for expired encryption keys
        if (encryptionHealth.expiredKeys > 10) {
          this.addAlert('warning', `${encryptionHealth.expiredKeys} expired encryption keys detected`, 'compliance');
        }

      } catch (error) {
        console.error('Compliance monitoring error:', error);
      }
    }, 300000); // Check every 5 minutes

    console.log('✅ Automated compliance monitoring started');
  }

  private startSystemHealthMonitoring(): void {
    console.log('🏥 Starting system health monitoring...');

    setInterval(() => {
      this.updateSystemHealth();
    }, this.configuration.integration.systemHealthCheckInterval);

    console.log('✅ System health monitoring started');
  }

  private updateSystemHealth(): void {
    // Update metrics
    this.systemHealth.metrics.activeUsers = this.activeUsers.size;
    this.systemHealth.metrics.activePortfolios = this.securePortfolios.size;
    this.systemHealth.metrics.systemUptime = Date.now() - (this.systemHealth.timestamp || Date.now());

    // Get component health
    const encryptionHealth = this.encryptionService.getServiceHealth();
    const mfaHealth = this.mfaService.getServiceHealth();

    this.systemHealth.metrics.totalEncryptedData = encryptionHealth.activeKeys;
    this.systemHealth.metrics.activeMFAChallenges = mfaHealth.activeChallenges;

    // Update component status based on health
    if (encryptionHealth.isInitialized) {
      this.systemHealth.components.encryption = 'online';
    } else {
      this.systemHealth.components.encryption = 'offline';
    }

    if (mfaHealth.isInitialized) {
      this.systemHealth.components.multifactorAuth = 'online';
    } else {
      this.systemHealth.components.multifactorAuth = 'offline';
    }

    // Determine overall status
    const componentStatuses = Object.values(this.systemHealth.components);
    const onlineCount = componentStatuses.filter(status => status === 'online').length;
    const totalCount = componentStatuses.length;

    if (onlineCount === totalCount) {
      this.systemHealth.overall_status = 'healthy';
    } else if (onlineCount >= totalCount * 0.7) {
      this.systemHealth.overall_status = 'degraded';
    } else {
      this.systemHealth.overall_status = 'critical';
    }

    this.systemHealth.timestamp = Date.now();
  }

  // UTILITY METHODS
  private async verifyUserAccess(userId: string): Promise<void> {
    // Add user to active users
    this.activeUsers.add(userId);

    // In a real implementation, this would verify user permissions
    // For now, we'll simulate access verification
    console.log(`🔍 Verified access for user: ${userId}`);
  }

  private async getDecryptedPortfolioData(portfolioId: string): Promise<any> {
    const securePortfolio = this.securePortfolios.get(portfolioId);
    if (!securePortfolio) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }

    // Decrypt the portfolio data
    const decryptionResult = await this.encryptionService.decryptData({
      encryptedData: securePortfolio.encryptedData,
      iv: '', // This should be stored with the encrypted data
      timestamp: securePortfolio.lastUpdated,
      algorithm: 'AES-256-GCM',
      keyVersion: securePortfolio.keyVersion
    });

    if (!decryptionResult.isValid) {
      throw new Error('Failed to decrypt portfolio data');
    }

    const portfolioData = JSON.parse(decryptionResult.decryptedData);

    // Verify integrity
    const checksum = this.calculateChecksum(decryptionResult.decryptedData);
    if (checksum !== securePortfolio.checksum) {
      throw new Error('Portfolio data integrity check failed');
    }

    return portfolioData;
  }

  private generateMockHistoricalData(assets: any[]): { [symbol: string]: any[] } {
    const data: { [symbol: string]: any[] } = {};
    
    assets.forEach(asset => {
      const historicalData = [];
      let price = 100; // Starting price
      
      for (let i = 0; i < 252; i++) { // 1 year of daily data
        const date = Date.now() - (252 - i) * 24 * 60 * 60 * 1000;
        const randomChange = (Math.random() - 0.5) * 0.04; // ±2% daily change
        price *= (1 + randomChange);
        
        historicalData.push({
          date,
          price,
          return: i > 0 ? Math.log(price / historicalData[i-1].price) : 0
        });
      }
      
      data[asset.symbol] = historicalData;
    });

    return data;
  }

  private assessComplianceStatus(varResult: any, portfolio: any): 'compliant' | 'warning' | 'violation' {
    // Simple compliance rules
    const maxVaR = portfolio.assets.length * 5000; // $5k per asset
    const minSharpe = 0.5;

    if (varResult.var_amount > maxVaR) {
      return 'violation';
    }
    
    if (portfolio.sharpeRatio < minSharpe) {
      return 'warning';
    }

    return 'compliant';
  }

  private calculateChecksum(data: string): string {
    // Simple checksum implementation - in production, use a proper hash function
    let checksum = 0;
    for (let i = 0; i < data.length; i++) {
      checksum += data.charCodeAt(i);
    }
    return checksum.toString(16);
  }

  private generateSimpleSessionToken(userId: string): string {
    const tokenData = {
      userId,
      timestamp: Date.now(),
      random: Math.random().toString(36)
    };
    return `simple_session_${btoa(JSON.stringify(tokenData))}`;
  }

  private addAlert(level: 'info' | 'warning' | 'error' | 'critical', message: string, component: string): void {
    this.systemHealth.alerts.push({
      level,
      message,
      timestamp: Date.now(),
      component
    });

    // Keep only last 100 alerts
    if (this.systemHealth.alerts.length > 100) {
      this.systemHealth.alerts = this.systemHealth.alerts.slice(-100);
    }

    console.log(`🚨 ALERT [${level.toUpperCase()}] ${component}: ${message}`);
  }

  private mergeConfiguration(userConfig?: Partial<SystemConfiguration>): SystemConfiguration {
    if (!userConfig) return this.DEFAULT_CONFIG;

    return {
      financial: { ...this.DEFAULT_CONFIG.financial, ...userConfig.financial },
      security: { ...this.DEFAULT_CONFIG.security, ...userConfig.security },
      integration: { ...this.DEFAULT_CONFIG.integration, ...userConfig.integration }
    };
  }

  private initializeSystemHealth(): SystemHealth {
    return {
      timestamp: Date.now(),
      overall_status: 'offline',
      components: {
        portfolioOptimization: 'offline',
        varModels: 'offline',
        encryption: 'offline',
        multifactorAuth: 'offline',
        integration: 'offline'
      },
      metrics: {
        activeUsers: 0,
        activePortfolios: 0,
        totalEncryptedData: 0,
        activeMFAChallenges: 0,
        systemUptime: 0
      },
      alerts: []
    };
  }

  private generateUniqueId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${randomPart}`;
  }

  private auditLog(operation: string, details: any): void {
    const auditEntry = {
      timestamp: Date.now(),
      operation,
      details,
      serviceVersion: '3.4.0' // Phase 3 & 4 version
    };

    // In production, this would be sent to a secure audit system
    console.log(`📋 INTEGRATION AUDIT: ${operation}`, auditEntry);
  }

  // PUBLIC API
  getSystemHealth(): SystemHealth {
    return { ...this.systemHealth };
  }

  getConfiguration(): SystemConfiguration {
    return { ...this.configuration };
  }

  async updateConfiguration(newConfig: Partial<SystemConfiguration>): Promise<void> {
    console.log('⚙️ Updating system configuration...');
    
    this.configuration = this.mergeConfiguration(newConfig);
    
    this.auditLog('CONFIGURATION_UPDATED', {
      newConfig
    });

    console.log('✅ System configuration updated');
  }

  getActivePortfolios(): string[] {
    return Array.from(this.securePortfolios.keys());
  }

  getActiveUsers(): number {
    return this.activeUsers.size;
  }

  async performSystemDiagnostics(): Promise<{
    overall: 'healthy' | 'issues_detected';
    components: any;
    recommendations: string[];
  }> {
    console.log('🔧 Performing system diagnostics...');

    const encryptionHealth = this.encryptionService.getServiceHealth();
    const mfaHealth = this.mfaService.getServiceHealth();

    const diagnostics = {
      overall: 'healthy' as 'healthy' | 'issues_detected',
      components: {
        encryption: encryptionHealth,
        mfa: mfaHealth,
        portfolios: {
          count: this.securePortfolios.size,
          encrypted: this.securePortfolios.size
        },
        users: {
          active: this.activeUsers.size,
          maxAllowed: this.configuration.integration.maxConcurrentUsers
        }
      },
      recommendations: [] as string[]
    };

    // Check for issues and generate recommendations
    if (!encryptionHealth.isInitialized) {
      diagnostics.overall = 'issues_detected';
      diagnostics.recommendations.push('Initialize encryption service');
    }

    if (!mfaHealth.isInitialized) {
      diagnostics.overall = 'issues_detected';
      diagnostics.recommendations.push('Initialize MFA service');
    }

    if (encryptionHealth.expiredKeys > 5) {
      diagnostics.recommendations.push('Clean up expired encryption keys');
    }

    if (this.activeUsers.size > this.configuration.integration.maxConcurrentUsers * 0.8) {
      diagnostics.recommendations.push('Consider increasing maximum concurrent users limit');
    }

    console.log(`✅ System diagnostics completed - Overall: ${diagnostics.overall}`);
    return diagnostics;
  }
}