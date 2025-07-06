<template>
  <div class="spatial-puzzle-game">
    <div ref="gameContainer" id="spatial-puzzle-phaser" class="game-canvas"></div>
    
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
          <Move3d class="w-5 h-5" />
          <span>{{ moves }}</span>
        </div>
      </div>
      
      <!-- Game Controls -->
      <div class="game-controls">
        <button
          @click="requestHint"
          class="control-btn"
          title="Get Hint (H)"
        >
          <Lightbulb class="w-5 h-5" />
          <span>Hint</span>
        </button>
        
        <button
          v-if="allowRotation"
          @click="rotateSelected"
          class="control-btn"
          title="Rotate Shape (R)"
        >
          <RotateCw class="w-5 h-5" />
          <span>Rotate</span>
        </button>
        
        <button
          @click="resetPuzzle"
          class="control-btn"
          title="Reset Puzzle"
        >
          <RotateCcw class="w-5 h-5" />
          <span>Reset</span>
        </button>
        
        <button
          @click="togglePause"
          class="control-btn"
          title="Pause/Resume"
        >
          <component :is="isPaused ? Play : Pause" class="w-5 h-5" />
          <span>{{ isPaused ? 'Resume' : 'Pause' }}</span>
        </button>
      </div>
    </div>
    
    <!-- Pause Overlay -->
    <div v-if="isPaused" class="pause-overlay">
      <div class="pause-content">
        <h2 class="pause-title">Game Paused</h2>
        <p class="pause-text">Press P or click Resume to continue</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loadPhaser } from '@/utils/loadPhaser'
import {
  Clock,
  Trophy,
  Move3d,
  Lightbulb,
  RotateCw,
  RotateCcw,
  Pause,
  Play
} from 'lucide-vue-next'
import { SpatialPuzzleScene } from '@/game/engines/phaser/SpatialPuzzleScene'
import { SpatialPuzzle } from '@/game/puzzles/spatial/SpatialPuzzle'
import { useToast } from 'vue-toastification'
import { useGameStore } from '@/stores/game'
import { useAchievementsStore } from '@/stores/achievements'

const props = defineProps<{
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
}>()

const emit = defineEmits<{
  'puzzle-complete': [score: number]
  'back-to-menu': []
}>()

// Refs
const gameContainer = ref<HTMLElement>()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const gameStore = useGameStore()
const achievementsStore = useAchievementsStore()

// Game instance
let game: Phaser.Game | null = null
let scene: SpatialPuzzleScene | null = null
let puzzle: SpatialPuzzle | null = null

// Game state
const isPaused = ref(false)
const isCompleted = ref(false)
const score = ref(0)
const moves = ref(0)
const timeElapsed = ref(0)

// Timer
let timerInterval: NodeJS.Timeout | null = null

// Computed
const formattedTime = computed(() => {
  const minutes = Math.floor(timeElapsed.value / 60)
  const seconds = timeElapsed.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const allowRotation = computed(() => {
  return props.difficulty === 'hard' || props.difficulty === 'expert'
})

// Methods
const initGame = async () => {
  if (game) {
    game.destroy(true)
  }

  // Load Phaser dynamically
  const Phaser = await loadPhaser()

  // Create puzzle instance
  puzzle = new SpatialPuzzle(props.difficulty || 'medium')
  
  // Start timer
  puzzle.startTimer()
  startTimer()

  // Create Phaser game
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'spatial-puzzle-phaser',
    width: 800,
    height: 700,
    backgroundColor: '#e8f4f8',
    scene: [SpatialPuzzleScene],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    }
  }

  game = new Phaser.Game(config)
  
  // Get scene reference when ready
  game.events.once('ready', () => {
    scene = game!.scene.getScene('SpatialPuzzleScene') as SpatialPuzzleScene
    
    // Start the scene with puzzle data
    scene.scene.start('SpatialPuzzleScene', { puzzle })
    
    // Listen for completion
    scene.events.on('puzzle-complete', handleCompletion)
    
    // Listen for state updates
    scene.events.on('state-update', updateGameState)
  })
}

const startTimer = () => {
  timerInterval = setInterval(() => {
    if (!isPaused.value && !isCompleted.value) {
      timeElapsed.value++
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const updateGameState = () => {
  if (!puzzle) return
  
  const state = puzzle.getState()
  moves.value = state.moves
  score.value = puzzle.calculateScore()
}

const togglePause = () => {
  isPaused.value = !isPaused.value
  
  if (isPaused.value) {
    scene?.scene.pause()
  } else {
    scene?.scene.resume()
  }
}

const requestHint = () => {
  if (!scene || !puzzle || isCompleted.value) return
  
  // Trigger hint in scene
  scene.events.emit('request-hint')
  
  // Update game store
  gameStore.useHint()
  updateGameState()
}

const rotateSelected = () => {
  if (!scene || !allowRotation.value) return
  
  // Trigger rotation in scene
  scene.events.emit('rotate-selected')
}

const resetPuzzle = () => {
  if (!puzzle) return
  
  // Reset puzzle
  puzzle.reset()
  timeElapsed.value = 0
  score.value = 0
  moves.value = 0
  isCompleted.value = false
  
  // Restart scene
  scene?.scene.restart({ puzzle })
  
  toast.info('Puzzle reset!')
}

const handleCompletion = (data: { score: number; puzzle: SpatialPuzzle }) => {
  if (isCompleted.value) return
  
  isCompleted.value = true
  score.value = data.score
  stopTimer()
  
  // Update game store
  gameStore.completeGame(data.score)
  
  // Check for achievements
  const gameData = {
    puzzleType: 'spatial',
    difficulty: puzzle!.difficulty,
    score: data.score,
    time: timeElapsed.value,
    moves: moves.value,
    hints: gameStore.hintsUsed,
    mistakes: 0, // Spatial puzzles don't track mistakes
    completed: true
  }
  achievementsStore.checkAndUnlockAchievements(gameData)
  
  emit('puzzle-complete', data.score)
  
  // Show completion message
  toast.success(`Puzzle completed! Score: ${data.score}`)
  
  // Navigate back after delay
  setTimeout(() => {
    router.push('/play')
  }, 3000)
}

// Keyboard shortcuts
const handleKeyboard = (event: KeyboardEvent) => {
  switch (event.key.toLowerCase()) {
    case 'p':
      togglePause()
      break
    case 'h':
      if (!event.ctrlKey && !event.metaKey) {
        requestHint()
      }
      break
    case 'r':
      if (!event.ctrlKey && !event.metaKey && allowRotation.value) {
        rotateSelected()
      } else if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        resetPuzzle()
      }
      break
  }
}

// Lifecycle
onMounted(() => {
  initGame()
  window.addEventListener('keydown', handleKeyboard)
})

onUnmounted(() => {
  stopTimer()
  window.removeEventListener('keydown', handleKeyboard)
  
  if (game) {
    game.destroy(true)
    game = null
  }
})

// Watch for state updates
watch(() => puzzle?.getState(), () => {
  updateGameState()
}, { deep: true })
</script>

<style scoped>
.spatial-puzzle-game {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.game-canvas {
  width: 100%;
  height: 700px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Game UI Overlay */
.game-ui {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  pointer-events: none;
}

.game-ui > * {
  pointer-events: auto;
}

/* Stats */
.game-stats {
  display: flex;
  gap: 2rem;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: fit-content;
  margin: 0 auto 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.stat-item svg {
  color: #6b7280;
}

/* Controls */
.game-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.control-btn:active:not(:disabled) {
  transform: translateY(0);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Pause Overlay */
.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  z-index: 100;
}

.pause-content {
  text-align: center;
  color: white;
}

.pause-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.pause-text {
  font-size: 1.125rem;
  opacity: 0.9;
}

/* Responsive */
@media (max-width: 640px) {
  .game-canvas {
    height: 600px;
  }
  
  .game-stats {
    gap: 1rem;
    font-size: 1rem;
  }
  
  .control-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
  
  .control-btn span {
    display: none;
  }
}
</style>