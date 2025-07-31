interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone: string;
  
  // Account information
  account: {
    isVerified: boolean;
    isProfessional: boolean;
    subscriptionLevel: 'free' | 'premium' | 'pro' | 'institutional';
    joinedAt: number;
    lastActive: number;
    accountSize?: number; // Only visible to self and if public
    currency: string;
  };
  
  // Privacy settings
  privacy: {
    isPublic: boolean;
    showAccountSize: boolean;
    showTrades: boolean;
    showPerformance: boolean;
    allowCopying: boolean;
    allowMessages: boolean;
    allowFollowing: boolean;
  };
  
  // Social metrics
  social: {
    followers: number;
    following: number;
    copiers: number;
    posts: number;
    likes: number;
    shares: number;
    comments: number;
    reputation: number; // 0-100
    trustScore: number; // 0-100
    influenceScore: number; // 0-100
  };
  
  // Trading statistics (public if allowed)
  trading?: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    activeDays: number;
    rankPosition?: number;
    percentile?: number;
  };
}

interface FollowRelationship {
  relationshipId: string;
  followerId: string;
  followeeId: string;
  createdAt: number;
  
  // Follow settings
  settings: {
    notifications: {
      newPosts: boolean;
      newTrades: boolean;
      achievements: boolean;
      performanceUpdates: boolean;
    };
    copySettings?: {
      autoCopy: boolean;
      copyAmount: number;
      maxRisk: number;
    };
  };
  
  // Relationship metrics
  engagement: {
    likesGiven: number;
    commentsLeft: number;
    sharesReceived: number;
    interactionScore: number; // 0-100
  };
}

interface SocialPost {
  postId: string;
  authorId: string;
  type: 'text' | 'trade_analysis' | 'market_insight' | 'performance_update' | 'achievement' | 'question';
  createdAt: number;
  updatedAt?: number;
  
  // Content
  content: {
    text: string;
    hashtags: string[];
    mentions: string[]; // User IDs mentioned
    attachments?: Array<{
      type: 'image' | 'chart' | 'trade' | 'document';
      url: string;
      metadata?: any;
    }>;
  };
  
  // Trade-related content
  tradeData?: {
    instrument: string;
    action: 'buy' | 'sell' | 'close';
    price: number;
    quantity: number;
    reasoning: string;
    confidence: number; // 0-100
    timeframe: string;
    strategy?: string;
  };
  
  // Engagement metrics
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    saves: number;
    clicks: number;
    engagementRate: number;
  };
  
  // Content classification
  classification: {
    sentiment: 'positive' | 'negative' | 'neutral';
    topics: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    quality: number; // 0-100
    relevance: number; // 0-100
  };
  
  // Moderation
  moderation: {
    isApproved: boolean;
    flags: Array<{
      type: 'spam' | 'inappropriate' | 'misleading' | 'promotion';
      count: number;
      reportedBy: string[];
    }>;
    moderatedBy?: string;
    moderatedAt?: number;
  };
}

interface SocialComment {
  commentId: string;
  postId: string;
  authorId: string;
  parentCommentId?: string; // For nested comments
  createdAt: number;
  
  content: {
    text: string;
    mentions: string[];
  };
  
  engagement: {
    likes: number;
    replies: number;
  };
  
  moderation: {
    isApproved: boolean;
    flags: number;
  };
}

interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  userId: string;
  score: number;
  percentile: number;
  
  // Category-specific metrics
  metrics: {
    primary: number; // Main metric for this leaderboard
    secondary: number; // Secondary metric
    trend: 'up' | 'down' | 'stable';
    change: number; // Change in rank
  };
  
  // Performance context
  context: {
    timeframe: string;
    trades: number;
    followers: number;
    daysSinceJoined: number;
  };
  
  // Achievements
  achievements: string[];
  badges: string[];
}

interface Leaderboard {
  leaderboardId: string;
  name: string;
  description: string;
  category: 'performance' | 'social' | 'consistency' | 'risk' | 'volume' | 'influence';
  
  // Configuration
  config: {
    timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all_time';
    updateFrequency: number; // minutes
    maxEntries: number;
    minRequirements: {
      minTrades?: number;
      minFollowers?: number;
      minAccountAge?: number; // days
      verifiedOnly?: boolean;
    };
  };
  
  // Calculation
  calculation: {
    primaryMetric: string;
    secondaryMetric?: string;
    algorithm: 'simple' | 'weighted' | 'elo' | 'composite';
    weights?: { [key: string]: number };
  };
  
  // Current data
  entries: LeaderboardEntry[];
  lastUpdated: number;
  totalParticipants: number;
}

interface ReputationEvent {
  eventId: string;
  userId: string;
  type: 'post_liked' | 'post_shared' | 'comment_liked' | 'followed' | 'copied' | 
        'trade_profitable' | 'streak_achieved' | 'milestone_reached' | 'community_contribution' |
        'violation' | 'complaint' | 'warning';
  timestamp: number;
  
  // Impact
  impact: {
    reputationChange: number;
    trustChange: number;
    influenceChange: number;
  };
  
  // Context
  context: {
    relatedId?: string; // Post, trade, or user ID
    description: string;
    category: string;
    severity?: 'low' | 'medium' | 'high';
  };
  
  // Metadata
  metadata: {
    autoGenerated: boolean;
    reviewedBy?: string;
    appealable: boolean;
  };
}

interface Achievement {
  achievementId: string;
  name: string;
  description: string;
  category: 'trading' | 'social' | 'consistency' | 'milestone' | 'special';
  
  // Requirements
  requirements: {
    type: 'single' | 'cumulative' | 'streak' | 'ratio';
    conditions: Array<{
      metric: string;
      operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
      value: number;
      timeframe?: string;
    }>;
  };
  
  // Rewards
  rewards: {
    reputationBonus: number;
    trustBonus: number;
    influenceBonus: number;
    badge?: string;
    title?: string;
  };
  
  // Metadata
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  iconUrl?: string;
  isVisible: boolean;
  isActive: boolean;
}

interface Notification {
  notificationId: string;
  userId: string;
  type: 'follow' | 'like' | 'comment' | 'share' | 'mention' | 'trade_copy' | 
        'achievement' | 'leaderboard' | 'system' | 'performance' | 'warning';
  createdAt: number;
  
  // Content
  title: string;
  message: string;
  actionUrl?: string;
  
  // Status
  status: 'unread' | 'read' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Related data
  relatedUser?: string;
  relatedPost?: string;
  relatedTrade?: string;
  
  // Metadata
  category: string;
  expiresAt?: number;
  batchId?: string; // For batched notifications
}

export class SocialNetworkEngine {
  private userProfiles: Map<string, UserProfile> = new Map();
  private followRelationships: Map<string, FollowRelationship> = new Map();
  private socialPosts: Map<string, SocialPost> = new Map();
  private comments: Map<string, SocialComment[]> = new Map(); // postId -> comments
  private leaderboards: Map<string, Leaderboard> = new Map();
  private reputationEvents: Map<string, ReputationEvent[]> = new Map(); // userId -> events
  private achievements: Map<string, Achievement> = new Map();
  private notifications: Map<string, Notification[]> = new Map(); // userId -> notifications
  
  // Real-time subscriptions
  private followers: Map<string, Set<string>> = new Map(); // userId -> followerIds
  private following: Map<string, Set<string>> = new Map(); // userId -> followingIds
  
  // Activity tracking
  private userActivity: Map<string, {
    lastSeen: number;
    dailyActions: number;
    weeklyActions: number;
    streak: number;
  }> = new Map();
  
  // Processing timers
  private reputationTimer?: NodeJS.Timeout;
  private leaderboardTimer?: NodeJS.Timeout;
  private activityTimer?: NodeJS.Timeout;
  
  // Performance metrics
  private metrics = {
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalInteractions: 0,
    avgEngagementRate: 0,
    leaderboardsUpdated: 0,
    reputationEventsProcessed: 0,
    lastUpdate: 0
  };

  constructor() {
    this.initializeDefaultAchievements();
    this.initializeDefaultLeaderboards();
  }

  async initialize(): Promise<void> {
    console.log('🌐 Initializing Social Network Engine...');
    
    // Load user data
    await this.loadUserProfiles();
    
    // Start reputation processing
    this.startReputationProcessing();
    
    // Start leaderboard updates
    this.startLeaderboardUpdates();
    
    // Start activity monitoring
    this.startActivityMonitoring();
    
    console.log('✅ Social Network Engine initialized');
  }

  // User Management
  async createUserProfile(profile: Omit<UserProfile, 'social' | 'trading'>): Promise<string> {
    const userId = profile.userId;
    
    const userProfile: UserProfile = {
      ...profile,
      social: {
        followers: 0,
        following: 0,
        copiers: 0,
        posts: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        reputation: 50, // Starting reputation
        trustScore: 50,
        influenceScore: 0
      }
    };

    this.userProfiles.set(userId, userProfile);
    this.initializeUserCollections(userId);
    
    // Generate welcome achievement
    await this.checkAndAwardAchievements(userId);
    
    this.metrics.totalUsers++;
    console.log(`✅ User profile created: ${profile.username}`);
    
    return userId;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const existing = this.userProfiles.get(userId);
    if (!existing) {
      throw new Error(`User not found: ${userId}`);
    }

    const updated = { ...existing, ...updates };
    this.userProfiles.set(userId, updated);
    
    console.log(`✅ User profile updated: ${userId}`);
  }

  async deleteUserProfile(userId: string): Promise<void> {
    // Remove user and all associated data
    this.userProfiles.delete(userId);
    this.reputationEvents.delete(userId);
    this.notifications.delete(userId);
    this.userActivity.delete(userId);
    
    // Remove from follow relationships
    const userFollowers = this.followers.get(userId) || new Set();
    const userFollowing = this.following.get(userId) || new Set();
    
    for (const followerId of userFollowers) {
      await this.unfollowUser(followerId, userId);
    }
    
    for (const followingId of userFollowing) {
      await this.unfollowUser(userId, followingId);
    }
    
    console.log(`✅ User profile deleted: ${userId}`);
  }

  // Follow System
  async followUser(followerId: string, followeeId: string, settings?: FollowRelationship['settings']): Promise<void> {
    if (followerId === followeeId) {
      throw new Error('Cannot follow yourself');
    }

    const follower = this.userProfiles.get(followerId);
    const followee = this.userProfiles.get(followeeId);
    
    if (!follower || !followee) {
      throw new Error('User not found');
    }

    if (!followee.privacy.allowFollowing) {
      throw new Error('User does not allow following');
    }

    // Check if already following
    const existingRelation = this.findFollowRelationship(followerId, followeeId);
    if (existingRelation) {
      throw new Error('Already following this user');
    }

    const relationshipId = `follow_${followerId}_${followeeId}`;
    const relationship: FollowRelationship = {
      relationshipId,
      followerId,
      followeeId,
      createdAt: Date.now(),
      settings: settings || {
        notifications: {
          newPosts: true,
          newTrades: false,
          achievements: false,
          performanceUpdates: false
        }
      },
      engagement: {
        likesGiven: 0,
        commentsLeft: 0,
        sharesReceived: 0,
        interactionScore: 0
      }
    };

    this.followRelationships.set(relationshipId, relationship);
    
    // Update follow maps
    if (!this.followers.has(followeeId)) this.followers.set(followeeId, new Set());
    if (!this.following.has(followerId)) this.following.set(followerId, new Set());
    
    this.followers.get(followeeId)!.add(followerId);
    this.following.get(followerId)!.add(followeeId);
    
    // Update social metrics
    follower.social.following++;
    followee.social.followers++;
    
    // Generate reputation event
    await this.addReputationEvent(followeeId, {
      type: 'followed',
      context: {
        relatedId: followerId,
        description: `Followed by ${follower.username}`,
        category: 'social'
      },
      impact: {
        reputationChange: 1,
        trustChange: 0,
        influenceChange: 1
      }
    });
    
    // Send notification
    await this.sendNotification(followeeId, {
      type: 'follow',
      title: 'New Follower',
      message: `${follower.username} started following you`,
      relatedUser: followerId,
      priority: 'normal'
    });
    
    console.log(`✅ ${follower.username} is now following ${followee.username}`);
  }

  async unfollowUser(followerId: string, followeeId: string): Promise<void> {
    const relationship = this.findFollowRelationship(followerId, followeeId);
    if (!relationship) {
      throw new Error('Not following this user');
    }

    this.followRelationships.delete(relationship.relationshipId);
    
    // Update follow maps
    this.followers.get(followeeId)?.delete(followerId);
    this.following.get(followerId)?.delete(followeeId);
    
    // Update social metrics
    const follower = this.userProfiles.get(followerId);
    const followee = this.userProfiles.get(followeeId);
    
    if (follower) follower.social.following--;
    if (followee) followee.social.followers--;
    
    console.log(`✅ ${followerId} unfollowed ${followeeId}`);
  }

  // Content Management
  async createPost(authorId: string, postData: Omit<SocialPost, 'postId' | 'authorId' | 'createdAt' | 'engagement' | 'classification' | 'moderation'>): Promise<string> {
    const author = this.userProfiles.get(authorId);
    if (!author) {
      throw new Error('User not found');
    }

    const postId = this.generatePostId();
    const post: SocialPost = {
      postId,
      authorId,
      createdAt: Date.now(),
      ...postData,
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        saves: 0,
        clicks: 0,
        engagementRate: 0
      },
      classification: await this.classifyContent(postData.content.text),
      moderation: {
        isApproved: true, // Auto-approve for now
        flags: []
      }
    };

    this.socialPosts.set(postId, post);
    this.comments.set(postId, []);
    
    // Update user metrics
    author.social.posts++;
    
    // Notify followers
    await this.notifyFollowersOfNewPost(authorId, post);
    
    this.metrics.totalPosts++;
    console.log(`✅ Post created: ${postId} by ${author.username}`);
    
    return postId;
  }

  async likePost(userId: string, postId: string): Promise<void> {
    const post = this.socialPosts.get(postId);
    const user = this.userProfiles.get(userId);
    
    if (!post || !user) {
      throw new Error('Post or user not found');
    }

    // Prevent multiple likes (simplified - would track individual likes)
    post.engagement.likes++;
    user.social.likes++;
    
    // Update engagement rate
    this.updatePostEngagement(post);
    
    // Award reputation to post author
    const author = this.userProfiles.get(post.authorId);
    if (author && post.authorId !== userId) {
      await this.addReputationEvent(post.authorId, {
        type: 'post_liked',
        context: {
          relatedId: postId,
          description: `Post liked by ${user.username}`,
          category: 'engagement'
        },
        impact: {
          reputationChange: 0.5,
          trustChange: 0,
          influenceChange: 0.2
        }
      });
    }
    
    // Update follow relationship engagement
    const relationship = this.findFollowRelationship(userId, post.authorId);
    if (relationship) {
      relationship.engagement.likesGiven++;
      this.updateInteractionScore(relationship);
    }
    
    console.log(`✅ ${user.username} liked post ${postId}`);
  }

  async commentOnPost(userId: string, postId: string, content: string, parentCommentId?: string): Promise<string> {
    const post = this.socialPosts.get(postId);
    const user = this.userProfiles.get(userId);
    
    if (!post || !user) {
      throw new Error('Post or user not found');
    }

    const commentId = this.generateCommentId();
    const comment: SocialComment = {
      commentId,
      postId,
      authorId: userId,
      parentCommentId,
      createdAt: Date.now(),
      content: {
        text: content,
        mentions: this.extractMentions(content)
      },
      engagement: {
        likes: 0,
        replies: 0
      },
      moderation: {
        isApproved: true,
        flags: 0
      }
    };

    const postComments = this.comments.get(postId) || [];
    postComments.push(comment);
    this.comments.set(postId, postComments);
    
    // Update metrics
    post.engagement.comments++;
    user.social.comments++;
    
    // Update engagement rate
    this.updatePostEngagement(post);
    
    // Award reputation
    await this.addReputationEvent(userId, {
      type: 'comment_liked',
      context: {
        relatedId: commentId,
        description: 'Comment posted',
        category: 'engagement'
      },
      impact: {
        reputationChange: 0.2,
        trustChange: 0,
        influenceChange: 0.1
      }
    });
    
    this.metrics.totalComments++;
    console.log(`✅ Comment added: ${commentId} by ${user.username}`);
    
    return commentId;
  }

  // Leaderboard Management
  async updateLeaderboards(): Promise<void> {
    console.log('🏆 Updating leaderboards...');
    
    for (const [leaderboardId, leaderboard] of this.leaderboards.entries()) {
      await this.updateLeaderboard(leaderboardId);
    }
    
    this.metrics.leaderboardsUpdated++;
    console.log('✅ All leaderboards updated');
  }

  private async updateLeaderboard(leaderboardId: string): Promise<void> {
    const leaderboard = this.leaderboards.get(leaderboardId);
    if (!leaderboard) return;

    const eligibleUsers = this.getEligibleUsersForLeaderboard(leaderboard);
    const entries: LeaderboardEntry[] = [];

    for (const userId of eligibleUsers) {
      const user = this.userProfiles.get(userId);
      if (!user || !user.trading) continue;

      const score = this.calculateLeaderboardScore(user, leaderboard);
      const previousEntry = leaderboard.entries.find(e => e.userId === userId);

      const entry: LeaderboardEntry = {
        rank: 0, // Will be set after sorting
        previousRank: previousEntry?.rank,
        userId,
        score,
        percentile: 0, // Will be calculated after sorting
        metrics: {
          primary: this.getMetricValue(user, leaderboard.calculation.primaryMetric),
          secondary: leaderboard.calculation.secondaryMetric ? 
            this.getMetricValue(user, leaderboard.calculation.secondaryMetric) : 0,
          trend: this.calculateTrend(score, previousEntry?.score),
          change: previousEntry ? previousEntry.rank - (entries.length + 1) : 0
        },
        context: {
          timeframe: leaderboard.config.timeframe,
          trades: user.trading.totalTrades,
          followers: user.social.followers,
          daysSinceJoined: Math.floor((Date.now() - user.account.joinedAt) / (1000 * 60 * 60 * 24))
        },
        achievements: await this.getUserAchievements(userId),
        badges: await this.getUserBadges(userId)
      };

      entries.push(entry);
    }

    // Sort by score (descending)
    entries.sort((a, b) => b.score - a.score);

    // Assign ranks and percentiles
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
      entry.percentile = ((entries.length - index) / entries.length) * 100;
      entry.metrics.change = entry.previousRank ? entry.previousRank - entry.rank : 0;
    });

    // Limit to max entries
    leaderboard.entries = entries.slice(0, leaderboard.config.maxEntries);
    leaderboard.lastUpdated = Date.now();
    leaderboard.totalParticipants = eligibleUsers.length;

    // Notify users of rank changes
    await this.notifyRankChanges(leaderboard);
  }

  // Reputation System
  async addReputationEvent(userId: string, eventData: Omit<ReputationEvent, 'eventId' | 'userId' | 'timestamp' | 'metadata'>): Promise<void> {
    const user = this.userProfiles.get(userId);
    if (!user) return;

    const eventId = this.generateReputationEventId();
    const event: ReputationEvent = {
      eventId,
      userId,
      timestamp: Date.now(),
      ...eventData,
      metadata: {
        autoGenerated: true,
        appealable: eventData.type.includes('violation') || eventData.type.includes('warning')
      }
    };

    if (!this.reputationEvents.has(userId)) {
      this.reputationEvents.set(userId, []);
    }
    this.reputationEvents.get(userId)!.push(event);

    // Apply reputation changes
    user.social.reputation = Math.max(0, Math.min(100, user.social.reputation + event.impact.reputationChange));
    user.social.trustScore = Math.max(0, Math.min(100, user.social.trustScore + event.impact.trustChange));
    user.social.influenceScore = Math.max(0, Math.min(100, user.social.influenceScore + event.impact.influenceChange));

    // Check for achievements
    await this.checkAndAwardAchievements(userId);

    this.metrics.reputationEventsProcessed++;
  }

  async calculateUserReputation(userId: string): Promise<{ reputation: number; breakdown: any }> {
    const events = this.reputationEvents.get(userId) || [];
    const user = this.userProfiles.get(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate reputation from events
    let reputationFromEvents = 50; // Base reputation
    const breakdown = {
      social: 0,
      trading: 0,
      engagement: 0,
      violations: 0,
      achievements: 0
    };

    for (const event of events) {
      reputationFromEvents += event.impact.reputationChange;
      
      // Categorize for breakdown
      switch (event.context.category) {
        case 'social':
          breakdown.social += event.impact.reputationChange;
          break;
        case 'trading':
          breakdown.trading += event.impact.reputationChange;
          break;
        case 'engagement':
          breakdown.engagement += event.impact.reputationChange;
          break;
        case 'violation':
          breakdown.violations += event.impact.reputationChange;
          break;
        case 'achievement':
          breakdown.achievements += event.impact.reputationChange;
          break;
      }
    }

    const finalReputation = Math.max(0, Math.min(100, reputationFromEvents));
    
    return {
      reputation: finalReputation,
      breakdown
    };
  }

  // Achievement System
  async checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
    const user = this.userProfiles.get(userId);
    if (!user) return [];

    const awardedAchievements: Achievement[] = [];
    const userAchievements = await this.getUserAchievements(userId);

    for (const [achievementId, achievement] of this.achievements.entries()) {
      if (!achievement.isActive || userAchievements.includes(achievementId)) continue;

      if (await this.checkAchievementRequirements(userId, achievement)) {
        await this.awardAchievement(userId, achievementId);
        awardedAchievements.push(achievement);
      }
    }

    return awardedAchievements;
  }

  private async checkAchievementRequirements(userId: string, achievement: Achievement): Promise<boolean> {
    const user = this.userProfiles.get(userId);
    if (!user) return false;

    for (const condition of achievement.requirements.conditions) {
      const value = this.getMetricValue(user, condition.metric);
      
      if (!this.evaluateCondition(value, condition.operator, condition.value)) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case '>': return actual > expected;
      case '<': return actual < expected;
      case '>=': return actual >= expected;
      case '<=': return actual <= expected;
      case '==': return actual === expected;
      case '!=': return actual !== expected;
      default: return false;
    }
  }

  private async awardAchievement(userId: string, achievementId: string): Promise<void> {
    const achievement = this.achievements.get(achievementId);
    const user = this.userProfiles.get(userId);
    
    if (!achievement || !user) return;

    // Award reputation bonus
    await this.addReputationEvent(userId, {
      type: 'milestone_reached',
      context: {
        relatedId: achievementId,
        description: `Achievement unlocked: ${achievement.name}`,
        category: 'achievement'
      },
      impact: {
        reputationChange: achievement.rewards.reputationBonus,
        trustChange: achievement.rewards.trustBonus,
        influenceChange: achievement.rewards.influenceBonus
      }
    });

    // Send notification
    await this.sendNotification(userId, {
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: `You've earned the "${achievement.name}" achievement`,
      priority: 'high'
    });

    console.log(`🏆 Achievement awarded: ${achievement.name} to ${user.username}`);
  }

  // Notification System
  async sendNotification(userId: string, notificationData: Omit<Notification, 'notificationId' | 'userId' | 'createdAt' | 'status' | 'category'>): Promise<void> {
    const notificationId = this.generateNotificationId();
    const notification: Notification = {
      notificationId,
      userId,
      createdAt: Date.now(),
      status: 'unread',
      category: notificationData.type,
      ...notificationData
    };

    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId)!.push(notification);

    // Keep only last 100 notifications per user
    const userNotifications = this.notifications.get(userId)!;
    if (userNotifications.length > 100) {
      userNotifications.splice(0, userNotifications.length - 100);
    }

    console.log(`📢 Notification sent to ${userId}: ${notification.title}`);
  }

  // Utility Methods
  private initializeUserCollections(userId: string): void {
    this.reputationEvents.set(userId, []);
    this.notifications.set(userId, []);
    this.followers.set(userId, new Set());
    this.following.set(userId, new Set());
    this.userActivity.set(userId, {
      lastSeen: Date.now(),
      dailyActions: 0,
      weeklyActions: 0,
      streak: 0
    });
  }

  private findFollowRelationship(followerId: string, followeeId: string): FollowRelationship | undefined {
    const relationshipId = `follow_${followerId}_${followeeId}`;
    return this.followRelationships.get(relationshipId);
  }

  private async classifyContent(text: string): Promise<SocialPost['classification']> {
    // Simple content classification (would use AI in production)
    const words = text.toLowerCase().split(' ');
    
    // Sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'profit', 'win', 'success'];
    const negativeWords = ['bad', 'terrible', 'loss', 'fail', 'disaster'];
    
    const positiveCount = words.filter(w => positiveWords.includes(w)).length;
    const negativeCount = words.filter(w => negativeWords.includes(w)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';

    return {
      sentiment,
      topics: ['trading', 'market'], // Simplified
      difficulty: 'intermediate',
      quality: Math.min(100, text.length / 10 + 50), // Simple quality score
      relevance: 85 // Simplified
    };
  }

  private updatePostEngagement(post: SocialPost): void {
    const totalEngagement = post.engagement.likes + post.engagement.comments + post.engagement.shares;
    post.engagement.engagementRate = post.engagement.views > 0 ? 
      (totalEngagement / post.engagement.views) * 100 : 0;
  }

  private updateInteractionScore(relationship: FollowRelationship): void {
    const total = relationship.engagement.likesGiven + 
                 relationship.engagement.commentsLeft + 
                 relationship.engagement.sharesReceived;
    relationship.engagement.interactionScore = Math.min(100, total);
  }

  private extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }

  private async notifyFollowersOfNewPost(authorId: string, post: SocialPost): Promise<void> {
    const authorFollowers = this.followers.get(authorId) || new Set();
    
    for (const followerId of authorFollowers) {
      const relationship = this.findFollowRelationship(followerId, authorId);
      
      if (relationship?.settings.notifications.newPosts) {
        const author = this.userProfiles.get(authorId);
        
        await this.sendNotification(followerId, {
          type: 'comment',
          title: 'New Post',
          message: `${author?.username} posted: ${post.content.text.substring(0, 50)}...`,
          relatedPost: post.postId,
          relatedUser: authorId,
          priority: 'normal'
        });
      }
    }
  }

  private getEligibleUsersForLeaderboard(leaderboard: Leaderboard): string[] {
    const eligible: string[] = [];
    
    for (const [userId, user] of this.userProfiles.entries()) {
      if (!user.trading || !user.privacy.showPerformance) continue;
      
      const { minRequirements } = leaderboard.config;
      
      if (minRequirements.minTrades && user.trading.totalTrades < minRequirements.minTrades) continue;
      if (minRequirements.minFollowers && user.social.followers < minRequirements.minFollowers) continue;
      if (minRequirements.verifiedOnly && !user.account.isVerified) continue;
      
      if (minRequirements.minAccountAge) {
        const daysSinceJoined = (Date.now() - user.account.joinedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceJoined < minRequirements.minAccountAge) continue;
      }
      
      eligible.push(userId);
    }
    
    return eligible;
  }

  private calculateLeaderboardScore(user: UserProfile, leaderboard: Leaderboard): number {
    const primaryValue = this.getMetricValue(user, leaderboard.calculation.primaryMetric);
    
    if (leaderboard.calculation.algorithm === 'simple') {
      return primaryValue;
    }
    
    // For weighted calculation
    if (leaderboard.calculation.weights) {
      let score = 0;
      for (const [metric, weight] of Object.entries(leaderboard.calculation.weights)) {
        score += this.getMetricValue(user, metric) * weight;
      }
      return score;
    }
    
    return primaryValue;
  }

  private getMetricValue(user: UserProfile, metric: string): number {
    // Navigate nested object properties
    const parts = metric.split('.');
    let value: any = user;
    
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) return 0;
    }
    
    return typeof value === 'number' ? value : 0;
  }

  private calculateTrend(current: number, previous?: number): 'up' | 'down' | 'stable' {
    if (!previous) return 'stable';
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  }

  private async notifyRankChanges(leaderboard: Leaderboard): Promise<void> {
    for (const entry of leaderboard.entries) {
      if (entry.previousRank && Math.abs(entry.metrics.change) >= 5) {
        const user = this.userProfiles.get(entry.userId);
        if (!user) continue;
        
        const direction = entry.metrics.change > 0 ? 'improved' : 'dropped';
        
        await this.sendNotification(entry.userId, {
          type: 'leaderboard',
          title: 'Rank Update',
          message: `Your rank ${direction} to #${entry.rank} in ${leaderboard.name}`,
          priority: 'normal'
        });
      }
    }
  }

  private async getUserAchievements(userId: string): Promise<string[]> {
    // Mock implementation - would query achievement records
    return ['newcomer', 'first_follower'];
  }

  private async getUserBadges(userId: string): Promise<string[]> {
    const user = this.userProfiles.get(userId);
    if (!user) return [];
    
    const badges: string[] = [];
    
    if (user.account.isVerified) badges.push('verified');
    if (user.account.isProfessional) badges.push('professional');
    if (user.social.followers > 1000) badges.push('influencer');
    if (user.social.reputation > 90) badges.push('trusted');
    
    return badges;
  }

  private initializeDefaultAchievements(): void {
    const defaultAchievements: Achievement[] = [
      {
        achievementId: 'newcomer',
        name: 'Newcomer',
        description: 'Welcome to the community!',
        category: 'milestone',
        requirements: {
          type: 'single',
          conditions: []
        },
        rewards: {
          reputationBonus: 5,
          trustBonus: 0,
          influenceBonus: 0,
          badge: 'newcomer'
        },
        rarity: 'common',
        isVisible: true,
        isActive: true
      },
      {
        achievementId: 'first_follower',
        name: 'First Follower',
        description: 'Gained your first follower',
        category: 'social',
        requirements: {
          type: 'single',
          conditions: [{
            metric: 'social.followers',
            operator: '>=',
            value: 1
          }]
        },
        rewards: {
          reputationBonus: 3,
          trustBonus: 1,
          influenceBonus: 2
        },
        rarity: 'common',
        isVisible: true,
        isActive: true
      }
    ];

    for (const achievement of defaultAchievements) {
      this.achievements.set(achievement.achievementId, achievement);
    }
  }

  private initializeDefaultLeaderboards(): void {
    const defaultLeaderboards: Leaderboard[] = [
      {
        leaderboardId: 'total_return',
        name: 'Total Return',
        description: 'Traders with highest total returns',
        category: 'performance',
        config: {
          timeframe: 'all_time',
          updateFrequency: 60,
          maxEntries: 100,
          minRequirements: {
            minTrades: 10,
            minAccountAge: 30
          }
        },
        calculation: {
          primaryMetric: 'trading.totalReturn',
          algorithm: 'simple'
        },
        entries: [],
        lastUpdated: 0,
        totalParticipants: 0
      },
      {
        leaderboardId: 'social_influence',
        name: 'Social Influence',
        description: 'Most influential community members',
        category: 'social',
        config: {
          timeframe: 'monthly',
          updateFrequency: 30,
          maxEntries: 50,
          minRequirements: {
            minFollowers: 10
          }
        },
        calculation: {
          primaryMetric: 'social.influenceScore',
          algorithm: 'weighted',
          weights: {
            'social.followers': 0.4,
            'social.reputation': 0.3,
            'social.posts': 0.2,
            'social.likes': 0.1
          }
        },
        entries: [],
        lastUpdated: 0,
        totalParticipants: 0
      }
    ];

    for (const leaderboard of defaultLeaderboards) {
      this.leaderboards.set(leaderboard.leaderboardId, leaderboard);
    }
  }

  private async loadUserProfiles(): Promise<void> {
    // Mock implementation - would load from database
    console.log('📂 Loading user profiles...');
  }

  private startReputationProcessing(): void {
    this.reputationTimer = setInterval(() => {
      // Process reputation decay, calculate trends, etc.
      this.processReputationMaintenance();
    }, 3600000); // Every hour
  }

  private startLeaderboardUpdates(): void {
    this.leaderboardTimer = setInterval(() => {
      this.updateLeaderboards();
    }, 1800000); // Every 30 minutes
  }

  private startActivityMonitoring(): void {
    this.activityTimer = setInterval(() => {
      this.updateActivityMetrics();
    }, 60000); // Every minute
  }

  private processReputationMaintenance(): void {
    // Apply daily reputation decay for inactive users
    for (const [userId, user] of this.userProfiles.entries()) {
      const activity = this.userActivity.get(userId);
      if (activity && activity.lastSeen < Date.now() - 7 * 24 * 60 * 60 * 1000) {
        // Apply small reputation decay for inactive users
        user.social.reputation = Math.max(0, user.social.reputation - 0.1);
      }
    }
  }

  private updateActivityMetrics(): void {
    this.metrics.activeUsers = Array.from(this.userActivity.values())
      .filter(activity => activity.lastSeen > Date.now() - 24 * 60 * 60 * 1000).length;
    
    this.metrics.lastUpdate = Date.now();
  }

  private generatePostId(): string {
    return `post_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateCommentId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateReputationEventId(): string {
    return `rep_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  // Public API
  getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }

  getUserFollowers(userId: string): string[] {
    return Array.from(this.followers.get(userId) || new Set());
  }

  getUserFollowing(userId: string): string[] {
    return Array.from(this.following.get(userId) || new Set());
  }

  getPost(postId: string): SocialPost | undefined {
    return this.socialPosts.get(postId);
  }

  getPostComments(postId: string): SocialComment[] {
    return this.comments.get(postId) || [];
  }

  getLeaderboard(leaderboardId: string): Leaderboard | undefined {
    return this.leaderboards.get(leaderboardId);
  }

  getAllLeaderboards(): Leaderboard[] {
    return Array.from(this.leaderboards.values());
  }

  getUserNotifications(userId: string): Notification[] {
    return this.notifications.get(userId) || [];
  }

  getMetrics() {
    return { ...this.metrics };
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Social Network Engine...');
    
    if (this.reputationTimer) clearInterval(this.reputationTimer);
    if (this.leaderboardTimer) clearInterval(this.leaderboardTimer);
    if (this.activityTimer) clearInterval(this.activityTimer);
    
    this.userProfiles.clear();
    this.followRelationships.clear();
    this.socialPosts.clear();
    this.comments.clear();
    this.leaderboards.clear();
    this.reputationEvents.clear();
    this.achievements.clear();
    this.notifications.clear();
    this.followers.clear();
    this.following.clear();
    this.userActivity.clear();
    
    console.log('✅ Social Network Engine shutdown complete');
  }
}