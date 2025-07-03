<template>
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="appStore.hasError" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        
        <!-- Modal -->
        <div 
          class="relative bg-game-surface rounded-xl p-6 max-w-md w-full shadow-xl"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-game-text">Error</h3>
            </div>
            
            <button 
              @click="appStore.clearError"
              class="p-1 rounded-lg hover:bg-game-muted/10 transition-colors"
            >
              <svg class="w-5 h-5 text-game-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- Body -->
          <div class="mb-6">
            <p class="text-game-text">{{ appStore.error?.message }}</p>
            <p v-if="appStore.error?.code" class="text-sm text-game-muted mt-2">
              Error code: {{ appStore.error.code }}
            </p>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-3">
            <button 
              @click="handleRetry"
              class="btn-secondary flex-1"
            >
              Try Again
            </button>
            <button 
              @click="appStore.clearError"
              class="btn-primary flex-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useRouter } from 'vue-router'

const appStore = useAppStore()
const router = useRouter()

function handleBackdropClick() {
  appStore.clearError()
}

function handleRetry() {
  appStore.clearError()
  // Reload the current route
  router.go(0)
}
</script>

<style scoped>
.btn-primary {
  @apply px-4 py-2 bg-game-accent text-white rounded-lg hover:bg-game-accent-hover transition-colors font-medium;
}

.btn-secondary {
  @apply px-4 py-2 bg-game-muted/10 text-game-text hover:bg-game-muted/20 rounded-lg transition-colors font-medium;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from .relative {
  transform: scale(0.9) translateY(10px);
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to .relative {
  transform: scale(0.9) translateY(10px);
}
</style>