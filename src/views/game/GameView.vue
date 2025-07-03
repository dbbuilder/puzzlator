<template>
  <div class="min-h-screen bg-game-background">
    <!-- Game Header -->
    <div class="bg-game-surface border-b border-game-border">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <RouterLink 
              to="/"
              class="p-2 rounded-lg hover:bg-game-muted/10 transition-colors"
            >
              <ArrowLeft class="w-6 h-6" />
            </RouterLink>
            <h1 class="text-xl font-semibold text-game-text">
              {{ gameStarted ? 'Sudoku 4x4' : 'Puzzle Game' }}
            </h1>
          </div>
          
          <div v-if="gameStarted" class="flex items-center gap-4">
            <!-- Difficulty -->
            <div class="flex items-center gap-2">
              <span class="text-sm text-game-muted">Difficulty:</span>
              <select 
                v-model="difficulty"
                @change="changeDifficulty"
                class="px-3 py-1 bg-game-surface border border-game-border rounded text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Game Content -->
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- Puzzle Status -->
        <div v-if="!gameStarted" class="text-center py-16">
          <h2 class="text-3xl font-bold text-game-text mb-4">Ready to Play?</h2>
          <p class="text-game-muted mb-8">Choose a puzzle type to begin your challenge</p>
          
          <div class="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <button 
              @click="startGame('logic')"
              class="puzzle-type-card"
            >
              <div class="w-16 h-16 bg-game-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-game-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-game-text mb-2">Logic Puzzles</h3>
              <p class="text-game-muted">Number grids, Sudoku variants, and constraint satisfaction</p>
            </button>
            
            <button 
              @click="startGame('pattern')"
              class="puzzle-type-card opacity-50 cursor-not-allowed"
              disabled
            >
              <div class="w-16 h-16 bg-game-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-game-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-game-muted mb-2">Pattern Recognition</h3>
              <p class="text-game-muted">Coming soon!</p>
            </button>
          </div>
        </div>
        
        <!-- Active Game -->
        <div v-else class="game-container">
          <PhaserGame
            :difficulty="difficulty"
            @puzzle-complete="handlePuzzleComplete"
            @new-game="startNewGame"
            @view-stats="viewStats"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import PhaserGame from '@/components/game/PhaserGame.vue'
import type { PuzzleDifficulty } from '@/game/types/puzzle'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

// Game state
const gameStarted = ref(false)
const gameType = ref<'logic' | 'pattern'>('logic')
const difficulty = ref<PuzzleDifficulty>('easy')

// Methods
function startGame(type: 'logic' | 'pattern') {
  if (type === 'pattern') {
    appStore.showInfo('Pattern puzzles coming soon!')
    return
  }
  
  gameType.value = type
  gameStarted.value = true
}

function changeDifficulty() {
  if (confirm('Changing difficulty will start a new game. Continue?')) {
    // The PhaserGame component will handle the restart
  } else {
    // Reset to previous difficulty if user cancels
    // This would need to track previous value
  }
}

function handlePuzzleComplete(score: number) {
  appStore.showSuccess(`Congratulations! You completed the puzzle with a score of ${score}!`)
  
  // Save score if user is logged in
  if (authStore.isAuthenticated) {
    // TODO: Save score to database
    console.log('Saving score:', score)
  }
}

function startNewGame() {
  gameStarted.value = false
  // Let user choose puzzle type again
}

function viewStats() {
  router.push('/profile')
}
</script>

<style scoped>
.puzzle-type-card {
  @apply p-6 bg-game-surface border border-game-border rounded-xl 
         hover:border-game-accent hover:shadow-lg transition-all
         text-center;
}

.puzzle-type-card:not(:disabled):hover {
  @apply transform -translate-y-1;
}

.btn-primary {
  @apply px-4 py-2 bg-game-accent text-white rounded-lg hover:bg-game-accent-hover 
         transition-colors font-medium flex items-center;
}

.btn-secondary {
  @apply px-4 py-2 bg-game-surface text-game-text border border-game-border rounded-lg 
         hover:bg-game-muted/10 transition-colors font-medium flex items-center
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.game-container {
  @apply min-h-[600px];
}
</style>