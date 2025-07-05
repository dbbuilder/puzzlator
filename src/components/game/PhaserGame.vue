<template>
  <div class="phaser-game-container">
    <div ref="gameContainer" id="phaser-game" class="game-canvas"></div>
    
    <!-- Game UI Overlay -->
    <div class="game-ui">
      <!-- Timer and Score -->
      <div class="game-stats">
        <div class="stat-item">
          <Clock class="w-5 h-5" />
          <span>{{ formattedTime }}</span>
        </div>
        <div class="stat-item">
          <Trophy class="w-5 h-5" />
          <span>{{ score }}</span>
        </div>
        <div class="stat-item">
          <Lightbulb class="w-5 h-5" />
          <span>{{ hintsRemaining }}</span>
        </div>
      </div>
      
      <!-- Game Controls -->
      <div class="game-controls">
        <button
          @click="undo"
          :disabled="!canUndo"
          class="control-btn"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 class="w-5 h-5" />
        </button>
        <button
          @click="redo"
          :disabled="!canRedo"
          class="control-btn"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 class="w-5 h-5" />
        </button>
        <button
          @click="getHint"
          :disabled="hintsRemaining === 0"
          class="control-btn"
          title="Get Hint (H)"
        >
          <Lightbulb class="w-5 h-5" />
        </button>
        <button
          @click="togglePause"
          class="control-btn"
          title="Pause/Resume (P)"
        >
          <component :is="isPaused ? Play : Pause" class="w-5 h-5" />
        </button>
      </div>
    </div>
    
    <!-- Pause Overlay -->
    <Transition name="fade">
      <div v-if="isPaused" class="pause-overlay">
        <div class="pause-content">
          <h2 class="text-2xl font-bold mb-4">Game Paused</h2>
          <button @click="togglePause" class="btn btn-primary">
            <Play class="w-5 h-5 mr-2" />
            Resume
          </button>
        </div>
      </div>
    </Transition>
    
    <!-- Completion Modal -->
    <Transition name="modal">
      <div v-if="isCompleted" class="completion-modal">
        <div class="modal-content">
          <h2 class="text-3xl font-bold text-green-600 mb-4">
            🎉 Puzzle Complete!
          </h2>
          <div class="stats-summary">
            <p class="stat-line">
              <Clock class="inline w-5 h-5 mr-2" />
              Time: {{ formattedTime }}
            </p>
            <p class="stat-line">
              <Trophy class="inline w-5 h-5 mr-2" />
              Score: {{ score }}
            </p>
            <p class="stat-line">
              <Lightbulb class="inline w-5 h-5 mr-2" />
              Hints Used: {{ hintsUsed }}
            </p>
          </div>
          <div class="modal-actions">
            <button @click="$emit('new-game')" class="btn btn-primary">
              New Game
            </button>
            <button @click="$emit('view-stats')" class="btn btn-secondary">
              View Stats
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Phaser from 'phaser'
import {
  Clock,
  Trophy,
  Lightbulb,
  Undo2,
  Redo2,
  Pause,
  Play
} from 'lucide-vue-next'
import { Sudoku4x4Scene } from '@/game/engines/phaser/Sudoku4x4Scene'
import { Sudoku4x4 } from '@/game/puzzles/sudoku/Sudoku4x4'
import type { PuzzleMove } from '@/game/types/puzzle'
import { useToast } from 'vue-toastification'
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import { api } from '@/services/api'

const props = defineProps<{
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
}>()

const emit = defineEmits<{
  'puzzle-complete': [score: number]
  'new-game': []
  'view-stats': []
}>()

const toast = useToast()
const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const userStore = useUserStore()

// Refs
const gameContainer = ref<HTMLDivElement>()
const game = ref<Phaser.Game | null>(null)
const scene = ref<Sudoku4x4Scene | null>(null)
const puzzle = ref<Sudoku4x4 | null>(null)

// Game state
const isPaused = ref(false)
const isCompleted = ref(false)
const score = computed(() => gameStore.currentScore)
const hintsRemaining = ref(3)
const hintsUsed = computed(() => gameStore.hintsUsed)
const elapsedTime = computed(() => gameStore.timeElapsed)
const canUndo = ref(false)
const canRedo = ref(false)

// Timer
let timerInterval: NodeJS.Timeout | null = null
let saveInterval: NodeJS.Timeout | null = null

// Computed
const formattedTime = computed(() => gameStore.formattedTime)

// Methods
const initGame = async () => {
  if (game.value) {
    game.value.destroy(true)
  }

  // Load puzzle from route params or create new
  const puzzleId = route.params.puzzleId as string
  
  if (puzzleId && !gameStore.currentPuzzle) {
    // Load puzzle from database
    const puzzleData = await api.getPuzzle(puzzleId)
    if (puzzleData) {
      gameStore.setCurrentPuzzle(puzzleData)
      
      // Check for existing session
      const session = await api.getActiveGameSession(userStore.currentUserId!, puzzleId)
      if (session) {
        gameStore.setCurrentSession(session)
      } else {
        // Create new session
        const newSession = await api.createGameSession({
          user_id: userStore.currentUserId!,
          puzzle_id: puzzleId,
          game_state: puzzleData.puzzle_data
        })
        gameStore.setCurrentSession(newSession)
      }
    }
  }

  // Create puzzle instance
  puzzle.value = new Sudoku4x4()
  
  // Load puzzle data if available
  if (gameStore.currentPuzzle?.puzzle_data) {
    const puzzleGrid = gameStore.currentPuzzle.puzzle_data as (number | null)[][]
    puzzle.value.loadPuzzle(puzzleGrid)
  }
  
  // Restore game state if resuming
  if (gameStore.currentSession?.game_state) {
    const gameState = gameStore.currentSession.game_state as any
    if (typeof gameState === 'string') {
      puzzle.value.deserialize(gameState)
    } else if (gameState.grid) {
      puzzle.value.loadPuzzle(gameState.grid)
    }
  }
  
  // Create Phaser game
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: gameContainer.value,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: []
  }

  game.value = new Phaser.Game(config)
  
  // Create and add scene
  scene.value = new Sudoku4x4Scene(puzzle.value as any)
  game.value.scene.add('Sudoku4x4Scene', scene.value, true)

  // Set up event handlers
  setupEventHandlers()
  
  // Start timer
  startTimer()
  
  // Start auto-save
  startAutoSave()
}

const setupEventHandlers = () => {
  if (!scene.value || !puzzle.value) return

  // Handle moves from the scene
  scene.value.onMove((move: PuzzleMove) => {
    if (!puzzle.value) return
    
    const result = puzzle.value.makeMove(move)
    
    if (result.success) {
      scene.value!.updateFromPuzzleState()
      updateGameState()
      gameStore.addMove(move)
      
      // Check if completed
      if (puzzle.value.isComplete()) {
        handleCompletion()
      }
    } else {
      // Show error animation
      scene.value!.animateInvalidMove(move.row, move.col)
      toast.error(result.error || 'Invalid move')
    }
  })

  // Listen for puzzle completion from scene
  scene.value.events.on('puzzle:completed', handleCompletion)
}

const updateGameState = () => {
  if (!puzzle.value) return
  
  const state = puzzle.value.getState()
  canUndo.value = state.moves.length > 0
  canRedo.value = false // Will be updated when redo is implemented
}

const startTimer = () => {
  if (!puzzle.value) return
  
  puzzle.value.startTimer()
  
  timerInterval = setInterval(() => {
    if (!isPaused.value && !isCompleted.value) {
      gameStore.incrementTime()
    }
  }, 1000)
}

const startAutoSave = () => {
  saveInterval = setInterval(() => {
    if (!isPaused.value && !isCompleted.value && puzzle.value) {
      gameStore.saveProgress()
    }
  }, 10000) // Save every 10 seconds
}

const togglePause = () => {
  if (!puzzle.value || isCompleted.value) return
  
  isPaused.value = !isPaused.value
  gameStore.togglePause()
  
  if (isPaused.value) {
    puzzle.value.pauseTimer()
  } else {
    puzzle.value.resumeTimer()
  }
}

const undo = () => {
  if (!puzzle.value || !scene.value || !canUndo.value) return
  
  const success = puzzle.value.undo()
  if (success) {
    scene.value.updateFromPuzzleState()
    updateGameState()
  }
}

const redo = () => {
  if (!puzzle.value || !scene.value) return
  
  const success = puzzle.value.redo()
  if (success) {
    scene.value.updateFromPuzzleState()
    updateGameState()
  }
}

const getHint = () => {
  if (!puzzle.value || !scene.value || hintsRemaining.value === 0) return
  
  // Find a cell that needs a hint
  const state = puzzle.value.getState()
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (state.grid[row][col].value === null && !state.grid[row][col].locked) {
        const hint = puzzle.value.getHint(row, col)
        if (hint && hint.possibleValues.length === 1) {
          // Auto-fill if only one possibility
          const move: PuzzleMove = {
            row,
            col,
            value: hint.possibleValues[0]
          }
          puzzle.value.makeMove(move)
          scene.value.updateFromPuzzleState()
          scene.value.animateNumberPlacement(row, col, hint.possibleValues[0] as number)
          
          hintsRemaining.value--
          gameStore.useHint()
          puzzle.value.useHint()
          
          toast.success(`Hint: Place ${hint.possibleValues[0]} at row ${row + 1}, column ${col + 1}`)
          return
        }
      }
    }
  }
  
  toast.info('No obvious hints available. Keep trying!')
}

const handleCompletion = async () => {
  if (!puzzle.value || isCompleted.value) return
  
  isCompleted.value = true
  
  // Complete the game in the store
  await gameStore.completeGame()
  
  emit('puzzle-complete', gameStore.currentScore)
  
  // Show completion message
  toast.success(`Puzzle completed! Score: ${gameStore.currentScore}`)
  
  // Navigate to game selection after a delay
  setTimeout(() => {
    router.push('/play')
  }, 3000)
}

// Keyboard shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') {
      e.preventDefault()
      undo()
    } else if (e.key === 'y') {
      e.preventDefault()
      redo()
    }
  } else if (e.key === 'h' || e.key === 'H') {
    e.preventDefault()
    getHint()
  } else if (e.key === 'p' || e.key === 'P') {
    e.preventDefault()
    togglePause()
  }
}

// Lifecycle
onMounted(() => {
  initGame()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(async () => {
  window.removeEventListener('keydown', handleKeydown)
  
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  
  if (saveInterval) {
    clearInterval(saveInterval)
  }
  
  // Save progress before leaving
  if (!isCompleted.value && puzzle.value) {
    await gameStore.saveProgress()
  }
  
  if (game.value) {
    game.value.destroy(true)
  }
})

// Watch for difficulty changes
watch(() => props.difficulty, () => {
  // Reset game with new difficulty
  initGame()
})
</script>

<style scoped>
.phaser-game-container {
  @apply relative w-full h-screen bg-gray-900;
}

.game-canvas {
  @apply w-full h-full min-h-[600px];
}

.game-ui {
  @apply absolute top-0 left-0 right-0 p-4 pointer-events-none;
}

.game-stats {
  @apply flex justify-center gap-6 mb-4;
}

.stat-item {
  @apply flex items-center gap-2 bg-gray-800 bg-opacity-90 px-3 py-1.5 rounded-lg pointer-events-auto;
}

.stat-item svg {
  @apply text-gray-400;
}

.stat-item span {
  @apply text-white font-mono;
}

.game-controls {
  @apply flex justify-center gap-2;
}

.control-btn {
  @apply p-2 bg-gray-800 bg-opacity-90 rounded-lg transition-all pointer-events-auto
         hover:bg-gray-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed;
}

.control-btn svg {
  @apply text-white;
}

.pause-overlay {
  @apply absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20;
}

.pause-content {
  @apply bg-white p-8 rounded-lg text-center text-gray-900;
}

.completion-modal {
  @apply absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-30;
}

.modal-content {
  @apply bg-white p-8 rounded-lg text-center max-w-md w-full mx-4 text-gray-900;
}

.stats-summary {
  @apply space-y-2 mb-6 text-gray-700;
}

.stat-line {
  @apply text-lg flex items-center justify-center text-gray-700;
}

.modal-actions {
  @apply flex gap-4 justify-center;
}

.btn {
  @apply px-6 py-2 rounded-lg font-semibold transition-all;
}

.btn-primary {
  @apply bg-purple-600 text-white hover:bg-purple-700;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-900 hover:bg-gray-300;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>