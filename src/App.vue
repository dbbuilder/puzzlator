<template>
  <div id="app" class="min-h-screen">
    <!-- Loading screen -->
    <div 
      v-if="isLoading" 
      class="fixed inset-0 bg-gray-100 flex items-center justify-center z-50"
    >
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
        <p class="text-gray-700">Loading Puzzlator...</p>
      </div>
    </div>

    <!-- Main app content -->
    <div v-else class="flex flex-col min-h-screen">
      <!-- Navigation -->
      <AppNavigation v-if="showNavigation" />
      
      <!-- Main content area -->
      <main class="flex-1">
        <RouterView />
      </main>
      
      <!-- Footer -->
      <!-- <AppFooter v-if="showNavigation" /> -->
    </div>

    <!-- Global modals and overlays -->
    <!-- <ErrorModal /> -->
    <!-- <AuthModal /> -->
    
    <!-- Achievement Notifications -->
    <AchievementNotification
      :achievement="currentAchievement"
      @hidden="handleAchievementHidden"
      @dismiss="handleAchievementDismiss"
    />
    
    <!-- Tutorial Overlay -->
    <TutorialOverlay
      @tutorial-complete="handleTutorialComplete"
      @tutorial-skip="handleTutorialSkip"
    />
    
    <!-- PWA Install Prompt -->
    <InstallPrompt />
    
    <!-- Version Info -->
    <VersionInfo v-if="showVersionInfo" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAchievementsStore } from '@/stores/achievements'
// import { useAppStore } from '@/stores/app'
import type { Achievement } from '@/types/achievements'

// Import components
import AppNavigation from '@/components/layout/AppNavigation.vue'
import AchievementNotification from '@/components/achievements/AchievementNotification.vue'
import TutorialOverlay from '@/components/tutorial/TutorialOverlay.vue'
import InstallPrompt from '@/components/pwa/InstallPrompt.vue'
import VersionInfo from '@/components/layout/VersionInfo.vue'
// import AppFooter from '@/components/layout/AppFooter.vue'
// import ErrorModal from '@/components/modals/ErrorModal.vue'
// import AuthModal from '@/components/modals/AuthModal.vue'

// Stores
const authStore = useAuthStore()
const achievementsStore = useAchievementsStore()
// const appStore = useAppStore()
const route = useRoute()

// Reactive state
const isLoading = ref(true)
const currentAchievement = ref<Achievement | null>(null)

// Computed properties
const showNavigation = computed(() => {
  // Hide navigation on auth pages and game pages
  const hideOnRoutes = ['/login', '/signup']
  return !hideOnRoutes.some(routePath => route.path.startsWith(routePath))
})

const showVersionInfo = computed(() => {
  // Show version info in development or if user has a special key combination
  return import.meta.env.DEV || window.location.search.includes('version')
})

// Lifecycle
onMounted(async () => {
  try {
    // Initialize auth store
    await authStore.initialize()
    
    // Initialize app settings
    // await appStore.initialize()
    
    // Preload critical resources
    await preloadResources()
    
  } catch (error) {
    console.error('Failed to initialize app:', error)
    // appStore.setError('Failed to initialize application. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
})

// Helper functions
async function preloadResources() {
  // Preload critical game assets
  const criticalAssets = [
    '/assets/images/logo.svg',
  ]
  
  const preloadPromises = criticalAssets.map(asset => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = () => {
        console.log(`Optional image not found: ${asset}`)
        resolve(undefined) // Don't fail on missing images
      }
      img.src = asset
    })
  })
  
  try {
    await Promise.allSettled(preloadPromises)
  } catch (error) {
    console.warn('Some assets failed to preload:', error)
  }
  
  // Preload sounds using the sound utility
  const { preloadSounds } = await import('@/utils/sounds')
  preloadSounds()
}

// Achievement notification handlers
function handleAchievementHidden() {
  currentAchievement.value = null
  checkForNextAchievement()
}

function handleAchievementDismiss() {
  currentAchievement.value = null
  checkForNextAchievement()
}

function checkForNextAchievement() {
  const notification = achievementsStore.getNextNotification()
  if (notification) {
    currentAchievement.value = notification.achievement
  }
}

// Watch for new achievements
let achievementCheckInterval: NodeJS.Timeout | null = null
onMounted(() => {
  // Check for achievements periodically
  achievementCheckInterval = setInterval(() => {
    if (!currentAchievement.value) {
      checkForNextAchievement()
    }
  }, 1000)
})

// Tutorial handlers
function handleTutorialComplete() {
  console.log('Tutorial completed')
  // Could award an achievement for completing tutorial
  achievementsStore.checkAndUnlockAchievements({
    puzzleType: 'tutorial',
    difficulty: 'easy',
    score: 100,
    time: 0,
    moves: 0,
    hints: 0,
    mistakes: 0,
    completed: true
  })
}

function handleTutorialSkip() {
  console.log('Tutorial skipped')
}

// Cleanup
onUnmounted(() => {
  if (achievementCheckInterval) {
    clearInterval(achievementCheckInterval)
  }
})
</script>

<style scoped>
/* App-specific styles */
#app {
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Loading animation */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
</style>
