import { UnifiedBrokerAPI, UnifiedPosition, UnifiedOrder } from '../brokers/UnifiedBrokerAPI';

interface ReconciliationAccount {
  accountId: string;
  accountName: string;
  brokerAccounts: Array<{
    brokerId: string;
    brokerAccountId: string;
    accountType: 'main' | 'sub' | 'demo';
    currency: string;
    isActive: boolean;
  }>;
  masterCurrency: string;
  reconciliationFrequency: number; // milliseconds
  tolerances: {
    positionTolerance: number; // absolute difference
    valueTolerance: number; // percentage
    pnlTolerance: number; // percentage
    timeTolerance: number; // milliseconds
  };
}

interface PositionSnapshot {
  snapshotId: string;
  accountId: string;
  timestamp: number;
  positions: Map<string, { // symbol -> position data
    consolidated: ConsolidatedPosition;
    brokerPositions: Map<string, BrokerPositionDetail>; // brokerId -> position
    reconciliationStatus: 'matched' | 'discrepancy' | 'pending' | 'error';
    discrepancies?: PositionDiscrepancy[];
  }>;
  totalValue: number;
  totalPnL: number;
  reconciliationScore: number; // 0-100
}

interface ConsolidatedPosition {
  symbol: string;
  netQuantity: number;
  grossQuantity: number;
  netSide: 'long' | 'short' | 'flat';
  averagePrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  marginUsed: number;
  weightedAverageCost: number;
  lastReconciled: number;
  brokerBreakdown: Array<{
    brokerId: string;
    quantity: number;
    side: 'long' | 'short';
    contribution: number; // percentage of total position
  }>;
}

interface BrokerPositionDetail extends UnifiedPosition {
  localSymbol: string;
  settlementDate?: number;
  accruedInterest?: number;
  dividends?: number;
  corporateActions?: Array<{
    type: string;
    date: number;
    ratio: number;
    description: string;
  }>;
  crossRates?: {
    baseCurrency: string;
    quoteCurrency: string;
    rate: number;
  };
}

interface PositionDiscrepancy {
  discrepancyId: string;
  type: 'quantity' | 'price' | 'value' | 'pnl' | 'missing_position' | 'extra_position';
  symbol: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedValue: number;
  actualValue: number;
  difference: number;
  percentageDifference: number;
  affectedBrokers: string[];
  detectedAt: number;
  resolvedAt?: number;
  resolution?: {
    method: 'automatic' | 'manual' | 'ignored';
    action: string;
    approvedBy?: string;
  };
}

interface TradeReconciliation {
  reconciliationId: string;
  tradeDate: number;
  settleDate: number;
  symbol: string;
  trades: Array<{
    brokerId: string;
    tradeId: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    timestamp: number;
    fees: number;
    status: 'matched' | 'unmatched' | 'broken';
  }>;
  consolidatedTrade: {
    netQuantity: number;
    grossQuantity: number;
    averagePrice: number;
    totalFees: number;
    netValue: number;
  };
  reconciliationStatus: 'complete' | 'partial' | 'failed' | 'pending';
  discrepancies: TradeDiscrepancy[];
}

interface TradeDiscrepancy {
  type: 'price' | 'quantity' | 'timing' | 'fees' | 'missing_trade' | 'duplicate';
  description: string;
  expectedValue: any;
  actualValue: any;
  tolerance: number;
  isWithinTolerance: boolean;
}

interface SettlementInstruction {
  instructionId: string;
  type: 'transfer' | 'adjustment' | 'correction' | 'rebalance';
  fromBroker: string;
  toBroker?: string;
  symbol: string;
  quantity: number;
  price?: number;
  reason: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  scheduledTime: number;
  completedTime?: number;
  approvals: Array<{
    level: string;
    approver: string;
    timestamp: number;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
  }>;
}

interface ReconciliationReport {
  reportId: string;
  accountId: string;
  reportType: 'daily' | 'intraday' | 'real_time' | 'exception' | 'settlement';
  period: { start: number; end: number };
  summary: {
    totalPositions: number;
    matchedPositions: number;
    discrepancyCount: number;
    highSeverityDiscrepancies: number;
    reconciliationScore: number;
    totalValue: number;
    totalPnL: number;
  };
  positionSummary: Array<{
    symbol: string;
    brokerCount: number;
    netQuantity: number;
    totalValue: number;
    reconciliationStatus: string;
    lastReconciled: number;
  }>;
  discrepancies: PositionDiscrepancy[];
  recommendations: Array<{
    type: string;
    description: string;
    priority: string;
    estimatedImpact: number;
  }>;
  generatedAt: number;
}

export class PositionReconciliationEngine {
  private unifiedBroker: UnifiedBrokerAPI;
  private accounts: Map<string, ReconciliationAccount> = new Map();
  private positionSnapshots: Map<string, PositionSnapshot> = new Map();
  private tradeReconciliations: Map<string, TradeReconciliation> = new Map();
  private settlementInstructions: Map<string, SettlementInstruction> = new Map();
  private reconciliationReports: Map<string, ReconciliationReport> = new Map();

  // Real-time tracking
  private activeReconciliations: Set<string> = new Set();
  private reconciliationTimers: Map<string, NodeJS.Timeout> = new Map();
  private realTimeMode = false;

  // Currency conversion rates
  private exchangeRates: Map<string, Map<string, number>> = new Map(); // base -> quote -> rate
  private rateUpdateTimer?: NodeJS.Timeout;

  // Performance metrics
  private reconciliationMetrics: {
    totalReconciliations: number;
    successfulReconciliations: number;
    averageReconciliationTime: number;
    averageDiscrepancyCount: number;
    averageReconciliationScore: number;
    lastReconciliationTime: number;
  } = {
    totalReconciliations: 0,
    successfulReconciliations: 0,
    averageReconciliationTime: 0,
    averageDiscrepancyCount: 0,
    averageReconciliationScore: 0,
    lastReconciliationTime: 0
  };

  // Event handlers
  private reconciliationEventHandlers: Map<string, Array<(event: any) => void>> = new Map();

  constructor(unifiedBroker: UnifiedBrokerAPI) {
    this.unifiedBroker = unifiedBroker;
  }

  async initialize(): Promise<void> {
    console.log('🔄 Initializing Position Reconciliation Engine...');

    // Initialize exchange rates
    await this.initializeExchangeRates();

    // Start rate monitoring
    this.startExchangeRateMonitoring();

    // Load default accounts if any
    await this.loadDefaultAccounts();

    console.log('✅ Position Reconciliation Engine initialized');
  }

  // Account Management
  async addAccount(account: ReconciliationAccount): Promise<void> {
    console.log(`👤 Adding reconciliation account: ${account.accountId}`);

    // Validate broker accounts
    for (const brokerAccount of account.brokerAccounts) {
      if (!this.unifiedBroker.getAvailableBrokers().includes(brokerAccount.brokerId)) {
        throw new Error(`Broker ${brokerAccount.brokerId} not available`);
      }
    }

    this.accounts.set(account.accountId, account);

    // Start automatic reconciliation if frequency is set
    if (account.reconciliationFrequency > 0) {
      this.startAccountReconciliation(account.accountId);
    }

    console.log(`✅ Account ${account.accountId} added with ${account.brokerAccounts.length} broker accounts`);
  }

  async removeAccount(accountId: string): Promise<void> {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    // Stop reconciliation timer
    this.stopAccountReconciliation(accountId);

    // Clean up data
    this.accounts.delete(accountId);
    
    // Remove related snapshots and reconciliations
    for (const [snapshotId, snapshot] of this.positionSnapshots.entries()) {
      if (snapshot.accountId === accountId) {
        this.positionSnapshots.delete(snapshotId);
      }
    }

    console.log(`✅ Account ${accountId} removed`);
  }

  // Core Reconciliation Functions
  async reconcilePositions(accountId: string, forceRefresh = false): Promise<PositionSnapshot> {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    console.log(`🔄 Starting position reconciliation for account: ${accountId}`);
    const startTime = Date.now();

    try {
      // Create snapshot
      const snapshot = await this.createPositionSnapshot(account, forceRefresh);

      // Perform reconciliation analysis
      await this.analyzePositionDiscrepancies(snapshot);

      // Store snapshot
      this.positionSnapshots.set(snapshot.snapshotId, snapshot);

      // Update metrics
      this.updateReconciliationMetrics(snapshot, Date.now() - startTime);

      // Emit reconciliation event
      this.emitReconciliationEvent('position_reconciled', {
        accountId,
        snapshotId: snapshot.snapshotId,
        reconciliationScore: snapshot.reconciliationScore,
        discrepancyCount: this.countDiscrepancies(snapshot)
      });

      console.log(`✅ Position reconciliation completed for ${accountId}: Score ${snapshot.reconciliationScore.toFixed(1)}`);
      
      return snapshot;

    } catch (error) {
      console.error(`❌ Position reconciliation failed for ${accountId}:`, error);
      throw error;
    }
  }

  async reconcileTrades(accountId: string, symbol: string, startTime: number, endTime: number): Promise<TradeReconciliation> {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    console.log(`📊 Reconciling trades for ${symbol} in account ${accountId}`);

    const reconciliationId = this.generateReconciliationId();
    
    try {
      // Collect trades from all brokers
      const trades = await this.collectTradesFromBrokers(account, symbol, startTime, endTime);

      // Group and match trades
      const consolidatedTrade = this.consolidateTrades(trades);

      // Identify discrepancies
      const discrepancies = await this.identifyTradeDiscrepancies(trades, account.tolerances);

      const tradeReconciliation: TradeReconciliation = {
        reconciliationId,
        tradeDate: startTime,
        settleDate: this.calculateSettlementDate(startTime, symbol),
        symbol,
        trades,
        consolidatedTrade,
        reconciliationStatus: discrepancies.length === 0 ? 'complete' : 'partial',
        discrepancies
      };

      this.tradeReconciliations.set(reconciliationId, tradeReconciliation);

      console.log(`✅ Trade reconciliation completed: ${reconciliationId}`);
      return tradeReconciliation;

    } catch (error) {
      console.error(`❌ Trade reconciliation failed for ${symbol}:`, error);
      throw error;
    }
  }

  // Position Snapshot Creation
  private async createPositionSnapshot(account: ReconciliationAccount, forceRefresh: boolean): Promise<PositionSnapshot> {
    const snapshotId = this.generateSnapshotId();
    const timestamp = Date.now();

    console.log(`📸 Creating position snapshot: ${snapshotId}`);

    // Collect positions from all brokers
    const brokerPositions = await this.collectPositionsFromBrokers(account, forceRefresh);

    // Group positions by symbol
    const symbolGroups = this.groupPositionsBySymbol(brokerPositions);

    // Create consolidated positions
    const positions = new Map();
    let totalValue = 0;
    let totalPnL = 0;

    for (const [symbol, brokerPositionMap] of symbolGroups.entries()) {
      const consolidated = await this.consolidateSymbolPositions(symbol, brokerPositionMap, account.masterCurrency);
      
      positions.set(symbol, {
        consolidated,
        brokerPositions: brokerPositionMap,
        reconciliationStatus: 'pending' as const,
        discrepancies: []
      });

      totalValue += consolidated.marketValue;
      totalPnL += consolidated.unrealizedPnL + consolidated.realizedPnL;
    }

    const snapshot: PositionSnapshot = {
      snapshotId,
      accountId: account.accountId,
      timestamp,
      positions,
      totalValue,
      totalPnL,
      reconciliationScore: 0 // Will be calculated during analysis
    };

    return snapshot;
  }

  private async collectPositionsFromBrokers(account: ReconciliationAccount, forceRefresh: boolean): Promise<Map<string, BrokerPositionDetail[]>> {
    const brokerPositions = new Map<string, BrokerPositionDetail[]>();

    for (const brokerAccount of account.brokerAccounts) {
      if (!brokerAccount.isActive) continue;

      try {
        console.log(`📥 Collecting positions from ${brokerAccount.brokerId}`);

        const positions = await this.unifiedBroker.getPositions({ brokerId: brokerAccount.brokerId });
        
        // Convert to detailed positions
        const detailedPositions: BrokerPositionDetail[] = positions.map(pos => ({
          ...pos,
          localSymbol: pos.symbol,
          crossRates: this.getCrossRates(pos.symbol, account.masterCurrency)
        }));

        brokerPositions.set(brokerAccount.brokerId, detailedPositions);

      } catch (error) {
        console.error(`❌ Failed to collect positions from ${brokerAccount.brokerId}:`, error);
        brokerPositions.set(brokerAccount.brokerId, []);
      }
    }

    return brokerPositions;
  }

  private groupPositionsBySymbol(brokerPositions: Map<string, BrokerPositionDetail[]>): Map<string, Map<string, BrokerPositionDetail>> {
    const symbolGroups = new Map<string, Map<string, BrokerPositionDetail>>();

    for (const [brokerId, positions] of brokerPositions.entries()) {
      for (const position of positions) {
        const normalizedSymbol = this.normalizeSymbol(position.symbol);
        
        if (!symbolGroups.has(normalizedSymbol)) {
          symbolGroups.set(normalizedSymbol, new Map());
        }

        symbolGroups.get(normalizedSymbol)!.set(brokerId, position);
      }
    }

    return symbolGroups;
  }

  private async consolidateSymbolPositions(
    symbol: string, 
    brokerPositions: Map<string, BrokerPositionDetail>,
    baseCurrency: string
  ): Promise<ConsolidatedPosition> {
    let totalLongQuantity = 0;
    let totalShortQuantity = 0;
    let totalValue = 0;
    let totalUnrealizedPnL = 0;
    let totalRealizedPnL = 0;
    let totalMarginUsed = 0;
    let weightedPriceSum = 0;
    let totalQuantity = 0;

    const brokerBreakdown: ConsolidatedPosition['brokerBreakdown'] = [];

    for (const [brokerId, position] of brokerPositions.entries()) {
      const convertedValue = await this.convertCurrency(
        position.currentPrice * position.quantity,
        this.getBaseCurrency(position.symbol),
        baseCurrency
      );

      const convertedPnL = await this.convertCurrency(
        position.unrealizedPnL,
        this.getBaseCurrency(position.symbol),
        baseCurrency
      );

      if (position.side === 'long') {
        totalLongQuantity += position.quantity;
      } else {
        totalShortQuantity += position.quantity;
      }

      totalValue += convertedValue;
      totalUnrealizedPnL += convertedPnL;
      totalRealizedPnL += position.realizedPnL || 0;
      totalMarginUsed += position.marginUsed || 0;
      
      weightedPriceSum += position.averagePrice * position.quantity;
      totalQuantity += position.quantity;

      brokerBreakdown.push({
        brokerId,
        quantity: position.quantity,
        side: position.side,
        contribution: 0 // Will be calculated after totals
      });
    }

    // Calculate contributions
    if (totalQuantity > 0) {
      for (const breakdown of brokerBreakdown) {
        breakdown.contribution = (breakdown.quantity / totalQuantity) * 100;
      }
    }

    const netQuantity = totalLongQuantity - totalShortQuantity;
    const grossQuantity = totalLongQuantity + totalShortQuantity;
    const netSide: 'long' | 'short' | 'flat' = 
      netQuantity > 0 ? 'long' : netQuantity < 0 ? 'short' : 'flat';

    return {
      symbol,
      netQuantity: Math.abs(netQuantity),
      grossQuantity,
      netSide,
      averagePrice: totalQuantity > 0 ? weightedPriceSum / totalQuantity : 0,
      marketValue: totalValue,
      unrealizedPnL: totalUnrealizedPnL,
      realizedPnL: totalRealizedPnL,
      marginUsed: totalMarginUsed,
      weightedAverageCost: totalQuantity > 0 ? weightedPriceSum / totalQuantity : 0,
      lastReconciled: Date.now(),
      brokerBreakdown
    };
  }

  // Discrepancy Analysis
  private async analyzePositionDiscrepancies(snapshot: PositionSnapshot): Promise<void> {
    console.log(`🔍 Analyzing discrepancies for snapshot: ${snapshot.snapshotId}`);

    const account = this.accounts.get(snapshot.accountId)!;
    let totalDiscrepancies = 0;
    let highSeverityCount = 0;

    for (const [symbol, positionData] of snapshot.positions.entries()) {
      const discrepancies = await this.identifyPositionDiscrepancies(
        symbol,
        positionData.consolidated,
        positionData.brokerPositions,
        account.tolerances
      );

      positionData.discrepancies = discrepancies;
      positionData.reconciliationStatus = discrepancies.length === 0 ? 'matched' : 'discrepancy';

      totalDiscrepancies += discrepancies.length;
      highSeverityCount += discrepancies.filter(d => d.severity === 'high' || d.severity === 'critical').length;
    }

    // Calculate reconciliation score
    const totalPositions = snapshot.positions.size;
    const matchedPositions = Array.from(snapshot.positions.values())
      .filter(p => p.reconciliationStatus === 'matched').length;

    snapshot.reconciliationScore = totalPositions > 0 
      ? Math.max(0, 100 - (totalDiscrepancies * 10) - (highSeverityCount * 20))
      : 100;

    console.log(`📊 Discrepancy analysis complete: ${totalDiscrepancies} discrepancies found, score: ${snapshot.reconciliationScore.toFixed(1)}`);
  }

  private async identifyPositionDiscrepancies(
    symbol: string,
    consolidated: ConsolidatedPosition,
    brokerPositions: Map<string, BrokerPositionDetail>,
    tolerances: ReconciliationAccount['tolerances']
  ): Promise<PositionDiscrepancy[]> {
    const discrepancies: PositionDiscrepancy[] = [];

    // Check for missing positions (position exists in one broker but not others)
    const expectedBrokers = Array.from(brokerPositions.keys());
    const activeBrokers = Array.from(brokerPositions.entries())
      .filter(([_, pos]) => pos.quantity > 0)
      .map(([brokerId, _]) => brokerId);

    if (activeBrokers.length > 0 && activeBrokers.length < expectedBrokers.length) {
      const missingBrokers = expectedBrokers.filter(b => !activeBrokers.includes(b));
      
      for (const brokerId of missingBrokers) {
        discrepancies.push({
          discrepancyId: this.generateDiscrepancyId(),
          type: 'missing_position',
          symbol,
          severity: 'medium',
          description: `Position missing in broker ${brokerId}`,
          expectedValue: consolidated.netQuantity,
          actualValue: 0,
          difference: consolidated.netQuantity,
          percentageDifference: 100,
          affectedBrokers: [brokerId],
          detectedAt: Date.now()
        });
      }
    }

    // Check quantity discrepancies between brokers
    const positionArray = Array.from(brokerPositions.values());
    for (let i = 0; i < positionArray.length; i++) {
      for (let j = i + 1; j < positionArray.length; j++) {
        const pos1 = positionArray[i];
        const pos2 = positionArray[j];
        
        const quantityDiff = Math.abs(pos1.quantity - pos2.quantity);
        const percentDiff = pos1.quantity > 0 ? (quantityDiff / pos1.quantity) * 100 : 100;

        if (quantityDiff > tolerances.positionTolerance || percentDiff > tolerances.valueTolerance) {
          discrepancies.push({
            discrepancyId: this.generateDiscrepancyId(),
            type: 'quantity',
            symbol,
            severity: percentDiff > 50 ? 'high' : percentDiff > 20 ? 'medium' : 'low',
            description: `Quantity mismatch between ${pos1.brokerId} and ${pos2.brokerId}`,
            expectedValue: pos1.quantity,
            actualValue: pos2.quantity,
            difference: quantityDiff,
            percentageDifference: percentDiff,
            affectedBrokers: [pos1.brokerId, pos2.brokerId],
            detectedAt: Date.now()
          });
        }
      }
    }

    // Check price discrepancies
    const prices = positionArray.map(pos => pos.currentPrice);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    for (const position of positionArray) {
      const priceDiff = Math.abs(position.currentPrice - avgPrice);
      const percentDiff = avgPrice > 0 ? (priceDiff / avgPrice) * 100 : 0;

      if (percentDiff > tolerances.valueTolerance) {
        discrepancies.push({
          discrepancyId: this.generateDiscrepancyId(),
          type: 'price',
          symbol,
          severity: percentDiff > 10 ? 'high' : percentDiff > 5 ? 'medium' : 'low',
          description: `Price discrepancy in ${position.brokerId}`,
          expectedValue: avgPrice,
          actualValue: position.currentPrice,
          difference: priceDiff,
          percentageDifference: percentDiff,
          affectedBrokers: [position.brokerId],
          detectedAt: Date.now()
        });
      }
    }

    return discrepancies;
  }

  // Trade Reconciliation
  private async collectTradesFromBrokers(
    account: ReconciliationAccount,
    symbol: string,
    startTime: number,
    endTime: number
  ): Promise<TradeReconciliation['trades']> {
    const trades: TradeReconciliation['trades'] = [];

    for (const brokerAccount of account.brokerAccounts) {
      if (!brokerAccount.isActive) continue;

      try {
        // Get orders/trades from broker (this would need to be implemented in UnifiedBrokerAPI)
        const orders = await this.unifiedBroker.getOrders({ 
          symbol, 
          since: startTime,
          brokerId: brokerAccount.brokerId 
        });

        for (const order of orders) {
          if (order.status === 'filled' && order.updatedAt >= startTime && order.updatedAt <= endTime) {
            trades.push({
              brokerId: brokerAccount.brokerId,
              tradeId: order.orderId,
              side: order.side,
              quantity: order.quantity,
              price: order.price || 0,
              timestamp: order.updatedAt,
              fees: 0, // Would need to be extracted from broker data
              status: 'unmatched'
            });
          }
        }

      } catch (error) {
        console.error(`❌ Failed to collect trades from ${brokerAccount.brokerId}:`, error);
      }
    }

    return trades;
  }

  private consolidateTrades(trades: TradeReconciliation['trades']): TradeReconciliation['consolidatedTrade'] {
    let netQuantity = 0;
    let grossQuantity = 0;
    let totalValue = 0;
    let totalFees = 0;

    for (const trade of trades) {
      const signedQuantity = trade.side === 'buy' ? trade.quantity : -trade.quantity;
      netQuantity += signedQuantity;
      grossQuantity += trade.quantity;
      totalValue += trade.quantity * trade.price;
      totalFees += trade.fees;
    }

    const averagePrice = grossQuantity > 0 ? totalValue / grossQuantity : 0;

    return {
      netQuantity: Math.abs(netQuantity),
      grossQuantity,
      averagePrice,
      totalFees,
      netValue: totalValue
    };
  }

  private async identifyTradeDiscrepancies(
    trades: TradeReconciliation['trades'],
    tolerances: ReconciliationAccount['tolerances']
  ): Promise<TradeDiscrepancy[]> {
    const discrepancies: TradeDiscrepancy[] = [];

    // Group trades by timestamp (within tolerance)
    const tradeGroups = this.groupTradesByTime(trades, tolerances.timeTolerance);

    for (const group of tradeGroups) {
      if (group.length < 2) continue; // Need at least 2 trades to compare

      // Check price discrepancies within group
      const prices = group.map(t => t.price);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

      for (const trade of group) {
        const priceDiff = Math.abs(trade.price - avgPrice);
        const percentDiff = avgPrice > 0 ? (priceDiff / avgPrice) * 100 : 0;

        if (percentDiff > tolerances.valueTolerance) {
          discrepancies.push({
            type: 'price',
            description: `Price discrepancy in trade ${trade.tradeId}`,
            expectedValue: avgPrice,
            actualValue: trade.price,
            tolerance: tolerances.valueTolerance,
            isWithinTolerance: false
          });
        }
      }

      // Check quantity discrepancies
      const quantities = group.map(t => t.quantity);
      const avgQuantity = quantities.reduce((sum, qty) => sum + qty, 0) / quantities.length;

      for (const trade of group) {
        const qtyDiff = Math.abs(trade.quantity - avgQuantity);
        const percentDiff = avgQuantity > 0 ? (qtyDiff / avgQuantity) * 100 : 0;

        if (qtyDiff > tolerances.positionTolerance || percentDiff > tolerances.valueTolerance) {
          discrepancies.push({
            type: 'quantity',
            description: `Quantity discrepancy in trade ${trade.tradeId}`,
            expectedValue: avgQuantity,
            actualValue: trade.quantity,
            tolerance: tolerances.positionTolerance,
            isWithinTolerance: false
          });
        }
      }
    }

    return discrepancies;
  }

  private groupTradesByTime(trades: TradeReconciliation['trades'], timeTolerance: number): Array<TradeReconciliation['trades']> {
    const groups: Array<TradeReconciliation['trades']> = [];
    const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp);

    let currentGroup: TradeReconciliation['trades'] = [];
    let groupStartTime = 0;

    for (const trade of sortedTrades) {
      if (currentGroup.length === 0 || trade.timestamp - groupStartTime <= timeTolerance) {
        if (currentGroup.length === 0) {
          groupStartTime = trade.timestamp;
        }
        currentGroup.push(trade);
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [trade];
        groupStartTime = trade.timestamp;
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  // Settlement Processing
  async createSettlementInstruction(
    fromBroker: string,
    toBroker: string | undefined,
    symbol: string,
    quantity: number,
    reason: string,
    priority: SettlementInstruction['priority'] = 'normal'
  ): Promise<SettlementInstruction> {
    const instructionId = this.generateInstructionId();

    const instruction: SettlementInstruction = {
      instructionId,
      type: toBroker ? 'transfer' : 'adjustment',
      fromBroker,
      toBroker,
      symbol,
      quantity,
      reason,
      priority,
      status: 'pending',
      scheduledTime: Date.now(),
      approvals: []
    };

    this.settlementInstructions.set(instructionId, instruction);

    console.log(`📋 Settlement instruction created: ${instructionId}`);
    return instruction;
  }

  async processSettlementInstruction(instructionId: string): Promise<void> {
    const instruction = this.settlementInstructions.get(instructionId);
    if (!instruction) {
      throw new Error(`Settlement instruction ${instructionId} not found`);
    }

    console.log(`⚙️ Processing settlement instruction: ${instructionId}`);

    try {
      instruction.status = 'processing';
      
      // Implement actual settlement logic here
      // This would depend on broker APIs and settlement mechanisms
      
      await this.simulateSettlementProcessing(instruction);
      
      instruction.status = 'completed';
      instruction.completedTime = Date.now();

      console.log(`✅ Settlement instruction completed: ${instructionId}`);

    } catch (error) {
      console.error(`❌ Settlement instruction failed: ${instructionId}`, error);
      instruction.status = 'failed';
    }

    this.settlementInstructions.set(instructionId, instruction);
  }

  private async simulateSettlementProcessing(instruction: SettlementInstruction): Promise<void> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In reality, this would involve:
    // 1. Validating instruction
    // 2. Checking approvals
    // 3. Executing broker-specific settlement calls
    // 4. Monitoring settlement status
    // 5. Updating position records
  }

  // Real-time Reconciliation
  async enableRealTimeReconciliation(accountId: string): Promise<void> {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    console.log(`⚡ Enabling real-time reconciliation for account: ${accountId}`);

    this.realTimeMode = true;
    this.activeReconciliations.add(accountId);

    // Start continuous reconciliation
    const reconcileInterval = Math.min(account.reconciliationFrequency, 30000); // Max 30 seconds
    
    const timer = setInterval(async () => {
      try {
        await this.reconcilePositions(accountId, false);
      } catch (error) {
        console.error(`❌ Real-time reconciliation error for ${accountId}:`, error);
      }
    }, reconcileInterval);

    this.reconciliationTimers.set(accountId, timer);

    console.log(`✅ Real-time reconciliation enabled for ${accountId}`);
  }

  async disableRealTimeReconciliation(accountId: string): Promise<void> {
    console.log(`⏸️ Disabling real-time reconciliation for account: ${accountId}`);

    const timer = this.reconciliationTimers.get(accountId);
    if (timer) {
      clearInterval(timer);
      this.reconciliationTimers.delete(accountId);
    }

    this.activeReconciliations.delete(accountId);

    if (this.activeReconciliations.size === 0) {
      this.realTimeMode = false;
    }

    console.log(`✅ Real-time reconciliation disabled for ${accountId}`);
  }

  // Reporting
  async generateReconciliationReport(
    accountId: string,
    reportType: ReconciliationReport['reportType'],
    startTime?: number,
    endTime?: number
  ): Promise<ReconciliationReport> {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    console.log(`📊 Generating ${reportType} reconciliation report for ${accountId}`);

    const reportId = this.generateReportId();
    const now = Date.now();
    const period = {
      start: startTime || (now - 24 * 60 * 60 * 1000), // Default 24 hours
      end: endTime || now
    };

    // Get latest snapshot
    const snapshot = await this.reconcilePositions(accountId, true);

    // Aggregate data
    const summary = this.calculateReportSummary(snapshot);
    const positionSummary = this.createPositionSummary(snapshot);
    const allDiscrepancies = this.aggregateDiscrepancies(snapshot);
    const recommendations = this.generateRecommendations(snapshot, account);

    const report: ReconciliationReport = {
      reportId,
      accountId,
      reportType,
      period,
      summary,
      positionSummary,
      discrepancies: allDiscrepancies,
      recommendations,
      generatedAt: now
    };

    this.reconciliationReports.set(reportId, report);

    console.log(`✅ Reconciliation report generated: ${reportId}`);
    return report;
  }

  private calculateReportSummary(snapshot: PositionSnapshot): ReconciliationReport['summary'] {
    const totalPositions = snapshot.positions.size;
    const matchedPositions = Array.from(snapshot.positions.values())
      .filter(p => p.reconciliationStatus === 'matched').length;
    
    const allDiscrepancies = this.aggregateDiscrepancies(snapshot);
    const highSeverityDiscrepancies = allDiscrepancies
      .filter(d => d.severity === 'high' || d.severity === 'critical').length;

    return {
      totalPositions,
      matchedPositions,
      discrepancyCount: allDiscrepancies.length,
      highSeverityDiscrepancies,
      reconciliationScore: snapshot.reconciliationScore,
      totalValue: snapshot.totalValue,
      totalPnL: snapshot.totalPnL
    };
  }

  private createPositionSummary(snapshot: PositionSnapshot): ReconciliationReport['positionSummary'] {
    return Array.from(snapshot.positions.entries()).map(([symbol, positionData]) => ({
      symbol,
      brokerCount: positionData.brokerPositions.size,
      netQuantity: positionData.consolidated.netQuantity,
      totalValue: positionData.consolidated.marketValue,
      reconciliationStatus: positionData.reconciliationStatus,
      lastReconciled: positionData.consolidated.lastReconciled
    }));
  }

  private aggregateDiscrepancies(snapshot: PositionSnapshot): PositionDiscrepancy[] {
    const allDiscrepancies: PositionDiscrepancy[] = [];
    
    for (const positionData of snapshot.positions.values()) {
      if (positionData.discrepancies) {
        allDiscrepancies.push(...positionData.discrepancies);
      }
    }

    return allDiscrepancies;
  }

  private generateRecommendations(
    snapshot: PositionSnapshot, 
    account: ReconciliationAccount
  ): ReconciliationReport['recommendations'] {
    const recommendations: ReconciliationReport['recommendations'] = [];

    const allDiscrepancies = this.aggregateDiscrepancies(snapshot);
    const criticalDiscrepancies = allDiscrepancies.filter(d => d.severity === 'critical');
    const highDiscrepancies = allDiscrepancies.filter(d => d.severity === 'high');

    if (criticalDiscrepancies.length > 0) {
      recommendations.push({
        type: 'urgent_action',
        description: `${criticalDiscrepancies.length} critical discrepancies require immediate attention`,
        priority: 'urgent',
        estimatedImpact: criticalDiscrepancies.reduce((sum, d) => sum + Math.abs(d.difference), 0)
      });
    }

    if (highDiscrepancies.length > 0) {
      recommendations.push({
        type: 'review_positions',
        description: `${highDiscrepancies.length} high-severity discrepancies need review`,
        priority: 'high',
        estimatedImpact: highDiscrepancies.reduce((sum, d) => sum + Math.abs(d.difference), 0)
      });
    }

    if (snapshot.reconciliationScore < 80) {
      recommendations.push({
        type: 'improve_reconciliation',
        description: `Reconciliation score (${snapshot.reconciliationScore.toFixed(1)}) below target`,
        priority: 'medium',
        estimatedImpact: 100 - snapshot.reconciliationScore
      });
    }

    return recommendations;
  }

  // Utility Methods
  private startAccountReconciliation(accountId: string): void {
    const account = this.accounts.get(accountId)!;
    
    const timer = setInterval(async () => {
      try {
        await this.reconcilePositions(accountId);
      } catch (error) {
        console.error(`❌ Scheduled reconciliation error for ${accountId}:`, error);
      }
    }, account.reconciliationFrequency);

    this.reconciliationTimers.set(accountId, timer);
  }

  private stopAccountReconciliation(accountId: string): void {
    const timer = this.reconciliationTimers.get(accountId);
    if (timer) {
      clearInterval(timer);
      this.reconciliationTimers.delete(accountId);
    }
  }

  private async initializeExchangeRates(): Promise<void> {
    // Initialize with basic currency pairs
    const rates = new Map<string, number>();
    rates.set('EURUSD', 1.1000);
    rates.set('GBPUSD', 1.3000);
    rates.set('USDJPY', 150.00);
    rates.set('USDCHF', 0.9000);

    this.exchangeRates.set('USD', rates);

    console.log('💱 Exchange rates initialized');
  }

  private startExchangeRateMonitoring(): void {
    this.rateUpdateTimer = setInterval(async () => {
      await this.updateExchangeRates();
    }, 60000); // Update every minute

    console.log('💱 Exchange rate monitoring started');
  }

  private async updateExchangeRates(): Promise<void> {
    // In production, this would fetch real exchange rates
    // For now, we'll simulate small updates
    const usdRates = this.exchangeRates.get('USD');
    if (usdRates) {
      for (const [pair, rate] of usdRates.entries()) {
        // Simulate small rate changes (±0.1%)
        const change = (Math.random() - 0.5) * 0.002;
        usdRates.set(pair, rate * (1 + change));
      }
    }
  }

  private async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    // Simplified currency conversion using USD as base
    const pair = `${fromCurrency}${toCurrency}`;
    const reversePair = `${toCurrency}${fromCurrency}`;
    
    const usdRates = this.exchangeRates.get('USD');
    if (usdRates?.has(pair)) {
      return amount * usdRates.get(pair)!;
    } else if (usdRates?.has(reversePair)) {
      return amount / usdRates.get(reversePair)!;
    }

    // Default to 1:1 if rate not found
    return amount;
  }

  private getCrossRates(symbol: string, baseCurrency: string): BrokerPositionDetail['crossRates'] {
    const symbolBase = this.getBaseCurrency(symbol);
    const symbolQuote = this.getQuoteCurrency(symbol);
    
    if (symbolBase === baseCurrency) {
      return {
        baseCurrency: symbolBase,
        quoteCurrency: symbolQuote,
        rate: 1.0
      };
    }

    // Simplified cross rate calculation
    const usdRates = this.exchangeRates.get('USD');
    const rate = usdRates?.get(`${symbolBase}${baseCurrency}`) || 1.0;

    return {
      baseCurrency: symbolBase,
      quoteCurrency: baseCurrency,
      rate
    };
  }

  private normalizeSymbol(symbol: string): string {
    // Remove broker-specific symbol formatting
    return symbol.replace(/_/g, '').replace(/\./g, '').toUpperCase();
  }

  private getBaseCurrency(symbol: string): string {
    const normalized = this.normalizeSymbol(symbol);
    return normalized.substring(0, 3);
  }

  private getQuoteCurrency(symbol: string): string {
    const normalized = this.normalizeSymbol(symbol);
    return normalized.substring(3, 6);
  }

  private calculateSettlementDate(tradeDate: number, symbol: string): number {
    // T+2 settlement for most instruments
    return tradeDate + (2 * 24 * 60 * 60 * 1000);
  }

  private countDiscrepancies(snapshot: PositionSnapshot): number {
    let count = 0;
    for (const positionData of snapshot.positions.values()) {
      count += positionData.discrepancies?.length || 0;
    }
    return count;
  }

  private updateReconciliationMetrics(snapshot: PositionSnapshot, executionTime: number): void {
    this.reconciliationMetrics.totalReconciliations++;
    
    if (snapshot.reconciliationScore > 95) {
      this.reconciliationMetrics.successfulReconciliations++;
    }

    const total = this.reconciliationMetrics.totalReconciliations;
    this.reconciliationMetrics.averageReconciliationTime = 
      (this.reconciliationMetrics.averageReconciliationTime * (total - 1) + executionTime) / total;
    
    const discrepancyCount = this.countDiscrepancies(snapshot);
    this.reconciliationMetrics.averageDiscrepancyCount = 
      (this.reconciliationMetrics.averageDiscrepancyCount * (total - 1) + discrepancyCount) / total;
    
    this.reconciliationMetrics.averageReconciliationScore = 
      (this.reconciliationMetrics.averageReconciliationScore * (total - 1) + snapshot.reconciliationScore) / total;
    
    this.reconciliationMetrics.lastReconciliationTime = Date.now();
  }

  private emitReconciliationEvent(eventType: string, data: any): void {
    const handlers = this.reconciliationEventHandlers.get(eventType);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Event handler error for ${eventType}:`, error);
        }
      }
    }
  }

  private async loadDefaultAccounts(): Promise<void> {
    // Load any default accounts from configuration
    // This is a placeholder for production implementation
  }

  // ID Generators
  private generateSnapshotId(): string {
    return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateReconciliationId(): string {
    return `recon_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateDiscrepancyId(): string {
    return `disc_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateInstructionId(): string {
    return `inst_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateReportId(): string {
    return `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  // Public API
  getAccounts(): ReconciliationAccount[] {
    return Array.from(this.accounts.values());
  }

  getPositionSnapshot(snapshotId: string): PositionSnapshot | undefined {
    return this.positionSnapshots.get(snapshotId);
  }

  getLatestSnapshot(accountId: string): PositionSnapshot | undefined {
    const snapshots = Array.from(this.positionSnapshots.values())
      .filter(s => s.accountId === accountId)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return snapshots[0];
  }

  getReconciliationMetrics() {
    return { ...this.reconciliationMetrics };
  }

  getSettlementInstructions(status?: SettlementInstruction['status']): SettlementInstruction[] {
    const instructions = Array.from(this.settlementInstructions.values());
    return status ? instructions.filter(i => i.status === status) : instructions;
  }

  addEventListener(eventType: string, handler: (event: any) => void): void {
    if (!this.reconciliationEventHandlers.has(eventType)) {
      this.reconciliationEventHandlers.set(eventType, []);
    }
    this.reconciliationEventHandlers.get(eventType)!.push(handler);
  }

  removeEventListener(eventType: string, handler: (event: any) => void): void {
    const handlers = this.reconciliationEventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Position Reconciliation Engine...');

    // Stop all timers
    for (const timer of this.reconciliationTimers.values()) {
      clearInterval(timer);
    }

    if (this.rateUpdateTimer) {
      clearInterval(this.rateUpdateTimer);
    }

    // Clear all data
    this.accounts.clear();
    this.positionSnapshots.clear();
    this.tradeReconciliations.clear();
    this.settlementInstructions.clear();
    this.reconciliationReports.clear();
    this.reconciliationTimers.clear();
    this.activeReconciliations.clear();
    this.exchangeRates.clear();
    this.reconciliationEventHandlers.clear();

    this.realTimeMode = false;

    console.log('✅ Position Reconciliation Engine shutdown complete');
  }
}