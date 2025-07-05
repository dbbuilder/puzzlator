import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'

// Check if we're in production without a proper API
const isProductionWithoutAPI = import.meta.env.PROD && !import.meta.env.VITE_API_URL
import type { Database } from '@/types/db'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type Achievement = Database['public']['Tables']['achievements']['Row'] & { earned_at: string }

export const useUserStore = defineStore('user', () => {
  const currentUserId = ref<string | null>(null)
  const userProfile = ref<UserProfile | null>(null)
  const achievements = ref<Achievement[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => currentUserId.value !== null)
  const isAuthenticated = computed(() => currentUserId.value !== null)
  const currentUser = computed(() => userProfile.value)
  const displayName = computed(() => userProfile.value?.display_name || userProfile.value?.username || 'Guest')
  const totalScore = computed(() => userProfile.value?.total_score || 0)
  const completionRate = computed(() => {
    if (!userProfile.value || userProfile.value.puzzles_attempted === 0) return 0
    return Math.round((userProfile.value.puzzles_completed / userProfile.value.puzzles_attempted) * 100)
  })

  async function login(username: string) {
    isLoading.value = true
    error.value = null

    try {
      // Use login endpoint which handles existing users
      const requestBody = JSON.stringify({ username })
      const response = await api.request('/login', {
        method: 'POST',
        body: requestBody
      }) as any
      
      currentUserId.value = response.id
      userProfile.value = response
      
      // Load achievements
      await loadAchievements()
      
      return true
    } catch (err) {
      error.value = 'Failed to login'
      console.error('Login error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    currentUserId.value = null
    userProfile.value = null
    achievements.value = []
  }

  async function loadProfile() {
    if (!currentUserId.value) return

    isLoading.value = true
    try {
      userProfile.value = await api.getUserProfile(currentUserId.value)
    } catch (err) {
      error.value = 'Failed to load profile'
      console.error('Load profile error:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!currentUserId.value) return

    isLoading.value = true
    try {
      userProfile.value = await api.updateUserProfile(currentUserId.value, updates)
    } catch (err) {
      error.value = 'Failed to update profile'
      console.error('Update profile error:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function loadAchievements() {
    if (!currentUserId.value) return

    try {
      achievements.value = await api.getUserAchievements(currentUserId.value)
    } catch (err) {
      console.error('Load achievements error:', err)
    }
  }

  function hasAchievement(code: string): boolean {
    return achievements.value.some(a => a.code === code)
  }

  return {
    // State
    currentUserId,
    userProfile,
    achievements,
    isLoading,
    error,
    
    // Computed
    isLoggedIn,
    isAuthenticated,
    currentUser,
    displayName,
    totalScore,
    completionRate,
    
    // Actions
    login,
    logout,
    loadProfile,
    updateProfile,
    loadAchievements,
    hasAchievement
  }
})