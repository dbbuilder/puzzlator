import { supabase } from '@/config/supabase'
import type { PuzzleGenerationRequest, GeneratedPuzzle } from '@/types/ai'
import type { Database } from '@/types/db'

type Puzzle = Database['public']['Tables']['puzzles']['Row']

export class AIPuzzleService {
  private static instance: AIPuzzleService
  
  static getInstance(): AIPuzzleService {
    if (!AIPuzzleService.instance) {
      AIPuzzleService.instance = new AIPuzzleService()
    }
    return AIPuzzleService.instance
  }

  /**
   * Generate a puzzle using the AI Edge Function
   */
  async generatePuzzle(request: PuzzleGenerationRequest): Promise<{
    success: boolean
    puzzle?: Puzzle
    hints?: any[]
    error?: string
  }> {
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase client not initialized'
      }
    }

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        return {
          success: false,
          error: 'Authentication required for AI puzzle generation'
        }
      }

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('generate-puzzle', {
        body: {
          type: request.type,
          difficulty: request.difficulty,
          userLevel: request.userLevel,
          previousPerformance: request.previousPerformance,
          constraints: request.constraints
        }
      })

      if (error) {
        throw error
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to generate puzzle'
        }
      }

      return {
        success: true,
        puzzle: data.puzzle,
        hints: data.hints
      }
    } catch (error: any) {
      console.error('AI puzzle generation error:', error)
      
      // Check for specific error types
      if (error.message?.includes('Rate limit')) {
        return {
          success: false,
          error: 'You have reached the hourly limit for AI puzzle generation. Please try again later.'
        }
      }
      
      return {
        success: false,
        error: error.message || 'Failed to generate AI puzzle'
      }
    }
  }

  /**
   * Get user's AI generation stats
   */
  async getUserStats(userId: string): Promise<{
    hourlyCount: number
    monthlyTokens: number
    monthlyCount: number
  } | null> {
    if (!supabase) return null

    try {
      // Get hourly generation count
      const { data: hourlyData, error: hourlyError } = await supabase
        .rpc('get_user_ai_generation_count', { user_uuid: userId })

      if (hourlyError) throw hourlyError

      // Get monthly token usage
      const { data: monthlyData, error: monthlyError } = await supabase
        .rpc('get_user_monthly_token_usage', { user_uuid: userId })

      if (monthlyError) throw monthlyError

      return {
        hourlyCount: hourlyData || 0,
        monthlyTokens: monthlyData?.[0]?.total_tokens || 0,
        monthlyCount: monthlyData?.[0]?.generation_count || 0
      }
    } catch (error) {
      console.error('Failed to get user AI stats:', error)
      return null
    }
  }

  /**
   * Check if user can generate a puzzle
   */
  async canGeneratePuzzle(userId: string): Promise<{
    allowed: boolean
    reason?: string
    remainingCount?: number
  }> {
    const stats = await this.getUserStats(userId)
    
    if (!stats) {
      return {
        allowed: true,
        reason: 'Could not check limits'
      }
    }

    // Check hourly limit (10 puzzles per hour)
    if (stats.hourlyCount >= 10) {
      return {
        allowed: false,
        reason: 'Hourly limit reached (10 puzzles per hour)',
        remainingCount: 0
      }
    }

    // Check monthly token limit (100k tokens per month)
    if (stats.monthlyTokens >= 100000) {
      return {
        allowed: false,
        reason: 'Monthly token limit reached',
        remainingCount: 0
      }
    }

    return {
      allowed: true,
      remainingCount: 10 - stats.hourlyCount
    }
  }

  /**
   * Get recent AI-generated puzzles
   */
  async getRecentAIPuzzles(limit = 6): Promise<Puzzle[]> {
    if (!supabase) return []

    try {
      const { data, error } = await supabase
        .from('puzzles')
        .select('*')
        .eq('ai_generated', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get recent AI puzzles:', error)
      return []
    }
  }

  /**
   * Get user's AI-generated puzzles
   */
  async getUserAIPuzzles(userId: string): Promise<Puzzle[]> {
    if (!supabase) return []

    try {
      // First get user's puzzle IDs from game sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('puzzle_id')
        .eq('user_id', userId)

      if (sessionsError) throw sessionsError

      const puzzleIds = sessions?.map(s => s.puzzle_id) || []
      if (puzzleIds.length === 0) return []

      // Get AI-generated puzzles from those IDs
      const { data, error } = await supabase
        .from('puzzles')
        .select('*')
        .in('id', puzzleIds)
        .eq('ai_generated', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get user AI puzzles:', error)
      return []
    }
  }
}

// Export singleton instance
export const aiPuzzleService = AIPuzzleService.getInstance()