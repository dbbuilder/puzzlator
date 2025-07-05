// Supabase imports disabled - using custom auth instead
// import { PostgrestError, AuthError } from '@supabase/supabase-js'
// import { supabase } from '@/config/supabase'

// Temporary type definitions to prevent errors
type PostgrestError = any
type AuthError = any

// Error handling types
export interface FormattedError {
  message: string
  code: string
  details?: string
  hint?: string
}

// Handle different types of Supabase errors
export function handleSupabaseError(error: unknown): FormattedError {
  // Handle PostgrestError
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError
    return {
      message: pgError.message,
      code: pgError.code,
      details: pgError.details,
      hint: pgError.hint
    }
  }

  // Handle AuthError
  if (error instanceof Error) {
    if (error.message.includes('auth') || error.message.includes('login') || error.message.includes('credentials')) {
      return {
        message: error.message,
        code: 'AUTH_ERROR'
      }
    }

    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return {
        message: error.message,
        code: 'NETWORK_ERROR'
      }
    }

    return {
      message: error.message,
      code: 'UNKNOWN_ERROR'
    }
  }

  // Handle unknown errors
  return {
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR'
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  // Supabase auth disabled - using custom auth
  return false
  /*
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return false
    }

    return !!session
  } catch {
    return false
  }
  */
}

// Get current user
export async function getCurrentUser() {
  // Supabase auth disabled - using custom auth
  return null
  /*
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    throw error
  }

  return user
  */
}

// Retry configuration
interface RetryOptions {
  maxRetries: number
  delay: number
  backoff?: number
}

// Non-retryable error codes
const NON_RETRYABLE_CODES = new Set([
  '23505', // unique_violation
  '23503', // foreign_key_violation
  '23502', // not_null_violation
  '23514', // check_violation
  '22P02', // invalid_text_representation
  'PGRST301', // JWT expired
  'PGRST302', // JWT invalid
])

// Generic retry wrapper for Supabase operations
export async function withRetry<T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | AuthError | null }>,
  maxRetries = 3,
  delay = 1000,
  backoff = 2
): Promise<{ data: T | null; error: PostgrestError | AuthError | null }> {
  let lastError: PostgrestError | AuthError | null = null
  let currentDelay = delay

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await operation()
      
      // If successful or non-retryable error, return immediately
      if (!result.error || (result.error.code && NON_RETRYABLE_CODES.has(result.error.code))) {
        return result
      }

      lastError = result.error

      // Don't retry on last attempt
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, currentDelay))
        currentDelay *= backoff
      }
    } catch (error) {
      // Handle thrown errors (network issues, etc.)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, currentDelay))
        currentDelay *= backoff
      } else {
        throw error
      }
    }
  }

  return { data: null, error: lastError }
}