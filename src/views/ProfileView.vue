<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold text-gray-800 mb-8">User Profile</h1>
      
      <div v-if="userStore.userProfile" class="bg-white rounded-lg shadow-lg p-8">
        <div class="flex items-center space-x-6 mb-8">
          <div class="w-24 h-24 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-4xl font-bold">
            {{ userStore.displayName.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h2 class="text-3xl font-semibold">{{ userStore.displayName }}</h2>
            <p class="text-gray-600">@{{ userStore.userProfile.username }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div class="text-center p-4 bg-purple-50 rounded-lg">
            <p class="text-3xl font-bold text-purple-600">{{ userStore.userProfile.total_score.toLocaleString() }}</p>
            <p class="text-sm text-gray-600">Total Score</p>
          </div>
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <p class="text-3xl font-bold text-blue-600">{{ userStore.userProfile.puzzles_completed }}</p>
            <p class="text-sm text-gray-600">Puzzles Completed</p>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <p class="text-3xl font-bold text-green-600">{{ userStore.completionRate }}%</p>
            <p class="text-sm text-gray-600">Completion Rate</p>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded-lg">
            <p class="text-3xl font-bold text-yellow-600">{{ formatTime(userStore.userProfile.total_play_time) }}</p>
            <p class="text-sm text-gray-600">Play Time</p>
          </div>
        </div>

        <div class="mb-8">
          <h3 class="text-xl font-semibold mb-4">Achievements</h3>
          <div v-if="userStore.achievements.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div
              v-for="achievement in userStore.achievements"
              :key="achievement.id"
              class="p-4 bg-gray-50 rounded-lg"
            >
              <h4 class="font-semibold">{{ achievement.name }}</h4>
              <p class="text-sm text-gray-600">{{ achievement.description }}</p>
              <p class="text-xs text-gray-500 mt-1">
                Earned: {{ new Date(achievement.earned_at).toLocaleDateString() }}
              </p>
            </div>
          </div>
          <p v-else class="text-gray-600">No achievements yet. Keep playing to earn some!</p>
        </div>

        <div class="flex justify-between">
          <button
            @click="$router.push('/play')"
            class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Games
          </button>
          <button
            @click="userStore.logout(); $router.push('/login')"
            class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div v-else class="text-center">
        <p class="text-gray-600">Loading profile...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  userStore.loadProfile()
  userStore.loadAchievements()
})

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
</script>