<template>
  <div id="app" class="min-h-screen bg-game-background text-game-text">
    <!-- Loading screen -->
    <div 
      v-if="isLoading" 
      class="fixed inset-0 bg-game-background flex items-center justify-center z-50"
    >
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-game-accent mb-4"></div>
        <p class="text-game-accent">Loading AI Puzzle Generator...</p>
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
      <AppFooter v-if="showNavigation" />
    </div>

    <!-- Global modals and overlays -->
    <ErrorModal />
    <AuthModal />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

// Import components (these will be created later)
import AppNavigation from '@/components/layout/AppNavigation.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import ErrorModal from '@/components/modals/ErrorModal.vue'
import AuthModal from '@/components/modals/AuthModal.vue'

// Stores
const authStore = useAuthStore()
const appStore = useAppStore()
const route = useRoute()

// Reactive state
const isLoading = ref(true)

// Computed properties
const showNavigation = computed(() => {
  // Hide navigation on auth pages and game pages
  const hideOnRoutes = ['/login', '/signup', '/game']
  return !hideOnRoutes.some(routePath => route.path.startsWith(routePath))
})

// Lifecycle
onMounted(async () => {
  try {
    // Initialize authentication
    await authStore.initialize()
    
    // Initialize app settings
    await appStore.initialize()
    
    // Preload critical resources
    await preloadResources()
    
  } catch (error) {
    console.error('Failed to initialize app:', error)
    appStore.setError('Failed to initialize application. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
})

// Helper functions
async function preloadResources() {
  // Preload critical game assets
  const criticalAssets = [
    '/assets/images/logo.svg',
    '/assets/sounds/success.mp3',
    '/assets/sounds/error.mp3',
  ]
  
  const preloadPromises = criticalAssets.map(asset => {
    return new Promise((resolve, reject) => {
      if (asset.endsWith('.mp3')) {
        const audio = new Audio(asset)
        audio.addEventListener('canplaythrough', resolve)
        audio.addEventListener('error', reject)
        audio.load()
      } else {
        const img = new Image()
        img.onload = resolve
        img.onerror = reject
        img.src = asset
      }
    })
  })
  
  try {
    await Promise.allSettled(preloadPromises)
  } catch (error) {
    console.warn('Some assets failed to preload:', error)
  }
}
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
