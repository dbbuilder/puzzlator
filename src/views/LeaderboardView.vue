<template>
  <div class="min-h-[calc(100vh-8rem)] py-8 px-4">
    <div class="container mx-auto max-w-4xl">
      <h1 class="text-3xl font-bold text-game-text mb-8">Leaderboard</h1>
      
      <!-- Filters -->
      <div class="bg-game-surface rounded-xl p-4 mb-6 shadow-xl">
        <div class="flex flex-wrap gap-4">
          <select 
            v-model="selectedPuzzleType"
            class="select-field"
          >
            <option value="all">All Puzzles</option>
            <option value="logic">Logic Puzzles</option>
            <option value="pattern">Pattern Recognition</option>
            <option value="spatial">Spatial Puzzles</option>
          </select>
          
          <select 
            v-model="selectedTimeframe"
            class="select-field"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
            <option value="today">Today</option>
          </select>
          
          <select 
            v-model="selectedMetric"
            class="select-field"
          >
            <option value="score">High Score</option>
            <option value="speed">Fastest Time</option>
            <option value="streak">Longest Streak</option>
            <option value="solved">Most Solved</option>
          </select>
        </div>
      </div>
      
      <!-- Leaderboard Table -->
      <div class="bg-game-surface rounded-xl shadow-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-game-muted/10 border-b border-game-border">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-medium text-game-muted uppercase tracking-wider">
                  Rank
                </th>
                <th class="px-6 py-4 text-left text-sm font-medium text-game-muted uppercase tracking-wider">
                  Player
                </th>
                <th class="px-6 py-4 text-left text-sm font-medium text-game-muted uppercase tracking-wider">
                  Level
                </th>
                <th class="px-6 py-4 text-right text-sm font-medium text-game-muted uppercase tracking-wider">
                  {{ metricLabel }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-game-border">
              <tr 
                v-for="(player, index) in leaderboardData" 
                :key="player.id"
                :class="{ 'bg-game-accent/5': player.id === authStore.userId }"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span 
                      class="text-lg font-bold"
                      :class="getRankClass(index + 1)"
                    >
                      {{ index + 1 }}
                    </span>
                    <svg 
                      v-if="index < 3"
                      class="w-5 h-5 ml-2"
                      :class="getRankIconClass(index + 1)"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <img 
                      :src="player.avatar_url"
                      :alt="player.display_name"
                      class="w-10 h-10 rounded-full mr-3"
                    >
                    <div>
                      <div class="text-sm font-medium text-game-text">
                        {{ player.display_name }}
                      </div>
                      <div class="text-sm text-game-muted">
                        @{{ player.username }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-game-text">{{ player.level }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <div class="text-lg font-semibold text-game-accent">
                    {{ formatMetricValue(player.value) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Empty State -->
        <div v-if="leaderboardData.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 text-game-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
          </svg>
          <p class="text-game-muted">No leaderboard data yet. Be the first to play!</p>
        </div>
      </div>
      
      <!-- Your Position -->
      <div v-if="authStore.isAuthenticated && userRank > 10" class="mt-6 bg-game-surface rounded-xl p-6 shadow-xl">
        <h3 class="text-lg font-semibold text-game-text mb-2">Your Position</h3>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span class="text-2xl font-bold text-game-accent">#{{ userRank }}</span>
            <div>
              <div class="text-sm font-medium text-game-text">{{ authStore.displayName }}</div>
              <div class="text-sm text-game-muted">Keep playing to climb the ranks!</div>
            </div>
          </div>
          <div class="text-lg font-semibold text-game-accent">
            {{ formatMetricValue(userScore) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Filters
const selectedPuzzleType = ref('all')
const selectedTimeframe = ref('all')
const selectedMetric = ref('score')

// Mock data (replace with real API calls)
const leaderboardData = ref([
  {
    id: '1',
    username: 'puzzlemaster',
    display_name: 'Puzzle Master',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=puzzlemaster',
    level: 42,
    value: 999999
  },
  {
    id: '2',
    username: 'speedrunner',
    display_name: 'Speed Runner',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=speedrunner',
    level: 38,
    value: 888888
  },
  {
    id: '3',
    username: 'strategist',
    display_name: 'The Strategist',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=strategist',
    level: 35,
    value: 777777
  }
])

// Computed
const metricLabel = computed(() => {
  switch (selectedMetric.value) {
    case 'score': return 'Score'
    case 'speed': return 'Best Time'
    case 'streak': return 'Streak'
    case 'solved': return 'Solved'
    default: return 'Score'
  }
})

const userRank = computed(() => {
  // Mock user rank
  return authStore.isAuthenticated ? 25 : 0
})

const userScore = computed(() => {
  // Mock user score
  return 123456
})

// Methods
function getRankClass(rank: number) {
  switch (rank) {
    case 1: return 'text-yellow-500'
    case 2: return 'text-gray-400'
    case 3: return 'text-orange-600'
    default: return 'text-game-text'
  }
}

function getRankIconClass(rank: number) {
  switch (rank) {
    case 1: return 'text-yellow-500'
    case 2: return 'text-gray-400'
    case 3: return 'text-orange-600'
    default: return ''
  }
}

function formatMetricValue(value: number) {
  switch (selectedMetric.value) {
    case 'speed':
      const minutes = Math.floor(value / 60)
      const seconds = value % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    case 'streak':
      return `${value} days`
    case 'solved':
      return value.toLocaleString()
    default:
      return value.toLocaleString()
  }
}
</script>

<style scoped>
.select-field {
  @apply px-4 py-2 bg-game-background border border-game-border rounded-lg 
         text-game-text focus:border-game-accent focus:outline-none 
         focus:ring-2 focus:ring-game-accent/20 transition-colors;
}
</style>