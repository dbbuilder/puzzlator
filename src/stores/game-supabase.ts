import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/config/supabase'
import { useUserStore } from './user-supabase'
import type { Tables, InsertTables } from '@/config/supabase'

type Puzzle = Tables<'puzzles'>
type GameSession = Tables<'game_sessions'>
type LeaderboardEntry = Tables<'leaderboards'>

export const useGameStore = defineStore('game', () => {
  const userStore = useUserStore()

  // State
  const currentPuzzle = ref<Puzzle | null>(null)
  const currentSession = ref<GameSession | null>(null)
  const currentScore = ref(0)
  const timeElapsed = ref(0)
  const hintsUsed = ref(0)
  const moves = ref<any[]>([])
  const isPaused = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const formattedTime = computed(() => {
    const minutes = Math.floor(timeElapsed.value / 60)
    const seconds = timeElapsed.value % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  })

  // Load puzzle from database or generate new one
  async function loadPuzzle(puzzleId?: string) {
    isLoading.value = true
    error.value = null

    try {
      if (puzzleId) {
        // Load existing puzzle
        const { data, error: fetchError } = await supabase
          .from('puzzles')
          .select('*')
          .eq('id', puzzleId)
          .single()

        if (fetchError) throw fetchError
        currentPuzzle.value = data
      } else {
        // Generate new puzzle (for now, use local generation)
        // In production, this would call an Edge Function
        currentPuzzle.value = {
          id: `puzzle_${Date.now()}`,
          type: 'sudoku4x4',
          difficulty: 'medium',
          puzzle_data: generateSudoku4x4(),
          solution_data: null,
          created_at: new Date().toISOString(),
          created_by: 'system',
          is_daily: false,
          play_count: 0,
          average_time: null,
          average_score: null
        }

        // Save to database if user is logged in
        if (userStore.isLoggedIn) {
          const { data, error: insertError } = await supabase
            .from('puzzles')
            .insert(currentPuzzle.value)
            .select()
            .single()

          if (!insertError && data) {
            currentPuzzle.value = data
          }
        }
      }

      // Create or load game session
      await createOrLoadSession()
    } catch (err: any) {
      error.value = err.message || 'Failed to load puzzle'
      console.error('Load puzzle error:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Create or load game session
  async function createOrLoadSession() {
    if (!currentPuzzle.value || !userStore.isLoggedIn) return

    try {
      // Check for existing active session
      const { data: existingSession } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userStore.currentUserId!)
        .eq('puzzle_id', currentPuzzle.value.id)
        .is('completed_at', null)
        .single()

      if (existingSession) {
        currentSession.value = existingSession
        // Restore game state
        if (existingSession.game_state) {
          const state = existingSession.game_state as any
          timeElapsed.value = state.timeElapsed || 0
          hintsUsed.value = state.hintsUsed || 0
          moves.value = state.moves || []
          currentScore.value = state.score || 0
        }
      } else {
        // Create new session
        const sessionData: InsertTables<'game_sessions'> = {
          user_id: userStore.currentUserId!,
          puzzle_id: currentPuzzle.value.id,
          started_at: new Date().toISOString(),
          game_state: {
            timeElapsed: 0,
            hintsUsed: 0,
            moves: [],
            score: 0
          }
        }

        const { data, error: createError } = await supabase
          .from('game_sessions')
          .insert(sessionData)
          .select()
          .single()

        if (createError) throw createError
        currentSession.value = data
      }
    } catch (err) {
      console.error('Session error:', err)
    }
  }

  // Save game progress
  async function saveProgress() {
    if (!currentSession.value || !userStore.isLoggedIn) return

    try {
      const gameState = {
        timeElapsed: timeElapsed.value,
        hintsUsed: hintsUsed.value,
        moves: moves.value,
        score: currentScore.value
      }

      await supabase
        .from('game_sessions')
        .update({ 
          game_state: gameState,
          time_elapsed: timeElapsed.value,
          hints_used: hintsUsed.value,
          score: currentScore.value
        })
        .eq('id', currentSession.value.id)
    } catch (err) {
      console.error('Save progress error:', err)
    }
  }

  // Complete game
  async function completeGame() {
    if (!currentSession.value || !currentPuzzle.value || !userStore.isLoggedIn) return

    try {
      // Update session
      const { data: updatedSession, error: updateError } = await supabase
        .from('game_sessions')
        .update({
          completed_at: new Date().toISOString(),
          time_elapsed: timeElapsed.value,
          hints_used: hintsUsed.value,
          score: currentScore.value,
          is_perfect: hintsUsed.value === 0
        })
        .eq('id', currentSession.value.id)
        .select()
        .single()

      if (updateError) throw updateError
      currentSession.value = updatedSession

      // Add to leaderboard
      const leaderboardEntry: InsertTables<'leaderboards'> = {
        user_id: userStore.currentUserId!,
        puzzle_id: currentPuzzle.value.id,
        puzzle_type: currentPuzzle.value.type,
        difficulty: currentPuzzle.value.difficulty,
        score: currentScore.value,
        time_elapsed: timeElapsed.value,
        hints_used: hintsUsed.value,
        period_type: 'all_time',
        period_date: new Date().toISOString().split('T')[0]
      }

      await supabase
        .from('leaderboards')
        .insert(leaderboardEntry)

      // Update user stats
      await userStore.updateGameStats({
        puzzlesCompleted: 1,
        totalScore: currentScore.value,
        totalPlayTime: timeElapsed.value
      })

      // Update puzzle stats
      await updatePuzzleStats()
    } catch (err) {
      console.error('Complete game error:', err)
    }
  }

  // Update puzzle statistics
  async function updatePuzzleStats() {
    if (!currentPuzzle.value) return

    try {
      // Get all completed sessions for this puzzle
      const { data: sessions } = await supabase
        .from('game_sessions')
        .select('time_elapsed, score')
        .eq('puzzle_id', currentPuzzle.value.id)
        .not('completed_at', 'is', null)

      if (sessions && sessions.length > 0) {
        const avgTime = sessions.reduce((sum, s) => sum + (s.time_elapsed || 0), 0) / sessions.length
        const avgScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length

        await supabase
          .from('puzzles')
          .update({
            play_count: sessions.length,
            average_time: Math.round(avgTime),
            average_score: Math.round(avgScore)
          })
          .eq('id', currentPuzzle.value.id)
      }
    } catch (err) {
      console.error('Update puzzle stats error:', err)
    }
  }

  // Game actions
  function addMove(move: any) {
    moves.value.push({
      ...move,
      timestamp: Date.now()
    })
    updateScore()
  }

  function useHint() {
    hintsUsed.value++
    updateScore()
  }

  function incrementTime() {
    if (!isPaused.value) {
      timeElapsed.value++
    }
  }

  function togglePause() {
    isPaused.value = !isPaused.value
  }

  function updateScore() {
    // Basic scoring algorithm
    const baseScore = 1000
    const timePenalty = Math.min(timeElapsed.value * 2, 500)
    const hintPenalty = hintsUsed.value * 100
    const movePenalty = Math.max(0, (moves.value.length - 20) * 5)
    
    currentScore.value = Math.max(0, baseScore - timePenalty - hintPenalty - movePenalty)
  }

  // Reset game state
  function resetGame() {
    currentPuzzle.value = null
    currentSession.value = null
    currentScore.value = 0
    timeElapsed.value = 0
    hintsUsed.value = 0
    moves.value = []
    isPaused.value = false
  }

  // Generate a simple 4x4 Sudoku (temporary - should use Edge Function)
  function generateSudoku4x4(): (number | null)[][] {
    // Simple hardcoded puzzle for now
    return [
      [1, null, null, 4],
      [null, 3, 4, null],
      [null, 4, 2, null],
      [3, null, null, 1]
    ]
  }

  return {
    // State
    currentPuzzle,
    currentSession,
    currentScore,
    timeElapsed,
    hintsUsed,
    moves,
    isPaused,
    isLoading,
    error,

    // Computed
    formattedTime,

    // Actions
    loadPuzzle,
    saveProgress,
    completeGame,
    addMove,
    useHint,
    incrementTime,
    togglePause,
    resetGame,
    setCurrentPuzzle: (puzzle: Puzzle) => currentPuzzle.value = puzzle,
    setCurrentSession: (session: GameSession) => currentSession.value = session
  }
})