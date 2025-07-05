<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">AI Puzzle Game</h1>
        <p class="text-gray-600">Enter your username to start playing</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            placeholder="Enter your username"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            :disabled="isLoading"
          />
        </div>

        <button
          type="submit"
          :disabled="!username || isLoading"
          :class="[
            'w-full py-3 rounded-lg font-semibold text-white transition-all',
            username && !isLoading
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-gray-400 cursor-not-allowed'
          ]"
        >
          <span v-if="!isLoading">Start Playing</span>
          <span v-else class="flex items-center justify-center">
            <Loader2 class="w-5 h-5 animate-spin mr-2" />
            Loading...
          </span>
        </button>
      </form>

      <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        {{ error }}
      </div>

      <div class="mt-8 pt-6 border-t border-gray-200">
        <p class="text-center text-sm text-gray-600">
          For testing, use username: <code class="bg-gray-100 px-2 py-1 rounded">testuser</code>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const isLoading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!username.value || isLoading.value) return

  isLoading.value = true
  error.value = ''

  try {
    const success = await userStore.login(username.value)
    if (success) {
      router.push('/play')
    } else {
      error.value = 'Failed to login. Please try again.'
    }
  } catch (err) {
    error.value = 'An error occurred. Please try again.'
    console.error('Login error:', err)
  } finally {
    isLoading.value = false
  }
}
</script>