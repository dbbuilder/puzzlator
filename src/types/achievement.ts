export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'completion' | 'speed' | 'skill' | 'collection' | 'social'
  points: number
  requirement: {
    type: string
    value: number
  }
  hidden?: boolean
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  progress: number
  isUnlocked: boolean
  unlockedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface AchievementProgress {
  achievementId: string
  progress: number
  isUnlocked: boolean
  unlockedAt?: Date | null
}

export interface AchievementWithProgress {
  achievement: Achievement
  progress: number
  isUnlocked: boolean
  unlockedAt: Date | null
}

export interface AchievementStats {
  totalAchievements: number
  unlockedAchievements: number
  totalPoints: number
  completionPercentage: number
}

export interface GameCompletionContext {
  puzzleType: string
  difficulty: string
  completionTime: number
  mistakes: number
  hintsUsed: number
  score: number
  puzzlesCompleted: number
  currentStreak: number
  totalPuzzlesCompleted?: number
}

export interface AchievementUnlockEvent {
  userId: string
  achievement: Achievement
  unlockedAt: Date
}