<template>
  <div v-if="hasError" class="game-error-boundary">
    <div class="error-container">
      <AlertTriangle class="error-icon" />
      <h2>Oops! Something went wrong</h2>
      <p>{{ errorMessage }}</p>
      <div class="error-actions">
        <button @click="resetGame" class="btn-primary">
          Reset Game
        </button>
        <button @click="goHome" class="btn-secondary">
          Go to Home
        </button>
      </div>
      <details v-if="isDevelopment" class="error-details">
        <summary>Error Details</summary>
        <pre>{{ errorStack }}</pre>
      </details>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, computed } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle } from 'lucide-vue-next'
import { captureError } from '@/config/sentry'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

const hasError = ref(false)
const errorMessage = ref('')
const errorStack = ref('')

const isDevelopment = computed(() => import.meta.env.DEV)

// Capture errors from child components
onErrorCaptured((error: Error, instance, info) => {
  hasError.value = true
  errorMessage.value = error.message || 'An unexpected error occurred in the game'
  errorStack.value = error.stack || ''
  
  // Send to Sentry with game context
  captureError(error, {
    componentInfo: info,
    gameState: {
      currentPuzzle: gameStore.currentPuzzle?.id,
      currentSession: gameStore.currentSession?.id,
      score: gameStore.score,
      moves: gameStore.moves
    },
    componentTree: instance?.$el?.tagName
  })
  
  // Log to console in development
  if (isDevelopment.value) {
    console.error('Game Error:', error)
    console.error('Component:', instance)
    console.error('Info:', info)
  }
  
  // Prevent error propagation
  return false
})

function resetGame() {
  // Clear error state
  hasError.value = false
  errorMessage.value = ''
  errorStack.value = ''
  
  // Reset game state
  gameStore.resetGame()
  
  // Reload the current route
  router.go(0)
}

function goHome() {
  hasError.value = false
  router.push('/game-selection')
}
</script>

<style scoped>
.game-error-boundary {
  @apply min-h-screen flex items-center justify-center p-4 bg-gray-50;
}

.error-container {
  @apply max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center;
}

.error-icon {
  @apply w-16 h-16 mx-auto mb-4 text-red-500;
}

.error-container h2 {
  @apply text-2xl font-bold mb-2 text-gray-800;
}

.error-container p {
  @apply text-gray-600 mb-6;
}

.error-actions {
  @apply flex gap-4 justify-center mb-6;
}

.btn-primary {
  @apply px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors;
}

.btn-secondary {
  @apply px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors;
}

.error-details {
  @apply text-left bg-gray-100 rounded p-4;
}

.error-details summary {
  @apply cursor-pointer font-semibold mb-2;
}

.error-details pre {
  @apply text-xs overflow-x-auto whitespace-pre-wrap text-red-600;
}
</style>