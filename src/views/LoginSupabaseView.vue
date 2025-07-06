<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 px-4">
    <div class="w-full max-w-md">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-4">
          <span class="text-white font-bold text-2xl">P</span>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">Welcome to Puzzlator</h1>
        <p class="text-gray-600 mt-2">Sign in to continue your puzzle journey</p>
      </div>

      <!-- Auth Card -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Tab Switcher -->
        <div class="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            @click="mode = 'signin'"
            :class="[
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
              mode === 'signin' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            Sign In
          </button>
          <button
            @click="mode = 'signup'"
            :class="[
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
              mode === 'signup' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            Sign Up
          </button>
        </div>

        <!-- Auth Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="you@example.com"
              autocomplete="email"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="••••••••"
              :minlength="mode === 'signup' ? 6 : undefined"
              :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
            />
          </div>

          <div v-if="mode === 'signup'">
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="coolpuzzler123"
              pattern="^[a-zA-Z0-9_-]+$"
              title="Username can only contain letters, numbers, underscores, and hyphens"
            />
          </div>

          <div v-if="mode === 'signin'" class="flex items-center justify-between">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="rememberMe"
                class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <span class="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <button
              type="button"
              @click="showResetPassword = true"
              class="text-sm text-purple-600 hover:text-purple-500"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
            <span v-else>{{ mode === 'signin' ? 'Sign In' : 'Create Account' }}</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <!-- Social Login -->
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="handleOAuthLogin('google')"
            :disabled="loading"
            class="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
              <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"/>
              <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/>
              <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
            </svg>
            Google
          </button>
          <button
            @click="handleOAuthLogin('github')"
            :disabled="loading"
            class="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>

        <!-- Magic Link Option -->
        <div class="mt-6 text-center">
          <button
            @click="showMagicLink = true"
            class="text-sm text-gray-600 hover:text-gray-900"
          >
            Prefer a magic link? <span class="text-purple-600">Send me a link</span>
          </button>
        </div>
      </div>

      <!-- Demo Mode -->
      <div class="mt-6 text-center">
        <button
          @click="handleDemoLogin"
          class="text-sm text-gray-600 hover:text-gray-900"
        >
          Just want to try? <span class="text-purple-600">Continue as guest</span>
        </button>
      </div>
      
      <!-- Version Info -->
      <div class="mt-4 text-center">
        <p class="text-xs text-gray-400">v{{ version }} • Build {{ buildTime }}</p>
      </div>
    </div>

    <!-- Password Reset Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showResetPassword" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-black bg-opacity-50" @click="showResetPassword = false"></div>
          <div class="relative bg-white rounded-xl p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold mb-4">Reset Password</h3>
            <p class="text-sm text-gray-600 mb-4">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <form @submit.prevent="handleResetPassword" class="space-y-4">
              <input
                v-model="resetEmail"
                type="email"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="you@example.com"
              />
              <div class="flex gap-3">
                <button
                  type="button"
                  @click="showResetPassword = false"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="loading"
                  class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Magic Link Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showMagicLink" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-black bg-opacity-50" @click="showMagicLink = false"></div>
          <div class="relative bg-white rounded-xl p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold mb-4">Sign in with Magic Link</h3>
            <p class="text-sm text-gray-600 mb-4">
              We'll send you a link to sign in without a password.
            </p>
            <form @submit.prevent="handleMagicLink" class="space-y-4">
              <input
                v-model="magicLinkEmail"
                type="email"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="you@example.com"
              />
              <div class="flex gap-3">
                <button
                  type="button"
                  @click="showMagicLink = false"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="loading"
                  class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Send Magic Link
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-supabase'
import { useUserStore } from '@/stores/user-supabase'
import { APP_VERSION, BUILD_NUMBER, getBuildInfo } from '@/config/version'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()

// Version info
const version = APP_VERSION
const buildTime = `#${BUILD_NUMBER} - ${getBuildInfo()}`

// Form state
const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const username = ref('')
const rememberMe = ref(false)
const loading = ref(false)

// Modal state
const showResetPassword = ref(false)
const showMagicLink = ref(false)
const resetEmail = ref('')
const magicLinkEmail = ref('')

// Handle form submission
async function handleSubmit() {
  loading.value = true

  try {
    if (mode.value === 'signin') {
      const result = await authStore.signIn(email.value, password.value)
      if (result.success) {
        router.push('/play')
      }
    } else {
      const result = await authStore.signUp(email.value, password.value, {
        username: username.value
      })
      if (result.success) {
        router.push('/play')
      }
    }
  } finally {
    loading.value = false
  }
}

// Handle OAuth login
async function handleOAuthLogin(provider: 'google' | 'github') {
  loading.value = true
  try {
    await authStore.signInWithProvider(provider)
  } finally {
    loading.value = false
  }
}

// Handle password reset
async function handleResetPassword() {
  loading.value = true
  try {
    const result = await authStore.resetPassword(resetEmail.value)
    if (result.success) {
      showResetPassword.value = false
      resetEmail.value = ''
    }
  } finally {
    loading.value = false
  }
}

// Handle magic link
async function handleMagicLink() {
  loading.value = true
  try {
    const result = await authStore.signInWithMagicLink(magicLinkEmail.value)
    if (result.success) {
      showMagicLink.value = false
      magicLinkEmail.value = ''
    }
  } finally {
    loading.value = false
  }
}

// Handle demo login
async function handleDemoLogin() {
  loading.value = true
  try {
    // Use the signInAsGuest method which handles both Supabase and demo mode
    const result = await authStore.signInAsGuest()
    
    if (result.success) {
      // Initialize user store with demo user
      await userStore.initialize()
      router.push('/play')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>