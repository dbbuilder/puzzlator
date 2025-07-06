import type { Achievement, GameCompletionData } from '@/types/achievements'

// Achievement definitions
const ACHIEVEMENTS: Achievement[] = [
  // First Steps
  {
    id: 'first-puzzle',
    name: 'First Steps',
    description: 'Complete your first puzzle',
    icon: '🎯',
    maxProgress: 1,
    rarity: 'common',
    unlockedAt: null,
    progress: 0
  },
  {
    id: 'quick-solver',
    name: 'Quick Solver',
    description: 'Complete a puzzle in under 60 seconds',
    icon: '⚡',
    maxProgress: 1,
    rarity: 'uncommon',
    unlockedAt: null,
    progress: 0
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete a puzzle without any mistakes',
    icon: '✨',
    maxProgress: 1,
    rarity: 'rare',
    unlockedAt: null,
    progress: 0
  },
  {
    id: 'no-hints',
    name: 'Independent Thinker',
    description: 'Complete a hard puzzle without using hints',
    icon: '🧠',
    maxProgress: 1,
    rarity: 'rare',
    unlockedAt: null,
    progress: 0
  },
  
  // Progress achievements
  {
    id: 'puzzle-10',
    name: 'Puzzle Enthusiast',
    description: 'Complete 10 puzzles',
    icon: '🏆',
    maxProgress: 10,
    rarity: 'common',
    unlockedAt: null,
    progress: 0
  },
  {
    id: 'puzzle-50',
    name: 'Puzzle Master',
    description: 'Complete 50 puzzles',
    icon: '👑',
    maxProgress: 50,
    rarity: 'uncommon',
    unlockedAt: null,
    progress: 0
  },
  {
    id: 'puzzle-100',
    name: 'Puzzle Legend',
    description: 'Complete 100 puzzles',
    icon: '🌟',
    maxProgress: 100,
    rarity: 'epic',
    unlockedAt: null,
    progress: 0
  },
  {
    id: 'puzzle-500',
    name: 'Puzzle Deity',
    description: 'Complete 500 puzzles',
    icon: '🔮',
    maxProgress: 500,
    rarity: 'legendary',
    unlockedAt: null,
    progress: 0
  },
  
  // Variety achievements
  {
    id: 'variety-seeker',
    name: 'Variety Seeker',
    description: 'Complete puzzles of 5 different types',
    icon: '🎨',
    maxProgress: 5,
    rarity: 'uncommon',
    unlockedAt: null,
    progress: 0
  },
  {
    id: 'difficulty-climber',
    name: 'Difficulty Climber',
    description: 'Complete puzzles at all difficulty levels',
    icon: '📈',
    maxProgress: 4,
    rarity: 'rare',
    unlockedAt: null,
    progress: 0
  },
  
  // Special achievements
  {
    id: 'daily-dedication',
    name: 'Daily Dedication',
    description: 'Play puzzles for 7 consecutive days',
    icon: '📅',
    maxProgress: 7,
    rarity: 'rare',
    unlockedAt: null,
    progress: 0
  },
  {
    id: 'high-scorer',
    name: 'High Scorer',
    description: 'Achieve a perfect score on any puzzle',
    icon: '💯',
    maxProgress: 1,
    rarity: 'epic',
    unlockedAt: null,
    progress: 0
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete 10 puzzles in under 30 seconds each',
    icon: '🚀',
    maxProgress: 10,
    rarity: 'epic',
    unlockedAt: null,
    progress: 0
  },
  {
    id: 'marathon-runner',
    name: 'Marathon Runner',
    description: 'Play for 2 hours in a single session',
    icon: '🏃',
    maxProgress: 1,
    rarity: 'uncommon',
    unlockedAt: null,
    progress: 0
  }
]

export const achievementService = {
  // Get all available achievements
  getAllAchievements(): Achievement[] {
    return ACHIEVEMENTS
  },

  // Check which achievements should be unlocked based on game data
  checkAchievements(gameData: GameCompletionData): string[] {
    const achievementsToUnlock: string[] = []

    // First puzzle
    if (gameData.completed) {
      achievementsToUnlock.push('first-puzzle')
    }

    // Quick solver (under 60 seconds)
    if (gameData.completed && gameData.time < 60) {
      achievementsToUnlock.push('quick-solver')
    }

    // Perfectionist (no mistakes)
    if (gameData.completed && gameData.mistakes === 0) {
      achievementsToUnlock.push('perfectionist')
    }

    // No hints on hard puzzle
    if (gameData.completed && gameData.difficulty === 'hard' && gameData.hints === 0) {
      achievementsToUnlock.push('no-hints')
    }

    // High scorer (perfect score)
    if (gameData.completed && gameData.score >= 1000) {
      achievementsToUnlock.push('high-scorer')
    }

    // Speed demon (under 30 seconds)
    if (gameData.completed && gameData.time < 30) {
      achievementsToUnlock.push('speed-demon')
    }

    return achievementsToUnlock
  },

  // Get achievement by ID
  getAchievementById(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find(a => a.id === id)
  },

  // Calculate total achievement points
  calculateAchievementPoints(achievements: Achievement[]): number {
    const rarityPoints = {
      common: 10,
      uncommon: 25,
      rare: 50,
      epic: 100,
      legendary: 250
    }

    return achievements
      .filter(a => a.unlockedAt !== null)
      .reduce((total, achievement) => total + rarityPoints[achievement.rarity], 0)
  },

  // Get achievement statistics
  getAchievementStats(userAchievements: Achievement[]) {
    const total = ACHIEVEMENTS.length
    const unlocked = userAchievements.filter(a => a.unlockedAt !== null).length
    const points = this.calculateAchievementPoints(userAchievements)

    const byRarity = {
      common: { total: 0, unlocked: 0 },
      uncommon: { total: 0, unlocked: 0 },
      rare: { total: 0, unlocked: 0 },
      epic: { total: 0, unlocked: 0 },
      legendary: { total: 0, unlocked: 0 }
    }

    ACHIEVEMENTS.forEach(achievement => {
      byRarity[achievement.rarity].total++
    })

    userAchievements.forEach(achievement => {
      if (achievement.unlockedAt) {
        byRarity[achievement.rarity].unlocked++
      }
    })

    return {
      total,
      unlocked,
      percentage: Math.round((unlocked / total) * 100),
      points,
      byRarity
    }
  }
}