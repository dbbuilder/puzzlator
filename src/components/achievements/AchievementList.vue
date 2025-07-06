<template>
  <div :class="['achievement-list', `achievement-list--${layout}`]">
    <!-- Header with stats and controls -->
    <div v-if="showStats || searchable" class="achievement-list__header">
      <!-- Stats -->
      <div v-if="showStats" class="achievement-list__stats">
        <span class="achievement-list__stats-count">
          {{ unlockedCount }} / {{ achievements.length }}
        </span>
        <span class="achievement-list__stats-percentage">
          ({{ unlockedPercentage }}%)
        </span>
      </div>
      
      <!-- Search -->
      <div v-if="searchable" class="achievement-list__search">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search achievements..."
          class="achievement-list__search-input"
        >
      </div>
    </div>
    
    <!-- Empty state -->
    <div v-if="filteredAchievements.length === 0" class="achievement-list__empty">
      <span class="achievement-list__empty-icon">🏆</span>
      <p class="achievement-list__empty-text">No achievements yet</p>
    </div>
    
    <!-- Achievement grid/list -->
    <div v-else class="achievement-list__content">
      <!-- Grouped by category -->
      <template v-if="groupByCategory">
        <div
          v-for="category in achievementsByCategory"
          :key="category.name"
          :data-category="category.name"
          class="achievement-list__category"
        >
          <h3 class="achievement-list__category-title">
            {{ formatCategoryName(category.name) }}
          </h3>
          <div class="achievement-list__items">
            <AchievementBadge
              v-for="achievement in category.achievements"
              :key="achievement.id"
              :achievement="achievement"
              :size="badgeSize"
              @click="handleAchievementClick"
            />
          </div>
        </div>
      </template>
      
      <!-- Flat list -->
      <div v-else class="achievement-list__items">
        <AchievementBadge
          v-for="achievement in sortedAchievements"
          :key="achievement.id"
          :achievement="achievement"
          :size="badgeSize"
          @click="handleAchievementClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AchievementBadge from './AchievementBadge.vue'
import type { Achievement } from '@/types/achievements'

interface Props {
  achievements: Achievement[]
  layout?: 'grid' | 'list'
  filter?: 'all' | 'unlocked' | 'locked'
  sortBy?: 'name' | 'unlock-date' | 'rarity' | 'progress'
  groupByCategory?: boolean
  showStats?: boolean
  searchable?: boolean
  badgeSize?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'grid',
  filter: 'all',
  sortBy: 'name',
  groupByCategory: false,
  showStats: false,
  searchable: false,
  badgeSize: 'medium'
})

const emit = defineEmits<{
  'achievement-click': [achievement: Achievement]
}>()

// State
const searchQuery = ref('')

// Computed
const unlockedCount = computed(() => 
  props.achievements.filter(a => a.unlockedAt !== null).length
)

const unlockedPercentage = computed(() => {
  if (props.achievements.length === 0) return 0
  return Math.round((unlockedCount.value / props.achievements.length) * 100)
})

const filteredAchievements = computed(() => {
  let filtered = [...props.achievements]
  
  // Apply filter
  if (props.filter === 'unlocked') {
    filtered = filtered.filter(a => a.unlockedAt !== null)
  } else if (props.filter === 'locked') {
    filtered = filtered.filter(a => a.unlockedAt === null)
  }
  
  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(a => 
      a.name.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

const sortedAchievements = computed(() => {
  const achievements = [...filteredAchievements.value]
  
  switch (props.sortBy) {
    case 'unlock-date':
      return achievements.sort((a, b) => {
        // Unlocked achievements first, sorted by date
        if (a.unlockedAt && b.unlockedAt) {
          return b.unlockedAt.getTime() - a.unlockedAt.getTime()
        }
        if (a.unlockedAt) return -1
        if (b.unlockedAt) return 1
        return 0
      })
      
    case 'rarity':
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
      return achievements.sort((a, b) => 
        rarityOrder[a.rarity] - rarityOrder[b.rarity]
      )
      
    case 'progress':
      return achievements.sort((a, b) => {
        const aProgress = a.progress / a.maxProgress
        const bProgress = b.progress / b.maxProgress
        return bProgress - aProgress
      })
      
    case 'name':
    default:
      return achievements.sort((a, b) => 
        a.name.localeCompare(b.name)
      )
  }
})

const achievementsByCategory = computed(() => {
  if (!props.groupByCategory) return []
  
  const categories = new Map<string, Achievement[]>()
  
  sortedAchievements.value.forEach(achievement => {
    const category = achievement.category
    if (!categories.has(category)) {
      categories.set(category, [])
    }
    categories.get(category)!.push(achievement)
  })
  
  return Array.from(categories.entries()).map(([name, achievements]) => ({
    name,
    achievements
  }))
})

// Methods
function handleAchievementClick(achievement: Achievement) {
  emit('achievement-click', achievement)
}

function formatCategoryName(category: string): string {
  return category
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<style scoped>
.achievement-list {
  width: 100%;
}

/* Header */
.achievement-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.achievement-list__stats {
  font-size: 1rem;
  color: #374151;
}

.achievement-list__stats-count {
  font-weight: 600;
}

.achievement-list__stats-percentage {
  color: #6b7280;
  margin-left: 0.5rem;
}

/* Search */
.achievement-list__search {
  flex: 1;
  max-width: 300px;
}

.achievement-list__search-input {
  width: 100%;
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.achievement-list__search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Empty state */
.achievement-list__empty {
  text-align: center;
  padding: 3rem 1rem;
}

.achievement-list__empty-icon {
  font-size: 3rem;
  opacity: 0.5;
  display: block;
  margin-bottom: 1rem;
}

.achievement-list__empty-text {
  color: #6b7280;
  font-size: 1rem;
}

/* Content layouts */
.achievement-list__content {
  width: 100%;
}

/* Grid layout */
.achievement-list--grid .achievement-list__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
}

/* List layout */
.achievement-list--list .achievement-list__items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.achievement-list--list .achievement-badge {
  width: 100%;
  height: auto;
  padding: 1rem;
}

.achievement-list--list .achievement-badge__content {
  flex-direction: row;
  justify-content: flex-start;
  text-align: left;
  gap: 1rem;
}

/* Category grouping */
.achievement-list__category {
  margin-bottom: 2rem;
}

.achievement-list__category:last-child {
  margin-bottom: 0;
}

.achievement-list__category-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

/* Responsive */
@media (max-width: 640px) {
  .achievement-list__header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .achievement-list__search {
    max-width: none;
  }
  
  .achievement-list--grid .achievement-list__items {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}
</style>