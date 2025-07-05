import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Define routes
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginSupabaseView.vue'),
    meta: {
      title: 'Login',
      requiresAuth: false
    }
  },
  {
    path: '/play',
    name: 'play',
    component: () => import('@/components/game/GameSelection.vue'),
    meta: {
      title: 'Select Game',
      requiresAuth: true
    }
  },
  {
    path: '/play/:puzzleId',
    name: 'game',
    component: () => import('@/components/game/PhaserGame.vue'),
    meta: {
      title: 'Play',
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: {
      title: 'Profile',
      requiresAuth: true
    }
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    component: () => import('@/views/LeaderboardView.vue'),
    meta: {
      title: 'Leaderboard',
      requiresAuth: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: '404 - Not Found'
    }
  }
]

// Create router instance
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  // Update page title
  document.title = to.meta.title ? `${to.meta.title} | Puzzlator` : 'Puzzlator'

  // Check authentication requirements
  const requiresAuth = to.meta.requiresAuth

  // Import auth store
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()

  const isAuthenticated = authStore.isAuthenticated

  if (requiresAuth && !isAuthenticated) {
    // Redirect to login if auth is required
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router