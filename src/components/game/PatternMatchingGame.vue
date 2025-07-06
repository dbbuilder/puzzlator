<template>
  <div class="pattern-matching-game">
    <div ref="gameContainer" id="pattern-matching-phaser" class="game-canvas"></div>
    
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
          <Brain class="w-5 h-5" />
          <span>{{ attempts }}</span>
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
import Phaser from 'phaser'
import {
  Clock,
  Trophy,
  Brain,
  Lightbulb,
  RotateCcw,
  Pause,
  Play
} from 'lucide-vue-next'
import { PatternMatchingScene } from '@/game/engines/phaser/PatternMatchingScene'
import { PatternMatchingPuzzle } from '@/game/puzzles/logic/PatternMatching'
import { useToast } from 'vue-toastification'
import { useGameStore } from '@/stores/game'
import { useAchievementsStore } from '@/stores/achievements'

const props = defineProps<{
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
  patternType?: 'numeric' | 'shapes' | 'colors' | 'mixed'
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
let scene: PatternMatchingScene | null = null
let puzzle: PatternMatchingPuzzle | null = null

// Game state
const isPaused = ref(false)
const isCompleted = ref(false)
const score = ref(0)
const attempts = ref(0)
const timeElapsed = ref(0)

// Timer
let timerInterval: NodeJS.Timeout | null = null

// Computed
const formattedTime = computed(() => {
  const minutes = Math.floor(timeElapsed.value / 60)
  const seconds = timeElapsed.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Methods
const initGame = () => {
  if (game) {
    game.destroy(true)
  }

  // Create puzzle instance
  puzzle = new PatternMatchingPuzzle(props.difficulty || 'medium')
  
  // Generate pattern based on type
  if (props.patternType) {
    puzzle.generatePattern(props.patternType, props.difficulty || 'medium')
  }
  
  // Start timer
  puzzle.startTimer()
  startTimer()

  // Create Phaser game
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'pattern-matching-phaser',
    width: 800,
    height: 700,
    backgroundColor: '#f0f0f0',
    scene: [PatternMatchingScene],
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
    scene = game!.scene.getScene('PatternMatchingScene') as PatternMatchingScene
    
    // Start the scene with puzzle data
    scene.scene.start('PatternMatchingScene', { puzzle })
    
    // Listen for completion
    scene.events.on('puzzle-complete', handleCompletion)
  })
}

const startTimer = () => {
  timerInterval = setInterval(() => {
    if (!isPaused.value) {
      timeElapsed.value++
      attempts.value = puzzle?.getAttempts() || 0
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
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
}

const resetPuzzle = () => {
  if (!puzzle) return
  
  // Reset puzzle
  puzzle.reset()
  timeElapsed.value = 0
  score.value = 0
  attempts.value = 0
  isCompleted.value = false
  
  // Restart scene
  scene?.scene.restart({ puzzle })
  
  toast.info('Puzzle reset!')
}

const handleCompletion = (data: { score: number; puzzle: PatternMatchingPuzzle }) => {
  if (isCompleted.value) return
  
  isCompleted.value = true
  score.value = data.score
  stopTimer()
  
  // Update game store
  gameStore.completeGame(data.score)
  
  // Check for achievements
  const gameData = {
    puzzleType: 'pattern-matching',
    difficulty: puzzle!.difficulty,
    score: data.score,
    time: timeElapsed.value,
    moves: attempts.value,
    hints: gameStore.hintsUsed,
    mistakes: puzzle!.getMistakes(),
    completed: true
  }
  achievementsStore.checkAndUnlockAchievements(gameData)
  
  emit('puzzle-complete', data.score)
  
  // Show completion message
  toast.success(`Pattern completed! Score: ${data.score}`)
  
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
      if (event.ctrlKey || event.metaKey) {
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
</script>

<style scoped>
.pattern-matching-game {
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