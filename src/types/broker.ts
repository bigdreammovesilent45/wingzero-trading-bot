export interface BrokerConnection {
  id: string;
  name: string;
  type: 'cplugin' | 'ctrader' | 'oanda' | 'ib' | 'alpaca';
  status: 'connected' | 'disconnected' | 'error';
  account: string;
  server?: string;
}

export interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  timestamp: number;
  volume?: number;
}

export interface OrderRequest {
  symbol: string;
  type: 'market' | 'limit' | 'stop';
  side: 'buy' | 'sell';
  volume: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStop?: number;
  comment?: string;
}

export interface Order {
  id: string;
  ticket: number;
  symbol: string;
  type: 'market' | 'limit' | 'stop';
  side: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStop?: number;
  profit: number;
  commission: number;
  swap: number;
  openTime: string;
  status: 'pending' | 'open' | 'closed' | 'cancelled';
  comment?: string;
}

export interface TradingSignal {
  symbol: string;
  action: 'buy' | 'sell' | 'close' | 'hold';
  strength: number; // 0-100
  confidence: number; // 0-100
  currentPrice?: number;
  price?: number;
  indicators: {
    trend: 'bullish' | 'bearish' | 'neutral';
    momentum: 'strong' | 'weak' | 'neutral';
    volume: 'high' | 'low' | 'normal';
    support: number;
    resistance: number;
    close?: number;
  };
  timestamp: number;
}

export interface RiskMetrics {
  totalExposure: number;
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxRiskPerTrade: number;
  currentRisk: number;
}