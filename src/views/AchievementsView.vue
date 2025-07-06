<template>
  <div class="achievements-view">
    <div class="container">
      <!-- Header -->
      <header class="achievements-header">
        <h1 class="achievements-title">Achievements</h1>
        <p class="achievements-subtitle">
          Track your progress and unlock rewards
        </p>
      </header>

      <!-- Progress Overview -->
      <div class="achievements-progress">
        <div class="progress-card">
          <div class="progress-stats">
            <span class="progress-label">Total Progress</span>
            <span class="progress-value">
              {{ achievementsStore.achievementProgress.unlocked }} / {{ achievementsStore.achievementProgress.total }}
            </span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill"
              :style="{ width: achievementsStore.achievementProgress.percentage + '%' }"
            />
          </div>
          <span class="progress-percentage">
            {{ achievementsStore.achievementProgress.percentage }}% Complete
          </span>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="achievements-controls">
        <div class="filter-tabs">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            :class="['filter-tab', { active: activeFilter === tab.value }]"
            @click="activeFilter = tab.value"
          >
            {{ tab.label }}
            <span class="filter-count">{{ tab.count }}</span>
          </button>
        </div>

        <div class="sort-dropdown">
          <label for="sort-select" class="sr-only">Sort by</label>
          <select
            id="sort-select"
            v-model="sortBy"
            class="sort-select"
          >
            <option value="name">Name</option>
            <option value="unlock-date">Unlock Date</option>
            <option value="rarity">Rarity</option>
            <option value="progress">Progress</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="achievementsStore.isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading achievements...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="achievementsStore.error" class="error-state">
        <p>{{ achievementsStore.error }}</p>
        <button @click="achievementsStore.loadAchievements()" class="retry-button">
          Retry
        </button>
      </div>

      <!-- Achievements List -->
      <AchievementList
        v-else
        :achievements="filteredAchievements"
        :filter="activeFilter"
        :sort-by="sortBy"
        :group-by-category="groupByCategory"
        :show-stats="false"
        :searchable="true"
        layout="grid"
        @achievement-click="showAchievementDetails"
      />
    </div>

    <!-- Achievement Details Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="selectedAchievement"
          class="modal-overlay"
          @click="selectedAchievement = null"
        >
          <div class="modal-content" @click.stop>
            <button
              class="modal-close"
              @click="selectedAchievement = null"
              aria-label="Close"
            >
              ×
            </button>

            <div class="achievement-details">
              <div class="achievement-details-header">
                <div class="achievement-details-icon">
                  {{ selectedAchievement.icon }}
                </div>
                <h2 class="achievement-details-name">
                  {{ selectedAchievement.name }}
                </h2>
                <div :class="['achievement-details-rarity', `rarity-${selectedAchievement.rarity}`]">
                  {{ selectedAchievement.rarity }}
                </div>
              </div>

              <p class="achievement-details-description">
                {{ selectedAchievement.description }}
              </p>

              <div v-if="selectedAchievement.unlockedAt" class="achievement-details-unlocked">
                <span class="unlock-icon">🎉</span>
                Unlocked {{ formatDate(selectedAchievement.unlockedAt) }}
              </div>

              <div v-else-if="selectedAchievement.maxProgress > 1" class="achievement-details-progress">
                <div class="progress-info">
                  <span>Progress</span>
                  <span>{{ selectedAchievement.progress }} / {{ selectedAchievement.maxProgress }}</span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill"
                    :style="{ width: (selectedAchievement.progress / selectedAchievement.maxProgress * 100) + '%' }"
                  />
                </div>
              </div>

              <div v-if="selectedAchievement.points" class="achievement-details-points">
                <span class="points-icon">⭐</span>
                {{ selectedAchievement.points }} points
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAchievementsStore } from '@/stores/achievements'
import AchievementList from '@/components/achievements/AchievementList.vue'
import type { Achievement } from '@/types/achievements'

// Store
const achievementsStore = useAchievementsStore()

// State
const activeFilter = ref<'all' | 'unlocked' | 'locked'>('all')
const sortBy = ref<'name' | 'unlock-date' | 'rarity' | 'progress'>('name')
const groupByCategory = ref(false)
const selectedAchievement = ref<Achievement | null>(null)

// Computed
const filterTabs = computed(() => [
  {
    value: 'all' as const,
    label: 'All',
    count: achievementsStore.achievements.length
  },
  {
    value: 'unlocked' as const,
    label: 'Unlocked',
    count: achievementsStore.unlockedAchievements.length
  },
  {
    value: 'locked' as const,
    label: 'Locked',
    count: achievementsStore.lockedAchievements.length
  }
])

const filteredAchievements = computed(() => {
  // Convert userAchievements map to array with merged data
  const allAchievements = achievementsStore.achievements.map(achievement => {
    const userAchievement = achievementsStore.userAchievements.get(achievement.id)
    return userAchievement || achievement
  })

  switch (activeFilter.value) {
    case 'unlocked':
      return allAchievements.filter(a => a.unlockedAt !== null)
    case 'locked':
      return allAchievements.filter(a => a.unlockedAt === null)
    default:
      return allAchievements
  }
})

// Methods
function showAchievementDetails(achievement: Achievement) {
  selectedAchievement.value = achievement
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)
}
</script>

<style scoped>
.achievements-view {
  min-height: 100vh;
  background: #f9fafb;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Header */
.achievements-header {
  text-align: center;
  margin-bottom: 3rem;
}

.achievements-title {
  font-size: 3rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.achievements-subtitle {
  font-size: 1.25rem;
  color: #6b7280;
}

/* Progress Overview */
.achievements-progress {
  margin-bottom: 3rem;
}

.progress-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.progress-label {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

.progress-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.progress-bar {
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #6366f1 100%);
  transition: width 0.5s ease;
}

.progress-percentage {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Controls */
.achievements-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
}

.filter-tab {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab:hover {
  background: #f9fafb;
}

.filter-tab.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.filter-count {
  margin-left: 0.25rem;
  opacity: 0.8;
}

.sort-select {
  padding: 0.5rem 2rem 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: white;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.25rem;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem 0;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 4rem 0;
  color: #ef4444;
}

.retry-button {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #2563eb;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Achievement Details */
.achievement-details-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.achievement-details-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.achievement-details-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.achievement-details-rarity {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.rarity-common {
  background: #f3f4f6;
  color: #6b7280;
}

.rarity-rare {
  background: #dbeafe;
  color: #2563eb;
}

.rarity-epic {
  background: #e9d5ff;
  color: #7c3aed;
}

.rarity-legendary {
  background: #fef3c7;
  color: #d97706;
}

.achievement-details-description {
  font-size: 1rem;
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.achievement-details-unlocked {
  background: #d1fae5;
  color: #065f46;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.achievement-details-progress {
  margin-bottom: 1.5rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.achievement-details-points {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #f59e0b;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content {
  transform: scale(0.9);
}

.modal-leave-to .modal-content {
  transform: scale(0.9);
}

/* Responsive */
@media (max-width: 640px) {
  .achievements-title {
    font-size: 2rem;
  }
  
  .achievements-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-tabs {
    justify-content: center;
  }
  
  .sort-select {
    width: 100%;
  }
}</style>