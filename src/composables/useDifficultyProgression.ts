import { ref, computed, watch } from 'vue'
import { difficultyProgressionService } from '@/services/difficultyProgression'
import { useUserStore } from '@/stores/user'
import { supabase } from '@/config/supabase'
import type { 
  DifficultyLevel, 
  DifficultyRecommendation,
  PerformanceMetrics
} from '@/services/difficultyProgression'

export function useDifficultyProgression() {
  const userStore = useUserStore()
  
  const loading = ref(false)
  const recommendation = ref<DifficultyRecommendation | null>(null)
  const adaptiveSettings = ref<any>(null)
  
  const currentDifficulty = computed(() => recommendation.value?.currentLevel || 'easy')
  const recommendedDifficulty = computed(() => recommendation.value?.recommendedLevel || 'easy')
  
  const difficultyLocked = computed(() => {
    if (!userStore.profile) return true
    
    const level = userStore.profile.level || 1
    return {
      easy: false,
      medium: level < 5,
      hard: level < 10,
      expert: level < 20
    }
  })
  
  /**
   * Load user's difficulty recommendation
   */
  async function loadRecommendation(puzzleType?: string) {
    if (!userStore.profile || !supabase) return
    
    loading.value = true
    
    try {
      // Get recent sessions
      const { data: sessions } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userStore.profile.id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (sessions) {
        recommendation.value = difficultyProgressionService.getDifficultyRecommendation(
          userStore.profile,
          sessions,
          puzzleType as any
        )
        
        // Get adaptive settings
        if (puzzleType) {
          adaptiveSettings.value = difficultyProgressionService.getAdaptiveDifficultySettings(
            userStore.profile,
            puzzleType as any
          )
        }
      }
    } catch (error) {
      console.error('Failed to load difficulty recommendation:', error)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Check if user should unlock next difficulty
   */
  async function checkUnlockProgress() {
    if (!userStore.profile) return false
    
    return difficultyProgressionService.shouldUnlockNextDifficulty(
      userStore.profile,
      currentDifficulty.value
    )
  }
  
  /**
   * Get difficulty color classes
   */
  function getDifficultyColor(difficulty: DifficultyLevel) {
    const colors = {
      easy: 'text-green-600 bg-green-50 border-green-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      hard: 'text-orange-600 bg-orange-50 border-orange-200',
      expert: 'text-red-600 bg-red-50 border-red-200'
    }
    return colors[difficulty] || colors.easy
  }
  
  /**
   * Get difficulty icon
   */
  function getDifficultyIcon(difficulty: DifficultyLevel) {
    const icons = {
      easy: '⭐',
      medium: '⭐⭐',
      hard: '⭐⭐⭐',
      expert: '⭐⭐⭐⭐'
    }
    return icons[difficulty] || icons.easy
  }
  
  /**
   * Filter puzzles by recommended difficulty
   */
  function filterByRecommendation<T extends { difficulty: string }>(
    puzzles: T[],
    strict = false
  ): T[] {
    if (!recommendation.value) return puzzles
    
    if (strict) {
      // Only show recommended difficulty
      return puzzles.filter(p => p.difficulty === recommendedDifficulty.value)
    }
    
    // Show recommended + adjacent difficulties
    const levels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert']
    const recommendedIndex = levels.indexOf(recommendedDifficulty.value)
    const allowedLevels = [
      levels[Math.max(0, recommendedIndex - 1)],
      levels[recommendedIndex],
      levels[Math.min(levels.length - 1, recommendedIndex + 1)]
    ]
    
    return puzzles.filter(p => allowedLevels.includes(p.difficulty as DifficultyLevel))
  }
  
  /**
   * Record puzzle completion for progression
   */
  async function recordCompletion(sessionId: string) {
    if (!supabase) return
    
    try {
      const { data: session } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      if (session) {
        const points = difficultyProgressionService.calculateProgressionPoints(session)
        
        // Update user's total score
        if (userStore.profile && points > 0) {
          await supabase
            .from('user_profiles')
            .update({
              total_score: (userStore.profile.total_score || 0) + points
            })
            .eq('id', userStore.profile.id)
          
          // Reload user profile
          await userStore.fetchProfile()
          
          // Check for difficulty unlock
          const shouldUnlock = await checkUnlockProgress()
          if (shouldUnlock) {
            // Notify user about unlock
            return { points, unlocked: true }
          }
        }
        
        return { points, unlocked: false }
      }
    } catch (error) {
      console.error('Failed to record completion:', error)
    }
    
    return { points: 0, unlocked: false }
  }
  
  // Auto-load recommendation when user changes
  watch(() => userStore.profile?.id, (userId) => {
    if (userId) {
      loadRecommendation()
    }
  })
  
  return {
    loading,
    recommendation,
    adaptiveSettings,
    currentDifficulty,
    recommendedDifficulty,
    difficultyLocked,
    loadRecommendation,
    checkUnlockProgress,
    getDifficultyColor,
    getDifficultyIcon,
    filterByRecommendation,
    recordCompletion
  }
}