import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

// Test the Supabase configuration module
describe('Supabase Configuration', () => {
  let supabase: SupabaseClient

  beforeEach(() => {
    // Reset environment variables
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  describe('Environment Configuration', () => {
    it('should throw error if VITE_SUPABASE_URL is not set', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', '')
      
      await expect(async () => {
        const { createSupabaseClient } = await import('@/config/supabase')
        createSupabaseClient()
      }).rejects.toThrow('Missing required environment variable: VITE_SUPABASE_URL')
    })

    it('should throw error if VITE_SUPABASE_ANON_KEY is not set', async () => {
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
      
      await expect(async () => {
        const { createSupabaseClient } = await import('@/config/supabase')
        createSupabaseClient()
      }).rejects.toThrow('Missing required environment variable: VITE_SUPABASE_ANON_KEY')
    })

    it('should validate Supabase URL format', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'invalid-url')
      
      await expect(async () => {
        const { createSupabaseClient } = await import('@/config/supabase')
        createSupabaseClient()
      }).rejects.toThrow('Invalid Supabase URL format')
    })
  })

  describe('Client Creation', () => {
    it('should create a Supabase client with valid configuration', async () => {
      const { createSupabaseClient } = await import('@/config/supabase')
      const client = createSupabaseClient()
      
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(client.from).toBeDefined()
      expect(client.storage).toBeDefined()
    })

    it('should create a singleton Supabase client', async () => {
      const { supabase: client1 } = await import('@/config/supabase')
      const { supabase: client2 } = await import('@/config/supabase')
      
      expect(client1).toBe(client2)
    })

    it('should configure client with proper auth options', async () => {
      const { createSupabaseClient } = await import('@/config/supabase')
      const client = createSupabaseClient()
      
      // Test auth persistence
      const { data: session } = await client.auth.getSession()
      expect(session).toBeDefined()
    })
  })

  describe('Database Types', () => {
    it('should export database types from generated types file', async () => {
      const types = await import('@/types/database')
      
      expect(types.Database).toBeDefined()
      expect(types.Database.public).toBeDefined()
      expect(types.Database.public.Tables).toBeDefined()
    })

    it('should have user_profiles table type', async () => {
      const { Database } = await import('@/types/database')
      
      expect(Database.public.Tables.user_profiles).toBeDefined()
      expect(Database.public.Tables.user_profiles.Row).toBeDefined()
      expect(Database.public.Tables.user_profiles.Insert).toBeDefined()
      expect(Database.public.Tables.user_profiles.Update).toBeDefined()
    })

    it('should have puzzles table type', async () => {
      const { Database } = await import('@/types/database')
      
      expect(Database.public.Tables.puzzles).toBeDefined()
      expect(Database.public.Tables.puzzles.Row).toBeDefined()
    })

    it('should have game_sessions table type', async () => {
      const { Database } = await import('@/types/database')
      
      expect(Database.public.Tables.game_sessions).toBeDefined()
      expect(Database.public.Tables.game_sessions.Row).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const { createSupabaseClient } = await import('@/config/supabase')
      const client = createSupabaseClient()
      
      // Mock network error
      vi.spyOn(client.from('test'), 'select').mockRejectedValue(
        new Error('Network error')
      )
      
      const { data, error } = await client.from('test').select('*')
      
      expect(error).toBeDefined()
      expect(error?.message).toContain('Network error')
      expect(data).toBeNull()
    })

    it('should handle authentication errors', async () => {
      const { createSupabaseClient } = await import('@/config/supabase')
      const client = createSupabaseClient()
      
      const { data, error } = await client.auth.signInWithPassword({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      })
      
      expect(error).toBeDefined()
      expect(data.user).toBeNull()
      expect(data.session).toBeNull()
    })
  })

  describe('Real-time Configuration', () => {
    it('should support real-time subscriptions', async () => {
      const { createSupabaseClient } = await import('@/config/supabase')
      const client = createSupabaseClient()
      
      const channel = client.channel('test-channel')
      
      expect(channel).toBeDefined()
      expect(channel.on).toBeDefined()
      expect(channel.subscribe).toBeDefined()
    })

    it('should configure real-time with proper auth', async () => {
      const { createSupabaseClient } = await import('@/config/supabase')
      const client = createSupabaseClient()
      
      const channel = client
        .channel('test-channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'puzzles'
        }, (payload) => {
          expect(payload).toBeDefined()
        })
      
      const status = await channel.subscribe()
      expect(['SUBSCRIBED', 'SUBSCRIBING', 'UNSUBSCRIBED']).toContain(status)
    })
  })
})