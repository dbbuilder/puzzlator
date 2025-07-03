<template>
  <div class="min-h-[calc(100vh-8rem)] py-8 px-4">
    <div class="container mx-auto max-w-4xl">
      <h1 class="text-3xl font-bold text-game-text mb-8">My Profile</h1>
      
      <div class="grid md:grid-cols-3 gap-8">
        <!-- Profile Card -->
        <div class="md:col-span-1">
          <div class="bg-game-surface rounded-xl p-6 shadow-xl">
            <div class="text-center">
              <img 
                :src="authStore.profile?.avatar_url || '/assets/images/default-avatar.png'"
                :alt="authStore.displayName"
                class="w-32 h-32 rounded-full mx-auto mb-4"
              >
              <h2 class="text-xl font-semibold text-game-text mb-1">
                {{ authStore.displayName }}
              </h2>
              <p class="text-game-muted mb-4">@{{ authStore.username }}</p>
              
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-game-muted">Level</span>
                  <span class="font-semibold text-game-accent">{{ userLevel }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-game-muted">Experience</span>
                  <span class="font-semibold">{{ authStore.profile?.total_experience || 0 }} XP</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-game-muted">Joined</span>
                  <span class="font-semibold">{{ joinedDate }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Stats & Settings -->
        <div class="md:col-span-2 space-y-8">
          <!-- Stats -->
          <div class="bg-game-surface rounded-xl p-6 shadow-xl">
            <h3 class="text-xl font-semibold text-game-text mb-4">Statistics</h3>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center">
                <div class="text-3xl font-bold text-game-accent">0</div>
                <div class="text-sm text-game-muted">Puzzles Solved</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-game-accent">0%</div>
                <div class="text-sm text-game-muted">Success Rate</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-game-accent">0</div>
                <div class="text-sm text-game-muted">Day Streak</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-game-accent">--</div>
                <div class="text-sm text-game-muted">Avg. Time</div>
              </div>
            </div>
          </div>
          
          <!-- Settings -->
          <div class="bg-game-surface rounded-xl p-6 shadow-xl">
            <h3 class="text-xl font-semibold text-game-text mb-4">Settings</h3>
            
            <form @submit.prevent="saveSettings" class="space-y-4">
              <!-- Display Name -->
              <div>
                <label for="displayName" class="block text-sm font-medium text-game-text mb-1">
                  Display Name
                </label>
                <input 
                  id="displayName"
                  v-model="displayName"
                  type="text"
                  class="input-field"
                  placeholder="How should we call you?"
                >
              </div>
              
              <!-- Preferred Difficulty -->
              <div>
                <label for="difficulty" class="block text-sm font-medium text-game-text mb-1">
                  Preferred Difficulty
                </label>
                <select 
                  id="difficulty"
                  v-model="preferredDifficulty"
                  class="input-field"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              <!-- Theme -->
              <div>
                <label for="theme" class="block text-sm font-medium text-game-text mb-1">
                  Theme
                </label>
                <select 
                  id="theme"
                  v-model="theme"
                  @change="updateTheme"
                  class="input-field"
                >
                  <option value="system">System Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              
              <!-- Sound Settings -->
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <input 
                    v-model="soundEnabled"
                    type="checkbox"
                    class="checkbox"
                  >
                  <span class="text-sm text-game-text">Sound Effects</span>
                </label>
                
                <label class="flex items-center gap-2">
                  <input 
                    v-model="musicEnabled"
                    type="checkbox"
                    class="checkbox"
                  >
                  <span class="text-sm text-game-text">Background Music</span>
                </label>
                
                <label class="flex items-center gap-2">
                  <input 
                    v-model="animationsEnabled"
                    type="checkbox"
                    class="checkbox"
                  >
                  <span class="text-sm text-game-text">Animations</span>
                </label>
              </div>
              
              <!-- Save Button -->
              <div class="pt-4">
                <button 
                  type="submit"
                  :disabled="authStore.loading"
                  class="btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
          
          <!-- Danger Zone -->
          <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-6">
            <h3 class="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
              Danger Zone
            </h3>
            <p class="text-sm text-game-muted mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button 
              @click="confirmDeleteAccount"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const authStore = useAuthStore()
const appStore = useAppStore()

// Form data
const displayName = ref('')
const preferredDifficulty = ref('medium')
const theme = ref('system')
const soundEnabled = ref(true)
const musicEnabled = ref(true)
const animationsEnabled = ref(true)

// Computed
const userLevel = computed(() => {
  const exp = authStore.profile?.total_experience || 0
  return Math.floor(exp / 1000) + 1
})

const joinedDate = computed(() => {
  if (!authStore.profile?.created_at) return 'Unknown'
  const date = new Date(authStore.profile.created_at)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
})

// Methods
async function saveSettings() {
  // Update profile
  const profileUpdates = {
    display_name: displayName.value,
    preferred_difficulty: preferredDifficulty.value
  }
  
  await authStore.updateProfile(profileUpdates)
  
  // Update app settings
  appStore.updateSettings({
    theme: theme.value as any,
    soundEnabled: soundEnabled.value,
    musicEnabled: musicEnabled.value,
    animationsEnabled: animationsEnabled.value,
    difficulty: preferredDifficulty.value as any
  })
}

function updateTheme() {
  appStore.updateSettings({ theme: theme.value as any })
}

function confirmDeleteAccount() {
  if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
    appStore.showInfo('Account deletion coming soon. Contact support for now.')
  }
}

// Lifecycle
onMounted(() => {
  // Load current values
  displayName.value = authStore.profile?.display_name || ''
  preferredDifficulty.value = authStore.profile?.preferred_difficulty || 'medium'
  theme.value = appStore.settings.theme
  soundEnabled.value = appStore.settings.soundEnabled
  musicEnabled.value = appStore.settings.musicEnabled
  animationsEnabled.value = appStore.settings.animationsEnabled
})
</script>

<style scoped>
.input-field {
  @apply w-full px-3 py-2 bg-game-background border border-game-border rounded-lg 
         text-game-text placeholder-game-muted
         focus:border-game-accent focus:outline-none focus:ring-2 focus:ring-game-accent/20
         transition-colors;
}

.checkbox {
  @apply w-4 h-4 text-game-accent bg-game-background border-game-border rounded 
         focus:ring-game-accent focus:ring-2;
}

.btn-primary {
  @apply px-4 py-2 bg-game-accent text-white rounded-lg hover:bg-game-accent-hover 
         transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>