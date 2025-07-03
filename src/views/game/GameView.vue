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
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </RouterLink>
            <h1 class="text-xl font-semibold text-game-text">Puzzle Game</h1>
          </div>
          
          <div class="flex items-center gap-4">
            <!-- Timer -->
            <div class="flex items-center gap-2 text-game-muted">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="font-mono">{{ formattedTime }}</span>
            </div>
            
            <!-- Score -->
            <div class="flex items-center gap-2 text-game-accent">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="font-semibold">{{ score }}</span>
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
        <div v-else>
          <!-- Game Canvas Container -->
          <div class="bg-game-surface rounded-xl p-8 shadow-xl">
            <div id="game-container" class="mx-auto"></div>
          </div>
          
          <!-- Game Controls -->
          <div class="mt-6 flex items-center justify-between">
            <button 
              @click="resetGame"
              class="btn-secondary"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Reset
            </button>
            
            <div class="flex items-center gap-4">
              <button 
                @click="showHint"
                :disabled="hintsUsed >= 3"
                class="btn-secondary"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                Hint ({{ 3 - hintsUsed }} left)
              </button>
              
              <button 
                @click="pauseGame"
                class="btn-primary"
              >
                <svg v-if="!isPaused" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

// Game state
const gameStarted = ref(false)
const gameType = ref<'logic' | 'pattern'>('logic')
const score = ref(0)
const timer = ref(0)
const isPaused = ref(false)
const hintsUsed = ref(0)

// Timer interval
let timerInterval: number | null = null

// Computed
const formattedTime = computed(() => {
  const minutes = Math.floor(timer.value / 60)
  const seconds = timer.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// Methods
function startGame(type: 'logic' | 'pattern') {
  if (type === 'pattern') {
    appStore.showInfo('Pattern puzzles coming soon!')
    return
  }
  
  gameType.value = type
  gameStarted.value = true
  score.value = 0
  timer.value = 0
  hintsUsed.value = 0
  isPaused.value = false
  
  // Start timer
  timerInterval = window.setInterval(() => {
    if (!isPaused.value) {
      timer.value++
    }
  }, 1000)
  
  // Initialize game
  initializeGame()
}

function initializeGame() {
  // TODO: Initialize Phaser game or puzzle logic
  appStore.showInfo('Game initialization coming soon! This is where the puzzle would appear.')
}

function resetGame() {
  if (confirm('Are you sure you want to reset the current puzzle?')) {
    // Reset game state
    initializeGame()
    timer.value = 0
    hintsUsed.value = 0
  }
}

function showHint() {
  if (hintsUsed.value >= 3) {
    appStore.showWarning('No more hints available!')
    return
  }
  
  hintsUsed.value++
  appStore.showInfo(`Hint ${hintsUsed.value}/3: Look for patterns in the numbers...`)
}

function pauseGame() {
  isPaused.value = !isPaused.value
  if (isPaused.value) {
    appStore.showInfo('Game paused')
  }
}

// Lifecycle
onMounted(() => {
  // Set up game container dimensions
  const container = document.getElementById('game-container')
  if (container) {
    container.style.width = '600px'
    container.style.height = '600px'
    container.style.maxWidth = '100%'
    container.style.aspectRatio = '1'
  }
})

onUnmounted(() => {
  // Clean up timer
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
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

#game-container {
  @apply bg-game-background rounded-lg border border-game-border;
}
</style>