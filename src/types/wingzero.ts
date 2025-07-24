// Wing Zero API Types and Interfaces
export interface WingZeroConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  clientId: string;
  environment: 'sandbox' | 'production';
  wsEndpoint?: string;
}

export interface WingZeroAccount {
  id: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  currency: string;
  brokerName: string;
  accountNumber: string;
  server: string;
  leverage: number;
  stopoutLevel: number;
  tradeAllowed: boolean;
  expertEnabled: boolean;
}

export interface WingZeroPosition {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  commission: number;
  openTime: string;
  comment?: string;
  magicNumber?: number;
  takeProfit?: number;
  stopLoss?: number;
}

export interface WingZeroOrder {
  id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'buy_limit' | 'sell_limit' | 'buy_stop' | 'sell_stop';
  volume: number;
  price: number;
  currentPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
  expiration?: string;
  comment?: string;
  magicNumber?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  timestamp: string;
}

export interface WingZeroSymbol {
  name: string;
  description: string;
  bid: number;
  ask: number;
  spread: number;
  digits: number;
  minVolume: number;
  maxVolume: number;
  volumeStep: number;
  marginRequired: number;
  swapLong: number;
  swapShort: number;
  tradingAllowed: boolean;
}

export interface WingZeroTrade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  closePrice?: number;
  profit: number;
  commission: number;
  swap: number;
  openTime: string;
  closeTime?: string;
  comment?: string;
  magicNumber?: number;
}

export interface WingZeroMarketData {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  time: string;
  change: number;
  changePercent: number;
}

export interface WingZeroNotification {
  id: string;
  type: 'trade' | 'account' | 'system' | 'error';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export interface WingZeroWebSocketMessage {
  type: 'price' | 'account' | 'position' | 'order' | 'notification';
  data: any;
  timestamp: string;
}

export interface WingZeroApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  ipWhitelist: string[];
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordExpiry: number;
  apiKeyExpiry: number;
  loginNotifications: boolean;
  tradingRestrictions: {
    maxDailyVolume: number;
    maxPositionSize: number;
    allowedSymbols: string[];
    forbiddenSymbols: string[];
    tradingHours: {
      start: string;
      end: string;
      timezone: string;
    };
  };
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country: string;
  timezone: string;
  language: string;
  avatar?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  lastLogin: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    currency: string;
    notifications: NotificationPreferences;
    trading: TradingPreferences;
  };
}

export interface NotificationPreferences {
  email: {
    trades: boolean;
    account: boolean;
    system: boolean;
    news: boolean;
  };
  push: {
    trades: boolean;
    account: boolean;
    system: boolean;
    news: boolean;
  };
  sms: {
    trades: boolean;
    account: boolean;
    security: boolean;
  };
  webhook: {
    enabled: boolean;
    url?: string;
    secret?: string;
  };
}

export interface TradingPreferences {
  defaultVolume: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  autoTrading: boolean;
  copyTrading: boolean;
  maxSpread: number;
  slippage: number;
  confirmations: {
    trades: boolean;
    modifications: boolean;
    closures: boolean;
  };
}