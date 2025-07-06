import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.generated'


// Validate environment variables
function validateEnvironment(): { url: string; anonKey: string } {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error('Missing required environment variable: VITE_SUPABASE_URL')
  }

  if (!anonKey) {
    throw new Error('Missing required environment variable: VITE_SUPABASE_ANON_KEY')
  }

  // Validate URL format
  try {
    const urlObj = new URL(url)
    if (!urlObj.hostname.includes('supabase')) {
      throw new Error('Invalid Supabase URL format')
    }
  } catch {
    throw new Error('Invalid Supabase URL format')
  }

  return { url, anonKey }
}

// Create Supabase client factory
export function createSupabaseClient(): SupabaseClient<Database> {
  const { url, anonKey } = validateEnvironment()

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'x-application-name': 'puzzlator'
      }
    }
  })
}

// Singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null

// Export singleton client
export const supabase = (() => {
  try {
    if (!supabaseInstance) {
      supabaseInstance = createSupabaseClient()
    }
    return supabaseInstance
  } catch (error) {
    console.warn('Supabase not configured:', error)
    return null as any
  }
})()

// Export types for convenience
export type { Database } from '@/types/database.generated'
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T]

export default supabase