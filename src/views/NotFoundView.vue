<template>
  <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
    <div class="text-center">
      <div class="mb-8">
        <span class="text-9xl font-bold text-game-accent opacity-50">404</span>
      </div>
      
      <h1 class="text-3xl font-bold text-game-text mb-4">
        Puzzle Not Found
      </h1>
      
      <p class="text-lg text-game-muted mb-8 max-w-md mx-auto">
        Looks like this piece doesn't fit! The page you're looking for has wandered off into the puzzle void.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <RouterLink 
          to="/"
          class="btn-primary"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          Go Home
        </RouterLink>
        
        <button 
          @click="goBack"
          class="btn-secondary"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Go Back
        </button>
      </div>
      
      <!-- Fun animation -->
      <div class="mt-12">
        <div class="inline-block animate-bounce">
          <svg class="w-16 h-16 text-game-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  router.back()
}
</script>

<style scoped>
.btn-primary {
  @apply px-6 py-3 bg-game-accent text-white rounded-lg hover:bg-game-accent-hover 
         transition-colors font-medium inline-flex items-center justify-center;
}

.btn-secondary {
  @apply px-6 py-3 bg-game-surface text-game-text border border-game-border rounded-lg 
         hover:bg-game-muted/10 transition-colors font-medium inline-flex items-center justify-center;
}
</style>