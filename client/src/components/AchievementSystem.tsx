import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Star, 
  Target, 
  Award, 
  Calendar,
  Zap,
  Heart,
  Brain,
  Users,
  Crown,
  Sparkles,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  badgeIcon: string;
  badgeColor: string;
  criteria: any;
  rarity: string;
  pointValue: number;
  isActive: boolean;
  unlockedAt?: Date;
}

interface DailyChallenge {
  title: string;
  scenario: string;
  constraints: string[];
  difficulty: string;
  reward: string;
}

interface AchievementSystemProps {
  userId: number;
}

export function AchievementSystem({ userId }: AchievementSystemProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch user achievements
  const { data: achievementsData } = useQuery({
    queryKey: ['achievements', userId],
    queryFn: async () => {
      const response = await fetch(`/api/enhanced/achievements/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch achievements');
      return response.json();
    },
  });

  // Fetch daily challenge
  const { data: dailyChallenge } = useQuery({
    queryKey: ['daily-challenge'],
    queryFn: async () => {
      const response = await fetch('/api/enhanced/challenge/daily');
      if (!response.ok) throw new Error('Failed to fetch daily challenge');
      return response.json();
    },
  });

  const achievements = achievementsData?.achievements || [];

  // Achievement categories
  const categories = [
    { id: 'all', name: 'All', icon: Trophy },
    { id: 'storytelling', name: 'Storytelling', icon: Brain },
    { id: 'creativity', name: 'Creativity', icon: Sparkles },
    { id: 'consistency', name: 'Consistency', icon: Target },
    { id: 'social', name: 'Social', icon: Users },
    { id: 'cultural', name: 'Cultural', icon: Heart }
  ];

  // Predefined achievements (full list)
  const allPossibleAchievements = [
    {
      id: 'master_storyteller',
      name: 'Master Storyteller',
      description: 'Create an alibi with 9+ believability score',
      category: 'storytelling',
      badgeIcon: 'trophy',
      badgeColor: 'gold',
      rarity: 'legendary',
      pointValue: 100
    },
    {
      id: 'believable_artist',
      name: 'Believable Artist', 
      description: 'Achieve 8.5+ believability score',
      category: 'storytelling',
      badgeIcon: 'star',
      badgeColor: 'silver',
      rarity: 'epic',
      pointValue: 75
    },
    {
      id: 'armenian_pride',
      name: 'Armenian Pride',
      description: 'Use Armenian phrases in your alibi',
      category: 'cultural',
      badgeIcon: 'heart',
      badgeColor: 'red',
      rarity: 'common',
      pointValue: 25
    },
    {
      id: 'detail_master',
      name: 'Detail Master',
      description: 'Create an alibi with 400+ words',
      category: 'creativity',
      badgeIcon: 'brain',
      badgeColor: 'purple',
      rarity: 'rare',
      pointValue: 50
    },
    {
      id: 'frequent_fibber',
      name: 'Frequent Fibber',
      description: 'Complete 10 alibi sessions',
      category: 'consistency',
      badgeIcon: 'target',
      badgeColor: 'blue',
      rarity: 'uncommon',
      pointValue: 60
    },
    {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Complete alibi in under 2 minutes',
      category: 'efficiency',
      badgeIcon: 'zap',
      badgeColor: 'yellow',
      rarity: 'rare',
      pointValue: 40
    },
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Create alibi before 8 AM',
      category: 'timing',
      badgeIcon: 'clock',
      badgeColor: 'orange',
      rarity: 'uncommon',
      pointValue: 30
    },
    {
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Create alibi after 11 PM',
      category: 'timing',
      badgeIcon: 'moon',
      badgeColor: 'indigo',
      rarity: 'uncommon',
      pointValue: 30
    }
  ];

  const unlockedIds = achievements.map((a: Achievement) => a.achievementId || a.id);
  const filteredAchievements = selectedCategory === 'all' 
    ? allPossibleAchievements 
    : allPossibleAchievements.filter(a => a.category === selectedCategory);

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      trophy: Trophy,
      star: Star,
      heart: Heart,
      brain: Brain,
      target: Target,
      zap: Zap,
      clock: Clock,
      crown: Crown,
      sparkles: Sparkles,
      users: Users
    };
    return icons[iconName] || Award;
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'text-gray-400 border-gray-400',
      uncommon: 'text-green-400 border-green-400', 
      rare: 'text-blue-400 border-blue-400',
      epic: 'text-purple-400 border-purple-400',
      legendary: 'text-yellow-400 border-yellow-400'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Easy: 'bg-green-900/20 text-green-400 border-green-500/30',
      Medium: 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30',
      Hard: 'bg-orange-900/20 text-orange-400 border-orange-500/30',
      Expert: 'bg-red-900/20 text-red-400 border-red-500/30'
    };
    return colors[difficulty as keyof typeof colors] || colors.Easy;
  };

  const totalPoints = achievements.reduce((sum: number, a: Achievement) => sum + (a.pointValue || 0), 0);
  const completionPercentage = (achievements.length / allPossibleAchievements.length) * 100;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#2e2e2e] border-[#272727]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-white">{achievements.length}</div>
                <div className="text-sm text-gray-400">Achievements</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2e2e2e] border-[#272727]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{totalPoints}</div>
                <div className="text-sm text-gray-400">Total Points</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2e2e2e] border-[#272727]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{completionPercentage.toFixed(0)}%</div>
                <div className="text-sm text-gray-400">Completion</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2e2e2e] border-[#272727]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">1</div>
                <div className="text-sm text-gray-400">Daily Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="bg-[#2e2e2e] border-[#272727]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              {achievements.length}/{allPossibleAchievements.length}
            </Badge>
          </div>
          <Progress value={completionPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Daily Challenge */}
      {dailyChallenge?.challenge && (
        <Card className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <Calendar className="h-5 w-5" />
              Daily Challenge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2">{dailyChallenge.challenge.title}</h4>
              <p className="text-gray-300 mb-3">{dailyChallenge.challenge.scenario}</p>
              
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getDifficultyColor(dailyChallenge.challenge.difficulty)}>
                  {dailyChallenge.challenge.difficulty}
                </Badge>
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  <Trophy className="h-3 w-3 mr-1" />
                  {dailyChallenge.challenge.reward}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-white">Constraints:</div>
                {dailyChallenge.challenge.constraints.map((constraint: string, index: number) => (
                  <div key={index} className="text-sm text-gray-300 flex items-center gap-2">
                    <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
                    {constraint}
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
              Accept Challenge
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="achievements" className="space-y-6">
        <TabsList className="bg-[#2e2e2e] border-[#272727]">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>

          {/* Achievement Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredAchievements.map((achievement, index) => {
                const Icon = getIcon(achievement.badgeIcon);
                const isUnlocked = unlockedIds.includes(achievement.id);
                
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`relative transition-all duration-200 ${
                      isUnlocked 
                        ? 'bg-gradient-to-br from-[#2e2e2e] to-[#3a3a3a] border-yellow-500/30' 
                        : 'bg-[#2e2e2e] border-[#272727] opacity-60'
                    }`}>
                      <CardContent className="p-6">
                        {isUnlocked && (
                          <div className="absolute -top-2 -right-2">
                            <div className="bg-yellow-500 rounded-full p-1">
                              <Crown className="h-4 w-4 text-black" />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${
                            isUnlocked ? 'bg-yellow-500/20' : 'bg-[#3a3a3a]'
                          }`}>
                            <Icon className={`h-6 w-6 ${
                              isUnlocked ? 'text-yellow-400' : 'text-gray-500'
                            }`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-semibold ${
                                isUnlocked ? 'text-white' : 'text-gray-400'
                              }`}>
                                {achievement.name}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className={getRarityColor(achievement.rarity)}
                                size="sm"
                              >
                                {achievement.rarity}
                              </Badge>
                            </div>
                            
                            <p className={`text-sm mb-3 ${
                              isUnlocked ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              {achievement.description}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {achievement.pointValue} pts
                              </Badge>
                              {isUnlocked && (
                                <Badge className="bg-green-900/20 text-green-400 border-green-500/30">
                                  <Award className="h-3 w-3 mr-1" />
                                  Unlocked
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card className="bg-[#2e2e2e] border-[#272727]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Community Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                Leaderboard coming soon! Compete with other users for the top spot.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#2e2e2e] border-[#272727]">
              <CardHeader>
                <CardTitle>Achievement Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.slice(1).map(category => {
                    const categoryAchievements = allPossibleAchievements.filter(a => a.category === category.id);
                    const unlockedCount = categoryAchievements.filter(a => unlockedIds.includes(a.id)).length;
                    const percentage = categoryAchievements.length > 0 ? (unlockedCount / categoryAchievements.length) * 100 : 0;
                    
                    return (
                      <div key={category.id}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{category.name}</span>
                          <span className="text-sm text-gray-400">{unlockedCount}/{categoryAchievements.length}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#2e2e2e] border-[#272727]">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievements.slice(0, 5).map((achievement: Achievement, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-[#3a3a3a] rounded">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{achievement.name}</div>
                        <div className="text-xs text-gray-400">
                          {achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : 'Recently unlocked'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {achievements.length === 0 && (
                    <div className="text-center py-4 text-gray-400">
                      Complete your first alibi to start earning achievements!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AchievementSystem;