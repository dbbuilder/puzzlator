import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// Supabase imports disabled - using custom auth instead
// import { supabase } from '@/config/supabase'
// import type { User, Session } from '@supabase/supabase-js'
import type { Tables } from '@/types/database'
import { useToast } from 'vue-toastification'

// Temporary type definitions to prevent errors
type User = any
type Session = any

export interface AuthState {
  user: User | null
  session: Session | null
  profile: Tables<'user_profiles'> | null
  initialized: boolean
  loading: boolean
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const profile = ref<Tables<'user_profiles'> | null>(null)
  const initialized = ref(false)
  const loading = ref(false)
  
  // Toast notifications
  const toast = useToast()

  // Computed
  const isAuthenticated = computed(() => !!user.value)
  const userId = computed(() => user.value?.id)
  const userEmail = computed(() => user.value?.email)
  const username = computed(() => profile.value?.username)
  const displayName = computed(() => profile.value?.display_name || username.value)

  // Actions
  async function initialize() {
    // Supabase auth disabled - using custom auth
    initialized.value = true
    loading.value = false
    
    /*
    try {
      loading.value = true
      
      // Get current session
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Failed to get session:', error)
        return
      }

      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
        await fetchProfile()
      }

      // Set up auth state listener
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        session.value = newSession
        user.value = newSession?.user || null

        if (newSession?.user) {
          await fetchProfile()
        } else {
          profile.value = null
        }
      })
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      toast.error('Failed to initialize authentication')
    } finally {
      initialized.value = true
      loading.value = false
    }
    */
  }

  async function fetchProfile() {
    // Supabase disabled - using custom auth
    return
    
    /*
    if (!user.value) return

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (error) {
        // Profile might not exist yet (new user)
        if (error.code === 'PGRST116') {
          console.log('Profile not found, will create on first update')
        } else {
          console.error('Failed to fetch profile:', error)
        }
        return
      }

      profile.value = data
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
    */
  }

  async function signUp(email: string, password: string, username: string) {
    // Supabase auth disabled - using custom auth
    toast.error('Sign up is currently disabled. Please use custom auth.')
    return { success: false, error: new Error('Supabase auth disabled') }
    
    /*
    try {
      loading.value = true

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            username,
            display_name: username,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
          })

        if (profileError) {
          console.error('Failed to create profile:', profileError)
          // Don't throw here - user is created, profile can be created later
        }

        toast.success('Account created successfully! Please check your email to verify.')
        return { success: true, user: data.user }
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      toast.error(error.message || 'Failed to create account')
      return { success: false, error }
    } finally {
      loading.value = false
    }
    */
  }

  async function signIn(email: string, password: string) {
    // Supabase auth disabled - using custom auth
    toast.error('Sign in is currently disabled. Please use custom auth.')
    return { success: false, error: new Error('Supabase auth disabled') }
    
    /*
    try {
      loading.value = true

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      toast.success('Welcome back!')
      return { success: true, user: data.user }
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast.error(error.message || 'Failed to sign in')
      return { success: false, error }
    } finally {
      loading.value = false
    }
    */
  }

  async function signOut() {
    // Supabase auth disabled - using custom auth
    user.value = null
    session.value = null
    profile.value = null
    toast.success('Signed out successfully')
    return { success: true }
    
    /*
    try {
      loading.value = true
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error

      // Clear local state
      user.value = null
      session.value = null
      profile.value = null

      toast.success('Signed out successfully')
      return { success: true }
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
      return { success: false, error }
    } finally {
      loading.value = false
    }
    */
  }

  async function updateProfile(updates: Partial<Tables<'user_profiles'>>) {
    // Supabase disabled - using custom auth
    toast.error('Profile update is currently disabled. Please use custom auth.')
    return { success: false }
    
    /*
    if (!user.value) {
      toast.error('No user logged in')
      return { success: false }
    }

    try {
      loading.value = true

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.value.id)
        .select()
        .single()

      if (error) throw error

      profile.value = data
      toast.success('Profile updated successfully')
      return { success: true, profile: data }
    } catch (error: any) {
      console.error('Update profile error:', error)
      toast.error('Failed to update profile')
      return { success: false, error }
    } finally {
      loading.value = false
    }
    */
  }

  async function resetPassword(email: string) {
    // Supabase auth disabled - using custom auth
    toast.error('Password reset is currently disabled. Please use custom auth.')
    return { success: false }
    
    /*
    try {
      loading.value = true

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      toast.success('Password reset email sent! Check your inbox.')
      return { success: true }
    } catch (error: any) {
      console.error('Reset password error:', error)
      toast.error(error.message || 'Failed to send reset email')
      return { success: false, error }
    } finally {
      loading.value = false
    }
    */
  }

  return {
    // State
    user,
    session,
    profile,
    initialized,
    loading,

    // Computed
    isAuthenticated,
    userId,
    userEmail,
    username,
    displayName,

    // Actions
    initialize,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    fetchProfile
  }
})