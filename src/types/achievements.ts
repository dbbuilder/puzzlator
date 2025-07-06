/**
 * Achievement system types
 */

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type AchievementCategory = 
  | 'gameplay'
  | 'speed'
  | 'milestones'
  | 'perfection'
  | 'exploration'
  | 'social'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  rarity: AchievementRarity
  
  // Progress tracking
  progress: number
  maxProgress: number
  
  // Unlock status
  unlockedAt: Date | null
  
  // Optional metadata
  hidden?: boolean
  points?: number
  prerequisiteIds?: string[]
}

export interface AchievementProgress {
  achievementId: string
  progress: number
  updatedAt: Date
}

export interface AchievementUnlock {
  achievementId: string
  userId: string
  unlockedAt: Date
}

export interface AchievementNotificationData {
  achievement: Achievement
  isNew: boolean
  previousProgress?: number
}

export interface GameCompletionData {
  puzzleType: string
  difficulty: string
  score: number
  time: number
  moves: number
  hints: number
  mistakes: number
  completed: boolean
}