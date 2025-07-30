import { supabase } from '@/integrations/supabase/client';

export interface TraderProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  totalReturn: number;
  monthlyReturn: number;
  drawdown: number;
  sharpeRatio: number;
  winRate: number;
  totalTrades: number;
  followers: number;
  following: number;
  riskLevel: 'low' | 'medium' | 'high';
  verified: boolean;
  bio?: string;
  strategies: string[];
  joinedAt: string;
}

export interface CopyTradeSettings {
  id: string;
  followerId: string;
  traderId: string;
  isActive: boolean;
  copyRatio: number;
  maxPositionSize: number;
  maxDailyLoss: number;
  allowedSymbols: string[];
  blockedSymbols: string[];
  stopLoss?: number;
  takeProfit?: number;
  createdAt: string;
}

export interface StrategyListing {
  id: string;
  traderId: string;
  name: string;
  description: string;
  price: number;
  performance: {
    totalReturn: number;
    monthlyReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
  };
  subscribers: number;
  category: string;
  tags: string[];
  riskLevel: 'low' | 'medium' | 'high';
  isActive: boolean;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: 'general' | 'strategies' | 'analysis' | 'help' | 'announcements';
  tags: string[];
  likes: number;
  replies: number;
  views: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Leaderboard {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  traders: Array<{
    rank: number;
    trader: TraderProfile;
    performance: {
      return: number;
      trades: number;
      winRate: number;
    };
  }>;
}

export class SocialTradingService {
  private static instance: SocialTradingService;

  static getInstance(): SocialTradingService {
    if (!SocialTradingService.instance) {
      SocialTradingService.instance = new SocialTradingService();
    }
    return SocialTradingService.instance;
  }

  async getTraderProfile(userId: string): Promise<TraderProfile | null> {
    console.log('Getting trader profile for:', userId);
    return {
      id: userId,
      userId: userId,
      displayName: 'Demo Trader',
      totalReturn: 25.5,
      monthlyReturn: 5.2,
      drawdown: -3.1,
      sharpeRatio: 1.8,
      winRate: 67,
      totalTrades: 145,
      followers: 23,
      following: 15,
      riskLevel: 'medium',
      verified: false,
      strategies: ['Momentum', 'Swing Trading'],
      joinedAt: new Date().toISOString()
    };
  }

  async getLeaderboard(): Promise<Leaderboard> {
    return {
      period: 'monthly',
      traders: [
        {
          rank: 1,
          trader: {
            id: '1',
            userId: 'user1',
            displayName: 'AlphaTrader',
            totalReturn: 45.2,
            monthlyReturn: 8.5,
            drawdown: -5.2,
            sharpeRatio: 2.1,
            winRate: 72,
            totalTrades: 156,
            followers: 1247,
            following: 23,
            riskLevel: 'medium',
            verified: true,
            strategies: ['Momentum'],
            joinedAt: '2023-01-15T00:00:00Z'
          },
          performance: { return: 8.5, trades: 156, winRate: 72 }
        }
      ]
    };
  }

  async getStrategyListings(): Promise<StrategyListing[]> {
    return [
      {
        id: 'strategy1',
        traderId: 'user1',
        name: 'EUR/USD Strategy',
        description: 'Professional trading strategy',
        price: 99.99,
        performance: {
          totalReturn: 45.2,
          monthlyReturn: 8.5,
          sharpeRatio: 2.1,
          maxDrawdown: -5.2,
          winRate: 72
        },
        subscribers: 156,
        category: 'Forex',
        tags: ['Momentum'],
        riskLevel: 'medium',
        isActive: true,
        createdAt: '2024-01-15T00:00:00Z'
      }
    ];
  }

  async getForumPosts(): Promise<ForumPost[]> {
    return [
      {
        id: 'post1',
        authorId: 'user1',
        title: 'Trading Guide',
        content: 'Complete trading guide...',
        category: 'strategies',
        tags: ['Guide'],
        likes: 47,
        replies: 12,
        views: 234,
        isPinned: true,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    ];
  }
}