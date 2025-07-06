import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/config/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { useToast } from 'vue-toastification'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const initialized = ref(false)
  const loading = ref(false)

  // Toast notifications
  const toast = useToast()

  // Computed
  const isAuthenticated = computed(() => !!user.value)
  const userId = computed(() => user.value?.id)
  const userEmail = computed(() => user.value?.email)
  const displayName = computed(() => user.value?.user_metadata?.name || user.value?.email?.split('@')[0] || 'Guest')
  const profile = computed(() => user.value ? {
    id: user.value.id,
    username: user.value.user_metadata?.username || user.value.email?.split('@')[0] || 'guest',
    display_name: displayName.value,
    email: user.value.email,
    avatar_url: user.value.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.value.id}`
  } : null)

  // Initialize auth state
  async function initialize() {
    if (initialized.value) return

    try {
      // Check if Supabase is configured
      if (!supabase) {
        console.warn('Supabase not configured - running in demo mode')
        initialized.value = true
        return
      }

      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession
        user.value = newSession?.user || null
      })

      initialized.value = true
    } catch (error) {
      console.error('Auth initialization error:', error)
      // Don't show toast for missing config
      if (supabase) {
        toast.error('Failed to initialize authentication')
      }
    }
  }

  // Sign up with email/password
  async function signUp(email: string, password: string, metadata?: Record<string, any>) {
    if (!supabase) {
      toast.error('Authentication is not available in demo mode')
      return { success: false, error: 'Supabase not configured' }
    }

    loading.value = true

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      toast.success('Sign up successful! Please check your email to confirm.')
      return { success: true, data }
    } catch (error: any) {
      const message = error.message || 'Sign up failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  // Sign in with email/password
  async function signIn(email: string, password: string) {
    if (!supabase) {
      toast.error('Authentication is not available in demo mode')
      return { success: false, error: 'Supabase not configured' }
    }

    loading.value = true

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      toast.success('Welcome back!')
      return { success: true, data }
    } catch (error: any) {
      const message = error.message || 'Sign in failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  // Sign in with OAuth provider
  async function signInWithProvider(provider: 'google' | 'github' | 'discord') {
    if (!supabase) {
      toast.error('Authentication is not available in demo mode')
      return { success: false, error: 'Supabase not configured' }
    }

    loading.value = true

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: provider === 'github' ? 'read:user user:email' : undefined
        }
      })

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      const message = error.message || 'OAuth sign in failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  // Sign in with magic link
  async function signInWithMagicLink(email: string) {
    if (!supabase) {
      toast.error('Authentication is not available in demo mode')
      return { success: false, error: 'Supabase not configured' }
    }

    loading.value = true

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      toast.success('Magic link sent! Check your email.')
      return { success: true, data }
    } catch (error: any) {
      const message = error.message || 'Failed to send magic link'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  // Sign out
  async function signOut() {
    if (!supabase) {
      // Just clear local state in demo mode
      user.value = null
      session.value = null
      toast.success('Signed out successfully')
      return { success: true }
    }

    loading.value = true

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      toast.success('Signed out successfully')
      return { success: true }
    } catch (error: any) {
      const message = error.message || 'Sign out failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  // Reset password
  async function resetPassword(email: string) {
    if (!supabase) {
      toast.error('Password reset is not available in demo mode')
      return { success: false, error: 'Supabase not configured' }
    }

    loading.value = true

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      toast.success('Password reset email sent!')
      return { success: true, data }
    } catch (error: any) {
      const message = error.message || 'Failed to send reset email'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  // Update password
  async function updatePassword(newPassword: string) {
    if (!supabase) {
      toast.error('Password update is not available in demo mode')
      return { success: false, error: 'Supabase not configured' }
    }

    loading.value = true

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success('Password updated successfully')
      return { success: true, data }
    } catch (error: any) {
      const message = error.message || 'Failed to update password'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  // Update user metadata
  async function updateUserMetadata(metadata: Record<string, any>) {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' }
    }

    loading.value = true

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata
      })

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      const message = error.message || 'Failed to update user data'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  // Verify OTP
  async function verifyOtp(email: string, token: string) {
    if (!supabase) {
      toast.error('Email verification is not available in demo mode')
      return { success: false, error: 'Supabase not configured' }
    }

    loading.value = true

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'magiclink'
      })

      if (error) throw error

      toast.success('Email verified successfully!')
      return { success: true, data }
    } catch (error: any) {
      const message = error.message || 'Failed to verify email'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  // Demo login (for when Supabase is not configured)
  async function signInAsGuest() {
    if (supabase) {
      // If Supabase is configured, create a temporary account
      try {
        const timestamp = Date.now()
        const guestEmail = `guest_${timestamp}@puzzlator.com`
        const guestPassword = `Guest_${timestamp}_Pass!`
        
        // Try to sign up as a new guest user
        const { data, error } = await supabase.auth.signUp({
          email: guestEmail,
          password: guestPassword,
          options: {
            data: {
              is_guest: true,
              username: `guest_${timestamp}`
            }
          }
        })
        
        if (error) throw error
        
        // Auto sign in after signup
        if (data.user && !data.session) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: guestEmail,
            password: guestPassword
          })
          if (signInError) throw signInError
          toast.success('Welcome! Playing as guest')
          return { success: true, data: signInData }
        }
        
        toast.success('Welcome! Playing as guest')
        return { success: true, data }
      } catch (error: any) {
        console.error('Guest sign in error:', error)
        // Fallback to local demo mode
        const demoUser = {
          id: 'demo-user-' + Date.now(),
          email: 'demo@puzzlator.com',
          app_metadata: {},
          user_metadata: { name: 'Demo User' },
          aud: 'authenticated',
          created_at: new Date().toISOString()
        }
        user.value = demoUser as any
        session.value = {
          access_token: 'demo-token',
          refresh_token: 'demo-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: demoUser
        } as any
        toast.success('Welcome to demo mode!')
        return { success: true, data: { user: demoUser, session: session.value } }
      }
    } else {
      // Demo mode without Supabase
      const demoUser = {
        id: 'demo-user-' + Date.now(),
        email: 'demo@puzzlator.com',
        app_metadata: {},
        user_metadata: { name: 'Demo User' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
      }
      user.value = demoUser as any
      session.value = {
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: demoUser
      } as any
      toast.success('Welcome to demo mode!')
      return { success: true, data: { user: demoUser, session: session.value } }
    }
  }

  return {
    // State
    user,
    session,
    initialized,
    loading,

    // Computed
    isAuthenticated,
    userId,
    userEmail,
    displayName,
    profile,

    // Actions
    initialize,
    signUp,
    signIn,
    signInWithProvider,
    signInWithMagicLink,
    signInAsGuest,
    signOut,
    resetPassword,
    updatePassword,
    updateUserMetadata,
    verifyOtp
  }
})