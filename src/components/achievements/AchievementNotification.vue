<template>
  <Teleport to="body">
    <Transition name="notification">
      <div
        v-if="currentAchievement"
        :class="[
          'achievement-notification',
          `achievement-notification--${currentAchievement.rarity}`,
          `achievement-notification--${position}`
        ]"
      >
        <!-- Confetti for rare achievements -->
        <div
          v-if="showConfetti"
          class="achievement-notification__confetti"
        />
        
        <!-- Content -->
        <div class="achievement-notification__content">
          <!-- Header -->
          <div class="achievement-notification__header">
            <span class="achievement-notification__title">Achievement Unlocked!</span>
            <button
              v-if="dismissible"
              @click="dismiss"
              class="achievement-notification__close"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
          
          <!-- Achievement info -->
          <div class="achievement-notification__body">
            <div class="achievement-notification__icon">
              {{ currentAchievement.icon }}
            </div>
            <div class="achievement-notification__info">
              <h3 class="achievement-notification__name">
                {{ currentAchievement.name }}
              </h3>
              <p class="achievement-notification__description">
                {{ currentAchievement.description }}
              </p>
              <div
                v-if="currentAchievement.maxProgress > 1"
                class="achievement-notification__progress"
              >
                Progress: {{ currentAchievement.progress }}/{{ currentAchievement.maxProgress }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Achievement } from '@/types/achievements'

interface Props {
  achievement: Achievement | null
  duration?: number
  position?: 'top-right' | 'top-center' | 'bottom-center'
  dismissible?: boolean
  playSound?: boolean
  queue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  duration: 5000,
  position: 'top-right',
  dismissible: true,
  playSound: true,
  queue: false
})

const emit = defineEmits<{
  hidden: []
  dismiss: [achievement: Achievement]
}>()

// State
const currentAchievement = ref<Achievement | null>(null)
const achievementQueue = ref<Achievement[]>([])
let hideTimeout: ReturnType<typeof setTimeout> | null = null

// Computed
const showConfetti = computed(() => 
  currentAchievement.value && 
  ['epic', 'legendary'].includes(currentAchievement.value.rarity)
)

// Watch for achievement changes
watch(() => props.achievement, (newAchievement) => {
  if (!newAchievement) return
  
  if (props.queue && currentAchievement.value) {
    // Add to queue if one is already showing
    achievementQueue.value.push(newAchievement)
  } else {
    showAchievement(newAchievement)
  }
})

// Methods
function showAchievement(achievement: Achievement) {
  currentAchievement.value = achievement
  
  // Play sound if enabled
  if (props.playSound) {
    playAchievementSound()
  }
  
  // Set up auto-hide
  if (hideTimeout) {
    clearTimeout(hideTimeout)
  }
  
  hideTimeout = setTimeout(() => {
    hide()
  }, props.duration)
}

function hide() {
  currentAchievement.value = null
  emit('hidden')
  
  // Show next in queue if any
  if (achievementQueue.value.length > 0) {
    const next = achievementQueue.value.shift()!
    setTimeout(() => showAchievement(next), 300)
  }
}

function dismiss() {
  if (currentAchievement.value) {
    emit('dismiss', currentAchievement.value)
    hide()
  }
}

function playAchievementSound() {
  try {
    const audio = new Audio('/assets/sounds/achievement.mp3')
    audio.volume = 0.5
    audio.play().catch(() => {
      // Ignore errors if sound can't play
    })
  } catch {
    // Ignore if Audio is not supported
  }
}

// Expose queue for testing
defineExpose({
  achievementQueue
})

// Cleanup
onMounted(() => {
  return () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout)
    }
  }
})
</script>

<style scoped>
.achievement-notification {
  position: fixed;
  z-index: 1000;
  max-width: 400px;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  pointer-events: auto;
}

/* Position variants */
.achievement-notification--top-right {
  top: 1rem;
  right: 1rem;
}

.achievement-notification--top-center {
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.achievement-notification--bottom-center {
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

/* Rarity variants */
.achievement-notification--common {
  border: 2px solid #d1d5db;
}

.achievement-notification--rare {
  border: 2px solid #3b82f6;
}

.achievement-notification--epic {
  border: 2px solid #9333ea;
  background: linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%);
}

.achievement-notification--legendary {
  border: 2px solid #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  animation: legendary-glow 2s ease-in-out infinite;
}

@keyframes legendary-glow {
  0%, 100% { box-shadow: 0 20px 25px -5px rgba(245, 158, 11, 0.3), 0 10px 10px -5px rgba(245, 158, 11, 0.2); }
  50% { box-shadow: 0 20px 25px -5px rgba(245, 158, 11, 0.5), 0 10px 10px -5px rgba(245, 158, 11, 0.3); }
}

/* Content */
.achievement-notification__content {
  padding: 1rem;
}

.achievement-notification__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.achievement-notification__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #059669;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.achievement-notification__close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.achievement-notification__close:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Body */
.achievement-notification__body {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.achievement-notification__icon {
  font-size: 2.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.achievement-notification__info {
  flex: 1;
  min-width: 0;
}

.achievement-notification__name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.achievement-notification__description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.achievement-notification__progress {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

/* Confetti */
.achievement-notification__confetti {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.achievement-notification__confetti::before,
.achievement-notification__confetti::after {
  content: '🎉';
  position: absolute;
  font-size: 2rem;
  animation: confetti-fall 3s ease-out forwards;
}

.achievement-notification__confetti::before {
  left: 20%;
  animation-delay: 0s;
}

.achievement-notification__confetti::after {
  right: 20%;
  animation-delay: 0.5s;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-100%) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(200%) rotate(720deg);
    opacity: 0;
  }
}

/* Transition */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.achievement-notification--top-center.notification-enter-from,
.achievement-notification--bottom-center.notification-enter-from {
  transform: translateX(-50%) translateY(-20px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.achievement-notification--top-center.notification-leave-to,
.achievement-notification--bottom-center.notification-leave-to {
  transform: translateX(-50%) translateY(-20px);
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .achievement-notification {
    max-width: calc(100vw - 2rem);
  }
  
  .achievement-notification--top-right {
    right: 1rem;
    left: 1rem;
  }
}
</style>