export interface Account {
  balance: number;
  profit: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  currency: string;
}

export interface WithdrawalRecord {
  id: string;
  timestamp: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'completed';
  broker?: string;
  method: string;
  fee?: number;
  reference?: string;
}

export interface TriggerHistory {
  id: string;
  timestamp: string;
  profit: number;
  balance: number;
  threshold: number;
  triggered: boolean;
  reason: string;
}

export interface BotMetrics {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  profit24h: number;
  totalProfit: number;
  winRate: number;
  totalTrades: number;
  lastUpdate: string;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  closePrice?: number;
  profit: number;
  openTime: string;
  closeTime?: string;
  status: 'open' | 'closed';
}

export interface NotificationSettings {
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  webhookUrl?: string;
  pushoverToken?: string;
  twilioSettings?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
    toNumber: string;
  };
}

export interface ThresholdSettings {
  profitThreshold: number;
  balanceThreshold: number;
  withdrawalPercentage: number;
  enabled: boolean;
}