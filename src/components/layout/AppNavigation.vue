<template>
  <nav class="bg-white border-b border-gray-200 shadow-sm">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo and brand -->
        <RouterLink to="/" class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-lg">P</span>
          </div>
          <span class="text-xl font-semibold text-gray-800">Puzzlator</span>
        </RouterLink>

        <!-- Desktop navigation -->
        <div class="hidden md:flex items-center space-x-6">
          <RouterLink 
            to="/" 
            class="nav-link"
            active-class="nav-link-active"
          >
            Home
          </RouterLink>
          
          <RouterLink 
            v-if="userStore.isAuthenticated"
            to="/play" 
            class="nav-link"
            active-class="nav-link-active"
          >
            Play
          </RouterLink>
          
          <RouterLink 
            to="/leaderboard" 
            class="nav-link"
            active-class="nav-link-active"
          >
            Leaderboard
          </RouterLink>
        </div>

        <!-- User menu -->
        <div class="flex items-center space-x-4">
          <template v-if="userStore.isAuthenticated">
            <RouterLink 
              to="/profile" 
              class="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <img 
                :src="userStore.currentUser?.avatar_url || '/assets/images/default-avatar.png'"
                :alt="userStore.currentUser?.username || 'User'"
                class="w-8 h-8 rounded-full"
              >
              <span class="hidden md:block text-sm font-medium">
                {{ userStore.currentUser?.username || 'User' }}
              </span>
            </RouterLink>
            
            <button 
              @click="handleSignOut"
              class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign Out
            </button>
          </template>
          
          <template v-else>
            <button 
              @click="router.push('/login')"
              class="btn-secondary text-sm"
            >
              Log In
            </button>
            
            <button 
              @click="router.push('/login')"
              class="btn-primary text-sm"
            >
              Sign Up
            </button>
          </template>
        </div>

        <!-- Mobile menu toggle -->
        <button 
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              v-if="!mobileMenuOpen"
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path 
              v-else
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Mobile menu -->
      <div 
        v-if="mobileMenuOpen" 
        class="md:hidden border-t border-game-border py-4"
      >
        <div class="flex flex-col space-y-2">
          <RouterLink 
            to="/" 
            class="mobile-nav-link"
            active-class="mobile-nav-link-active"
            @click="mobileMenuOpen = false"
          >
            Home
          </RouterLink>
          
          <RouterLink 
            v-if="userStore.isAuthenticated"
            to="/play" 
            class="mobile-nav-link"
            active-class="mobile-nav-link-active"
            @click="mobileMenuOpen = false"
          >
            Play
          </RouterLink>
          
          <RouterLink 
            to="/leaderboard" 
            class="mobile-nav-link"
            active-class="mobile-nav-link-active"
            @click="mobileMenuOpen = false"
          >
            Leaderboard
          </RouterLink>
          
          <RouterLink 
            v-if="userStore.isAuthenticated"
            to="/profile" 
            class="mobile-nav-link"
            active-class="mobile-nav-link-active"
            @click="mobileMenuOpen = false"
          >
            Profile
          </RouterLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
// import { useAppStore } from '@/stores/app'

const router = useRouter()
const userStore = useUserStore()
// const appStore = useAppStore()

const mobileMenuOpen = ref(false)

async function handleSignOut() {
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.nav-link {
  @apply text-gray-600 hover:text-gray-900 transition-colors font-medium;
}

.nav-link-active {
  @apply text-purple-600;
}

.mobile-nav-link {
  @apply px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all font-medium;
}

.mobile-nav-link-active {
  @apply bg-purple-100 text-purple-600;
}

.btn-primary {
  @apply px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium;
}

.btn-secondary {
  @apply px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium;
}
</style>