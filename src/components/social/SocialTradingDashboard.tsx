import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SocialTradingService, TraderProfile, StrategyListing, ForumPost } from '@/services/SocialTradingService';
import { Users, TrendingUp, MessageSquare, Award, Star, Copy } from 'lucide-react';

export const SocialTradingDashboard = () => {
  const [socialService] = useState(() => SocialTradingService.getInstance());
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [strategies, setStrategies] = useState<StrategyListing[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);

  useEffect(() => {
    loadSocialData();
  }, []);

  const loadSocialData = async () => {
    const [leaderboardData, strategiesData, postsData] = await Promise.all([
      socialService.getLeaderboard(),
      socialService.getStrategyListings(),
      socialService.getForumPosts()
    ]);

    setLeaderboard(leaderboardData);
    setStrategies(strategiesData);
    setForumPosts(postsData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Social Trading Hub
          </CardTitle>
          <CardDescription>
            Connect, learn, and trade with the community
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="strategies">Strategy Marketplace</TabsTrigger>
          <TabsTrigger value="copy">Copy Trading</TabsTrigger>
          <TabsTrigger value="forum">Community Forum</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Traders This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard?.traders.map((entry: any, index: number) => (
                <div key={entry.trader.id} className="flex items-center justify-between p-4 border rounded-lg mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-primary">#{entry.rank}</div>
                    <Avatar>
                      <AvatarFallback>{entry.trader.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{entry.trader.displayName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {entry.trader.followers} followers • {entry.trader.totalTrades} trades
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">+{entry.performance.return}%</p>
                    <p className="text-sm text-muted-foreground">{entry.performance.winRate}% win rate</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-1" />
                    Follow
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {strategies.map((strategy) => (
              <Card key={strategy.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {strategy.name}
                    <Badge variant="outline">{strategy.category}</Badge>
                  </CardTitle>
                  <CardDescription>{strategy.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Monthly Return:</span>
                        <p className="text-green-600">+{strategy.performance.monthlyReturn}%</p>
                      </div>
                      <div>
                        <span className="font-medium">Win Rate:</span>
                        <p>{strategy.performance.winRate}%</p>
                      </div>
                      <div>
                        <span className="font-medium">Subscribers:</span>
                        <p>{strategy.subscribers}</p>
                      </div>
                      <div>
                        <span className="font-medium">Price:</span>
                        <p className="font-bold">${strategy.price}/month</p>
                      </div>
                    </div>
                    <Button className="w-full">Subscribe</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="copy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Copy Trading</CardTitle>
              <CardDescription>Automatically copy trades from successful traders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Copy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Copy trading functionality is ready</p>
                <p className="text-sm text-muted-foreground">Follow traders from the leaderboard to start copying their trades</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forum" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Community Discussions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forumPosts.map((post) => (
                  <div key={post.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{post.title}</h4>
                      <Badge variant="outline">{post.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{post.content}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>❤️ {post.likes}</span>
                      <span>💬 {post.replies}</span>
                      <span>👁️ {post.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};