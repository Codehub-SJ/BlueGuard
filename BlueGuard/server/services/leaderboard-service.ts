// Carbon Credit Leaderboard and Achievement System

interface UserScore {
  userId: string;
  username: string;
  totalCredits: number;
  monthlyCredits: number;
  rank: number;
  previousRank: number;
  achievements: Achievement[];
  conservationImpact: {
    treesEquivalent: number;
    co2Offset: number; // tons
    biodiversityPoints: number;
  };
  streak: {
    current: number; // days
    longest: number;
  };
  location?: {
    region: string;
    lat: number;
    lon: number;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'milestone' | 'streak' | 'activity' | 'impact' | 'community';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedAt: Date;
  requirements: {
    credits?: number;
    reports?: number;
    streak?: number;
    trades?: number;
  };
}

interface LeaderboardPeriod {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time';
  startDate: Date;
  endDate: Date;
  topUsers: UserScore[];
  totalParticipants: number;
  regionFilter?: string;
}

export class LeaderboardService {
  private achievements: Map<string, Omit<Achievement, 'unlockedAt'>> = new Map();
  private userScores: Map<string, UserScore> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.setupAchievements();
    await this.generateMockLeaderboardData();
    
    this.isInitialized = true;
    console.log('Leaderboard Service initialized');
  }

  private setupAchievements(): void {
    const achievements = [
      // Milestone Achievements
      {
        id: 'first_credit',
        name: 'First Steps',
        description: 'Earned your first carbon credit',
        icon: '🌱',
        type: 'milestone' as const,
        tier: 'bronze' as const,
        requirements: { credits: 1 }
      },
      {
        id: 'hundred_credits',
        name: 'Century Club',
        description: 'Accumulated 100 carbon credits',
        icon: '💯',
        type: 'milestone' as const,
        tier: 'silver' as const,
        requirements: { credits: 100 }
      },
      {
        id: 'thousand_credits',
        name: 'Carbon Champion',
        description: 'Reached 1,000 carbon credits',
        icon: '🏆',
        type: 'milestone' as const,
        tier: 'gold' as const,
        requirements: { credits: 1000 }
      },
      {
        id: 'mega_credits',
        name: 'Eco Warrior',
        description: 'Achieved 5,000 carbon credits',
        icon: '⚡',
        type: 'milestone' as const,
        tier: 'platinum' as const,
        requirements: { credits: 5000 }
      },

      // Streak Achievements
      {
        id: 'week_streak',
        name: 'Consistent Contributor',
        description: 'Maintained a 7-day activity streak',
        icon: '🔥',
        type: 'streak' as const,
        tier: 'bronze' as const,
        requirements: { streak: 7 }
      },
      {
        id: 'month_streak',
        name: 'Dedication Award',
        description: 'Maintained a 30-day activity streak',
        icon: '📅',
        type: 'streak' as const,
        tier: 'silver' as const,
        requirements: { streak: 30 }
      },
      {
        id: 'quarter_streak',
        name: 'Unstoppable Force',
        description: 'Maintained a 90-day activity streak',
        icon: '🚀',
        type: 'streak' as const,
        tier: 'gold' as const,
        requirements: { streak: 90 }
      },

      // Activity Achievements
      {
        id: 'first_report',
        name: 'Coastal Guardian',
        description: 'Submitted your first incident report',
        icon: '🛡️',
        type: 'activity' as const,
        tier: 'bronze' as const,
        requirements: { reports: 1 }
      },
      {
        id: 'ten_reports',
        name: 'Community Watchdog',
        description: 'Submitted 10 incident reports',
        icon: '👁️',
        type: 'activity' as const,
        tier: 'silver' as const,
        requirements: { reports: 10 }
      },
      {
        id: 'fifty_reports',
        name: 'Environmental Detective',
        description: 'Submitted 50 incident reports',
        icon: '🔍',
        type: 'activity' as const,
        tier: 'gold' as const,
        requirements: { reports: 50 }
      },

      // Trading Achievements
      {
        id: 'first_trade',
        name: 'Market Participant',
        description: 'Completed your first carbon credit trade',
        icon: '💰',
        type: 'activity' as const,
        tier: 'bronze' as const,
        requirements: { trades: 1 }
      },
      {
        id: 'active_trader',
        name: 'Carbon Broker',
        description: 'Completed 25 trades',
        icon: '📈',
        type: 'activity' as const,
        tier: 'silver' as const,
        requirements: { trades: 25 }
      },

      // Impact Achievements
      {
        id: 'tree_saver',
        name: 'Tree Saver',
        description: 'Offset equivalent to 100 trees',
        icon: '🌳',
        type: 'impact' as const,
        tier: 'silver' as const,
        requirements: { credits: 500 } // 500 credits ≈ 100 trees
      },
      {
        id: 'forest_protector',
        name: 'Forest Protector',
        description: 'Offset equivalent to 1,000 trees',
        icon: '🌲',
        type: 'impact' as const,
        tier: 'gold' as const,
        requirements: { credits: 5000 }
      }
    ];

    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  async getLeaderboard(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time' = 'monthly',
    limit: number = 50,
    regionFilter?: string
  ): Promise<LeaderboardPeriod> {
    if (!this.isInitialized) await this.initialize();

    const { startDate, endDate } = this.getPeriodDates(period);
    
    // Filter and sort users
    let users = Array.from(this.userScores.values());
    
    if (regionFilter) {
      users = users.filter(user => 
        user.location?.region?.toLowerCase().includes(regionFilter.toLowerCase())
      );
    }

    // Sort by total credits (in real app, filter by period)
    users.sort((a, b) => b.totalCredits - a.totalCredits);
    
    // Update ranks
    users.forEach((user, index) => {
      user.previousRank = user.rank;
      user.rank = index + 1;
    });

    const topUsers = users.slice(0, limit);

    return {
      period,
      startDate,
      endDate,
      topUsers,
      totalParticipants: users.length,
      regionFilter
    };
  }

  async getUserScore(userId: string): Promise<UserScore | null> {
    if (!this.isInitialized) await this.initialize();
    return this.userScores.get(userId) || null;
  }

  async updateUserScore(
    userId: string, 
    username: string,
    creditsEarned: number,
    activity: {
      type: 'report' | 'trade' | 'conservation';
      location?: { lat: number; lon: number; region: string };
    }
  ): Promise<{
    newScore: UserScore;
    newAchievements: Achievement[];
    rankChange: number;
  }> {
    if (!this.isInitialized) await this.initialize();

    let userScore = this.userScores.get(userId);
    
    if (!userScore) {
      userScore = {
        userId,
        username,
        totalCredits: 0,
        monthlyCredits: 0,
        rank: 0,
        previousRank: 0,
        achievements: [],
        conservationImpact: {
          treesEquivalent: 0,
          co2Offset: 0,
          biodiversityPoints: 0
        },
        streak: {
          current: 0,
          longest: 0
        },
        location: activity.location
      };
    }

    const previousRank = userScore.rank;
    
    // Update credits
    userScore.totalCredits += creditsEarned;
    userScore.monthlyCredits += creditsEarned; // Simplified - in real app, calculate monthly
    
    // Update conservation impact
    userScore.conservationImpact.treesEquivalent = Math.floor(userScore.totalCredits / 5); // 5 credits per tree
    userScore.conservationImpact.co2Offset = userScore.totalCredits * 0.002; // 0.002 tons per credit
    userScore.conservationImpact.biodiversityPoints += creditsEarned * 2;
    
    // Update streak (simplified)
    userScore.streak.current += 1;
    userScore.streak.longest = Math.max(userScore.streak.longest, userScore.streak.current);
    
    // Update location if provided
    if (activity.location) {
      userScore.location = activity.location;
    }

    // Check for new achievements
    const newAchievements = await this.checkAchievements(userScore, activity);
    userScore.achievements.push(...newAchievements);

    this.userScores.set(userId, userScore);

    // Recalculate rank
    const allUsers = Array.from(this.userScores.values());
    allUsers.sort((a, b) => b.totalCredits - a.totalCredits);
    const newRank = allUsers.findIndex(u => u.userId === userId) + 1;
    userScore.rank = newRank;

    const rankChange = previousRank > 0 ? previousRank - newRank : 0;

    return {
      newScore: userScore,
      newAchievements,
      rankChange
    };
  }

  private async checkAchievements(
    userScore: UserScore, 
    activity: { type: 'report' | 'trade' | 'conservation' }
  ): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];
    const existingAchievementIds = new Set(userScore.achievements.map(a => a.id));
    
    // Count user activities (simplified - in real app, query from database)
    const userReports = this.estimateUserReports(userScore.totalCredits);
    const userTrades = this.estimateUserTrades(userScore.totalCredits);

    for (const [id, achievementTemplate] of this.achievements) {
      if (existingAchievementIds.has(id)) continue;

      let unlocked = false;

      // Check requirements
      if (achievementTemplate.requirements.credits) {
        unlocked = userScore.totalCredits >= achievementTemplate.requirements.credits;
      }
      
      if (achievementTemplate.requirements.reports) {
        unlocked = userReports >= achievementTemplate.requirements.reports;
      }
      
      if (achievementTemplate.requirements.trades) {
        unlocked = userTrades >= achievementTemplate.requirements.trades;
      }
      
      if (achievementTemplate.requirements.streak) {
        unlocked = userScore.streak.current >= achievementTemplate.requirements.streak;
      }

      if (unlocked) {
        newAchievements.push({
          ...achievementTemplate,
          unlockedAt: new Date()
        });
      }
    }

    return newAchievements;
  }

  async getRegionalLeaderboards(): Promise<Array<{
    region: string;
    topUsers: UserScore[];
    totalCredits: number;
    averageImpact: number;
  }>> {
    if (!this.isInitialized) await this.initialize();

    const regions = new Map<string, UserScore[]>();
    
    Array.from(this.userScores.values()).forEach(user => {
      const region = user.location?.region || 'Unknown';
      if (!regions.has(region)) {
        regions.set(region, []);
      }
      regions.get(region)!.push(user);
    });

    return Array.from(regions.entries()).map(([region, users]) => {
      users.sort((a, b) => b.totalCredits - a.totalCredits);
      const totalCredits = users.reduce((sum, user) => sum + user.totalCredits, 0);
      const averageImpact = users.length > 0 ? totalCredits / users.length : 0;

      return {
        region,
        topUsers: users.slice(0, 10), // Top 10 per region
        totalCredits,
        averageImpact
      };
    }).sort((a, b) => b.totalCredits - a.totalCredits);
  }

  async getAchievementStats(): Promise<{
    totalAchievements: number;
    unlockedAchievements: number;
    rareAchievements: Array<{
      achievement: Achievement;
      unlockedBy: number;
      rarity: number;
    }>;
  }> {
    const totalAchievements = this.achievements.size;
    const allUsers = Array.from(this.userScores.values());
    
    // Count achievement unlocks
    const achievementCounts = new Map<string, number>();
    
    allUsers.forEach(user => {
      user.achievements.forEach(achievement => {
        achievementCounts.set(achievement.id, (achievementCounts.get(achievement.id) || 0) + 1);
      });
    });

    const unlockedAchievements = achievementCounts.size;

    // Calculate rarity
    const rareAchievements = Array.from(achievementCounts.entries())
      .map(([id, count]) => {
        const achievement = allUsers.flatMap(u => u.achievements).find(a => a.id === id);
        return {
          achievement: achievement!,
          unlockedBy: count,
          rarity: (count / allUsers.length) * 100
        };
      })
      .filter(item => item.rarity < 10) // Less than 10% of users
      .sort((a, b) => a.rarity - b.rarity);

    return {
      totalAchievements,
      unlockedAchievements,
      rareAchievements
    };
  }

  private async generateMockLeaderboardData(): Promise<void> {
    const mockUsers = [
      { username: 'EcoHero42', region: 'Florida Coast', credits: 1250 },
      { username: 'OceanGuardian', region: 'California Coast', credits: 980 },
      { username: 'CoastalSaver', region: 'New York Harbor', credits: 875 },
      { username: 'BlueProtector', region: 'Texas Gulf', credits: 720 },
      { username: 'MarineDefender', region: 'Maine Coast', credits: 650 },
      { username: 'TideWatcher', region: 'Oregon Coast', credits: 580 },
      { username: 'WaveRider', region: 'Hawaii', credits: 520 },
      { username: 'SaltySailor', region: 'North Carolina', credits: 465 },
      { username: 'CoralKeeper', region: 'Florida Keys', credits: 410 },
      { username: 'StormChaser', region: 'Louisiana Coast', credits: 385 }
    ];

    mockUsers.forEach((mock, index) => {
      const userId = `user_${index + 1}`;
      const userScore: UserScore = {
        userId,
        username: mock.username,
        totalCredits: mock.credits,
        monthlyCredits: Math.floor(mock.credits * 0.3),
        rank: index + 1,
        previousRank: index + 1,
        achievements: this.generateMockAchievements(mock.credits),
        conservationImpact: {
          treesEquivalent: Math.floor(mock.credits / 5),
          co2Offset: mock.credits * 0.002,
          biodiversityPoints: mock.credits * 2
        },
        streak: {
          current: Math.floor(Math.random() * 30) + 1,
          longest: Math.floor(Math.random() * 90) + 10
        },
        location: {
          region: mock.region,
          lat: 25 + Math.random() * 15, // Rough US coastal coordinates
          lon: -80 - Math.random() * 40
        }
      };

      this.userScores.set(userId, userScore);
    });
  }

  private generateMockAchievements(credits: number): Achievement[] {
    const achievements: Achievement[] = [];
    
    // Add achievements based on credit count
    for (const [id, template] of this.achievements) {
      if (template.requirements.credits && credits >= template.requirements.credits) {
        achievements.push({
          ...template,
          unlockedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
      } else if (template.requirements.reports && this.estimateUserReports(credits) >= template.requirements.reports) {
        achievements.push({
          ...template,
          unlockedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
      } else if (template.requirements.streak && Math.random() > 0.5) {
        achievements.push({
          ...template,
          unlockedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
      }
    }

    return achievements;
  }

  private estimateUserReports(credits: number): number {
    // Estimate reports based on credits (rough calculation)
    return Math.floor(credits / 10); // Assume 10 credits per report average
  }

  private estimateUserTrades(credits: number): number {
    // Estimate trades based on credits
    return Math.floor(credits / 50); // Assume 50 credits per trade average
  }

  private getPeriodDates(period: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now);
    let startDate = new Date(now);

    switch (period) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all-time':
        startDate = new Date(2020, 0, 1); // Platform launch date
        break;
    }

    return { startDate, endDate };
  }

  async getUserPosition(userId: string): Promise<{
    rank: number;
    totalUsers: number;
    percentile: number;
    creditsToNextRank: number;
    nextRankUser?: { username: string; credits: number };
  } | null> {
    const userScore = await this.getUserScore(userId);
    if (!userScore) return null;

    const allUsers = Array.from(this.userScores.values())
      .sort((a, b) => b.totalCredits - a.totalCredits);
    
    const userIndex = allUsers.findIndex(u => u.userId === userId);
    const rank = userIndex + 1;
    const totalUsers = allUsers.length;
    const percentile = ((totalUsers - rank) / totalUsers) * 100;
    
    let creditsToNextRank = 0;
    let nextRankUser = undefined;
    
    if (userIndex > 0) {
      const nextUser = allUsers[userIndex - 1];
      creditsToNextRank = nextUser.totalCredits - userScore.totalCredits + 1;
      nextRankUser = {
        username: nextUser.username,
        credits: nextUser.totalCredits
      };
    }

    return {
      rank,
      totalUsers,
      percentile: Math.round(percentile),
      creditsToNextRank,
      nextRankUser
    };
  }
}

export const leaderboardService = new LeaderboardService();