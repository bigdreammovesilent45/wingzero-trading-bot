import { RiskMetrics } from '@/types/broker';

export interface RiskValidation {
  approved: boolean;
  reason?: string;
  suggestedVolume?: number;
}

export interface AccountInfo {
  balance: number;
  equity: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  drawdown: number;
}

export class AdvancedRiskManager {
  private maxRiskPerTrade = 0.02; // 2%
  private maxDailyLoss = 0.05; // 5%
  private maxDrawdown = 0.10; // 10%
  private maxCorrelation = 0.7; // 70%
  private kellyFraction = 0.25; // Kelly Criterion fraction
  
  async initialize(): Promise<void> {
    console.log('🛡️ Advanced Risk Manager initialized');
  }

  async validateTrade(decision: any): Promise<RiskValidation> {
    try {
      // CRITICAL: WING ZERO MANDATE - NO TRADE WITHOUT TP/SL/TS
      if (!decision.stopLoss || decision.stopLoss <= 0) {
        return {
          approved: false,
          reason: 'WING ZERO MANDATE VIOLATION: Every trade MUST have a valid Stop Loss'
        };
      }
      
      if (!decision.takeProfit || decision.takeProfit <= 0) {
        return {
          approved: false,
          reason: 'WING ZERO MANDATE VIOLATION: Every trade MUST have a valid Take Profit'
        };
      }
      
      // Validate risk-reward ratio (minimum 1:1.5)
      const currentPrice = decision.price || decision.currentPrice || 1.0;
      const stopDistance = Math.abs(currentPrice - decision.stopLoss);
      const takeProfitDistance = Math.abs(decision.takeProfit - currentPrice);
      const riskRewardRatio = takeProfitDistance / stopDistance;
      
      if (riskRewardRatio < 1.5) {
        return {
          approved: false,
          reason: `WING ZERO MANDATE VIOLATION: Risk-Reward ratio ${riskRewardRatio.toFixed(2)} is below minimum 1.5`
        };
      }
      
      // Check account health
      const account = await this.getAccountInfo();
      
      // Check if daily loss limit exceeded
      if (account.drawdown > this.maxDailyLoss) {
        return {
          approved: false,
          reason: `Daily loss limit exceeded: ${(account.drawdown * 100).toFixed(1)}%`
        };
      }
      
      // Check maximum drawdown
      if (account.drawdown > this.maxDrawdown) {
        return {
          approved: false,
          reason: `Maximum drawdown exceeded: ${(account.drawdown * 100).toFixed(1)}%`
        };
      }
      
      // Check position correlation
      const correlation = await this.checkPositionCorrelation(decision.symbol);
      if (correlation > this.maxCorrelation) {
        return {
          approved: false,
          reason: `High correlation with existing positions: ${(correlation * 100).toFixed(1)}%`
        };
      }
      
      // Validate position size
      const maxVolume = this.calculateMaxPositionSize(account.balance, decision.confidence);
      if (decision.volume > maxVolume) {
        return {
          approved: true,
          suggestedVolume: maxVolume,
          reason: `Position size reduced for risk management`
        };
      }
      
      console.log(`🛡️ WING ZERO TRADE APPROVED: ${decision.symbol} with TP:${decision.takeProfit}, SL:${decision.stopLoss}, R:R=${riskRewardRatio.toFixed(2)}`);
      return { approved: true };
      
    } catch (error) {
      console.error('Risk validation error:', error);
      return {
        approved: false,
        reason: 'Risk validation failed - system error'
      };
    }
  }

  async calculateOptimalPositionSize(
    symbol: string, 
    winProbability: number, 
    riskReward: number
  ): Promise<number> {
    try {
      const account = await this.getAccountInfo();
      
      // Kelly Criterion: f = (bp - q) / b
      // f = fraction to bet
      // b = odds (risk-reward ratio)
      // p = probability of winning
      // q = probability of losing (1-p)
      
      const p = winProbability;
      const q = 1 - p;
      const b = riskReward;
      
      const kellyFraction = (b * p - q) / b;
      
      // Apply safety margin (quarter Kelly)
      const safeFraction = Math.max(0, kellyFraction * this.kellyFraction);
      
      // Calculate position size based on account balance
      const riskAmount = account.balance * Math.min(safeFraction, this.maxRiskPerTrade);
      
      // Convert to lot size (assuming 1 lot = $100,000 for forex)
      const dollarPerPip = this.getDollarPerPip(symbol);
      const stopLossPips = 50; // Default stop loss in pips
      
      const volume = riskAmount / (stopLossPips * dollarPerPip);
      
      // Round to standard lot sizes
      return Math.max(0.01, Math.round(volume * 100) / 100);
      
    } catch (error) {
      console.error('Error calculating position size:', error);
      return 0.01; // Minimum position size
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    // Mock account info - replace with real broker API call
    return {
      balance: 10000,
      equity: 9800,
      freeMargin: 9500,
      marginLevel: 200,
      profit: -200,
      drawdown: 0.02 // 2%
    };
  }

  private calculateMaxPositionSize(balance: number, confidence: number): number {
    // Scale position size based on confidence
    const baseRisk = this.maxRiskPerTrade;
    const confidenceMultiplier = Math.min(confidence / 100, 1.0);
    const adjustedRisk = baseRisk * confidenceMultiplier;
    
    // Assume $10 per pip for standard calculation
    const dollarPerPip = 10;
    const maxRiskDollars = balance * adjustedRisk;
    const stopLossPips = 50;
    
    return Math.max(0.01, Math.round((maxRiskDollars / (stopLossPips * dollarPerPip)) * 100) / 100);
  }

  private async checkPositionCorrelation(symbol: string): Promise<number> {
    // Simplified correlation check - in reality, would analyze actual position correlations
    const correlatedPairs = {
      'EURUSD': ['GBPUSD', 'AUDUSD'],
      'GBPUSD': ['EURUSD', 'EURGBP'],
      'USDJPY': ['USDCHF', 'USDCAD'],
      'AUDUSD': ['NZDUSD', 'EURUSD']
    };
    
    // Mock: return low correlation for simplicity
    return 0.3;
  }

  private getDollarPerPip(symbol: string): number {
    // Standard pip values for major pairs (1 standard lot)
    const pipValues: { [key: string]: number } = {
      'EURUSD': 10,
      'GBPUSD': 10,
      'AUDUSD': 10,
      'NZDUSD': 10,
      'USDJPY': 9.09, // Approximate
      'USDCHF': 10.2, // Approximate
      'USDCAD': 7.69  // Approximate
    };
    
    return pipValues[symbol] || 10;
  }

  // Value at Risk calculation
  public calculateVaR(positions: any[], confidence: number = 0.95): number {
    // Simplified VaR calculation
    const totalExposure = positions.reduce((sum, pos) => sum + (pos.volume * pos.currentPrice), 0);
    const volatility = 0.02; // 2% daily volatility assumption
    
    // Calculate VaR using parametric method
    const zScore = confidence === 0.95 ? 1.645 : confidence === 0.99 ? 2.326 : 1.96;
    return totalExposure * volatility * zScore;
  }

  // Expected Shortfall (Conditional VaR)
  public calculateExpectedShortfall(positions: any[], confidence: number = 0.95): number {
    const varValue = this.calculateVaR(positions, confidence);
    // ES is typically 1.2-1.3 times VaR for normal distribution
    return varValue * 1.25;
  }

  // Portfolio heat calculation
  public calculatePortfolioHeat(positions: any[]): number {
    return positions.reduce((heat, pos) => {
      const risk = Math.abs(pos.currentPrice - pos.stopLoss) * pos.volume;
      return heat + risk;
    }, 0);
  }

  // WING ZERO MANDATORY RISK PARAMETERS
  public calculateMandatoryStopLoss(price: number, action: 'buy' | 'sell', symbol: string): number {
    const pipValue = this.getDollarPerPip(symbol);
    const stopLossPips = 20; // Minimum 20 pips stop loss
    
    if (action === 'buy') {
      return price - (stopLossPips * pipValue);
    } else {
      return price + (stopLossPips * pipValue);
    }
  }
  
  public calculateMandatoryTakeProfit(price: number, action: 'buy' | 'sell', symbol: string, riskRewardRatio: number = 2.0): number {
    const pipValue = this.getDollarPerPip(symbol);
    const stopLossPips = 20;
    const takeProfitPips = stopLossPips * riskRewardRatio; // Minimum 2:1 risk-reward
    
    if (action === 'buy') {
      return price + (takeProfitPips * pipValue);
    } else {
      return price - (takeProfitPips * pipValue);
    }
  }
  
  public calculateTrailingStopDistance(symbol: string): number {
    const pipValue = this.getDollarPerPip(symbol);
    return 15 * pipValue; // 15 pips trailing stop distance
  }
}