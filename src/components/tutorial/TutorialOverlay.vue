<template>
  <Teleport to="body">
    <!-- Tutorial Backdrop -->
    <div 
      v-if="isActive && showBackdrop" 
      class="tutorial-backdrop"
      @click="handleBackdropClick"
    />
    
    <!-- Tutorial Tooltip -->
    <div
      v-if="isActive && currentStep"
      ref="tooltip"
      class="tutorial-tooltip"
      :class="tooltipClasses"
      :style="tooltipStyles"
    >
      <!-- Close button -->
      <button 
        class="tutorial-close"
        @click="skipTutorial"
        aria-label="Close tutorial"
      >
        <X class="w-4 h-4" />
      </button>

      <!-- Content -->
      <h3 class="tutorial-tooltip-title">{{ currentStep.title }}</h3>
      <p class="tutorial-tooltip-content">{{ currentStep.content }}</p>
      
      <!-- Image/Video if provided -->
      <img 
        v-if="currentStep.image" 
        :src="currentStep.image" 
        :alt="currentStep.title"
        class="tutorial-media"
      />
      <video 
        v-if="currentStep.video" 
        :src="currentStep.video" 
        controls
        class="tutorial-media"
      />
      
      <!-- Progress -->
      <div v-if="showProgressBar" class="tutorial-progress">
        <div 
          class="tutorial-progress-bar" 
          :style="{ width: `${progress}%` }"
        />
      </div>
      
      <!-- Actions -->
      <div class="tutorial-tooltip-actions">
        <button 
          v-if="stepIndex > 0"
          @click="previousStep"
          class="tutorial-btn tutorial-btn-secondary"
        >
          <ChevronLeft class="w-4 h-4 inline" />
          Previous
        </button>
        
        <span class="tutorial-step-count">
          {{ stepIndex + 1 }} / {{ totalSteps }}
        </span>
        
        <button 
          @click="nextStep"
          class="tutorial-btn tutorial-btn-primary"
        >
          {{ isLastStep ? 'Finish' : 'Next' }}
          <ChevronRight v-if="!isLastStep" class="w-4 h-4 inline" />
          <Check v-else class="w-4 h-4 inline" />
        </button>
      </div>
      
      <!-- Skip button -->
      <button 
        v-if="showSkipButton"
        @click="skipTutorial"
        class="tutorial-btn tutorial-btn-text tutorial-skip"
      >
        Skip Tutorial
      </button>
      
      <!-- Arrow -->
      <div 
        v-if="currentStep.position !== 'center'"
        class="tutorial-tooltip-arrow"
        :class="`tutorial-tooltip-arrow-${currentStep.position || 'bottom'}`"
      />
    </div>
    
    <!-- Welcome Modal (First Time) -->
    <Transition name="modal">
      <div 
        v-if="showWelcome" 
        class="tutorial-welcome-modal"
      >
        <div class="tutorial-welcome-content">
          <h2 class="tutorial-welcome-title">
            Welcome to Puzzlator! 🎮
          </h2>
          <p class="tutorial-welcome-text">
            Would you like a quick tour to help you get started?
          </p>
          <div class="tutorial-welcome-actions">
            <button 
              @click="startTutorial"
              class="btn-primary"
            >
              <PlayCircle class="w-5 h-5 inline mr-2" />
              Start Tutorial
            </button>
            <button 
              @click="dismissWelcome"
              class="btn-secondary"
            >
              Skip for Now
            </button>
          </div>
          <p class="tutorial-welcome-note">
            You can always access the tutorial from the help menu
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  PlayCircle 
} from 'lucide-vue-next'
import { TutorialService } from '@/services/tutorial'
import type { TutorialStep, TutorialContext } from '@/types/tutorial'
import { useSettingsStore } from '@/stores/settings'

// Props
const props = defineProps<{
  context?: TutorialContext
  autoStart?: boolean
}>()

// Emit
const emit = defineEmits<{
  'tutorial-complete': []
  'tutorial-skip': []
}>()

// Services
const tutorialService = new TutorialService({
  skipButton: true,
  progressBar: true,
  backdrop: true,
  keyboardNavigation: true
})

const settingsStore = useSettingsStore()
const route = useRoute()

// State
const isActive = ref(false)
const currentStep = ref<TutorialStep | null>(null)
const stepIndex = ref(0)
const targetElement = ref<HTMLElement | null>(null)
const tooltip = ref<HTMLElement>()
const showWelcome = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })

// Computed
const context = computed((): TutorialContext => {
  if (props.context) return props.context
  
  // Infer context from route
  const path = route.path
  if (path === '/play') return 'game-selection'
  if (path.startsWith('/play/')) {
    // Determine game type from route or store
    return 'sudoku-game' // Default for now
  }
  if (path === '/settings') return 'settings'
  if (path === '/profile') return 'profile'
  if (path === '/achievements') return 'achievements'
  if (path === '/leaderboard') return 'leaderboard'
  
  return 'game-selection'
})

const steps = computed(() => tutorialService.getTutorialSteps(context.value))
const totalSteps = computed(() => steps.value.length)
const progress = computed(() => tutorialService.getProgress())
const isLastStep = computed(() => stepIndex.value === totalSteps.value - 1)

const showBackdrop = computed(() => settingsStore.uiSettings.theme !== 'dark')
const showProgressBar = computed(() => true)
const showSkipButton = computed(() => true)

const tooltipClasses = computed(() => {
  const classes = []
  if (currentStep.value?.customClass) {
    classes.push(currentStep.value.customClass)
  }
  return classes
})

const tooltipStyles = computed(() => ({
  left: `${tooltipPosition.value.x}px`,
  top: `${tooltipPosition.value.y}px`
}))

// Methods
function checkFirstTimeUser() {
  if (tutorialService.shouldShowTutorial() && !props.autoStart) {
    showWelcome.value = true
  } else if (props.autoStart) {
    startTutorial()
  }
}

function startTutorial() {
  showWelcome.value = false
  tutorialService.startTutorial(context.value)
  isActive.value = true
  updateCurrentStep()
}

function skipTutorial() {
  tutorialService.skipTutorial()
  isActive.value = false
  emit('tutorial-skip')
  cleanup()
}

function dismissWelcome() {
  showWelcome.value = false
  tutorialService.skipTutorial()
}

function nextStep() {
  tutorialService.nextStep()
  
  if (!tutorialService.isActive()) {
    // Tutorial completed
    isActive.value = false
    emit('tutorial-complete')
    cleanup()
  } else {
    updateCurrentStep()
  }
}

function previousStep() {
  tutorialService.previousStep()
  updateCurrentStep()
}

function updateCurrentStep() {
  stepIndex.value = tutorialService.getCurrentStep()
  currentStep.value = steps.value[stepIndex.value]
  
  if (currentStep.value) {
    nextTick(() => {
      highlightTarget()
      positionTooltip()
    })
    
    // Handle wait for action
    if (currentStep.value.waitForAction) {
      waitForUserAction()
    }
  }
}

function highlightTarget() {
  // Remove previous highlight
  if (targetElement.value) {
    targetElement.value.classList.remove('tutorial-highlight')
  }
  
  if (!currentStep.value?.target) return
  
  const element = document.querySelector(currentStep.value.target) as HTMLElement
  if (element) {
    targetElement.value = element
    element.classList.add('tutorial-highlight')
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function positionTooltip() {
  if (!tooltip.value || !currentStep.value) return
  
  const tooltipRect = tooltip.value.getBoundingClientRect()
  const position = currentStep.value.position || 'bottom'
  
  if (position === 'center' || !targetElement.value) {
    // Center on screen
    tooltipPosition.value = {
      x: (window.innerWidth - tooltipRect.width) / 2,
      y: (window.innerHeight - tooltipRect.height) / 2
    }
    return
  }
  
  const targetRect = targetElement.value.getBoundingClientRect()
  let x = 0
  let y = 0
  
  switch (position) {
    case 'top':
      x = targetRect.left + (targetRect.width - tooltipRect.width) / 2
      y = targetRect.top - tooltipRect.height - 20
      break
    case 'bottom':
      x = targetRect.left + (targetRect.width - tooltipRect.width) / 2
      y = targetRect.bottom + 20
      break
    case 'left':
      x = targetRect.left - tooltipRect.width - 20
      y = targetRect.top + (targetRect.height - tooltipRect.height) / 2
      break
    case 'right':
      x = targetRect.right + 20
      y = targetRect.top + (targetRect.height - tooltipRect.height) / 2
      break
  }
  
  // Keep within viewport
  x = Math.max(10, Math.min(x, window.innerWidth - tooltipRect.width - 10))
  y = Math.max(10, Math.min(y, window.innerHeight - tooltipRect.height - 10))
  
  tooltipPosition.value = { x, y }
}

async function waitForUserAction() {
  if (!currentStep.value?.target || !currentStep.value?.action) return
  
  const success = await tutorialService.waitForAction(currentStep.value)
  if (success) {
    nextStep()
  }
}

function handleBackdropClick() {
  // Only skip if allowed
  if (showSkipButton.value) {
    skipTutorial()
  }
}

function handleKeyboard(e: KeyboardEvent) {
  if (!isActive.value) return
  
  switch (e.key) {
    case 'ArrowRight':
      e.preventDefault()
      nextStep()
      break
    case 'ArrowLeft':
      e.preventDefault()
      if (stepIndex.value > 0) previousStep()
      break
    case 'Escape':
      e.preventDefault()
      if (showSkipButton.value) skipTutorial()
      break
  }
}

function cleanup() {
  if (targetElement.value) {
    targetElement.value.classList.remove('tutorial-highlight')
    targetElement.value = null
  }
}

// Lifecycle
onMounted(() => {
  checkFirstTimeUser()
  window.addEventListener('keydown', handleKeyboard)
  window.addEventListener('resize', positionTooltip)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboard)
  window.removeEventListener('resize', positionTooltip)
  cleanup()
})

// Watch for route changes
watch(() => route.path, () => {
  if (isActive.value) {
    // End tutorial on navigation
    cleanup()
    isActive.value = false
  }
})

// Import tutorial styles
onMounted(() => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = '/src/assets/css/tutorial.css'
  document.head.appendChild(link)
})
</script>

<style scoped>
/* Component-specific overrides */
.tutorial-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.tutorial-close:hover {
  color: #374151;
}

.tutorial-media {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin: 1rem 0;
}

.tutorial-step-count {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 1rem;
}

.tutorial-skip {
  position: absolute;
  bottom: -2rem;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

/* Welcome Modal */
.tutorial-welcome-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 1rem;
}

.tutorial-welcome-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.tutorial-welcome-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.tutorial-welcome-text {
  font-size: 1.125rem;
  color: #4b5563;
  margin-bottom: 2rem;
}

.tutorial-welcome-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.tutorial-welcome-note {
  font-size: 0.875rem;
  color: #6b7280;
}

.btn-primary {
  @apply px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center;
}

.btn-secondary {
  @apply px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .dark .tutorial-welcome-content {
    @apply bg-gray-800 text-gray-100;
  }
  
  .dark .tutorial-welcome-title {
    @apply text-gray-100;
  }
  
  .dark .tutorial-welcome-text {
    @apply text-gray-300;
  }
  
  .dark .tutorial-welcome-note {
    @apply text-gray-500;
  }
  
  .dark .btn-secondary {
    @apply bg-gray-700 text-gray-200 hover:bg-gray-600;
  }
  
  .dark .tutorial-close {
    @apply text-gray-400 hover:text-gray-200;
  }
  
  .dark .tutorial-step-count {
    @apply text-gray-400;
  }
}
</style>