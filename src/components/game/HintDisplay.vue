<template>
  <Teleport to="body">
    <Transition name="hint-fade">
      <div 
        v-if="isVisible" 
        class="hint-overlay"
        @click="closeHint"
      >
        <div 
          class="hint-container"
          :class="[`hint-${hint?.level}`, `animation-${hint?.animation}`]"
          @click.stop
        >
          <!-- Header -->
          <div class="hint-header">
            <h3 class="hint-title">{{ formattedHint.title }}</h3>
            <button 
              @click="closeHint"
              class="hint-close"
              aria-label="Close hint"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="hint-content">
            <p class="hint-message">{{ formattedHint.content }}</p>
            
            <!-- Visual Guide -->
            <div v-if="formattedHint.visual" class="hint-visual">
              <div class="visual-label">Visual Guide:</div>
              <div class="visual-content">{{ formattedHint.visual }}</div>
            </div>

            <!-- Steps for advanced hints -->
            <div v-if="formattedHint.steps" class="hint-steps">
              <div class="steps-label">Step by step:</div>
              <ol class="steps-list">
                <li 
                  v-for="(step, index) in formattedHint.steps" 
                  :key="index"
                  class="step-item"
                  :class="{ 'step-active': currentStep === index }"
                  @click="formattedHint.interactive && setCurrentStep(index)"
                >
                  {{ step }}
                </li>
              </ol>
            </div>
          </div>

          <!-- Footer -->
          <div class="hint-footer">
            <div class="hint-level">
              <span class="level-indicator" :class="`level-${hint?.level}`">
                {{ hint?.level }} hint
              </span>
              <span class="hint-penalty">
                -{{ getPenalty(hint?.level) }} points
              </span>
            </div>
            
            <div class="hint-actions">
              <button 
                v-if="canRequestMoreHints"
                @click="requestNextHint"
                class="btn-next-hint"
                :disabled="!canRequestHint"
              >
                <HelpCircle class="w-4 h-4" />
                <span>Need more help?</span>
              </button>
              <button 
                @click="closeHint"
                class="btn-close"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Cooldown indicator -->
  <Transition name="cooldown-fade">
    <div 
      v-if="showCooldown" 
      class="cooldown-indicator"
    >
      <Clock class="w-4 h-4" />
      <span>Next hint in {{ cooldownSeconds }}s</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { X, HelpCircle, Clock } from 'lucide-vue-next'
import { HintService } from '@/services/hints'
import { HINT_PENALTIES, HINT_COOLDOWN } from '@/types/hints'
import type { HintResult, FormattedHint } from '@/types/hints'
import { useGameStore } from '@/stores/game'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{
  hint: HintResult | null
  puzzleId: string
  puzzleType: string
}>()

const emit = defineEmits<{
  close: []
  'request-next': []
}>()

const gameStore = useGameStore()
const settingsStore = useSettingsStore()
const hintService = new HintService()

// State
const isVisible = ref(false)
const currentStep = ref(0)
const showCooldown = ref(false)
const cooldownSeconds = ref(0)
let cooldownInterval: NodeJS.Timeout | null = null

// Computed
const formattedHint = computed((): FormattedHint => {
  if (!props.hint) {
    return { title: '', content: '' }
  }
  return hintService.formatHint(props.hint)
})

const canRequestMoreHints = computed(() => {
  return props.hint?.level !== 'advanced'
})

const canRequestHint = computed(() => {
  return hintService.canRequestHint(props.puzzleId)
})

// Methods
function closeHint() {
  isVisible.value = false
  setTimeout(() => {
    emit('close')
  }, 300)
}

function requestNextHint() {
  if (!canRequestHint.value) {
    startCooldown()
    return
  }
  emit('request-next')
}

function setCurrentStep(index: number) {
  if (formattedHint.value.interactive) {
    currentStep.value = index
  }
}

function getPenalty(level?: string): number {
  if (!level) return 0
  return HINT_PENALTIES[level as keyof typeof HINT_PENALTIES] || 0
}

function startCooldown() {
  showCooldown.value = true
  cooldownSeconds.value = Math.ceil(HINT_COOLDOWN / 1000)
  
  cooldownInterval = setInterval(() => {
    cooldownSeconds.value--
    if (cooldownSeconds.value <= 0) {
      showCooldown.value = false
      if (cooldownInterval) {
        clearInterval(cooldownInterval)
        cooldownInterval = null
      }
    }
  }, 1000)
}

// Animation timing
function applyAnimation() {
  if (!props.hint?.animation) return
  
  // Apply animation class to relevant game elements
  const duration = props.hint.duration || 3000
  
  // This would be implemented based on the specific game
  // For now, just remove animation class after duration
  setTimeout(() => {
    // Remove animation
  }, duration)
}

// Watchers
watch(() => props.hint, (newHint) => {
  if (newHint) {
    isVisible.value = true
    currentStep.value = 0
    applyAnimation()
    
    // Auto-close basic hints after duration
    if (newHint.level === 'basic' && settingsStore.gameSettings.enableHints) {
      setTimeout(() => {
        if (isVisible.value) {
          closeHint()
        }
      }, newHint.duration || 5000)
    }
  } else {
    isVisible.value = false
  }
}, { immediate: true })

// Cleanup
onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }
})
</script>

<style scoped>
/* Overlay */
.hint-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4;
}

/* Container */
.hint-container {
  @apply bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden;
  animation: slideIn 0.3s ease-out;
}

/* Level-specific styling */
.hint-basic {
  @apply border-t-4 border-blue-500;
}

.hint-intermediate {
  @apply border-t-4 border-purple-500;
}

.hint-advanced {
  @apply border-t-4 border-orange-500;
}

/* Header */
.hint-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.hint-title {
  @apply text-xl font-bold text-gray-800;
}

.hint-close {
  @apply p-1 text-gray-500 hover:text-gray-700 transition-colors;
}

/* Content */
.hint-content {
  @apply p-4 space-y-4 max-h-[50vh] overflow-y-auto;
}

.hint-message {
  @apply text-gray-700 leading-relaxed;
}

/* Visual Guide */
.hint-visual {
  @apply bg-gray-50 rounded-lg p-3;
}

.visual-label {
  @apply text-sm font-semibold text-gray-600 mb-1;
}

.visual-content {
  @apply font-mono text-lg text-purple-600;
}

/* Steps */
.hint-steps {
  @apply space-y-2;
}

.steps-label {
  @apply text-sm font-semibold text-gray-600;
}

.steps-list {
  @apply space-y-2 ml-4;
}

.step-item {
  @apply text-gray-700 cursor-pointer transition-all py-1 px-2 rounded;
}

.step-item:hover {
  @apply bg-gray-50;
}

.step-active {
  @apply bg-purple-50 text-purple-700 font-medium;
}

/* Footer */
.hint-footer {
  @apply flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50;
}

.hint-level {
  @apply flex items-center gap-2 text-sm;
}

.level-indicator {
  @apply px-2 py-1 rounded-full text-white font-medium;
}

.level-basic {
  @apply bg-blue-500;
}

.level-intermediate {
  @apply bg-purple-500;
}

.level-advanced {
  @apply bg-orange-500;
}

.hint-penalty {
  @apply text-red-600 font-medium;
}

.hint-actions {
  @apply flex items-center gap-2;
}

.btn-next-hint {
  @apply flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 transition-colors;
}

.btn-next-hint:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-close {
  @apply px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium;
}

/* Cooldown Indicator */
.cooldown-indicator {
  @apply fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm;
}

/* Animations */
@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animation-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.animation-glow {
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.3);
}

.animation-arrow::after {
  content: '→';
  @apply absolute -right-8 top-1/2 transform -translate-y-1/2 text-2xl text-purple-600;
  animation: arrow-bounce 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

@keyframes arrow-bounce {
  0%, 100% {
    transform: translateY(-50%) translateX(0);
  }
  50% {
    transform: translateY(-50%) translateX(5px);
  }
}

/* Transitions */
.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.3s;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}

.cooldown-fade-enter-active,
.cooldown-fade-leave-active {
  transition: all 0.3s;
}

.cooldown-fade-enter-from,
.cooldown-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .dark .hint-container {
    @apply bg-gray-800 text-gray-100;
  }
  
  .dark .hint-header {
    @apply border-gray-700;
  }
  
  .dark .hint-title {
    @apply text-gray-100;
  }
  
  .dark .hint-close {
    @apply text-gray-400 hover:text-gray-200;
  }
  
  .dark .hint-message {
    @apply text-gray-200;
  }
  
  .dark .hint-visual {
    @apply bg-gray-700;
  }
  
  .dark .visual-label,
  .dark .steps-label {
    @apply text-gray-400;
  }
  
  .dark .step-item {
    @apply text-gray-200;
  }
  
  .dark .step-item:hover {
    @apply bg-gray-700;
  }
  
  .dark .step-active {
    @apply bg-purple-900 text-purple-200;
  }
  
  .dark .hint-footer {
    @apply bg-gray-700 border-gray-600;
  }
}
</style>