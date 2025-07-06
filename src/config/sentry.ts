import * as Sentry from '@sentry/vue'
import { BrowserTracing } from '@sentry/tracing'
import type { App } from 'vue'
import type { Router } from 'vue-router'

// Environment configuration
const isDevelopment = import.meta.env.DEV
const environment = import.meta.env.MODE

// Sentry DSN - should be set in environment variables
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

export interface SentryConfig {
  app: App
  router?: Router
  dsn?: string
  environment?: string
  enabled?: boolean
}

/**
 * Initialize Sentry error tracking
 */
export function initSentry({ app, router, dsn, environment: env, enabled = true }: SentryConfig): void {
  // Skip initialization if disabled or no DSN provided
  if (!enabled || (!dsn && !SENTRY_DSN)) {
    if (isDevelopment) {
      console.log('Sentry: Skipping initialization (no DSN provided)')
    }
    return
  }

  try {
    Sentry.init({
      app,
      dsn: dsn || SENTRY_DSN,
      environment: env || environment,
      
      // Integration settings
      integrations: [
        new BrowserTracing({
          routingInstrumentation: router ? Sentry.vueRouterInstrumentation(router) : undefined,
          tracingOrigins: ['localhost', /^\//],
        }),
      ],
      
      // Performance monitoring
      tracesSampleRate: isDevelopment ? 1.0 : 0.1, // 10% in production
      
      // Release tracking
      release: __APP_VERSION__,
      
      // Error filtering
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        
        // Network errors
        'Network request failed',
        'Failed to fetch',
        'NetworkError',
        'Load failed',
        
        // User cancellations
        'AbortError',
        'Cancelled',
        
        // Safari specific
        'Non-Error exception captured',
      ],
      
      // Don't send events in development by default
      beforeSend(event, hint) {
        // Filter out development errors unless explicitly enabled
        if (isDevelopment && !import.meta.env.VITE_SENTRY_DEBUG) {
          console.error('Sentry: Would send event', event, hint)
          return null
        }
        
        // Filter out certain types of errors
        const error = hint.originalException
        
        // Don't report user input validation errors
        if (error && error.message && error.message.includes('validation')) {
          return null
        }
        
        // Don't report expected game errors
        if (error && error.message && (
          error.message.includes('Puzzle already completed') ||
          error.message.includes('Game session expired')
        )) {
          return null
        }
        
        return event
      },
      
      // User context
      initialScope: {
        tags: {
          component: 'puzzlator-app',
        },
      },
    })

    if (isDevelopment) {
      console.log('Sentry: Initialized successfully')
    }
  } catch (error) {
    console.error('Failed to initialize Sentry:', error)
  }
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: { id: string; email?: string; username?: string } | null): void {
  if (!SENTRY_DSN) return
  
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    })
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Add breadcrumb for better error context
 */
export function addBreadcrumb(message: string, category: string, data?: any): void {
  if (!SENTRY_DSN) return
  
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Capture custom error with context
 */
export function captureError(error: Error, context?: Record<string, any>): void {
  if (!SENTRY_DSN) return
  
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('custom', context)
    }
    Sentry.captureException(error)
  })
}

/**
 * Capture message with level
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  if (!SENTRY_DSN) return
  
  Sentry.captureMessage(message, level)
}

/**
 * Track custom performance metric
 */
export function trackPerformance(name: string, value: number, unit: string = 'ms'): void {
  if (!SENTRY_DSN) return
  
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction()
  if (transaction) {
    transaction.setMeasurement(name, value, unit)
  }
}

/**
 * Wrap async function with error handling
 */
export function withSentry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (context) {
        addBreadcrumb(`Error in ${context}`, 'error', { args })
      }
      captureError(error as Error)
      throw error
    }
  }) as T
}