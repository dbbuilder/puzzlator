import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type { Database } from '@/types/db'

type Puzzle = Database['public']['Tables']['puzzles']['Row']
type GameSession = Database['public']['Tables']['game_sessions']['Row']

export const useGameStore = defineStore('game', () => {
  const currentPuzzle = ref<Puzzle | null>(null)
  const currentSession = ref<GameSession | null>(null)
  const timeElapsed = ref(0)
  const hintsUsed = ref(0)
  const moves = ref<any[]>([])
  const isPaused = ref(false)
  const isCompleted = ref(false)

  const currentScore = computed(() => {
    if (!currentPuzzle.value || !currentSession.value) return 0
    
    const baseScore = currentPuzzle.value.max_score
    const hintPenalty = hintsUsed.value * currentPuzzle.value.hint_penalty
    const timePenalty = Math.floor(timeElapsed.value / 60) * 5 // 5 points per minute
    
    return Math.max(0, baseScore - hintPenalty - timePenalty)
  })

  const formattedTime = computed(() => {
    const minutes = Math.floor(timeElapsed.value / 60)
    const seconds = timeElapsed.value % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  function setCurrentPuzzle(puzzle: Puzzle) {
    currentPuzzle.value = puzzle
    resetGameState()
  }

  function setCurrentSession(session: GameSession) {
    currentSession.value = session
    timeElapsed.value = session.time_elapsed
    hintsUsed.value = session.hints_used
    moves.value = session.moves as any[] || []
  }

  function resetGameState() {
    timeElapsed.value = 0
    hintsUsed.value = 0
    moves.value = []
    isPaused.value = false
    isCompleted.value = false
  }

  function addMove(move: any) {
    moves.value.push({
      ...move,
      timestamp: Date.now(),
      timeElapsed: timeElapsed.value
    })
  }

  function useHint() {
    hintsUsed.value++
    saveProgress()
  }

  function togglePause() {
    isPaused.value = !isPaused.value
  }

  function incrementTime() {
    if (!isPaused.value && !isCompleted.value) {
      timeElapsed.value++
    }
  }

  async function saveProgress() {
    if (!currentSession.value) return

    try {
      const updatedSession = await api.updateGameSession(currentSession.value.id, {
        time_elapsed: timeElapsed.value,
        hints_used: hintsUsed.value,
        moves: moves.value,
        score: currentScore.value
      })
      currentSession.value = updatedSession
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  async function completeGame() {
    if (!currentSession.value || isCompleted.value) return

    isCompleted.value = true
    
    try {
      const updatedSession = await api.updateGameSession(currentSession.value.id, {
        status: 'completed',
        time_elapsed: timeElapsed.value,
        hints_used: hintsUsed.value,
        moves: moves.value,
        score: currentScore.value,
        completed_at: new Date().toISOString()
      })
      currentSession.value = updatedSession

      // Add to leaderboard
      if (currentPuzzle.value) {
        await api.addLeaderboardEntry({
          user_id: currentSession.value.user_id,
          puzzle_id: currentPuzzle.value.id,
          puzzle_type: currentPuzzle.value.type,
          difficulty: currentPuzzle.value.difficulty,
          score: currentScore.value,
          time_elapsed: timeElapsed.value,
          hints_used: hintsUsed.value,
          period_type: 'all_time'
        })
      }
    } catch (error) {
      console.error('Failed to complete game:', error)
    }
  }

  async function abandonGame() {
    if (!currentSession.value) return

    try {
      await api.updateGameSession(currentSession.value.id, {
        status: 'abandoned',
        time_elapsed: timeElapsed.value,
        hints_used: hintsUsed.value,
        moves: moves.value
      })
    } catch (error) {
      console.error('Failed to abandon game:', error)
    }
  }

  return {
    // State
    currentPuzzle,
    currentSession,
    timeElapsed,
    hintsUsed,
    moves,
    isPaused,
    isCompleted,
    
    // Computed
    currentScore,
    formattedTime,
    
    // Actions
    setCurrentPuzzle,
    setCurrentSession,
    resetGameState,
    addMove,
    useHint,
    togglePause,
    incrementTime,
    saveProgress,
    completeGame,
    abandonGame
  }
})