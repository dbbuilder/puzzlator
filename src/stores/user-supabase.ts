import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/config/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Tables } from '@/config/supabase'

type UserProfile = Tables<'user_profiles'>
type Achievement = Tables<'achievements'>
type UserAchievement = Tables<'user_achievements'> & {
  achievement?: Achievement
}

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const userProfile = ref<UserProfile | null>(null)
  const achievements = ref<UserAchievement[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isLoggedIn = computed(() => !!user.value)
  const isAuthenticated = computed(() => !!user.value)
  const currentUser = computed(() => userProfile.value)
  const currentUserId = computed(() => user.value?.id || null)
  const displayName = computed(() => 
    userProfile.value?.display_name || 
    userProfile.value?.username || 
    user.value?.email?.split('@')[0] || 
    'Guest'
  )
  const totalScore = computed(() => userProfile.value?.total_score || 0)
  const completionRate = computed(() => {
    if (!userProfile.value || userProfile.value.puzzles_attempted === 0) return 0
    return Math.round((userProfile.value.puzzles_completed / userProfile.value.puzzles_attempted) * 100)
  })

  // Initialize auth listener
  async function initialize() {
    if (!supabase) {
      console.warn('User store: Supabase not configured')
      return
    }

    try {
      // Get initial session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
        await loadUserProfile()
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        session.value = newSession
        user.value = newSession?.user || null
        
        if (newSession?.user) {
          await loadUserProfile()
        } else {
          userProfile.value = null
          achievements.value = []
        }
      })
    } catch (err) {
      console.error('Failed to initialize auth:', err)
    }
  }

  // Load user profile from database
  async function loadUserProfile() {
    if (!user.value || !supabase) return

    try {
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (profileError) {
        // Profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          await createUserProfile()
        } else {
          throw profileError
        }
      } else {
        userProfile.value = data
      }

      await loadAchievements()
    } catch (err) {
      console.error('Failed to load profile:', err)
      error.value = 'Failed to load user profile'
    }
  }

  // Create user profile
  async function createUserProfile() {
    if (!user.value || !supabase) return

    const username = user.value.email?.split('@')[0] || `user_${Date.now()}`
    
    const { data, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.value.id,
        username,
        display_name: username,
        email: user.value.email
      })
      .select()
      .single()

    if (createError) throw createError
    userProfile.value = data
  }

  // Authentication methods
  async function login(email: string, password: string) {
    if (!supabase) {
      error.value = 'Authentication not available'
      return { success: false, error: error.value }
    }

    isLoading.value = true
    error.value = null

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function signup(email: string, password: string, username?: string) {
    if (!supabase) {
      error.value = 'Authentication not available'
      return { success: false, error: error.value }
    }

    isLoading.value = true
    error.value = null

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      })

      if (authError) throw authError

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Signup failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function loginWithProvider(provider: 'google' | 'github') {
    if (!supabase) {
      error.value = 'Authentication not available'
      return { success: false, error: error.value }
    }

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) throw authError
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'OAuth login failed'
      return { success: false, error: error.value }
    }
  }

  async function logout() {
    if (!supabase) {
      // Just clear local state
      user.value = null
      session.value = null
      userProfile.value = null
      achievements.value = []
      return
    }

    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError

      user.value = null
      session.value = null
      userProfile.value = null
      achievements.value = []
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  // Profile management
  async function updateProfile(updates: Partial<UserProfile>) {
    if (!user.value || !userProfile.value || !supabase) return { success: false }

    try {
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.value.id)
        .select()
        .single()

      if (updateError) throw updateError

      userProfile.value = data
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Profile update failed'
      return { success: false, error: error.value }
    }
  }

  // Achievements
  async function loadAchievements() {
    if (!user.value || !supabase) return

    try {
      const { data, error: achError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.value.id)

      if (achError) throw achError

      achievements.value = data || []
    } catch (err) {
      console.error('Failed to load achievements:', err)
    }
  }

  function hasAchievement(code: string): boolean {
    return achievements.value.some(ua => 
      ua.achievement && ua.achievement.code === code
    )
  }

  // Game statistics update
  async function updateGameStats(stats: {
    puzzlesCompleted?: number
    puzzlesAttempted?: number
    totalScore?: number
    totalPlayTime?: number
  }) {
    if (!user.value || !userProfile.value) return

    try {
      const updates: Partial<UserProfile> = {}
      
      if (stats.puzzlesCompleted !== undefined) {
        updates.puzzles_completed = (userProfile.value.puzzles_completed || 0) + stats.puzzlesCompleted
      }
      if (stats.puzzlesAttempted !== undefined) {
        updates.puzzles_attempted = (userProfile.value.puzzles_attempted || 0) + stats.puzzlesAttempted
      }
      if (stats.totalScore !== undefined) {
        updates.total_score = (userProfile.value.total_score || 0) + stats.totalScore
      }
      if (stats.totalPlayTime !== undefined) {
        updates.total_play_time = (userProfile.value.total_play_time || 0) + stats.totalPlayTime
      }

      await updateProfile(updates)
    } catch (err) {
      console.error('Failed to update game stats:', err)
    }
  }

  // Initialize on store creation
  initialize()

  // Computed stats for components
  const stats = computed(() => ({
    puzzlesCompleted: userProfile.value?.puzzles_completed || 0,
    puzzlesAttempted: userProfile.value?.puzzles_attempted || 0,
    totalScore: userProfile.value?.total_score || 0,
    totalPlayTime: userProfile.value?.total_play_time || 0
  }))

  // Alias for compatibility
  const loadStats = loadUserProfile

  return {
    // State
    user,
    session,
    userProfile,
    currentUserId,
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
    stats,
    
    // Actions
    initialize,
    login,
    signup,
    loginWithProvider,
    logout,
    loadAchievements,
    loadStats,
    updateProfile,
    hasAchievement,
    updateGameStats
  }
})