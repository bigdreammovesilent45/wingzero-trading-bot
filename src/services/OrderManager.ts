import { Order, OrderRequest, BrokerConnection } from '@/types/broker';

export class OrderManager {
  private connection: BrokerConnection | null = null;
  private orders: Map<string, Order> = new Map();
  private nextTicket = 1000;

  async initialize(): Promise<void> {
    console.log('Order manager initialized');
  }

  async setBrokerConnection(connection: BrokerConnection): Promise<void> {
    this.connection = connection;
    
    // Load existing orders from broker
    await this.loadExistingOrders();
  }

  private async loadExistingOrders(): Promise<void> {
    if (!this.connection) return;

    try {
      // In real implementation, this would fetch from broker API
      console.log('Loading existing orders from broker...');
      
      // For demo, we'll start with empty order book
      this.orders.clear();
      
    } catch (error) {
      console.error('Failed to load existing orders:', error);
    }
  }

  async placeOrder(request: OrderRequest): Promise<Order> {
    if (!this.connection) {
      throw new Error('No broker connection available');
    }

    // Validate order request
    this.validateOrderRequest(request);

    // Generate order ID and ticket
    const orderId = this.generateOrderId();
    const ticket = this.nextTicket++;

    // Get current market price for execution
    const currentPrice = await this.getCurrentPrice(request.symbol, request.side);
    
    // WING ZERO MANDATE: VALIDATE MANDATORY RISK MANAGEMENT
    if (!request.stopLoss || request.stopLoss <= 0) {
      throw new Error(`🚨 WING ZERO MANDATE VIOLATION: Order for ${request.symbol} rejected - NO STOP LOSS`);
    }
    
    if (!request.takeProfit || request.takeProfit <= 0) {
      throw new Error(`🚨 WING ZERO MANDATE VIOLATION: Order for ${request.symbol} rejected - NO TAKE PROFIT`);
    }
    
    // Validate risk-reward ratio
    const stopDistance = Math.abs(currentPrice - request.stopLoss);
    const takeProfitDistance = Math.abs(request.takeProfit - currentPrice);
    const riskReward = takeProfitDistance / stopDistance;
    
    if (riskReward < 1.5) {
      throw new Error(`🚨 WING ZERO MANDATE VIOLATION: Order for ${request.symbol} rejected - Risk-Reward ${riskReward.toFixed(2)} below minimum 1.5`);
    }
    
    // Create order object with FULL risk management
    const order: Order = {
      id: orderId,
      ticket,
      symbol: request.symbol,
      type: request.type,
      side: request.side,
      volume: request.volume,
      openPrice: request.type === 'market' ? currentPrice : request.price || currentPrice,
      currentPrice,
      stopLoss: request.stopLoss,
      takeProfit: request.takeProfit,
      trailingStop: request.trailingStop || (15 * this.getPipValue(request.symbol)), // Default 15 pips
      profit: 0,
      commission: this.calculateCommission(request.volume, request.symbol),
      swap: 0,
      openTime: new Date().toISOString(),
      status: request.type === 'market' ? 'open' : 'pending',
      comment: `${request.comment} [TP:${request.takeProfit.toFixed(5)} SL:${request.stopLoss.toFixed(5)} R:R:${riskReward.toFixed(2)}]`
    };

    // Execute order based on type
    if (request.type === 'market') {
      await this.executeMarketOrder(order);
    } else {
      await this.placePendingOrder(order);
    }

    // Store order
    this.orders.set(orderId, order);

    console.log(`Order placed: ${order.symbol} ${order.side} ${order.volume} @ ${order.openPrice}`);
    return order;
  }

  private async executeMarketOrder(order: Order): Promise<void> {
    try {
      // In real implementation, this would send to broker API
      if (this.connection?.type === 'oanda') {
        await this.executeOandaOrder(order);
      } else {
        await this.executeMockOrder(order);
      }

      order.status = 'open';
      
    } catch (error) {
      console.error('Failed to execute market order:', error);
      order.status = 'cancelled';
      throw error;
    }
  }

  private async executeOandaOrder(order: Order): Promise<void> {
    // OANDA v20 API order execution
    console.log('Executing OANDA order:', order.id);
    
    // Mock execution for demo
    await this.sleep(100);
  }


  private async executeMockOrder(order: Order): Promise<void> {
    console.log('Executing mock order:', order.id);
    await this.sleep(50);
  }

  private async placePendingOrder(order: Order): Promise<void> {
    console.log('Placing pending order:', order.id);
    order.status = 'pending';
  }

  async closePosition(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status !== 'open') {
      throw new Error(`Cannot close order ${orderId} - status: ${order.status}`);
    }

    try {
      // Get current price for closing
      const closePrice = await this.getCurrentPrice(order.symbol, order.side === 'buy' ? 'sell' : 'buy');
      
      // Calculate final profit
      order.currentPrice = closePrice;
      order.profit = this.calculateProfit(order, closePrice);
      order.status = 'closed';

      // Execute close with broker
      await this.executeBrokerClose(order);

      console.log(`Position closed: ${order.id} with profit ${order.profit}`);
      
    } catch (error) {
      console.error('Failed to close position:', error);
      throw error;
    }
  }

  async closeAllPositions(): Promise<void> {
    const openOrders = Array.from(this.orders.values()).filter(o => o.status === 'open');
    
    console.log(`Closing ${openOrders.length} open positions`);
    
    const closePromises = openOrders.map(order => this.closePosition(order.id));
    await Promise.allSettled(closePromises);
  }

  private async executeBrokerClose(order: Order): Promise<void> {
    if (this.connection?.type === 'oanda') {
      await this.closeOandaPosition(order);
    } else {
      await this.closeMockPosition(order);
    }
  }

  private async closeOandaPosition(order: Order): Promise<void> {
    console.log('Closing OANDA position:', order.id);
    await this.sleep(100);
  }


  private async closeMockPosition(order: Order): Promise<void> {
    console.log('Closing mock position:', order.id);
    await this.sleep(50);
  }

  updateOrderPrices(symbol: string, currentPrice: number): void {
    for (const order of this.orders.values()) {
      if (order.symbol === symbol && order.status === 'open') {
        order.currentPrice = currentPrice;
        order.profit = this.calculateProfit(order, currentPrice);
        
        // Check stop loss and take profit
        this.checkOrderLevels(order);
      }
    }
  }

  private checkOrderLevels(order: Order): void {
    const currentPrice = order.currentPrice;
    
    // Check stop loss
    if (order.stopLoss) {
      const shouldTriggerSL = order.side === 'buy' 
        ? currentPrice <= order.stopLoss
        : currentPrice >= order.stopLoss;
        
      if (shouldTriggerSL) {
        console.log(`Stop loss triggered for ${order.id}`);
        this.closePosition(order.id).catch(console.error);
        return;
      }
    }
    
    // Check take profit
    if (order.takeProfit) {
      const shouldTriggerTP = order.side === 'buy'
        ? currentPrice >= order.takeProfit
        : currentPrice <= order.takeProfit;
        
      if (shouldTriggerTP) {
        console.log(`Take profit triggered for ${order.id}`);
        this.closePosition(order.id).catch(console.error);
        return;
      }
    }
  }

  private calculateProfit(order: Order, currentPrice: number): number {
    const priceDiff = order.side === 'buy' 
      ? currentPrice - order.openPrice
      : order.openPrice - currentPrice;
      
    const pipValue = this.getPipValue(order.symbol);
    const profitInPips = priceDiff / pipValue;
    
    // Simplified profit calculation (would need proper lot size and account currency conversion)
    return profitInPips * order.volume * 10 - order.commission;
  }

  private calculateCommission(volume: number, symbol: string): number {
    // Simplified commission calculation
    return volume * 0.7; // $0.70 per lot for major pairs
  }

  private getPipValue(symbol: string): number {
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

  private async getCurrentPrice(symbol: string, side: 'buy' | 'sell'): Promise<number> {
    // In real implementation, this would fetch from market data service
    // For demo, return mock prices
    const basePrices: { [key: string]: number } = {
      'EURUSD': 1.0850,
      'GBPUSD': 1.2650,
      'USDJPY': 149.50,
      'USDCHF': 0.9125,
      'AUDUSD': 0.6580,
      'USDCAD': 1.3720,
      'NZDUSD': 0.6120
    };
    
    const basePrice = basePrices[symbol] || 1.0000;
    const spread = symbol === 'USDJPY' ? 0.02 : 0.00015;
    
    return side === 'buy' ? basePrice + spread : basePrice;
  }

  private validateOrderRequest(request: OrderRequest): void {
    if (!request.symbol || !request.type || !request.side || !request.volume) {
      throw new Error('Invalid order request: missing required fields');
    }
    
    if (request.volume <= 0) {
      throw new Error('Invalid order request: volume must be positive');
    }
    
    if (request.type === 'limit' && !request.price) {
      throw new Error('Invalid order request: limit orders require a price');
    }
  }

  private generateOrderId(): string {
    return `WZ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public getters
  getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  getOpenOrders(): Order[] {
    return Array.from(this.orders.values()).filter(o => o.status === 'open');
  }

  getPositionBySymbol(symbol: string): Order | null {
    return Array.from(this.orders.values()).find(o => o.symbol === symbol && o.status === 'open') || null;
  }

  getOpenPositionsCount(): number {
    return this.getOpenOrders().length;
  }

  getTotalProfit(): number {
    return this.getOpenOrders().reduce((total, order) => total + order.profit, 0);
  }

  getOrderById(orderId: string): Order | null {
    return this.orders.get(orderId) || null;
  }
}