<template>
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="appStore.showAuthModal" 
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
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-game-text">
              {{ isLogin ? 'Welcome Back' : 'Create Account' }}
            </h2>
            <button 
              @click="appStore.closeAuthModal"
              class="p-1 rounded-lg hover:bg-game-muted/10 transition-colors"
            >
              <svg class="w-5 h-5 text-game-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Username field (signup only) -->
            <div v-if="!isLogin">
              <label for="username" class="block text-sm font-medium text-game-text mb-1">
                Username
              </label>
              <input 
                id="username"
                v-model="username"
                type="text"
                required
                minlength="3"
                maxlength="20"
                pattern="[a-zA-Z0-9_-]+"
                placeholder="Choose a username"
                class="input-field"
              >
              <p class="text-xs text-game-muted mt-1">
                Letters, numbers, underscores, and hyphens only
              </p>
            </div>
            
            <!-- Email field -->
            <div>
              <label for="email" class="block text-sm font-medium text-game-text mb-1">
                Email
              </label>
              <input 
                id="email"
                v-model="email"
                type="email"
                required
                placeholder="your@email.com"
                class="input-field"
              >
            </div>
            
            <!-- Password field -->
            <div>
              <label for="password" class="block text-sm font-medium text-game-text mb-1">
                Password
              </label>
              <input 
                id="password"
                v-model="password"
                type="password"
                required
                minlength="6"
                placeholder="••••••••"
                class="input-field"
              >
              <p v-if="!isLogin" class="text-xs text-game-muted mt-1">
                At least 6 characters
              </p>
            </div>
            
            <!-- Forgot password link -->
            <div v-if="isLogin" class="flex justify-end">
              <button 
                type="button"
                @click="handleForgotPassword"
                class="text-sm text-game-accent hover:text-game-accent-hover transition-colors"
              >
                Forgot password?
              </button>
            </div>
            
            <!-- Submit button -->
            <button 
              type="submit"
              :disabled="authStore.loading"
              class="btn-primary w-full"
            >
              <span v-if="authStore.loading" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                {{ isLogin ? 'Signing in...' : 'Creating account...' }}
              </span>
              <span v-else>
                {{ isLogin ? 'Sign In' : 'Create Account' }}
              </span>
            </button>
          </form>
          
          <!-- Divider -->
          <div class="flex items-center gap-4 my-6">
            <div class="flex-1 h-px bg-game-border"></div>
            <span class="text-sm text-game-muted">or</span>
            <div class="flex-1 h-px bg-game-border"></div>
          </div>
          
          <!-- Social auth buttons -->
          <div class="space-y-3">
            <button 
              @click="handleGoogleAuth"
              class="w-full flex items-center justify-center gap-3 px-4 py-2 border border-game-border rounded-lg hover:bg-game-muted/10 transition-colors"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            
            <button 
              @click="handleGithubAuth"
              class="w-full flex items-center justify-center gap-3 px-4 py-2 border border-game-border rounded-lg hover:bg-game-muted/10 transition-colors"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
          </div>
          
          <!-- Toggle auth mode -->
          <p class="text-center text-sm text-game-muted mt-6">
            {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
            <button 
              type="button"
              @click="appStore.toggleAuthMode"
              class="text-game-accent hover:text-game-accent-hover font-medium transition-colors"
            >
              {{ isLogin ? 'Sign up' : 'Sign in' }}
            </button>
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// Form data
const email = ref('')
const password = ref('')
const username = ref('')

// Computed
const isLogin = computed(() => appStore.authModalMode === 'login')

// Methods
function handleBackdropClick() {
  appStore.closeAuthModal()
}

async function handleSubmit() {
  if (isLogin.value) {
    const { success } = await authStore.signIn(email.value, password.value)
    if (success) {
      appStore.closeAuthModal()
      resetForm()
      
      // Redirect to game if there was a redirect query
      const currentRoute = router.currentRoute.value
      if (currentRoute.query.redirect) {
        router.push(currentRoute.query.redirect as string)
      }
    }
  } else {
    const { success } = await authStore.signUp(email.value, password.value, { username: username.value })
    if (success) {
      appStore.closeAuthModal()
      resetForm()
    }
  }
}

async function handleForgotPassword() {
  if (!email.value) {
    appStore.showWarning('Please enter your email address first')
    return
  }
  
  const { success } = await authStore.resetPassword(email.value)
  if (success) {
    appStore.closeAuthModal()
    resetForm()
  }
}

async function handleGoogleAuth() {
  appStore.showInfo('Google authentication coming soon!')
}

async function handleGithubAuth() {
  appStore.showInfo('GitHub authentication coming soon!')
}

function resetForm() {
  email.value = ''
  password.value = ''
  username.value = ''
}
</script>

<style scoped>
.input-field {
  @apply w-full px-3 py-2 bg-game-background border border-game-border rounded-lg 
         text-game-text placeholder-game-muted
         focus:border-game-accent focus:outline-none focus:ring-2 focus:ring-game-accent/20
         transition-colors;
}

.btn-primary {
  @apply px-4 py-2 bg-game-accent text-white rounded-lg hover:bg-game-accent-hover 
         transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed;
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