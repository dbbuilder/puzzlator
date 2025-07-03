<template>
  <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-game-text mb-2">Welcome Back</h1>
        <p class="text-game-muted">Sign in to continue your puzzle journey</p>
      </div>
      
      <div class="bg-game-surface rounded-xl p-8 shadow-xl">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Email field -->
          <div>
            <label for="email" class="block text-sm font-medium text-game-text mb-2">
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
            <label for="password" class="block text-sm font-medium text-game-text mb-2">
              Password
            </label>
            <input 
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="input-field"
            >
          </div>
          
          <!-- Remember me & forgot password -->
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2">
              <input 
                v-model="rememberMe"
                type="checkbox"
                class="w-4 h-4 text-game-accent bg-game-background border-game-border rounded 
                       focus:ring-game-accent focus:ring-2"
              >
              <span class="text-sm text-game-muted">Remember me</span>
            </label>
            
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
              Signing in...
            </span>
            <span v-else>Sign In</span>
          </button>
        </form>
        
        <!-- Divider -->
        <div class="flex items-center gap-4 my-6">
          <div class="flex-1 h-px bg-game-border"></div>
          <span class="text-sm text-game-muted">or</span>
          <div class="flex-1 h-px bg-game-border"></div>
        </div>
        
        <!-- Social auth -->
        <div class="space-y-3">
          <button 
            @click="handleGoogleAuth"
            class="social-button"
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
            class="social-button"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>
        
        <!-- Sign up link -->
        <p class="text-center text-sm text-game-muted mt-6">
          Don't have an account? 
          <RouterLink 
            to="/signup"
            class="text-game-accent hover:text-game-accent-hover font-medium transition-colors"
          >
            Sign up
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// Form data
const email = ref('')
const password = ref('')
const rememberMe = ref(false)

// Methods
async function handleSubmit() {
  const { success } = await authStore.signIn(email.value, password.value)
  if (success) {
    // Check for redirect in query params
    const redirect = router.currentRoute.value.query.redirect as string
    router.push(redirect || '/')
  }
}

async function handleForgotPassword() {
  if (!email.value) {
    appStore.showWarning('Please enter your email address first')
    return
  }
  
  const { success } = await authStore.resetPassword(email.value)
  if (success) {
    email.value = ''
    password.value = ''
  }
}

async function handleGoogleAuth() {
  appStore.showInfo('Google authentication coming soon!')
}

async function handleGithubAuth() {
  appStore.showInfo('GitHub authentication coming soon!')
}
</script>

<style scoped>
.input-field {
  @apply w-full px-4 py-3 bg-game-background border border-game-border rounded-lg 
         text-game-text placeholder-game-muted
         focus:border-game-accent focus:outline-none focus:ring-2 focus:ring-game-accent/20
         transition-colors;
}

.btn-primary {
  @apply px-4 py-3 bg-game-accent text-white rounded-lg hover:bg-game-accent-hover 
         transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed;
}

.social-button {
  @apply w-full flex items-center justify-center gap-3 px-4 py-3 
         border border-game-border rounded-lg hover:bg-game-muted/10 
         transition-colors font-medium;
}
</style>