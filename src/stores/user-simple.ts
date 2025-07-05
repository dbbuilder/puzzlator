import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  total_score: number
  puzzles_completed: number
  puzzles_attempted: number
  total_play_time: number
  preferred_difficulty: string
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  code: string
  name: string
  description: string
  points: number
  icon_url: string | null
  category: string
  unlocked_at: string | null
}

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
      // For production without API, create a simple user profile
      const userId = `user_${username}_${Date.now()}`
      const profile: UserProfile = {
        id: userId,
        username: username,
        display_name: username,
        avatar_url: null,
        bio: null,
        total_score: 0,
        puzzles_completed: 0,
        puzzles_attempted: 0,
        total_play_time: 0,
        preferred_difficulty: 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Store in localStorage for persistence
      localStorage.setItem('puzzlator_user', JSON.stringify(profile))
      
      currentUserId.value = userId
      userProfile.value = profile
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    currentUserId.value = null
    userProfile.value = null
    achievements.value = []
    localStorage.removeItem('puzzlator_user')
  }

  async function loadAchievements() {
    // Placeholder for achievements
    achievements.value = []
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!userProfile.value) return { success: false }
    
    userProfile.value = { ...userProfile.value, ...updates }
    localStorage.setItem('puzzlator_user', JSON.stringify(userProfile.value))
    
    return { success: true }
  }

  // Load user from localStorage on init
  const savedUser = localStorage.getItem('puzzlator_user')
  if (savedUser) {
    try {
      const profile = JSON.parse(savedUser) as UserProfile
      currentUserId.value = profile.id
      userProfile.value = profile
    } catch (e) {
      // Invalid data, ignore
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
    loadAchievements,
    updateProfile,
    hasAchievement
  }
})