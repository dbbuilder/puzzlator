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

  // Initialize auth state
  async function initialize() {
    if (initialized.value) return

    try {
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
      toast.error('Failed to initialize authentication')
    }
  }

  // Sign up with email/password
  async function signUp(email: string, password: string, metadata?: Record<string, any>) {
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

    // Actions
    initialize,
    signUp,
    signIn,
    signInWithProvider,
    signInWithMagicLink,
    signOut,
    resetPassword,
    updatePassword,
    updateUserMetadata,
    verifyOtp
  }
})