<template>
  <div
    :class="[
      'achievement-badge',
      `achievement-badge--${size}`,
      `achievement-badge--${achievement.rarity}`,
      {
        'achievement-badge--unlocked': isUnlocked,
        'achievement-badge--locked': !isUnlocked
      }
    ]"
    @click="handleClick"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <!-- Badge Content -->
    <div class="achievement-badge__content">
      <!-- Icon -->
      <div class="achievement-badge__icon">
        <span class="achievement-badge__icon-emoji">{{ achievement.icon }}</span>
        <span v-if="!isUnlocked" class="achievement-badge__lock-icon">🔒</span>
      </div>
      
      <!-- Name -->
      <div class="achievement-badge__name">{{ achievement.name }}</div>
      
      <!-- Progress Bar (for progressive achievements) -->
      <div
        v-if="isProgressive && !isUnlocked"
        class="achievement-badge__progress"
      >
        <div class="achievement-badge__progress-bar">
          <div
            class="achievement-badge__progress-fill"
            :style="{ width: progressPercentage + '%' }"
          />
        </div>
        <span class="achievement-badge__progress-text">
          {{ achievement.progress }}/{{ achievement.maxProgress }}
        </span>
      </div>
      
      <!-- Unlock Date -->
      <div
        v-if="isUnlocked && achievement.unlockedAt"
        class="achievement-badge__unlock-date"
      >
        Unlocked {{ formatUnlockDate(achievement.unlockedAt) }}
      </div>
    </div>
    
    <!-- Tooltip -->
    <Transition name="tooltip">
      <div
        v-if="showTooltip"
        class="achievement-badge__tooltip"
      >
        <div class="achievement-badge__tooltip-content">
          {{ achievement.description }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Achievement } from '@/types/achievements'

interface Props {
  achievement: Achievement
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})

const emit = defineEmits<{
  click: [achievement: Achievement]
}>()

// State
const showTooltip = ref(false)

// Computed
const isUnlocked = computed(() => props.achievement.unlockedAt !== null)

const isProgressive = computed(() => 
  props.achievement.maxProgress > 1
)

const progressPercentage = computed(() => {
  if (!isProgressive.value) return 0
  return (props.achievement.progress / props.achievement.maxProgress) * 100
})

// Methods
function handleClick() {
  emit('click', props.achievement)
}

function formatUnlockDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      if (diffMinutes === 0) {
        return 'just now'
      }
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  } else if (diffDays === 1) {
    return 'yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}
</script>

<style scoped>
.achievement-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--badge-bg, #f3f4f6);
  border: 2px solid var(--badge-border, #e5e7eb);
  padding: 0.5rem;
}

/* Size variants */
.achievement-badge--small {
  width: 60px;
  height: 60px;
}

.achievement-badge--medium {
  width: 80px;
  height: 80px;
}

.achievement-badge--large {
  width: 100px;
  height: 100px;
}

/* State variants */
.achievement-badge--locked {
  opacity: 0.6;
  filter: grayscale(100%);
}

.achievement-badge--unlocked {
  opacity: 1;
  filter: none;
}

/* Rarity variants */
.achievement-badge--common {
  --badge-bg: #f3f4f6;
  --badge-border: #d1d5db;
}

.achievement-badge--rare {
  --badge-bg: #dbeafe;
  --badge-border: #3b82f6;
}

.achievement-badge--epic {
  --badge-bg: #e9d5ff;
  --badge-border: #9333ea;
}

.achievement-badge--legendary {
  --badge-bg: #fef3c7;
  --badge-border: #f59e0b;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
}

/* Hover effects */
.achievement-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.achievement-badge--unlocked:hover {
  transform: scale(1.05) translateY(-2px);
}

/* Content layout */
.achievement-badge__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.25rem;
}

.achievement-badge__icon {
  font-size: 1.5rem;
  line-height: 1;
  position: relative;
}

.achievement-badge__icon-emoji {
  display: inline-block;
}

.achievement-badge__lock-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.8;
  font-size: 0.8em;
}

.achievement-badge__name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 0.25rem;
}

/* Progress bar */
.achievement-badge__progress {
  width: 100%;
  margin-top: 0.25rem;
}

.achievement-badge__progress-bar {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.achievement-badge__progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.achievement-badge__progress-text {
  font-size: 0.625rem;
  color: #6b7280;
  display: block;
  text-align: center;
  margin-top: 0.125rem;
}

/* Unlock date */
.achievement-badge__unlock-date {
  font-size: 0.625rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Tooltip */
.achievement-badge__tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  z-index: 10;
}

.achievement-badge__tooltip-content {
  background: #1f2937;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  white-space: nowrap;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.achievement-badge__tooltip-content::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #1f2937;
}

/* Tooltip animation */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}

/* Responsive adjustments for small size */
.achievement-badge--small .achievement-badge__name {
  font-size: 0.625rem;
}

.achievement-badge--small .achievement-badge__icon {
  font-size: 1.25rem;
}

.achievement-badge--small .achievement-badge__progress {
  display: none;
}

.achievement-badge--small .achievement-badge__unlock-date {
  display: none;
}

/* Large size adjustments */
.achievement-badge--large .achievement-badge__name {
  font-size: 0.875rem;
}

.achievement-badge--large .achievement-badge__icon {
  font-size: 2rem;
}
</style>