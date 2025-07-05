import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Supabase Helpers - DISABLED', () => {
  it('tests are disabled as Supabase has been removed', () => {
    expect(true).toBe(true)
  })
})

/* Original Supabase tests commented out:

import type { PostgrestError } from '@supabase/supabase-js'

describe('Supabase Helpers', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('handleSupabaseError', () => {
    it('should handle PostgrestError properly', async () => {
      const { handleSupabaseError } = await import('@/utils/supabase-helpers')
      
      const error: PostgrestError = {
        message: 'Row not found',
        details: 'No rows returned',
        hint: 'Check your query',
        code: '404'
      }
      
      const result = handleSupabaseError(error)
      
      expect(result).toEqual({
        message: 'Row not found',
        code: '404',
        details: 'No rows returned',
        hint: 'Check your query'
      })
    })

    it('should handle auth errors', async () => {
      const { handleSupabaseError } = await import('@/utils/supabase-helpers')
      
      const error = new Error('Invalid login credentials')
      
      const result = handleSupabaseError(error)
      
      expect(result).toEqual({
        message: 'Invalid login credentials',
        code: 'AUTH_ERROR'
      })
    })

    it('should handle network errors', async () => {
      const { handleSupabaseError } = await import('@/utils/supabase-helpers')
      
      const error = new Error('Network request failed')
      
      const result = handleSupabaseError(error)
      
      expect(result).toEqual({
        message: 'Network request failed',
        code: 'NETWORK_ERROR'
      })
    })

    it('should handle unknown errors', async () => {
      const { handleSupabaseError } = await import('@/utils/supabase-helpers')
      
      const result = handleSupabaseError(null)
      
      expect(result).toEqual({
        message: 'An unknown error occurred',
        code: 'UNKNOWN_ERROR'
      })
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      const { isAuthenticated } = await import('@/utils/supabase-helpers')
      const { supabase } = await import('@/config/supabase')
      
      // Mock authenticated session
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            access_token: 'token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'refresh',
            user: {
              id: 'user-id',
              email: 'test@example.com',
              app_metadata: {},
              user_metadata: {},
              aud: 'authenticated',
              created_at: new Date().toISOString()
            }
          }
        },
        error: null
      })
      
      const result = await isAuthenticated()
      expect(result).toBe(true)
    })

    it('should return false when user is not authenticated', async () => {
      const { isAuthenticated } = await import('@/utils/supabase-helpers')
      const { supabase } = await import('@/config/supabase')
      
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null
      })
      
      const result = await isAuthenticated()
      expect(result).toBe(false)
    })

    it('should return false on error', async () => {
      const { isAuthenticated } = await import('@/utils/supabase-helpers')
      const { supabase } = await import('@/config/supabase')
      
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: new Error('Auth error')
      })
      
      const result = await isAuthenticated()
      expect(result).toBe(false)
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      const { getCurrentUser } = await import('@/utils/supabase-helpers')
      const { supabase } = await import('@/config/supabase')
      
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      }
      
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      
      const user = await getCurrentUser()
      expect(user).toEqual(mockUser)
    })

    it('should return null when not authenticated', async () => {
      const { getCurrentUser } = await import('@/utils/supabase-helpers')
      const { supabase } = await import('@/config/supabase')
      
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: null },
        error: null
      })
      
      const user = await getCurrentUser()
      expect(user).toBeNull()
    })

    it('should throw error on failure', async () => {
      const { getCurrentUser } = await import('@/utils/supabase-helpers')
      const { supabase } = await import('@/config/supabase')
      
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: null },
        error: new Error('Failed to get user')
      })
      
      await expect(getCurrentUser()).rejects.toThrow('Failed to get user')
    })
  })

  describe('withRetry', () => {
    it('should retry failed operations', async () => {
      const { withRetry } = await import('@/utils/supabase-helpers')
      
      let attempts = 0
      const operation = vi.fn().mockImplementation(async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Temporary failure')
        }
        return { data: 'success', error: null }
      })
      
      const result = await withRetry(operation, 3, 100)
      
      expect(attempts).toBe(3)
      expect(result.data).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should fail after max retries', async () => {
      const { withRetry } = await import('@/utils/supabase-helpers')
      
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'))
      
      await expect(withRetry(operation, 3, 100)).rejects.toThrow('Persistent failure')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should not retry on non-retryable errors', async () => {
      const { withRetry } = await import('@/utils/supabase-helpers')
      
      const operation = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Unique constraint violation' }
      })
      
      const result = await withRetry(operation, 3, 100)
      
      expect(operation).toHaveBeenCalledTimes(1)
      expect(result.error).toBeDefined()
      expect(result.error.code).toBe('23505')
    })
  })
})

*/