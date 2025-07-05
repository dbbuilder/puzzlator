import type {
  Achievement,
  UserAchievement,
  AchievementProgress,
  AchievementWithProgress,
  AchievementStats,
  GameCompletionContext,
  AchievementUnlockEvent
} from '@/types/achievement'

export class AchievementService {
  private achievements: Map<string, Achievement> = new Map()
  private userAchievements: Map<string, Map<string, UserAchievement>> = new Map()
  private unlockListeners: Array<(event: AchievementUnlockEvent) => void> = []

  constructor() {
    this.loadAchievements()
  }

  private loadAchievements(): void {
    const achievementDefinitions: Achievement[] = [
      {
        id: 'first_puzzle',
        name: 'First Steps',
        description: 'Complete your first puzzle',
        icon: '🎯',
        category: 'completion',
        points: 10,
        requirement: { type: 'puzzles_completed', value: 1 }
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a puzzle in under 60 seconds',
        icon: '⚡',
        category: 'speed',
        points: 25,
        requirement: { type: 'completion_time', value: 60 }
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete a puzzle with no mistakes',
        icon: '✨',
        category: 'skill',
        points: 20,
        requirement: { type: 'perfect_game', value: 1 }
      },
      {
        id: 'streak_3',
        name: 'On a Roll',
        description: 'Complete 3 puzzles in a row',
        icon: '🔥',
        category: 'completion',
        points: 15,
        requirement: { type: 'streak', value: 3 }
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Complete 7 puzzles in a row',
        icon: '💪',
        category: 'completion',
        points: 30,
        requirement: { type: 'streak', value: 7 }
      },
      {
        id: 'hint_free',
        name: 'No Help Needed',
        description: 'Complete 5 puzzles without hints',
        icon: '🧠',
        category: 'skill',
        points: 35,
        requirement: { type: 'hint_free_games', value: 5 }
      },
      {
        id: 'puzzle_master',
        name: 'Puzzle Master',
        description: 'Complete 100 puzzles',
        icon: '👑',
        category: 'collection',
        points: 100,
        requirement: { type: 'total_puzzles', value: 100 }
      }
    ]

    achievementDefinitions.forEach(achievement => {
      this.achievements.set(achievement.id, achievement)
    })
  }

  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values())
  }

  getAchievementById(id: string): Achievement | null {
    return this.achievements.get(id) || null
  }

  getAchievementsByCategory(category: Achievement['category']): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => a.category === category)
  }

  async initializeUserAchievements(userId: string): Promise<UserAchievement[]> {
    const userAchievementMap = new Map<string, UserAchievement>()
    
    this.achievements.forEach((achievement, id) => {
      const userAchievement: UserAchievement = {
        id: `${userId}_${id}`,
        userId,
        achievementId: id,
        progress: 0,
        isUnlocked: false,
        unlockedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      userAchievementMap.set(id, userAchievement)
    })

    this.userAchievements.set(userId, userAchievementMap)
    return Array.from(userAchievementMap.values())
  }

  async getUserAchievementProgress(userId: string, achievementId: string): Promise<AchievementProgress> {
    const userMap = this.userAchievements.get(userId)
    if (!userMap) {
      await this.initializeUserAchievements(userId)
    }
    
    const userAchievement = this.userAchievements.get(userId)?.get(achievementId)
    
    if (!userAchievement) {
      return {
        achievementId,
        progress: 0,
        isUnlocked: false
      }
    }

    return {
      achievementId: userAchievement.achievementId,
      progress: userAchievement.progress,
      isUnlocked: userAchievement.isUnlocked,
      unlockedAt: userAchievement.unlockedAt
    }
  }

  async updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<AchievementProgress> {
    let userMap = this.userAchievements.get(userId)
    if (!userMap) {
      await this.initializeUserAchievements(userId)
      userMap = this.userAchievements.get(userId)!
    }

    const userAchievement = userMap.get(achievementId)
    if (!userAchievement) {
      throw new Error(`Achievement ${achievementId} not found for user ${userId}`)
    }

    // Don't update if already unlocked
    if (userAchievement.isUnlocked) {
      return {
        achievementId: userAchievement.achievementId,
        progress: userAchievement.progress,
        isUnlocked: userAchievement.isUnlocked,
        unlockedAt: userAchievement.unlockedAt
      }
    }

    // Update progress
    userAchievement.progress = progress
    userAchievement.updatedAt = new Date()

    // Check if achievement should be unlocked
    const achievement = this.achievements.get(achievementId)
    if (achievement && progress >= achievement.requirement.value) {
      userAchievement.isUnlocked = true
      userAchievement.unlockedAt = new Date()
      
      // Emit unlock event
      this.emitUnlockEvent(userId, achievement)
    }

    return {
      achievementId: userAchievement.achievementId,
      progress: userAchievement.progress,
      isUnlocked: userAchievement.isUnlocked,
      unlockedAt: userAchievement.unlockedAt
    }
  }

  async checkUnlockCondition(userId: string, achievementId: string, context: any): Promise<boolean> {
    const achievement = this.achievements.get(achievementId)
    if (!achievement) return false

    switch (achievement.requirement.type) {
      case 'puzzles_completed':
        return context.puzzlesCompleted >= achievement.requirement.value
      
      case 'completion_time':
        return context.completionTime <= achievement.requirement.value
      
      case 'perfect_game':
        return context.mistakes === 0 && context.hintsUsed === 0
      
      case 'streak':
        return context.currentStreak >= achievement.requirement.value
      
      case 'total_puzzles':
        return context.totalPuzzlesCompleted >= achievement.requirement.value
      
      default:
        return false
    }
  }

  async getUserAchievements(userId: string): Promise<AchievementWithProgress[]> {
    const userMap = this.userAchievements.get(userId)
    if (!userMap) {
      await this.initializeUserAchievements(userId)
    }

    const results: AchievementWithProgress[] = []
    
    this.achievements.forEach((achievement, id) => {
      const userAchievement = this.userAchievements.get(userId)?.get(id)
      if (userAchievement) {
        results.push({
          achievement,
          progress: userAchievement.progress,
          isUnlocked: userAchievement.isUnlocked,
          unlockedAt: userAchievement.unlockedAt
        })
      }
    })

    return results
  }

  async getUnlockedAchievements(userId: string): Promise<AchievementWithProgress[]> {
    const allAchievements = await this.getUserAchievements(userId)
    return allAchievements.filter(a => a.isUnlocked)
  }

  async getUserAchievementStats(userId: string): Promise<AchievementStats> {
    const userAchievements = await this.getUserAchievements(userId)
    const unlockedAchievements = userAchievements.filter(a => a.isUnlocked)
    
    const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.achievement.points, 0)
    const totalAchievements = userAchievements.length
    const unlockedCount = unlockedAchievements.length
    
    return {
      totalAchievements,
      unlockedAchievements: unlockedCount,
      totalPoints,
      completionPercentage: (unlockedCount / totalAchievements) * 100
    }
  }

  async getRecentUnlocks(userId: string, limit: number): Promise<UserAchievement[]> {
    const userMap = this.userAchievements.get(userId)
    if (!userMap) return []

    const unlocked = Array.from(userMap.values())
      .filter(a => a.isUnlocked && a.unlockedAt)
      .sort((a, b) => b.unlockedAt!.getTime() - a.unlockedAt!.getTime())
      .slice(0, limit)

    return unlocked
  }

  async checkAchievementsForGameCompletion(userId: string, context: GameCompletionContext): Promise<UserAchievement[]> {
    const unlocked: UserAchievement[] = []
    
    // Initialize user achievements if needed
    let userMap = this.userAchievements.get(userId)
    if (!userMap) {
      await this.initializeUserAchievements(userId)
      userMap = this.userAchievements.get(userId)!
    }

    // Check each achievement
    for (const [achievementId, achievement] of this.achievements) {
      const userAchievement = userMap.get(achievementId)
      if (!userAchievement || userAchievement.isUnlocked) continue

      let shouldUnlock = false

      switch (achievement.requirement.type) {
        case 'puzzles_completed':
          if (context.puzzlesCompleted >= achievement.requirement.value) {
            shouldUnlock = true
            await this.updateAchievementProgress(userId, achievementId, context.puzzlesCompleted)
          }
          break

        case 'completion_time':
          if (context.completionTime <= achievement.requirement.value) {
            shouldUnlock = true
            await this.updateAchievementProgress(userId, achievementId, 1)
          }
          break

        case 'perfect_game':
          if (context.mistakes === 0 && context.hintsUsed === 0) {
            shouldUnlock = true
            await this.updateAchievementProgress(userId, achievementId, 1)
          }
          break

        case 'streak':
          if (context.currentStreak >= achievement.requirement.value) {
            shouldUnlock = true
            await this.updateAchievementProgress(userId, achievementId, context.currentStreak)
          }
          break
      }

      if (shouldUnlock) {
        const updatedAchievement = userMap.get(achievementId)
        if (updatedAchievement && updatedAchievement.isUnlocked) {
          unlocked.push(updatedAchievement)
        }
      }
    }

    return unlocked
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<AchievementProgress> {
    const achievement = this.achievements.get(achievementId)
    if (!achievement) {
      throw new Error(`Achievement ${achievementId} not found`)
    }

    return this.updateAchievementProgress(userId, achievementId, achievement.requirement.value)
  }

  onAchievementUnlocked(callback: (event: AchievementUnlockEvent) => void): void {
    this.unlockListeners.push(callback)
  }

  private emitUnlockEvent(userId: string, achievement: Achievement): void {
    const event: AchievementUnlockEvent = {
      userId,
      achievement,
      unlockedAt: new Date()
    }

    this.unlockListeners.forEach(listener => listener(event))
  }
}