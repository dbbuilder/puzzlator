<template>
  <div class="difficulty-progress">
    <h3 class="text-xl font-semibold mb-4">Difficulty Progression</h3>
    
    <!-- Current Level Display -->
    <div class="current-level mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-gray-600">Current Level</span>
        <span class="text-sm font-medium">{{ userProfile?.level || 1 }}</span>
      </div>
      <div class="level-progress">
        <div 
          class="level-progress-bar"
          :style="{ width: `${levelProgress}%` }"
        />
      </div>
      <div class="flex justify-between text-xs text-gray-500 mt-1">
        <span>{{ currentLevelPoints }} points</span>
        <span>{{ nextLevelPoints }} points</span>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <TrendingUp class="metric-icon" />
        <div class="metric-content">
          <div class="metric-value">{{ (metrics.successRate * 100).toFixed(0) }}%</div>
          <div class="metric-label">Success Rate</div>
        </div>
      </div>
      
      <div class="metric-card">
        <Clock class="metric-icon" />
        <div class="metric-content">
          <div class="metric-value">{{ formatTime(metrics.averageTime) }}</div>
          <div class="metric-label">Avg. Time</div>
        </div>
      </div>
      
      <div class="metric-card">
        <Lightbulb class="metric-icon" />
        <div class="metric-content">
          <div class="metric-value">{{ metrics.hintsPerPuzzle.toFixed(1) }}</div>
          <div class="metric-label">Hints/Puzzle</div>
        </div>
      </div>
      
      <div class="metric-card">
        <Flame class="metric-icon" />
        <div class="metric-content">
          <div class="metric-value">{{ metrics.streakCount }}</div>
          <div class="metric-label">Win Streak</div>
        </div>
      </div>
    </div>

    <!-- Difficulty Recommendation -->
    <div v-if="recommendation" class="recommendation-card" :class="recommendationClass">
      <div class="recommendation-header">
        <component :is="recommendationIcon" class="w-5 h-5" />
        <span class="font-medium">{{ recommendationTitle }}</span>
      </div>
      <p class="recommendation-text">{{ recommendation.reason }}</p>
      <div class="recommendation-confidence">
        <span class="text-sm">Confidence: </span>
        <div class="confidence-bar">
          <div 
            class="confidence-fill"
            :style="{ width: `${recommendation.confidence * 100}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Puzzle Type Performance -->
    <div class="puzzle-types-section">
      <h4 class="text-lg font-medium mb-3">Performance by Puzzle Type</h4>
      <div class="puzzle-type-list">
        <div 
          v-for="type in puzzleTypes" 
          :key="type.id"
          class="puzzle-type-item"
        >
          <div class="flex items-center gap-2">
            <component :is="type.icon" class="w-4 h-4 text-gray-600" />
            <span class="text-sm font-medium">{{ type.name }}</span>
          </div>
          <div class="puzzle-type-stats">
            <span class="stat-badge">{{ type.completed || 0 }} completed</span>
            <span class="stat-badge">{{ type.difficulty }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Unlock Progress -->
    <div v-if="!isMaxDifficulty" class="unlock-section">
      <h4 class="text-lg font-medium mb-3">Unlock Next Difficulty</h4>
      <div class="unlock-requirements">
        <div class="requirement-item" :class="{ completed: hasEnoughPoints }">
          <CheckCircle v-if="hasEnoughPoints" class="w-4 h-4 text-green-500" />
          <Circle v-else class="w-4 h-4 text-gray-400" />
          <span>{{ requiredPoints }} points</span>
        </div>
        <div class="requirement-item" :class="{ completed: hasEnoughPuzzles }">
          <CheckCircle v-if="hasEnoughPuzzles" class="w-4 h-4 text-green-500" />
          <Circle v-else class="w-4 h-4 text-gray-400" />
          <span>Complete {{ requiredPuzzles }} puzzles</span>
        </div>
      </div>
      <button 
        v-if="canUnlockNext"
        @click="unlockNextDifficulty"
        class="unlock-button"
      >
        Unlock {{ nextDifficulty }} Difficulty
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  TrendingUp, Clock, Lightbulb, Flame, 
  CheckCircle, Circle, AlertCircle, TrendingDown, Award,
  Grid3x3, Brain, Puzzle, Binary, Hash, Type, Calculator
} from 'lucide-vue-next'
import { difficultyProgressionService } from '@/services/difficultyProgression'
import { useUserStore } from '@/stores/user'
import { supabase } from '@/config/supabase'
import { useToast } from 'vue-toastification'
import type { PerformanceMetrics, DifficultyRecommendation } from '@/services/difficultyProgression'

const userStore = useUserStore()
const toast = useToast()

const metrics = ref<PerformanceMetrics>({
  successRate: 0,
  averageTime: 0,
  hintsPerPuzzle: 0,
  streakCount: 0,
  recentTrend: 'stable'
})

const recommendation = ref<DifficultyRecommendation | null>(null)
const userProfile = computed(() => userStore.profile)
const loading = ref(false)

const puzzleTypes = [
  { id: 'sudoku4x4', name: 'Sudoku 4x4', icon: Grid3x3, completed: 0, difficulty: 'medium' },
  { id: 'logic', name: 'Logic', icon: Brain, completed: 0, difficulty: 'easy' },
  { id: 'spatial', name: 'Spatial', icon: Puzzle, completed: 0, difficulty: 'medium' },
  { id: 'pattern', name: 'Pattern', icon: Binary, completed: 0, difficulty: 'hard' },
  { id: 'sequence', name: 'Sequence', icon: Hash, completed: 0, difficulty: 'medium' },
  { id: 'wordplay', name: 'Wordplay', icon: Type, completed: 0, difficulty: 'easy' },
  { id: 'math', name: 'Math', icon: Calculator, completed: 0, difficulty: 'hard' }
]

const levelProgress = computed(() => {
  if (!userProfile.value) return 0
  const currentPoints = userProfile.value.total_score || 0
  const current = currentLevelPoints.value
  const next = nextLevelPoints.value
  return ((currentPoints - current) / (next - current)) * 100
})

const currentLevelPoints = computed(() => {
  const level = userProfile.value?.level || 1
  return (level - 1) * 100
})

const nextLevelPoints = computed(() => {
  const level = userProfile.value?.level || 1
  return level * 100
})

const recommendationClass = computed(() => {
  if (!recommendation.value) return ''
  
  if (recommendation.value.recommendedLevel > recommendation.value.currentLevel) {
    return 'recommendation-upgrade'
  } else if (recommendation.value.recommendedLevel < recommendation.value.currentLevel) {
    return 'recommendation-downgrade'
  }
  return 'recommendation-maintain'
})

const recommendationIcon = computed(() => {
  if (!recommendation.value) return AlertCircle
  
  if (recommendation.value.recommendedLevel > recommendation.value.currentLevel) {
    return TrendingUp
  } else if (recommendation.value.recommendedLevel < recommendation.value.currentLevel) {
    return TrendingDown
  }
  return Award
})

const recommendationTitle = computed(() => {
  if (!recommendation.value) return ''
  
  if (recommendation.value.recommendedLevel > recommendation.value.currentLevel) {
    return 'Ready for a Challenge!'
  } else if (recommendation.value.recommendedLevel < recommendation.value.currentLevel) {
    return 'Consider Easier Puzzles'
  }
  return 'Perfect Difficulty Match'
})

const currentDifficulty = computed(() => {
  return recommendation.value?.currentLevel || 'easy'
})

const nextDifficulty = computed(() => {
  const levels = ['easy', 'medium', 'hard', 'expert']
  const currentIndex = levels.indexOf(currentDifficulty.value)
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null
})

const isMaxDifficulty = computed(() => {
  return currentDifficulty.value === 'expert'
})

const requiredPoints = computed(() => {
  const requirements = { easy: 100, medium: 500, hard: 1500, expert: 5000 }
  return requirements[currentDifficulty.value as keyof typeof requirements] || 100
})

const requiredPuzzles = computed(() => {
  const requirements = { easy: 10, medium: 20, hard: 30, expert: 50 }
  return requirements[currentDifficulty.value as keyof typeof requirements] || 10
})

const hasEnoughPoints = computed(() => {
  return (userProfile.value?.total_score || 0) >= requiredPoints.value
})

const hasEnoughPuzzles = computed(() => {
  return (userProfile.value?.puzzles_completed || 0) >= requiredPuzzles.value
})

const canUnlockNext = computed(() => {
  return hasEnoughPoints.value && hasEnoughPuzzles.value && !isMaxDifficulty.value
})

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

async function loadPerformanceData() {
  if (!userProfile.value || !supabase) return
  
  loading.value = true
  
  try {
    // Get recent game sessions
    const { data: sessions } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userProfile.value.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (sessions) {
      // Calculate overall metrics
      metrics.value = difficultyProgressionService.calculatePerformanceMetrics(sessions)
      
      // Get difficulty recommendation
      recommendation.value = difficultyProgressionService.getDifficultyRecommendation(
        userProfile.value,
        sessions
      )
      
      // Update puzzle type stats
      // TODO: Group sessions by puzzle type and calculate stats
    }
  } catch (error) {
    console.error('Failed to load performance data:', error)
  } finally {
    loading.value = false
  }
}

async function unlockNextDifficulty() {
  if (!canUnlockNext.value || !nextDifficulty.value) return
  
  // TODO: Update user profile with new difficulty unlock
  toast.success(`Congratulations! ${nextDifficulty.value} difficulty unlocked!`)
  
  // Reload data
  await loadPerformanceData()
}

onMounted(() => {
  loadPerformanceData()
})
</script>

<style scoped>
.difficulty-progress {
  @apply bg-white rounded-lg shadow p-6;
}

.current-level {
  @apply mb-6;
}

.level-progress {
  @apply w-full h-3 bg-gray-200 rounded-full overflow-hidden;
}

.level-progress-bar {
  @apply h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500;
}

.metrics-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4 mb-6;
}

.metric-card {
  @apply bg-gray-50 rounded-lg p-4 flex items-center gap-3;
}

.metric-icon {
  @apply w-8 h-8 text-purple-600;
}

.metric-content {
  @apply flex-1;
}

.metric-value {
  @apply text-xl font-bold text-gray-800;
}

.metric-label {
  @apply text-xs text-gray-600;
}

.recommendation-card {
  @apply rounded-lg p-4 mb-6 border-2;
}

.recommendation-maintain {
  @apply bg-blue-50 border-blue-200;
}

.recommendation-upgrade {
  @apply bg-green-50 border-green-200;
}

.recommendation-downgrade {
  @apply bg-yellow-50 border-yellow-200;
}

.recommendation-header {
  @apply flex items-center gap-2 mb-2;
}

.recommendation-text {
  @apply text-sm text-gray-700 mb-3;
}

.confidence-bar {
  @apply inline-block w-20 h-2 bg-gray-200 rounded-full overflow-hidden ml-2;
}

.confidence-fill {
  @apply h-full bg-purple-500 transition-all duration-300;
}

.puzzle-types-section {
  @apply mb-6;
}

.puzzle-type-list {
  @apply space-y-2;
}

.puzzle-type-item {
  @apply flex items-center justify-between p-3 bg-gray-50 rounded-lg;
}

.puzzle-type-stats {
  @apply flex gap-2;
}

.stat-badge {
  @apply text-xs px-2 py-1 bg-white rounded-full text-gray-600;
}

.unlock-section {
  @apply bg-purple-50 rounded-lg p-4;
}

.unlock-requirements {
  @apply space-y-2 mb-4;
}

.requirement-item {
  @apply flex items-center gap-2 text-sm;
}

.requirement-item.completed {
  @apply text-green-700 font-medium;
}

.unlock-button {
  @apply w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium;
}
</style>