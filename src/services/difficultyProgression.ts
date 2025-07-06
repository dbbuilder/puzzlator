/**
 * Difficulty Progression System
 * 
 * This service manages puzzle difficulty progression based on user performance.
 * It analyzes completion rates, times, and hint usage to recommend appropriate difficulty levels.
 */

import type { Database } from '@/types/db'

type GameSession = Database['public']['Tables']['game_sessions']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export interface PerformanceMetrics {
  successRate: number
  averageTime: number
  hintsPerPuzzle: number
  streakCount: number
  recentTrend: 'improving' | 'stable' | 'struggling'
}

export interface DifficultyRecommendation {
  currentLevel: DifficultyLevel
  recommendedLevel: DifficultyLevel
  confidence: number
  reason: string
  metrics: PerformanceMetrics
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert'
export type PuzzleType = 'sudoku4x4' | 'pattern' | 'spatial' | 'logic' | 'math' | 'wordplay'

interface DifficultyThresholds {
  successRate: { min: number; max: number }
  averageTime: { min: number; max: number }
  hintsPerPuzzle: { min: number; max: number }
}

// Difficulty progression thresholds
const DIFFICULTY_THRESHOLDS: Record<DifficultyLevel, DifficultyThresholds> = {
  easy: {
    successRate: { min: 0.9, max: 1.0 },
    averageTime: { min: 0, max: 180 }, // 3 minutes
    hintsPerPuzzle: { min: 0, max: 0.5 }
  },
  medium: {
    successRate: { min: 0.75, max: 0.95 },
    averageTime: { min: 120, max: 420 }, // 2-7 minutes
    hintsPerPuzzle: { min: 0, max: 1.5 }
  },
  hard: {
    successRate: { min: 0.6, max: 0.85 },
    averageTime: { min: 300, max: 900 }, // 5-15 minutes
    hintsPerPuzzle: { min: 0.5, max: 3 }
  },
  expert: {
    successRate: { min: 0.4, max: 0.7 },
    averageTime: { min: 600, max: 1800 }, // 10-30 minutes
    hintsPerPuzzle: { min: 1, max: 5 }
  }
}

// Points for progression
const PROGRESSION_POINTS = {
  completion: 10,
  noHints: 5,
  fastCompletion: 3,
  streak: 2
}

export class DifficultyProgressionService {
  /**
   * Calculate performance metrics from recent sessions
   */
  calculatePerformanceMetrics(
    sessions: GameSession[],
    puzzleType?: PuzzleType
  ): PerformanceMetrics {
    if (sessions.length === 0) {
      return {
        successRate: 0,
        averageTime: 0,
        hintsPerPuzzle: 0,
        streakCount: 0,
        recentTrend: 'stable'
      }
    }

    // Filter by puzzle type if specified
    const relevantSessions = puzzleType
      ? sessions.filter(s => s.puzzle_id?.includes(puzzleType))
      : sessions

    // Calculate success rate
    const completedSessions = relevantSessions.filter(s => s.status === 'completed')
    const successRate = completedSessions.length / relevantSessions.length

    // Calculate average time (only for completed puzzles)
    const totalTime = completedSessions.reduce((sum, s) => sum + (s.time_spent || 0), 0)
    const averageTime = completedSessions.length > 0 ? totalTime / completedSessions.length : 0

    // Calculate hints per puzzle
    const totalHints = relevantSessions.reduce((sum, s) => sum + (s.hints_used || 0), 0)
    const hintsPerPuzzle = relevantSessions.length > 0 ? totalHints / relevantSessions.length : 0

    // Calculate current streak
    const streakCount = this.calculateStreak(relevantSessions)

    // Determine recent trend (last 5 sessions vs previous 5)
    const recentTrend = this.calculateTrend(relevantSessions.slice(-10))

    return {
      successRate,
      averageTime,
      hintsPerPuzzle,
      streakCount,
      recentTrend
    }
  }

  /**
   * Get difficulty recommendation based on performance
   */
  getDifficultyRecommendation(
    userProfile: UserProfile,
    recentSessions: GameSession[],
    puzzleType?: PuzzleType
  ): DifficultyRecommendation {
    const metrics = this.calculatePerformanceMetrics(recentSessions, puzzleType)
    const currentLevel = this.getCurrentDifficultyLevel(userProfile, puzzleType)
    
    // Analyze performance against current difficulty thresholds
    const analysis = this.analyzePerformance(metrics, currentLevel)
    
    // Determine recommended difficulty
    const recommendedLevel = this.determineRecommendedDifficulty(
      currentLevel,
      analysis,
      metrics
    )

    return {
      currentLevel,
      recommendedLevel,
      confidence: analysis.confidence,
      reason: analysis.reason,
      metrics
    }
  }

  /**
   * Calculate progression points based on session performance
   */
  calculateProgressionPoints(session: GameSession): number {
    let points = 0

    // Completion points
    if (session.status === 'completed') {
      points += PROGRESSION_POINTS.completion

      // No hints bonus
      if ((session.hints_used || 0) === 0) {
        points += PROGRESSION_POINTS.noHints
      }

      // Fast completion bonus (under expected time)
      const expectedTime = this.getExpectedTime(session.puzzle_id)
      if (session.time_spent && session.time_spent < expectedTime * 0.8) {
        points += PROGRESSION_POINTS.fastCompletion
      }
    }

    return points
  }

  /**
   * Should unlock next difficulty level?
   */
  shouldUnlockNextDifficulty(
    userProfile: UserProfile,
    currentDifficulty: DifficultyLevel
  ): boolean {
    // Check if user has enough points
    const requiredPoints = this.getRequiredPointsForNextLevel(currentDifficulty)
    const userPoints = userProfile.total_score || 0

    // Check minimum puzzles completed at current difficulty
    const minPuzzlesRequired = this.getMinPuzzlesForProgression(currentDifficulty)
    const puzzlesCompleted = userProfile.puzzles_completed || 0

    return userPoints >= requiredPoints && puzzlesCompleted >= minPuzzlesRequired
  }

  /**
   * Get adaptive difficulty settings for a specific user
   */
  getAdaptiveDifficultySettings(
    userProfile: UserProfile,
    puzzleType: PuzzleType
  ): {
    cluePercentage: number
    timeLimit?: number
    hintCooldown: number
    errorTolerance: number
  } {
    const level = userProfile.level || 1
    const difficulty = this.getCurrentDifficultyLevel(userProfile, puzzleType)

    // Base settings by difficulty
    const baseSettings = {
      easy: {
        cluePercentage: 0.6, // 60% of cells filled
        timeLimit: undefined, // No time limit
        hintCooldown: 30, // 30 seconds
        errorTolerance: 5 // 5 mistakes allowed
      },
      medium: {
        cluePercentage: 0.45,
        timeLimit: undefined,
        hintCooldown: 60,
        errorTolerance: 3
      },
      hard: {
        cluePercentage: 0.3,
        timeLimit: 1200, // 20 minutes
        hintCooldown: 120,
        errorTolerance: 2
      },
      expert: {
        cluePercentage: 0.2,
        timeLimit: 900, // 15 minutes
        hintCooldown: 180,
        errorTolerance: 1
      }
    }

    // Get base settings
    const settings = { ...baseSettings[difficulty] }

    // Adjust based on user level
    const levelAdjustment = Math.min(level / 20, 0.2) // Up to 20% adjustment
    settings.cluePercentage = Math.max(0.1, settings.cluePercentage - levelAdjustment)

    return settings
  }

  // Private helper methods

  private calculateStreak(sessions: GameSession[]): number {
    let streak = 0
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    for (const session of sortedSessions) {
      if (session.status === 'completed') {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  private calculateTrend(
    recentSessions: GameSession[]
  ): 'improving' | 'stable' | 'struggling' {
    if (recentSessions.length < 6) return 'stable'

    const midPoint = Math.floor(recentSessions.length / 2)
    const firstHalf = recentSessions.slice(0, midPoint)
    const secondHalf = recentSessions.slice(midPoint)

    const firstMetrics = this.calculatePerformanceMetrics(firstHalf)
    const secondMetrics = this.calculatePerformanceMetrics(secondHalf)

    const successRateChange = secondMetrics.successRate - firstMetrics.successRate
    const timeChange = secondMetrics.averageTime - firstMetrics.averageTime

    if (successRateChange > 0.1 || (successRateChange > 0 && timeChange < -30)) {
      return 'improving'
    } else if (successRateChange < -0.1 || timeChange > 60) {
      return 'struggling'
    }

    return 'stable'
  }

  private getCurrentDifficultyLevel(
    userProfile: UserProfile,
    puzzleType?: PuzzleType
  ): DifficultyLevel {
    // TODO: Store per-puzzle-type difficulty in user profile
    const level = userProfile.level || 1
    
    if (level < 5) return 'easy'
    if (level < 10) return 'medium'
    if (level < 20) return 'hard'
    return 'expert'
  }

  private analyzePerformance(
    metrics: PerformanceMetrics,
    currentLevel: DifficultyLevel
  ): { confidence: number; reason: string } {
    const thresholds = DIFFICULTY_THRESHOLDS[currentLevel]
    let score = 0
    let maxScore = 0
    const reasons: string[] = []

    // Check success rate
    maxScore += 3
    if (metrics.successRate >= thresholds.successRate.min) {
      score += 3
      if (metrics.successRate >= thresholds.successRate.max) {
        reasons.push('High success rate')
      }
    } else {
      reasons.push('Low success rate')
    }

    // Check average time
    maxScore += 2
    if (metrics.averageTime >= thresholds.averageTime.min && 
        metrics.averageTime <= thresholds.averageTime.max) {
      score += 2
    } else if (metrics.averageTime < thresholds.averageTime.min) {
      reasons.push('Completing puzzles very quickly')
    } else {
      reasons.push('Taking longer than expected')
    }

    // Check hint usage
    maxScore += 2
    if (metrics.hintsPerPuzzle <= thresholds.hintsPerPuzzle.max) {
      score += 2
      if (metrics.hintsPerPuzzle <= thresholds.hintsPerPuzzle.min) {
        reasons.push('Minimal hint usage')
      }
    } else {
      reasons.push('Heavy hint usage')
    }

    // Check trend
    maxScore += 1
    if (metrics.recentTrend === 'improving') {
      score += 1
      reasons.push('Recent improvement')
    } else if (metrics.recentTrend === 'struggling') {
      reasons.push('Recent struggles')
    }

    const confidence = score / maxScore
    const reason = reasons.join(', ') || 'Performance matches current level'

    return { confidence, reason }
  }

  private determineRecommendedDifficulty(
    currentLevel: DifficultyLevel,
    analysis: { confidence: number; reason: string },
    metrics: PerformanceMetrics
  ): DifficultyLevel {
    const levels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert']
    const currentIndex = levels.indexOf(currentLevel)

    // Strong performance - consider moving up
    if (analysis.confidence > 0.8 && metrics.successRate > 0.85) {
      if (currentIndex < levels.length - 1) {
        return levels[currentIndex + 1]
      }
    }

    // Struggling - consider moving down
    if (analysis.confidence < 0.4 || metrics.successRate < 0.5) {
      if (currentIndex > 0) {
        return levels[currentIndex - 1]
      }
    }

    // Stay at current level
    return currentLevel
  }

  private getExpectedTime(puzzleId?: string): number {
    // TODO: Get expected time from puzzle metadata
    return 300 // Default 5 minutes
  }

  private getRequiredPointsForNextLevel(currentDifficulty: DifficultyLevel): number {
    const requirements = {
      easy: 100,
      medium: 500,
      hard: 1500,
      expert: 5000
    }
    return requirements[currentDifficulty] || 100
  }

  private getMinPuzzlesForProgression(currentDifficulty: DifficultyLevel): number {
    const requirements = {
      easy: 10,
      medium: 20,
      hard: 30,
      expert: 50
    }
    return requirements[currentDifficulty] || 10
  }
}

// Export singleton instance
export const difficultyProgressionService = new DifficultyProgressionService()