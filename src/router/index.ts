import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Define routes with webpackChunkName for better debugging
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/index.html',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import(/* webpackChunkName: "login" */ '@/views/LoginSupabaseView.vue'),
    meta: {
      title: 'Login',
      requiresAuth: false
    }
  },
  {
    path: '/play',
    name: 'play',
    component: () => import(/* webpackChunkName: "game-selection" */ '@/components/game/GameSelection.vue'),
    meta: {
      title: 'Select Game',
      requiresAuth: true,
      prefetch: true // Prefetch game selection after login
    }
  },
  {
    path: '/play/:puzzleId',
    name: 'game',
    component: () => import(/* webpackChunkName: "game-view" */ '@/views/GameView.vue'),
    meta: {
      title: 'Play',
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import(/* webpackChunkName: "profile" */ '@/views/ProfileView.vue'),
    meta: {
      title: 'Profile',
      requiresAuth: true
    }
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    component: () => import(/* webpackChunkName: "leaderboard" */ '@/views/LeaderboardView.vue'),
    meta: {
      title: 'Leaderboard',
      requiresAuth: false
    }
  },
  {
    path: '/achievements',
    name: 'achievements',
    component: () => import(/* webpackChunkName: "achievements" */ '@/views/AchievementsView.vue'),
    meta: {
      title: 'Achievements',
      requiresAuth: false
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import(/* webpackChunkName: "settings" */ '@/views/SettingsView.vue'),
    meta: {
      title: 'Settings',
      requiresAuth: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import(/* webpackChunkName: "not-found" */ '@/views/NotFoundView.vue'),
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

// After navigation, prefetch likely next routes
router.afterEach((to) => {
  // Prefetch strategies based on current route
  if (to.name === 'login' && router.hasRoute('play')) {
    // After login, user likely goes to game selection
    router.resolve({ name: 'play' }).matched.forEach(route => {
      if (route.components?.default && typeof route.components.default === 'function') {
        (route.components.default as () => Promise<any>)()
      }
    })
  } else if (to.name === 'play') {
    // On game selection, prefetch game view since user will select a game
    router.resolve({ name: 'game', params: { puzzleId: 'placeholder' } }).matched.forEach(route => {
      if (route.components?.default && typeof route.components.default === 'function') {
        (route.components.default as () => Promise<any>)()
      }
    })
  }
})

export default router