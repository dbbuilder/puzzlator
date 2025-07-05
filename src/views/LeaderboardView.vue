<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold text-gray-800 mb-8 text-center">Leaderboard</h1>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Puzzle Type</label>
            <select
              v-model="selectedType"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Types</option>
              <option value="sudoku4x4">Sudoku 4x4</option>
              <option value="logic">Logic</option>
              <option value="spatial">Spatial</option>
              <option value="pattern">Pattern</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              v-model="selectedDifficulty"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              v-model="selectedPeriod"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all_time">All Time</option>
              <option value="monthly">This Month</option>
              <option value="weekly">This Week</option>
              <option value="daily">Today</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              @click="loadLeaderboard"
              class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Leaderboard Table -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <table class="w-full">
          <thead class="bg-purple-600 text-white">
            <tr>
              <th class="px-6 py-3 text-left">Rank</th>
              <th class="px-6 py-3 text-left">Player</th>
              <th class="px-6 py-3 text-center">Score</th>
              <th class="px-6 py-3 text-center">Time</th>
              <th class="px-6 py-3 text-center">Hints</th>
              <th class="px-6 py-3 text-center">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(entry, index) in leaderboardEntries"
              :key="entry.id"
              :class="[
                'border-t',
                index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-100' : index === 2 ? 'bg-orange-50' : ''
              ]"
            >
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <span v-if="index === 0" class="text-2xl mr-2">🥇</span>
                  <span v-else-if="index === 1" class="text-2xl mr-2">🥈</span>
                  <span v-else-if="index === 2" class="text-2xl mr-2">🥉</span>
                  <span v-else class="text-lg font-semibold">{{ index + 1 }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {{ entry.display_name?.charAt(0).toUpperCase() || 'U' }}
                  </div>
                  <div>
                    <p class="font-semibold">{{ entry.display_name || entry.username }}</p>
                    <p class="text-sm text-gray-600">@{{ entry.username }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-lg font-bold text-purple-600">{{ entry.score.toLocaleString() }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                {{ formatTime(entry.time_elapsed) }}
              </td>
              <td class="px-6 py-4 text-center">
                {{ entry.hints_used }}
              </td>
              <td class="px-6 py-4 text-center text-sm text-gray-600">
                {{ new Date(entry.achieved_at).toLocaleDateString() }}
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="leaderboardEntries.length === 0" class="text-center py-8 text-gray-600">
          No entries found for the selected filters.
        </div>
      </div>

      <!-- Back Button -->
      <div class="mt-8 text-center">
        <button
          @click="$router.push('/play')"
          class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Back to Games
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'

const selectedType = ref('')
const selectedDifficulty = ref('')
const selectedPeriod = ref('all_time')
const leaderboardEntries = ref<any[]>([])

onMounted(() => {
  loadLeaderboard()
})

async function loadLeaderboard() {
  try {
    const filters: any = {
      period_type: selectedPeriod.value,
      limit: 50
    }
    
    if (selectedType.value) filters.puzzle_type = selectedType.value
    if (selectedDifficulty.value) filters.difficulty = selectedDifficulty.value
    
    leaderboardEntries.value = await api.getLeaderboard(filters)
  } catch (error) {
    console.error('Failed to load leaderboard:', error)
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
</script>