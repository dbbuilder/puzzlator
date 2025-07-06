<template>
  <div class="game-view">
    <div class="container">
      <!-- Back button -->
      <button
        @click="backToMenu"
        class="back-button"
      >
        <ArrowLeft class="w-5 h-5" />
        <span>Back to Menu</span>
      </button>
      
      <!-- Game Title -->
      <h1 class="game-title">{{ gameTitle }}</h1>
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading puzzle...</p>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="backToMenu" class="btn-primary">
          Back to Menu
        </button>
      </div>
      
      <!-- Game Component -->
      <component
        v-else-if="gameComponent"
        :is="gameComponent"
        :difficulty="puzzle?.difficulty"
        :puzzle-data="puzzle?.puzzle_data"
        :pattern-type="patternType"
        @puzzle-complete="handlePuzzleComplete"
        @back-to-menu="backToMenu"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { supabase } from '@/config/supabase'
import PhaserGame from '@/components/game/PhaserGame.vue'
import PatternMatchingGame from '@/components/game/PatternMatchingGame.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const puzzle = ref<any>(null)
const gameComponent = shallowRef<any>(null)

// Computed
const gameTitle = computed(() => {
  if (!puzzle.value) return 'Loading...'
  
  const typeNames: Record<string, string> = {
    'sudoku4x4': 'Sudoku 4x4',
    'pattern': 'Pattern Matching',
    'logic': 'Logic Puzzle',
    'spatial': 'Spatial Puzzle'
  }
  
  return typeNames[puzzle.value.type] || puzzle.value.title
})

const patternType = computed(() => {
  // Extract pattern type from puzzle data if available
  if (puzzle.value?.type === 'pattern' && puzzle.value?.puzzle_data?.patternType) {
    return puzzle.value.puzzle_data.patternType
  }
  
  // Default pattern types based on difficulty
  const difficultyPatterns = {
    easy: 'numeric',
    medium: 'shapes',
    hard: 'colors',
    expert: 'mixed'
  }
  
  return difficultyPatterns[puzzle.value?.difficulty as keyof typeof difficultyPatterns] || 'numeric'
})

// Methods
async function loadPuzzle() {
  loading.value = true
  error.value = null
  
  try {
    const puzzleId = route.params.puzzleId as string
    
    // Check if puzzle is already in store
    if (gameStore.currentPuzzle?.id === puzzleId) {
      puzzle.value = gameStore.currentPuzzle
    } else {
      // Load from database
      if (supabase && !puzzleId.startsWith('demo-')) {
        const { data, error: dbError } = await supabase
          .from('puzzles')
          .select('*')
          .eq('id', puzzleId)
          .single()
        
        if (dbError) throw dbError
        puzzle.value = data
      } else {
        // Demo mode
        puzzle.value = gameStore.currentPuzzle
      }
    }
    
    if (!puzzle.value) {
      throw new Error('Puzzle not found')
    }
    
    // Select appropriate component based on puzzle type
    selectGameComponent()
  } catch (err) {
    console.error('Failed to load puzzle:', err)
    error.value = 'Failed to load puzzle. Please try again.'
  } finally {
    loading.value = false
  }
}

function selectGameComponent() {
  if (!puzzle.value) return
  
  switch (puzzle.value.type) {
    case 'sudoku4x4':
      gameComponent.value = PhaserGame
      break
    case 'pattern':
      gameComponent.value = PatternMatchingGame
      break
    case 'logic':
      // TODO: Add logic puzzle component
      gameComponent.value = PatternMatchingGame // Use pattern matching for now
      break
    case 'spatial':
      // TODO: Add spatial puzzle component
      error.value = 'Spatial puzzles coming soon!'
      break
    default:
      error.value = `Unknown puzzle type: ${puzzle.value.type}`
  }
}

function handlePuzzleComplete(score: number) {
  // Puzzle completion is handled by the game components
  // This is just for any additional view-level handling
  console.log('Puzzle completed with score:', score)
}

function backToMenu() {
  router.push('/play')
}

// Lifecycle
onMounted(() => {
  loadPuzzle()
})
</script>

<style scoped>
.game-view {
  min-height: 100vh;
  background: #f9fafb;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Back button */
.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 2rem;
}

.back-button:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
}

/* Title */
.game-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1f2937;
  text-align: center;
  margin-bottom: 2rem;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem 0;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #6b7280;
  font-size: 1.125rem;
}

/* Error State */
.error-state {
  text-align: center;
  padding: 4rem 0;
}

.error-state p {
  color: #ef4444;
  font-size: 1.125rem;
  margin-bottom: 2rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #4f46e5;
}

/* Responsive */
@media (max-width: 640px) {
  .game-title {
    font-size: 2rem;
  }
}</style>