import { BrokerConnection, Order, OrderRequest, TradingSignal, RiskMetrics } from '@/types/broker';
import { MarketDataService } from './MarketDataService';
import { RiskManager } from './RiskManager';
import { OrderManager } from './OrderManager';
import { StrategyManager } from './StrategyManager';
import { TradingBrain } from './TradingBrain';

export class TradingEngine {
  private brokerConnection: BrokerConnection | null = null;
  private marketDataService: MarketDataService;
  private riskManager: RiskManager;
  private orderManager: OrderManager;
  private strategyManager: StrategyManager;
  private tradingBrain: TradingBrain;
  private isRunning = false;
  private tradingConfig: any;
  private brainEnabled = false;

  constructor() {
    this.marketDataService = new MarketDataService();
    this.riskManager = new RiskManager();
    this.orderManager = new OrderManager();
    this.strategyManager = new StrategyManager();
    this.tradingBrain = new TradingBrain();
  }

  async start(config: any): Promise<void> {
    if (this.isRunning) {
      throw new Error('Trading engine is already running');
    }

    this.tradingConfig = config;
    this.brainEnabled = config.brainEnabled || false;
    
    // Initialize all services
    await this.marketDataService.start();
    await this.riskManager.initialize(config);
    await this.orderManager.initialize();
    await this.strategyManager.loadStrategies(config);

    // Initialize and start the AI Trading Brain if enabled
    if (this.brainEnabled) {
      console.log('🧠 Starting Wing Zero Trading Brain - Full Autonomous Mode');
      console.log('🔥 WING ZERO ENGINE IS ACTIVELY RUNNING - AI BRAIN ENGAGED');
      await this.tradingBrain.initialize();
      await this.tradingBrain.start();
    }

    this.isRunning = true;
    
    // Only start traditional trading loop if brain is disabled
    if (!this.brainEnabled) {
      this.startTradingLoop();
    }
    
    console.log(`Trading engine started - ${this.brainEnabled ? 'AI Brain Mode' : 'Traditional Mode'}`);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Stop the AI Trading Brain if it's running
    if (this.brainEnabled && this.tradingBrain.isRunning()) {
      await this.tradingBrain.stop();
    }
    
    // Close all open positions if configured to do so
    if (this.tradingConfig?.closeOnStop) {
      await this.orderManager.closeAllPositions();
    }

    await this.marketDataService.stop();
    
    console.log('Trading engine stopped');
  }

  private async startTradingLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Get market data
        const marketData = await this.marketDataService.getCurrentData();
        
        // Generate trading signals
        const signals = await this.strategyManager.generateSignals(marketData);
        
        // Process each signal
        for (const signal of signals) {
          await this.processSignal(signal);
        }
        
        // Update risk metrics
        await this.updateRiskMetrics();
        
        // Wait before next iteration (configurable)
        await this.sleep(this.tradingConfig?.loopInterval || 1000);
        
      } catch (error) {
        console.error('Error in trading loop:', error);
        
        // Handle critical errors
        if (this.shouldStopOnError(error)) {
          await this.stop();
          break;
        }
      }
    }
  }

  private async processSignal(signal: TradingSignal): Promise<void> {
    if (!this.shouldExecuteSignal(signal)) {
      return;
    }

    // Check risk before executing
    const riskCheck = await this.riskManager.validateTrade(signal);
    if (!riskCheck.approved) {
      console.log(`Trade rejected: ${riskCheck.reason}`);
      return;
    }

    // Calculate position size
    const positionSize = this.riskManager.calculatePositionSize(signal);
    
    // Create order request
    const orderRequest: OrderRequest = {
      symbol: signal.symbol,
      type: 'market',
      side: signal.action as 'buy' | 'sell',
      volume: positionSize,
      stopLoss: this.calculateStopLoss(signal),
      takeProfit: this.calculateTakeProfit(signal),
      comment: `WingZero-${signal.strength}`
    };

    // Execute order
    try {
      const order = await this.orderManager.placeOrder(orderRequest);
      console.log(`Order placed: ${order.id} for ${signal.symbol}`);
    } catch (error) {
      console.error(`Failed to place order for ${signal.symbol}:`, error);
    }
  }

  private shouldExecuteSignal(signal: TradingSignal): boolean {
    // Check signal strength
    if (signal.strength < this.tradingConfig?.minSignalStrength || 50) {
      return false;
    }

    // Check confidence
    if (signal.confidence < this.tradingConfig?.minConfidence || 70) {
      return false;
    }

    // Check if we already have a position in this symbol
    const existingPosition = this.orderManager.getPositionBySymbol(signal.symbol);
    if (existingPosition && this.tradingConfig?.onePositionPerSymbol) {
      return false;
    }

    return true;
  }

  private calculateStopLoss(signal: TradingSignal): number {
    const stopLossPips = this.tradingConfig?.stopLossPips || 20;
    const pipValue = this.getPipValue(signal.symbol);
    
    if (signal.action === 'buy') {
      return signal.indicators.support - (stopLossPips * pipValue);
    } else {
      return signal.indicators.resistance + (stopLossPips * pipValue);
    }
  }

  private calculateTakeProfit(signal: TradingSignal): number {
    const takeProfitPips = this.tradingConfig?.takeProfitPips || 60;
    const pipValue = this.getPipValue(signal.symbol);
    
    if (signal.action === 'buy') {
      return signal.indicators.resistance + (takeProfitPips * pipValue);
    } else {
      return signal.indicators.support - (takeProfitPips * pipValue);
    }
  }

  private getPipValue(symbol: string): number {
    // Standard pip values for major pairs
    const pipValues: { [key: string]: number } = {
      'EURUSD': 0.0001,
      'GBPUSD': 0.0001,
      'USDJPY': 0.01,
      'USDCHF': 0.0001,
      'AUDUSD': 0.0001,
      'USDCAD': 0.0001,
      'NZDUSD': 0.0001,
    };
    
    return pipValues[symbol] || 0.0001;
  }

  private async updateRiskMetrics(): Promise<void> {
    const metrics = await this.riskManager.calculateCurrentMetrics();
    
    // Emit risk metrics update
    this.emitRiskUpdate(metrics);
    
    // Check for risk violations
    if (metrics.currentRisk > this.tradingConfig?.maxDailyLoss) {
      console.warn('Daily loss limit reached, stopping trading');
      await this.stop();
    }
  }

  private emitRiskUpdate(metrics: RiskMetrics): void {
    // This would emit to WebSocket or event system
    // For now, we'll use console logging
    console.log('Risk Metrics Update:', metrics);
  }

  private shouldStopOnError(error: any): boolean {
    // Define critical errors that should stop the engine
    const criticalErrors = [
      'BROKER_CONNECTION_LOST',
      'INSUFFICIENT_MARGIN',
      'ACCOUNT_SUSPENDED'
    ];
    
    return criticalErrors.some(ce => error.message?.includes(ce));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for external control
  async setBrokerConnection(connection: BrokerConnection): Promise<void> {
    this.brokerConnection = connection;
    await this.orderManager.setBrokerConnection(connection);
    await this.marketDataService.setBrokerConnection(connection);
    // Also set broker connection for TradingBrain's services
    await this.tradingBrain.setBrokerConnection(connection);
  }

  getCurrentOrders(): Order[] {
    return this.orderManager.getAllOrders();
  }

  getCurrentRiskMetrics(): RiskMetrics {
    return this.riskManager.getCurrentMetrics();
  }

  async closePosition(orderId: string): Promise<void> {
    await this.orderManager.closePosition(orderId);
  }

  async closeAllPositions(): Promise<void> {
    await this.orderManager.closeAllPositions();
  }

  getEngineStatus() {
    return {
      isRunning: this.isRunning,
      brainEnabled: this.brainEnabled,
      brainActive: this.brainEnabled && this.tradingBrain.isRunning(),
      brokerConnected: !!this.brokerConnection,
      openPositions: this.orderManager.getOpenPositionsCount(),
      dailyPnL: this.riskManager.getDailyPnL(),
      currentRegime: this.brainEnabled ? this.tradingBrain.getCurrentRegime() : null
    };
  }

  // Public methods for Brain control
  public async enableBrain(): Promise<void> {
    if (!this.brainEnabled) {
      this.brainEnabled = true;
      await this.tradingBrain.initialize();
      await this.tradingBrain.start();
      console.log('🧠 Wing Zero Trading Brain activated');
    }
  }

  public async disableBrain(): Promise<void> {
    if (this.brainEnabled && this.tradingBrain.isRunning()) {
      await this.tradingBrain.stop();
      this.brainEnabled = false;
      console.log('🧠 Wing Zero Trading Brain deactivated');
    }
  }

  public getBrainConfig(): any {
    return this.tradingBrain.getConfig();
  }

  public updateBrainConfig(config: any): void {
    this.tradingBrain.updateConfig(config);
  }
}