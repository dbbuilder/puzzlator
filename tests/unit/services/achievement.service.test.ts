import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AchievementService } from '@/services/achievement.service'
import type { Achievement, UserAchievement, AchievementProgress } from '@/types/achievement'

describe('AchievementService', () => {
  let service: AchievementService

  beforeEach(() => {
    service = new AchievementService()
    vi.clearAllMocks()
  })

  describe('Achievement Registry', () => {
    it('should load all achievement definitions', () => {
      const achievements = service.getAllAchievements()
      
      expect(achievements).toBeDefined()
      expect(achievements.length).toBeGreaterThan(0)
      expect(achievements[0]).toHaveProperty('id')
      expect(achievements[0]).toHaveProperty('name')
      expect(achievements[0]).toHaveProperty('description')
      expect(achievements[0]).toHaveProperty('icon')
      expect(achievements[0]).toHaveProperty('category')
      expect(achievements[0]).toHaveProperty('points')
    })

    it('should get achievement by id', () => {
      const achievement = service.getAchievementById('first_puzzle')
      
      expect(achievement).toBeDefined()
      expect(achievement?.id).toBe('first_puzzle')
      expect(achievement?.name).toBe('First Steps')
    })

    it('should return null for invalid achievement id', () => {
      const achievement = service.getAchievementById('invalid_id')
      expect(achievement).toBeNull()
    })

    it('should get achievements by category', () => {
      const completionAchievements = service.getAchievementsByCategory('completion')
      
      expect(completionAchievements.length).toBeGreaterThan(0)
      expect(completionAchievements.every(a => a.category === 'completion')).toBe(true)
    })
  })

  describe('Achievement Progress Tracking', () => {
    const userId = 'test-user-123'

    it('should initialize user achievements', async () => {
      const userAchievements = await service.initializeUserAchievements(userId)
      
      expect(userAchievements).toBeDefined()
      expect(userAchievements.length).toBe(service.getAllAchievements().length)
      expect(userAchievements.every(ua => ua.userId === userId)).toBe(true)
      expect(userAchievements.every(ua => ua.unlockedAt === null)).toBe(true)
      expect(userAchievements.every(ua => ua.progress === 0)).toBe(true)
    })

    it('should get user achievement progress', async () => {
      const progress = await service.getUserAchievementProgress(userId, 'first_puzzle')
      
      expect(progress).toBeDefined()
      expect(progress.achievementId).toBe('first_puzzle')
      expect(progress.progress).toBe(0)
      expect(progress.isUnlocked).toBe(false)
    })

    it('should update achievement progress', async () => {
      const updated = await service.updateAchievementProgress(userId, 'streak_3', 2)
      
      expect(updated).toBeDefined()
      expect(updated.progress).toBe(2)
      expect(updated.isUnlocked).toBe(false)
    })

    it('should unlock achievement when progress meets requirement', async () => {
      // First update to just below requirement
      await service.updateAchievementProgress(userId, 'first_puzzle', 0)
      
      // Update to meet requirement
      const unlocked = await service.updateAchievementProgress(userId, 'first_puzzle', 1)
      
      expect(unlocked.progress).toBe(1)
      expect(unlocked.isUnlocked).toBe(true)
      expect(unlocked.unlockedAt).toBeDefined()
    })

    it('should not update progress for already unlocked achievement', async () => {
      // Unlock achievement
      await service.updateAchievementProgress(userId, 'first_puzzle', 1)
      
      // Try to update again
      const result = await service.updateAchievementProgress(userId, 'first_puzzle', 2)
      
      expect(result.progress).toBe(1) // Should remain at unlock value
      expect(result.isUnlocked).toBe(true)
    })
  })

  describe('Achievement Unlock Conditions', () => {
    const userId = 'test-user-123'

    it('should check simple completion condition', async () => {
      const canUnlock = await service.checkUnlockCondition(userId, 'first_puzzle', {
        puzzlesCompleted: 1
      })
      
      expect(canUnlock).toBe(true)
    })

    it('should check speed condition', async () => {
      const canUnlock = await service.checkUnlockCondition(userId, 'speed_demon', {
        completionTime: 45 // 45 seconds
      })
      
      expect(canUnlock).toBe(true)
    })

    it('should check perfect game condition', async () => {
      const canUnlock = await service.checkUnlockCondition(userId, 'perfectionist', {
        mistakes: 0,
        hintsUsed: 0
      })
      
      expect(canUnlock).toBe(true)
    })

    it('should check streak condition', async () => {
      const canUnlock = await service.checkUnlockCondition(userId, 'streak_3', {
        currentStreak: 3
      })
      
      expect(canUnlock).toBe(true)
    })

    it('should check cumulative condition', async () => {
      const canUnlock = await service.checkUnlockCondition(userId, 'puzzle_master', {
        totalPuzzlesCompleted: 100
      })
      
      expect(canUnlock).toBe(true)
    })
  })

  describe('Achievement Queries', () => {
    const userId = 'test-user-123'

    beforeEach(async () => {
      await service.initializeUserAchievements(userId)
    })

    it('should get all user achievements', async () => {
      const achievements = await service.getUserAchievements(userId)
      
      expect(achievements).toBeDefined()
      expect(achievements.length).toBeGreaterThan(0)
      expect(achievements[0]).toHaveProperty('achievement')
      expect(achievements[0]).toHaveProperty('progress')
      expect(achievements[0]).toHaveProperty('isUnlocked')
    })

    it('should get only unlocked achievements', async () => {
      // Unlock some achievements
      await service.updateAchievementProgress(userId, 'first_puzzle', 1)
      await service.updateAchievementProgress(userId, 'streak_3', 3)
      
      const unlocked = await service.getUnlockedAchievements(userId)
      
      expect(unlocked.length).toBe(2)
      expect(unlocked.every(a => a.isUnlocked)).toBe(true)
    })

    it('should get achievement statistics', async () => {
      // Unlock some achievements
      await service.updateAchievementProgress(userId, 'first_puzzle', 1)
      await service.updateAchievementProgress(userId, 'streak_3', 3)
      
      const stats = await service.getUserAchievementStats(userId)
      
      expect(stats.totalAchievements).toBeGreaterThan(0)
      expect(stats.unlockedAchievements).toBe(2)
      expect(stats.totalPoints).toBeGreaterThan(0)
      expect(stats.completionPercentage).toBeGreaterThan(0)
    })

    it('should get recent unlocks', async () => {
      // Unlock achievements with delay
      await service.updateAchievementProgress(userId, 'first_puzzle', 1)
      await new Promise(resolve => setTimeout(resolve, 100))
      await service.updateAchievementProgress(userId, 'streak_3', 3)
      
      const recent = await service.getRecentUnlocks(userId, 5)
      
      expect(recent.length).toBe(2)
      expect(recent[0].achievementId).toBe('streak_3') // Most recent first
    })
  })

  describe('Batch Achievement Checking', () => {
    const userId = 'test-user-123'

    it('should check multiple achievements after game completion', async () => {
      const gameContext = {
        puzzleType: 'sudoku4x4',
        difficulty: 'easy',
        completionTime: 58,
        mistakes: 0,
        hintsUsed: 0,
        score: 1000,
        puzzlesCompleted: 1,
        currentStreak: 1
      }
      
      const unlocked = await service.checkAchievementsForGameCompletion(userId, gameContext)
      
      expect(unlocked).toBeDefined()
      expect(unlocked.length).toBeGreaterThanOrEqual(2) // At least first_puzzle and perfectionist
      expect(unlocked.some(a => a.achievementId === 'first_puzzle')).toBe(true)
      expect(unlocked.some(a => a.achievementId === 'perfectionist')).toBe(true)
      expect(unlocked.some(a => a.achievementId === 'speed_demon')).toBe(true)
    })

    it('should not return already unlocked achievements', async () => {
      // Unlock first_puzzle
      await service.updateAchievementProgress(userId, 'first_puzzle', 1)
      
      const gameContext = {
        puzzleType: 'sudoku4x4',
        difficulty: 'easy',
        completionTime: 120,
        mistakes: 1,
        hintsUsed: 0,
        score: 800,
        puzzlesCompleted: 2,
        currentStreak: 2
      }
      
      const unlocked = await service.checkAchievementsForGameCompletion(userId, gameContext)
      
      expect(unlocked.every(a => a.achievementId !== 'first_puzzle')).toBe(true)
    })
  })

  describe('Achievement Persistence', () => {
    const userId = 'test-user-123'

    it('should persist achievement unlock', async () => {
      const unlocked = await service.unlockAchievement(userId, 'first_puzzle')
      
      expect(unlocked).toBeDefined()
      expect(unlocked.isUnlocked).toBe(true)
      expect(unlocked.unlockedAt).toBeDefined()
      
      // Verify persistence
      const retrieved = await service.getUserAchievementProgress(userId, 'first_puzzle')
      expect(retrieved.isUnlocked).toBe(true)
    })

    it('should emit achievement unlock event', async () => {
      const mockCallback = vi.fn()
      service.onAchievementUnlocked(mockCallback)
      
      await service.unlockAchievement(userId, 'first_puzzle')
      
      expect(mockCallback).toHaveBeenCalledWith({
        userId,
        achievement: expect.objectContaining({ id: 'first_puzzle' }),
        unlockedAt: expect.any(Date)
      })
    })
  })
})