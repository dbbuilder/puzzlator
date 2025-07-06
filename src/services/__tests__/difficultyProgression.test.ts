import { describe, it, expect, beforeEach } from 'vitest'
import { DifficultyProgressionService } from '../difficultyProgression'
import type { Database } from '@/types/db'

type GameSession = Database['public']['Tables']['game_sessions']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']

describe('DifficultyProgressionService', () => {
  let service: DifficultyProgressionService
  
  beforeEach(() => {
    service = new DifficultyProgressionService()
  })

  describe('calculatePerformanceMetrics', () => {
    it('returns default metrics for empty sessions', () => {
      const metrics = service.calculatePerformanceMetrics([])
      
      expect(metrics).toEqual({
        successRate: 0,
        averageTime: 0,
        hintsPerPuzzle: 0,
        streakCount: 0,
        recentTrend: 'stable'
      })
    })

    it('calculates correct metrics for completed sessions', () => {
      const sessions: Partial<GameSession>[] = [
        {
          id: '1',
          status: 'completed',
          time_spent: 120,
          hints_used: 1,
          created_at: new Date('2024-01-01').toISOString()
        },
        {
          id: '2',
          status: 'completed',
          time_spent: 180,
          hints_used: 0,
          created_at: new Date('2024-01-02').toISOString()
        },
        {
          id: '3',
          status: 'abandoned',
          time_spent: 60,
          hints_used: 2,
          created_at: new Date('2024-01-03').toISOString()
        }
      ]

      const metrics = service.calculatePerformanceMetrics(sessions as GameSession[])
      
      expect(metrics.successRate).toBe(2/3)
      expect(metrics.averageTime).toBe(150) // (120 + 180) / 2
      expect(metrics.hintsPerPuzzle).toBe(1) // (1 + 0 + 2) / 3
      expect(metrics.streakCount).toBe(0) // Last session was abandoned
    })

    it('calculates streak correctly', () => {
      const sessions: Partial<GameSession>[] = [
        {
          id: '1',
          status: 'completed',
          created_at: new Date('2024-01-01').toISOString()
        },
        {
          id: '2',
          status: 'completed',
          created_at: new Date('2024-01-02').toISOString()
        },
        {
          id: '3',
          status: 'completed',
          created_at: new Date('2024-01-03').toISOString()
        }
      ]

      const metrics = service.calculatePerformanceMetrics(sessions as GameSession[])
      expect(metrics.streakCount).toBe(3)
    })

    it('filters by puzzle type when specified', () => {
      const sessions: Partial<GameSession>[] = [
        {
          id: '1',
          puzzle_id: 'sudoku4x4-123',
          status: 'completed',
          time_spent: 120,
          created_at: new Date('2024-01-01').toISOString()
        },
        {
          id: '2',
          puzzle_id: 'pattern-456',
          status: 'completed',
          time_spent: 300,
          created_at: new Date('2024-01-02').toISOString()
        }
      ]

      const metrics = service.calculatePerformanceMetrics(
        sessions as GameSession[],
        'sudoku4x4'
      )
      
      expect(metrics.successRate).toBe(1) // Only sudoku session counted
      expect(metrics.averageTime).toBe(120)
    })

    it('detects improving trend', () => {
      const sessions: Partial<GameSession>[] = [
        // First half - lower performance
        { id: '1', status: 'abandoned', time_spent: 300, created_at: '2024-01-01' },
        { id: '2', status: 'completed', time_spent: 250, created_at: '2024-01-02' },
        { id: '3', status: 'abandoned', time_spent: 280, created_at: '2024-01-03' },
        // Second half - better performance
        { id: '4', status: 'completed', time_spent: 180, created_at: '2024-01-04' },
        { id: '5', status: 'completed', time_spent: 150, created_at: '2024-01-05' },
        { id: '6', status: 'completed', time_spent: 120, created_at: '2024-01-06' }
      ]

      const metrics = service.calculatePerformanceMetrics(sessions as GameSession[])
      expect(metrics.recentTrend).toBe('improving')
    })
  })

  describe('getDifficultyRecommendation', () => {
    it('recommends staying at current level for average performance', () => {
      const userProfile: Partial<UserProfile> = {
        id: 'user-1',
        level: 5, // Medium difficulty
        total_score: 200,
        puzzles_completed: 15
      }

      const sessions: Partial<GameSession>[] = [
        {
          id: '1',
          status: 'completed',
          time_spent: 300, // 5 minutes - within medium range
          hints_used: 1,
          created_at: new Date().toISOString()
        }
      ]

      const recommendation = service.getDifficultyRecommendation(
        userProfile as UserProfile,
        sessions as GameSession[]
      )

      expect(recommendation.currentLevel).toBe('medium')
      expect(recommendation.recommendedLevel).toBe('medium')
    })

    it('recommends harder difficulty for excellent performance', () => {
      const userProfile: Partial<UserProfile> = {
        id: 'user-1',
        level: 5, // Medium difficulty
        total_score: 500,
        puzzles_completed: 25
      }

      const sessions: Partial<GameSession>[] = Array(10).fill(null).map((_, i) => ({
        id: `session-${i}`,
        status: 'completed' as const,
        time_spent: 100, // Very fast
        hints_used: 0, // No hints
        created_at: new Date(Date.now() - i * 86400000).toISOString()
      }))

      const recommendation = service.getDifficultyRecommendation(
        userProfile as UserProfile,
        sessions as GameSession[]
      )

      expect(recommendation.recommendedLevel).toBe('hard')
      expect(recommendation.reason).toContain('Completing puzzles very quickly')
    })

    it('recommends easier difficulty for struggling users', () => {
      const userProfile: Partial<UserProfile> = {
        id: 'user-1',
        level: 10, // Hard difficulty
        total_score: 800,
        puzzles_completed: 30
      }

      const sessions: Partial<GameSession>[] = Array(10).fill(null).map((_, i) => ({
        id: `session-${i}`,
        status: i % 3 === 0 ? 'completed' as const : 'abandoned' as const,
        time_spent: 1200, // 20 minutes
        hints_used: 4,
        created_at: new Date(Date.now() - i * 86400000).toISOString()
      }))

      const recommendation = service.getDifficultyRecommendation(
        userProfile as UserProfile,
        sessions as GameSession[]
      )

      expect(recommendation.recommendedLevel).toBe('medium')
      expect(recommendation.metrics.successRate).toBeLessThan(0.5)
    })
  })

  describe('calculateProgressionPoints', () => {
    it('awards points for completion', () => {
      const session: Partial<GameSession> = {
        status: 'completed',
        hints_used: 2,
        time_spent: 300
      }

      const points = service.calculateProgressionPoints(session as GameSession)
      expect(points).toBeGreaterThan(0)
      expect(points).toContain(10) // Base completion points
    })

    it('awards bonus for no hints', () => {
      const sessionWithHints: Partial<GameSession> = {
        status: 'completed',
        hints_used: 2,
        time_spent: 300
      }

      const sessionNoHints: Partial<GameSession> = {
        status: 'completed',
        hints_used: 0,
        time_spent: 300
      }

      const pointsWithHints = service.calculateProgressionPoints(sessionWithHints as GameSession)
      const pointsNoHints = service.calculateProgressionPoints(sessionNoHints as GameSession)

      expect(pointsNoHints).toBeGreaterThan(pointsWithHints)
    })

    it('awards no points for abandoned sessions', () => {
      const session: Partial<GameSession> = {
        status: 'abandoned',
        hints_used: 1,
        time_spent: 100
      }

      const points = service.calculateProgressionPoints(session as GameSession)
      expect(points).toBe(0)
    })
  })

  describe('shouldUnlockNextDifficulty', () => {
    it('requires minimum points and puzzles', () => {
      const userProfile: Partial<UserProfile> = {
        total_score: 50,
        puzzles_completed: 5,
        level: 3
      }

      const shouldUnlock = service.shouldUnlockNextDifficulty(
        userProfile as UserProfile,
        'easy'
      )

      expect(shouldUnlock).toBe(false) // Not enough points or puzzles
    })

    it('unlocks when requirements are met', () => {
      const userProfile: Partial<UserProfile> = {
        total_score: 150,
        puzzles_completed: 12,
        level: 3
      }

      const shouldUnlock = service.shouldUnlockNextDifficulty(
        userProfile as UserProfile,
        'easy'
      )

      expect(shouldUnlock).toBe(true)
    })
  })

  describe('getAdaptiveDifficultySettings', () => {
    it('returns appropriate settings for easy difficulty', () => {
      const userProfile: Partial<UserProfile> = {
        level: 1
      }

      const settings = service.getAdaptiveDifficultySettings(
        userProfile as UserProfile,
        'sudoku4x4'
      )

      expect(settings.cluePercentage).toBeGreaterThan(0.5)
      expect(settings.timeLimit).toBeUndefined()
      expect(settings.hintCooldown).toBe(30)
      expect(settings.errorTolerance).toBe(5)
    })

    it('returns stricter settings for expert difficulty', () => {
      const userProfile: Partial<UserProfile> = {
        level: 25
      }

      const settings = service.getAdaptiveDifficultySettings(
        userProfile as UserProfile,
        'sudoku4x4'
      )

      expect(settings.cluePercentage).toBeLessThan(0.3)
      expect(settings.timeLimit).toBeDefined()
      expect(settings.hintCooldown).toBeGreaterThan(120)
      expect(settings.errorTolerance).toBe(1)
    })

    it('adjusts settings based on user level', () => {
      const lowLevelUser: Partial<UserProfile> = { level: 5 }
      const highLevelUser: Partial<UserProfile> = { level: 15 }

      const lowSettings = service.getAdaptiveDifficultySettings(
        lowLevelUser as UserProfile,
        'pattern'
      )
      const highSettings = service.getAdaptiveDifficultySettings(
        highLevelUser as UserProfile,
        'pattern'
      )

      expect(highSettings.cluePercentage).toBeLessThan(lowSettings.cluePercentage)
    })
  })
})